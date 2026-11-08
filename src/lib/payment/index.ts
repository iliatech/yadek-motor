import { mockPaymentProvider } from "./mock";
import { zarinpalPaymentProvider } from "./zarinpal";
import type {
  PaymentProvider,
  PaymentProviderName,
} from "./types";

const providers: Partial<
  Record<PaymentProviderName, PaymentProvider>
> = {
  mock: mockPaymentProvider,
  zarinpal: zarinpalPaymentProvider,

  // درگاه‌های واقعی بعداً اضافه می‌شوند:
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

export { mockPaymentProvider, zarinpalPaymentProvider };

export type {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
  PaymentProviderName,
  VerifyPaymentParams,
  VerifyPaymentResult,
} from "./types";
