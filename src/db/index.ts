import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

/*
 * =========================================================
 * Local SQLite Database Connection
 * =========================================================
 */

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(/^file:/, "")
  : "./data.db";

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export type AppDatabase = typeof db;
