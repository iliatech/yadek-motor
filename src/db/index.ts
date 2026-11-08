import { drizzle as drizzleD1 } from "drizzle-orm/d1";

import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";

import { env } from "cloudflare:workers";

/*
 * =========================================================
 * Local SQLite Database
 * =========================================================
 */

const createLocalDb =
  () =>
    drizzleLibsql({
      connection: {
        url: "file:./data.db",
      },
    });

/*
 * =========================================================
 * Database Type
 * =========================================================
 */

type Database =
  ReturnType<typeof createLocalDb>;

/*
 * =========================================================
 * Database
 * =========================================================
 *
 * D1 is created only when the Cloudflare binding exists.
 * Local SQLite is created only in local development.
 * =========================================================
 */

const getDatabase =
  (): Database => {
    if (
      typeof env !==
        "undefined" &&
      !!env.diamondmotor_db
    ) {
      return drizzleD1(
        env.diamondmotor_db,
      ) as unknown as Database;
    }

    return createLocalDb();
  };

export const db =
  getDatabase();