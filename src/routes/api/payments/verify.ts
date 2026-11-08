import { createFileRoute } from "@tanstack/react-router";

import { requireAuth } from "@/lib/auth";
import {
  PaymentVerifyError,
  verifyPaymentById,
} from "@/lib/payment/verification";

type PaymentVerifyRequestBody = {
  paymentId?: unknown;
};

function normalizeDigits(value: string) {
  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(digit),
        ),
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
        ),
    );
}

function parsePositiveInteger(
  value: unknown,
  fieldName: string,
) {
  const normalized = normalizeDigits(
    String(value ?? "").trim(),
  );

  const parsed = Number(normalized);

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

export const Route = createFileRoute(
  "/api/payments/verify",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth =
            await requireAuth(request);

          if (
            !auth.authenticated ||
            !auth.session
          ) {
            throw new PaymentVerifyError(
              "برای تأیید پرداخت باید وارد حساب کاربری شوید.",
              401,
            );
          }

          const body =
            (await parseJsonBody(
              request,
            )) as PaymentVerifyRequestBody;

          const paymentId =
            parsePositiveInteger(
              body.paymentId,
              "شناسه پرداخت",
            );

          const result =
            await verifyPaymentById(
              paymentId,
              {
                userId:
                  auth.session.userId,
              },
            );

          return Response.json(result);
        } catch (error: unknown) {
          if (
            error instanceof
            PaymentVerifyError
          ) {
            return Response.json(
              {
                success: false,
                error: error.message,
              },
              {
                status: error.status,
              },
            );
          }

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
    },
  },
});