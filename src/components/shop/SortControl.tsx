import { ArrowUpDown } from "lucide-react";

export const sortOptions = [
  { value: "newest", label: "جدیدترین" },
  { value: "cheapest", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
  { value: "popular", label: "محبوب‌ترین" },
] as const;

export type SortValue = (typeof sortOptions)[number]["value"];

type Props = {
  value: SortValue;
  onChange: (value: SortValue) => void;
};

export function SortControl({ value, onChange }: Props) {
  return (
    <label className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs text-muted-foreground transition-colors duration-200 focus-within:border-primary/50 hover:border-border-strong">
      <ArrowUpDown className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline">مرتب‌سازی:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        aria-label="مرتب‌سازی محصولات"
        className="cursor-pointer bg-transparent pl-1 text-xs font-bold text-foreground outline-none"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value} className="bg-surface-elevated">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
