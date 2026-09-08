import { createFileRoute } from "@tanstack/react-router";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { eq, max } from "drizzle-orm";

import { db } from "@/db";
import {
  productImages,
  products,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/*
 * =========================================================
 * Configuration
 * =========================================================
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

/**
 * تبدیل اعداد فارسی به انگلیسی
 */
function normalizeDigits(value: string): string {
  return value.replace(
    /[۰-۹]/g,
    (digit: string) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit),
      ),
  );
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

    const number =
      Number(normalized);

    if (
      Number.isInteger(number) &&
      number > 0
    ) {
      return number;
    }
  }

  return null;
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/admin/uploads/products",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        /*
         * =================================================
         * Authentication
         * =================================================
         */

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
          /*
           * =================================================
           * بررسی Content-Type
           * =================================================
           */

          const contentType =
            request.headers.get(
              "content-type",
            ) ?? "";

          if (
            !contentType
              .toLowerCase()
              .includes(
                "multipart/form-data",
              )
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "فایل باید به صورت multipart/form-data ارسال شود.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * دریافت FormData
           * =================================================
           */

          let formData: FormData;

          try {
            formData =
              await request.formData();
          } catch {
            return Response.json(
              {
                success: false,
                message:
                  "اطلاعات فایل معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * دریافت Product ID
           * =================================================
           */

          const productId =
            toPositiveInteger(
              formData.get(
                "productId",
              ),
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

          /*
           * =================================================
           * بررسی وجود محصول
           * =================================================
           */

          const existingProduct =
            await db
              .select({
                id: products.id,
                image: products.image,
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
            existingProduct[0];

          if (!product) {
            return Response.json(
              {
                success: false,
                message:
                  "محصول پیدا نشد.",
              },
              {
                status: 404,
              },
            );
          }

          /*
           * =================================================
           * دریافت فایل
           * =================================================
           */

          const file =
            formData.get("file");

          if (!(file instanceof File)) {
            return Response.json(
              {
                success: false,
                message:
                  "لطفاً یک تصویر انتخاب کنید.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * بررسی MIME Type
           * =================================================
           */

          if (
            !ALLOWED_MIME_TYPES.has(
              file.type,
            )
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "فرمت تصویر باید JPG، JPEG، PNG یا WEBP باشد.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * بررسی حجم
           * =================================================
           */

          if (file.size <= 0) {
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
            MAX_FILE_SIZE
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "حجم تصویر نباید بیشتر از ۵ مگابایت باشد.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * تبدیل File به Buffer
           * =================================================
           */

          const inputBuffer =
            Buffer.from(
              await file.arrayBuffer(),
            );

          /*
           * =================================================
           * بررسی واقعی بودن تصویر
           * =================================================
           */

          let metadata;

          try {
            metadata =
              await sharp(
                inputBuffer,
              ).metadata();
          } catch {
            return Response.json(
              {
                success: false,
                message:
                  "فایل تصویر معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * بررسی فرمت واقعی
           * =================================================
           */

          const actualFormat =
            metadata.format;

          if (
            actualFormat !==
              "jpeg" &&
            actualFormat !==
              "png" &&
            actualFormat !==
              "webp"
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "فرمت واقعی تصویر باید JPG، JPEG یا WEBP باشد.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * تبدیل به WEBP
           * =================================================
           */

          let outputBuffer: Buffer;

          try {
            outputBuffer =
              await sharp(
                inputBuffer,
              )
                .rotate()
                .webp({
                  quality: 85,
                  effort: 4,
                })
                .toBuffer();
          } catch (error) {
            console.error(
              "Image conversion error:",
              error,
            );

            return Response.json(
              {
                success: false,
                message:
                  "تبدیل تصویر به WEBP انجام نشد.",
              },
              {
                status: 500,
              },
            );
          }

          /*
           * =================================================
           * مسیر ذخیره تصاویر
           * =================================================
           */

          const productsDirectory =
            path.join(
              process.cwd(),
              "public",
              "products",
            );

          await mkdir(
            productsDirectory,
            {
              recursive: true,
            },
          );

          /*
           * =================================================
           * نام فایل یکتا
           * =================================================
           */

          const fileName =
            `product-${randomUUID()}.webp`;

          const filePath =
            path.join(
              productsDirectory,
              fileName,
            );

          /*
           * =================================================
           * ذخیره فایل
           * =================================================
           */

          await writeFile(
            filePath,
            outputBuffer,
          );

          /*
           * =================================================
           * URL تصویر
           * =================================================
           */

          const imageUrl =
            `/products/${fileName}`;

          /*
           * =================================================
           * تعیین sortOrder
           * =================================================
           *
           * تصویر جدید بعد از آخرین تصویر قرار می‌گیرد.
           */

          const currentMax =
            await db
              .select({
                maxSortOrder:
                  max(
                    productImages.sortOrder,
                  ),
              })
              .from(
                productImages,
              )
              .where(
                eq(
                  productImages.productId,
                  productId,
                ),
              );

          const maxSortOrder =
            currentMax[0]
              ?.maxSortOrder ?? -1;

          const sortOrder =
            maxSortOrder + 1;

          /*
           * =================================================
           * ثبت تصویر در product_images
           * =================================================
           */

          const inserted =
            await db
              .insert(
                productImages,
              )
              .values({
                productId,
                image: imageUrl,
                sortOrder,
              })
              .returning({
                id: productImages.id,
                productId:
                  productImages.productId,
                image:
                  productImages.image,
                sortOrder:
                  productImages.sortOrder,
                createdAt:
                  productImages.createdAt,
              });

          const insertedImage =
            inserted[0];

          if (!insertedImage) {
            return Response.json(
              {
                success: false,
                message:
                  "تصویر در دیتابیس ثبت نشد.",
              },
              {
                status: 500,
              },
            );
          }

          /*
           * =================================================
           * تصویر اصلی محصول
           * =================================================
           *
           * اگر محصول هنوز تصویر اصلی ندارد،
           * اولین تصویر را در products.image نیز ذخیره می‌کنیم.
           *
           * تصاویر بعدی فقط در product_images ذخیره می‌شوند
           * و تصویر قبلی دست‌نخورده باقی می‌ماند.
           */

          let isPrimary =
            false;

          if (!product.image) {
            await db
              .update(products)
              .set({
                image: imageUrl,
                updatedAt:
                  new Date().toISOString(),
              })
              .where(
                eq(
                  products.id,
                  productId,
                ),
              );

            isPrimary = true;
          }

          /*
           * =================================================
           * Response
           * =================================================
           */

          return Response.json(
            {
              success: true,

              image: imageUrl,

              fileName,

              originalName:
                file.name,

              originalType:
                file.type,

              originalSize:
                file.size,

              outputType:
                "image/webp",

              outputSize:
                outputBuffer.length,

              productId,

              imageId:
                insertedImage.id,

              sortOrder,

              isPrimary,

              message:
                isPrimary
                  ? "تصویر اصلی محصول با موفقیت آپلود شد."
                  : "تصویر جدید با موفقیت به محصول اضافه شد.",
            },
            {
              status: 201,
            },
          );
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