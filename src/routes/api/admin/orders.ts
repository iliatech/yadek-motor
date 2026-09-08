import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  orderItems,
  orders,
  products,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

/*
 * =========================================================
 * وضعیت‌های مجاز سفارش
 * =========================================================
 */

const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus =
  (typeof ORDER_STATUSES)[number];

/*
 * =========================================================
 * وضعیت‌های مجاز پرداخت
 * =========================================================
 */

const PAYMENT_STATUSES = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
] as const;

type PaymentStatus =
  (typeof PAYMENT_STATUSES)[number];

/*
 * =========================================================
 * بررسی وضعیت سفارش
 * =========================================================
 */

function isOrderStatus(
  value: unknown,
): value is OrderStatus {
  return (
    typeof value === "string" &&
    ORDER_STATUSES.includes(
      value as OrderStatus,
    )
  );
}

/*
 * =========================================================
 * بررسی وضعیت پرداخت
 * =========================================================
 */

function isPaymentStatus(
  value: unknown,
): value is PaymentStatus {
  return (
    typeof value === "string" &&
    PAYMENT_STATUSES.includes(
      value as PaymentStatus,
    )
  );
}

/*
 * =========================================================
 * تبدیل مقدار به عدد صحیح مثبت
 * =========================================================
 */

function toPositiveInteger(
  value: unknown,
): number | null {
  const number = Number(value);

  if (
    !Number.isInteger(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/api/admin/orders",
)({
  server: {
    handlers: {
      /*
       * ===================================================
       * GET /api/admin/orders
       *
       * دریافت تمام سفارش‌ها
       *
       * امکان فیلتر:
       *
       * /api/admin/orders?status=pending
       * ===================================================
       */

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
          const url = new URL(
            request.url,
          );

          const statusParam =
            url.searchParams.get(
              "status",
            );

          /*
           * اگر status ارسال شده باشد،
           * حتماً باید یکی از وضعیت‌های معتبر باشد.
           */

          if (
            statusParam &&
            !isOrderStatus(statusParam)
          ) {
            return Response.json(
              {
                success: false,
                orders: [],
                count: 0,
                message:
                  "وضعیت سفارش معتبر نیست.",
                allowedStatuses:
                  ORDER_STATUSES,
              },
              {
                status: 400,
              },
            );
          }

          const status =
            statusParam as
              | OrderStatus
              | null;

          /*
           * -----------------------------------------------
           * دریافت سفارش‌ها
           * -----------------------------------------------
           */

          let dbOrders;

          if (status) {
            dbOrders = await db
              .select()
              .from(orders)
              .where(
                eq(
                  orders.status,
                  status,
                ),
              )
              .orderBy(
                orders.createdAt,
              );
          } else {
            dbOrders = await db
              .select()
              .from(orders)
              .orderBy(
                orders.createdAt,
              );
          }

          /*
           * اگر سفارشی وجود ندارد،
           * نیازی به Query دوم نیست.
           */

          if (dbOrders.length === 0) {
            return Response.json({
              success: true,
              orders: [],
              count: 0,
            });
          }

          /*
           * -----------------------------------------------
           * دریافت تمام آیتم‌های سفارش‌ها
           * -----------------------------------------------
           *
           * به‌جای اجرای یک Query برای هر سفارش،
           * تمام آیتم‌ها را در یک Query دریافت می‌کنیم.
           *
           * این کار مشکل N+1 Query را برطرف می‌کند.
           * -----------------------------------------------
           */

          const dbOrderItems =
            await db
              .select({
                id: orderItems.id,

                orderId:
                  orderItems.orderId,

                productId:
                  orderItems.productId,

                productName:
                  orderItems.productName,

                unitPrice:
                  orderItems.unitPrice,

                quantity:
                  orderItems.quantity,

                totalPrice:
                  orderItems.totalPrice,

                image:
                  products.image,
              })
              .from(orderItems)
              .leftJoin(
                products,
                eq(
                  orderItems.productId,
                  products.id,
                ),
              );

          /*
           * -----------------------------------------------
           * گروه‌بندی آیتم‌ها بر اساس orderId
           * -----------------------------------------------
           */

          const itemsByOrderId =
            new Map<
              number,
              typeof dbOrderItems
            >();

          for (const item of dbOrderItems) {
            const currentItems =
              itemsByOrderId.get(
                item.orderId,
              );

            if (currentItems) {
              currentItems.push(item);
            } else {
              itemsByOrderId.set(
                item.orderId,
                [item],
              );
            }
          }

          /*
           * -----------------------------------------------
           * ساخت پاسخ نهایی
           * -----------------------------------------------
           */

          const result =
            dbOrders.map((order) => {
              const items =
                itemsByOrderId.get(
                  order.id,
                ) ?? [];

              return {
                id: order.id,

                orderNumber:
                  order.orderNumber,

                accountId:
                  order.accountId,

                /*
                 * اطلاعات مشتری
                 */

                customer: {
                  firstName:
                    order.firstName,

                  lastName:
                    order.lastName,

                  phone:
                    order.customerPhone,

                  email:
                    order.customerEmail ??
                    null,
                },

                /*
                 * اطلاعات ارسال
                 */

                shipping: {
                  province:
                    order.province,

                  city:
                    order.city,

                  address:
                    order.address,

                  postalCode:
                    order.postalCode,
                },

                /*
                 * توضیحات
                 */

                description:
                  order.description ??
                  null,

                /*
                 * مبالغ
                 */

                subtotal:
                  Number(
                    order.subtotal,
                  ),

                shippingCost:
                  Number(
                    order.shippingCost,
                  ),

                total:
                  Number(order.total),

                /*
                 * وضعیت‌ها
                 */

                status:
                  order.status,

                paymentStatus:
                  order.paymentStatus,

                /*
                 * تاریخ‌ها
                 */

                createdAt:
                  order.createdAt,

                updatedAt:
                  order.updatedAt,

                /*
                 * محصولات سفارش
                 */

                items:
                  items.map(
                    (item) => ({
                      id:
                        item.id,

                      productId:
                        item.productId,

                      productName:
                        item.productName,

                      unitPrice:
                        Number(
                          item.unitPrice,
                        ),

                      quantity:
                        Number(
                          item.quantity,
                        ),

                      totalPrice:
                        Number(
                          item.totalPrice,
                        ),

                      image:
                        item.image ??
                        "",
                    }),
                  ),
              };
            });

          /*
           * -----------------------------------------------
           * پاسخ موفق
           * -----------------------------------------------
           */

          return Response.json({
            success: true,
            orders: result,
            count: result.length,
          });
        } catch (error) {
          console.error(
            "GET /api/admin/orders ERROR:",
            error,
          );

          return Response.json(
            {
              success: false,
              orders: [],
              count: 0,
              message:
                "خطا در دریافت سفارش‌ها.",
            },
            {
              status: 500,
            },
          );
        }
      },

      /*
       * ===================================================
       * PATCH /api/admin/orders
       *
       * تغییر وضعیت سفارش یا پرداخت
       * ===================================================
       */

      PATCH: async ({ request }) => {
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
           * -----------------------------------------------
           * دریافت Body
           * -----------------------------------------------
           */

          let body: {
            orderId?: unknown;
            status?: unknown;
            paymentStatus?: unknown;
          };

          try {
            body =
              (await request.json()) as typeof body;
          } catch {
            return Response.json(
              {
                success: false,
                message:
                  "داده ارسالی معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * -----------------------------------------------
           * اعتبارسنجی شناسه سفارش
           * -----------------------------------------------
           */

          const orderId =
            toPositiveInteger(
              body.orderId,
            );

          if (!orderId) {
            return Response.json(
              {
                success: false,
                message:
                  "شناسه سفارش معتبر نیست.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * -----------------------------------------------
           * بررسی وجود تغییر
           * -----------------------------------------------
           */

          const hasStatus =
            body.status !==
            undefined;

          const hasPaymentStatus =
            body.paymentStatus !==
            undefined;

          if (
            !hasStatus &&
            !hasPaymentStatus
          ) {
            return Response.json(
              {
                success: false,
                message:
                  "هیچ تغییری برای سفارش ارسال نشده است.",
              },
              {
                status: 400,
              },
            );
          }

          /*
           * -----------------------------------------------
           * اعتبارسنجی وضعیت سفارش
           * -----------------------------------------------
           */

          let newStatus:
            | OrderStatus
            | undefined;

          if (hasStatus) {
            if (
              !isOrderStatus(
                body.status,
              )
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "وضعیت سفارش معتبر نیست.",
                  allowedStatuses:
                    ORDER_STATUSES,
                },
                {
                  status: 400,
                },
              );
            }

            newStatus =
              body.status;
          }

          /*
           * -----------------------------------------------
           * اعتبارسنجی وضعیت پرداخت
           * -----------------------------------------------
           */

          let newPaymentStatus:
            | PaymentStatus
            | undefined;

          if (
            hasPaymentStatus
          ) {
            if (
              !isPaymentStatus(
                body.paymentStatus,
              )
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "وضعیت پرداخت معتبر نیست.",
                  allowedPaymentStatuses:
                    PAYMENT_STATUSES,
                },
                {
                  status: 400,
                },
              );
            }

            newPaymentStatus =
              body.paymentStatus;
          }

          /*
           * -----------------------------------------------
           * بررسی وجود سفارش
           * -----------------------------------------------
           */

          const existingOrders =
            await db
              .select({
                id: orders.id,

                orderNumber:
                  orders.orderNumber,

                status:
                  orders.status,

                paymentStatus:
                  orders.paymentStatus,
              })
              .from(orders)
              .where(
                eq(
                  orders.id,
                  orderId,
                ),
              )
              .limit(1);

          const existingOrder =
            existingOrders[0];

          if (!existingOrder) {
            return Response.json(
              {
                success: false,
                message:
                  "سفارش موردنظر پیدا نشد.",
              },
              {
                status: 404,
              },
            );
          }

          /*
           * -----------------------------------------------
           * آماده‌سازی اطلاعات Update
           * -----------------------------------------------
           */

          const updateData: {
            status?: OrderStatus;
            paymentStatus?: PaymentStatus;
            updatedAt: string;
          } = {
            updatedAt:
              new Date().toISOString(),
          };

          if (
            newStatus !==
            undefined
          ) {
            updateData.status =
              newStatus;
          }

          if (
            newPaymentStatus !==
            undefined
          ) {
            updateData.paymentStatus =
              newPaymentStatus;
          }

          /*
           * -----------------------------------------------
           * اعمال تغییرات
           * -----------------------------------------------
           */

          const updatedOrders =
            await db
              .update(orders)
              .set(updateData)
              .where(
                eq(
                  orders.id,
                  orderId,
                ),
              )
              .returning({
                id: orders.id,

                orderNumber:
                  orders.orderNumber,

                status:
                  orders.status,

                paymentStatus:
                  orders.paymentStatus,

                updatedAt:
                  orders.updatedAt,
              });

          const updatedOrder =
            updatedOrders[0];

          if (!updatedOrder) {
            return Response.json(
              {
                success: false,
                message:
                  "تغییر وضعیت سفارش انجام نشد.",
              },
              {
                status: 500,
              },
            );
          }

          /*
           * -----------------------------------------------
           * پاسخ موفق
           * -----------------------------------------------
           */

          return Response.json({
            success: true,

            order: {
              id:
                updatedOrder.id,

              orderNumber:
                updatedOrder.orderNumber,

              status:
                updatedOrder.status,

              paymentStatus:
                updatedOrder.paymentStatus,

              updatedAt:
                updatedOrder.updatedAt,
            },

            message:
              "وضعیت سفارش با موفقیت به‌روزرسانی شد.",
          });
        } catch (error) {
          console.error(
            "PATCH /api/admin/orders ERROR:",
            error,
          );

          return Response.json(
            {
              success: false,

              message:
                error instanceof Error
                  ? error.message
                  : "خطا در به‌روزرسانی سفارش.",
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