import { useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";

import {
  ArrowRight,
  LockKeyhole,
  Phone,
  User,
} from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      {
        title: "ورود به حساب کاربری | یدک موتور",
      },
      {
        name: "description",
        content:
          "ورود به حساب کاربری فروشگاه یدک موتور",
      },
    ],
  }),

  component: LoginPage,
});

/*
 * =========================================================
 * Types
 * =========================================================
 */

type LoginResponse = {
  success?: boolean;
  authenticated?: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    createdAt: string;
  };
  error?: string;
};

/*
 * =========================================================
 * Login Page
 * =========================================================
 */

function LoginPage() {
  const navigate = useNavigate();

  const [phone, setPhone] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * =======================================================
   * Submit
   * =======================================================
   */

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    const normalizedPhone =
      phone
        .trim()
        .replace(/[۰-۹]/g, (digit) =>
          String(
            "۰۱۲۳۴۵۶۷۸۹".indexOf(
              digit,
            ),
          ),
        );

    const normalizedPassword =
      password.trim();

    if (!normalizedPhone) {
      setError(
        "شماره تماس خود را وارد کنید.",
      );
      return;
    }

    if (!normalizedPassword) {
      setError(
        "رمز عبور خود را وارد کنید.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json",
            },
            body: JSON.stringify({
              phone: normalizedPhone,
              password:
                normalizedPassword,
            }),
          },
        );

      const data =
        (await response.json()) as LoginResponse;

      if (!response.ok) {
        throw new Error(
          data.error ||
            "ورود به حساب کاربری ناموفق بود.",
        );
      }

      if (
        !data.success ||
        !data.user
      ) {
        throw new Error(
          data.error ||
            "پاسخ نامعتبر از سرور دریافت شد.",
        );
      }

      /*
       * Session توسط سرور داخل Cookie
       * قرار گرفته است.
       *
       * بنابراین چیزی در localStorage
       * ذخیره نمی‌کنیم.
       */

      await navigate({
        to: "/profile",
      });
    } catch (err) {
      console.error(
        "Login error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "خطا در ورود به حساب کاربری.",
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =======================================================
   * Render
   * =======================================================
   */

  return (
    <div
      className="min-h-screen bg-background"
      dir="rtl"
    >
      <Header />

      <main>
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

              <ArrowRight className="h-3.5 w-3.5" />

              <span className="text-foreground">
                ورود
              </span>
            </nav>

            <div className="mt-5">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                ورود به حساب کاربری
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                برای ادامه وارد حساب کاربری خود شوید.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-md">
            <div className="surface-panel rounded-2xl p-6 sm:p-8">
              {/* =================================================
                  Icon
                 ================================================= */}

              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-border bg-surface">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="mt-5 text-center">
                <h2 className="text-xl font-extrabold">
                  خوش آمدید
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  شماره تماس و رمز عبور خود را وارد کنید.
                </p>
              </div>

              {/* =================================================
                  Error
                 ================================================= */}

              {error && (
                <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-bold leading-6 text-destructive">
                  {error}
                </div>
              )}

              {/* =================================================
                  Form
                 ================================================= */}

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-5"
              >
                {/* Phone */}

                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    شماره تماس
                  </span>

                  <div className="relative">
                    <Phone className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(
                          event.target.value,
                        )
                      }
                      placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                      dir="ltr"
                      disabled={loading}
                      className="w-full rounded-lg border border-border bg-surface py-3 pl-4 pr-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>

                {/* Password */}

                <label className="block">
                  <span className="mb-2 block text-sm font-bold">
                    رمز عبور
                  </span>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value,
                        )
                      }
                      placeholder="رمز عبور"
                      dir="ltr"
                      disabled={loading}
                      className="w-full rounded-lg border border-border bg-surface py-3 pl-4 pr-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>

                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "در حال ورود..."
                    : "ورود به حساب"}
                </button>
              </form>

              {/* =================================================
                  Register
                 ================================================= */}

              <div className="mt-7 border-t border-border pt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  حساب کاربری ندارید؟
                </p>

                <Link
                  to="/register"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-bold transition-colors hover:text-primary"
                >
                  ساخت حساب جدید
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}