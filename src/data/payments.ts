export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaymentProvider =
  | "mock"
  | "zarinpal"
  | "idpay"
  | "zibal";

export interface Payment {
  id: number;
  orderId: number;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  authority: string | null;
  referenceId: string | null;
  trackingCode: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  orderId: number;
  provider?: PaymentProvider;
  description?: string;
}

export interface CreatePaymentResponse {
  success: true;
  payment: Payment;
  paymentUrl: string;
}

export interface VerifyPaymentResponse {
  success: true;
  payment: Payment;
  order: {
    id: number;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    status: string;
  };
}

interface PaymentApiData {
  id: number;
  orderId: number;
  amount: number;
  status: PaymentStatus;
  provider: PaymentProvider;
  authority?: unknown;
  referenceId?: unknown;
  trackingCode?: unknown;
  description?: unknown;
  createdAt: string;
  updatedAt: string;
}

interface CreatePaymentApiResponse {
  success: true;
  payment: unknown;
  paymentUrl: string;
}

interface VerifyPaymentApiResponse {
  success: true;
  payment: unknown;
  order: unknown;
}

interface ErrorApiResponse {
  error?: unknown;
}

interface OrderApiData {
  id: number;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  status: string;
}

function isPaymentStatus(value: unknown): value is PaymentStatus {
  return (
    value === "pending" ||
    value === "paid" ||
    value === "failed" ||
    value === "cancelled" ||
    value === "refunded"
  );
}

function isPaymentProvider(value: unknown): value is PaymentProvider {
  return (
    value === "mock" ||
    value === "zarinpal" ||
    value === "idpay" ||
    value === "zibal"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizePayment(value: unknown): Payment {
  if (!isRecord(value)) {
    throw new Error("پاسخ نامعتبر از API پرداخت دریافت شد.");
  }

  const id = value["id"];
  const orderId = value["orderId"];
  const amount = value["amount"];
  const status = value["status"];
  const provider = value["provider"];
  const createdAt = value["createdAt"];
  const updatedAt = value["updatedAt"];

  if (
    typeof id !== "number" ||
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error("شناسه پرداخت نامعتبر است.");
  }

  if (
    typeof orderId !== "number" ||
    !Number.isInteger(orderId) ||
    orderId <= 0
  ) {
    throw new Error("شناسه سفارش پرداخت نامعتبر است.");
  }

  if (
    typeof amount !== "number" ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error("مبلغ پرداخت نامعتبر است.");
  }

  if (!isPaymentStatus(status)) {
    throw new Error("وضعیت پرداخت نامعتبر است.");
  }

  if (!isPaymentProvider(provider)) {
    throw new Error("درگاه پرداخت نامعتبر است.");
  }

  if (
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    throw new Error("زمان پرداخت نامعتبر است.");
  }

  return {
    id,
    orderId,
    amount,
    status,
    provider,
    authority: normalizeNullableString(value["authority"]),
    referenceId: normalizeNullableString(value["referenceId"]),
    trackingCode: normalizeNullableString(value["trackingCode"]),
    description: normalizeNullableString(value["description"]),
    createdAt,
    updatedAt,
  };
}

function getApiError(data: unknown, fallback: string): string {
  if (!isRecord(data)) {
    return fallback;
  }

  const error = data["error"];

  return typeof error === "string" && error.trim()
    ? error
    : fallback;
}

function isCreatePaymentResponse(
  value: unknown,
): value is CreatePaymentApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value["success"] === true &&
    typeof value["paymentUrl"] === "string" &&
    "payment" in value
  );
}

function normalizeOrder(value: unknown): OrderApiData {
  if (!isRecord(value)) {
    throw new Error("اطلاعات سفارش در پاسخ پرداخت نامعتبر است.");
  }

  const id = value["id"];
  const orderNumber = value["orderNumber"];
  const total = value["total"];
  const paymentStatus = value["paymentStatus"];
  const status = value["status"];

  if (
    typeof id !== "number" ||
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error("شناسه سفارش نامعتبر است.");
  }

  if (typeof orderNumber !== "string" || !orderNumber.trim()) {
    throw new Error("شماره سفارش نامعتبر است.");
  }

  if (
    typeof total !== "number" ||
    !Number.isFinite(total) ||
    total < 0
  ) {
    throw new Error("مبلغ سفارش نامعتبر است.");
  }

  if (
    typeof paymentStatus !== "string" ||
    typeof status !== "string"
  ) {
    throw new Error("وضعیت سفارش نامعتبر است.");
  }

  return {
    id,
    orderNumber,
    total,
    paymentStatus,
    status,
  };
}

function isVerifyPaymentResponse(
  value: unknown,
): value is VerifyPaymentApiResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value["success"] === true &&
    "payment" in value &&
    "order" in value
  );
}

export async function createPayment(
  input: CreatePaymentInput,
): Promise<CreatePaymentResponse> {
  if (
    !Number.isInteger(input.orderId) ||
    input.orderId <= 0
  ) {
    throw new Error("شناسه سفارش نامعتبر است.");
  }

  const provider = input.provider ?? "mock";

  if (!isPaymentProvider(provider)) {
    throw new Error("درگاه پرداخت نامعتبر است.");
  }

  const description = input.description?.trim() ?? "";

  const response = await fetch("/api/payments/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      orderId: input.orderId,
      provider,
      description,
    }),
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error("پاسخ نامعتبر از سرور پرداخت دریافت شد.");
  }

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        "ایجاد پرداخت ناموفق بود.",
      ),
    );
  }

  if (!isCreatePaymentResponse(data)) {
    throw new Error(
      "ساختار پاسخ ایجاد پرداخت نامعتبر است.",
    );
  }

  return {
    success: true,
    payment: normalizePayment(data["payment"]),
    paymentUrl: data["paymentUrl"],
  };
}

export async function verifyPayment(
  paymentId: number,
): Promise<VerifyPaymentResponse> {
  if (
    !Number.isInteger(paymentId) ||
    paymentId <= 0
  ) {
    throw new Error("شناسه پرداخت نامعتبر است.");
  }

  const response = await fetch("/api/payments/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      paymentId,
    }),
  });

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error("پاسخ نامعتبر از سرور پرداخت دریافت شد.");
  }

  if (!response.ok) {
    throw new Error(
      getApiError(
        data,
        "تأیید پرداخت ناموفق بود.",
      ),
    );
  }

  if (!isVerifyPaymentResponse(data)) {
    throw new Error(
      "ساختار پاسخ تأیید پرداخت نامعتبر است.",
    );
  }

  return {
    success: true,
    payment: normalizePayment(data["payment"]),
    order: normalizeOrder(data["order"]),
  };
}