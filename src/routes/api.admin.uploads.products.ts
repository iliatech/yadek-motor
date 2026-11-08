import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

import { db } from "@/db";
import {
  productImages,
  products,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPE =
  "image/webp";

type AdminAuthResult =
  | {
      authenticated: false;
      authorized: false;
    }
  | {
      authenticated: true;
      authorized: false;
    }
  | {
      authenticated: true;
      authorized: true;
    };

async function requireAdminResponse(
  request: Request,
) {
  const auth =
    (await requireAdmin(
      request,
    )) as AdminAuthResult;

  if (!auth.authenticated) {
    return {
      ok: false as const,
      response: Response.json(
        {
          success: false,
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
          success: false,
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

function parseProductId(
  value: FormDataEntryValue | null,
) {
  if (
    typeof value !== "string"
  ) {
    return NaN;
  }

  const normalized =
    value
      .trim()
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

  if (!/^\d+$/.test(normalized)) {
    return NaN;
  }

  const id = Number(
    normalized,
  );

  if (
    !Number.isSafeInteger(id) ||
    id <= 0
  ) {
    return NaN;
  }

  return id;
}

export const Route = createFileRoute(
  "/api/admin/uploads/products",
)({
  server: {
    handlers: {
      POST: async ({
        request,
      }) => {
        /*
         * =====================================================
         * Admin Authentication
         * =====================================================
         */

        const admin =
          await requireAdminResponse(
            request,
          );

        if (!admin.ok) {
          return admin.response;
        }

        try {
          /*
           * ===================================================
           * Content Type
           * ===================================================
           */

          const contentType =
            request.headers.get(
              "content-type",
            ) ?? "";

          if (
            !contentType
              .toLowerCase()
              .startsWith(
                "multipart/form-data",
              )
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "فرمت درخواست آپلود معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * ===================================================
           * FormData
           * ===================================================
           */

          const formData =
            await request.formData();

          const productId =
            parseProductId(
              formData.get(
                "productId",
              ),
            );

          const file =
            formData.get("file");

          /*
           * ===================================================
           * Validate Product ID
           * ===================================================
           */

          if (
            !Number.isInteger(
              productId,
            ) ||
            productId <= 0
          ) {
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

          /*
           * ===================================================
           * Validate File
           * ===================================================
           */

          if (!(file instanceof File)) {
            return Response.json(
              {
                success: false,
                message:
                  "فایل تصویر ارسال نشده است.",
              },
              {
                status: 400,
              },
            );
          }

          if (
            file.size <= 0
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "فایل تصویر خالی است.",
              },
              {
                status: 400,
              },
            );
          }

          if (
            file.size >
            MAX_IMAGE_SIZE
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",
              },
              {
                status: 413,
              },
            );
          }

          /*
           * ===================================================
           * فقط WebP
           * ===================================================
           */

          if (
            file.type !==
            ALLOWED_IMAGE_TYPE
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "فایل تصویر باید WebP باشد.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * ===================================================
           * Check Product
           * ===================================================
           */

          const productRows =
            await db
              .select({
                id: products.id,
                image:
                  products.image,
              })
              .from(products)
              .where(
                eq(
                  products.id,
                  productId,
                ),
              )
              .limit(1);

          const product =
            productRows[0];

          if (!product) {
            return Response.json(
              {
                success: false,
                message:
                  "محصول موردنظر پیدا نشد.",
              },
              {
                status: 404,
              },
            );
          }

          /*
           * ===================================================
           * Find Next Sort Order
           * ===================================================
           */

          const lastImageRows =
            await db
              .select({
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
                desc(
                  productImages.sortOrder,
                ),
              )
              .limit(1);

          const lastImage =
            lastImageRows[0];

          const sortOrder =
            lastImage
              ? Number(
                  lastImage.sortOrder,
                ) + 1
              : 0;

          /*
           * ===================================================
           * Insert Metadata First
           *
           * image بعد از ساخت ID ساخته می‌شود.
           * ===================================================
           */

          const now =
            new Date().toISOString();

          const insertedRows =
            await db
              .insert(productImages)
              .values({
                productId,
                image: "",
                sortOrder,
                createdAt: now,
                updatedAt: now,
              })
              .returning({
                id: productImages.id,
                productId:
                  productImages.productId,
                sortOrder:
                  productImages.sortOrder,
              });

          const inserted =
            insertedRows[0];

          if (!inserted) {
            throw new Error(
              "PRODUCT_IMAGE_INSERT_FAILED",
            );
          }

          const imageId =
            Number(
              inserted.id,
            );

          if (
            !Number.isInteger(
              imageId,
            ) ||
            imageId <= 0
          ) {
            throw new Error(
              "INVALID_IMAGE_ID",
            );
          }

          /*
           * ===================================================
           * Public Image URL
           * ===================================================
           */

          const imageUrl =
            `/api/products/images/${imageId}`;

          /*
           * ===================================================
           * Update D1 Image URL
           * ===================================================
           */

          await db
            .update(productImages)
            .set({
              image: imageUrl,
              updatedAt: now,
            })
            .where(
              eq(
                productImages.id,
                imageId,
              ),
            );

          /*
           * ===================================================
           * KV Key
           * ===================================================
           *
           * فایل واقعی در KV ذخیره می‌شود.
           *
           * از imageId برای route استفاده می‌کنیم
           * و کلید KV را مستقل نگه می‌داریم.
           * ===================================================
           */

          const kvKey =
            `products/${productId}/${imageId}.webp`;

          const imageBuffer =
            await file.arrayBuffer();

          /*
           * ===================================================
           * Save Image In Workers KV
           * ===================================================
           */

          try {
            await env.PRODUCT_IMAGES.put(
              kvKey,
              imageBuffer,
              {
                metadata: {
                  productId,
                  imageId,
                  contentType:
                    "image/webp",
                },
              },
            );
          } catch (kvError) {
            console.error(
              "PRODUCT_IMAGE_KV_UPLOAD_ERROR:",
              kvError,
            );

            /*
             * KV شکست خورد؛ رکورد D1 را هم پاک می‌کنیم
             * تا رکورد ناقص باقی نماند.
             */

            await db
              .delete(
                productImages,
              )
              .where(
                eq(
                  productImages.id,
                  imageId,
                ),
              );

            throw new Error(
              "IMAGE_STORAGE_FAILED",
            );
          }

          /*
           * ===================================================
           * Store KV Key In D1
           *
           * برای اینکه route نمایش تصویر بتواند
           * مستقیماً KV را پیدا کند.
           * ===================================================
           */

          await db
            .update(productImages)
            .set({
              image: imageUrl,
              updatedAt: now,
            })
            .where(
              eq(
                productImages.id,
                imageId,
              ),
            );

          /*
           * ===================================================
           * First Image = Primary Image
           * ===================================================
           */

          if (
            sortOrder === 0 ||
            !product.image
          ) {
            await db
              .update(products)
              .set({
                image: imageUrl,
                updatedAt: now,
              })
              .where(
                eq(
                  products.id,
                  productId,
                ),
              );
          }

          /*
           * ===================================================
           * Success
           * ===================================================
           */

          return Response.json({
            success: true,
            productId,
            imageId,
            image: imageUrl,
            fileName:
              `${imageId}.webp`,
            sortOrder,
            isPrimary:
              sortOrder === 0 ||
              !product.image,
          });
        } catch (error) {
          console.error(
            "POST /api/admin/uploads/products error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message:
                "آپلود تصویر انجام نشد.",
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