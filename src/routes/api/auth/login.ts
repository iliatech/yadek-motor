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
 * Hash Password
 * =========================================================
 *
 * ثبت‌نام نیز از همین الگوریتم استفاده می‌کند.
 * بنابراین Login و Register باید دقیقاً
 * از یک روش Hash استفاده کنند.
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
 * Verify Password
 * =========================================================
 */

async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  const hashedPassword =
    await hashPassword(password);

  return (
    hashedPassword ===
    passwordHash
  );
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/auth/login",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          /*
           * =================================================
           * Read Request Body
           * =================================================
           */

          const body =
            await request.json();

          const phone =
            typeof body.phone ===
            "string"
              ? normalizeDigits(
                  body.phone.trim(),
                )
              : "";

          const password =
            typeof body.password ===
            "string"
              ? body.password
              : "";

          /*
           * =================================================
           * Validation
           * =================================================
           */

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

          /*
           * =================================================
           * Find User
           * =================================================
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

                passwordHash:
                  users.passwordHash,

                createdAt:
                  users.createdAt,
              })
              .from(users)
              .where(
                eq(
                  users.phone,
                  phone,
                ),
              )
              .limit(1);

          const user = result[0];

          /*
           * =================================================
           * User Not Found
           * =================================================
           */

          if (!user) {
            return jsonResponse(
              {
                success: false,
                error:
                  "شماره تماس یا رمز عبور اشتباه است.",
              },
              401,
            );
          }

          /*
           * =================================================
           * Verify Password
           * =================================================
           */

          const passwordValid =
            await verifyPassword(
              password,
              user.passwordHash,
            );

          if (!passwordValid) {
            return jsonResponse(
              {
                success: false,
                error:
                  "شماره تماس یا رمز عبور اشتباه است.",
              },
              401,
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
           * Success Response
           * =================================================
           */

          return jsonResponse(
            {
              success: true,

              authenticated: true,

              user: {
                id: user.id,

                firstName:
                  user.firstName,

                lastName:
                  user.lastName,

                phone: user.phone,

                email: user.email,

                createdAt:
                  user.createdAt,
              },

              session: {
                id: session.id,

                expiresAt:
                  session.expiresAt,
              },
            },
            200,
            {
              "Set-Cookie":
                cookieParts.join(
                  "; ",
                ),
            },
          );
        } catch (error) {
          /*
           * =================================================
           * Server Error
           * =================================================
           */

          console.error(
            "POST /api/auth/login error:",
            error,
          );

          return jsonResponse(
            {
              success: false,
              error:
                "خطا در ورود به حساب کاربری.",
            },
            500,
          );
        }
      },
    },
  },
});