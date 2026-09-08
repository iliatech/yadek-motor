import { createFileRoute } from "@tanstack/react-router";

import {
  getSession,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

function getCookieValue(
  cookieHeader: string | null,
  name: string,
) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim());

  const target = cookies.find(
    (cookie) =>
      cookie.startsWith(`${name}=`),
  );

  if (!target) {
    return null;
  }

  return decodeURIComponent(
    target.slice(name.length + 1),
  );
}

export const Route = createFileRoute(
  "/api/auth/me",
)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const cookieHeader =
            request.headers.get("cookie");

          const sessionId =
            getCookieValue(
              cookieHeader,
              SESSION_COOKIE_NAME,
            );

          if (!sessionId) {
            return new Response(
              JSON.stringify({
                authenticated: false,
                user: null,
              }),
              {
                status: 200,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            );
          }

          const session =
            await getSession(sessionId);

          if (!session) {
            return new Response(
              JSON.stringify({
                authenticated: false,
                user: null,
              }),
              {
                status: 200,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            );
          }

          return new Response(
            JSON.stringify({
              authenticated: true,
              user: session.user,
              session: {
                id: session.sessionId,
                expiresAt:
                  session.expiresAt,
              },
            }),
            {
              status: 200,
              headers: {
                "Content-Type":
                  "application/json",
              },
            },
          );
        } catch (error) {
          console.error(
            "GET /api/auth/me error:",
            error,
          );

          return new Response(
            JSON.stringify({
              authenticated: false,
              user: null,
              error:
                "خطا در بررسی وضعیت ورود",
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