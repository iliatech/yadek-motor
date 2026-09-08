import { drizzle } from "drizzle-orm/libsql";

const dbUrl = "file:./data.db";

export const db = drizzle({
  connection: {
    url: dbUrl,
  },
});