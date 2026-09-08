import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowRight,
  ChevronLeft,
  Loader2,
  Package,
  ShoppingBag,
} from "lucide-react";

import {
  getOrders,
  orderStatusLabels,
  type Order,
} from "@/data/orders";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

import {
  toPersianDigits,
} from "@/data/shop";

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute(
  "/profile-orders",
)({
  head: () => ({
    meta: [
      {
        title:
          "سفارش‌های من | یدک موتور",
      },

      {
        name: "description",

        content:
          "مشاهده و پیگیری سفارش‌های ثبت‌شده",
      },
    ],
  }),

  component: OrdersPage,
});

/*
 * =========================================================
 * صفحه سفارش‌ها
 * =========================================================
 */

function OrdersPage() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * =======================================================
   * دریافت سفارش‌ها
   * =======================================================
   */

  const loadOrders = async () => {
    setIsLoading(true);

    setError(null);

    try {
      /*
       * getOrders خودش:
       *
       * - Session را بررسی می‌کند
       * - API را صدا می‌زند
       * - پاسخ Backend را به Order تبدیل می‌کند
       */

      const loadedOrders =
        await getOrders();

      /*
       * نکته:
       *
       * getOrders در صورت 401
       * آرایه خالی برمی‌گرداند.
       *
       * برای تشخیص قطعی Login،
       * Session را جداگانه بررسی می‌کنیم.
       */

      const authResponse =
        await fetch(
          "/api/auth/me",
          {
            method: "GET",

            credentials:
              "include",

            headers: {
              Accept:
                "application/json",
            },
          },
        );

      if (
        authResponse.status ===
        401
      ) {
        setIsLoggedIn(false);

        setOrders([]);

        return;
      }

      if (!authResponse.ok) {
        throw new Error(
          "بررسی وضعیت حساب کاربری انجام نشد.",
        );
      }

      setIsLoggedIn(true);

      setOrders(
        loadedOrders,
      );
    } catch (requestError) {
      console.error(
        "LOAD ORDERS ERROR:",
        requestError,
      );

      setOrders([]);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "خطا در دریافت سفارش‌ها.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  /*
   * =========================================================
   * Initial Load
   * =========================================================
   */

  useEffect(() => {
    void loadOrders();

    const handleFocus = () => {
      void loadOrders();
    };

    window.addEventListener(
      "focus",
      handleFocus,
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus,
      );
    };
  }, []);

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* ===================================================
            Header
        ==================================================== */}

        <section className="relative border-b border-border">
          <div className="hairline-grid absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <nav
              aria-label="مسیر صفحه"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link
                to="/"
                className="transition-colors hover:text-foreground"
              >
                خانه
              </Link>

              <ChevronLeft className="h-3.5 w-3.5" />

              <Link
                to="/profile"
                className="transition-colors hover:text-foreground"
              >
                حساب کاربری
              </Link>

              <ChevronLeft className="h-3.5 w-3.5" />

              <span className="text-foreground">
                سفارش‌های من
              </span>
            </nav>

            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-border bg-surface">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                  سفارش‌های من
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  مشاهده اطلاعات و پیگیری سفارش‌های ثبت‌شده
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            Main Content
        ==================================================== */}

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {!isLoggedIn ? (
            <LoginRequired />
          ) : isLoading ? (
            <LoadingOrders />
          ) : error ? (
            <OrdersError
              message={error}
              onRetry={() =>
                void loadOrders()
              }
            />
          ) : orders.length === 0 ? (
            <EmptyOrders />
          ) : (
            <div className="space-y-5">
              {/* ============================================
                  List Header
              ============================================= */}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">
                    لیست سفارش‌ها
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    تمام سفارش‌های ثبت‌شده شما در این بخش قرار دارند.
                  </p>
                </div>

                <span className="w-fit rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold">
                  {toPersianDigits(
                    orders.length,
                  )}{" "}
                  سفارش
                </span>
              </div>

              {/* ============================================
                  Orders
              ============================================= */}

              <div className="space-y-4">
                {orders.map(
                  (order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                    />
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

/*
 * =========================================================
 * Loading
 * =========================================================
 */

function LoadingOrders() {
  return (
    <div className="surface-panel mx-auto flex max-w-2xl flex-col items-center rounded-xl p-10 text-center sm:p-14">
      <Loader2 className="h-9 w-9 animate-spin text-muted-foreground" />

      <h2 className="mt-5 text-lg font-extrabold">
        در حال دریافت سفارش‌ها
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        لطفاً چند لحظه صبر کنید...
      </p>
    </div>
  );
}

/*
 * =========================================================
 * Login Required
 * =========================================================
 */

function LoginRequired() {
  return (
    <div className="surface-panel mx-auto max-w-2xl rounded-xl p-8 text-center sm:p-12">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface">
        <Package className="h-9 w-9 text-muted-foreground" />
      </div>

      <h2 className="mt-6 text-xl font-extrabold">
        ابتدا وارد حساب کاربری شوید
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        برای مشاهده سفارش‌های ثبت‌شده، ابتدا وارد حساب کاربری خود شوید.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          ورود به حساب
        </Link>

        <Link
          to="/register"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3.5 text-sm font-bold transition-colors hover:bg-surface"
        >
          ثبت‌نام
        </Link>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * Empty Orders
 * =========================================================
 */

function EmptyOrders() {
  return (
    <div className="surface-panel mx-auto max-w-2xl rounded-xl p-8 text-center sm:p-12">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface">
        <ShoppingBag className="h-9 w-9 text-muted-foreground" />
      </div>

      <h2 className="mt-6 text-xl font-extrabold">
        هنوز سفارشی ثبت نکرده‌اید
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        بعد از ثبت سفارش، اطلاعات آن شامل شماره سفارش،
        وضعیت و محصولات خریداری‌شده در این بخش نمایش داده می‌شود.
      </p>

      <Link
        to="/shop"
        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <ShoppingBag className="h-4 w-4" />

        مشاهده فروشگاه
      </Link>
    </div>
  );
}

/*
 * =========================================================
 * Error
 * =========================================================
 */

function OrdersError({
  message,
  onRetry,
}: {
  message: string;

  onRetry: () => void;
}) {
  return (
    <div className="surface-panel mx-auto max-w-2xl rounded-xl p-8 text-center sm:p-12">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface">
        <Package className="h-9 w-9 text-muted-foreground" />
      </div>

      <h2 className="mt-6 text-xl font-extrabold">
        دریافت سفارش‌ها با مشکل مواجه شد
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        تلاش مجدد
      </button>
    </div>
  );
}

/*
 * =========================================================
 * Order Card
 * =========================================================
 */

function OrderCard({
  order,
}: {
  order: Order;
}) {
  /*
   * =======================================================
   * تعداد کل کالاها
   * =======================================================
   */

  const totalItems =
    order.items.reduce(
      (total, item) =>
        total +
        Number(
          item.quantity,
        ),
      0,
    );

  /*
   * =======================================================
   * فرمت قیمت
   * =======================================================
   */

  const formatPrice = (
    price: number,
  ) =>
    `${toPersianDigits(
      Number(price).toLocaleString(
        "fa-IR",
      ),
    )} تومان`;

  /*
   * =======================================================
   * فرمت تاریخ
   * =======================================================
   */

  const formatDate = (
    date: string,
  ) => {
    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime(),
      )
    ) {
      return "تاریخ نامشخص";
    }

    return parsedDate.toLocaleDateString(
      "fa-IR",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );
  };

  /*
   * =======================================================
   * وضعیت سفارش
   * =======================================================
   */

  const statusLabel =
    orderStatusLabels[
      order.status
    ] ??
    "نامشخص";

  /*
   * =======================================================
   * روش ارسال
   * =======================================================
   */

  const shippingMethodLabel =
    order.shippingMethod ===
    "fast"
      ? "ارسال سریع"
      : "ارسال عادی";

  return (
    <article className="surface-panel overflow-hidden rounded-xl">
      {/* =====================================================
          Order Header
      ====================================================== */}

      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>

          <div>
            <p className="text-xs text-muted-foreground">
              شماره سفارش
            </p>

            <p className="mt-1 text-sm font-extrabold num">
              {order.id}
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold">
          {statusLabel}
        </span>
      </div>

      {/* =====================================================
          Order Summary
      ====================================================== */}

      <div className="grid gap-5 p-5 sm:grid-cols-4 sm:p-6">
        <OrderInfo
          label="تاریخ ثبت"
          value={formatDate(
            order.createdAt,
          )}
        />

        <OrderInfo
          label="تعداد کالا"
          value={`${toPersianDigits(
            totalItems,
          )} عدد`}
        />

        <OrderInfo
          label="روش ارسال"
          value={
            shippingMethodLabel
          }
        />

        <OrderInfo
          label="مبلغ نهایی"
          value={formatPrice(
            order.total,
          )}
          bold
        />
      </div>

      {/* =====================================================
          Products
      ====================================================== */}

      <div className="border-t border-border p-5 sm:p-6">
        <h3 className="text-sm font-extrabold">
          محصولات سفارش
        </h3>

        <div className="mt-4 space-y-3">
          {order.items.map(
            (
              item,
              index,
            ) => {
              const itemTotal =
                Number(
                  item.product.price,
                ) *
                Number(
                  item.quantity,
                );

              return (
                <div
                  key={`${order.id}-${item.product.id}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  {/* تصویر */}

                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                    <img
                      src={
                        item.product.image ||
                        "/placeholder.svg"
                      }
                      alt={
                        item.product
                          .name
                      }
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(
                        event,
                      ) => {
                        event.currentTarget.src =
                          "/placeholder.svg";
                      }}
                    />
                  </div>

                  {/* نام و تعداد */}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {
                        item.product
                          .name
                      }
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      تعداد:{" "}
                      <span className="num">
                        {toPersianDigits(
                          Number(
                            item.quantity,
                          ),
                        )}
                      </span>
                    </p>
                  </div>

                  {/* مبلغ */}

                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">
                      مبلغ
                    </p>

                    <p className="mt-1 text-xs font-extrabold num sm:text-sm">
                      {formatPrice(
                        itemTotal,
                      )}
                    </p>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>

      {/* =====================================================
          Shipping Information
      ====================================================== */}

      <div className="border-t border-border p-5 sm:p-6">
        <h3 className="text-sm font-extrabold">
          اطلاعات ارسال
        </h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <OrderInfo
            label="گیرنده"
            value={`${order.customer.firstName} ${order.customer.lastName}`}
          />

          <OrderInfo
            label="شماره تماس"
            value={toPersianDigits(
              order.customer.phone,
            )}
          />

          <OrderInfo
            label="استان"
            value={
              order.customer
                .province
            }
          />

          <OrderInfo
            label="شهر"
            value={
              order.customer.city
            }
          />

          <div className="sm:col-span-2">
            <OrderInfo
              label="آدرس"
              value={
                order.customer
                  .address
              }
            />
          </div>

          <OrderInfo
            label="کد پستی"
            value={toPersianDigits(
              order.customer
                .postalCode,
            )}
          />

          <OrderInfo
            label="هزینه ارسال"
            value={formatPrice(
              order.shippingCost,
            )}
          />

          {order.description?.trim() && (
            <div className="rounded-lg border border-border bg-surface p-4 sm:col-span-2">
              <p className="text-xs text-muted-foreground">
                توضیحات سفارش
              </p>

              <p className="mt-2 text-sm font-bold leading-7">
                {
                  order.description
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          Order Footer
      ====================================================== */}

      <div className="flex flex-col gap-4 border-t border-border bg-surface/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs text-muted-foreground">
            وضعیت فعلی سفارش
          </p>

          <p className="mt-1 text-sm font-extrabold">
            {statusLabel}
          </p>
        </div>

        <Link
          to="/profile"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-background"
        >
          بازگشت به حساب کاربری

          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

/*
 * =========================================================
 * Order Info
 * =========================================================
 */

function OrderInfo({
  label,
  value,
  bold = false,
}: {
  label: string;

  value: string;

  bold?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1 text-sm leading-7 ${
          bold
            ? "font-extrabold"
            : "font-bold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}