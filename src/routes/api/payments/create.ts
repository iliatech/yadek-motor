import { eq } from "drizzle-orm";
import { createFileRoute } from "@tanstack/react-router";

import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import {
  getPaymentProvider,
  type PaymentProviderName,
} from "@/lib/payment";

/*
 * =========================================================
 * Configuration
 * =========================================================
 */

const MAX_DESCRIPTION_LENGTH = 2000;

/*
 * =========================================================
 * Error
 * =========================================================
 */

class PaymentCreateError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "PaymentCreateError";
    this.status = status;
  }
}

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(
        digit.charCodeAt(0) - 1776,
      ),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(
        digit.charCodeAt(0) - 1632,
      ),
    );
}

function cleanString(
  value: unknown,
): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parsePositiveInteger(
  value: unknown,
): number | null {
  const normalized =
    normalizeDigits(
      String(value ?? ""),
    );

  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed =
    Number(normalized);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return null;
  }

  return parsed;
}

function isPaymentProviderName(
  value: string,
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
): Promise<Record<string, unknown>> {
  try {
    const body =
      (await request.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      throw new Error();
    }

    return body as Record<
      string,
      unknown
    >;
  } catch {
    throw new PaymentCreateError(
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
    "/api/payments/create",
  )({
    server: {
      handlers: {
        /*
         * ===================================================
         * POST /api/payments/create
         * ===================================================
         */

        POST: async ({
          request,
        }) => {
          try {
            /*
             * 1. Authentication
             */

            const auth =
              await requireAuth(
                request,
              );

            if (
              !auth.authenticated ||
              !auth.session
            ) {
              return Response.json(
                {
                  error:
                    "برای ایجاد پرداخت باید وارد حساب شوید.",
                },
                {
                  status: 401,
                },
              );
            }

            /*
             * 2. Parse request body
             */

            const body =
              await parseJsonBody(
                request,
              );

            const orderId =
              parsePositiveInteger(
                body["orderId"],
              );

            if (!orderId) {
              throw new PaymentCreateError(
                "شناسه سفارش نامعتبر است.",
                400,
              );
            }

            const providerRaw =
              cleanString(
                body["provider"],
              );

            const providerName =
              providerRaw || "mock";

            if (
              !isPaymentProviderName(
                providerName,
              )
            ) {
              throw new PaymentCreateError(
                "درگاه پرداخت انتخاب‌شده پشتیبانی نمی‌شود.",
                400,
              );
            }

            const description =
              cleanString(
                body["description"],
              );

            if (
              description.length >
              MAX_DESCRIPTION_LENGTH
            ) {
              throw new PaymentCreateError(
                `توضیحات پرداخت نمی‌تواند بیشتر از ${MAX_DESCRIPTION_LENGTH} کاراکتر باشد.`,
                400,
              );
            }

            /*
             * 3. Find order
             *
             * مبلغ پرداخت مستقیماً از دیتابیس
             * خوانده می‌شود.
             */

            const orderResult =
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
                    orderId,
                  ),
                )
                .limit(1);

            const order =
              orderResult[0];

            if (!order) {
              throw new PaymentCreateError(
                "سفارش موردنظر پیدا نشد.",
                404,
              );
            }

            /*
             * 4. Ownership check
             *
             * کاربر فقط می‌تواند سفارش خودش
             * را پرداخت کند.
             */

            if (
              order.accountId !==
              auth.session.userId
            ) {
              throw new PaymentCreateError(
                "شما اجازه پرداخت این سفارش را ندارید.",
                403,
              );
            }

            /*
             * 5. Order status validation
             */

            if (
              order.status ===
              "cancelled"
            ) {
              throw new PaymentCreateError(
                "برای سفارش لغوشده امکان پرداخت وجود ندارد.",
                409,
              );
            }

            /*
             * 6. Validate order amount
             */

            if (
              !Number.isFinite(
                order.total,
              ) ||
              order.total <= 0
            ) {
              throw new PaymentCreateError(
                "مبلغ سفارش برای پرداخت معتبر نیست.",
                409,
              );
            }

            /*
             * 7. Already paid check
             */

            if (
              order.paymentStatus ===
              "paid"
            ) {
              throw new PaymentCreateError(
                "این سفارش قبلاً پرداخت شده است.",
                409,
              );
            }

            /*
             * 8. Get payment provider
             */

            const provider =
              getPaymentProvider(
                providerName,
              );

            const callbackUrl =
              new URL(
                "/api/payments/callback",
                request.url,
              ).toString();

            /*
             * 9. Check existing pending payment
             *
             * اگر پرداخت pending قبلی برای همین
             * Provider وجود داشته باشد، همان
             * payment را دوباره استفاده می‌کنیم.
             */

            const existingPayments =
              await db
                .select()
                .from(payments)
                .where(
                  eq(
                    payments.orderId,
                    order.id,
                  ),
                );

            const existingPendingPayment =
              existingPayments.find(
                (payment) =>
                  payment.status ===
                    "pending" &&
                  payment.provider ===
                    providerName,
              );

            /*
             * =================================================
             * Existing Pending Payment
             * =================================================
             */

            if (
              existingPendingPayment
            ) {
              let paymentResult;

              try {
                paymentResult =
                  await provider.createPayment(
                    {
                      paymentId:
                        existingPendingPayment.id,

                      orderId:
                        order.id,

                      orderNumber:
                        order.orderNumber,

                      amount:
                        order.total,

                      callbackUrl,

                      ...(description ||
                      existingPendingPayment.description
                        ? {
                            description:
                              description ||
                              existingPendingPayment.description ||
                              "",
                          }
                        : {}),
                    },
                  );
              } catch (error) {
                console.error(
                  "Payment provider error:",
                  error,
                );

                await db
                  .update(payments)
                  .set({
                    status:
                      "failed",

                    updatedAt:
                      new Date().toISOString(),
                  })
                  .where(
                    eq(
                      payments.id,
                      existingPendingPayment.id,
                    ),
                  );

                throw new PaymentCreateError(
                  "ایجاد پرداخت توسط درگاه ناموفق بود.",
                  502,
                );
              }

              /*
               * Save new authority
               */

              const updatedPayments =
                await db
                  .update(payments)
                  .set({
                    authority:
                      paymentResult.authority,

                    updatedAt:
                      new Date().toISOString(),
                  })
                  .where(
                    eq(
                      payments.id,
                      existingPendingPayment.id,
                    ),
                  )
                  .returning();

              const updatedPayment =
                updatedPayments[0];

              if (!updatedPayment) {
                throw new PaymentCreateError(
                  "به‌روزرسانی پرداخت ناموفق بود.",
                  500,
                );
              }

              return Response.json({
                success: true,

                payment:
                  updatedPayment,

                paymentUrl:
                  paymentResult.paymentUrl,
              });
            }

            /*
             * =================================================
             * Create New Payment
             * =================================================
             */

            const now =
              new Date().toISOString();

            const insertedPayments =
              await db
                .insert(payments)
                .values({
                  orderId:
                    order.id,

                  amount:
                    order.total,

                  status:
                    "pending",

                  provider:
                    providerName,

                  description:
                    description ||
                    null,

                  createdAt:
                    now,

                  updatedAt:
                    now,
                })
                .returning();

            const payment =
              insertedPayments[0];

            if (!payment) {
              throw new PaymentCreateError(
                "رکورد پرداخت ایجاد نشد.",
                500,
              );
            }

            /*
             * =================================================
             * Create Payment With Provider
             * =================================================
             */

            let paymentResult;

            try {
              paymentResult =
                await provider.createPayment(
                  {
                    paymentId:
                      payment.id,

                    orderId:
                      order.id,

                    orderNumber:
                      order.orderNumber,

                    amount:
                      order.total,

                    callbackUrl,

                    ...(description
                      ? {
                          description,
                        }
                      : {}),
                  },
                );
            } catch (error) {
              console.error(
                "Payment provider error:",
                error,
              );

              /*
               * Provider failed.
               * Mark payment as failed.
               */

              await db
                .update(payments)
                .set({
                  status:
                    "failed",

                  updatedAt:
                    new Date().toISOString(),
                })
                .where(
                  eq(
                    payments.id,
                    payment.id,
                  ),
                );

              throw new PaymentCreateError(
                "ایجاد پرداخت توسط درگاه ناموفق بود.",
                502,
              );
            }

            /*
             * =================================================
             * Save Authority
             * =================================================
             */

            const updatedPayments =
              await db
                .update(payments)
                .set({
                  authority:
                    paymentResult.authority,

                  updatedAt:
                    new Date().toISOString(),
                })
                .where(
                  eq(
                    payments.id,
                    payment.id,
                  ),
                )
                .returning();

            const updatedPayment =
              updatedPayments[0];

            if (!updatedPayment) {
              throw new PaymentCreateError(
                "به‌روزرسانی رکورد پرداخت ناموفق بود.",
                500,
              );
            }

            /*
             * =================================================
             * Final Response
             * =================================================
             */

            return Response.json({
              success: true,

              payment:
                updatedPayment,

              paymentUrl:
                paymentResult.paymentUrl,
            });
          } catch (error) {
            /*
             * Known application errors
             */

            if (
              error instanceof
              PaymentCreateError
            ) {
              return Response.json(
                {
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
             * Unexpected errors
             */

            console.error(
              "POST /api/payments/create error:",
              error,
            );

            return Response.json(
              {
                error:
                  "ایجاد پرداخت ناموفق بود.",
              },
              {
                status: 500,
              },
            );
          }
        },

        /*
         * ===================================================
         * GET
         * ===================================================
         */

        GET: async () => {
          return Response.json(
            {
              error:
                "این endpoint فقط با POST قابل استفاده است.",
            },
            {
              status: 405,

              headers: {
                Allow: "POST",
              },
            },
          );
        },
      },
    },
  });