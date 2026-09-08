import { mockPaymentProvider } from "./mock";
import type {
  PaymentProvider,
  PaymentProviderName,
} from "./types";

const providers: Partial<
  Record<PaymentProviderName, PaymentProvider>
> = {
  mock: mockPaymentProvider,

  // درگاه‌های واقعی بعداً اضافه می‌شوند:
  // zarinpal: zarinpalPaymentProvider,
  // idpay: idpayPaymentProvider,
  // zibal: zibalPaymentProvider,
};

export function getPaymentProvider(
  name: PaymentProviderName,
): PaymentProvider {
  const provider = providers[name];

  if (!provider) {
    throw new Error(
      `درگاه پرداخت "${name}" پشتیبانی نمی‌شود.`,
    );
  }

  return provider;
}

export { mockPaymentProvider };

export type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentProviderName,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "./types";