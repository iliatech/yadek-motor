import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  CreditCard,
  Eye,
  Loader2,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Search,
  Truck,
  User,
  X,
  XCircle,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

export const Route = createFileRoute(
  "/admin/orders",
)({
  component: AdminOrdersPage,
});

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

type PaymentStatus =
  | "unpaid"
  | "paid"
  | "failed"
  | "refunded";

type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  image: string;
};

type AdminOrder = {
  id: number;
  orderNumber: string;
  accountId: string | null;

  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };

  shipping: {
    province: string;
    city: string;
    address: string;
    postalCode: string;
  };

  description: string | null;

  items: OrderItem[];

  subtotal: number;
  shippingCost: number;
  total: number;

  status: OrderStatus;
  paymentStatus: PaymentStatus;

  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  success: boolean;
  message?: string;
  orders?: AdminOrder[];
};

const ORDER_STATUS_LABELS: Record<
  OrderStatus,
  string
> = {
  pending: "در انتظار بررسی",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
};

const PAYMENT_STATUS_LABELS: Record<
  PaymentStatus,
  string
> = {
  unpaid: "پرداخت نشده",
  paid: "پرداخت شده",
  failed: "پرداخت ناموفق",
  refunded: "مسترد شده",
};

const ORDER_STATUS_OPTIONS: Array<{
  value: OrderStatus;
  label: string;
}> = [
  {
    value: "pending",
    label: "در انتظار بررسی",
  },
  {
    value: "processing",
    label: "در حال پردازش",
  },
  {
    value: "shipped",
    label: "ارسال شده",
  },
  {
    value: "delivered",
    label: "تحویل شده",
  },
  {
    value: "cancelled",
    label: "لغو شده",
  },
];

const PAYMENT_STATUS_OPTIONS: Array<{
  value: PaymentStatus;
  label: string;
}> = [
  {
    value: "unpaid",
    label: "پرداخت نشده",
  },
  {
    value: "paid",
    label: "پرداخت شده",
  },
  {
    value: "failed",
    label: "ناموفق",
  },
  {
    value: "refunded",
    label: "مسترد شده",
  },
];

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".indexOf(digit),
      ),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(
        "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
      ),
    );
}

function toPersianDigits(value: string | number) {
  return String(value).replace(
    /\d/g,
    (digit) =>
      "۰۱۲۳۴۵۶۷۸۹".charAt(Number(digit))
  );
}

function formatPrice(value: number) {
  return `${toPersianDigits(
    new Intl.NumberFormat("en-US").format(
      value,
    ),
  )} ریال`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(
      "fa-IR",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function getImageUrl(
  image: string | null | undefined,
) {
  if (!image) {
    return "/placeholder.svg";
  }

  const normalized = image.trim();

  if (!normalized) {
    return "/placeholder.svg";
  }

  if (
    normalized.startsWith("/") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://")
  ) {
    return normalized;
  }

  return `/products/${normalized}`;
}

function getOrderStatusClass(
  status: OrderStatus,
) {
  switch (status) {
    case "pending":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    case "processing":
      return "border-blue-500/20 bg-blue-500/10 text-blue-300";

    case "shipped":
      return "border-purple-500/20 bg-purple-500/10 text-purple-300";

    case "delivered":
      return "border-green-500/20 bg-green-500/10 text-green-300";

    case "cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    default:
      return "border-white/10 bg-white/5 text-neutral-300";
  }
}

function getPaymentStatusClass(
  status: PaymentStatus,
) {
  switch (status) {
    case "paid":
      return "border-green-500/20 bg-green-500/10 text-green-300";

    case "unpaid":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    case "failed":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    case "refunded":
      return "border-purple-500/20 bg-purple-500/10 text-purple-300";

    default:
      return "border-white/10 bg-white/5 text-neutral-300";
  }
}

function getOrderStatusIcon(
  status: OrderStatus,
) {
  switch (status) {
    case "pending":
      return <Clock3 size={14} />;

    case "processing":
      return <Package size={14} />;

    case "shipped":
      return <Truck size={14} />;

    case "delivered":
      return <CheckCircle2 size={14} />;

    case "cancelled":
      return <XCircle size={14} />;

    default:
      return null;
  }
}

function AdminOrdersPage() {
  const [orders, setOrders] = useState<
    AdminOrder[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<OrderStatus | "all">("all");

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState<
    PaymentStatus | "all"
  >("all");

  const [selectedOrder, setSelectedOrder] =
    useState<AdminOrder | null>(null);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/orders",
      );

      const data =
        (await response.json()) as OrdersResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "دریافت سفارش‌ها ناموفق بود.",
        );
      }
console.table(
  (data.orders ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
  })),
);
      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : [],
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "خطا در دریافت سفارش‌ها.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch =
      normalizeDigits(
        search.trim().toLowerCase(),
      );

    return orders.filter((order) => {
      if (
        statusFilter !== "all" &&
        order.status !== statusFilter
      ) {
        return false;
      }

      if (
        paymentFilter !== "all" &&
        order.paymentStatus !==
          paymentFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText =
        `${order.orderNumber} ${
          order.customer.firstName
        } ${
          order.customer.lastName
        } ${order.customer.phone} ${
          order.customer.email ?? ""
        }`.toLowerCase();

      return searchableText.includes(
        normalizedSearch,
      );
    });
  }, [
    orders,
    search,
    statusFilter,
    paymentFilter,
  ]);

  async function updateOrder(
    orderId: number,
    changes: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
    },
  ) {
    try {
      setUpdatingOrderId(orderId);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/admin/orders",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            orderId,
            ...changes,
          }),
        },
      );

      const data =
        (await response.json()) as {
          success: boolean;
          message?: string;
          order?: {
            id: number;
            status: OrderStatus;
            paymentStatus: PaymentStatus;
          };
        };

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "به‌روزرسانی سفارش ناموفق بود.",
        );
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                ...(changes.status
                  ? {
                      status:
                        changes.status,
                    }
                  : {}),
                ...(changes.paymentStatus
                  ? {
                      paymentStatus:
                        changes.paymentStatus,
                    }
                  : {}),
                updatedAt:
                  new Date().toISOString(),
              }
            : order,
        ),
      );

      setSelectedOrder((current) => {
        if (
          !current ||
          current.id !== orderId
        ) {
          return current;
        }

        return {
          ...current,
          ...(changes.status
            ? {
                status: changes.status,
              }
            : {}),
          ...(changes.paymentStatus
            ? {
                paymentStatus:
                  changes.paymentStatus,
              }
            : {}),
          updatedAt:
            new Date().toISOString(),
        };
      });

      setSuccessMessage(
        "وضعیت سفارش با موفقیت به‌روزرسانی شد.",
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "خطا در به‌روزرسانی سفارش.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setPaymentFilter("all");
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#090909] text-white"
    >
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-neutral-500">
              <Package size={18} />
              <span className="text-sm">
                پنل مدیریت
              </span>
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              مدیریت سفارش‌ها
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              مشاهده، بررسی و مدیریت سفارش‌های
              ثبت‌شده
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadOrders();
            }}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-neutral-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            بروزرسانی
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <XCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-300/70 transition hover:text-red-200"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs text-neutral-500">
              کل سفارش‌ها
            </p>

            <p className="mt-2 text-2xl font-bold">
              {toPersianDigits(
                orders.length,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.04] p-4">
            <p className="text-xs text-neutral-500">
              در انتظار بررسی
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-300">
              {toPersianDigits(
                orders.filter(
                  (order) =>
                    order.status ===
                    "pending",
                ).length,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-4">
            <p className="text-xs text-neutral-500">
              در حال پردازش
            </p>

            <p className="mt-2 text-2xl font-bold text-blue-300">
              {toPersianDigits(
                orders.filter(
                  (order) =>
                    order.status ===
                    "processing",
                ).length,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500/10 bg-purple-500/[0.04] p-4">
            <p className="text-xs text-neutral-500">
              ارسال شده
            </p>

            <p className="mt-2 text-2xl font-bold text-purple-300">
              {toPersianDigits(
                orders.filter(
                  (order) =>
                    order.status ===
                    "shipped",
                ).length,
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.04] p-4">
            <p className="text-xs text-neutral-500">
              تحویل شده
            </p>

            <p className="mt-2 text-2xl font-bold text-green-300">
              {toPersianDigits(
                orders.filter(
                  (order) =>
                    order.status ===
                    "delivered",
                ).length,
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="جستجو با شماره سفارش، نام یا موبایل..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pr-10 pl-4 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/20"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | OrderStatus
                    | "all",
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#111] px-4 text-sm text-neutral-200 outline-none focus:border-white/20"
            >
              <option value="all">
                همه وضعیت‌ها
              </option>

              {ORDER_STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <select
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target
                    .value as
                    | PaymentStatus
                    | "all",
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#111] px-4 text-sm text-neutral-200 outline-none focus:border-white/20"
            >
              <option value="all">
                همه پرداخت‌ها
              </option>

              {PAYMENT_STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-neutral-300 transition hover:bg-white/10"
            >
              حذف فیلترها
            </button>
          </div>

          <div className="mt-3 text-xs text-neutral-500">
            نمایش{" "}
            <span className="text-neutral-300">
              {toPersianDigits(
                filteredOrders.length,
              )}
            </span>{" "}
            سفارش از{" "}
            <span className="text-neutral-300">
              {toPersianDigits(
                orders.length,
              )}
            </span>{" "}
            سفارش
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3 text-neutral-400">
              <Loader2
                size={22}
                className="animate-spin"
              />
              در حال دریافت سفارش‌ها...
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          filteredOrders.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-6 text-center">
              <Package
                size={42}
                className="mb-4 text-neutral-600"
              />

              <h2 className="text-lg font-semibold">
                سفارشی پیدا نشد
              </h2>

              <p className="mt-2 max-w-md text-sm text-neutral-500">
                با فیلترها یا عبارت جستجوی
                دیگری دوباره امتحان کنید.
              </p>
            </div>
          )}

        {/* Orders */}
        {!loading &&
          filteredOrders.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-right">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-xs text-neutral-500">
                      <th className="px-5 py-4 font-medium">
                        سفارش
                      </th>

                      <th className="px-5 py-4 font-medium">
                        مشتری
                      </th>

                      <th className="px-5 py-4 font-medium">
                        مبلغ
                      </th>

                      <th className="px-5 py-4 font-medium">
                        وضعیت سفارش
                      </th>

                      <th className="px-5 py-4 font-medium">
                        پرداخت
                      </th>

                      <th className="px-5 py-4 font-medium">
                        تاریخ
                      </th>

                      <th className="px-5 py-4 font-medium">
                        عملیات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map(
                      (order) => (
                        <tr
                          key={order.id}
                          className="border-b border-white/5 transition hover:bg-white/[0.025]"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <div className="font-semibold text-white">
                                {order.orderNumber}
                              </div>

                              <div className="mt-1 text-xs text-neutral-500">
                                {toPersianDigits(
                                  order.items
                                    .reduce(
                                      (
                                        sum,
                                        item,
                                      ) =>
                                        sum +
                                        item.quantity,
                                      0,
                                    ),
                                )}{" "}
                                کالا
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-neutral-200">
                              {
                                order
                                  .customer
                                  .firstName
                              }{" "}
                              {
                                order
                                  .customer
                                  .lastName
                              }
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                              <Phone
                                size={12}
                              />
                              {toPersianDigits(
                                order
                                  .customer
                                  .phone,
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="font-semibold text-neutral-100">
                              {formatPrice(
                                order.total,
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                order.status
                              }
                              disabled={
                                updatingOrderId ===
                                order.id
                              }
                              onChange={(
                                event,
                              ) => {
                                void updateOrder(
                                  order.id,
                                  {
                                    status:
                                      event
                                        .target
                                        .value as OrderStatus,
                                  },
                                );
                              }}
                              className={`rounded-lg border px-3 py-2 text-xs outline-none ${getOrderStatusClass(
                                order.status,
                              )}`}
                            >
                              {ORDER_STATUS_OPTIONS.map(
                                (option) => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                    className="bg-[#111] text-white"
                                  >
                                    {
                                      option.label
                                    }
                                  </option>
                                ),
                              )}
                            </select>
                          </td>

                          <td className="px-5 py-4">
                            <select
                              value={
                                order.paymentStatus
                              }
                              disabled={
                                updatingOrderId ===
                                order.id
                              }
                              onChange={(
                                event,
                              ) => {
                                void updateOrder(
                                  order.id,
                                  {
                                    paymentStatus:
                                      event
                                        .target
                                        .value as PaymentStatus,
                                  },
                                );
                              }}
                              className={`rounded-lg border px-3 py-2 text-xs outline-none ${getPaymentStatusClass(
                                order.paymentStatus,
                              )}`}
                            >
                              {PAYMENT_STATUS_OPTIONS.map(
                                (option) => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                    className="bg-[#111] text-white"
                                  >
                                    {
                                      option.label
                                    }
                                  </option>
                                ),
                              )}
                            </select>
                          </td>

                          <td className="px-5 py-4 text-xs text-neutral-500">
                            {formatDate(
                              order.createdAt,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedOrder(
                                  order,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-200 transition hover:bg-white/10"
                            >
                              <Eye
                                size={15}
                              />
                              جزئیات
                            </button>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedOrder(null);
            }
          }}
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Package
                    size={19}
                    className="text-neutral-400"
                  />

                  <h2 className="font-bold">
                    جزئیات سفارش
                  </h2>
                </div>

                <p className="mt-1 text-xs text-neutral-500">
                  {
                    selectedOrder.orderNumber
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(null)
                }
                className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(90vh-75px)] overflow-y-auto p-5">
              {/* Status */}
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="mb-2 text-xs text-neutral-500">
                    وضعیت سفارش
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${getOrderStatusClass(
                        selectedOrder.status,
                      )}`}
                    >
                      {getOrderStatusIcon(
                        selectedOrder.status,
                      )}

                      {
                        ORDER_STATUS_LABELS[
                          selectedOrder.status
                        ]
                      }
                    </span>

                    <select
                      value={
                        selectedOrder.status
                      }
                      disabled={
                        updatingOrderId ===
                        selectedOrder.id
                      }
                      onChange={(event) => {
                        void updateOrder(
                          selectedOrder.id,
                          {
                            status:
                              event.target
                                .value as OrderStatus,
                          },
                        );
                      }}
                      className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-neutral-200 outline-none"
                    >
                      {ORDER_STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="mb-2 text-xs text-neutral-500">
                    وضعیت پرداخت
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${getPaymentStatusClass(
                        selectedOrder.paymentStatus,
                      )}`}
                    >
                      <CreditCard
                        size={14}
                      />

                      {
                        PAYMENT_STATUS_LABELS[
                          selectedOrder
                            .paymentStatus
                        ]
                      }
                    </span>

                    <select
                      value={
                        selectedOrder.paymentStatus
                      }
                      disabled={
                        updatingOrderId ===
                        selectedOrder.id
                      }
                      onChange={(event) => {
                        void updateOrder(
                          selectedOrder.id,
                          {
                            paymentStatus:
                              event.target
                                .value as PaymentStatus,
                          },
                        );
                      }}
                      className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs text-neutral-200 outline-none"
                    >
                      {PAYMENT_STATUS_OPTIONS.map(
                        (option) => (
                          <option
                            key={
                              option.value
                            }
                            value={
                              option.value
                            }
                          >
                            {
                              option.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer + Shipping */}
              <div className="mb-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <User
                      size={17}
                      className="text-neutral-500"
                    />

                    <h3 className="text-sm font-semibold">
                      اطلاعات مشتری
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-neutral-500">
                        نام:
                      </span>{" "}
                      <span className="text-neutral-200">
                        {
                          selectedOrder
                            .customer
                            .firstName
                        }{" "}
                        {
                          selectedOrder
                            .customer
                            .lastName
                        }
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500">
                        موبایل:
                      </span>{" "}
                      <span className="text-neutral-200">
                        {toPersianDigits(
                          selectedOrder
                            .customer
                            .phone,
                        )}
                      </span>
                    </div>

                    {selectedOrder
                      .customer
                      .email && (
                      <div>
                        <span className="text-neutral-500">
                          ایمیل:
                        </span>{" "}
                        <span className="text-neutral-200">
                          {
                            selectedOrder
                              .customer
                              .email
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin
                      size={17}
                      className="text-neutral-500"
                    />

                    <h3 className="text-sm font-semibold">
                      آدرس ارسال
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-neutral-500">
                        استان / شهر:
                      </span>{" "}
                      <span className="text-neutral-200">
                        {
                          selectedOrder
                            .shipping
                            .province
                        }{" "}
                        /{" "}
                        {
                          selectedOrder
                            .shipping
                            .city
                        }
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500">
                        آدرس:
                      </span>{" "}
                      <span className="text-neutral-200">
                        {
                          selectedOrder
                            .shipping
                            .address
                        }
                      </span>
                    </div>

                    <div>
                      <span className="text-neutral-500">
                        کد پستی:
                      </span>{" "}
                      <span className="text-neutral-200">
                        {toPersianDigits(
                          selectedOrder
                            .shipping
                            .postalCode,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025]">
                <div className="border-b border-white/10 px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Package
                      size={17}
                      className="text-neutral-500"
                    />

                    <h3 className="text-sm font-semibold">
                      محصولات سفارش
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-white/5">
                  {selectedOrder.items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-4"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                          <img
                            src={getImageUrl(
                              item.image,
                            )}
                            alt={
                              item.productName
                            }
                            className="h-full w-full object-cover"
                            onError={(
                              event,
                            ) => {
                              event.currentTarget.src =
                                "/placeholder.svg";
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-neutral-200">
                            {
                              item.productName
                            }
                          </div>

                          <div className="mt-1 text-xs text-neutral-500">
                            {toPersianDigits(
                              item.quantity,
                            )}{" "}
                            ×{" "}
                            {formatPrice(
                              item.unitPrice,
                            )}
                          </div>
                        </div>

                        <div className="self-center text-sm font-semibold text-neutral-100">
                          {formatPrice(
                            item.totalPrice,
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedOrder.description && (
                <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="mb-2 text-xs text-neutral-500">
                    توضیحات مشتری
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-300">
                    {
                      selectedOrder.description
                    }
                  </p>
                </div>
              )}

              {/* Price Summary */}
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">
                      جمع کالاها
                    </span>

                    <span className="text-neutral-200">
                      {formatPrice(
                        selectedOrder.subtotal,
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">
                      هزینه ارسال
                    </span>

                    <span className="text-neutral-200">
                      {selectedOrder
                        .shippingCost ===
                      0
                        ? "رایگان"
                        : formatPrice(
                            selectedOrder.shippingCost,
                          )}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-300">
                        مبلغ نهایی
                      </span>

                      <span className="text-lg font-bold text-white">
                        {formatPrice(
                          selectedOrder.total,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="mt-4 flex flex-col gap-1 text-xs text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  ثبت سفارش:{" "}
                  {formatDate(
                    selectedOrder.createdAt,
                  )}
                </span>

                <span>
                  آخرین بروزرسانی:{" "}
                  {formatDate(
                    selectedOrder.updatedAt,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}