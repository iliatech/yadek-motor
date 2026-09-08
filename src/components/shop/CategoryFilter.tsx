import {
  Cog,
  Disc3,
  Zap,
  Link2,
  Droplets,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { categories, type Category } from "@/data/shop";
import { cn } from "@/lib/utils";

type Props = {
  value: Category;
  onChange: (value: Category) => void;
};

const categoryIcons: Record<string, LucideIcon> = {
  "همه محصولات": Cog,
  "قطعات موتور": Cog,
  "سیستم ترمز": Disc3,
  "سیستم برق": Zap,
  "زنجیر و انتقال قدرت": Link2,
  "روغن و مواد مصرفی": Droplets,
  "بدنه و لوازم جانبی": ShieldCheck,
};

export function CategoryFilter({ value, onChange }: Props) {
  return (
    <section aria-label="دسته‌بندی محصولات">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>


          <p className="mt-1 text-xs text-muted-foreground">
            دسته مورد نظر خود را انتخاب کنید
          </p>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:overflow-visible sm:px-0">
        <div className="flex min-w-max gap-2.5 sm:min-w-0 sm:flex-wrap">
          {categories.map((category) => {
            const active = category === value;
            const Icon = categoryIcons[category] ?? Cog;

            return (
              <button
                key={category}
                type="button"
                onClick={() => onChange(category)}
                aria-pressed={active}
                className={cn(
                  "group inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs whitespace-nowrap transition-all duration-200 sm:text-sm",
                  active
                    ? [
                        "border-primary/50",
                        "bg-primary/10",
                        "text-primary",
                        "shadow-[0_8px_24px_-14px_var(--primary)]",
                      ]
                    : [
                        "border-border",
                        "bg-surface/40",
                        "text-muted-foreground",
                        "hover:border-border-strong",
                        "hover:bg-surface",
                        "hover:text-foreground",
                      ],
                )}
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-all duration-200",
                    active
                      ? "border-primary/30 bg-primary/15 text-primary"
                      : "border-border bg-background/50 text-muted-foreground group-hover:border-border-strong group-hover:text-foreground",
                  )}
                >
                  <Icon
                    className="h-4 w-4"
                    strokeWidth={1.7}
                  />
                </span>

                <span>{category}</span>

                {active && (
                  <span className="mr-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}