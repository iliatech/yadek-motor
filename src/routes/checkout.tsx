import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { getAccount } from "@/data/account";
import {
  createOrder,
  type OrderCustomer,
} from "@/data/orders";
import { createPayment } from "@/data/payments";
import {
  getAddresses,
  getDefaultAddress,
  type UserAddress,
} from "@/data/addresses";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

import { useCart } from "@/hooks/useCart";
import { toPersianDigits } from "@/data/shop";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      {
        title: "تکمیل سفارش | یدک موتور",
      },
      {
        name: "description",
        content:
          "تکمیل اطلاعات و ثبت سفارش در فروشگاه یدک موتور.",
      },
    ],
  }),

  component: CheckoutPage,
});

type formData = {
  firstName: string;
  lastName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  description: string;
};

type FormErrors = {
  [K in keyof formData]?: string | undefined;
};

type ShippingMethod =
  | "normal"
  | "fast";

type CheckoutStep = 1 | 2;

/*
 * --------------------------------------------------
 * تبدیل اعداد فارسی و عربی به انگلیسی
 * --------------------------------------------------
 */

function normalizeDigits(
  value: string,
) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String(
        "۰۱۲۳۴۵۶۷۸۹".indexOf(
          digit,
        ),
      ),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(
        "٠١٢٣٤٥٦٧٨٩".indexOf(
          digit,
        ),
      ),
    );
}

/*
 * --------------------------------------------------
 * صفحه Checkout
 * --------------------------------------------------
 */

function CheckoutPage() {
  const {
    items,
    cartCount,
    subtotal,
  } = useCart();

  /*
   * بررسی Session واقعی سرور
   *
   * localStorage فقط برای prefill اطلاعات است
   * و مرجع احراز هویت محسوب نمی‌شود.
   */

  const [authChecking, setAuthChecking] =
    useState(true);

  const [addresses, setAddresses] =
    useState<UserAddress[]>([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState<string | null>(null);

  const [formData, setformData] =
    useState<formData>({
      firstName: "",
      lastName: "",
      phone: "",
      province: "",
      city: "",
      address: "",
      postalCode: "",
      description: "",
    });

  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("normal");

  const [step, setStep] =
    useState<CheckoutStep>(1);

  const [errors, setErrors] =
    useState<FormErrors>({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  /*
   * --------------------------------------------------
   * بررسی احراز هویت
   * --------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              credentials: "include",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        type AuthMeResponse = {
  authenticated?: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    createdAt: string;
  };
};

const data =
  (await response
    .json()
    .catch(
      () => null,
    )) as AuthMeResponse | null;

if (
  !response.ok ||
  !data?.["authenticated"] ||
  !data?.["user"]
) {
          window.location.assign(
            "/login?returnTo=%2Fcheckout",
          );

          return;
        }

        setAuthChecking(false);
      } catch (error) {
        console.error(
          "Checkout auth check error:",
          error,
        );

        if (!cancelled) {
          window.location.assign(
            "/login?returnTo=%2Fcheckout",
          );
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * --------------------------------------------------
   * دریافت اطلاعات اولیه کاربر
   * --------------------------------------------------
   */

  useEffect(() => {
    if (authChecking) {
      return;
    }

    try {
      const account = getAccount();

      if (account) {
        setformData((current) => ({
          ...current,

          firstName:
            account.firstName || "",

          lastName:
            account.lastName || "",

          phone:
            account.phone || "",
        }));
      }
    } catch (error) {
      console.error(
        "Checkout account prefill error:",
        error,
      );
    }

    /*
     * دریافت آدرس‌های ذخیره‌شده
     */

    try {
      const savedAddresses =
        getAddresses();

      setAddresses(savedAddresses);

      const defaultAddress =
        getDefaultAddress();

      if (defaultAddress) {
        selectAddress(defaultAddress);
      }
    } catch (error) {
      console.error(
        "Checkout address loading error:",
        error,
      );
    }
  }, [authChecking]);

  /*
   * --------------------------------------------------
   * هزینه ارسال
   * --------------------------------------------------
   */

  const shippingCost =
    shippingMethod === "normal"
      ? 0
      : 120000;

  /*
   * --------------------------------------------------
   * مبلغ نهایی
   * --------------------------------------------------
   */

  const total =
    subtotal + shippingCost;

  /*
   * --------------------------------------------------
   * فرمت قیمت
   * --------------------------------------------------
   */

  const formatPrice = (
    price: number,
  ) =>
    `${toPersianDigits(
      price.toLocaleString("fa-IR"),
    )} ریال`;

  /*
   * --------------------------------------------------
   * تغییر فیلد
   * --------------------------------------------------
   */

  const updateField = (
    field: keyof formData,
    value: string,
  ) => {
    setformData((current) => ({
      ...current,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    const addressFields: (
      keyof formData
    )[] = [
      "firstName",
      "lastName",
      "phone",
      "province",
      "city",
      "address",
      "postalCode",
    ];

    if (addressFields.includes(field)) {
      setSelectedAddressId(null);
    }
  };

  /*
   * --------------------------------------------------
   * انتخاب آدرس ذخیره‌شده
   * --------------------------------------------------
   */

  function selectAddress(
    address: UserAddress,
  ) {
    const account = getAccount();

    setSelectedAddressId(address.id);

    setformData((current) => ({
      ...current,

      firstName:
        account?.firstName ??
        current.firstName,

      lastName:
        account?.lastName ??
        current.lastName,

      phone:
        account?.phone ??
        current.phone,

      province:
        address.province,

      city:
        address.city,

      address:
        address.address,

      postalCode:
        address.postalCode,
    }));

    setErrors((current) => ({
      ...current,

      firstName: undefined,
      lastName: undefined,
      phone: undefined,
      province: undefined,
      city: undefined,
      address: undefined,
      postalCode: undefined,
    }));
  }

  /*
   * --------------------------------------------------
   * اعتبارسنجی فرم
   * --------------------------------------------------
   */

  const validateForm = () => {
    const newErrors: FormErrors = {};

    const firstName =
      formData.firstName.trim();

    const lastName =
      formData.lastName.trim();

    const phone =
      normalizeDigits(
        formData.phone,
      ).trim();

    const province =
      formData.province.trim();

    const city =
      formData.city.trim();

    const address =
      formData.address.trim();

    const postalCode =
      normalizeDigits(
        formData.postalCode,
      ).trim();

    if (!firstName) {
      newErrors.firstName =
        "نام را وارد کنید.";
    }

    if (!lastName) {
      newErrors.lastName =
        "نام خانوادگی را وارد کنید.";
    }

    if (!phone) {
      newErrors.phone =
        "شماره موبایل را وارد کنید.";
    } else if (
      !/^09\d{9}$/.test(phone)
    ) {
      newErrors.phone =
        "شماره موبایل معتبر نیست.";
    }

    if (!province) {
      newErrors.province =
        "استان را وارد کنید.";
    }

    if (!city) {
      newErrors.city =
        "شهر را وارد کنید.";
    }

    if (!address) {
      newErrors.address =
        "آدرس را وارد کنید.";
    }

    if (!postalCode) {
      newErrors.postalCode =
        "کد پستی را وارد کنید.";
    } else if (
      !/^\d{10}$/.test(postalCode)
    ) {
      newErrors.postalCode =
        "کد پستی باید ۱۰ رقم باشد.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  };

  /*
   * --------------------------------------------------
   * رفتن به مرحله دوم
   * --------------------------------------------------
   */

  const handleContinue = () => {
    if (!validateForm()) {
      toast.error(
        "اطلاعات ناقص است",
        {
          description:
            "لطفاً اطلاعات گیرنده و آدرس را کامل کنید.",
        },
      );

      return;
    }

    setStep(2);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * --------------------------------------------------
   * برگشت به مرحله اول
   * --------------------------------------------------
   */

  const handleBack = () => {
    setStep(1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * --------------------------------------------------
   * ثبت سفارش + ایجاد پرداخت
   * --------------------------------------------------
   */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!validateForm()) {
      setStep(1);

      toast.error(
        "اطلاعات ناقص است",
        {
          description:
            "لطفاً اطلاعات گیرنده و آدرس را کامل کنید.",
        },
      );

      return;
    }

    if (items.length === 0) {
      toast.error(
        "سبد خرید خالی است",
        {
          description:
            "ابتدا محصولی به سبد خرید اضافه کنید.",
        },
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const customer: OrderCustomer = {
        firstName:
          formData.firstName.trim(),

        lastName:
          formData.lastName.trim(),

        phone:
          normalizeDigits(
            formData.phone,
          ).trim(),

        province:
          formData.province.trim(),

        city:
          formData.city.trim(),

        address:
          formData.address.trim(),

        postalCode:
          normalizeDigits(
            formData.postalCode,
          ).trim(),
      };

      /*
       * --------------------------------------------
       * مرحله اول: ایجاد سفارش
       * --------------------------------------------
       */

      const order =
        await createOrder({
          customer,
          items,
          subtotal,
          shippingCost,
          total,
          shippingMethod,
          description:
            formData.description.trim(),
        });

      /*
       * --------------------------------------------
       * مرحله دوم: ایجاد Payment
       * --------------------------------------------
       */

      if (
        !Number.isInteger(
          order.databaseId,
        ) ||
        order.databaseId <= 0
      ) {
        throw new Error(
          "شناسه دیتابیس سفارش معتبر نیست.",
        );
      }

      console.log(
        "ORDER BEFORE PAYMENT:",
        order,
      );

      console.log(
        "DATABASE ORDER ID:",
        order.databaseId,
      );

      const payment =
        await createPayment({
          orderId:
            order.databaseId,
          provider: "zarinpal",
        });

      /*
       * --------------------------------------------
       * مرحله سوم: انتقال به درگاه
       * --------------------------------------------
       */

      toast.success(
        "سفارش ایجاد شد",
        {
          description:
            "در حال انتقال به صفحه پرداخت...",
        },
      );

      /*
       * سبد خرید اینجا پاک نمی‌شود.
       */

      window.location.href =
        payment.paymentUrl;
    } catch (error) {
      console.error(
        "Checkout submit error:",
        error,
      );

      toast.error(
        "ادامه پرداخت انجام نشد",
        {
          description:
            error instanceof Error &&
            error.message
              ? error.message
              : "هنگام ایجاد سفارش یا پرداخت خطایی رخ داد. لطفاً دوباره تلاش کنید.",
        },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /*
   * --------------------------------------------------
   * در حال بررسی حساب
   * --------------------------------------------------
   */

  if (authChecking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="mx-auto flex min-h-[50vh] max-w-7xl items-center justify-center px-4">
          <div className="text-sm font-bold text-muted-foreground">
            در حال بررسی حساب کاربری...
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * سبد خرید خالی
   * --------------------------------------------------
   */

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main>
          <section className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface">
                <Truck className="h-9 w-9 text-muted-foreground" />
              </div>

              <h1 className="mt-6 text-xl font-extrabold">
                سبد خرید شما خالی است
              </h1>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                برای ادامه فرایند خرید ابتدا
                محصولی به سبد خرید اضافه کنید.
              </p>

              <Link
                to="/shop"
                className="mt-7 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                مشاهده فروشگاه
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * صفحه اصلی Checkout
   * --------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative border-b border-border">
          <div className="hairline-grid absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <nav
              aria-label="مسیر صفحه"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Link
                to="/"
                className="transition-colors hover:text-foreground"
              >
                خانه
              </Link>

              <ArrowLeft className="h-3.5 w-3.5" />

              <Link
                to="/cart"
                className="transition-colors hover:text-foreground"
              >
                سبد خرید
              </Link>

              <ArrowLeft className="h-3.5 w-3.5" />

              <span className="text-foreground">
                تکمیل سفارش
              </span>
            </nav>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-4xl">
              تکمیل سفارش
            </h1>

            <p className="mt-3 text-sm leading-8 text-muted-foreground">
              اطلاعات سفارش را بررسی و تکمیل کنید.
            </p>

            <CheckoutProgress
              step={step}
            />
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          noValidate
        >
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            {step === 1 ? (
              <StepOne
                formData={formData}
                errors={errors}
                addresses={addresses}
                selectedAddressId={
                  selectedAddressId
                }
                updateField={
                  updateField
                }
                selectAddress={
                  selectAddress
                }
                onContinue={
                  handleContinue
                }
              />
            ) : (
              <StepTwo
                items={items}
                cartCount={cartCount}
                subtotal={subtotal}
                shippingCost={
                  shippingCost
                }
                total={total}
                shippingMethod={
                  shippingMethod
                }
                setShippingMethod={
                  setShippingMethod
                }
                formData={formData}
                formatPrice={
                  formatPrice
                }
                onBack={handleBack}
                isSubmitting={
                  isSubmitting
                }
              />
            )}
          </section>
        </form>
      </main>

      <Footer />
    </div>
  );
}

/*
 * --------------------------------------------------
 * مرحله اول
 * --------------------------------------------------
 */

function StepOne({
  formData,
  errors,
  addresses,
  selectedAddressId,
  updateField,
  selectAddress,
  onContinue,
}: {
  formData: formData;
  errors: FormErrors;
  addresses: UserAddress[];
  selectedAddressId: string | null;
  updateField: (
    field: keyof formData,
    value: string,
  ) => void;
  selectAddress: (
    address: UserAddress,
  ) => void;
  onContinue: () => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <div className="surface-panel rounded-xl p-6 sm:p-7">
          <SectionTitle
            number="۱"
            title="اطلاعات گیرنده"
            description="اطلاعات فرد دریافت‌کننده سفارش"
          />

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <FormField
              label="نام"
              required
              value={
                formData.firstName
              }
              onChange={(value) =>
                updateField(
                  "firstName",
                  value,
                )
              }
              placeholder="مثلاً ایلیا"
              error={
                errors.firstName
              }
            />

            <FormField
              label="نام خانوادگی"
              required
              value={
                formData.lastName
              }
              onChange={(value) =>
                updateField(
                  "lastName",
                  value,
                )
              }
              placeholder="مثلاً سلیمی"
              error={
                errors.lastName
              }
            />

            <FormField
              label="شماره موبایل"
              required
              value={
                formData.phone
              }
              onChange={(value) =>
                updateField(
                  "phone",
                  value,
                )
              }
              placeholder="09123456789"
              type="tel"
              dir="ltr"
              error={
                errors.phone
              }
            />
          </div>
        </div>

        <div className="surface-panel rounded-xl p-6 sm:p-7">
          <SectionTitle
            icon={
              <MapPin className="h-4 w-4" />
            }
            title="آدرس ارسال"
            description="آدرس دقیق محل تحویل سفارش"
          />

          {addresses.length > 0 && (
            <div className="mt-7">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">
                    آدرس‌های ذخیره‌شده
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    یکی از آدرس‌های قبلی خود را انتخاب کنید.
                  </p>
                </div>

                <Link
                  to="/profile-addresses"
                  className="text-xs font-bold text-primary transition-opacity hover:opacity-80"
                >
                  مدیریت آدرس‌ها
                </Link>
              </div>

              <div className="grid gap-3">
                {addresses.map(
                  (address) => (
                    <AddressOption
                      key={
                        address.id
                      }
                      address={
                        address
                      }
                      selected={
                        selectedAddressId ===
                        address.id
                      }
                      onClick={() =>
                        selectAddress(
                          address,
                        )
                      }
                    />
                  ),
                )}
              </div>
            </div>
          )}

          {addresses.length === 0 && (
            <div className="mt-7 rounded-xl border border-dashed border-border bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">
                    آدرس ذخیره‌شده‌ای ندارید
                  </p>

                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    می‌توانید آدرس را همین‌جا وارد کنید
                    یا یک آدرس در حساب کاربری ذخیره کنید.
                  </p>
                </div>

                <Link
                  to="/profile-addresses"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border px-4 py-2.5 text-xs font-bold transition-colors hover:bg-background"
                >
                  افزودن آدرس
                </Link>
              </div>
            </div>
          )}

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <FormField
              label="استان"
              required
              value={
                formData.province
              }
              onChange={(value) =>
                updateField(
                  "province",
                  value,
                )
              }
              placeholder="مثلاً تهران"
              error={
                errors.province
              }
            />

            <FormField
              label="شهر"
              required
              value={
                formData.city
              }
              onChange={(value) =>
                updateField(
                  "city",
                  value,
                )
              }
              placeholder="مثلاً تهران"
              error={
                errors.city
              }
            />

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold">
                آدرس کامل

                <span className="mr-1 text-primary">
                  *
                </span>
              </label>

              <textarea
                value={
                  formData.address
                }
                onChange={(event) =>
                  updateField(
                    "address",
                    event.target
                      .value,
                  )
                }
                placeholder="خیابان، کوچه، پلاک، واحد..."
                rows={4}
                className={`mt-2 w-full resize-none rounded-lg border bg-surface px-4 py-3 text-sm leading-7 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ${
                  errors.address
                    ? "border-destructive"
                    : "border-border"
                }`}
              />

              {errors.address && (
                <p className="mt-1.5 text-xs text-destructive">
                  {
                    errors.address
                  }
                </p>
              )}
            </div>

            <FormField
              label="کد پستی"
              required
              value={
                formData.postalCode
              }
              onChange={(value) =>
                updateField(
                  "postalCode",
                  value,
                )
              }
              placeholder="۱۰ رقم"
              type="text"
              dir="ltr"
              error={
                errors.postalCode
              }
            />

            <div />

            <div className="sm:col-span-2">
              <label className="block text-sm font-bold">
                توضیحات سفارش

                <span className="mr-1 text-xs font-normal text-muted-foreground">
                  اختیاری
                </span>
              </label>

              <textarea
                value={
                  formData.description
                }
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target
                      .value,
                  )
                }
                placeholder="اگر توضیح خاصی برای ارسال دارید بنویسید..."
                rows={3}
                className="mt-2 w-full resize-none rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-7 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <CheckoutMiniSummary
          itemCount={
            formData
          }
          onContinue={
            onContinue
          }
        />
      </aside>
    </div>
  );
}

/*
 * --------------------------------------------------
 * خلاصه کوچک مرحله اول
 * --------------------------------------------------
 */

function CheckoutMiniSummary({
  itemCount,
  onContinue,
}: {
  itemCount: formData;
  onContinue: () => void;
}) {
  const hasName =
    itemCount.firstName.trim() &&
    itemCount.lastName.trim();

  const hasPhone =
    normalizeDigits(
      itemCount.phone,
    ).trim();

  const hasAddress =
    itemCount.province.trim() &&
    itemCount.city.trim() &&
    itemCount.address.trim();

  const completed =
    Number(Boolean(hasName)) +
    Number(Boolean(hasPhone)) +
    Number(Boolean(hasAddress));

  return (
    <div className="surface-panel rounded-xl p-6">
      <h2 className="text-base font-extrabold">
        تکمیل اطلاعات
      </h2>

      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        برای ادامه، اطلاعات گیرنده و آدرس
        ارسال را تکمیل کنید.
      </p>

      <div className="mt-6 space-y-3">
        <StatusItem
          label="اطلاعات گیرنده"
          completed={
            Boolean(hasName)
          }
        />

        <StatusItem
          label="شماره موبایل"
          completed={
            Boolean(hasPhone)
          }
        />

        <StatusItem
          label="آدرس ارسال"
          completed={
            Boolean(hasAddress)
          }
        />
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            پیشرفت
          </span>

          <span className="font-bold num">
            {toPersianDigits(
              `${completed}/3`,
            )}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${
                (completed / 3) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={
          onContinue
        }
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        ادامه

        <ArrowLeft className="h-4 w-4" />
      </button>

      <Link
        to="/cart"
        className="mt-3 flex w-full items-center justify-center rounded-lg border border-border py-3.5 text-sm font-bold transition-colors hover:bg-surface"
      >
        بازگشت به سبد خرید
      </Link>
    </div>
  );
}

/*
 * --------------------------------------------------
 * مرحله دوم
 * --------------------------------------------------
 */

function StepTwo({
  items,
  cartCount,
  subtotal,
  shippingCost,
  total,
  shippingMethod,
  setShippingMethod,
  formData,
  formatPrice,
  onBack,
  isSubmitting,
}: {
  items: ReturnType<
    typeof useCart
  >["items"];

  cartCount: number;

  subtotal: number;

  shippingCost: number;

  total: number;

  shippingMethod:
    ShippingMethod;

  setShippingMethod: (
    method: ShippingMethod,
  ) => void;

  formData: formData;

  formatPrice: (
    price: number,
  ) => string;

  onBack: () => void;

  isSubmitting: boolean;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-6">
        <div className="surface-panel rounded-xl p-6 sm:p-7">
          <SectionTitle
            number="۲"
            title="بررسی سفارش"
            description="اطلاعات واردشده را قبل از ثبت سفارش بررسی کنید."
          />

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <ReviewItem
              label="گیرنده"
              value={`${formData.firstName} ${formData.lastName}`}
            />

            <ReviewItem
              label="شماره موبایل"
              value={toPersianDigits(
                normalizeDigits(
                  formData.phone,
                ),
              )}
              num
            />

            <div className="sm:col-span-2">
              <ReviewItem
                label="آدرس ارسال"
                value={`${formData.province}، ${formData.city}، ${formData.address}`}
              />
            </div>

            <ReviewItem
              label="کد پستی"
              value={toPersianDigits(
                normalizeDigits(
                  formData.postalCode,
                ),
              )}
              num
            />
          </div>

          {formData.description.trim() && (
            <div className="mt-5 rounded-lg border border-border bg-surface p-4">
              <p className="text-xs font-bold">
                توضیحات سفارش
              </p>

              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {
                  formData.description
                }
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={
              onBack
            }
            className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-primary transition-opacity hover:opacity-80"
          >
            <ArrowRight className="h-4 w-4" />

            ویرایش اطلاعات
          </button>
        </div>

        <div className="surface-panel rounded-xl p-6 sm:p-7">
          <SectionTitle
            icon={
              <Truck className="h-4 w-4" />
            }
            title="روش ارسال"
            description="روش دریافت سفارش را انتخاب کنید."
          />

          <div className="mt-7 grid gap-3">
            <ShippingOption
              selected={
                shippingMethod ===
                "normal"
              }
              onClick={() =>
                setShippingMethod(
                  "normal",
                )
              }
              title="ارسال عادی"
              description="ارسال از انبار تهران، ۱ تا ۳ روز کاری"
              price="رایگان"
            />

            <ShippingOption
              selected={
                shippingMethod ===
                "fast"
              }
              onClick={() =>
                setShippingMethod(
                  "fast",
                )
              }
              title="ارسال سریع"
              description="تحویل سریع‌تر در محدوده‌های تحت پوشش"
              price={formatPrice(
                120000,
              )}
            />
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <FinalSummary
          items={items}
          cartCount={
            cartCount
          }
          subtotal={
            subtotal
          }
          shippingCost={
            shippingCost
          }
          total={total}
          formatPrice={
            formatPrice
          }
          isSubmitting={
            isSubmitting
          }
        />
      </aside>
    </div>
  );
}

/*
 * --------------------------------------------------
 * خلاصه نهایی
 * --------------------------------------------------
 */

function FinalSummary({
  items,
  cartCount,
  subtotal,
  shippingCost,
  total,
  formatPrice,
  isSubmitting,
}: {
  items: ReturnType<
    typeof useCart
  >["items"];

  cartCount: number;

  subtotal: number;

  shippingCost: number;

  total: number;

  formatPrice: (
    price: number,
  ) => string;

  isSubmitting: boolean;
}) {
  return (
    <div className="surface-panel rounded-xl p-6">
      <h2 className="text-base font-extrabold">
        خلاصه سفارش
      </h2>

      <div className="mt-6 max-h-[340px] space-y-4 overflow-y-auto pr-1">
        {items.map(
          (item) => (
            <div
              key={
                item.product.id
              }
              className="flex gap-3 border-b border-border pb-4"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                <img
                  src={
                    item.product
                      .image
                  }
                  alt={
                    item.product
                      .name
                  }
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs font-bold leading-6">
                  {
                    item.product
                      .name
                  }
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  تعداد:{" "}

                  <span className="num">
                    {toPersianDigits(
                      item.quantity,
                    )}
                  </span>
                </p>

                <p className="mt-1 text-xs font-extrabold num">
                  {formatPrice(
                    item.product
                      .price *
                      item.quantity,
                  )}
                </p>
              </div>
            </div>
          ),
        )}
      </div>

      <div className="mt-6 space-y-4 text-sm">
        <SummaryRow
          label="تعداد کالا"
          value={toPersianDigits(
            cartCount,
          )}
        />

        <SummaryRow
          label="جمع محصولات"
          value={formatPrice(
            subtotal,
          )}
        />

        <SummaryRow
          label="هزینه ارسال"
          value={
            shippingCost === 0
              ? "رایگان"
              : formatPrice(
                  shippingCost,
                )
          }
        />

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-extrabold">
              مبلغ نهایی
            </span>

            <span className="text-lg font-extrabold num">
              {formatPrice(
                total,
              )}
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting
        }
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />

            در حال انتقال به پرداخت...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />

            تأیید و پرداخت سفارش
          </>
        )}
      </button>

      <p className="mt-4 text-center text-[11px] leading-6 text-muted-foreground">
        پس از ثبت سفارش، به صفحه پرداخت
        منتقل خواهید شد.
      </p>
    </div>
  );
}

/*
 * --------------------------------------------------
 * نوار مراحل
 * --------------------------------------------------
 */

function CheckoutProgress({
  step,
}: {
  step: CheckoutStep;
}) {
  return (
    <div className="mt-8 rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-center">
        <ProgressStep
          number="۱"
          title="اطلاعات و آدرس"
          active={
            step === 1
          }
          completed={
            step > 1
          }
        />

        <div
          className={`mx-3 h-px flex-1 ${
            step > 1
              ? "bg-primary"
              : "bg-border"
          }`}
        />

        <ProgressStep
          number="۲"
          title="بررسی و پرداخت"
          active={
            step === 2
          }
          completed={false}
        />
      </div>
    </div>
  );
}

function ProgressStep({
  number,
  title,
  active,
  completed,
}: {
  number: string;
  title: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span
        className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-extrabold transition-colors ${
          active ||
          completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background text-muted-foreground"
        }`}
      >
        {completed ? (
          <Check className="h-4 w-4" />
        ) : (
          number
        )}
      </span>

      <span
        className={`hidden text-xs font-bold sm:block ${
          active
            ? "text-foreground"
            : "text-muted-foreground"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

/*
 * --------------------------------------------------
 * عنوان بخش
 * --------------------------------------------------
 */

function SectionTitle({
  number,
  icon,
  title,
  description,
}: {
  number?: string;
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-sm font-extrabold">
        {number ?? icon}
      </div>

      <div>
        <h2 className="text-base font-extrabold">
          {title}
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/*
 * --------------------------------------------------
 * فیلد فرم
 * --------------------------------------------------
 */

function FormField({
  label,
  required,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  dir,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (
    value: string,
  ) => void;
  placeholder?: string;
  error?: string | undefined;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <label className="block text-sm font-bold">
        {label}

        {required && (
          <span className="mr-1 text-primary">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        dir={dir}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className={`mt-2 w-full rounded-lg border bg-surface px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ${
          error
            ? "border-destructive"
            : "border-border"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/*
 * --------------------------------------------------
 * آدرس ذخیره‌شده
 * --------------------------------------------------
 */

function AddressOption({
  address,
  selected,
  onClick,
}: {
  address: UserAddress;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`w-full rounded-xl border p-4 text-right transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
            selected
              ? "border-primary"
              : "border-border-strong"
          }`}
        >
          {selected && (
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold">
              {
                address.title
              }
            </span>

            {address.isDefault && (
              <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-bold">
                پیش‌فرض
              </span>
            )}
          </span>

          <span className="mt-1 block text-xs text-muted-foreground">
            {
              address.firstName
            }{" "}
            {
              address.lastName
            }
            {" — "}
            {toPersianDigits(
              address.phone,
            )}
          </span>

          <span className="mt-1 block text-xs leading-6 text-muted-foreground">
            {
              address.province
            }،{" "}
            {
              address.city
            }،{" "}
            {
              address.address
            }
          </span>

          <span className="mt-1 block text-xs text-muted-foreground">
            کد پستی:{" "}

            <span className="num">
              {toPersianDigits(
                address.postalCode,
              )}
            </span>
          </span>
        </span>
      </div>
    </button>
  );
}

/*
 * --------------------------------------------------
 * گزینه ارسال
 * --------------------------------------------------
 */

function ShippingOption({
  selected,
  onClick,
  title,
  description,
  price,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
  price: string;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`flex w-full items-center gap-4 rounded-xl border p-4 text-right transition-all duration-200 ${
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
          selected
            ? "border-primary"
            : "border-border-strong"
        }`}
      >
        {selected && (
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-6 text-muted-foreground">
          {description}
        </span>
      </span>

      <span className="shrink-0 text-xs font-extrabold num">
        {price}
      </span>
    </button>
  );
}

/*
 * --------------------------------------------------
 * ردیف خلاصه
 * --------------------------------------------------
 */

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">
        {label}
      </span>

      <span className="font-bold num">
        {value}
      </span>
    </div>
  );
}

/*
 * --------------------------------------------------
 * آیتم وضعیت
 * --------------------------------------------------
 */

function StatusItem({
  label,
  completed,
}: {
  label: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`grid h-7 w-7 place-items-center rounded-full border ${
          completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground"
        }`}
      >
        {completed ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <span className="h-2 w-2 rounded-full bg-border-strong" />
        )}
      </span>

      <span
        className={`text-xs font-bold ${
          completed
            ? "text-foreground"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/*
 * --------------------------------------------------
 * آیتم بررسی اطلاعات
 * --------------------------------------------------
 */

function ReviewItem({
  label,
  value,
  num = false,
}: {
  label: string;
  value: string;
  num?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-bold leading-7 ${
          num ? "num" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}