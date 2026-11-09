export type PaymentProviderName =
  | "mock"
  | "zarinpal"
  | "idpay"
  | "zibal";

export interface CreatePaymentParams {
  paymentId: number;
  orderId: number | string;
  orderNumber: string;
  amount: number;
  callbackUrl: string;
  description?: string;
  mobile?: string;
  email?: string;
}

export interface CreatePaymentResult {
  authority: string;
  paymentUrl: string;
}

export interface VerifyPaymentParams {
  paymentId: number;
  authority?: string | null;
  amount: number;
}

export interface VerifyPaymentResult {
  success: boolean;
  referenceId?: string | null;
  trackingCode?: string | null;
  message?: string;
}

export interface PaymentProvider {
  readonly name: PaymentProviderName;

  createPayment(
    params: CreatePaymentParams,
  ): Promise<CreatePaymentResult>;

  verifyPayment(
    params: VerifyPaymentParams,
  ): Promise<VerifyPaymentResult>;
}