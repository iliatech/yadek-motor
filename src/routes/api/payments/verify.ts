import { createFileRoute } from "@tanstack/react-router";

import {
  and,
  eq,
  gte,
  sql,
} from "drizzle-orm";

import { db } from "@/db";

import {
  orderItems,
  orders,
  payments,
  products,
} from "@/db/schema";

import { requireAuth } from "@/lib/auth";

import {
  getPaymentProvider,
  type PaymentProviderName,
} from "@/lib/payment";

/*
 * =========================================================
 * Types
 * =========================================================
 */

class PaymentVerifyError extends Error {
  status: number;

  constructor(
    message: string,
    status = 400,
  ) {
    super(message);
    this.name =
      "PaymentVerifyError";
    this.status = status;
  }
}

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

function normalizeDigits(
  value: string,
) {
  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(
            digit,
          ),
        ),
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(
            digit,
          ),
        ),
    );
}

function parsePositiveInteger(
  value: unknown,
  fieldName: string,
) {
  const normalized =
    normalizeDigits(
      String(value ?? "").trim(),
    );

  const parsed =
    Number(normalized);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new PaymentVerifyError(
      `${fieldName} نامعتبر است.`,
      400,
    );
  }

  return parsed;
}

function isPaymentProviderName(
  value: unknown,
): value is PaymentProviderName {
  return (
    value === "mock" ||
    value === "zarinpal" ||
    value === "idpay" ||
    value === "zibal"
  );
}

async function parseJsonBody(
  request: Request,
) {
  try {
    return await request.json();
  } catch {
    throw new PaymentVerifyError(
      "بدنه درخواست نامعتبر است.",
      400,
    );
  }
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route =
  createFileRoute(
    "/api/payments/verify",
  )({
    server: {
      handlers: {
        /*
         * ===================================================
         * POST /api/payments/verify
         * ===================================================
         */

        POST: async ({
          request,
        }) => {
          try {
            /*
             * -------------------------------------------------
             * 1. Authentication
             * -------------------------------------------------
             */

            const auth =
              await requireAuth(
                request,
              );

            if (
              !auth.authenticated ||
              !auth.session
            ) {
              throw new PaymentVerifyError(
                "برای تأیید پرداخت باید وارد حساب کاربری شوید.",
                401,
              );
            }

            const userId =
              auth.session.userId;

            /*
             * -------------------------------------------------
             * 2. Parse request
             * -------------------------------------------------
             */

            const body =
              await parseJsonBody(
                request,
              );

            const paymentId =
              parsePositiveInteger(
                body?.paymentId,
                "شناسه پرداخت",
              );

            /*
             * -------------------------------------------------
             * 3. Find payment
             * -------------------------------------------------
             */

            const payment =
              await db
                .select({
                  id: payments.id,
                  orderId:
                    payments.orderId,
                  amount:
                    payments.amount,
                  status:
                    payments.status,
                  provider:
                    payments.provider,
                  authority:
                    payments.authority,
                  referenceId:
                    payments.referenceId,
                  trackingCode:
                    payments.trackingCode,
                  description:
                    payments.description,
                  createdAt:
                    payments.createdAt,
                  updatedAt:
                    payments.updatedAt,
                })
                .from(payments)
                .where(
                  eq(
                    payments.id,
                    paymentId,
                  ),
                )
                .limit(1)
                .then(
                  (rows) =>
                    rows[0],
                );

            if (!payment) {
              throw new PaymentVerifyError(
                "پرداخت موردنظر پیدا نشد.",
                404,
              );
            }

            /*
             * -------------------------------------------------
             * 4. Find related order
             * -------------------------------------------------
             */

            const order =
              await db
                .select({
                  id: orders.id,
                  orderNumber:
                    orders.orderNumber,
                  accountId:
                    orders.accountId,
                  total:
                    orders.total,
                  status:
                    orders.status,
                  paymentStatus:
                    orders.paymentStatus,
                })
                .from(orders)
                .where(
                  eq(
                    orders.id,
                    payment.orderId,
                  ),
                )
                .limit(1)
                .then(
                  (rows) =>
                    rows[0],
                );

            if (!order) {
              throw new PaymentVerifyError(
                "سفارش مرتبط با پرداخت پیدا نشد.",
                404,
              );
            }

            /*
             * -------------------------------------------------
             * 5. Ownership check
             * -------------------------------------------------
             */

            if (
              order.accountId !==
              userId
            ) {
              throw new PaymentVerifyError(
                "شما اجازه دسترسی به این پرداخت را ندارید.",
                403,
              );
            }

            /*
             * -------------------------------------------------
             * 6. Already paid
             * -------------------------------------------------
             */

            if (
              payment.status ===
                "paid" &&
              order.paymentStatus ===
                "paid"
            ) {
              return Response.json({
                success: true,
                alreadyPaid: true,
                payment,
                order,
              });
            }

            /*
             * -------------------------------------------------
             * 7. Payment must be pending
             * -------------------------------------------------
             */

            if (
              payment.status !==
              "pending"
            ) {
              throw new PaymentVerifyError(
                "این پرداخت در وضعیت قابل تأیید نیست.",
                400,
              );
            }

            /*
             * -------------------------------------------------
             * 8. Validate amount
             * -------------------------------------------------
             */

            const paymentAmount =
              Number(
                payment.amount,
              );

            const orderTotal =
              Number(order.total);

            if (
              !Number.isFinite(
                paymentAmount,
              ) ||
              paymentAmount <= 0
            ) {
              throw new PaymentVerifyError(
                "مبلغ پرداخت نامعتبر است.",
                400,
              );
            }

            if (
              !Number.isFinite(
                orderTotal,
              ) ||
              orderTotal <= 0
            ) {
              throw new PaymentVerifyError(
                "مبلغ سفارش نامعتبر است.",
                400,
              );
            }

            if (
              paymentAmount !==
              orderTotal
            ) {
              throw new PaymentVerifyError(
                "مبلغ پرداخت با مبلغ سفارش مطابقت ندارد.",
                400,
              );
            }

            /*
             * -------------------------------------------------
             * 9. Validate provider
             * -------------------------------------------------
             */

            if (
              !isPaymentProviderName(
                payment.provider,
              )
            ) {
              throw new PaymentVerifyError(
                "درگاه پرداخت نامعتبر است.",
                400,
              );
            }

            /*
             * -------------------------------------------------
             * 10. Get provider
             * -------------------------------------------------
             */

            const provider =
              getPaymentProvider(
                payment.provider,
              );

            /*
             * -------------------------------------------------
             * 11. Verify with provider
             *
             * تماس با درگاه خارج از transaction
             * انجام می‌شود.
             * -------------------------------------------------
             */

            let verificationResult;

            try {
              verificationResult =
                await provider.verifyPayment(
                  {
                    paymentId:
                      payment.id,

                    authority:
                      payment.authority,

                    amount:
                      paymentAmount,
                  },
                );
            } catch (error) {
              console.error(
                "[PAYMENT_VERIFY_PROVIDER_ERROR]",
                error,
              );

              throw new PaymentVerifyError(
                "خطا در ارتباط با درگاه پرداخت.",
                502,
              );
            }

            /*
             * -------------------------------------------------
             * 12. Provider rejected payment
             * -------------------------------------------------
             */

            if (
              !verificationResult.success
            ) {
              await db
                .update(payments)
                .set({
                  status: "failed",

                  updatedAt:
                    new Date().toISOString(),
                })
                .where(
                  and(
                    eq(
                      payments.id,
                      payment.id,
                    ),
                    eq(
                      payments.status,
                      "pending",
                    ),
                  ),
                );

              throw new PaymentVerifyError(
                verificationResult.message ??
                  "پرداخت توسط درگاه تأیید نشد.",
                400,
              );
            }

            /*
             * =================================================
             * 13. DATABASE TRANSACTION
             * =================================================
             *
             * این بخش اتمیک است:
             *
             * 1. بررسی دوباره payment
             * 2. خواندن orderItems
             * 3. کاهش stock
             * 4. تنظیم availability
             * 5. paid کردن payment
             * 6. paid کردن order
             *
             * اگر هر مرحله شکست بخورد،
             * کل transaction rollback می‌شود.
             * =================================================
             */

            const result =
              await db.transaction(
                async (tx) => {
                  /*
                   * -------------------------------------------
                   * 13.1 Re-check payment
                   * -------------------------------------------
                   */

                  const currentPayment =
                    await tx
                      .select({
                        id:
                          payments.id,

                        orderId:
                          payments.orderId,

                        amount:
                          payments.amount,

                        status:
                          payments.status,

                        provider:
                          payments.provider,

                        authority:
                          payments.authority,

                        referenceId:
                          payments.referenceId,

                        trackingCode:
                          payments.trackingCode,

                        description:
                          payments.description,

                        createdAt:
                          payments.createdAt,

                        updatedAt:
                          payments.updatedAt,
                      })
                      .from(
                        payments,
                      )
                      .where(
                        eq(
                          payments.id,
                          payment.id,
                        ),
                      )
                      .limit(1)
                      .then(
                        (rows) =>
                          rows[0],
                      );

                  if (
                    !currentPayment
                  ) {
                    throw new PaymentVerifyError(
                      "پرداخت پیدا نشد.",
                      404,
                    );
                  }

                  /*
                   * اگر قبلاً paid شده،
                   * دوباره موجودی کم نمی‌شود.
                   */

                  if (
                    currentPayment.status ===
                    "paid"
                  ) {
                    const currentOrder =
                      await tx
                        .select({
                          id:
                            orders.id,

                          orderNumber:
                            orders.orderNumber,

                          accountId:
                            orders.accountId,

                          total:
                            orders.total,

                          status:
                            orders.status,

                          paymentStatus:
                            orders.paymentStatus,
                        })
                        .from(
                          orders,
                        )
                        .where(
                          eq(
                            orders.id,
                            payment.orderId,
                          ),
                        )
                        .limit(1)
                        .then(
                          (rows) =>
                            rows[0],
                        );

                    return {
                      alreadyPaid:
                        true,

                      payment:
                        currentPayment,

                      order:
                        currentOrder,
                    };
                  }

                  if (
                    currentPayment.status !==
                    "pending"
                  ) {
                    throw new PaymentVerifyError(
                      "وضعیت پرداخت دیگر قابل تکمیل نیست.",
                      400,
                    );
                  }

                  /*
                   * -------------------------------------------
                   * 13.2 Get order items
                   * -------------------------------------------
                   */

                  const items =
                    await tx
                      .select({
                        id:
                          orderItems.id,

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
                      })
                      .from(
                        orderItems,
                      )
                      .where(
                        eq(
                          orderItems.orderId,
                          payment.orderId,
                        ),
                      );

                  if (
                    items.length === 0
                  ) {
                    throw new PaymentVerifyError(
                      "سفارش هیچ قلمی ندارد.",
                      400,
                    );
                  }

                  /*
                   * -------------------------------------------
                   * 13.3 Validate quantities
                   * -------------------------------------------
                   */

                  for (
                    const item of items
                  ) {
                    if (
                      !Number.isInteger(
                        item.quantity,
                      ) ||
                      item.quantity <= 0
                    ) {
                      throw new PaymentVerifyError(
                        `تعداد محصول «${item.productName}» نامعتبر است.`,
                        400,
                      );
                    }
                  }

                  /*
                   * -------------------------------------------
                   * 13.4 Decrement stock
                   * -------------------------------------------
                   *
                   * stock >= quantity
                   *
                   * بنابراین موجودی هیچ‌وقت منفی نمی‌شود.
                   */

                  for (
                    const item of items
                  ) {
                    const updatedProducts =
                      await tx
                        .update(
                          products,
                        )
                        .set({
                          stock:
                            sql`${products.stock} - ${item.quantity}`,

                          updatedAt:
                            new Date().toISOString(),
                        })
                        .where(
                          and(
                            eq(
                              products.id,
                              item.productId,
                            ),

                            gte(
                              products.stock,
                              item.quantity,
                            ),
                          ),
                        )
                        .returning({
                          id:
                            products.id,

                          stock:
                            products.stock,
                        });

                    if (
                      updatedProducts.length !==
                      1
                    ) {
                      throw new PaymentVerifyError(
                        `موجودی محصول «${item.productName}» برای تکمیل سفارش کافی نیست.`,
                        409,
                      );
                    }

                    /*
                     * جلوگیری از خطای
                     * noUncheckedIndexedAccess
                     */

                    const updatedProduct =
                      updatedProducts[0];

                    if (
                      !updatedProduct
                    ) {
                      throw new PaymentVerifyError(
                        `محصول «${item.productName}» پس از کاهش موجودی پیدا نشد.`,
                        500,
                      );
                    }

                    /*
                     * -----------------------------------------
                     * 13.5 Update availability
                     * -----------------------------------------
                     */

                    await tx
                      .update(
                        products,
                      )
                      .set({
                        availability:
                          updatedProduct.stock >
                          0
                            ? "in-stock"
                            : "out-of-stock",

                        updatedAt:
                          new Date().toISOString(),
                      })
                      .where(
                        eq(
                          products.id,
                          item.productId,
                        ),
                      );
                  }

                  /*
                   * -------------------------------------------
                   * 13.6 Mark payment as paid
                   * -------------------------------------------
                   */

                  const paidPayments =
                    await tx
                      .update(
                        payments,
                      )
                      .set({
                        status:
                          "paid",

                        referenceId:
                          verificationResult.referenceId ??
                          null,

                        trackingCode:
                          verificationResult.trackingCode ??
                          null,

                        updatedAt:
                          new Date().toISOString(),
                      })
                      .where(
                        and(
                          eq(
                            payments.id,
                            payment.id,
                          ),

                          eq(
                            payments.status,
                            "pending",
                          ),
                        ),
                      )
                      .returning({
                        id:
                          payments.id,

                        orderId:
                          payments.orderId,

                        amount:
                          payments.amount,

                        status:
                          payments.status,

                        provider:
                          payments.provider,

                        authority:
                          payments.authority,

                        referenceId:
                          payments.referenceId,

                        trackingCode:
                          payments.trackingCode,

                        description:
                          payments.description,

                        createdAt:
                          payments.createdAt,

                        updatedAt:
                          payments.updatedAt,
                      });

                  if (
                    paidPayments.length !==
                    1
                  ) {
                    throw new PaymentVerifyError(
                      "وضعیت پرداخت همزمان تغییر کرده است.",
                      409,
                    );
                  }

                  const paidPayment =
                    paidPayments[0];

                  if (
                    !paidPayment
                  ) {
                    throw new PaymentVerifyError(
                      "پرداخت پس از به‌روزرسانی پیدا نشد.",
                      500,
                    );
                  }

                  /*
                   * -------------------------------------------
                   * 13.7 Mark order as paid
                   * -------------------------------------------
                   */

                  const paidOrders =
                    await tx
                      .update(
                        orders,
                      )
                      .set({
                        status:
                          "paid",

                        paymentStatus:
                          "paid",

                        updatedAt:
                          new Date().toISOString(),
                      })
                      .where(
                        and(
                          eq(
                            orders.id,
                            payment.orderId,
                          ),

                          eq(
                            orders.paymentStatus,
                            "unpaid",
                          ),
                        ),
                      )
                      .returning({
                        id:
                          orders.id,

                        orderNumber:
                          orders.orderNumber,

                        accountId:
                          orders.accountId,

                        total:
                          orders.total,

                        status:
                          orders.status,

                        paymentStatus:
                          orders.paymentStatus,

                        createdAt:
                          orders.createdAt,

                        updatedAt:
                          orders.updatedAt,
                      });

                  if (
                    paidOrders.length !==
                    1
                  ) {
                    throw new PaymentVerifyError(
                      "وضعیت سفارش قابل تغییر نیست.",
                      409,
                    );
                  }

                  const paidOrder =
                    paidOrders[0];

                  if (
                    !paidOrder
                  ) {
                    throw new PaymentVerifyError(
                      "سفارش پس از به‌روزرسانی پیدا نشد.",
                      500,
                    );
                  }

                  /*
                   * -------------------------------------------
                   * 13.8 Transaction result
                   * -------------------------------------------
                   */

                  return {
                    alreadyPaid:
                      false,

                    payment:
                      paidPayment,

                    order:
                      paidOrder,
                  };
                },
              );

            /*
             * -------------------------------------------------
             * 14. Success response
             * -------------------------------------------------
             */

            return Response.json({
              success: true,

              alreadyPaid:
                result.alreadyPaid,

              payment:
                result.payment,

              order:
                result.order,
            });
          } catch (error) {
            /*
             * -------------------------------------------------
             * Known application error
             * -------------------------------------------------
             */

            if (
              error instanceof
              PaymentVerifyError
            ) {
              return Response.json(
                {
                  success: false,

                  error:
                    error.message,
                },
                {
                  status:
                    error.status,
                },
              );
            }

            /*
             * -------------------------------------------------
             * Unexpected error
             * -------------------------------------------------
             */

            console.error(
              "[PAYMENT_VERIFY_ERROR]",
              error,
            );

            return Response.json(
              {
                success: false,

                error:
                  "خطای داخلی سرور هنگام تأیید پرداخت.",
              },
              {
                status: 500,
              },
            );
          }
        },

        /*
         * ===================================================
         * GET /api/payments/verify
         * ===================================================
         */

        GET: async () => {
          return new Response(
            JSON.stringify({
              success: false,

              error:
                "این endpoint فقط با POST قابل استفاده است.",
            }),
            {
              status: 405,

              headers: {
                "Content-Type":
                  "application/json",

                Allow: "POST",
              },
            },
          );
        },
      },
    },
  });