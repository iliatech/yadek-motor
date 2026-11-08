import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Save,
  User,
  X,
  LogOut,
  LogIn,
} from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      {
        title: "حساب کاربری | یدک موتور",
      },
      {
        name: "description",
        content:
          "مدیریت حساب کاربری و سفارش‌های یدک موتور",
      },
    ],
  }),
  component: ProfilePage,
});

type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  createdAt?: string;
};

type AuthResponse = {
  authenticated: boolean;
  user: AuthUser | null;
  session?: {
    id: string;
    expiresAt: string;
  };
};

type EditableProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

function ProfilePage() {
  const navigate = useNavigate();

  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [form, setForm] =
    useState<EditableProfile>({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
    });

  const [editing, setEditing] =
    useState(false);

  const [loaded, setLoaded] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loggingOut, setLoggingOut] =
    useState(false);

  /*
   * =========================================================
   * دریافت کاربر فعلی از Session
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        setError("");

        const response = await fetch(
          "/api/auth/me",
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept:
                "application/json",
            },
          },
        );

        const data =
          (await response.json()) as AuthResponse;

        if (cancelled) {
          return;
        }

        /*
         * اگر کاربر وارد نشده باشد،
         * به صفحه ورود منتقل می‌شود.
         */

        if (
          !response.ok ||
          !data.authenticated ||
          !data.user
        ) {
          await navigate({
            to: "/login",
          });

          return;
        }

        setUser(data.user);

        setForm({
          firstName:
            data.user.firstName ?? "",
          lastName:
            data.user.lastName ?? "",
          phone:
            data.user.phone ?? "",
          email:
            data.user.email ?? "",
        });
      } catch (requestError) {
        console.error(
          "Load profile error:",
          requestError,
        );

        if (!cancelled) {
          setError(
            "دریافت اطلاعات حساب با خطا مواجه شد.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  /*
   * =========================================================
   * تغییر فیلدهای فرم
   * =========================================================
   */

  const handleChange = (
    field: keyof EditableProfile,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  /*
   * =========================================================
   * ذخیره اطلاعات
   *
   * نکته:
   * این قسمت فعلاً از API پروفایل استفاده می‌کند.
   * اگر endpoint مربوط به update user را هنوز نساخته‌ای،
   * خطای مناسب نمایش داده می‌شود و اطلاعات اشتباهاً
   * در localStorage ذخیره نمی‌شوند.
   * =========================================================
   */

  const handleSave = async () => {
    if (!user || saving) {
      return;
    }

    const firstName =
      form.firstName.trim();

    const lastName =
      form.lastName.trim();

    const phone =
      form.phone.trim();

    const email =
      form.email.trim();

    if (!firstName) {
      setError("نام خود را وارد کنید.");
      return;
    }

    if (!lastName) {
      setError(
        "نام خانوادگی خود را وارد کنید.",
      );
      return;
    }

    if (!phone) {
      setError(
        "شماره تماس خود را وارد کنید.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setSaved(false);

    try {
      /*
       * Endpoint مربوط به ویرایش کاربر
       */

      const response = await fetch(
        `/api/users/${encodeURIComponent(
          user.id,
        )}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            phone,
            email: email || null,
          }),
        },
      );

      const data =
        (await response.json()) as {
          success?: boolean;
          user?: AuthUser;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "ذخیره اطلاعات حساب انجام نشد.",
        );
      }

      /*
       * اگر API کاربر به‌روز‌شده را برگرداند،
       * همان را در state قرار می‌دهیم.
       */

      if (data.user) {
        setUser(data.user);

        setForm({
          firstName:
            data.user.firstName ?? "",
          lastName:
            data.user.lastName ?? "",
          phone:
            data.user.phone ?? "",
          email:
            data.user.email ?? "",
        });
      } else {
        /*
         * اگر API فقط success برگرداند،
         * state فعلی را با اطلاعات فرم به‌روز می‌کنیم.
         */

        setUser((current) =>
          current
            ? {
                ...current,
                firstName,
                lastName,
                phone,
                email:
                  email || null,
              }
            : current,
        );
      }

      setEditing(false);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (requestError) {
      console.error(
        "Save profile error:",
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "خطا در ذخیره اطلاعات حساب.",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * لغو ویرایش
   * =========================================================
   */

  const handleCancel = () => {
    if (!user) {
      return;
    }

    setForm({
      firstName:
        user.firstName ?? "",
      lastName:
        user.lastName ?? "",
      phone:
        user.phone ?? "",
      email:
        user.email ?? "",
    });

    setError("");
    setEditing(false);
  };

  /*
   * =========================================================
   * خروج از حساب
   * =========================================================
   */

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setError("");

    try {
      const response = await fetch(
        "/api/auth/logout",
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept:
              "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          "خروج از حساب انجام نشد.",
        );
      }

      setUser(null);

      await navigate({
        to: "/login",
      });
    } catch (requestError) {
      console.error(
        "Logout error:",
        requestError,
      );

      setError(
        requestError instanceof Error
          ? requestError.message
          : "خطا در خروج از حساب.",
      );

      setLoggingOut(false);
    }
  };

  /*
   * =========================================================
   * Loading
   * =========================================================
   */

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main>
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="surface-panel mx-auto max-w-xl rounded-xl p-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-border bg-surface">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>

              <h1 className="mt-5 text-xl font-extrabold">
                در حال بارگذاری حساب کاربری...
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                در حال بررسی وضعیت ورود شما هستیم.
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  /*
   * =========================================================
   * اگر کاربر وجود نداشت
   * =========================================================
   */

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main>
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="surface-panel mx-auto max-w-xl rounded-xl p-8 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-border bg-surface">
                <User className="h-7 w-7 text-muted-foreground" />
              </div>

              <h1 className="mt-5 text-xl font-extrabold">
                ورود به حساب کاربری
              </h1>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                برای مشاهده حساب کاربری باید ابتدا وارد حساب خود شوید.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <LogIn className="h-4 w-4" />
                  ورود
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-surface"
                >
                  ثبت‌نام
                </Link>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  /*
   * =========================================================
   * نام کامل
   * =========================================================
   */

  const fullName =
    `${user.firstName} ${user.lastName}`.trim();

  const displayName =
    fullName || "کاربر یدک موتور";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* =====================================================
            Header
        ====================================================== */}

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

              <span className="text-foreground">
                حساب کاربری
              </span>
            </nav>

            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-border bg-surface">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                    حساب کاربری
                  </h1>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {displayName}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />

                {loggingOut
                  ? "در حال خروج..."
                  : "خروج از حساب"}
              </button>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {/* =====================================================
              Error
          ====================================================== */}

          {error && (
            <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm font-bold text-destructive">
              {error}
            </div>
          )}

          {/* =====================================================
              Success
          ====================================================== */}

          {saved && (
            <div className="mb-6 rounded-xl border border-border bg-surface p-4 text-sm font-bold">
              اطلاعات حساب با موفقیت ذخیره شد.
            </div>
          )}

          {/* =====================================================
              کارت‌های حساب
          ====================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileCard
              icon={
                <User className="h-5 w-5" />
              }
              title="اطلاعات حساب"
              description="نام، شماره تماس و ایمیل خود را مدیریت کنید."
              clickable
              onClick={() =>
                setEditing(true)
              }
            />

            <Link
              to="/profile-orders"
              className="group block"
            >
              <ProfileCard
                icon={
                  <Package className="h-5 w-5" />
                }
                title="سفارش‌های من"
                description="مشاهده و پیگیری سفارش‌های ثبت‌شده."
                clickable
              />
            </Link>

            <Link
              to="/profile-addresses"
              className="group block"
            >
              <ProfileCard
                icon={
                  <MapPin className="h-5 w-5" />
                }
                title="آدرس‌های من"
                description="مدیریت آدرس‌های ارسال سفارش."
                clickable
              />
            </Link>
          </div>

          {/* =====================================================
              اطلاعات حساب
          ====================================================== */}

          <section className="mt-8 surface-panel rounded-xl p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">
                    اطلاعات حساب
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    اطلاعات شخصی شما برای ثبت و پیگیری سفارش‌ها
                  </p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditing(true)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-surface"
                  >
                    <Pencil className="h-4 w-4" />
                    ویرایش اطلاعات
                  </button>
                )}
              </div>

              {editing ? (
                <ProfileForm
                  form={form}
                  onChange={handleChange}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  canCancel={true}
                  saving={saving}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoItem
                    icon={
                      <User className="h-4 w-4" />
                    }
                    label="نام و نام خانوادگی"
                    value={
                      fullName ||
                      "ثبت نشده"
                    }
                  />

                  <InfoItem
                    icon={
                      <Phone className="h-4 w-4" />
                    }
                    label="شماره تماس"
                    value={
                      user.phone ||
                      "ثبت نشده"
                    }
                  />

                  <InfoItem
                    icon={
                      <Mail className="h-4 w-4" />
                    }
                    label="ایمیل"
                    value={
                      user.email ||
                      "ثبت نشده"
                    }
                  />

                  <Link
                    to="/profile-addresses"
                    className="block"
                  >
                    <InfoItem
                      icon={
                        <MapPin className="h-4 w-4" />
                      }
                      label="آدرس‌های ذخیره‌شده"
                      value="مدیریت آدرس‌ها"
                    />
                  </Link>
                </div>
              )}
            </div>
          </section>

          {/* =====================================================
              سفارش‌ها
          ====================================================== */}

          <section className="mt-8 surface-panel rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold">
                  سفارش‌های من
                </h2>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  سفارش‌های ثبت‌شده شما در بخش سفارش‌های من
                  قابل مشاهده و پیگیری هستند.
                </p>

                <Link
                  to="/profile-orders"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-surface"
                >
                  مشاهده سفارش‌ها
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* =====================================================
              آدرس‌ها
          ====================================================== */}

          <section className="mt-8 surface-panel rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                <MapPin className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold">
                  آدرس‌های ارسال
                </h2>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  آدرس‌های ذخیره‌شده خود را مدیریت کنید.
                </p>

                <Link
                  to="/profile-addresses"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-bold transition-colors hover:bg-surface"
                >
                  مدیریت آدرس‌ها
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* =====================================================
              وضعیت حساب
          ====================================================== */}

          <section className="mt-8 surface-panel rounded-xl p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-extrabold">
                  حساب کاربری
                </h2>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  شما در حال حاضر با حساب
                  <span className="mx-1 font-bold text-foreground">
                    {displayName}
                  </span>
                  وارد شده‌اید.
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  شناسه کاربر:
                  <span className="mr-1 font-mono">
                    {user.id}
                  </span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ==========================================================================
   Profile Form
   ========================================================================== */

function ProfileForm({
  form,
  onChange,
  onSave,
  onCancel,
  canCancel,
  saving,
}: {
  form: EditableProfile;
  onChange: (
    field: keyof EditableProfile,
    value: string,
  ) => void;
  onSave: () => void;
  onCancel: () => void;
  canCancel: boolean;
  saving: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="نام"
          value={form.firstName}
          placeholder="مثلاً ایلیا"
          onChange={(value) =>
            onChange(
              "firstName",
              value,
            )
          }
        />

        <FormField
          label="نام خانوادگی"
          value={form.lastName}
          placeholder="مثلاً سلیمی"
          onChange={(value) =>
            onChange(
              "lastName",
              value,
            )
          }
        />

        <FormField
          label="شماره تماس"
          value={form.phone}
          placeholder="۰۹۱۲۱۲۳۴۵۶۷"
          type="tel"
          dir="ltr"
          onChange={(value) =>
            onChange(
              "phone",
              value,
            )
          }
        />

        <FormField
          label="ایمیل"
          value={form.email}
          placeholder="example@email.com"
          type="email"
          dir="ltr"
          onChange={(value) =>
            onChange(
              "email",
              value,
            )
          }
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
        {canCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            انصراف
          </button>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          {saving
            ? "در حال ذخیره..."
            : "ذخیره اطلاعات"}
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   Form Field
   ========================================================================== */

function FormField({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  dir = "rtl",
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        dir={dir}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
      />
    </label>
  );
}

/* ==========================================================================
   Profile Card
   ========================================================================== */

function ProfileCard({
  icon,
  title,
  description,
  clickable = false,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={`surface-panel relative h-full rounded-xl p-6 text-right transition-all duration-200 ${
        clickable
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-panel)]"
          : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors ${
            clickable
              ? "group-hover:border-primary/40 group-hover:text-primary"
              : ""
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold">
            {title}
          </h2>

          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            {description}
          </p>
        </div>

        {clickable && (
          <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-1" />
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group block w-full text-right"
      >
        {content}
      </button>
    );
  }

  return content;
}

/* ==========================================================================
   Info Item
   ========================================================================== */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-background text-muted-foreground">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {label}
          </p>

          <p className="mt-1 truncate text-sm font-bold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}