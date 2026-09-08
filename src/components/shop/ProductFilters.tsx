import { formatToman } from "@/data/shop";
import { cn } from "@/lib/utils";

export type Filters = {
  brands: string[];
  onlyAvailable: boolean;
  maxPrice: number;
};

export const defaultFilters: Filters = {
  brands: [],
  onlyAvailable: false,
  maxPrice: Number.MAX_SAFE_INTEGER,
};

type Props = {
  filters: Filters;
  onChange: (filters: Filters) => void;
  minPrice: number;
  maxPrice: number;
  brands: string[];
};

export function ProductFilters({
  filters,
  onChange,
  minPrice,
  maxPrice,
  brands,
}: Props) {
  const toggleBrand = (brand: string) => {
    const next = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];

    onChange({
      ...filters,
      brands: next,
    });
  };

  const isDirty =
    filters.brands.length > 0 ||
    filters.onlyAvailable ||
    filters.maxPrice !== Number.MAX_SAFE_INTEGER;

  const displayedMaxPrice =
    filters.maxPrice === Number.MAX_SAFE_INTEGER
      ? maxPrice
      : Math.min(filters.maxPrice, maxPrice);

  return (
    <div className="space-y-8">
      <section>
        <FilterTitle>محدوده قیمت</FilterTitle>

        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step={50000}
          value={displayedMaxPrice}
          onChange={(e) =>
            onChange({
              ...filters,
              maxPrice: Number(e.target.value),
            })
          }
          aria-label="حداکثر قیمت"
          className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
        />

        <p className="mt-3 text-xs text-muted-foreground">
          تا{" "}
          <span className="font-bold text-foreground num">
            {formatToman(displayedMaxPrice)}
          </span>{" "}
          تومان
        </p>
      </section>

      <section>
        <FilterTitle>برند</FilterTitle>

        <div className="mt-4 flex flex-wrap gap-2">
          {brands.map((brand) => {
            const active = filters.brands.includes(brand);

            return (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border px-3 py-2 text-xs transition-colors duration-200",
                  active
                    ? "border-primary/60 bg-primary/15 font-bold text-primary"
                    : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                {brand}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <FilterTitle>موجودی</FilterTitle>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            {
              label: "همه",
              value: false,
            },
            {
              label: "فقط موجود",
              value: true,
            },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  onlyAvailable: option.value,
                })
              }
              aria-pressed={
                filters.onlyAvailable === option.value
              }
              className={cn(
                "rounded-lg border px-3 py-2.5 text-xs transition-colors duration-200",
                filters.onlyAvailable === option.value
                  ? "border-primary/60 bg-primary/15 font-bold text-primary"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {isDirty && (
        <button
          type="button"
          onClick={() => onChange(defaultFilters)}
          className="w-full rounded-lg border border-border px-3 py-2.5 text-xs text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:text-foreground"
        >
          حذف فیلترها
        </button>
      )}
    </div>
  );
}

function FilterTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="border-b border-border pb-3 text-sm font-bold">
      {children}
    </h3>
  );
}