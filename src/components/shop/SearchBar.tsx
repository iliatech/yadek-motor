import { useEffect, useRef, useState } from "react";
import { Search, X, Sparkles } from "lucide-react";

import { quickSearches } from "@/data/shop";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChange,
  placeholder = "دنبال چه قطعه‌ای هستید؟",
}: Props) {
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setFocused(false);
      }
    };

    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const showSuggestions =
    focused && value.trim().length === 0;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative",
        focused && "z-50",
      )}
    >
      {/* نوار جستجو */}
      <div
        className={cn(
          "group relative flex items-center gap-3 rounded-xl border bg-surface/80 px-4 shadow-sm backdrop-blur-md transition-all duration-300",
          focused
            ? "border-primary/60 bg-surface-elevated shadow-[var(--shadow-accent)]"
            : "border-border-strong hover:border-primary/30",
        )}
      >
        {/* آیکون جستجو */}
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-all duration-300",
            focused
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-background/40 text-muted-foreground",
          )}
        >
          <Search className="h-4 w-4" />
        </span>

        {/* ورودی */}
        <input
          type="search"
          value={value}
          onFocus={() => setFocused(true)}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label="جستجوی قطعات"
          className="w-full min-w-0 bg-transparent py-4 text-sm outline-none placeholder:text-muted-foreground sm:text-base [&::-webkit-search-cancel-button]:hidden"
        />

        {/* پاک کردن */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFocused(true);
            }}
            aria-label="پاک کردن جستجو"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* پیشنهادهای جستجو */}
      {showSuggestions && (
        <div className="absolute inset-x-0 top-full z-50 mt-3 overflow-hidden rounded-xl border border-border-strong bg-surface-elevated shadow-[var(--shadow-panel)]">
          {/* عنوان پنل */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>

            <div>
              <p className="text-xs font-bold text-foreground">
                جستجوهای پرطرفدار
              </p>

              <p className="mt-0.5 text-[11px] text-muted-foreground">
                سریع‌تر به قطعه مورد نیازت برس
              </p>
            </div>
          </div>

          {/* پیشنهادها */}
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => {
                    onChange(term);
                    setFocused(false);
                  }}
                  className="group inline-flex items-center gap-2 rounded-lg border border-border bg-background/30 px-3.5 py-2.5 text-xs text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 hover:text-foreground"
                >
                  <Search className="h-3.5 w-3.5 transition-colors duration-200 group-hover:text-primary" />

                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}