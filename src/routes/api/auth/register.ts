import { eq } from "drizzle-orm";
import { createFileRoute } from "@tanstack/react-router";

import { db } from "@/db";
import { users } from "@/db/schema";

import {
  createSession,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

/*
 * =========================================================
 * Constants
 * =========================================================
 */

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 20;
const MAX_EMAIL_LENGTH = 254;

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

function normalizeDigits(value: string) {
  return value.replace(
    /[۰-۹]/g,
    (digit) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit),
      ),
  );
}

function createUserId() {
  return `user_${crypto.randomUUID()}`;
}

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders: HeadersInit = {},
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        ...extraHeaders,
      },
    },
  );
}

/*
 * =========================================================
 * Password Hash
 * =========================================================
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
  "/api/auth/register",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
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
                    "داده‌های ارسالی معتبر نیستند.",
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
                  "داده‌های ارسالی معتبر نیستند.",
              },
              400,
            );
          }

          const firstName =
            typeof body.firstName ===
            "string"
              ? body.firstName.trim()
              : "";

          const lastName =
            typeof body.lastName ===
            "string"
              ? body.lastName.trim()
              : "";

          const phone =
            typeof body.phone ===
            "string"
              ? normalizeDigits(
                  body.phone.trim(),
                )
              : "";

          const email =
            typeof body.email ===
            "string"
              ? body.email.trim()
              : "";

          const password =
            typeof body.password ===
            "string"
              ? body.password
              : "";

          /*
           * =================================================
           * Basic Validation
           * =================================================
           */

          if (!firstName) {
            return jsonResponse(
              {
                success: false,
                error:
                  "نام خود را وارد کنید.",
              },
              400,
            );
          }

          if (
            firstName.length >
            MAX_NAME_LENGTH
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "نام واردشده بیش از حد طولانی است.",
              },
              400,
            );
          }

          if (!lastName) {
            return jsonResponse(
              {
                success: false,
                error:
                  "نام خانوادگی خود را وارد کنید.",
              },
              400,
            );
          }

          if (
            lastName.length >
            MAX_NAME_LENGTH
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "نام خانوادگی واردشده بیش از حد طولانی است.",
              },
              400,
            );
          }

          if (!phone) {
            return jsonResponse(
              {
                success: false,
                error:
                  "شماره تماس خود را وارد کنید.",
              },
              400,
            );
          }

          if (
            phone.length >
            MAX_PHONE_LENGTH
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "شماره تماس واردشده معتبر نیست.",
              },
              400,
            );
          }

          if (!password) {
            return jsonResponse(
              {
                success: false,
                error:
                  "رمز عبور خود را وارد کنید.",
              },
              400,
            );
          }

          if (
            password.length <
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
            password.length >
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
           * Phone Validation
           * =================================================
           */

          const phoneRegex =
            /^09\d{9}$/;

          if (
            !phoneRegex.test(phone)
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "شماره تماس واردشده معتبر نیست.",
              },
              400,
            );
          }

          /*
           * =================================================
           * Email Validation
           * =================================================
           */

          if (email) {
            if (
              email.length >
              MAX_EMAIL_LENGTH
            ) {
              return jsonResponse(
                {
                  success: false,
                  error:
                    "ایمیل واردشده بیش از حد طولانی است.",
                },
                400,
              );
            }

            const emailRegex =
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
              !emailRegex.test(email)
            ) {
              return jsonResponse(
                {
                  success: false,
                  error:
                    "ایمیل واردشده معتبر نیست.",
                },
                400,
              );
            }
          }

          /*
           * =================================================
           * Check Existing User
           * =================================================
           */

          const existingUsers =
            await db
              .select({
                id: users.id,
              })
              .from(users)
              .where(
                eq(
                  users.phone,
                  phone,
                ),
              )
              .limit(1);

          if (
            existingUsers.length > 0
          ) {
            return jsonResponse(
              {
                success: false,
                error:
                  "این شماره تماس قبلاً ثبت شده است.",
              },
              409,
            );
          }

          /*
           * =================================================
           * Hash Password
           * =================================================
           */

          const passwordHash =
            await hashPassword(
              password,
            );

          /*
           * =================================================
           * Create User
           * =================================================
           */

          const userId =
            createUserId();

          const insertedUsers =
            await db
              .insert(users)
              .values({
                id: userId,
                firstName,
                lastName,
                phone,
                email:
                  email || null,
                passwordHash,
              })
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
                createdAt:
                  users.createdAt,
              });

          const user =
            insertedUsers[0];

          if (!user) {
            throw new Error(
              "کاربر ایجاد نشد.",
            );
          }

          /*
           * =================================================
           * Create Session
           * =================================================
           */

          const session =
            await createSession(
              user.id,
            );

          /*
           * =================================================
           * Session Cookie
           * =================================================
           */

          const cookieOptions =
            getSessionCookieOptions();

          const cookieParts = [
            `${SESSION_COOKIE_NAME}=${encodeURIComponent(
              session.id,
            )}`,
            `Path=${cookieOptions.path}`,
            `Max-Age=${cookieOptions.maxAge}`,
            `SameSite=${cookieOptions.sameSite}`,
          ];

          if (
            cookieOptions.httpOnly
          ) {
            cookieParts.push(
              "HttpOnly",
            );
          }

          if (
            cookieOptions.secure
          ) {
            cookieParts.push(
              "Secure",
            );
          }

          /*
           * =================================================
           * Success
           * =================================================
           */

          return jsonResponse(
            {
              success: true,
              authenticated: true,
              user,
              session: {
                id: session.id,
                expiresAt:
                  session.expiresAt,
              },
            },
            201,
            {
              "Set-Cookie":
                cookieParts.join(
                  "; ",
                ),
            },
          );
        } catch (error) {
          console.error(
            "POST /api/auth/register error:",
            error,
          );

          return jsonResponse(
            {
              success: false,
              error:
                "خطا در ایجاد حساب کاربری.",
            },
            500,
          );
        }
      },
    },
  },
});