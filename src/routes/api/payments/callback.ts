import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { payments } from "@/db/schema";

import {
  PaymentVerifyError,
  verifyPaymentById,
} from "@/lib/payment/verification";

export const Route = createFileRoute(
  "/api/payments/callback",
)({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const baseUrl = (
          process.env.APP_URL?.trim() ||
          process.env.SITE_URL?.trim() ||
          url.origin
        ).replace(/\/$/, "");

        try {
          const authority =
            url.searchParams.get(
              "Authority",
            );

          const status =
            url.searchParams.get(
              "Status",
            );

          console.log(
            "[PAYMENT_CALLBACK] received",
            JSON.stringify({
              status,
              authority,
            }),
          );

          /*
           * بدون Authority نمی‌توانیم Payment
           * مربوطه را پیدا کنیم.
           */
          if (!authority) {
            console.error(
              "[PAYMENT_CALLBACK] missing authority",
            );

            return Response.redirect(
              `${baseUrl}/profile-orders?payment=failed`,
              302,
            );
          }

          /*
           * کاربر در زرین‌پال پرداخت را لغو کرده
           * یا پرداخت موفق نبوده است.
           */
          if (status !== "OK") {
            console.log(
              "[PAYMENT_CALLBACK] payment cancelled/not OK",
              JSON.stringify({
                status,
                authority,
              }),
            );

            return Response.redirect(
              `${baseUrl}/profile-orders?payment=cancelled`,
              302,
            );
          }

          /*
           * پیدا کردن Payment از روی Authority
           */
          const payment =
            await db
              .select({
                id: payments.id,
              })
              .from(payments)
              .where(
                eq(
                  payments.authority,
                  authority,
                ),
              )
              .limit(1)
              .then(
                (rows) =>
                  rows[0],
              );

          console.log(
            "[PAYMENT_CALLBACK] payment lookup",
            JSON.stringify({
              paymentId:
                payment?.id ?? null,
            }),
          );

          if (!payment) {
            console.error(
              "[PAYMENT_CALLBACK] payment not found",
              JSON.stringify({
                authority,
              }),
            );

            return Response.redirect(
              `${baseUrl}/profile-orders?payment=failed`,
              302,
            );
          }

          /*
           * نکته مهم:
           *
           * دیگر fetch به
           * /api/payments/verify
           * نمی‌زنیم.
           *
           * مستقیماً سرویس Verify را صدا می‌زنیم.
           */
          console.log(
            "[PAYMENT_CALLBACK] starting direct verification",
            JSON.stringify({
              paymentId:
                payment.id,
            }),
          );

          const result =
            await verifyPaymentById(
              payment.id,
            );

          console.log(
            "[PAYMENT_CALLBACK] verification result",
            JSON.stringify({
              success:
                result.success,
              alreadyPaid:
                result.alreadyPaid,
              paymentId:
                result.payment.id,
              orderId:
                result.order.id,
              referenceId:
                result.payment.referenceId ??
                null,
              trackingCode:
                result.payment.trackingCode ??
                null,
            }),
          );

          const orderId =
            result.order.id;

          const successUrl =
            orderId
              ? `${baseUrl}/profile-orders?payment=success&orderId=${encodeURIComponent(
                  String(orderId),
                )}`
              : `${baseUrl}/profile-orders?payment=success`;

          return Response.redirect(
            successUrl,
            302,
          );
        } catch (error) {
          console.error(
            "[PAYMENT_CALLBACK_ERROR]",
            error instanceof Error
              ? {
                  name: error.name,
                  message:
                    error.message,
                  stack: error.stack,
                  status:
                    error instanceof
                    PaymentVerifyError
                      ? error.status
                      : undefined,
                }
              : error,
          );

          return Response.redirect(
            `${baseUrl}/profile-orders?payment=failed`,
            302,
          );
        }
      },
    },
  },
});