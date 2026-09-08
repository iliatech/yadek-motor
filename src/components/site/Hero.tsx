import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Search,
  Sparkles,
} from "lucide-react";

import { quickSearches } from "@/data/shop";

import heroParts1 from "@/assets/hero-parts-1.webp";
import heroParts2 from "@/assets/hero-parts-2.webp";
import heroParts3 from "@/assets/hero-parts-3.webp";
import heroParts4 from "@/assets/hero-parts-4.webp";

export function Hero() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const handleSearch = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const query = term.trim();

    navigate({
      to: "/shop",
      search: {
        q: query,
        category: "",
      },
    });
  };

  return (
    <section className="relative isolate min-h-[700px] overflow-hidden border-b border-border bg-background">
      {/* تصاویر پس‌زمینه */}
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        <img
          src={heroParts1}
          alt=""
          aria-hidden="true"
          className="h-full w-full min-h-0 object-cover"
        />

        <img
          src={heroParts2}
          alt=""
          aria-hidden="true"
          className="h-full w-full min-h-0 object-cover"
        />

        <img
          src={heroParts3}
          alt=""
          aria-hidden="true"
          className="h-full w-full min-h-0 object-cover"
        />

        <img
          src={heroParts4}
          alt=""
          aria-hidden="true"
          className="h-full w-full min-h-0 object-cover"
        />
      </div>

      {/* لایه تیره */}
      <div className="pointer-events-none absolute inset-0 bg-background/45" />

      {/* گرادیان */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/20 via-background/45 to-background/85" />

      {/* گرید */}
      <div className="pointer-events-none hairline-grid absolute inset-0 opacity-20" />

      {/* محو کردن مرکز */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] max-w-[110%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/60 blur-3xl" />

      {/* نور اصلی */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[700px] max-w-[100%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" />

      {/* محتوا */}
      <div className="relative z-10 mx-auto flex min-h-[700px] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl text-center">

          {/* برچسب */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/80 px-4 py-2 text-xs font-bold text-primary shadow-lg backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />

            <span>
              فروشگاه تخصصی لوازم یدکی موتورسیکلت
            </span>
          </div>

          {/* عنوان */}
          <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-7xl">
            <span>یدک موتور</span>

            <span className="mx-3 text-primary">
              دیاموند
            </span>
          </h1>

          {/* توضیحات */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base sm:leading-9 lg:text-lg">
            <span>
              هر قطعه‌ای که موتورت نیاز دارد را با
            </span>

            {" "}

            <span className="font-bold text-foreground">
              کیفیت، قیمت مناسب و ارسال سریع
            </span>

            {" "}

            <span>
              پیدا کن.
            </span>
          </p>

          {/* جستجو */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border-strong bg-background/90 p-2 shadow-[var(--shadow-panel)] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">

              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 shrink-0 text-primary" />

                <input
                  type="search"
                  value={term}
                  onChange={(event) =>
                    setTerm(event.target.value)
                  }
                  placeholder="دنبال چه قطعه‌ای هستید؟"
                  aria-label="جستجوی قطعات"
                  className="w-full min-w-0 bg-transparent py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground sm:text-base"
                />
              </div>

              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-extrabold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)] active:translate-y-0"
              >
                <span>
                  جستجوی قطعه
                </span>

                <ArrowLeft className="h-4 w-4 shrink-0" />
              </button>
            </div>
          </form>

          {/* جستجوهای پرتکرار */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">
              جستجوهای پرتکرار:
            </span>

            {quickSearches.map((suggestion) => (
              <Link
                key={suggestion}
                to="/shop"
                search={{
                  q: suggestion,
                  category: "",
                }}
                className="rounded-full border border-border bg-background/70 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                {suggestion}
              </Link>
            ))}
          </div>

          {/* دکمه‌ها */}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-extrabold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)]"
            >
              <span>
                مشاهده فروشگاه
              </span>

              <ArrowLeft className="h-4 w-4 shrink-0" />
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center rounded-xl border border-border-strong bg-background/75 px-7 py-3.5 text-sm font-bold text-foreground backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:bg-background/90"
            >
              <span>
                مشاهده دسته‌بندی‌ها
              </span>
            </Link>
          </div>

          {/* مزیت‌ها */}
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span>ارسال سریع</span>

            <span>ضمانت اصالت کالا</span>

            <span>پشتیبانی تخصصی</span>
          </div>
        </div>
      </div>

      {/* خط پایین */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </section>
  );
}