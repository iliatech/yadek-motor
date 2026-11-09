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
    | Record<string, unknown>
    | null;
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
        order_id: params.orderId,
        order_number: params.orderNumber,
        payment_id: params.paymentId,
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
      let errMsg = "خطا در ارتباط با درگاه پرداخت زرین‌پال.";

      if (json?.data?.message) {
        errMsg = json.data.message;
      } else if (Array.isArray(json?.errors) && json.errors[0]?.message) {
        errMsg = json.errors[0].message;
      }

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
        let errMsg = "خطا در پاسخ درگاه زرین‌پال.";

        if (Array.isArray(json?.errors) && json.errors[0]?.message) {
          errMsg = json.errors[0].message;
        }

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
