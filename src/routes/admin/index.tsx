import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FolderTree,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  Users,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

/* =========================================================
 * Types
 * ========================================================= */

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

type AdminOrder = {
  id: number;
  orderNumber: string;
  firstName: string;
  lastName: string;
  customerPhone: string;
  customerEmail: string | null;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  description: string | null;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  items: {
    id: number;
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    totalPrice: number;
    image: string | null;
  }[];
};

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  brand: string;
  categoryId: number;
  categoryName: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  availability: "in-stock" | "low-stock" | "out-of-stock";
  image: string | null;
  rating: number;
  reviews: number;
  popularity: number;
  keywords: string[];
  badge: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrdersResponse = {
  success: boolean;
  orders: AdminOrder[];
  count: number;
  message?: string;
};

type ProductsResponse = {
  success: boolean;
  products: AdminProduct[];
  count: number;
  message?: string;
};

/* =========================================================
 * Helpers
 * ========================================================= */

const faDigits = "۰۱۲۳۴۵۶۷۸۹";

function toPersianDigits(value: string | number) {
  return String(value).replace(
    /\d/g,
    (digit) => faDigits[Number(digit)] ?? digit,
  );
}

function formatPrice(value: number) {
  return `${toPersianDigits(
    Number(value).toLocaleString("en-US"),
  )} ریال`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getOrderStatusLabel(status: OrderStatus) {
  const labels: Record<OrderStatus, string> = {
    pending: "در انتظار پردازش",
    processing: "در حال آماده‌سازی",
    shipped: "ارسال شده",
    delivered: "تحویل شده",
    cancelled: "لغو شده",
  };

  return labels[status];
}

function getOrderStatusClass(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    case "processing":
      return "border-purple-500/20 bg-purple-500/10 text-purple-300";

    case "shipped":
      return "border-blue-500/20 bg-blue-500/10 text-blue-300";

    case "delivered":
      return "border-green-500/20 bg-green-500/10 text-green-300";

    case "cancelled":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    default:
      return "border-white/10 bg-white/5 text-neutral-300";
  }
}

function getPaymentStatusLabel(status: PaymentStatus) {
  const labels: Record<PaymentStatus, string> = {
    unpaid: "پرداخت نشده",
    paid: "پرداخت شده",
    failed: "پرداخت ناموفق",
    refunded: "مسترد شده",
  };

  return labels[status];
}

function getPaymentStatusClass(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "text-green-400";

    case "failed":
      return "text-red-400";

    case "refunded":
      return "text-yellow-400";

    case "unpaid":
    default:
      return "text-neutral-500";
  }
}

/* =========================================================
 * Page
 * ========================================================= */

function AdminDashboardPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [ordersError, setOrdersError] = useState("");
  const [productsError, setProductsError] = useState("");

  /* -------------------------------------------------------
   * Load orders
   * ------------------------------------------------------- */

  const loadOrders = useCallback(async () => {
    try {
      setOrdersError("");

      const response = await fetch("/api/admin/orders");

      const data = (await response.json()) as OrdersResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ?? "دریافت سفارش‌ها ناموفق بود.",
        );
      }

      setOrders(data.orders ?? []);
    } catch (error) {
      console.error("ADMIN ORDERS ERROR:", error);

      setOrdersError(
        error instanceof Error
          ? error.message
          : "دریافت سفارش‌ها با خطا مواجه شد.",
      );
    }
  }, []);

  /* -------------------------------------------------------
   * Load products
   * ------------------------------------------------------- */

  const loadProducts = useCallback(async () => {
    try {
      setProductsError("");

      const response = await fetch("/api/admin/products");

      const data = (await response.json()) as ProductsResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ?? "دریافت محصولات ناموفق بود.",
        );
      }

      setProducts(data.products ?? []);
    } catch (error) {
      console.error("ADMIN PRODUCTS ERROR:", error);

      setProductsError(
        error instanceof Error
          ? error.message
          : "دریافت محصولات با خطا مواجه شد.",
      );
    }
  }, []);

  /* -------------------------------------------------------
   * Load dashboard
   * ------------------------------------------------------- */

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        await Promise.all([
          loadOrders(),
          loadProducts(),
        ]);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [loadOrders, loadProducts],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* =======================================================
   * Statistics
   * ======================================================= */

  const statistics = useMemo(() => {
    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
      (order) => order.status === "pending",
    ).length;

    const paidOrders = orders.filter(
      (order) => order.paymentStatus === "paid",
    ).length;

    const totalSales = orders
      .filter(
        (order) =>
          order.status !== "cancelled" &&
          order.paymentStatus === "paid",
      )
      .reduce(
        (sum, order) => sum + Number(order.total),
        0,
      );

    const totalProducts = products.length;

    const availableProducts = products.filter(
      (product) => product.availability !== "out-of-stock",
    ).length;

    const lowStockProducts = products.filter(
      (product) =>
        product.availability === "low-stock" ||
        (product.stock > 0 && product.stock <= 5),
    ).length;

    const outOfStockProducts = products.filter(
      (product) =>
        product.availability === "out-of-stock" ||
        product.stock <= 0,
    ).length;

    return {
      totalOrders,
      pendingOrders,
      paidOrders,
      totalSales,
      totalProducts,
      availableProducts,
      lowStockProducts,
      outOfStockProducts,
    };
  }, [orders, products]);

  /* =======================================================
   * Recent orders
   * ======================================================= */

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [orders]);

  /* =======================================================
   * Low stock products
   * ======================================================= */

  const lowStockProducts = useMemo(() => {
    return [...products]
      .filter(
        (product) =>
          product.availability === "low-stock" ||
          (product.stock > 0 && product.stock <= 5),
      )
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }, [products]);

  /* =======================================================
   * Render
   * ======================================================= */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-neutral-950 px-3 py-5 text-white sm:px-5 sm:py-7 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* =================================================
         * Header
         * ================================================= */}

        <header className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 sm:mb-8 sm:pb-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="shrink-0 rounded-xl border border-white/10 bg-white/[0.06] p-2.5 sm:rounded-2xl sm:p-3">
              <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-3xl">
                داشبورد مدیریت
              </h1>

              <p className="mt-1 truncate text-xs text-neutral-400 sm:text-sm">
                مدیریت و نظارت بر فروشگاه یدک موتور
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />

            {refreshing
              ? "در حال بروزرسانی..."
              : "بروزرسانی اطلاعات"}
          </button>
        </header>

        {/* =================================================
         * Errors
         * ================================================= */}

        {(ordersError || productsError) && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />

              <div className="min-w-0">
                <h2 className="font-bold text-red-300">
                  دریافت بخشی از اطلاعات با مشکل مواجه شد
                </h2>

                {ordersError && (
                  <p className="mt-2 break-words text-xs text-red-300/80 sm:text-sm">
                    سفارش‌ها: {ordersError}
                  </p>
                )}

                {productsError && (
                  <p className="mt-1 break-words text-xs text-red-300/80 sm:text-sm">
                    محصولات: {productsError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================
         * Loading
         * ================================================= */}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center sm:p-16">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-neutral-400 sm:h-9 sm:w-9" />

            <p className="mt-4 text-sm text-neutral-400">
              در حال دریافت اطلاعات داشبورد...
            </p>
          </div>
        ) : (
          <>
            {/* =============================================
             * Main statistics
             * ============================================= */}

            <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">

              <StatCard
                icon={<ShoppingBag className="h-5 w-5" />}
                title="کل سفارش‌ها"
                value={statistics.totalOrders}
                description="تمام سفارش‌های ثبت‌شده"
                accent="neutral"
              />

              <StatCard
                icon={<Clock3 className="h-5 w-5" />}
                title="در انتظار پردازش"
                value={statistics.pendingOrders}
                description="نیازمند بررسی"
                accent="yellow"
              />

              <StatCard
                icon={<Package className="h-5 w-5" />}
                title="کل محصولات"
                value={statistics.totalProducts}
                description={`${toPersianDigits(
                  statistics.availableProducts,
                )} محصول قابل فروش`}
                accent="blue"
              />

              <StatCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                title="فروش پرداخت‌شده"
                value={formatPrice(statistics.totalSales)}
                description={`${toPersianDigits(
                  statistics.paidOrders,
                )} سفارش پرداخت‌شده`}
                accent="green"
                isPrice
              />

            </section>

            {/* =============================================
             * Main content
             * ============================================= */}

            <section className="mt-6 grid gap-5 lg:grid-cols-2">

              {/* ===========================================
               * Recent orders
               * =========================================== */}

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">

                <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
                  <div className="min-w-0">
                    <h2 className="font-black">
                      آخرین سفارش‌ها
                    </h2>

                    <p className="mt-1 text-xs text-neutral-500">
                      پنج سفارش اخیر
                    </p>
                  </div>

                  <Link
                    to="/admin/orders"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-neutral-400 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    همه
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <EmptyState
                    icon={
                      <ShoppingBag className="h-9 w-9 text-neutral-600" />
                    }
                    text="هنوز سفارشی ثبت نشده است."
                  />
                ) : (
                  <div className="divide-y divide-white/10">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        to="/admin/orders/$orderId"
                        params={{
                          orderId: String(order.id),
                        }}
                        className="block p-4 transition hover:bg-white/[0.03] sm:p-5"
                      >
                        <div className="flex items-center gap-3">

                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-2">
                              <p className="truncate font-mono text-xs font-bold sm:text-sm">
                                {order.orderNumber}
                              </p>

                              <span
                                className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:inline-flex ${getOrderStatusClass(
                                  order.status,
                                )}`}
                              >
                                {getOrderStatusLabel(
                                  order.status,
                                )}
                              </span>
                            </div>

                            <p className="mt-1 truncate text-xs text-neutral-300 sm:text-sm">
                              {order.firstName}{" "}
                              {order.lastName}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-neutral-500 sm:text-xs">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div className="shrink-0 text-left">
                            <p className="text-xs font-black sm:text-sm">
                              {formatPrice(order.total)}
                            </p>

                            <p
                              className={`mt-1 text-[10px] font-bold sm:text-xs ${getPaymentStatusClass(
                                order.paymentStatus,
                              )}`}
                            >
                              {getPaymentStatusLabel(
                                order.paymentStatus,
                              )}
                            </p>
                          </div>

                          <ArrowLeft className="h-4 w-4 shrink-0 text-neutral-700" />

                        </div>

                        <span
                          className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold sm:hidden ${getOrderStatusClass(
                            order.status,
                          )}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ===========================================
               * Low stock
               * =========================================== */}

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">

                <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
                  <div className="min-w-0">
                    <h2 className="font-black">
                      وضعیت موجودی
                    </h2>

                    <p className="mt-1 text-xs text-neutral-500">
                      محصولاتی که نیاز به بررسی دارند
                    </p>
                  </div>

                  <Link
                    to="/admin/products"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-neutral-400 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    محصولات
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Inventory summary */}

                <div className="grid grid-cols-3 gap-px border-b border-white/10 bg-white/10">
                  <InventorySummary
                    value={statistics.availableProducts}
                    label="قابل فروش"
                    className="text-green-400"
                  />

                  <InventorySummary
                    value={statistics.lowStockProducts}
                    label="موجودی کم"
                    className="text-yellow-300"
                  />

                  <InventorySummary
                    value={statistics.outOfStockProducts}
                    label="ناموجود"
                    className="text-red-400"
                  />
                </div>

                {lowStockProducts.length === 0 ? (
                  <EmptyState
                    icon={
                      <CheckCircle2 className="h-9 w-9 text-green-500/70" />
                    }
                    text="در حال حاضر محصولی با موجودی محدود وجود ندارد."
                  />
                ) : (
                  <div className="divide-y divide-white/10">
                    {lowStockProducts.map((product) => (
                      <Link
                        key={product.id}
                        to="/admin/products"
                        className="block p-4 transition hover:bg-white/[0.03] sm:p-5"
                      >
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-500/10 bg-yellow-500/5">
                            <Package className="h-4 w-4 text-yellow-300" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold sm:text-sm">
                              {product.name}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-neutral-500 sm:text-xs">
                              {product.categoryName ??
                                "بدون دسته‌بندی"}
                            </p>
                          </div>

                          <div className="shrink-0 text-left">
                            <p className="text-lg font-black text-yellow-300">
                              {toPersianDigits(product.stock)}
                            </p>

                            <p className="text-[10px] text-neutral-500">
                              عدد
                            </p>
                          </div>

                          <ArrowLeft className="h-4 w-4 shrink-0 text-neutral-700" />

                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

            </section>

            {/* =============================================
             * Quick actions
             * ============================================= */}

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">

              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-black">
                    مدیریت سریع
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
                    دسترسی مستقیم به بخش‌های اصلی پنل
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">

                <AdminAction
                  href="/admin/orders"
                  icon={
                    <ShoppingBag className="h-5 w-5" />
                  }
                  title="سفارش‌ها"
                  description="مشاهده و مدیریت سفارش‌ها"
                />

                <AdminAction
                  href="/admin/products"
                  icon={
                    <Package className="h-5 w-5" />
                  }
                  title="محصولات"
                  description="افزودن، ویرایش و موجودی"
                />

                <AdminAction
                  href="/admin/categories"
                  icon={
                    <FolderTree className="h-5 w-5" />
                  }
                  title="دسته‌بندی‌ها"
                  description="مدیریت دسته‌بندی محصولات"
                />

                <AdminAction
                  href="/admin/users"
                  icon={
                    <Users className="h-5 w-5" />
                  }
                  title="کاربران"
                  description="مدیریت کاربران و نقش‌ها"
                />

              </div>
            </section>

          </>
        )}
      </div>
    </main>
  );
}

/* =========================================================
 * Stat Card
 * ========================================================= */

function StatCard({
  icon,
  title,
  value,
  description,
  accent = "neutral",
  isPrice = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  accent?: "neutral" | "yellow" | "blue" | "green";
  isPrice?: boolean;
}) {
  const accentClasses = {
    neutral: "bg-white/[0.06] text-white",
    yellow: "bg-yellow-500/10 text-yellow-300",
    blue: "bg-blue-500/10 text-blue-300",
    green: "bg-green-500/10 text-green-300",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:bg-white/[0.06] sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-4">

        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold text-neutral-500 sm:text-xs">
            {title}
          </p>

          <p
            className={`mt-2 truncate font-black sm:mt-3 ${
              isPrice
                ? "text-sm leading-6 sm:text-2xl sm:leading-8"
                : "text-2xl sm:text-3xl"
            }`}
          >
            {typeof value === "number"
              ? toPersianDigits(value)
              : value}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-xl p-2 sm:p-3 ${accentClasses[accent]}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-2 truncate text-[10px] text-neutral-500 sm:mt-4 sm:text-xs">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
 * Inventory Summary
 * ========================================================= */

function InventorySummary({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className: string;
}) {
  return (
    <div className="bg-neutral-950/80 px-2 py-3 text-center sm:px-4 sm:py-4">
      <p className={`text-xl font-black sm:text-2xl ${className}`}>
        {toPersianDigits(value)}
      </p>

      <p className="mt-1 text-[9px] text-neutral-500 sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
 * Empty State
 * ========================================================= */

function EmptyState({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="p-9 text-center sm:p-10">
      {icon}

      <p className="mt-3 text-xs text-neutral-400 sm:text-sm">
        {text}
      </p>
    </div>
  );
}

/* =========================================================
 * Admin Action
 * ========================================================= */

function AdminAction({
  href,
  icon,
  title,
  description,
}: {
  href:
    | "/admin/orders"
    | "/admin/products"
    | "/admin/categories"
    | "/admin/users";
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={href}
      className="group rounded-2xl border border-white/10 bg-black/20 p-3.5 transition hover:border-white/20 hover:bg-white/[0.05] sm:p-5"
    >
      <div className="flex items-center gap-2.5 sm:gap-3">

        <div className="shrink-0 rounded-xl bg-white/[0.06] p-2.5 transition group-hover:bg-white/[0.1] sm:p-3">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold sm:text-sm">
            {title}
          </p>

          <p className="mt-1 hidden text-[11px] leading-5 text-neutral-500 sm:block">
            {description}
          </p>
        </div>

        <ArrowLeft className="h-4 w-4 shrink-0 text-neutral-700 transition group-hover:-translate-x-1 group-hover:text-white" />

      </div>
    </Link>
  );
}