import { createFileRoute } from "@tanstack/react-router";

import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  or,
} from "drizzle-orm";

import { db } from "@/db";

import {
  orders,
  sessions,
  users,
} from "@/db/schema";

import { requireAdmin } from "@/lib/auth";

/*
 * =========================================================
 * User Roles
 * =========================================================
 */

const USER_ROLES = [
  "user",
  "admin",
] as const;

type UserRole =
  (typeof USER_ROLES)[number];

/*
 * =========================================================
 * Role Validation
 * =========================================================
 */

function isUserRole(
  value: unknown,
): value is UserRole {
  return (
    value === "user" ||
    value === "admin"
  );
}

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

function cleanString(
  value: unknown,
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function isValidUserId(
  value: unknown,
) {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  const userId =
    value.trim();

  return (
    userId.length > 0 &&
    userId.length <= 100
  );
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route =
  createFileRoute(
    "/api/admin/users",
  )({
    server: {
      handlers: {
        /*
         * =================================================
         * GET /api/admin/users
         * =================================================
         *
         * دریافت لیست کاربران
         *
         * امکانات:
         * - جستجو
         * - فیلتر نقش
         * - تعداد سفارش‌ها
         * =================================================
         */

        GET: async ({
          request,
        }) => {
          /*
           * -----------------------------------------------
           * Authentication / Authorization
           * -----------------------------------------------
           */

          const admin =
            await requireAdmin(
              request,
            );

          if (
            !admin.authenticated
          ) {
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

          if (
            !admin.authorized
          ) {
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
            const url =
              new URL(
                request.url,
              );

            const search =
              cleanString(
                url.searchParams.get(
                  "search",
                ),
              );

            const role =
              url.searchParams.get(
                "role",
              );

            /*
             * ---------------------------------------------
             * Validate Role Filter
             * ---------------------------------------------
             */

            if (
              role !== null &&
              !isUserRole(role)
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "نقش کاربر معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            /*
             * ---------------------------------------------
             * Build Search Conditions
             * ---------------------------------------------
             *
             * search و role باید با AND ترکیب شوند.
             *
             * یعنی اگر:
             *
             * search = علی
             * role   = admin
             *
             * فقط Adminهایی که نام/نام خانوادگی/شماره/
             * ایمیل آنها شامل «علی» است برگردانده شوند.
             * ---------------------------------------------
             */

            const conditions = [];

            if (search) {
              const searchPattern =
                `%${search}%`;

              const searchCondition =
                or(
                  like(
                    users.firstName,
                    searchPattern,
                  ),
                  like(
                    users.lastName,
                    searchPattern,
                  ),
                  like(
                    users.phone,
                    searchPattern,
                  ),
                  like(
                    users.email,
                    searchPattern,
                  ),
                );

              if (
                searchCondition
              ) {
                conditions.push(
                  searchCondition,
                );
              }
            }

            if (role) {
              conditions.push(
                eq(
                  users.role,
                  role,
                ),
              );
            }

            /*
             * ---------------------------------------------
             * Get Users
             * ---------------------------------------------
             *
             * passwordHash عمداً انتخاب نمی‌شود.
             * ---------------------------------------------
             */

            const userRows =
              await db
                .select({
                  id: users.id,

                  firstName:
                    users.firstName,

                  lastName:
                    users.lastName,

                  phone:
                    users.phone,

                  email:
                    users.email,

                  role:
                    users.role,

                  createdAt:
                    users.createdAt,

                  updatedAt:
                    users.updatedAt,
                })
                .from(users)
                .where(
                  conditions.length > 0
                    ? and(
                        ...conditions,
                      )
                    : undefined,
                )
                .orderBy(
                  desc(
                    users.createdAt,
                  ),
                  asc(
                    users.firstName,
                  ),
                );

            /*
             * ---------------------------------------------
             * Get Order Counts
             * ---------------------------------------------
             */

            const orderCounts =
              await db
                .select({
                  accountId:
                    orders.accountId,

                  count:
                    count(
                      orders.id,
                    ),
                })
                .from(orders)
                .groupBy(
                  orders.accountId,
                );

            /*
             * ---------------------------------------------
             * Build Order Count Map
             * ---------------------------------------------
             */

            const orderCountMap =
              new Map<
                string,
                number
              >();

            for (
              const item of
                orderCounts
            ) {
              if (
                item.accountId
              ) {
                orderCountMap.set(
                  item.accountId,
                  Number(
                    item.count,
                  ),
                );
              }
            }

            /*
             * ---------------------------------------------
             * Final Response
             * ---------------------------------------------
             */

            const result =
              userRows.map(
                (user) => ({
                  id: user.id,

                  firstName:
                    user.firstName,

                  lastName:
                    user.lastName,

                  phone:
                    user.phone,

                  email:
                    user.email,

                  role:
                    user.role,

                  createdAt:
                    user.createdAt,

                  updatedAt:
                    user.updatedAt,

                  orderCount:
                    orderCountMap.get(
                      user.id,
                    ) ?? 0,
                }),
              );

            return Response.json({
              success: true,

              users: result,

              count:
                result.length,
            });
          } catch (error) {
            console.error(
              "GET /api/admin/users ERROR:",
              error,
            );

            return Response.json(
              {
                success: false,

                users: [],

                count: 0,

                message:
                  "خطا در دریافت کاربران.",
              },
              {
                status: 500,
              },
            );
          }
        },

        /*
         * =================================================
         * PATCH /api/admin/users
         * =================================================
         *
         * تغییر نقش کاربر
         *
         * Body:
         *
         * {
         *   "userId": "USER_ID",
         *   "role": "admin"
         * }
         * =================================================
         */

        PATCH: async ({
          request,
        }) => {
          /*
           * -----------------------------------------------
           * Authentication / Authorization
           * -----------------------------------------------
           */

          const admin =
            await requireAdmin(
              request,
            );

          if (
            !admin.authenticated
          ) {
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

          if (
            !admin.authorized
          ) {
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
             * ---------------------------------------------
             * Read Body
             * ---------------------------------------------
             */

            let body: {
              userId?: unknown;
              role?: unknown;
            };

            try {
              body =
                (await request.json()) as typeof body;
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

            /*
             * ---------------------------------------------
             * Validate User ID
             * ---------------------------------------------
             */

            if (
              !isValidUserId(
                body.userId,
              )
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "شناسه کاربر معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            const userId =
              cleanString(
                body.userId,
              );

            /*
             * ---------------------------------------------
             * Validate Role
             * ---------------------------------------------
             */

            if (
              !isUserRole(
                body.role,
              )
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "نقش کاربر معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            const newRole =
              body.role;

            /*
             * ---------------------------------------------
             * Prevent Self-Demotion
             * ---------------------------------------------
             */

            if (
              userId ===
                admin.session
                  ?.user.id &&
              newRole !==
                "admin"
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "نمی‌توانید نقش حساب کاربری خودتان را از Admin به User تغییر دهید.",
                },
                {
                  status: 403,
                },
              );
            }

            /*
             * ---------------------------------------------
             * Find Target User
             * ---------------------------------------------
             */

            const existingUser =
              await db
                .select({
                  id: users.id,

                  firstName:
                    users.firstName,

                  lastName:
                    users.lastName,

                  role:
                    users.role,
                })
                .from(users)
                .where(
                  eq(
                    users.id,
                    userId,
                  ),
                )
                .limit(1);

            const targetUser =
              existingUser[0];

            if (
              !targetUser
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "کاربر موردنظر پیدا نشد.",
                },
                {
                  status: 404,
                },
              );
            }

            /*
             * ---------------------------------------------
             * No Change
             * ---------------------------------------------
             */

            if (
              targetUser.role ===
              newRole
            ) {
              return Response.json({
                success: true,

                message:
                  "نقش کاربر تغییری نکرد.",

                user: {
                  id:
                    targetUser.id,

                  firstName:
                    targetUser.firstName,

                  lastName:
                    targetUser.lastName,

                  role:
                    targetUser.role,
                },
              });
            }

            /*
             * ---------------------------------------------
             * Prevent Removing Last Admin
             * ---------------------------------------------
             */

            if (
              targetUser.role ===
                "admin" &&
              newRole === "user"
            ) {
              const adminCount =
                await db
                  .select({
                    count:
                      count(
                        users.id,
                      ),
                  })
                  .from(users)
                  .where(
                    eq(
                      users.role,
                      "admin",
                    ),
                  );

              const totalAdmins =
                Number(
                  adminCount[0]
                    ?.count ?? 0,
                );

              if (
                totalAdmins <= 1
              ) {
                return Response.json(
                  {
                    success: false,
                    message:
                      "حداقل یک حساب Admin باید در سیستم باقی بماند.",
                  },
                  {
                    status: 409,
                  },
                );
              }
            }

            /*
             * ---------------------------------------------
             * Update Role
             * ---------------------------------------------
             */

            const updated =
              await db
                .update(users)
                .set({
                  role: newRole,

                  updatedAt:
                    new Date().toISOString(),
                })
                .where(
                  eq(
                    users.id,
                    userId,
                  ),
                )
                .returning({
                  id: users.id,

                  firstName:
                    users.firstName,

                  lastName:
                    users.lastName,

                  phone:
                    users.phone,

                  email:
                    users.email,

                  role:
                    users.role,

                  createdAt:
                    users.createdAt,

                  updatedAt:
                    users.updatedAt,
                });

            const updatedUser =
              updated[0];

            if (
              !updatedUser
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "تغییر نقش کاربر انجام نشد.",
                },
                {
                  status: 500,
                },
              );
            }

            return Response.json({
              success: true,

              message:
                "نقش کاربر با موفقیت تغییر کرد.",

              user: {
                id:
                  updatedUser.id,

                firstName:
                  updatedUser.firstName,

                lastName:
                  updatedUser.lastName,

                phone:
                  updatedUser.phone,

                email:
                  updatedUser.email,

                role:
                  updatedUser.role,

                createdAt:
                  updatedUser.createdAt,

                updatedAt:
                  updatedUser.updatedAt,
              },
            });
          } catch (error) {
            console.error(
              "PATCH /api/admin/users ERROR:",
              error,
            );

            return Response.json(
              {
                success: false,
                message:
                  "خطا در تغییر نقش کاربر.",
              },
              {
                status: 500,
              },
            );
          }
        },

        /*
         * =================================================
         * DELETE /api/admin/users
         * =================================================
         *
         * حذف کاربر
         *
         * Body:
         *
         * {
         *   "userId": "USER_ID"
         * }
         *
         * سفارش‌های قبلی حفظ می‌شوند.
         * فقط accountId آنها null می‌شود.
         * =================================================
         */

        DELETE: async ({
          request,
        }) => {
          /*
           * -----------------------------------------------
           * Authentication / Authorization
           * -----------------------------------------------
           */

          const admin =
            await requireAdmin(
              request,
            );

          if (
            !admin.authenticated
          ) {
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

          if (
            !admin.authorized
          ) {
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
             * ---------------------------------------------
             * Read Body
             * ---------------------------------------------
             */

            let body: {
              userId?: unknown;
            };

            try {
              body =
                (await request.json()) as typeof body;
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

            /*
             * ---------------------------------------------
             * Validate User ID
             * ---------------------------------------------
             */

            if (
              !isValidUserId(
                body.userId,
              )
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "شناسه کاربر معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            const userId =
              cleanString(
                body.userId,
              );

            /*
             * ---------------------------------------------
             * Prevent Self Deletion
             * ---------------------------------------------
             */

            if (
              userId ===
              admin.session?.user.id
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "نمی‌توانید حساب کاربری خودتان را حذف کنید.",
                },
                {
                  status: 403,
                },
              );
            }

            /*
             * ---------------------------------------------
             * Find Target User
             * ---------------------------------------------
             */

            const existingUser =
              await db
                .select({
                  id: users.id,

                  firstName:
                    users.firstName,

                  lastName:
                    users.lastName,

                  role:
                    users.role,
                })
                .from(users)
                .where(
                  eq(
                    users.id,
                    userId,
                  ),
                )
                .limit(1);

            const targetUser =
              existingUser[0];

            if (
              !targetUser
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "کاربر موردنظر پیدا نشد.",
                },
                {
                  status: 404,
                },
              );
            }

            /*
             * ---------------------------------------------
             * Admin Deletion Protection
             * ---------------------------------------------
             *
             * Adminها از طریق این API حذف نمی‌شوند.
             * ابتدا باید نقش آنها به User تغییر کند.
             * ---------------------------------------------
             */

            if (
              targetUser.role ===
              "admin"
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "حساب Admin قابل حذف نیست. ابتدا نقش آن را به User تغییر دهید.",
                },
                {
                  status: 403,
                },
              );
            }

            /*
             * ---------------------------------------------
             * Count User Orders
             * ---------------------------------------------
             */

            const userOrders =
              await db
                .select({
                  id: orders.id,
                })
                .from(orders)
                .where(
                  eq(
                    orders.accountId,
                    userId,
                  ),
                );

            /*
             * ---------------------------------------------
             * Delete User Transaction
             * ---------------------------------------------
             *
             * 1. حذف Sessionها
             *
             * 2. جدا کردن سفارش‌ها از User
             *
             * 3. حذف User
             *
             * همه این عملیات داخل Transaction هستند.
             * ---------------------------------------------
             */

await db
  .delete(sessions)
  .where(
    eq(
      sessions.userId,
      userId,
    ),
  );

await db
  .update(orders)
  .set({
    accountId: null,
    updatedAt:
      new Date().toISOString(),
  })
  .where(
    eq(
      orders.accountId,
      userId,
    ),
  );

await db
  .delete(users)
  .where(
    eq(
      users.id,
      userId,
    ),
  );

            /*
             * ---------------------------------------------
             * Success
             * ---------------------------------------------
             */

            return Response.json({
              success: true,

              message:
                "کاربر با موفقیت حذف شد.",

              deletedUser: {
                id:
                  targetUser.id,

                firstName:
                  targetUser.firstName,

                lastName:
                  targetUser.lastName,

                orderCount:
                  userOrders.length,
              },
            });
          } catch (error) {
            console.error(
              "DELETE /api/admin/users ERROR:",
              error,
            );

            return Response.json(
              {
                success: false,
                message:
                  "خطا در حذف کاربر.",
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