import { createFileRoute } from "@tanstack/react-router";
import {
  and,
  desc,
  eq,
  inArray,
  like,
  or,
} from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  orderItems,
  productImages,
  products,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/* =========================================================
   Constants
   ========================================================= */

const MAX_NAME_LENGTH = 200;
const MAX_BRAND_LENGTH = 100;
const MAX_SLUG_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_BADGE_LENGTH = 100;
const MAX_AVAILABILITY_LENGTH = 100;

const MAX_KEYWORDS = 30;
const MAX_KEYWORD_LENGTH = 100;

const MAX_IMAGE_LENGTH = 1000;

/* =========================================================
   Auth helper
   ========================================================= */

async function requireAdminResponse(
  request: Request,
) {
  const auth = await requireAdmin(request);

  if (!auth.authenticated) {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            "احراز هویت لازم است.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  if (!auth.authorized) {
    return {
      ok: false as const,
      response: Response.json(
        {
          error:
            "دسترسی به این بخش مجاز نیست.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    ok: true as const,
    auth,
  };
}

/* =========================================================
   Helpers
   ========================================================= */

function normalizeDigits(value: string) {
  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(
            digit,
          ),
        ),
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(
            digit,
          ),
        ),
    );
}

function cleanString(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : NaN;
  }

  if (typeof value !== "string") {
    return NaN;
  }

  const normalized =
    normalizeDigits(value.trim());

  if (!normalized) {
    return NaN;
  }

  const number = Number(normalized);

  return Number.isFinite(number)
    ? number
    : NaN;
}

function toNonNegativeInteger(
  value: unknown,
) {
  const number = toNumber(value);

  if (
    !Number.isInteger(number) ||
    number < 0
  ) {
    return NaN;
  }

  return number;
}

function normalizeKeywords(
  value: unknown,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (keyword): keyword is string =>
        typeof keyword === "string",
    )
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .map((keyword) =>
      keyword.slice(
        0,
        MAX_KEYWORD_LENGTH,
      ),
    )
    .slice(0, MAX_KEYWORDS);
}

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(
      /[^a-z0-9\u0600-\u06ff-]/g,
      "",
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

function parseProductId(
  value: string | null,
) {
  if (!value) {
    return NaN;
  }

  const normalized =
    normalizeDigits(value.trim());

  if (!/^\d+$/.test(normalized)) {
    return NaN;
  }

  const id = Number(normalized);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return NaN;
  }

  return id;
}

function isValidImagePath(
  value: string,
) {
  return (
    value.length <= MAX_IMAGE_LENGTH
  );
}

/* =========================================================
   Database helpers
   ========================================================= */

async function categoryExists(
  categoryId: number,
) {
  const rows = await db
    .select({
      id: categories.id,
    })
    .from(categories)
    .where(
      eq(
        categories.id,
        categoryId,
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/* =========================================================
   Route
   ========================================================= */

export const Route = createFileRoute(
  "/api/admin/products",
)({
  server: {
    handlers: {
      /* =====================================================
         GET /api/admin/products
         ===================================================== */

      GET: async ({ request }) => {
        const admin =
          await requireAdminResponse(
            request,
          );

        if (!admin.ok) {
          return admin.response;
        }

        try {
          const url = new URL(
            request.url,
          );

          const search = cleanString(
            url.searchParams.get(
              "search",
            ),
          );

          const conditions = [];

          if (search) {
            const pattern = `%${search}%`;

            const searchCondition = or(
              like(
                products.name,
                pattern,
              ),
              like(
                products.brand,
                pattern,
              ),
              like(
                products.slug,
                pattern,
              ),
            );

            if (searchCondition) {
              conditions.push(
                searchCondition,
              );
            }
          }

          const rows = await db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
              description:
                products.description,
              brand: products.brand,
              categoryId:
                products.categoryId,
              categoryName:
                categories.name,
              price: products.price,
              oldPrice:
                products.oldPrice,
              stock: products.stock,
              availability:
                products.availability,
              image: products.image,
              rating: products.rating,
              reviews: products.reviews,
              popularity:
                products.popularity,
              keywords:
                products.keywords,
              badge: products.badge,
              createdAt:
                products.createdAt,
              updatedAt:
                products.updatedAt,
            })
            .from(products)
            .leftJoin(
              categories,
              eq(
                products.categoryId,
                categories.id,
              ),
            )
            .where(
              conditions.length > 0
                ? and(...conditions)
                : undefined,
            )
            .orderBy(
              desc(products.createdAt),
            );

          const productIds =
            rows.map(
              (product) =>
                product.id,
            );

          const imageRows =
            productIds.length > 0
              ? await db
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
                    inArray(
                      productImages.productId,
                      productIds,
                    ),
                  )
                  .orderBy(
                    productImages.sortOrder,
                    productImages.id,
                  )
              : [];

          const imagesByProduct =
            new Map<
              number,
              Array<{
                id: number;
                image: string;
                sortOrder: number;
              }>
            >();

          for (const image of imageRows) {
            const current =
              imagesByProduct.get(
                image.productId,
              ) ?? [];

            current.push({
              id: image.id,
              image: image.image,
              sortOrder:
                image.sortOrder,
            });

            imagesByProduct.set(
              image.productId,
              current,
            );
          }

          const result = rows.map(
            (product) => {
              const images = [
                ...(imagesByProduct.get(
                  product.id,
                ) ?? []),
              ];

              if (
                product.image &&
                !images.some(
                  (item) =>
                    item.image ===
                    product.image,
                )
              ) {
                images.unshift({
                  id: 0,
                  image:
                    product.image,
                  sortOrder: 0,
                });
              }

              return {
                ...product,
                images,
              };
            },
          );

          return Response.json({
            success: true,
            products: result,
            count: result.length,
          });
        } catch (error) {
          console.error(
            "GET /api/admin/products error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message:
                "دریافت محصولات انجام نشد.",
            },
            {
              status: 500,
            },
          );
        }
      },

      /* =====================================================
         POST /api/admin/products
         ===================================================== */

      POST: async ({ request }) => {
        const admin =
          await requireAdminResponse(
            request,
          );

        if (!admin.ok) {
          return admin.response;
        }

        let body: Record<
          string,
          unknown
        >;

        try {
          const parsed =
            await request.json();

          if (
            !parsed ||
            typeof parsed !==
              "object" ||
            Array.isArray(parsed)
          ) {
            return Response.json(
              {
                error:
                  "بدنه درخواست نامعتبر است.",
              },
              {
                status: 400,
              },
            );
          }

          body =
            parsed as Record<
              string,
              unknown
            >;
        } catch {
          return Response.json(
            {
              error:
                "بدنه درخواست نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        const name = cleanString(
          body["name"],
        );

        const description =
          cleanString(
            body["description"],
          );

        const brand = cleanString(
          body["brand"],
        );

        const categoryId =
          toNonNegativeInteger(
            body["categoryId"],
          );

        const price = toNumber(
          body["price"],
        );

        const oldPrice =
          body["oldPrice"] ===
            null ||
          body["oldPrice"] ===
            undefined ||
          body["oldPrice"] === ""
            ? null
            : toNumber(
                body["oldPrice"],
              );

        const stock =
          body["stock"] ===
            undefined ||
          body["stock"] === null ||
          body["stock"] === ""
            ? 0
            : toNonNegativeInteger(
                body["stock"],
              );

        const availability =
          cleanString(
            body["availability"],
          ) ||
          "in-stock";

        const image = cleanString(
          body["image"],
        );

        const rating =
          body["rating"] ===
            undefined ||
          body["rating"] === null ||
          body["rating"] === ""
            ? 0
            : toNumber(
                body["rating"],
              );

        const reviews =
          body["reviews"] ===
            undefined ||
          body["reviews"] === null ||
          body["reviews"] === ""
            ? 0
            : toNonNegativeInteger(
                body["reviews"],
              );

        const popularity =
          body["popularity"] ===
            undefined ||
          body["popularity"] === null ||
          body["popularity"] === ""
            ? 0
            : toNonNegativeInteger(
                body["popularity"],
              );

        const keywords =
          normalizeKeywords(
            body["keywords"],
          );

        const badge = cleanString(
          body["badge"],
        );

        const requestedSlug =
          cleanString(
            body["slug"],
          );

        const slug = createSlug(
          requestedSlug || name,
        );

        /* -----------------------------------------------------
           Validation
           ----------------------------------------------------- */

        if (!name) {
          return Response.json(
            {
              error:
                "نام محصول الزامی است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          name.length >
          MAX_NAME_LENGTH
        ) {
          return Response.json(
            {
              error:
                "نام محصول بیش از حد طولانی است.",
            },
            {
              status: 400,
            },
          );
        }

        if (!brand) {
          return Response.json(
            {
              error:
                "برند محصول الزامی است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          brand.length >
          MAX_BRAND_LENGTH
        ) {
          return Response.json(
            {
              error:
                "نام برند بیش از حد طولانی است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !Number.isInteger(
            categoryId,
          ) ||
          categoryId <= 0
        ) {
          return Response.json(
            {
              error:
                "دسته‌بندی محصول نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !(await categoryExists(
            categoryId,
          ))
        ) {
          return Response.json(
            {
              error:
                "دسته‌بندی انتخاب‌شده وجود ندارد.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          return Response.json(
            {
              error:
                "قیمت محصول نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          oldPrice !== null &&
          (!Number.isFinite(
            oldPrice,
          ) ||
            oldPrice < 0)
        ) {
          return Response.json(
            {
              error:
                "قیمت قبلی نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !Number.isInteger(stock) ||
          stock < 0
        ) {
          return Response.json(
            {
              error:
                "موجودی محصول نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !Number.isFinite(rating) ||
          rating < 0 ||
          rating > 5
        ) {
          return Response.json(
            {
              error:
                "امتیاز محصول باید بین ۰ تا ۵ باشد.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !Number.isInteger(
            reviews,
          ) ||
          reviews < 0
        ) {
          return Response.json(
            {
              error:
                "تعداد نظرات نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !Number.isInteger(
            popularity,
          ) ||
          popularity < 0
        ) {
          return Response.json(
            {
              error:
                "محبوبیت محصول نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        if (!slug) {
          return Response.json(
            {
              error:
                "Slug محصول نمی‌تواند خالی باشد.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          description.length >
          MAX_DESCRIPTION_LENGTH
        ) {
          return Response.json(
            {
              error:
                "توضیحات محصول بیش از حد طولانی است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          availability.length >
          MAX_AVAILABILITY_LENGTH
        ) {
          return Response.json(
            {
              error:
                "وضعیت موجودی نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          !isValidImagePath(image)
        ) {
          return Response.json(
            {
              error:
                "مسیر تصویر محصول بیش از حد طولانی است.",
            },
            {
              status: 400,
            },
          );
        }

        if (
          badge.length >
          MAX_BADGE_LENGTH
        ) {
          return Response.json(
            {
              error:
                "نشان محصول بیش از حد طولانی است.",
            },
            {
              status: 400,
            },
          );
        }

        /* -----------------------------------------------------
           Create product - D1 بدون transaction
           ----------------------------------------------------- */

        try {
          const now =
            new Date().toISOString();

          /*
           * بررسی Slug
           */

          const duplicateSlug =
            await db
              .select({
                id: products.id,
              })
              .from(products)
              .where(
                eq(
                  products.slug,
                  slug,
                ),
              )
              .limit(1);

          if (
            duplicateSlug.length > 0
          ) {
            return Response.json(
              {
                error:
                  "این Slug قبلاً استفاده شده است.",
              },
              {
                status: 409,
              },
            );
          }

          /*
           * ساخت محصول
           */

          const rows = await db
            .insert(products)
            .values({
              name,
              slug,
              description:
                description ||
                null,
              brand,
              categoryId,
              price,
              oldPrice,
              stock,
              availability,
              image:
                image || null,
              rating,
              reviews,
              popularity,
              keywords,
              badge:
                badge || null,
              createdAt: now,
              updatedAt: now,
            })
            .returning({
              id: products.id,
              name:
                products.name,
              slug:
                products.slug,
              description:
                products.description,
              brand:
                products.brand,
              categoryId:
                products.categoryId,
              price:
                products.price,
              oldPrice:
                products.oldPrice,
              stock:
                products.stock,
              availability:
                products.availability,
              image:
                products.image,
              rating:
                products.rating,
              reviews:
                products.reviews,
              popularity:
                products.popularity,
              keywords:
                products.keywords,
              badge:
                products.badge,
              createdAt:
                products.createdAt,
              updatedAt:
                products.updatedAt,
            });

          const created =
            rows[0];

          if (!created) {
            throw new Error(
              "PRODUCT_CREATION_FAILED",
            );
          }

          /*
           * ثبت تصویر اولیه
           */

          if (image) {
            await db
              .insert(productImages)
              .values({
                productId:
                  created.id,
                image,
                sortOrder: 0,
                createdAt: now,
                updatedAt: now,
              });
          }

          return Response.json(
            {
              success: true,
              product: created,
            },
            {
              status: 201,
            },
          );
        } catch (error) {
          console.error(
            "POST /api/admin/products error:",
            error,
          );

          return Response.json(
            {
              success: false,
              error:
                "ایجاد محصول انجام نشد.",
            },
            {
              status: 500,
            },
          );
        }
      },

      /* =====================================================
         PATCH /api/admin/products
         ===================================================== */

      PATCH: async ({ request }) => {
        const admin =
          await requireAdminResponse(
            request,
          );

        if (!admin.ok) {
          return admin.response;
        }

        const url = new URL(
          request.url,
        );

        const productId =
          parseProductId(
            url.searchParams.get(
              "productId",
            ),
          );

        if (
          !Number.isInteger(
            productId,
          )
        ) {
          return Response.json(
            {
              error:
                "شناسه محصول نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        let body: Record<
          string,
          unknown
        >;

        try {
          const parsed =
            await request.json();

          if (
            !parsed ||
            typeof parsed !==
              "object" ||
            Array.isArray(parsed)
          ) {
            return Response.json(
              {
                error:
                  "بدنه درخواست نامعتبر است.",
              },
              {
                status: 400,
              },
            );
          }

          body =
            parsed as Record<
              string,
              unknown
            >;
        } catch {
          return Response.json(
            {
              error:
                "بدنه درخواست نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        try {
          const existingRows =
            await db
              .select()
              .from(products)
              .where(
                eq(
                  products.id,
                  productId,
                ),
              )
              .limit(1);

          const existing =
            existingRows[0];

          if (!existing) {
            return Response.json(
              {
                error:
                  "محصول پیدا نشد.",
              },
              {
                status: 404,
              },
            );
          }

          const updateData: Partial<
            typeof products.$inferInsert
          > = {
            updatedAt:
              new Date().toISOString(),
          };

          let imageWasChanged =
            false;

          let requestedPrimaryImage:
            | string
            | null
            | undefined;

          /* ---------------------------------------------------
             Name
             --------------------------------------------------- */

          if (
            body["name"] !==
            undefined
          ) {
            const name =
              cleanString(
                body["name"],
              );

            if (!name) {
              return Response.json(
                {
                  error:
                    "نام محصول نمی‌تواند خالی باشد.",
                },
                {
                  status: 400,
                },
              );
            }

            if (
              name.length >
              MAX_NAME_LENGTH
            ) {
              return Response.json(
                {
                  error:
                    "نام محصول بیش از حد طولانی است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.name = name;
          }

          /* ---------------------------------------------------
             Slug
             --------------------------------------------------- */

          if (
            body["slug"] !==
            undefined
          ) {
            const slug =
              createSlug(
                cleanString(
                  body["slug"],
                ),
              );

            if (!slug) {
              return Response.json(
                {
                  error:
                    "Slug محصول نمی‌تواند خالی باشد.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.slug = slug;
          }

          /* ---------------------------------------------------
             Description
             --------------------------------------------------- */

          if (
            body["description"] !==
            undefined
          ) {
            const description =
              cleanString(
                body["description"],
              );

            if (
              description.length >
              MAX_DESCRIPTION_LENGTH
            ) {
              return Response.json(
                {
                  error:
                    "توضیحات محصول بیش از حد طولانی است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.description =
              description || null;
          }

          /* ---------------------------------------------------
             Brand
             --------------------------------------------------- */

          if (
            body["brand"] !==
            undefined
          ) {
            const brand =
              cleanString(
                body["brand"],
              );

            if (!brand) {
              return Response.json(
                {
                  error:
                    "برند محصول نمی‌تواند خالی باشد.",
                },
                {
                  status: 400,
                },
              );
            }

            if (
              brand.length >
              MAX_BRAND_LENGTH
            ) {
              return Response.json(
                {
                  error:
                    "نام برند بیش از حد طولانی است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.brand = brand;
          }

          /* ---------------------------------------------------
             Category
             --------------------------------------------------- */

          if (
            body["categoryId"] !==
            undefined
          ) {
            const categoryId =
              toNonNegativeInteger(
                body["categoryId"],
              );

            if (
              !Number.isInteger(
                categoryId,
              ) ||
              categoryId <= 0
            ) {
              return Response.json(
                {
                  error:
                    "دسته‌بندی محصول نامعتبر است.",
                },
                {
                  status: 400,
                },
              );
            }

            if (
              !(await categoryExists(
                categoryId,
              ))
            ) {
              return Response.json(
                {
                  error:
                    "دسته‌بندی انتخاب‌شده وجود ندارد.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.categoryId =
              categoryId;
          }

          /* ---------------------------------------------------
             Price
             --------------------------------------------------- */

          if (
            body["price"] !==
            undefined
          ) {
            const price =
              toNumber(
                body["price"],
              );

            if (
              !Number.isFinite(
                price,
              ) ||
              price < 0
            ) {
              return Response.json(
                {
                  error:
                    "قیمت محصول نامعتبر است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.price =
              price;
          }

          /* ---------------------------------------------------
             Old price
             --------------------------------------------------- */

          if (
            body["oldPrice"] !==
            undefined
          ) {
            if (
              body["oldPrice"] ===
                null ||
              body["oldPrice"] ===
                ""
            ) {
              updateData.oldPrice =
                null;
            } else {
              const oldPrice =
                toNumber(
                  body["oldPrice"],
                );

              if (
                !Number.isFinite(
                  oldPrice,
                ) ||
                oldPrice < 0
              ) {
                return Response.json(
                  {
                    error:
                      "قیمت قبلی نامعتبر است.",
                  },
                  {
                    status: 400,
                  },
                );
              }

              updateData.oldPrice =
                oldPrice;
            }
          }

          /* ---------------------------------------------------
             Stock
             --------------------------------------------------- */

          if (
            body["stock"] !==
            undefined
          ) {
            const stock =
              toNonNegativeInteger(
                body["stock"],
              );

            if (
              !Number.isInteger(
                stock,
              ) ||
              stock < 0
            ) {
              return Response.json(
                {
                  error:
                    "موجودی محصول نامعتبر است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.stock =
              stock;
          }

          /* ---------------------------------------------------
             Availability
             --------------------------------------------------- */

          if (
            body["availability"] !==
            undefined
          ) {
            const availability =
              cleanString(
                body[
                  "availability"
                ],
              );

            if (!availability) {
              return Response.json(
                {
                  error:
                    "وضعیت موجودی نمی‌تواند خالی باشد.",
                },
                {
                  status: 400,
                },
              );
            }

            if (
              availability.length >
              MAX_AVAILABILITY_LENGTH
            ) {
              return Response.json(
                {
                  error:
                    "وضعیت موجودی نامعتبر است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.availability =
              availability;
          }

          /* ---------------------------------------------------
             Image
             --------------------------------------------------- */

          if (
            body["image"] !==
            undefined
          ) {
            const image =
              cleanString(
                body["image"],
              );

            if (
              !isValidImagePath(
                image,
              )
            ) {
              return Response.json(
                {
                  error:
                    "مسیر تصویر محصول بیش از حد طولانی است.",
                },
                {
                  status: 400,
                },
              );
            }

            const currentImage =
              existing.image ?? "";

            updateData.image =
              image || null;

            requestedPrimaryImage =
              image || null;

            imageWasChanged =
              image !== currentImage;
          }

          /* ---------------------------------------------------
             Rating
             --------------------------------------------------- */

          if (
            body["rating"] !==
            undefined
          ) {
            const rating =
              toNumber(
                body["rating"],
              );

            if (
              !Number.isFinite(
                rating,
              ) ||
              rating < 0 ||
              rating > 5
            ) {
              return Response.json(
                {
                  error:
                    "امتیاز محصول باید بین ۰ تا ۵ باشد.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.rating =
              rating;
          }

          /* ---------------------------------------------------
             Reviews
             --------------------------------------------------- */

          if (
            body["reviews"] !==
            undefined
          ) {
            const reviews =
              toNonNegativeInteger(
                body["reviews"],
              );

            if (
              !Number.isInteger(
                reviews,
              ) ||
              reviews < 0
            ) {
              return Response.json(
                {
                  error:
                    "تعداد نظرات نامعتبر است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.reviews =
              reviews;
          }

          /* ---------------------------------------------------
             Popularity
             --------------------------------------------------- */

          if (
            body["popularity"] !==
            undefined
          ) {
            const popularity =
              toNonNegativeInteger(
                body[
                  "popularity"
                ],
              );

            if (
              !Number.isInteger(
                popularity,
              ) ||
              popularity < 0
            ) {
              return Response.json(
                {
                  error:
                    "محبوبیت محصول نامعتبر است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.popularity =
              popularity;
          }

          /* ---------------------------------------------------
             Keywords
             --------------------------------------------------- */

          if (
            body["keywords"] !==
            undefined
          ) {
            updateData.keywords =
              normalizeKeywords(
                body["keywords"],
              );
          }

          /* ---------------------------------------------------
             Badge
             --------------------------------------------------- */

          if (
            body["badge"] !==
            undefined
          ) {
            const badge =
              cleanString(
                body["badge"],
              );

            if (
              badge.length >
              MAX_BADGE_LENGTH
            ) {
              return Response.json(
                {
                  error:
                    "نشان محصول بیش از حد طولانی است.",
                },
                {
                  status: 400,
                },
              );
            }

            updateData.badge =
              badge || null;
          }

          /* ---------------------------------------------------
             بررسی Slug - خارج از transaction
             --------------------------------------------------- */

          if (
            updateData.slug !== undefined &&
            updateData.slug !== existing.slug
          ) {
            const duplicateSlug =
              await db
                .select({
                  id: products.id,
                })
                .from(products)
                .where(
                  eq(
                    products.slug,
                    updateData.slug,
                  ),
                )
                .limit(1);

            const duplicate =
              duplicateSlug[0];

            if (
              duplicate &&
              duplicate.id !==
                productId
            ) {
              return Response.json(
                {
                  error:
                    "این Slug قبلاً استفاده شده است.",
                },
                {
                  status: 409,
                },
              );
            }
          }

          /* ---------------------------------------------------
             Update Product
             --------------------------------------------------- */

          const updatedRows =
            await db
              .update(products)
              .set(updateData)
              .where(
                eq(
                  products.id,
                  productId,
                ),
              )
              .returning({
                id: products.id,
                name:
                  products.name,
                slug:
                  products.slug,
                description:
                  products.description,
                brand:
                  products.brand,
                categoryId:
                  products.categoryId,
                price:
                  products.price,
                oldPrice:
                  products.oldPrice,
                stock:
                  products.stock,
                availability:
                  products.availability,
                image:
                  products.image,
                rating:
                  products.rating,
                reviews:
                  products.reviews,
                popularity:
                  products.popularity,
                keywords:
                  products.keywords,
                badge:
                  products.badge,
                createdAt:
                  products.createdAt,
                updatedAt:
                  products.updatedAt,
              });

          const updated =
            updatedRows[0];

          if (!updated) {
            throw new Error(
              "PRODUCT_UPDATE_FAILED",
            );
          }

          /* ---------------------------------------------------
             Synchronize Images
             --------------------------------------------------- */

          if (imageWasChanged) {
            const now =
              new Date().toISOString();

            let images =
              await db
                .select({
                  id:
                    productImages.id,
                  image:
                    productImages.image,
                  sortOrder:
                    productImages.sortOrder,
                })
                .from(
                  productImages,
                )
                .where(
                  eq(
                    productImages.productId,
                    productId,
                  ),
                )
                .orderBy(
                  productImages.sortOrder,
                  productImages.id,
                );

            /* ------------------------------------------------
               اگر تصویر اصلی جدید تعیین شده
               ------------------------------------------------ */

            if (
              requestedPrimaryImage
            ) {
              let primary =
                images.find(
                  (item) =>
                    item.image ===
                    requestedPrimaryImage,
                );

              if (!primary) {
                const inserted =
                  await db
                    .insert(
                      productImages,
                    )
                    .values({
                      productId,
                      image:
                        requestedPrimaryImage,
                      sortOrder: 0,
                      createdAt: now,
                      updatedAt: now,
                    })
                    .returning({
                      id:
                        productImages.id,
                      image:
                        productImages.image,
                      sortOrder:
                        productImages.sortOrder,
                    });

                primary =
                  inserted[0];
              }

              if (primary) {
                images = [
                  primary,
                  ...images.filter(
                    (item) =>
                      item.id !==
                      primary.id,
                  ),
                ];
              }
            }

            /* ------------------------------------------------
               اگر تصویر اصلی حذف شده
               ------------------------------------------------ */

            else if (
              images.length > 0
            ) {
              const firstImage =
                images[0];

              if (firstImage) {
                images = [
                  firstImage,
                  ...images.slice(
                    1,
                  ),
                ];

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
              }
            }

            /* ------------------------------------------------
               Normalize sort order
               ------------------------------------------------ */

            for (
              let index = 0;
              index < images.length;
              index++
            ) {
              const image =
                images[index];

              if (!image) {
                continue;
              }

              if (image.id === 0) {
                continue;
              }

              await db
                .update(
                  productImages,
                )
                .set({
                  sortOrder:
                    index,
                  updatedAt: now,
                })
                .where(
                  eq(
                    productImages.id,
                    image.id,
                  ),
                );
            }

            /* ------------------------------------------------
               اگر هیچ تصویری باقی نمانده
               ------------------------------------------------ */

            if (
              images.length === 0
            ) {
              await db
                .update(products)
                .set({
                  image: null,
                  updatedAt: now,
                })
                .where(
                  eq(
                    products.id,
                    productId,
                  ),
                );
            }
          }

          /* ---------------------------------------------------
             دریافت محصول نهایی
             --------------------------------------------------- */

          const finalRows =
            await db
              .select({
                id: products.id,
                name:
                  products.name,
                slug:
                  products.slug,
                description:
                  products.description,
                brand:
                  products.brand,
                categoryId:
                  products.categoryId,
                price:
                  products.price,
                oldPrice:
                  products.oldPrice,
                stock:
                  products.stock,
                availability:
                  products.availability,
                image:
                  products.image,
                rating:
                  products.rating,
                reviews:
                  products.reviews,
                popularity:
                  products.popularity,
                keywords:
                  products.keywords,
                badge:
                  products.badge,
                createdAt:
                  products.createdAt,
                updatedAt:
                  products.updatedAt,
              })
              .from(products)
              .where(
                eq(
                  products.id,
                  productId,
                ),
              )
              .limit(1);

          const updatedProduct =
            finalRows[0] ??
            updated;

          return Response.json({
            success: true,
            product:
              updatedProduct,
          });
        } catch (error) {
          console.error(
            "PATCH /api/admin/products error:",
            error,
          );

          return Response.json(
            {
              success: false,
              error:
                "ویرایش محصول انجام نشد.",
            },
            {
              status: 500,
            },
          );
        }
      },

      /* =====================================================
         DELETE /api/admin/products
         ===================================================== */

      DELETE: async ({ request }) => {
        const admin =
          await requireAdminResponse(
            request,
          );

        if (!admin.ok) {
          return admin.response;
        }

        const url = new URL(
          request.url,
        );

        const productId =
          parseProductId(
            url.searchParams.get(
              "productId",
            ),
          );

        if (
          !Number.isInteger(
            productId,
          )
        ) {
          return Response.json(
            {
              error:
                "شناسه محصول نامعتبر است.",
            },
            {
              status: 400,
            },
          );
        }

        try {
          const existingRows =
            await db
              .select({
                id: products.id,
                name: products.name,
              })
              .from(products)
              .where(
                eq(
                  products.id,
                  productId,
                ),
              )
              .limit(1);

          const existing =
            existingRows[0];

          if (!existing) {
            return Response.json(
              {
                error:
                  "محصول پیدا نشد.",
              },
              {
                status: 404,
              },
            );
          }

          /* ---------------------------------------------------
             بررسی سابقه سفارش
             --------------------------------------------------- */

          const orderUsage =
            await db
              .select({
                id: orderItems.id,
              })
              .from(orderItems)
              .where(
                eq(
                  orderItems.productId,
                  productId,
                ),
              )
              .limit(1);

          if (
            orderUsage.length > 0
          ) {
            return Response.json(
              {
                error:
                  "این محصول در سفارش‌های قبلی استفاده شده و قابل حذف نیست.",
              },
              {
                status: 409,
              },
            );
          }

          /* ---------------------------------------------------
             Delete product images
             --------------------------------------------------- */

          await db
            .delete(productImages)
            .where(
              eq(
                productImages.productId,
                productId,
              ),
            );

          /* ---------------------------------------------------
             Delete product
             --------------------------------------------------- */

          const deleted =
            await db
              .delete(products)
              .where(
                eq(
                  products.id,
                  productId,
                ),
              )
              .returning({
                id: products.id,
              });

          if (
            deleted.length === 0
          ) {
            throw new Error(
              "PRODUCT_DELETE_FAILED",
            );
          }

          return Response.json({
            success: true,
            message:
              "محصول با موفقیت حذف شد.",
          });
        } catch (error) {
          console.error(
            "DELETE /api/admin/products error:",
            error,
          );

          return Response.json(
            {
              success: false,
              error:
                "حذف محصول انجام نشد.",
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