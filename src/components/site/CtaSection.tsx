import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Search,
  ShoppingCart,
} from "lucide-react";

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="surface-panel group relative overflow-hidden rounded-2xl">
        {/* پس‌زمینه */}
        <div className="hairline-grid absolute inset-0 opacity-30" />

        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:bg-primary/15" />

        <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-18">
          {/* متن */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              آماده‌ای برای خرید؟
            </div>

            <h2 className="mt-5 text-2xl font-extrabold leading-[1.5] tracking-tight sm:text-3xl lg:text-4xl">
              قطعه مورد نیازت را
              <span className="text-primary"> سریع پیدا کن.</span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
              بین مجموعه‌ای از قطعات و لوازم یدکی موتورسیکلت جستجو کن،
              محصول مناسب را انتخاب کن و سفارشت را با خیال راحت ثبت کن.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ضمانت اصالت کالا
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                قیمت شفاف و مشخص
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                ارسال به سراسر کشور
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                پشتیبانی تخصصی
              </div>
            </div>
          </div>

          {/* دکمه‌ها */}
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              to="/shop"
              className="group/button inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-sm font-bold text-primary-foreground transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)]"
            >
              <ShoppingCart className="h-4 w-4" />
              مشاهده فروشگاه
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover/button:-translate-x-1" />
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-strong bg-surface/70 px-7 py-3.5 text-sm font-bold text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-surface"
            >
              <Search className="h-4 w-4" />
              جستجوی قطعه
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}