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
        "۰۱۲۳۴۵۶۷۸۹".indexOf(
          digit,
        ),
      ),
  );
}

function createUserId() {
  return `user_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 10)}`;
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
 * JSON Response
 * =========================================================
 */

function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders?: HeadersInit,
) {
  return new Response(
    JSON.stringify(data),
    {
      status: status,
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
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/auth/register",
)({
  server: {
    handlers: {
      POST: async ({
        request,
      }) => {
        try {
          /*
           * =================================================
           * Read Body
           * =================================================
           */

          const parsedBody =
            await request.json();

          if (
            !parsedBody ||
            typeof parsedBody !==
              "object" ||
            Array.isArray(
              parsedBody,
            )
          ) {
            return jsonResponse(
              {
                success: false,

                error:
                  "بدنه درخواست نامعتبر است.",
              },

              400,
            );
          }

          const body =
            parsedBody as Record<
              string,
              unknown
            >;

          /*
           * =================================================
           * Extract Fields
           * =================================================
           */

          const firstName =
            typeof body[
              "firstName"
            ] === "string"
              ? (
                  body[
                    "firstName"
                  ] as string
                ).trim()
              : "";

          const lastName =
            typeof body[
              "lastName"
            ] === "string"
              ? (
                  body[
                    "lastName"
                  ] as string
                ).trim()
              : "";

          const phone =
            typeof body[
              "phone"
            ] === "string"
              ? normalizeDigits(
                  (
                    body[
                      "phone"
                    ] as string
                  ).trim(),
                )
              : "";

          const email =
            typeof body[
              "email"
            ] === "string"
              ? (
                  body[
                    "email"
                  ] as string
                ).trim()
              : "";

          const password =
            typeof body[
              "password"
            ] === "string"
              ? (body[
                  "password"
                ] as string)
              : "";

          /*
           * =================================================
           * Required Fields Validation
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
           * Phone Validation
           * =================================================
           */

          const phoneRegex =
            /^09\d{9}$/;

          if (
            !phoneRegex.test(
              phone,
            )
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
           * Password Validation
           * =================================================
           */

          if (
            password.length < 8
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

          /*
           * =================================================
           * Email Validation
           * =================================================
           */

          if (email) {
            const emailRegex =
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
              !emailRegex.test(
                email,
              )
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
            await db[
              "select"
            ]({
              id: users["id"],
            })[
              "from"
            ](
              users,
            )[
              "where"
            ](
              eq(
                users["phone"],
                phone,
              ),
            )[
              "limit"
            ](1);

          if (
            existingUsers[
              "length"
            ] > 0
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
            await db[
              "insert"
            ](
              users,
            )[
              "values"
            ]({
              id: userId,

              firstName:
                firstName,

              lastName:
                lastName,

              phone: phone,

              email:
                email || null,

              passwordHash:
                passwordHash,
            })[
              "returning"
            ]({
              id: users["id"],

              firstName:
                users[
                  "firstName"
                ],

              lastName:
                users[
                  "lastName"
                ],

              phone:
                users["phone"],

              email:
                users["email"],

              createdAt:
                users[
                  "createdAt"
                ],
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
              user["id"],
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
              session["id"],
            )}`,

            `Path=${cookieOptions["path"]}`,

            `Max-Age=${cookieOptions["maxAge"]}`,

            `SameSite=${cookieOptions["sameSite"]}`,
          ];

          if (
            cookieOptions[
              "httpOnly"
            ]
          ) {
            cookieParts.push(
              "HttpOnly",
            );
          }

          if (
            cookieOptions[
              "secure"
            ]
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

              authenticated:
                true,

              user: user,

              session: {
                id: session[
                  "id"
                ],

                expiresAt:
                  session[
                    "expiresAt"
                  ],
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