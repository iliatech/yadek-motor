import { createFileRoute } from "@tanstack/react-router";
import {
  count,
  desc,
  eq,
  sql,
  sum,
} from "drizzle-orm";

import { db } from "@/db";
import {
  categories,
  orderItems,
  orders,
  products,
  users,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  if (typeof value === "string") {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  return 0;
}

export const Route = createFileRoute(
  "/api/admin/dashboard",
)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const admin =
          await requireAdmin(request);

        if (!admin.authenticated) {
          return Response.json(
            {
              success: false,
              message:
                "برای دسترسی به این بخش باید وارد حساب شوید.",
            },
            {
              status: 401,
            },
          );
        }

        if (!admin.authorized) {
          return Response.json(
            {
              success: false,
              message:
                "شما دسترسی مدیریت ندارید.",
            },
            {
              status: 403,
            },
          );
        }

        try {
          /*
           * ==========================================
           * تعداد کاربران
           * ==========================================
           */

          const usersResult = await db
            .select({
              count: count(),
            })
            .from(users);

          /*
           * ==========================================
           * تعداد محصولات
           * ==========================================
           */

          const productsResult =
            await db
              .select({
                count: count(),
              })
              .from(products);

          /*
           * ==========================================
           * تعداد دسته‌بندی‌ها
           * ==========================================
           */

          const categoriesResult =
            await db
              .select({
                count: count(),
              })
              .from(categories);

          /*
           * ==========================================
           * تعداد کل سفارش‌ها
           * ==========================================
           */

          const ordersResult = await db
            .select({
              count: count(),
            })
            .from(orders);

          /*
           * ==========================================
           * سفارش‌های در انتظار پردازش
           * ==========================================
           */

          const pendingOrdersResult =
            await db
              .select({
                count: count(),
              })
              .from(orders)
              .where(
                eq(
                  orders.status,
                  "pending",
                ),
              );

          /*
           * ==========================================
           * سفارش‌های در حال آماده‌سازی
           * ==========================================
           */

          const processingOrdersResult =
            await db
              .select({
                count: count(),
              })
              .from(orders)
              .where(
                eq(
                  orders.status,
                  "processing",
                ),
              );

          /*
           * ==========================================
           * سفارش‌های ارسال‌شده
           * ==========================================
           */

          const shippedOrdersResult =
            await db
              .select({
                count: count(),
              })
              .from(orders)
              .where(
                eq(
                  orders.status,
                  "shipped",
                ),
              );

          /*
           * ==========================================
           * سفارش‌های تحویل‌شده
           * ==========================================
           */

          const deliveredOrdersResult =
            await db
              .select({
                count: count(),
              })
              .from(orders)
              .where(
                eq(
                  orders.status,
                  "delivered",
                ),
              );

          /*
           * ==========================================
           * سفارش‌های لغوشده
           * ==========================================
           */

          const cancelledOrdersResult =
            await db
              .select({
                count: count(),
              })
              .from(orders)
              .where(
                eq(
                  orders.status,
                  "cancelled",
                ),
              );

          /*
           * ==========================================
           * درآمد پرداخت‌شده
           *
           * فقط سفارش‌هایی که paymentStatus = paid
           * دارند به عنوان درآمد قطعی محسوب می‌شوند.
           * ==========================================
           */

          const paidRevenueResult =
            await db
              .select({
                total: sum(orders.total),
              })
              .from(orders)
              .where(
                eq(
                  orders.paymentStatus,
                  "paid",
                ),
              );

          /*
           * ==========================================
           * ارزش سفارش‌های پرداخت‌نشده
           * ==========================================
           */

          const unpaidRevenueResult =
            await db
              .select({
                total: sum(orders.total),
              })
              .from(orders)
              .where(
                eq(
                  orders.paymentStatus,
                  "unpaid",
                ),
              );

          /*
           * ==========================================
           * تعداد محصولات کم‌موجودی
           * ==========================================
           */

          const lowStockResult = await db
            .select({
              count: count(),
            })
            .from(products)
            .where(
              sql`${products.stock} > 0 AND ${products.stock} <= 5`,
            );

          /*
           * ==========================================
           * محصولات ناموجود
           * ==========================================
           */

          const outOfStockResult =
            await db
              .select({
                count: count(),
              })
              .from(products)
              .where(
                eq(
                  products.availability,
                  "out-of-stock",
                ),
              );

          /*
           * ==========================================
           * موجودی کل محصولات
           * ==========================================
           */

          const inventoryResult =
            await db
              .select({
                total: sum(products.stock),
              })
              .from(products);

          /*
           * ==========================================
           * آخرین سفارش‌ها
           * ==========================================
           */

          const recentOrders =
            await db
              .select({
                id: orders.id,
                orderNumber:
                  orders.orderNumber,
                firstName:
                  orders.firstName,
                lastName:
                  orders.lastName,
                customerPhone:
                  orders.customerPhone,
                total: orders.total,
                status: orders.status,
                paymentStatus:
                  orders.paymentStatus,
                createdAt:
                  orders.createdAt,
              })
              .from(orders)
              .orderBy(
                desc(orders.createdAt),
              )
              .limit(8);

          /*
           * ==========================================
           * محصولات پرفروش
           *
           * بر اساس تعداد فروش ثبت‌شده در order_items
           * ==========================================
           */

          const topProducts =
            await db
              .select({
                productId:
                  orderItems.productId,
                productName:
                  orderItems.productName,
                quantity:
                  sum(orderItems.quantity),
                revenue:
                  sum(orderItems.totalPrice),
              })
              .from(orderItems)
              .groupBy(
                orderItems.productId,
                orderItems.productName,
              )
              .orderBy(
                desc(
                  sql`SUM(${orderItems.quantity})`,
                ),
              )
              .limit(5);

          /*
           * ==========================================
           * آمار نهایی
           * ==========================================
           */

          const statistics = {
            users: toNumber(
              usersResult[0]?.count,
            ),

            products: toNumber(
              productsResult[0]?.count,
            ),

            categories: toNumber(
              categoriesResult[0]?.count,
            ),

            orders: toNumber(
              ordersResult[0]?.count,
            ),

            pendingOrders: toNumber(
              pendingOrdersResult[0]?.count,
            ),

            processingOrders: toNumber(
              processingOrdersResult[0]?.count,
            ),

            shippedOrders: toNumber(
              shippedOrdersResult[0]?.count,
            ),

            deliveredOrders: toNumber(
              deliveredOrdersResult[0]?.count,
            ),

            cancelledOrders: toNumber(
              cancelledOrdersResult[0]?.count,
            ),

            paidRevenue: toNumber(
              paidRevenueResult[0]?.total,
            ),

            unpaidRevenue: toNumber(
              unpaidRevenueResult[0]?.total,
            ),

            lowStockProducts: toNumber(
              lowStockResult[0]?.count,
            ),

            outOfStockProducts: toNumber(
              outOfStockResult[0]?.count,
            ),

            inventoryUnits: toNumber(
              inventoryResult[0]?.total,
            ),
          };

          return Response.json({
            success: true,
            statistics,
            recentOrders,
            topProducts,
          });
        } catch (error) {
          console.error(
            "GET /api/admin/dashboard error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message:
                "خطا در دریافت آمار داشبورد.",
            },
            {
              status: 500,
            },
          );
        }
      },
    },
  },
});