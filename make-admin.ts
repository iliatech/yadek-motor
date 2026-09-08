import { eq } from "drizzle-orm";

import { db } from "./src/db";
import { users } from "./src/db/schema";

/*
 * =========================================================
 * تبدیل اعداد فارسی به انگلیسی
 * =========================================================
 */

function normalizeDigits(value: string): string {
  return value.replace(
    /[۰-۹]/g,
    (digit: string) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit),
      ),
  );
}

/*
 * =========================================================
 * شماره تلفن حسابی که باید Admin شود
 * =========================================================
 */

const ADMIN_PHONE = "09366654251";

/*
 * =========================================================
 * Main
 * =========================================================
 */

async function main() {
  const phone = normalizeDigits(
    ADMIN_PHONE.trim(),
  );

  console.log(
    "در حال پیدا کردن کاربر...",
  );

  const result = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      phone: users.phone,
      role: users.role,
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
   * =======================================================
   * کاربر پیدا نشد
   * =======================================================
   */

  if (!user) {
    console.error(
      "❌ کاربری با این شماره پیدا نشد:",
      phone,
    );

    return;
  }

  /*
   * =======================================================
   * کاربر از قبل Admin است
   * =======================================================
   */

  if (user.role === "admin") {
    console.log(
      "✅ این کاربر از قبل Admin است.",
    );

    console.log(
      `نام: ${user.firstName} ${user.lastName}`,
    );

    console.log(
      `شماره: ${user.phone}`,
    );

    console.log(
      `Role: ${user.role}`,
    );

    return;
  }

  /*
   * =======================================================
   * تبدیل User به Admin
   * =======================================================
   */

  await db
    .update(users)
    .set({
      role: "admin",
      updatedAt:
        new Date().toISOString(),
    })
    .where(
      eq(
        users.id,
        user.id,
      ),
    );

  /*
   * =======================================================
   * Success
   * =======================================================
   */

  console.log(
    "====================================",
  );

  console.log(
    "✅ کاربر با موفقیت Admin شد.",
  );

  console.log(
    `نام: ${user.firstName} ${user.lastName}`,
  );

  console.log(
    `شماره: ${user.phone}`,
  );

  console.log(
    "Role: admin",
  );

  console.log(
    "====================================",
  );
}

/*
 * =========================================================
 * Run
 * =========================================================
 */

main().catch((error) => {
  console.error(
    "❌ خطا در تبدیل کاربر به Admin:",
    error,
  );

});