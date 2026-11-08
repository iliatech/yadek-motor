import {
  Truck,
  ShieldCheck,
  Tag,
  Headphones,
  ArrowLeft,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/lib/utils";

const items: {
  title: string;
  text: string;
  icon: LucideIcon;
  points: string[];
}[] = [
  {
    title: "ارسال سریع",
    text: "سفارش شما با بسته‌بندی مناسب و در کوتاه‌ترین زمان ارسال می‌شود.",
    icon: Truck,
    points: [
      "ارسال به سراسر کشور",
      "بسته‌بندی ایمن",
    ],
  },
  {
    title: "خرید مطمئن",
    text: "قطعات با ضمانت اصالت ارائه می‌شوند تا با خیال راحت خرید کنید.",
    icon: ShieldCheck,
    points: [
      "تضمین اصالت کالا",
      "امکان پیگیری سفارش",
    ],
  },
  {
    title: "قیمت شفاف",
    text: "قیمت نهایی محصولات از ابتدا مشخص است و هزینه پنهانی وجود ندارد.",
    icon: Tag,
    points: [
      "قیمت‌گذاری شفاف",
      "نمایش قیمت نهایی",
    ],
  },
  {
    title: "پشتیبانی تخصصی",
    text: "برای انتخاب قطعه مناسب، قبل و بعد از خرید همراه شما هستیم.",
    icon: Headphones,
    points: [
      "راهنمایی قبل از خرید",
      "پاسخ‌گویی به سوالات",
    ],
  },
];

export function WhyUs() {
  return (
    <section className="relative overflow-hidden border-y border-border">
      {/* Grid background */}
      <div className="hairline-grid absolute inset-0 opacity-[0.18]" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="چرا دیاموند؟"
          subtitle="تلاش کرده‌ایم خرید قطعات موتورسیکلت را ساده، مطمئن و شفاف کنیم."
        />

        {/* Trust stats */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          <TrustStat
            value="اصالت"
            label="تضمین اصالت قطعات"
          />

          <TrustStat
            value="سریع"
            label="ارسال سفارش‌ها"
          />

          <TrustStat
            value="شفاف"
            label="قیمت‌گذاری بدون هزینه پنهان"
          />
        </div>

        {/* Main cards */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(
            ({
              title,
              text,
              icon: Icon,
              points,
            }) => (
              <article
                key={title}
                className={cn(
                  "group relative overflow-hidden rounded-2xl",
                  "border border-border bg-surface",
                  "p-6",
                  "transition-all duration-300",
                  "hover:-translate-y-1",
                  "hover:border-primary/30",
                  "hover:shadow-[var(--shadow-panel)]",
                )}
              >
                {/* Hover glow */}
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:bg-primary/10" />

                {/* Icon */}
                <div className="relative flex items-start justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl border border-border-strong bg-background text-primary transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/10">
                    <Icon
                      className="h-5.5 w-5.5 transition-transform duration-300 group-hover:-translate-y-0.5"
                      strokeWidth={1.6}
                    />
                  </div>

                  <ArrowLeft
                    className="mt-1 h-4 w-4 text-muted-foreground/50 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-primary"
                  />
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="mt-6 text-base font-extrabold">
                    {title}
                  </h3>

                  <p className="mt-3 min-h-[4.5rem] text-sm leading-7 text-muted-foreground">
                    {text}
                  </p>

                  {/* Points */}
                  <div className="mt-5 space-y-2.5 border-t border-border pt-4">
                    {points.map((point) => (
                      <div
                        key={point}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-primary/20 bg-primary/5">
                          <Check
                            className="h-3 w-3 text-primary"
                            strokeWidth={2.5}
                          />
                        </span>

                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ),
          )}
        </div>

        {/* Bottom message */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10">
                <ShieldCheck
                  className="h-5 w-5 text-primary"
                  strokeWidth={1.7}
                />
              </div>

              <div>
                <h3 className="text-sm font-extrabold sm:text-base">
                  خرید قطعه، با اطمینان بیشتر
                </h3>

                <p className="mt-1.5 text-xs leading-6 text-muted-foreground sm:text-sm">
                  اطلاعات محصول، قیمت و وضعیت موجودی را قبل
                  از خرید مشاهده کنید.
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              تجربه خرید شفاف و ساده
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-background/60 px-5 py-4 transition-colors duration-300 hover:border-primary/20 hover:bg-surface">
      <div className="h-8 w-1 rounded-full bg-primary/60 transition-all duration-300 group-hover:h-10 group-hover:bg-primary" />

      <div className="min-w-0">
        <p className="text-sm font-extrabold text-foreground">
          {value}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}