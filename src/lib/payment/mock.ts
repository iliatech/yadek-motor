import type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "./types";

function generateToken(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export const mockPaymentProvider: PaymentProvider = {
  name: "mock",

  async createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult> {
    if (
      !Number.isInteger(params.paymentId) ||
      params.paymentId <= 0
    ) {
      throw new Error("شناسه پرداخت نامعتبر است.");
    }

    if (
      !Number.isInteger(params.orderId) ||
      params.orderId <= 0
    ) {
      throw new Error("شناسه سفارش نامعتبر است.");
    }

    if (
      !Number.isFinite(params.amount) ||
      params.amount <= 0
    ) {
      throw new Error("مبلغ پرداخت نامعتبر است.");
    }

    const authority = generateToken("mock");

    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "";

    const paymentUrl = `${baseUrl}/mock-payment?paymentId=${params.paymentId}&authority=${encodeURIComponent(authority)}`;

    return {
      authority,
      paymentUrl,
    };
  },

  async verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult> {
    if (
      !Number.isInteger(params.paymentId) ||
      params.paymentId <= 0
    ) {
      return {
        success: false,
        message: "شناسه پرداخت نامعتبر است.",
      };
    }

    if (
      !Number.isFinite(params.amount) ||
      params.amount <= 0
    ) {
      return {
        success: false,
        message: "مبلغ پرداخت نامعتبر است.",
      };
    }

    if (
      typeof params.authority !== "string" ||
      !params.authority.startsWith("mock_")
    ) {
      return {
        success: false,
        message: "شناسه پرداخت آزمایشی نامعتبر است.",
      };
    }

    const referenceId = generateToken("ref");
    const trackingCode = Math.floor(
      1000000000 + Math.random() * 9000000000,
    ).toString();

    return {
      success: true,
      referenceId,
      trackingCode,
      message: "پرداخت آزمایشی با موفقیت تأیید شد.",
    };
  },
};