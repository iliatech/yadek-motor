import { createFileRoute } from "@tanstack/react-router";
import { desc, eq } from "drizzle-orm";

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
): string {
  if (!image) {
    return "/products/product-placeholder.webp";
  }

  const value = image.trim();

  if (!value) {
    return "/products/product-placeholder.webp";
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
   * هر مسیر داخلی سایت
   *
   * شامل:
   * /products/...
   * /api/products/images/...
   * و سایر مسیرهای داخلی
   */
  if (value.startsWith("/")) {
    return value;
  }

  /*
   * استخراج نام فایل
   */
  const fileName =
    value
      .split("/")
      .pop()
      ?.split("?")[0] ?? "";

  if (!fileName) {
    return "/products/product-placeholder.webp";
  }

  return `/products/${fileName}`;
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/products",
)({
  server: {
    handlers: {
      GET: async () => {
        try {
          /*
           * =================================================
           * دریافت محصولات
           * =================================================
           */

          const result = await db
            .select({
              id: products.id,
              name: products.name,
              slug: products.slug,
              description: products.description,
              brand: products.brand,

              categoryId: products.categoryId,
              categoryName: categories.name,

              price: products.price,
              oldPrice: products.oldPrice,

              stock: products.stock,
              availability: products.availability,

              /*
               * تصویر اصلی قدیمی
               */
              image: products.image,

              rating: products.rating,
              reviews: products.reviews,
              popularity: products.popularity,

              keywords: products.keywords,
              badge: products.badge,

              createdAt: products.createdAt,
              updatedAt: products.updatedAt,
            })
            .from(products)
            .leftJoin(
              categories,
              eq(
                products.categoryId,
                categories.id,
              ),
            )
            .orderBy(
              desc(products.createdAt),
            );

          /*
           * =================================================
           * دریافت تصاویر گالری
           * =================================================
           */

          const imageRows = await db
            .select({
              id: productImages.id,
              productId:
                productImages.productId,
              image: productImages.image,
              sortOrder:
                productImages.sortOrder,
            })
            .from(productImages);

          /*
           * =================================================
           * مرتب‌سازی تصاویر
           * =================================================
           */

          const sortedImageRows =
            [...imageRows].sort(
              (a, b) =>
                a.productId -
                  b.productId ||
                a.sortOrder -
                  b.sortOrder ||
                a.id - b.id,
            );

          /*
           * =================================================
           * گروه‌بندی تصاویر بر اساس productId
           * =================================================
           */

          const sortedImagesByProduct =
            new Map<number, string[]>();

          for (const row of sortedImageRows) {
            const current =
              sortedImagesByProduct.get(
                row.productId,
              ) ?? [];

            current.push(
              getProductImageUrl(
                row.image,
              ),
            );

            sortedImagesByProduct.set(
              row.productId,
              current,
            );
          }

          /*
           * =================================================
           * ساخت پاسخ نهایی
           * =================================================
           */

          const normalizedProducts =
            result.map((product) => {
              const gallery =
                sortedImagesByProduct.get(
                  product.id,
                ) ?? [];

              /*
               * تصویر اصلی قدیمی
               */
              const mainImage =
                product.image
                  ? getProductImageUrl(
                      product.image,
                    )
                  : null;

              /*
               * اگر image قدیمی وجود داشته باشد
               * ولی داخل گالری نباشد، آن را اول گالری
               * قرار می‌دهیم.
               */

              const normalizedImages =
                mainImage &&
                !gallery.includes(
                  mainImage,
                )
                  ? [
                      mainImage,
                      ...gallery,
                    ]
                  : gallery;

              /*
               * اگر هیچ تصویری وجود نداشته باشد
               */
              if (
                normalizedImages.length ===
                0
              ) {
                normalizedImages.push(
                  "/products/product-placeholder.webp",
                );
              }

              return {
                ...product,

                /*
                 * تصویر اصلی
                 */
                image:
                  normalizedImages[0],

                /*
                 * گالری کامل
                 */
                images:
                  normalizedImages,
              };
            });

          /*
           * =================================================
           * Response
           * =================================================
           */

          return Response.json({
            success: true,
            products:
              normalizedProducts,
            count:
              normalizedProducts.length,
          });
        } catch (error) {
          console.error(
            "GET /api/products error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message:
                "خطا در دریافت محصولات",
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