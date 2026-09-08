import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import path from "node:path";

import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/*
 * =========================================================
 * Types
 * =========================================================
 */

/**
 * نوع transaction دیتابیس Drizzle
 *
 * این نوع از خود db استخراج می‌شود تا با
 * نسخه فعلی drizzle-orm پروژه کاملاً سازگار باشد.
 */
type DbTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

/*
 * =========================================================
 * Errors
 * =========================================================
 */

class ImageRouteError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ImageRouteError";
  }
}

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

/**
 * تبدیل اعداد فارسی و عربی به انگلیسی
 */
function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

    const persianIndex =
      persianDigits.indexOf(digit);

    if (persianIndex !== -1) {
      return String(persianIndex);
    }

    const arabicIndex =
      arabicDigits.indexOf(digit);

    if (arabicIndex !== -1) {
      return String(arabicIndex);
    }

    return digit;
  });
}

/**
 * تبدیل مقدار به عدد صحیح مثبت
 */
function toPositiveInteger(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  ) {
    return value;
  }

  if (typeof value === "string") {
    const normalized =
      normalizeDigits(value.trim());

    if (!normalized) {
      return null;
    }

    const number = Number(normalized);

    if (
      Number.isInteger(number) &&
      number > 0
    ) {
      return number;
    }
  }

  return null;
}

/**
 * دریافت تصاویر یک محصول
 * با ترتیب صحیح
 */
async function getProductImages(
  productId: number,
) {
  return db
    .select({
      id: productImages.id,
      productId:
        productImages.productId,
      image:
        productImages.image,
      sortOrder:
        productImages.sortOrder,
    })
    .from(productImages)
    .where(
      eq(
        productImages.productId,
        productId,
      ),
    )
    .orderBy(
      asc(productImages.sortOrder),
      asc(productImages.id),
    );
}

/**
 * دریافت تصاویر محصول داخل transaction
 */
async function getProductImagesFromTransaction(
  tx: DbTransaction,
  productId: number,
) {
  return tx
    .select({
      id: productImages.id,
      productId:
        productImages.productId,
      image:
        productImages.image,
      sortOrder:
        productImages.sortOrder,
    })
    .from(productImages)
    .where(
      eq(
        productImages.productId,
        productId,
      ),
    )
    .orderBy(
      asc(productImages.sortOrder),
      asc(productImages.id),
    );
}

/**
 * مرتب‌سازی مجدد تصاویر داخل transaction
 *
 * ترتیب نهایی:
 *
 * 0
 * 1
 * 2
 * 3
 * ...
 */
async function normalizeImageOrdersInTransaction(
  tx: DbTransaction,
  productId: number,
) {
  const images =
    await getProductImagesFromTransaction(
      tx,
      productId,
    );

  const now =
    new Date().toISOString();

  for (
    let index = 0;
    index < images.length;
    index += 1
  ) {
    const image = images[index];

    if (!image) {
      continue;
    }

    if (
      image.sortOrder === index
    ) {
      continue;
    }

    await tx
      .update(productImages)
      .set({
        sortOrder: index,
        updatedAt: now,
      })
      .where(
        and(
          eq(
            productImages.id,
            image.id,
          ),
          eq(
            productImages.productId,
            productId,
          ),
        ),
      );
  }

  return getProductImagesFromTransaction(
    tx,
    productId,
  );
}

/**
 * هماهنگ کردن products.image
 * با اولین تصویر گالری
 */
async function syncPrimaryImageInTransaction(
  tx: DbTransaction,
  productId: number,
) {
  const images =
    await normalizeImageOrdersInTransaction(
      tx,
      productId,
    );

  const firstImage = images[0];

  const now =
    new Date().toISOString();

  await tx
    .update(products)
    .set({
      image:
        firstImage?.image ?? null,
      updatedAt: now,
    })
    .where(
      eq(
        products.id,
        productId,
      ),
    );

  return images;
}

/**
 * استخراج نام فایل محلی
 *
 * فقط مسیرهای:
 *
 * /products/...
 *
 * قابل حذف هستند.
 */
function getLocalProductFileName(
  image: string,
): string | null {
  const value = image.trim();

  if (!value) {
    return null;
  }

  /*
   * تصاویر خارجی حذف نمی‌شوند.
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("//") ||
    value.startsWith("data:")
  ) {
    return null;
  }

  let pathname = value;

  try {
    if (value.startsWith("/")) {
      const parsed = new URL(
        value,
        "http://localhost",
      );

      pathname = parsed.pathname;
    }
  } catch {
    return null;
  }

  /*
   * فقط /products/... مجاز است.
   */
  if (
    !pathname.startsWith(
      "/products/",
    )
  ) {
    return null;
  }

  const fileName =
    pathname
      .slice("/products/".length)
      .split("/")
      .pop() ?? "";

  if (!fileName) {
    return null;
  }

  /*
   * جلوگیری از Path Traversal
   */
  if (
    fileName === "." ||
    fileName === ".." ||
    fileName.includes("\\") ||
    fileName.includes("/")
  ) {
    return null;
  }

  return fileName;
}

/**
 * حذف فایل فیزیکی تصویر
 */
async function deleteLocalImageFile(
  image: string,
): Promise<void> {
  const fileName =
    getLocalProductFileName(image);

  if (!fileName) {
    return;
  }

  const productsDirectory =
    path.resolve(
      process.cwd(),
      "public",
      "products",
    );

  const filePath =
    path.resolve(
      productsDirectory,
      fileName,
    );

  /*
   * بررسی نهایی Path Traversal
   */
  const relativePath =
    path.relative(
      productsDirectory,
      filePath,
    );

  if (
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    return;
  }

  try {
    await unlink(filePath);
  } catch (error) {
    const code =
      (
        error as {
          code?: string;
        }
      )?.code;

    /*
     * نبودن فایل مهم نیست.
     */
    if (code === "ENOENT") {
      return;
    }

    console.warn(
      "Could not delete product image file:",
      filePath,
      error,
    );
  }
}

/**
 * بررسی اینکه تصویر در محصول دیگری
 * استفاده نشده باشد.
 */
async function isImageUsedElsewhere(
  image: string,
  productId: number,
): Promise<boolean> {
  /*
   * بررسی product_images
   */
  const imageReferences =
    await db
      .select({
        productId:
          productImages.productId,
      })
      .from(productImages)
      .where(
        eq(
          productImages.image,
          image,
        ),
      );

  if (
    imageReferences.some(
      (item) =>
        item.productId !==
        productId,
    )
  ) {
    return true;
  }

  /*
   * بررسی products.image
   *
   * برای سازگاری با داده‌های قدیمی.
   */
  const productReferences =
    await db
      .select({
        id: products.id,
      })
      .from(products)
      .where(
        eq(
          products.image,
          image,
        ),
      );

  return productReferences.some(
    (item) =>
      item.id !== productId,
  );
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/admin/products/images",
)({
  server: {
    handlers: {
      /*
       * ===================================================
       * DELETE
       * ===================================================
       */

      DELETE: async ({
        request,
      }) => {
        const admin =
          await requireAdmin(request);

        if (!admin.authenticated) {
          return Response.json(
            {
              success: false,
              message:
                "برای دسترسی به این بخش باید وارد حساب شوید.",
            },
            {
              status: 401,
            },
          );
        }

        if (!admin.authorized) {
          return Response.json(
            {
              success: false,
              message:
                "شما دسترسی مدیریت ندارید.",
            },
            {
              status: 403,
            },
          );
        }

        try {
          let body: Record<
            string,
            unknown
          >;

          try {
            body =
              (await request.json()) as Record<
                string,
                unknown
              >;
          } catch {
            return Response.json(
              {
                success: false,
                message:
                  "داده ارسالی معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          const productId =
            toPositiveInteger(
              body["productId"],
            );

          const imageId =
            toPositiveInteger(
              body["imageId"],
            );

          if (!productId) {
            return Response.json(
              {
                success: false,
                message:
                  "شناسه محصول معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          if (!imageId) {
            return Response.json(
              {
                success: false,
                message:
                  "شناسه تصویر معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * تمام تغییرات دیتابیس
           * داخل transaction
           */
          const result =
            await db.transaction(
              async (tx) => {
                const productResult =
                  await tx
                    .select({
                      id: products.id,
                    })
                    .from(products)
                    .where(
                      eq(
                        products.id,
                        productId,
                      ),
                    )
                    .limit(1);

                if (
                  !productResult[0]
                ) {
                  throw new ImageRouteError(
                    "PRODUCT_NOT_FOUND",
                    "محصول پیدا نشد.",
                    404,
                  );
                }

                const imageResult =
                  await tx
                    .select({
                      id:
                        productImages.id,
                      productId:
                        productImages.productId,
                      image:
                        productImages.image,
                      sortOrder:
                        productImages.sortOrder,
                    })
                    .from(
                      productImages,
                    )
                    .where(
                      and(
                        eq(
                          productImages.id,
                          imageId,
                        ),
                        eq(
                          productImages.productId,
                          productId,
                        ),
                      ),
                    )
                    .limit(1);

                const image =
                  imageResult[0];

                if (!image) {
                  throw new ImageRouteError(
                    "IMAGE_NOT_FOUND",
                    "تصویر موردنظر پیدا نشد.",
                    404,
                  );
                }

                /*
                 * حذف رکورد تصویر
                 */
                await tx
                  .delete(productImages)
                  .where(
                    and(
                      eq(
                        productImages.id,
                        imageId,
                      ),
                      eq(
                        productImages.productId,
                        productId,
                      ),
                    ),
                  );

                /*
                 * مرتب‌سازی و هماهنگ‌سازی
                 * تصویر اصلی
                 */
                const remainingImages =
                  await syncPrimaryImageInTransaction(
                    tx,
                    productId,
                  );

                return {
                  deletedImage: {
                    id: image.id,
                    image: image.image,
                  },
                  deletedImagePath:
                    image.image,
                  images:
                    remainingImages,
                  primaryImage:
                    remainingImages[0]
                      ?.image ?? null,
                };
              },
            );

          /*
           * فایل فیزیکی فقط بعد از
           * موفقیت transaction حذف می‌شود.
           */
          const usedElsewhere =
            await isImageUsedElsewhere(
              result.deletedImagePath,
              productId,
            );

          if (!usedElsewhere) {
            await deleteLocalImageFile(
              result.deletedImagePath,
            );
          }

          return Response.json({
            success: true,
            deletedImage:
              result.deletedImage,
            primaryImage:
              result.primaryImage,
            images:
              result.images,
            message:
              "تصویر با موفقیت حذف شد.",
          });
        } catch (error) {
          if (
            error instanceof
            ImageRouteError
          ) {
            return Response.json(
              {
                success: false,
                message:
                  error.message,
              },
              {
                status: error.status,
              },
            );
          }

          console.error(
            "DELETE /api/admin/products/images error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message:
                "حذف تصویر انجام نشد.",
            },
            {
              status: 500,
            },
          );
        }
      },

      /*
       * ===================================================
       * PATCH
       *
       * set-primary
       * reorder
       * ===================================================
       */

      PATCH: async ({
        request,
      }) => {
        const admin =
          await requireAdmin(request);

        if (!admin.authenticated) {
          return Response.json(
            {
              success: false,
              message:
                "برای دسترسی به این بخش باید وارد حساب شوید.",
            },
            {
              status: 401,
            },
          );
        }

        if (!admin.authorized) {
          return Response.json(
            {
              success: false,
              message:
                "شما دسترسی مدیریت ندارید.",
            },
            {
              status: 403,
            },
          );
        }

        try {
          let body: Record<
            string,
            unknown
          >;

          try {
            body =
              (await request.json()) as Record<
                string,
                unknown
              >;
          } catch {
            return Response.json(
              {
                success: false,
                message:
                  "داده ارسالی معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          const productId =
            toPositiveInteger(
              body["productId"],
            );

          if (!productId) {
            return Response.json(
              {
                success: false,
                message:
                  "شناسه محصول معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          const action =
            typeof body["action"] ===
            "string"
              ? body["action"].trim()
              : "";

          if (
            action !==
              "set-primary" &&
            action !== "reorder"
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "عملیات تصویر معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * SET PRIMARY
           * =================================================
           */

          if (
            action ===
            "set-primary"
          ) {
            const imageId =
              toPositiveInteger(
                body["imageId"],
              );

            if (!imageId) {
              return Response.json(
                {
                  success: false,
                  message:
                    "شناسه تصویر معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            const result =
              await db.transaction(
                async (tx) => {
                  const productResult =
                    await tx
                      .select({
                        id:
                          products.id,
                      })
                      .from(products)
                      .where(
                        eq(
                          products.id,
                          productId,
                        ),
                      )
                      .limit(1);

                  if (
                    !productResult[0]
                  ) {
                    throw new ImageRouteError(
                      "PRODUCT_NOT_FOUND",
                      "محصول پیدا نشد.",
                      404,
                    );
                  }

                  /*
                   * نکته مهم:
                   * sortOrder را هم دریافت می‌کنیم.
                   */
                  const imageResult =
                    await tx
                      .select({
                        id:
                          productImages.id,
                        productId:
                          productImages.productId,
                        image:
                          productImages.image,
                        sortOrder:
                          productImages.sortOrder,
                      })
                      .from(
                        productImages,
                      )
                      .where(
                        and(
                          eq(
                            productImages.id,
                            imageId,
                          ),
                          eq(
                            productImages.productId,
                            productId,
                          ),
                        ),
                      )
                      .limit(1);

                  const selectedImage =
                    imageResult[0];

                  if (
                    !selectedImage
                  ) {
                    throw new ImageRouteError(
                      "IMAGE_NOT_FOUND",
                      "تصویر موردنظر پیدا نشد.",
                      404,
                    );
                  }

                  const currentImages =
                    await getProductImagesFromTransaction(
                      tx,
                      productId,
                    );

                  const reorderedImages =
                    [
                      selectedImage,
                      ...currentImages.filter(
                        (image) =>
                          image.id !==
                          selectedImage.id,
                      ),
                    ];

                  const now =
                    new Date().toISOString();

                  for (
                    let index = 0;
                    index <
                    reorderedImages.length;
                    index += 1
                  ) {
                    const image =
                      reorderedImages[
                        index
                      ];

                    if (!image) {
                      continue;
                    }

                    await tx
                      .update(
                        productImages,
                      )
                      .set({
                        sortOrder:
                          index,
                        updatedAt:
                          now,
                      })
                      .where(
                        and(
                          eq(
                            productImages.id,
                            image.id,
                          ),
                          eq(
                            productImages.productId,
                            productId,
                          ),
                        ),
                      );
                  }

                  /*
                   * تصویر اصلی محصول
                   */
                  await tx
                    .update(products)
                    .set({
                      image:
                        selectedImage.image,
                      updatedAt: now,
                    })
                    .where(
                      eq(
                        products.id,
                        productId,
                      ),
                    );

                  const images =
                    await getProductImagesFromTransaction(
                      tx,
                      productId,
                    );

                  return {
                    primaryImage:
                      selectedImage.image,
                    images,
                  };
                },
              );

            return Response.json({
              success: true,
              action,
              primaryImage:
                result.primaryImage,
              images:
                result.images,
              message:
                "تصویر اصلی با موفقیت تغییر کرد.",
            });
          }

          /*
           * =================================================
           * REORDER
           * =================================================
           */

          const rawImageIds =
            body["imageIds"];

          if (
            !Array.isArray(
              rawImageIds,
            )
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "لیست تصاویر معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * تبدیل IDها
           */
          const imageIds =
            rawImageIds.map(
              (imageId) =>
                toPositiveInteger(
                  imageId,
                ),
            );

          /*
           * اگر حتی یکی از IDها
           * نامعتبر باشد، کل درخواست رد می‌شود.
           */
          if (
            imageIds.some(
              (imageId) =>
                imageId === null,
            )
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "لیست تصاویر شامل شناسه نامعتبر است.",
              },
              {
                status: 400,
              },
            );
          }

          const validImageIds =
            imageIds.filter(
              (
                imageId,
              ): imageId is number =>
                imageId !== null,
            );

          const result =
            await db.transaction(
              async (tx) => {
                const productResult =
                  await tx
                    .select({
                      id:
                        products.id,
                    })
                    .from(products)
                    .where(
                      eq(
                        products.id,
                        productId,
                      ),
                    )
                    .limit(1);

                if (
                  !productResult[0]
                ) {
                  throw new ImageRouteError(
                    "PRODUCT_NOT_FOUND",
                    "محصول پیدا نشد.",
                    404,
                  );
                }

                const currentImages =
                  await getProductImagesFromTransaction(
                    tx,
                    productId,
                  );

                /*
                 * تعداد IDها باید دقیقاً
                 * برابر تعداد تصاویر باشد.
                 */
                if (
                  validImageIds.length !==
                  currentImages.length
                ) {
                  throw new ImageRouteError(
                    "INVALID_IMAGE_LIST",
                    "لیست تصاویر کامل نیست.",
                    400,
                  );
                }

                /*
                 * جلوگیری از ID تکراری
                 */
                const uniqueImageIds =
                  new Set(
                    validImageIds,
                  );

                if (
                  uniqueImageIds.size !==
                  validImageIds.length
                ) {
                  throw new ImageRouteError(
                    "DUPLICATE_IMAGE_IDS",
                    "لیست تصاویر شامل شناسه تکراری است.",
                    400,
                  );
                }

                /*
                 * بررسی تعلق تمام تصاویر
                 * به همین محصول
                 */
                const currentImageIds =
                  new Set(
                    currentImages.map(
                      (image) =>
                        image.id,
                    ),
                  );

                const allBelongToProduct =
                  validImageIds.every(
                    (imageId) =>
                      currentImageIds.has(
                        imageId,
                      ),
                  );

                if (
                  !allBelongToProduct
                ) {
                  throw new ImageRouteError(
                    "IMAGE_NOT_BELONG_TO_PRODUCT",
                    "یکی از تصاویر متعلق به این محصول نیست.",
                    400,
                  );
                }

                const now =
                  new Date().toISOString();

                /*
                 * ذخیره ترتیب جدید
                 */
                for (
                  let index = 0;
                  index <
                  validImageIds.length;
                  index += 1
                ) {
                  const imageId =
                    validImageIds[
                      index
                    ];

                  if (
                    imageId ===
                    undefined
                  ) {
                    continue;
                  }

                  await tx
                    .update(
                      productImages,
                    )
                    .set({
                      sortOrder:
                        index,
                      updatedAt:
                        now,
                    })
                    .where(
                      and(
                        eq(
                          productImages.id,
                          imageId,
                        ),
                        eq(
                          productImages.productId,
                          productId,
                        ),
                      ),
                    );
                }

                /*
                 * اولین تصویر = اصلی
                 */
                const firstImageId =
                  validImageIds[0];

                if (
                  firstImageId ===
                  undefined
                ) {
                  throw new ImageRouteError(
                    "EMPTY_IMAGE_LIST",
                    "لیست تصاویر نمی‌تواند خالی باشد.",
                    400,
                  );
                }

                /*
                 * پیدا کردن تصویر اصلی جدید
                 */
                const firstImage =
                  currentImages.find(
                    (image) =>
                      image.id ===
                      firstImageId,
                  );

                if (!firstImage) {
                  throw new ImageRouteError(
                    "PRIMARY_IMAGE_NOT_FOUND",
                    "تصویر اصلی جدید پیدا نشد.",
                    500,
                  );
                }

                /*
                 * هماهنگ کردن products.image
                 */
                await tx
                  .update(products)
                  .set({
                    image:
                      firstImage.image,
                    updatedAt: now,
                  })
                  .where(
                    eq(
                      products.id,
                      productId,
                    ),
                  );

                /*
                 * دریافت نتیجه نهایی
                 */
                const images =
                  await getProductImagesFromTransaction(
                    tx,
                    productId,
                  );

                return {
                  primaryImage:
                    firstImage.image,
                  images,
                };
              },
            );

          return Response.json({
            success: true,
            action,
            primaryImage:
              result.primaryImage,
            images:
              result.images,
            message:
              "ترتیب تصاویر با موفقیت ذخیره شد.",
          });
        } catch (error) {
          if (
            error instanceof
            ImageRouteError
          ) {
            return Response.json(
              {
                success: false,
                message:
                  error.message,
              },
              {
                status: error.status,
              },
            );
          }

          console.error(
            "PATCH /api/admin/products/images error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message:
                "ویرایش تصاویر انجام نشد.",
            },
            {
              status: 500,
            },
          );
        }
      },
    },
  },
});