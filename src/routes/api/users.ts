import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth";

export const Route = createFileRoute(
  "/api/users",
)({
  server: {
    handlers: {
      /*
       * =====================================================
       * GET /api/users
       * =====================================================
       *
       * دریافت اطلاعات کاربر فعلی
       *
       * این Route فقط برای کاربری است که وارد حساب شده.
       *
       * امکان دریافت اطلاعات کاربران دیگر با:
       *
       * ?id=
       * ?phone=
       *
       * عمداً حذف شده است.
       * =====================================================
       */

      GET: async ({ request }) => {
        try {
          /*
           * -------------------------------------------------
           * بررسی Session
           * -------------------------------------------------
           */

          const session =
            await getCurrentSession(
              request,
            );

          if (!session) {
            return Response.json(
              {
                success: false,
                user: null,
                message:
                  "برای دریافت اطلاعات کاربر باید وارد حساب شوید.",
              },
              {
                status: 401,
              },
            );
          }

          /*
           * -------------------------------------------------
           * دریافت اطلاعات کاربر فعلی
           * -------------------------------------------------
           *
           * passwordHash عمداً SELECT نمی‌شود.
           * -------------------------------------------------
           */

          const result =
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
                eq(
                  users.id,
                  session.user.id,
                ),
              )
              .limit(1);

          const user =
            result[0];

          /*
           * -------------------------------------------------
           * User Not Found
           * -------------------------------------------------
           */

          if (!user) {
            return Response.json(
              {
                success: false,
                user: null,
                message:
                  "کاربر پیدا نشد.",
              },
              {
                status: 404,
              },
            );
          }

          /*
           * -------------------------------------------------
           * Success
           * -------------------------------------------------
           */

          return Response.json({
            success: true,

            user: {
              id: user.id,

              firstName:
                user.firstName,

              lastName:
                user.lastName,

              phone:
                user.phone,

              email:
                user.email ?? "",

              role:
                user.role,

              createdAt:
                user.createdAt,

              updatedAt:
                user.updatedAt,
            },
          });
        } catch (error) {
          console.error(
            "GET /api/users ERROR:",
            error,
          );

          return Response.json(
            {
              success: false,
              user: null,
              message:
                "خطا در دریافت اطلاعات کاربر.",
            },
            {
              status: 500,
            },
          );
        }
      },

      /*
       * =====================================================
       * POST /api/users
       * =====================================================
       *
       * ایجاد کاربر از این مسیر مجاز نیست.
       *
       * ثبت‌نام باید فقط از مسیر:
       *
       * POST /api/auth/register
       *
       * انجام شود.
       * =====================================================
       */

      POST: async () => {
        return Response.json(
          {
            success: false,
            user: null,
            message:
              "ایجاد حساب کاربری از این مسیر مجاز نیست.",
          },
          {
            status: 405,
            headers: {
              Allow: "GET",
            },
          },
        );
      },
    },
  },
});