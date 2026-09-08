import { useEffect, useState } from "react";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Edit3,
  MapPin,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type UserAddress,
} from "@/data/addresses";

export const Route = createFileRoute(
  "/profile-addresses",
)({
  head: () => ({
    meta: [
      {
        title: "آدرس‌های من | یدک موتور",
      },
      {
        name: "description",
        content:
          "مدیریت آدرس‌های ارسال سفارش",
      },
    ],
  }),
  component: AddressesPage,
});

type AddressForm = {
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
};

const EMPTY_FORM: AddressForm = {
  title: "",
  firstName: "",
  lastName: "",
  phone: "",
  province: "",
  city: "",
  address: "",
  postalCode: "",
};

function AddressesPage() {
  const [addresses, setAddresses] = useState<
    UserAddress[]
  >([]);

  const [form, setForm] =
    useState<AddressForm>(EMPTY_FORM);

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  useEffect(() => {
    setAddresses(getAddresses());
  }, []);

  const handleChange = (
    field: keyof AddressForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = () => {
    setError("");

    const requiredFields: Array<
      keyof AddressForm
    > = [
      "title",
      "firstName",
      "lastName",
      "phone",
      "province",
      "city",
      "address",
      "postalCode",
    ];

    const hasEmptyField = requiredFields.some(
      (field) =>
        !form[field].trim(),
    );

    if (hasEmptyField) {
      setError(
        "لطفاً تمام فیلدهای ضروری را تکمیل کنید.",
      );
      return;
    }

    if (editingId) {
      updateAddress(editingId, {
        ...form,
      });
    } else {
      createAddress({
        ...form,
        isDefault: addresses.length === 0,
      });
    }

    setAddresses(getAddresses());
    resetForm();
  };

  const handleEdit = (
    address: UserAddress,
  ) => {
    setEditingId(address.id);

    setForm({
      title: address.title,
      firstName: address.firstName,
      lastName: address.lastName,
      phone: address.phone,
      province: address.province,
      city: address.city,
      address: address.address,
      postalCode: address.postalCode,
    });

    setShowForm(true);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = (
    address: UserAddress,
  ) => {
    const confirmed = window.confirm(
      `آیا از حذف آدرس «${address.title}» مطمئن هستید؟`,
    );

    if (!confirmed) {
      return;
    }

    deleteAddress(address.id);

    setAddresses(getAddresses());
  };

  const handleSetDefault = (
    address: UserAddress,
  ) => {
    setDefaultAddress(address.id);

    setAddresses(getAddresses());
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* هدر */}
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
                آدرس‌های من
              </span>
            </nav>

            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-border bg-surface">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
                  آدرس‌های من
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  آدرس‌های ارسال سفارش خود را مدیریت کنید
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {/* دکمه افزودن */}
          {!showForm && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-extrabold">
                  آدرس‌های ذخیره‌شده
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  آدرس موردنظر خود را برای ارسال سفارش انتخاب کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setEditingId(null);
                  setError("");
                  setShowForm(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                افزودن آدرس جدید
              </button>
            </div>
          )}

          {/* فرم */}
          {showForm && (
            <section className="surface-panel rounded-xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold">
                    {editingId
                      ? "ویرایش آدرس"
                      : "افزودن آدرس جدید"}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    اطلاعات آدرس را با دقت وارد کنید.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
                  aria-label="بستن"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {error && (
                <div className="mt-5 rounded-lg border border-border bg-surface p-4 text-sm font-bold">
                  {error}
                </div>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <FormField
                  label="عنوان آدرس"
                  value={form.title}
                  placeholder="مثلاً منزل"
                  onChange={(value) =>
                    handleChange("title", value)
                  }
                />

                <FormField
                  label="نام"
                  value={form.firstName}
                  placeholder="نام گیرنده"
                  onChange={(value) =>
                    handleChange(
                      "firstName",
                      value,
                    )
                  }
                />

                <FormField
                  label="نام خانوادگی"
                  value={form.lastName}
                  placeholder="نام خانوادگی گیرنده"
                  onChange={(value) =>
                    handleChange(
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
                    handleChange(
                      "phone",
                      value,
                    )
                  }
                />

                <FormField
                  label="استان"
                  value={form.province}
                  placeholder="مثلاً تهران"
                  onChange={(value) =>
                    handleChange(
                      "province",
                      value,
                    )
                  }
                />

                <FormField
                  label="شهر"
                  value={form.city}
                  placeholder="مثلاً تهران"
                  onChange={(value) =>
                    handleChange(
                      "city",
                      value,
                    )
                  }
                />

                <FormField
                  label="کد پستی"
                  value={form.postalCode}
                  placeholder="۱۰ رقمی"
                  type="text"
                  dir="ltr"
                  onChange={(value) =>
                    handleChange(
                      "postalCode",
                      value,
                    )
                  }
                />

                <div className="sm:col-span-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-bold">
                      آدرس کامل
                    </span>

                    <textarea
                      value={form.address}
                      onChange={(event) =>
                        handleChange(
                          "address",
                          event.target.value,
                        )
                      }
                      placeholder="آدرس کامل، پلاک، واحد و..."
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-surface"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {editingId
                    ? "ذخیره تغییرات"
                    : "ذخیره آدرس"}
                </button>
              </div>
            </section>
          )}

          {/* لیست آدرس‌ها */}
          {!showForm && (
            <div className="mt-8">
              {addresses.length === 0 ? (
                <EmptyAddresses
                  onAdd={() => {
                    setForm(EMPTY_FORM);
                    setEditingId(null);
                    setShowForm(true);
                  }}
                />
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  {addresses.map(
                    (address) => (
                      <AddressCard
                        key={address.id}
                        address={address}
                        onEdit={() =>
                          handleEdit(address)
                        }
                        onDelete={() =>
                          handleDelete(address)
                        }
                        onSetDefault={() =>
                          handleSetDefault(
                            address,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          {/* برگشت */}
          {!showForm && (
            <div className="mt-8">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-bold transition-colors hover:bg-surface"
              >
                <ArrowRight className="h-4 w-4" />
                بازگشت به حساب کاربری
              </Link>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  return (
    <article
      className={`surface-panel rounded-xl p-5 sm:p-6 ${
        address.isDefault
          ? "border-primary/40"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-extrabold">
                {address.title}
              </h3>

              {address.isDefault && (
                <span className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-bold">
                  آدرس پیش‌فرض
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              {address.firstName}{" "}
              {address.lastName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="ویرایش آدرس"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            aria-label="حذف آدرس"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-lg border border-border bg-surface p-4">
        <p className="text-sm leading-7">
          {address.province}، {address.city}
        </p>

        <p className="text-sm leading-7 text-muted-foreground">
          {address.address}
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span>
            کد پستی:{" "}
            <span className="num">
              {address.postalCode}
            </span>
          </span>

          <span dir="ltr">
            {address.phone}
          </span>
        </div>
      </div>

      {!address.isDefault && (
        <button
          type="button"
          onClick={onSetDefault}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-bold transition-colors hover:bg-surface"
        >
          <Check className="h-4 w-4" />
          انتخاب به‌عنوان آدرس پیش‌فرض
        </button>
      )}
    </article>
  );
}

function EmptyAddresses({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="surface-panel mx-auto max-w-2xl rounded-xl p-8 text-center sm:p-12">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface">
        <MapPin className="h-9 w-9 text-muted-foreground" />
      </div>

      <h2 className="mt-6 text-xl font-extrabold">
        هنوز آدرسی ثبت نکرده‌اید
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
        یک آدرس اضافه کنید تا هنگام ثبت سفارش بتوانید
        سریع‌تر آن را انتخاب کنید.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        افزودن اولین آدرس
      </button>
    </div>
  );
}

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
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
      />
    </label>
  );
}