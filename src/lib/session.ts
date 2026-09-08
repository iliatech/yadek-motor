import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE_NAME =
  "yadak_motor_session";

const SESSION_DURATION_MS =
  1000 * 60 * 60 * 24 * 30;

function generateSessionId() {
  const random =
    Math.random()
      .toString(36)
      .substring(2, 15);

  const timestamp =
    Date.now().toString(36);

  return `sess_${timestamp}_${random}`;
}

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

export function getSessionCookieOptions() {
  return {
    httpOnly: true,

    secure: false,

    sameSite:
      "lax" as const,

    path: "/",

    maxAge:
      SESSION_DURATION_MS /
      1000,
  };
}