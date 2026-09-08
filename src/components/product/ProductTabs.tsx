import { useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  ShieldCheck,
} from "lucide-react";

import {
  getProductDescription,
  getSpecs,
  type Product,
} from "@/data/shop";

import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "description",
    label: "توضیحات محصول",
    icon: FileText,
  },
  {
    id: "specs",
    label: "مشخصات محصول",
    icon: ClipboardList,
  },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function ProductTabs({
  product,
}: {
  product: Product;
}) {
  const [active, setActive] =
    useState<TabId>("description");

  const specs = getSpecs(product);

  return (
    <section className="surface-panel mt-14 overflow-hidden rounded-2xl border border-border">
      {/* Header */}
      <div className="border-b border-border bg-surface/30 px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold sm:text-lg">
              اطلاعات محصول
            </h2>

            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              جزئیات و مشخصات فنی {product.name}
            </p>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="اطلاعات محصول"
            className="flex w-full rounded-xl border border-border bg-background/50 p-1 sm:w-auto"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = active === tab.id;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all duration-200 sm:flex-none sm:text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />

                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-8">
        {active === "description" ? (
          <div className="max-w-4xl">
            {/* Main description */}
            <div className="rounded-xl border border-border bg-background/30 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />

                <h3 className="text-sm font-extrabold sm:text-base">
                  معرفی محصول
                </h3>
              </div>

              <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
                {getProductDescription(product)}
              </p>
            </div>

            {/* Benefits */}
            <div className="mt-6">
              <h3 className="text-sm font-extrabold sm:text-base">
                چرا این محصول؟
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl border border-border bg-surface/30 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>

                  <div>
                    <h4 className="text-xs font-bold sm:text-sm">
                      بررسی پیش از ارسال
                    </h4>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      محصول پیش از ارسال از نظر سلامت و
                      تطابق سفارش بررسی می‌شود.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 rounded-xl border border-border bg-surface/30 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </span>

                  <div>
                    <h4 className="text-xs font-bold sm:text-sm">
                      خرید با اطمینان
                    </h4>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      اصالت و وضعیت محصول قبل از ارسال
                      سفارش بررسی می‌شود.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compatibility notice */}
            <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
              <div className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ClipboardList className="h-4 w-4" />
                </div>

                <div>
                  <h3 className="text-sm font-bold">
                    قبل از خرید به سازگاری قطعه توجه کنید
                  </h3>

                  <p className="mt-1.5 text-xs leading-7 text-muted-foreground sm:text-sm">
                    برای اطمینان از سازگاری این قطعه با مدل
                    موتورسیکلت خود، مشخصات فنی محصول و کد
                    قطعه را بررسی کنید.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h3 className="text-base font-extrabold">
                مشخصات فنی
              </h3>

              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                اطلاعات فنی و جزئیات محصول
              </p>
            </div>

            <dl className="overflow-hidden rounded-xl border border-border">
              {specs.map((spec, index) => (
                <div
                  key={spec.label}
                  className={cn(
                    "grid gap-2 px-4 py-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:px-6",
                    index !== specs.length - 1 &&
                      "border-b border-border",
                    index % 2 === 0
                      ? "bg-background/20"
                      : "bg-surface/30",
                  )}
                >
                  <dt className="text-xs font-medium text-muted-foreground sm:text-sm">
                    {spec.label}
                  </dt>

                  <dd className="min-w-0 break-words text-xs font-bold sm:text-sm">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}