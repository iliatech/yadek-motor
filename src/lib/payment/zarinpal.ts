/*
 * =========================================================
 * ZarinPal Payment Provider (Direct v4 API)
 * =========================================================
 *
 * اتصال مستقیم به API رسمی زرین‌پال نسخه ۴ (REST)
 * بدون نیاز به سرور رله.
 * =========================================================
 */

import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "./types";

function isSandbox(): boolean {
  const envVal = process.env.ZARINPAL_SANDBOX?.trim().toLowerCase();
  return envVal === "true" || envVal === "1";
}

function getMerchantId(): string {
  const merchantId = process.env.ZARINPAL_MERCHANT_ID?.trim();

  if (!merchantId) {
    if (isSandbox()) {
      return "00000000-0000-0000-0000-000000000000";
    }
    throw new Error("متغیر محیطی ZARINPAL_MERCHANT_ID تنظیم نشده است.");
  }

  return merchantId;
}

function getBaseUrl(): string {
  return isSandbox()
    ? "https://sandbox.zarinpal.com"
    : "https://payment.zarinpal.com";
}

interface ZarinpalResponse<T> {
  data: T | null;
  errors:
    | Array<{ code: number; message: string }>
    | { code?: number; message?: string; validations?: unknown[] }
    | Record<string, unknown>
    | null;
}

function extractZarinpalErrorMessage(
  json: ZarinpalResponse<unknown> | null,
  defaultMsg: string,
): string {
  if (!json) return defaultMsg;
  if (
    json.data &&
    typeof json.data === "object" &&
    "message" in json.data &&
    json.data.message
  ) {
    return String(json.data.message);
  }
  if (Array.isArray(json.errors) && json.errors[0]?.message) {
    return String(json.errors[0].message);
  }
  if (
    json.errors &&
    typeof json.errors === "object" &&
    !Array.isArray(json.errors) &&
    "message" in json.errors &&
    json.errors.message
  ) {
    return String(json.errors.message);
  }
  return defaultMsg;
}

interface ZarinpalPaymentRequestData {
  code: number;
  message: string;
  authority: string;
  fee_type?: string;
  fee?: number;
}

interface ZarinpalPaymentVerifyData {
  code: number;
  message: string;
  card_hash?: string;
  card_pan?: string;
  ref_id?: number | string;
  fee_type?: string;
  fee?: number;
}

export const zarinpalPaymentProvider: PaymentProvider = {
  name: "zarinpal",

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    const baseUrl = getBaseUrl();
    const merchantId = getMerchantId();
    const requestUrl = `${baseUrl}/pg/v4/payment/request.json`;

    const payload = {
      merchant_id: merchantId,
      amount: params.amount,
      callback_url: params.callbackUrl,
      description:
        params.description ||
        `پرداخت سفارش ${params.orderNumber}`,
      metadata: {
        order_id: String(params.orderId),
        order_number: String(params.orderNumber),
        payment_id: String(params.paymentId),
        ...(params.mobile ? { mobile: String(params.mobile) } : {}),
        ...(params.email ? { email: String(params.email) } : {}),
      },
    };

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = (await response
      .json()
      .catch(() => null)) as ZarinpalResponse<ZarinpalPaymentRequestData> | null;

    if (!json || !json.data || json.data.code !== 100) {
      console.error("[ZARINPAL] Create payment raw response error:", {
        status: response.status,
        statusText: response.statusText,
        payload: { ...payload, merchant_id: "***" },
        response: json,
      });

      const errMsg = extractZarinpalErrorMessage(
        json,
        `خطا در ارتباط با درگاه پرداخت زرین‌پال (کد وضعیت: ${response.status}).`,
      );

      throw new Error(errMsg);
    }

    const authority = json.data.authority;
    const paymentUrl = `${baseUrl}/pg/StartPay/${authority}`;

    return {
      authority,
      paymentUrl,
    };
  },

  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult> {
    try {
      if (!params.authority) {
        return {
          success: false,
          message: "شناسه ارجاع (Authority) وجود ندارد.",
        };
      }

      const baseUrl = getBaseUrl();
      const merchantId = getMerchantId();
      const verifyUrl = `${baseUrl}/pg/v4/payment/verify.json`;

      const payload = {
        merchant_id: merchantId,
        amount: params.amount,
        authority: params.authority,
      };

      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = (await response
        .json()
        .catch(() => null)) as ZarinpalResponse<ZarinpalPaymentVerifyData> | null;

      if (!json || !json.data) {
        console.error("[ZARINPAL] Verify payment raw response error:", {
          status: response.status,
          statusText: response.statusText,
          response: json,
        });

        const errMsg = extractZarinpalErrorMessage(
          json,
          "خطا در پاسخ درگاه زرین‌پال.",
        );

        return {
          success: false,
          message: errMsg,
        };
      }

      // کد ۱۰۰: عملیات با موفقیت انجام شد
      // کد ۱۰۱: عملیات پرداخت موفق بوده و قبلاً تأیید شده است
      if (json.data.code === 100 || json.data.code === 101) {
        const refId =
          json.data.ref_id != null ? String(json.data.ref_id) : null;

        return {
          success: true,
          referenceId: refId,
          trackingCode: refId,
          message: json.data.message || "پرداخت با موفقیت انجام شد.",
        };
      }

      console.error("[ZARINPAL] Payment verification failed:", {
        code: json.data.code,
        message: json.data.message,
      });

      return {
        success: false,
        message: json.data.message || "تراکنش توسط درگاه زرین‌پال تایید نشد.",
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "خطا در ارتباط مستقیم با زرین‌پال.",
      };
    }
  },
};
