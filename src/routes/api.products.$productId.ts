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
   * مسیر public
   */
  if (value.startsWith("/products/")) {
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
           * دریافت گالری محصول
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
           * تبدیل تصاویر به URL
           */

          const gallery =
            sortedImages.map(
              (item) =>
                getProductImageUrl(
                  item.image,
                ),
            );

          /*
           * =================================================
           * تصویر اصلی قدیمی
           * =================================================
           */

          const mainImage =
            product.image
              ? getProductImageUrl(
                  product.image,
                )
              : null;

          /*
           * اگر image قدیمی در گالری نیست،
           * آن را به ابتدای گالری اضافه می‌کنیم.
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
           * اگر هیچ تصویری وجود ندارد
           */

          if (
            normalizedImages.length ===
            0
          ) {
            normalizedImages.push(
              "/products/product-placeholder.webp",
            );
          }

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
            image:
              normalizedImages[0],

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