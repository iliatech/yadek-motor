import { eq, inArray } from "drizzle-orm";

import { db } from "../src/db";
import { orders } from "../src/db/schema";

async function main() {
  console.log("شروع اصلاح وضعیت سفارش‌ها...\n");

  /*
   * ==========================================
   * ابتدا سفارش‌های مشکل‌دار را پیدا می‌کنیم
   * ==========================================
   */

  const problematicOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(
      inArray(orders.status, [
        "pending_payment",
        "paid",
      ]),
    );

  if (problematicOrders.length === 0) {
    console.log(
      "هیچ سفارش دارای وضعیت قدیمی یا اشتباه پیدا نشد.",
    );

    return;
  }

  console.log("سفارش‌های پیدا شده:");

  console.table(problematicOrders);

  /*
   * ==========================================
   * pending_payment → pending
   *
   * وضعیت پرداخت دست‌نخورده می‌ماند.
   * ==========================================
   */

  await db
    .update(orders)
    .set({
      status: "pending",
      updatedAt: new Date().toISOString(),
    })
    .where(
      eq(
        orders.status,
        "pending_payment",
      ),
    );

  /*
   * ==========================================
   * paid → pending
   *
   * توجه:
   * paymentStatus = paid تغییر نمی‌کند.
   *
   * یعنی:
   *
   * status        = pending
   * paymentStatus = paid
   *
   * ==========================================
   */

  await db
    .update(orders)
    .set({
      status: "pending",
      updatedAt: new Date().toISOString(),
    })
    .where(
      eq(
        orders.status,
        "paid",
      ),
    );

  /*
   * ==========================================
   * بررسی نتیجه نهایی
   * ==========================================
   */

  const fixedOrders = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(
      inArray(orders.id, [
        ...problematicOrders.map(
          (order) => order.id,
        ),
      ]),
    );

  console.log(
    "\nوضعیت سفارش‌ها بعد از اصلاح:",
  );

  console.table(fixedOrders);

  console.log(
    "\nاصلاح وضعیت سفارش‌ها با موفقیت انجام شد.",
  );
}

main().catch((error) => {
  console.error(
    "\nخطا در اصلاح وضعیت سفارش‌ها:",
  );

  console.error(error);

  throw error;
});