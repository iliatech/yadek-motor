import { createFileRoute } from "@tanstack/react-router";
import { and, asc, eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { join } from "node:path";

import { db } from "@/db";
import { productImages, products } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

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
 * حذف فایل تصویر از دیسک
 *
 * ساختار دیسک:
 * uploads/products/${productId}/${imageId}.webp
 */
async function deleteProductImageFile(
  productId: number,
  imageId: number,
): Promise<void> {
  const filePath = join(
    process.cwd(),
    "uploads",
    "products",
    String(productId),
    `${imageId}.webp`,
  );

  try {
    await unlink(filePath);
  } catch (error) {
    console.warn(
      "Could not delete product image from disk:",
      filePath,
      error,
    );
  }
}

/**
 * بررسی اینکه تصویر در محصول دیگری
 * استفاده نشده باشد.
 *
 * برای داده‌های قدیمی که ممکن است
 * همان مسیر تصویر را داشته باشند.
 */
async function isImageUsedElsewhere(
  image: string,
  productId: number,
): Promise<boolean> {
  /*
   * بررسی product_images
   */
  const imageReferences = await db
    .select({
      productId: productImages.productId,
    })
    .from(productImages)
    .where(eq(productImages.image, image));

  if (
    imageReferences.some(
      (item) =>
        item.productId !== productId,
    )
  ) {
    return true;
  }

  /*
   * بررسی products.image
   *
   * برای سازگاری با داده‌های قدیمی.
   */
  const productReferences = await db
    .select({
      id: products.id,
    })
    .from(products)
    .where(eq(products.image, image));

  return productReferences.some(
    (item) => item.id !== productId,
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

      DELETE: async ({ request }) => {
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
          let body: Record<string, unknown>;

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
           * -------------------------------------------------
           * بررسی محصول
           * -------------------------------------------------
           */

          const productResult =
            await db
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

          if (!productResult[0]) {
            throw new ImageRouteError(
              "PRODUCT_NOT_FOUND",
              "محصول پیدا نشد.",
              404,
            );
          }

          /*
           * -------------------------------------------------
           * دریافت تصویر
           * -------------------------------------------------
           */

          const imageResult =
            await db
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
           * -------------------------------------------------
           * حذف رکورد تصویر از D1
           * -------------------------------------------------
           */

          await db
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
           * -------------------------------------------------
           * مرتب‌سازی مجدد تصاویر
           * و هماهنگ کردن products.image
           * -------------------------------------------------
           */

          const remainingImages =
            await normalizeImageOrders(
              productId,
            );

          /*
           * -------------------------------------------------
           * بررسی استفاده از تصویر در داده‌های قدیمی
           * -------------------------------------------------
           */

          const usedElsewhere =
            await isImageUsedElsewhere(
              image.image,
              productId,
            );

          /*
           * -------------------------------------------------
           * حذف فایل از KV
           *
           * فقط اگر تصویر در جای دیگری
           * استفاده نشده باشد.
           * -------------------------------------------------
           */

          if (!usedElsewhere) {
            await deleteProductImageFile(
              productId,
              imageId,
            );
          }

          return Response.json({
            success: true,
            deletedImage: {
              id: image.id,
              image: image.image,
            },
            primaryImage:
              remainingImages[0]
                ?.image ?? null,
            images:
              remainingImages,
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

      PATCH: async ({ request }) => {
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
          let body: Record<string, unknown>;

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

            /*
             * بررسی محصول
             */

            const productResult =
              await db
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

            if (!productResult[0]) {
              throw new ImageRouteError(
                "PRODUCT_NOT_FOUND",
                "محصول پیدا نشد.",
                404,
              );
            }

            /*
             * دریافت تصویر انتخاب‌شده
             */

            const imageResult =
              await db
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

            if (!selectedImage) {
              throw new ImageRouteError(
                "IMAGE_NOT_FOUND",
                "تصویر موردنظر پیدا نشد.",
                404,
              );
            }

            /*
             * دریافت تصاویر فعلی
             */

            const currentImages =
              await getProductImages(
                productId,
              );

            /*
             * انتقال تصویر انتخاب‌شده
             * به ابتدای لیست
             */

            const reorderedImages = [
              selectedImage,
              ...currentImages.filter(
                (image) =>
                  image.id !==
                  selectedImage.id,
              ),
            ];

            const now =
              new Date().toISOString();

            /*
             * ذخیره ترتیب جدید
             */

            for (
              let index = 0;
              index <
              reorderedImages.length;
              index += 1
            ) {
              const image =
                reorderedImages[index];

              if (!image) {
                continue;
              }

              await db
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

            await db
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

            /*
             * دریافت نتیجه نهایی
             */

            const images =
              await getProductImages(
                productId,
              );

            return Response.json({
              success: true,
              action,
              primaryImage:
                selectedImage.image,
              images,
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
           * نامعتبر باشد
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

          /*
           * بررسی محصول
           */

          const productResult =
            await db
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

          if (!productResult[0]) {
            throw new ImageRouteError(
              "PRODUCT_NOT_FOUND",
              "محصول پیدا نشد.",
              404,
            );
          }

          /*
           * دریافت تصاویر فعلی
           */

          const currentImages =
            await getProductImages(
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
              validImageIds[index];

            if (
              imageId ===
              undefined
            ) {
              continue;
            }

            await db
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

          await db
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
            await getProductImages(
              productId,
            );

          return Response.json({
            success: true,
            action,
            primaryImage:
              firstImage.image,
            images,
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