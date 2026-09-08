import { createFileRoute } from "@tanstack/react-router";
import {
  and,
  asc,
  count,
  eq,
} from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  products,
} from "@/db/schema";

import { requireAdmin } from "@/lib/auth";

/*
 * =========================================================
 * Types
 * =========================================================
 */

type CategoryInput = {
  name?: unknown;
  slug?: unknown;
  description?: unknown;
  categoryId?: unknown;
};

/*
 * =========================================================
 * Constants
 * =========================================================
 */

const MAX_NAME_LENGTH = 100;
const MAX_SLUG_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 1000;

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(
      /[^\u0600-\u06FFa-zA-Z0-9\s-]/g,
      "",
    )
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function jsonResponse(
  data: unknown,
  status = 200,
) {
  return Response.json(data, {
    status,
  });
}

function jsonError(
  message: string,
  status = 400,
) {
  return jsonResponse(
    {
      success: false,
      message,
    },
    status,
  );
}

function parseCategoryId(
  value: unknown,
) {
  const categoryId = Number(value);

  if (
    !Number.isInteger(categoryId) ||
    categoryId <= 0
  ) {
    return null;
  }

  return categoryId;
}

async function parseJsonBody(
  request: Request,
): Promise<
  | {
      success: true;
      body: CategoryInput;
    }
  | {
      success: false;
      response: Response;
    }
> {
  try {
    const parsed =
      await request.json();

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return {
        success: false,
        response: jsonError(
          "داده ارسالی معتبر نیست.",
          400,
        ),
      };
    }

    return {
      success: true,
      body:
        parsed as CategoryInput,
    };
  } catch {
    return {
      success: false,
      response: jsonError(
        "داده ارسالی معتبر نیست.",
        400,
      ),
    };
  }
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/admin/categories",
)({
  server: {
    handlers: {
      /*
       * =====================================================
       * GET
       * دریافت تمام دسته‌بندی‌ها
       * =====================================================
       */

      GET: async ({ request }) => {
        try {
          const auth =
            await requireAdmin(
              request,
            );

          if (!auth.authenticated) {
            return jsonError(
              "برای انجام این کار باید وارد حساب کاربری شوید.",
              401,
            );
          }

          if (!auth.authorized) {
            return jsonError(
              "دسترسی غیرمجاز.",
              403,
            );
          }

          const rows =
            await db
              .select({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                description:
                  categories.description,
                createdAt:
                  categories.createdAt,
                productCount:
                  count(products.id),
              })
              .from(categories)
              .leftJoin(
                products,
                eq(
                  products.categoryId,
                  categories.id,
                ),
              )
              .groupBy(
                categories.id,
              )
              .orderBy(
                asc(categories.name),
              );

          return jsonResponse({
            success: true,
            categories: rows,
            count: rows.length,
          });
        } catch (error) {
          console.error(
            "GET /api/admin/categories error:",
            error,
          );

          return jsonError(
            "دریافت دسته‌بندی‌ها با خطا مواجه شد.",
            500,
          );
        }
      },

      /*
       * =====================================================
       * POST
       * ایجاد دسته‌بندی جدید
       * =====================================================
       */

      POST: async ({ request }) => {
        try {
          const auth =
            await requireAdmin(
              request,
            );

          if (!auth.authenticated) {
            return jsonError(
              "برای انجام این کار باید وارد حساب کاربری شوید.",
              401,
            );
          }

          if (!auth.authorized) {
            return jsonError(
              "دسترسی غیرمجاز.",
              403,
            );
          }

          const parsed =
            await parseJsonBody(
              request,
            );

          if (!parsed.success) {
            return parsed.response;
          }

          const body =
            parsed.body;

          const name =
            normalizeText(
              body.name,
            );

          const providedSlug =
            normalizeText(
              body.slug,
            );

          const description =
            normalizeText(
              body.description,
            ) || null;

          /*
           * اعتبارسنجی نام
           */

          if (!name) {
            return jsonError(
              "نام دسته‌بندی الزامی است.",
              400,
            );
          }

          if (
            name.length >
            MAX_NAME_LENGTH
          ) {
            return jsonError(
              `نام دسته‌بندی نمی‌تواند بیشتر از ${MAX_NAME_LENGTH} کاراکتر باشد.`,
              400,
            );
          }

          /*
           * ساخت و اعتبارسنجی slug
           */

          const slug =
            createSlug(
              providedSlug ||
                name,
            );

          if (!slug) {
            return jsonError(
              "Slug دسته‌بندی معتبر نیست.",
              400,
            );
          }

          if (
            slug.length >
            MAX_SLUG_LENGTH
          ) {
            return jsonError(
              `Slug نمی‌تواند بیشتر از ${MAX_SLUG_LENGTH} کاراکتر باشد.`,
              400,
            );
          }

          /*
           * اعتبارسنجی توضیحات
           */

          if (
            description &&
            description.length >
              MAX_DESCRIPTION_LENGTH
          ) {
            return jsonError(
              `توضیحات نمی‌تواند بیشتر از ${MAX_DESCRIPTION_LENGTH} کاراکتر باشد.`,
              400,
            );
          }

          /*
           * بررسی نام تکراری
           */

          const existingName =
            await db
              .select({
                id: categories.id,
              })
              .from(categories)
              .where(
                eq(
                  categories.name,
                  name,
                ),
              )
              .limit(1);

          if (
            existingName.length > 0
          ) {
            return jsonError(
              "دسته‌بندی با این نام قبلاً وجود دارد.",
              409,
            );
          }

          /*
           * بررسی slug تکراری
           */

          const existingSlug =
            await db
              .select({
                id: categories.id,
              })
              .from(categories)
              .where(
                eq(
                  categories.slug,
                  slug,
                ),
              )
              .limit(1);

          if (
            existingSlug.length > 0
          ) {
            return jsonError(
              "دسته‌بندی با این slug قبلاً وجود دارد.",
              409,
            );
          }

          /*
           * ایجاد دسته‌بندی
           */

          const inserted =
            await db
              .insert(categories)
              .values({
                name,
                slug,
                description,
              })
              .returning({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                description:
                  categories.description,
                createdAt:
                  categories.createdAt,
              });

          const createdCategory =
            inserted[0];

          if (!createdCategory) {
            return jsonError(
              "دسته‌بندی ایجاد نشد.",
              500,
            );
          }

          return jsonResponse(
            {
              success: true,
              message:
                "دسته‌بندی با موفقیت ایجاد شد.",
              category: {
                ...createdCategory,
                productCount: 0,
              },
            },
            201,
          );
        } catch (error) {
          console.error(
            "POST /api/admin/categories error:",
            error,
          );

          return jsonError(
            "ایجاد دسته‌بندی با خطا مواجه شد.",
            500,
          );
        }
      },

      /*
       * =====================================================
       * PATCH
       * ویرایش دسته‌بندی
       * =====================================================
       */

      PATCH: async ({ request }) => {
        try {
          const auth =
            await requireAdmin(
              request,
            );

          if (!auth.authenticated) {
            return jsonError(
              "برای انجام این کار باید وارد حساب کاربری شوید.",
              401,
            );
          }

          if (!auth.authorized) {
            return jsonError(
              "دسترسی غیرمجاز.",
              403,
            );
          }

          const parsed =
            await parseJsonBody(
              request,
            );

          if (!parsed.success) {
            return parsed.response;
          }

          const body =
            parsed.body;

          const categoryId =
            parseCategoryId(
              body.categoryId,
            );

          if (!categoryId) {
            return jsonError(
              "شناسه دسته‌بندی معتبر نیست.",
              400,
            );
          }

          /*
           * پیدا کردن دسته فعلی
           */

          const currentRows =
            await db
              .select({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                description:
                  categories.description,
              })
              .from(categories)
              .where(
                eq(
                  categories.id,
                  categoryId,
                ),
              )
              .limit(1);

          const currentCategory =
            currentRows[0];

          if (!currentCategory) {
            return jsonError(
              "دسته‌بندی موردنظر پیدا نشد.",
              404,
            );
          }

          /*
           * نام
           */

          const name =
            body.name === undefined
              ? currentCategory.name
              : normalizeText(
                  body.name,
                );

          if (!name) {
            return jsonError(
              "نام دسته‌بندی نمی‌تواند خالی باشد.",
              400,
            );
          }

          if (
            name.length >
            MAX_NAME_LENGTH
          ) {
            return jsonError(
              `نام دسته‌بندی نمی‌تواند بیشتر از ${MAX_NAME_LENGTH} کاراکتر باشد.`,
              400,
            );
          }

          /*
           * Slug
           */

          const rawSlug =
            body.slug === undefined
              ? currentCategory.slug
              : normalizeText(
                  body.slug,
                );

          const slug =
            createSlug(
              rawSlug || name,
            );

          if (!slug) {
            return jsonError(
              "Slug دسته‌بندی معتبر نیست.",
              400,
            );
          }

          if (
            slug.length >
            MAX_SLUG_LENGTH
          ) {
            return jsonError(
              `Slug نمی‌تواند بیشتر از ${MAX_SLUG_LENGTH} کاراکتر باشد.`,
              400,
            );
          }

          /*
           * Description
           */

          const description =
            body.description === undefined
              ? currentCategory.description
              : normalizeText(
                    body.description,
                  ) || null;

          if (
            description &&
            description.length >
              MAX_DESCRIPTION_LENGTH
          ) {
            return jsonError(
              `توضیحات نمی‌تواند بیشتر از ${MAX_DESCRIPTION_LENGTH} کاراکتر باشد.`,
              400,
            );
          }

          /*
           * بررسی نام تکراری
           */

          const duplicateName =
            await db
              .select({
                id: categories.id,
              })
              .from(categories)
              .where(
                and(
                  eq(
                    categories.name,
                    name,
                  ),
                ),
              )
              .limit(2);

          const nameConflict =
            duplicateName.some(
              (item) =>
                item.id !==
                categoryId,
            );

          if (nameConflict) {
            return jsonError(
              "دسته‌بندی دیگری با این نام وجود دارد.",
              409,
            );
          }

          /*
           * بررسی slug تکراری
           */

          const duplicateSlug =
            await db
              .select({
                id: categories.id,
              })
              .from(categories)
              .where(
                eq(
                  categories.slug,
                  slug,
                ),
              )
              .limit(2);

          const slugConflict =
            duplicateSlug.some(
              (item) =>
                item.id !==
                categoryId,
            );

          if (slugConflict) {
            return jsonError(
              "دسته‌بندی دیگری با این slug وجود دارد.",
              409,
            );
          }

          /*
           * بروزرسانی
           */

          const updatedRows =
            await db
              .update(categories)
              .set({
                name,
                slug,
                description,
              })
              .where(
                eq(
                  categories.id,
                  categoryId,
                ),
              )
              .returning({
                id: categories.id,
                name: categories.name,
                slug: categories.slug,
                description:
                  categories.description,
                createdAt:
                  categories.createdAt,
              });

          const updatedCategory =
            updatedRows[0];

          if (!updatedCategory) {
            return jsonError(
              "بروزرسانی دسته‌بندی انجام نشد.",
              500,
            );
          }

          /*
           * تعداد محصولات
           */

          const productCountRows =
            await db
              .select({
                count: count(
                  products.id,
                ),
              })
              .from(products)
              .where(
                eq(
                  products.categoryId,
                  categoryId,
                ),
              );

          const productCount =
            Number(
              productCountRows[0]?.count ??
                0,
            );

          return jsonResponse({
            success: true,
            message:
              "دسته‌بندی با موفقیت ویرایش شد.",
            category: {
              ...updatedCategory,
              productCount,
            },
          });
        } catch (error) {
          console.error(
            "PATCH /api/admin/categories error:",
            error,
          );

          return jsonError(
            "ویرایش دسته‌بندی با خطا مواجه شد.",
            500,
          );
        }
      },

      /*
       * =====================================================
       * DELETE
       * حذف دسته‌بندی
       * =====================================================
       */

      DELETE: async ({ request }) => {
        try {
          const auth =
            await requireAdmin(
              request,
            );

          if (!auth.authenticated) {
            return jsonError(
              "برای انجام این کار باید وارد حساب کاربری شوید.",
              401,
            );
          }

          if (!auth.authorized) {
            return jsonError(
              "دسترسی غیرمجاز.",
              403,
            );
          }

          const parsed =
            await parseJsonBody(
              request,
            );

          if (!parsed.success) {
            return parsed.response;
          }

          const categoryId =
            parseCategoryId(
              parsed.body.categoryId,
            );

          if (!categoryId) {
            return jsonError(
              "شناسه دسته‌بندی معتبر نیست.",
              400,
            );
          }

          /*
           * بررسی وجود دسته‌بندی
           */

          const currentRows =
            await db
              .select({
                id: categories.id,
                name: categories.name,
              })
              .from(categories)
              .where(
                eq(
                  categories.id,
                  categoryId,
                ),
              )
              .limit(1);

          const currentCategory =
            currentRows[0];

          if (!currentCategory) {
            return jsonError(
              "دسته‌بندی موردنظر پیدا نشد.",
              404,
            );
          }

          /*
           * جلوگیری از حذف دسته دارای محصول
           */

          const productRows =
            await db
              .select({
                id: products.id,
              })
              .from(products)
              .where(
                eq(
                  products.categoryId,
                  categoryId,
                ),
              )
              .limit(1);

          if (
            productRows.length > 0
          ) {
            return jsonError(
              "این دسته‌بندی دارای محصول است و نمی‌توان آن را حذف کرد. ابتدا محصولات این دسته را به دسته دیگری منتقل کنید.",
              409,
            );
          }

          /*
           * حذف دسته‌بندی
           */

          const deletedRows =
            await db
              .delete(categories)
              .where(
                eq(
                  categories.id,
                  categoryId,
                ),
              )
              .returning({
                id: categories.id,
              });

          if (
            deletedRows.length === 0
          ) {
            return jsonError(
              "حذف دسته‌بندی انجام نشد.",
              500,
            );
          }

          return jsonResponse({
            success: true,
            message:
              "دسته‌بندی با موفقیت حذف شد.",
            categoryId,
          });
        } catch (error) {
          console.error(
            "DELETE /api/admin/categories error:",
            error,
          );

          return jsonError(
            "حذف دسته‌بندی با خطا مواجه شد.",
            500,
          );
        }
      },
    },
  },
});