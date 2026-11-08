/*
 * =========================================================
 * ZarinPal Payment Provider (via Relay Service)
 * =========================================================
 *
 * این provider مستقیماً به زرین‌پال وصل نمی‌شود، چون سایت
 * روی Cloudflare Workers اجرا می‌شود و آی‌پی خروجی ثابتی
 * ندارد (که زرین‌پال برای ثبت درگاه به آن نیاز دارد).
 *
 * به‌جای آن، این provider یک درخواست HTTP به سرویس "رله"
 * می‌فرستد که روی یک سرور با آی‌پی ثابت (مثلاً سرور ابری
 * آروان) اجرا می‌شود. آن سرویس خودش مستقیماً با API زرین‌پال
 * صحبت می‌کند.
 *
 * تنظیمات لازم (در Cloudflare Worker به‌عنوان Secret/Var):
 *   ZARINPAL_RELAY_URL    آدرس سرویس رله، مثلاً:
 *                         https://relay.yourdomain.com
 *   ZARINPAL_RELAY_SECRET رشته‌ی محرمانه‌ی مشترک بین سایت
 *                         و سرویس رله (برای جلوگیری از
 *                         سوءاستفاده‌ی دیگران از رله شما)
 * =========================================================
 */

import { env } from "cloudflare:workers";

import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "./types";

/*
 * =========================================================
 * Config helpers
 * =========================================================
 */

function getRelayUrl(): string {
  const url =
    (env as unknown as Record<string, string | undefined>)[
      "ZARINPAL_RELAY_URL"
    ];

  if (!url) {
    throw new Error(
      "متغیر محیطی ZARINPAL_RELAY_URL تنظیم نشده است.",
    );
  }

  return url.replace(/\/+$/, "");
}

function getRelaySecret(): string {
  const secret =
    (env as unknown as Record<string, string | undefined>)[
      "ZARINPAL_RELAY_SECRET"
    ];

  if (!secret) {
    throw new Error(
      "متغیر محیطی ZARINPAL_RELAY_SECRET تنظیم نشده است.",
    );
  }

  return secret;
}

async function callRelay<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const url = `${getRelayUrl()}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-relay-secret": getRelaySecret(),
    },
    body: JSON.stringify(body),
  });

  const data = (await response
    .json()
    .catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok || !data) {
    const message =
      (data && "error" in data && data.error) ||
      `سرویس رله با خطای ${response.status} پاسخ داد.`;

    throw new Error(String(message));
  }

  return data;
}

/*
 * =========================================================
 * Provider
 * =========================================================
 */

export const zarinpalPaymentProvider: PaymentProvider = {
  name: "zarinpal",

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    const result = await callRelay<{
      authority: string;
      paymentUrl: string;
    }>("/zarinpal/create", {
      paymentId: params.paymentId,
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      amount: params.amount,
      callbackUrl: params.callbackUrl,
      description: params.description,
    });

    return {
      authority: result.authority,
      paymentUrl: result.paymentUrl,
    };
  },

  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult> {
    try {
      const result = await callRelay<{
        success: boolean;
        referenceId?: string | null;
        trackingCode?: string | null;
        message?: string;
      }>("/zarinpal/verify", {
        paymentId: params.paymentId,
        authority: params.authority,
        amount: params.amount,
      });

      return {
        success: result.success,
        referenceId: result.referenceId ?? null,
        trackingCode: result.trackingCode ?? null,
        message: result.message ?? "",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "خطا در ارتباط با سرویس رله زرین‌پال.",
      };
    }
  },
};
