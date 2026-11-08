import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  verifyPayment,
  type VerifyPaymentResponse,
} from "@/data/payments";

export const Route =
  createFileRoute("/mock-payment")({
    component: MockPaymentPage,
  });

type PaymentState =
  | "loading"
  | "ready"
  | "success"
  | "failed";

function MockPaymentPage() {
  const navigate = useNavigate();

  const [paymentId, setPaymentId] =
    useState<number | null>(null);

  const [authority, setAuthority] =
    useState<string | null>(null);

  const [state, setState] =
    useState<PaymentState>("loading");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<VerifyPaymentResponse | null>(
      null,
    );

  /*
   * =========================================================
   * Read payment information from URL
   * =========================================================
   */

  useEffect(() => {
    const searchParams =
      new URLSearchParams(
        window.location.search,
      );

    const rawPaymentId =
      searchParams.get("paymentId");

    const rawAuthority =
      searchParams.get("authority");

    const parsedPaymentId =
      Number(rawPaymentId);

    if (
      !Number.isInteger(
        parsedPaymentId,
      ) ||
      parsedPaymentId <= 0
    ) {
      setError(
        "شناسه پرداخت نامعتبر است.",
      );

      setState("failed");

      return;
    }

    if (
      !rawAuthority ||
      !rawAuthority.trim()
    ) {
      setError(
        "شناسه تراکنش آزمایشی پیدا نشد.",
      );

      setState("failed");

      return;
    }

    setPaymentId(
      parsedPaymentId,
    );

    setAuthority(
      rawAuthority,
    );

    setState("ready");
  }, []);

  /*
   * =========================================================
   * Verify payment
   * =========================================================
   */

  const handleVerify = async () => {
    if (
      !paymentId ||
      !authority ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      /*
       * verifyPayment currently receives
       * paymentId and the backend uses the
       * saved authority from the database.
       */

      const verification =
        await verifyPayment(
          paymentId,
        );

      setResult(
        verification,
      );

      setState("success");
    } catch (verificationError) {
      const message =
        verificationError instanceof
        Error
          ? verificationError.message
          : "تأیید پرداخت ناموفق بود.";

      setError(message);
      setState("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * =========================================================
   * Invalid / failed state
   * =========================================================
   */

  if (state === "failed") {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-10 text-white"
      >
        <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-3xl border border-red-500/20 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
              <XCircle
                className="h-10 w-10 text-red-400"
                aria-hidden="true"
              />
            </div>

            <h1 className="mb-3 text-2xl font-bold">
              پرداخت ناموفق بود
            </h1>

            <p className="mb-8 text-sm leading-7 text-slate-400">
              {error ||
                "امکان تأیید پرداخت وجود ندارد."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  navigate({
                    to: "/",
                  })
                }
                className="flex-1 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                بازگشت به فروشگاه
              </button>

              <Link
                to="/profile-orders"
                className="flex-1 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                سفارش‌های من
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * Loading state
   * =========================================================
   */

  if (state === "loading") {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2
            className="h-5 w-5 animate-spin"
            aria-hidden="true"
          />

          <span>
            در حال آماده‌سازی پرداخت...
          </span>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * Success state
   * =========================================================
   */

  if (
    state === "success" &&
    result
  ) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 px-4 py-10 text-white"
      >
        <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
          <div className="w-full rounded-3xl border border-emerald-500/20 bg-slate-900 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2
                className="h-10 w-10 text-emerald-400"
                aria-hidden="true"
              />
            </div>

            <p className="mb-2 text-sm font-medium text-emerald-400">
              پرداخت آزمایشی موفق
            </p>

            <h1 className="mb-8 text-2xl font-bold">
              پرداخت با موفقیت تأیید شد
            </h1>

            <div className="mb-8 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-right">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">
                  شماره سفارش
                </span>

                <span className="font-semibold">
                  {result.order.orderNumber}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">
                  مبلغ
                </span>

                <span className="font-semibold">
                  {result.order.total.toLocaleString(
                    "fa-IR",
                  )}{" "}
                  ریال
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-400">
                  وضعیت پرداخت
                </span>

                <span className="font-semibold text-emerald-400">
                  پرداخت‌شده
                </span>
              </div>

              {result.payment.trackingCode && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-400">
                    کد پیگیری
                  </span>

                  <span className="font-mono font-semibold">
                    {
                      result.payment
                        .trackingCode
                    }
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/profile-orders"
                className="flex-1 rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                مشاهده سفارش‌ها
              </Link>

              <Link
                to="/shop"
                className="flex-1 rounded-xl border border-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
              >
                ادامه خرید
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * Ready state
   * =========================================================
   */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-4 py-10 text-white"
    >
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          {/* Header */}

          <div className="border-b border-slate-800 bg-slate-950/70 p-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <CreditCard
                className="h-8 w-8 text-white"
                aria-hidden="true"
              />
            </div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />

              محیط آزمایشی
            </div>

            <h1 className="mt-4 text-2xl font-bold">
              پرداخت آزمایشی
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-400">
              این صفحه شبیه‌ساز درگاه پرداخت
              است و هیچ تراکنش واقعی انجام
              نمی‌دهد.
            </p>
          </div>

          {/* Payment information */}

          <div className="space-y-4 p-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck
                  className="h-5 w-5 text-emerald-400"
                  aria-hidden="true"
                />

                <span className="font-semibold">
                  اطلاعات تراکنش
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">
                    شناسه پرداخت
                  </span>

                  <span className="font-mono">
                    {paymentId}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">
                    وضعیت
                  </span>

                  <span className="text-amber-400">
                    در انتظار تأیید
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">
                    درگاه
                  </span>

                  <span>
                    Mock Payment
                  </span>
                </div>
              </div>
            </div>

            {/* Warning */}

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-7 text-amber-300">
              برای تست سیستم، دکمه زیر را بزنید.
              این عملیات پرداخت واقعی نیست و
              فقط وضعیت سفارش را به
              <strong className="mx-1">
                پرداخت‌شده
              </strong>
              تغییر می‌دهد.
            </div>

            {/* Verify */}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={
                handleVerify
              }
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 font-bold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />

                  در حال تأیید پرداخت...
                </>
              ) : (
                <>
                  <CheckCircle2
                    className="h-5 w-5"
                    aria-hidden="true"
                  />

                  تأیید پرداخت آزمایشی
                </>
              )}
            </button>

            <Link
              to="/shop"
              className="block w-full rounded-xl border border-slate-700 px-5 py-3 text-center text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              انصراف و بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}