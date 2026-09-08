import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";

/*
 * =========================================================
 * Session Configuration
 * =========================================================
 */

export const SESSION_COOKIE_NAME =
  "yadak_motor_session";

const SESSION_DURATION_MS =
  1000 * 60 * 60 * 24 * 30;

/*
 * =========================================================
 * Generate Session ID
 * =========================================================
 */

function generateSessionId() {
  return `sess_${crypto.randomUUID()}`;
}

/*
 * =========================================================
 * Create Session
 * =========================================================
 */

export async function createSession(
  userId: string,
) {
  const sessionId =
    generateSessionId();

  const expiresAt =
    new Date(
      Date.now() +
        SESSION_DURATION_MS,
    ).toISOString();

  await db
    .insert(sessions)
    .values({
      id: sessionId,
      userId,
      expiresAt,
    });

  return {
    id: sessionId,
    userId,
    expiresAt,
  };
}

/*
 * =========================================================
 * Get Session
 * =========================================================
 */

export async function getSession(
  sessionId: string | null,
) {
  if (!sessionId) {
    return null;
  }

  const result =
    await db
      .select({
        sessionId:
          sessions.id,

        userId:
          sessions.userId,

        expiresAt:
          sessions.expiresAt,

        user: {
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
        },
      })
      .from(sessions)
      .innerJoin(
        users,
        eq(
          sessions.userId,
          users.id,
        ),
      )
      .where(
        eq(
          sessions.id,
          sessionId,
        ),
      )
      .limit(1);

  const session =
    result[0];

  if (!session) {
    return null;
  }

  /*
   * =======================================================
   * Check Expiration
   * =======================================================
   */

  if (
    new Date(
      session.expiresAt,
    ).getTime() <=
    Date.now()
  ) {
    await deleteSession(
      sessionId,
    );

    return null;
  }

  return session;
}

/*
 * =========================================================
 * Get Session ID From Request Cookie
 * =========================================================
 */

function getSessionIdFromRequest(
  request: Request,
): string | null {
  const cookieHeader =
    request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  for (
    const cookie of cookies
  ) {
    const [
      name,
      ...valueParts
    ] =
      cookie.trim().split("=");

    if (
      name ===
      SESSION_COOKIE_NAME
    ) {
      const value =
        valueParts.join("=");

      if (!value) {
        return null;
      }

      try {
        return decodeURIComponent(
          value,
        );
      } catch {
        return value;
      }
    }
  }

  return null;
}

/*
 * =========================================================
 * Get Current Session
 * =========================================================
 */

export async function getCurrentSession(
  request: Request,
) {
  const sessionId =
    getSessionIdFromRequest(
      request,
    );

  return getSession(
    sessionId,
  );
}

/*
 * =========================================================
 * Delete Session
 * =========================================================
 */

export async function deleteSession(
  sessionId: string | null,
) {
  if (!sessionId) {
    return;
  }

  await db
    .delete(sessions)
    .where(
      eq(
        sessions.id,
        sessionId,
      ),
    );
}

/*
 * =========================================================
 * Session Cookie Options
 * =========================================================
 */

export function getSessionCookieOptions() {
  return {
    httpOnly: true,

    secure:
      process.env["NODE_ENV"] ===
      "production",

    sameSite:
      "lax" as const,

    path: "/",

    maxAge:
      SESSION_DURATION_MS /
      1000,
  };
}

/*
 * =========================================================
 * Require Authenticated User
 * =========================================================
 *
 * هر کاربری که Session معتبر داشته باشد
 * می‌تواند از این تابع استفاده کند.
 *
 * برای:
 * - پرداخت
 * - سفارش
 * - پروفایل
 * - آدرس‌ها
 * - سایر APIهای مخصوص کاربر
 *
 * مناسب است.
 * =========================================================
 */

export async function requireAuth(
  request: Request,
) {
  const session =
    await getCurrentSession(
      request,
    );

  if (!session) {
    return {
      authenticated: false,
      session: null,
    };
  }

  return {
    authenticated: true,
    session,
  };
}

/*
 * =========================================================
 * Require Admin
 * =========================================================
 *
 * فقط کاربری که Session معتبر داشته باشد و
 * role او در دیتابیس برابر admin باشد، مجاز است.
 * =========================================================
 */

export async function requireAdmin(
  request: Request,
) {
  const session =
    await getCurrentSession(
      request,
    );

  if (!session) {
    return {
      authenticated: false,
      authorized: false,
      session: null,
    };
  }

  if (
    session.user.role !==
    "admin"
  ) {
    return {
      authenticated: true,
      authorized: false,
      session,
    };
  }

  return {
    authenticated: true,
    authorized: true,
    session,
  };
}