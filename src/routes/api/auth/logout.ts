import { createFileRoute } from "@tanstack/react-router";

import {
  deleteSession,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export const Route = createFileRoute("/api/auth/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const cookieHeader =
            request.headers.get("cookie") ?? "";

          const sessionCookie = cookieHeader
            .split(";")
            .map((cookie) => cookie.trim())
            .find((cookie) =>
              cookie.startsWith(
                `${SESSION_COOKIE_NAME}=`,
              ),
            );

          const sessionId = sessionCookie
            ? decodeURIComponent(
                sessionCookie.substring(
                  `${SESSION_COOKIE_NAME}=`.length,
                ),
              )
            : null;

          if (sessionId) {
            await deleteSession(sessionId);
          }

          const cookieOptions =
            getSessionCookieOptions();

          const expiredCookie = [
            `${SESSION_COOKIE_NAME}=`,
            `Path=${cookieOptions.path}`,
            "Max-Age=0",
            `SameSite=${cookieOptions.sameSite}`,
          ];

          if (cookieOptions.httpOnly) {
            expiredCookie.push("HttpOnly");
          }

          if (cookieOptions.secure) {
            expiredCookie.push("Secure");
          }

          return new Response(
            JSON.stringify({
              success: true,
              authenticated: false,
            }),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
                "Set-Cookie":
                  expiredCookie.join("; "),
              },
            },
          );
        } catch (error) {
          console.error(
            "POST /api/auth/logout error:",
            error,
          );

          return new Response(
            JSON.stringify({
              success: false,
              error:
                "خطا در خروج از حساب کاربری.",
            }),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          );
        }
      },
    },
  },
});