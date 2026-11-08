
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Cog,
  Disc3,
  Droplets,
  Link2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { fetchCategories } from "@/lib/api";
import { SectionHeading } from "./SectionHeading";

const categoryPresentation: Record<
  string,
  { hint: string; icon: LucideIcon }
> = {
  "قطعات موتور": {
    hint: "پیستون، سوپاپ، واشر",
    icon: Cog,
  },
  "سیستم ترمز": {
    hint: "لنت، دیسک، کالیپر",
    icon: Disc3,
  },
  "سیستم برق": {
    hint: "شمع، باتری، چراغ",
    icon: Zap,
  },
  "زنجیر و انتقال قدرت": {
    hint: "زنجیر، دنده، کلاچ",
    icon: Link2,
  },
  "روغن و مواد مصرفی": {
    hint: "روغن، فیلتر، گریس",
    icon: Droplets,
  },
  "بدنه و لوازم جانبی": {
    hint: "آینه، دسته، بدنه",
    icon: ShieldCheck,
  },
};

const fallbackPresentation = {
  hint: "",
  icon: Cog,
};

export function Categories() {
  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* دکور پس‌زمینه */}
      <div className="pointer-events-none absolute inset-0">
        <div className="hairline-grid absolute inset-0 opacity-[0.12]" />

        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-primary/[0.035] blur-3xl" />

        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-primary/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        {/* عنوان */}
        <SectionHeading
          title="دسته‌بندی قطعات"
          subtitle="قطعه مورد نیاز خود را از میان گروه‌های تخصصی انتخاب کنید."
        />

        {/* لیست دسته‌بندی‌ها */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              در حال دریافت دسته‌بندی‌ها...
            </p>
          ) : isError ? (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              دریافت دسته‌بندی‌ها ناموفق بود.
            </p>
          ) : (
            categories.map((category, index) => {
              const presentation =
                categoryPresentation[category.name] ??
                fallbackPresentation;

              const Icon = presentation.icon;
              const hint =
                category.description?.trim() || presentation.hint;

              return (
                <Link
                  key={category.id}
                  to="/shop"
                  search={{
                    q: "",
                    category: category.name,
                  }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-surface-elevated hover:shadow-[var(--shadow-panel)]"
                >
                  {/* شماره */}
                  <span className="absolute left-4 top-4 font-mono text-[10px] font-bold tracking-[0.2em] text-muted-foreground/40 transition-colors duration-300 group-hover:text-primary/60">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* نور Hover */}
                  <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/[0.06] blur-2xl transition-all duration-500 group-hover:bg-primary/[0.12]" />

                  <div className="relative flex items-center gap-4">
                    {/* آیکون */}
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border bg-background/70 text-primary transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:shadow-[0_0_30px_-12px_oklch(0.78_0.13_72/70%)]">
                      <Icon
                        className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                        strokeWidth={1.5}
                      />
                    </span>

                    {/* متن */}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold sm:text-base">
                        {category.name}
                      </span>

                      {hint && (
                        <span className="mt-1.5 block truncate text-xs leading-5 text-muted-foreground">
                          {hint}
                        </span>
                      )}
                    </span>

                    {/* فلش */}
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-background/40 text-muted-foreground transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary">
                      <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
                    </span>
                  </div>

                  {/* خط پایین کارت */}
                  <span className="absolute inset-x-5 bottom-0 h-px origin-right scale-x-0 bg-gradient-to-l from-primary/60 to-transparent transition-transform duration-500 group-hover:scale-x-100" />
                </Link>
              );
            })
          )}
        </div>

        {/* CTA کوچک */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/shop"
            search={{
              q: "",
              category: "",
            }}
            className="group inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface/60 px-5 py-3 text-sm font-bold text-muted-foreground backdrop-blur transition-all duration-300 hover:border-primary/30 hover:bg-surface-elevated hover:text-foreground"
          >
            مشاهده همه قطعات

            <ArrowLeft className="h-4 w-4 text-primary transition-transform duration-300 group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
