import { createFileRoute } from "@tanstack/react-router";
import { eq, or } from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  productImages,
  products,
} from "@/db/schema";

/*
 * =========================================================
 * Product Image URL
 * =========================================================
 */

function getProductImageUrl(
  image: string | null | undefined,
): string | null {
  if (!image) {
    return null;
  }

  const value = image.trim();

  if (!value) {
    return null;
  }

  /*
   * URL کامل
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  /*
   * مسیر API یا public
   *
   * مثال:
   * /api/products/images/1
   * /products/example.webp
   */
  if (value.startsWith("/")) {
    return value;
  }

  return null;
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/products/$productId",
)({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          /*
           * =================================================
           * اعتبارسنجی شناسه
           * =================================================
           */

          const value =
            params.productId;

          if (
            !value ||
            value.trim() === ""
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "شناسه محصول نامعتبر است",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * =================================================
           * تشخیص ID یا Slug
           * =================================================
           */

          const numericId =
            Number(value);

          const isNumericId =
            Number.isInteger(
              numericId,
            ) &&
            numericId > 0;

          /*
           * =================================================
           * دریافت محصول
           * =================================================
           */

          const result = await db
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

              /*
               * تصویر اصلی قدیمی
               */
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
              isNumericId
                ? or(
                    eq(
                      products.id,
                      numericId,
                    ),
                    eq(
                      products.slug,
                      value,
                    ),
                  )
                : eq(
                    products.slug,
                    value,
                  ),
            )
            .limit(1);

          const product =
            result[0];

          /*
           * =================================================
           * محصول پیدا نشد
           * =================================================
           */

          if (!product) {
            return Response.json(
              {
                success: false,
                message:
                  "محصول پیدا نشد",
              },
              {
                status: 404,
              },
            );
          }

          /*
           * =================================================
           * دریافت تصاویر گالری
           * =================================================
           */

          const imageRows =
            await db
              .select({
                id: productImages.id,
                image:
                  productImages.image,
                sortOrder:
                  productImages.sortOrder,
              })
              .from(productImages)
              .where(
                eq(
                  productImages.productId,
                  product.id,
                ),
              );

          /*
           * =================================================
           * مرتب‌سازی تصاویر
           * =================================================
           */

          const sortedImages =
            imageRows.sort(
              (a, b) =>
                a.sortOrder -
                  b.sortOrder ||
                a.id - b.id,
            );

          /*
           * =================================================
           * تبدیل تصاویر گالری به URLهای KV
           *
           * تصویر هر رکورد از طریق ID خودش
           * از endpoint زیر دریافت می‌شود:
           *
           * /api/products/images/{imageId}
           * =================================================
           */

          const gallery =
            sortedImages.map(
              (item) =>
                `/api/products/images/${item.id}`,
            );

          /*
           * =================================================
           * تصویر اصلی قدیمی
           *
           * اگر products.image خودش یک URL معتبر
           * داشته باشد، آن را نگه می‌داریم.
           * در غیر این صورت از اولین تصویر گالری
           * استفاده می‌کنیم.
           * =================================================
           */

          const legacyImage =
            getProductImageUrl(
              product.image,
            );

          /*
           * =================================================
           * تصویر اصلی
           *
           * اولویت:
           * 1. اولین تصویر گالری KV
           * 2. تصویر قدیمی معتبر
           * 3. placeholder
           * =================================================
           */

          const mainImage =
            gallery[0] ??
            legacyImage ??
            "/products/product-placeholder.webp";

          /*
           * =================================================
           * گالری نهایی
           *
           * اگر تصویر اصلی قدیمی معتبر وجود داشته باشد
           * و قبلاً داخل گالری نباشد، به ابتدا اضافه می‌شود.
           * =================================================
           */

          const normalizedImages =
            gallery.length > 0
              ? gallery
              : legacyImage
                ? [legacyImage]
                : [
                    "/products/product-placeholder.webp",
                  ];

          /*
           * =================================================
           * محصول نهایی
           * =================================================
           */

          const normalizedProduct = {
            ...product,

            /*
             * تصویر اصلی
             */
            image: mainImage,

            /*
             * تمام تصاویر
             */
            images:
              normalizedImages,
          };

          /*
           * =================================================
           * Response
           * =================================================
           */

          return Response.json({
            success: true,
            product:
              normalizedProduct,
          });
        } catch (error) {
          console.error(
            "GET /api/products/$productId error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message:
                "خطا در دریافت محصول",
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