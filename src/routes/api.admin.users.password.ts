import { eq } from "drizzle-orm";

import { createFileRoute } from "@tanstack/react-router";

import { db } from "@/db";
import { users } from "@/db/schema";

import { requireAdmin } from "@/lib/auth";

/*
 * =========================================================
 * Configuration
 * =========================================================
 */

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const MAX_USER_ID_LENGTH = 100;

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

function jsonResponse(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
      },
    },
  );
}

function cleanString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isValidUserId(
  value: unknown,
) {
  if (
    typeof value !== "string"
  ) {
    return false;
  }

  const userId =
    value.trim();

  return (
    userId.length > 0 &&
    userId.length <=
      MAX_USER_ID_LENGTH
  );
}

/*
 * =========================================================
 * Password Hash
 * =========================================================
 *
 * این الگوریتم باید دقیقاً با Register و Login
 * یکسان باشد.
 */

async function hashPassword(
  password: string,
) {
  const encoder =
    new TextEncoder();

  const data =
    encoder.encode(password);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      data,
    );

  return Array.from(
    new Uint8Array(hashBuffer),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/admin/users/password",
)({
  server: {
    handlers: {
      /*
       * ===================================================
       * PATCH
       * تغییر رمز عبور کاربر توسط Admin
       * ===================================================
       */

      PATCH: async ({
        request,
      }) => {
        /*
         * =================================================
         * Check Admin
         * =================================================
         */

        try {
          const auth =
            await requireAdmin(
              request,
            );

          if (
            !auth.authenticated
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "برای انجام این کار باید وارد حساب کاربری شوید.",
              },
              401,
            );
          }

          if (!auth.authorized) {
            return jsonResponse(
              {
                success: false,
                error:
                  "دسترسی غیرمجاز.",
              },
              403,
            );
          }

          /*
           * =================================================
           * Read Body
           * =================================================
           */

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
              return jsonResponse(
                {
                  success: false,
                  error:
                    "داده ارسالی معتبر نیست.",
                },
                400,
              );
            }

            body =
              parsed as Record<
                string,
                unknown
              >;
          } catch {
            return jsonResponse(
              {
                success: false,
                error:
                  "داده ارسالی معتبر نیست.",
              },
              400,
            );
          }

          /*
           * =================================================
           * Extract Fields
           * =================================================
           */

          const userId =
            cleanString(
              body["userId"],
            );

          const newPassword =
            typeof body[
              "newPassword"
            ] === "string"
              ? body["newPassword"]
              : "";

          /*
           * =================================================
           * Validate User ID
           * =================================================
           */

          if (
            !isValidUserId(
              body["userId"],
            )
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "شناسه کاربر معتبر نیست.",
              },
              400,
            );
          }

          /*
           * =================================================
           * Validate Password
           * =================================================
           */

          if (!newPassword) {
            return jsonResponse(
              {
                success: false,
                error:
                  "رمز عبور جدید را وارد کنید.",
              },
              400,
            );
          }

          if (
            newPassword.length <
            MIN_PASSWORD_LENGTH
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "رمز عبور باید حداقل ۸ کاراکتر باشد.",
              },
              400,
            );
          }

          if (
            newPassword.length >
            MAX_PASSWORD_LENGTH
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "رمز عبور بیش از حد طولانی است.",
              },
              400,
            );
          }

          /*
           * =================================================
           * Find User
           * =================================================
           */

          const result =
            await db
              .select({
                id: users.id,
              })
              .from(users)
              .where(
                eq(
                  users.id,
                  userId,
                ),
              )
              .limit(1);

          const user =
            result[0];

          if (!user) {
            return jsonResponse(
              {
                success: false,
                error:
                  "کاربر موردنظر پیدا نشد.",
              },
              404,
            );
          }

          /*
           * =================================================
           * Hash New Password
           * =================================================
           */

          const passwordHash =
            await hashPassword(
              newPassword,
            );

          /*
           * =================================================
           * Update Password
           * =================================================
           */

          const updated =
            await db
              .update(users)
              .set({
                passwordHash,

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
              });

          /*
           * =================================================
           * Check Update
           * =================================================
           */

          if (!updated[0]) {
            return jsonResponse(
              {
                success: false,
                error:
                  "تغییر رمز عبور انجام نشد.",
              },
              500,
            );
          }

          /*
           * =================================================
           * Success
           * =================================================
           *
           * هرگز password یا passwordHash
           * در Response برگردانده نمی‌شود.
           */

          return jsonResponse(
            {
              success: true,
              message:
                "رمز عبور کاربر با موفقیت تغییر کرد.",
            },
            200,
          );
        } catch (error) {
          /*
           * =================================================
           * Server Error
           * =================================================
           */

          console.error(
            "PATCH /api/admin/users/password error:",
            error,
          );

          return jsonResponse(
            {
              success: false,
              error:
                "خطا در تغییر رمز عبور.",
            },
            500,
          );
        }
      },
    },
  },
});