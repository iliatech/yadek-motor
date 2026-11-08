import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Truck,
  Headphones,
} from "lucide-react";

import heroMotor from "@/assets/hero-motor.webp";

export function Hero() {
  return (
    <section
      dir="rtl"
      className="relative isolate overflow-hidden border-b border-border bg-background"
    >
{/* پس‌زمینه رنگی با نورهای ملایم */}
<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(255,41,79,0.20),transparent_48%),radial-gradient(ellipse_at_20%_65%,rgba(34,211,238,0.13),transparent_42%),radial-gradient(ellipse_at_55%_5%,rgba(168,85,247,0.15),transparent_45%)]" />

      {/* گریدلاین کم‌رنگ */}
<div className="pointer-events-none hairline-grid absolute inset-0 opacity-[0.10]" />

      {/* محتوای اصلی */}
      <div className="relative z-10 mx-auto grid min-h-0 max-w-7xl grid-cols-1 items-center gap-5 px-4 py-8 sm:px-6 sm:py-10 lg:min-h-[600px] lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-14">

        {/* متن و اطلاعات سایت */}
        <div className="order-1 min-w-0 text-center lg:col-start-1 lg:row-start-1 lg:text-right">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/5 px-4 py-2 text-xs font-bold text-primary sm:text-sm">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>فروشگاه تخصصی لوازم یدکی موتورسیکلت</span>
          </div>

<h1 className="mt-4 text-3xl font-black leading-[1.5] tracking-tight text-foreground sm:mt-6 sm:text-5xl lg:text-6xl xl:text-7xl">
  <span>لوازم یدکی</span>
  <span className="mt-1 block text-red-600">
    دیاموند
  </span>
</h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-8 text-muted-foreground sm:mt-5 sm:text-base sm:leading-9 lg:mx-0 lg:text-lg">
            هر قطعه‌ای که موتورت نیاز دارد را با{" "}
            <span className="font-bold text-foreground">
              کیفیت، قیمت مناسب و ارسال سریع
            </span>{" "}
            پیدا کن.
          </p>

          {/* مزیت‌های فروشگاه */}
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border/70 pt-5 sm:mt-8 sm:gap-4 sm:pt-6 lg:mt-10">
            <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-right">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary sm:h-10 sm:w-10">
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-foreground sm:text-sm">
                ارسال سریع
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-right">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300 sm:h-10 sm:w-10">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-foreground sm:text-sm">
                ضمانت اصالت کالا
              </span>
            </div>

            <div className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-right">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/25 bg-purple-400/10 text-purple-300 sm:h-10 sm:w-10">
                <Headphones className="h-5 w-5" />
              </div>
              <span className="text-[11px] font-bold text-foreground sm:text-sm">
                پشتیبانی تخصصی
              </span>
            </div>
          </div>
        </div>

        {/* تصویر موتور */}
        <div className="relative order-2 flex min-w-0 items-center justify-center lg:col-start-2 lg:row-start-1">
          <img
            src={heroMotor}
            alt="موتورسیکلت اسپرت مشکی و قرمز"
            fetchPriority="high"
            decoding="async"
            className="relative z-10 block h-auto w-[65%] max-w-[260px] object-contain sm:max-w-[300px] lg:w-full lg:max-w-[340px]"
          />

          {/* خطوط نئونی ظریف */}
          <div className="pointer-events-none absolute bottom-[12%] left-[8%] h-px w-16 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          <div className="pointer-events-none absolute right-[10%] top-[15%] h-px w-14 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
        </div>

        {/* دکمه‌ها؛ پایین تصویر در موبایل */}
        <div className="order-3 flex min-w-0 flex-col justify-center gap-3 sm:flex-row lg:col-start-1 lg:row-start-2 lg:justify-start">
          <Link
            to="/shop"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-extrabold text-primary-foreground shadow-[0_0_20px_-10px_rgba(255,41,79,0.45)] transition-colors hover:bg-primary/90"
          >
            <span>مشاهده فروشگاه</span>
            <ArrowLeft className="h-4 w-4 shrink-0" />
          </Link>

          <Link
            to="/shop"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface/80 px-7 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-primary/60 hover:bg-surface-elevated"
          >
            <span>مشاهده دسته‌بندی‌ها</span>
          </Link>
        </div>
      </div>

      {/* خط نئونی پایین */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-primary/50 to-transparent" />
    </section>
  );
}