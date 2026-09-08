import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      {
        title: "ساخت حساب کاربری | یدک موتور",
      },
      {
        name: "description",
        content: "ساخت حساب کاربری در فروشگاه یدک موتور",
      },
    ],
  }),
  component: RegisterPage,
});

type RegisterForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹]/g, (digit) =>
    String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)),
  );
}

function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (
    field: keyof RegisterForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const phone = normalizeDigits(form.phone.trim());
    const email = form.email.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!firstName) {
      setError("نام خود را وارد کنید.");
      return;
    }

    if (!lastName) {
      setError("نام خانوادگی خود را وارد کنید.");
      return;
    }

    if (!phone) {
      setError("شماره تماس خود را وارد کنید.");
      return;
    }

    if (!/^09\d{9}$/.test(phone)) {
      setError("شماره تماس واردشده معتبر نیست.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("ایمیل واردشده معتبر نیست.");
      return;
    }

    if (!password) {
      setError("رمز عبور خود را وارد کنید.");
      return;
    }

    if (password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (password !== confirmPassword) {
      setError("تکرار رمز عبور با رمز عبور یکسان نیست.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || "خطا در ایجاد حساب کاربری.",
        );
      }

      if (!data?.success) {
        throw new Error(
          data?.error || "ثبت‌نام انجام نشد.",
        );
      }

      await navigate({
        to: "/profile",
      });
    } catch (error) {
      console.error("Register error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "خطا در ایجاد حساب کاربری.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowRight className="h-4 w-4" />
              بازگشت به ورود
            </Link>

            <div className="mt-6">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                ساخت حساب کاربری
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                برای خرید و پیگیری سفارش‌ها حساب خود را ایجاد کنید.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="surface-panel rounded-xl p-6 sm:p-8">
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-bold text-destructive"
                >
                  {error}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  label="نام"
                  icon={<User className="h-4 w-4" />}
                  value={form.firstName}
                  placeholder="مثلاً ایلیا"
                  autoComplete="given-name"
                  onChange={(value) =>
                    updateField("firstName", value)
                  }
                />

                <FormField
                  label="نام خانوادگی"
                  icon={<User className="h-4 w-4" />}
                  value={form.lastName}
                  placeholder="مثلاً سلیمی"
                  autoComplete="family-name"
                  onChange={(value) =>
                    updateField("lastName", value)
                  }
                />

                <FormField
                  label="شماره تماس"
                  icon={<Phone className="h-4 w-4" />}
                  value={form.phone}
                  placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  onChange={(value) =>
                    updateField("phone", value)
                  }
                />

                <FormField
                  label="ایمیل"
                  icon={<Mail className="h-4 w-4" />}
                  value={form.email}
                  placeholder="example@email.com"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  onChange={(value) =>
                    updateField("email", value)
                  }
                />

                <FormField
                  label="رمز عبور"
                  icon={<Lock className="h-4 w-4" />}
                  value={form.password}
                  placeholder="حداقل ۶ کاراکتر"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  onChange={(value) =>
                    updateField("password", value)
                  }
                />

                <FormField
                  label="تکرار رمز عبور"
                  icon={<Lock className="h-4 w-4" />}
                  value={form.confirmPassword}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  onChange={(value) =>
                    updateField("confirmPassword", value)
                  }
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ایجاد حساب...
                  </>
                ) : (
                  "ساخت حساب کاربری"
                )}
              </button>

              <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">
                قبلاً حساب ساخته‌اید؟{" "}
                <Link
                  to="/login"
                  className="font-bold text-foreground transition-colors hover:text-primary"
                >
                  وارد حساب شوید
                </Link>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FormField({
  label,
  icon,
  value,
  placeholder,
  onChange,
  type = "text",
  dir = "rtl",
  autoComplete,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: "ltr" | "rtl";
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold">
        {icon}
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        dir={dir}
        autoComplete={autoComplete}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
      />
    </label>
  );
}