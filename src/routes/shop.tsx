import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  PackageSearch,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SearchBar } from "@/components/shop/SearchBar";
import { useQuery } from "@tanstack/react-query";
import { CategoryFilter } from "@/components/shop/CategoryFilter";
import {
  ProductFilters,
  defaultFilters,
  type Filters,
} from "@/components/shop/ProductFilters";
import { ProductGrid } from "@/components/shop/ProductGrid";
import {
  SortControl,
  type SortValue,
} from "@/components/shop/SortControl";

import {
  normalizeFa,
  toPersianDigits,
  type Product,
} from "@/data/shop";

import {
  fetchCategories,
  fetchProducts,
} from "@/lib/api";

const title = "فروشگاه | یدک موتور";

const description =
  "جستجو و خرید قطعات موتورسیکلت؛ لنت ترمز، شمع، زنجیر، روغن موتور، چراغ جلو و کاربراتور با فیلتر برند، قیمت و موجودی.";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),

  head: () => ({
    meta: [
      { title },
      {
        name: "description",
        content: description,
      },
      {
        property: "og:title",
        content: title,
      },
      {
        property: "og:description",
        content: description,
      },
    ],

    links: [
      {
        rel: "canonical",
        href: "https://diamondmotor.ir/shop",
      },
    ],
  }),

  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();

  const [query, setQuery] = useState(search.q);

const [category, setCategory] = useState<string>(
  search.category || "همه محصولات",
);
  const [filters, setFilters] =
    useState<Filters>(defaultFilters);

  const [sort, setSort] =
    useState<SortValue>("newest");

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  /*
   * هماهنگ‌سازی وضعیت صفحه با
   * پارامترهای URL
   */
  useEffect(() => {
    setQuery(search.q);

setCategory(search.category || "همه محصولات");
  }, [search.q, search.category]);
  const {
  data: categoryRows = [],
} = useQuery({
  queryKey: ["categories"],
  queryFn: fetchCategories,
});

const categoryNames = categoryRows.map(
  (item) => item.name,
);
useEffect(() => {
  if (!search.q.trim()) {
    return;
  }

  const timer = window.setTimeout(() => {
    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  }, 100);

  return () => {
    window.clearTimeout(timer);
  };
}, [search.q]);
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const normalizedProducts: Product[] = products.map(
    (product) => ({
      id: product.slug,
      name: product.name,
      brand: product.brand,
      category: product.categoryName ?? "",
      price: product.price,

      ...(product.oldPrice !== null
        ? { oldPrice: product.oldPrice }
        : {}),

      image: product.image,

      availability:
        product.availability as Product["availability"],

      rating: product.rating,
      reviews: product.reviews,
      popularity: product.popularity,
      createdAt: product.createdAt,
      keywords: product.keywords ?? [],

      ...(product.badge !== null
        ? { badge: product.badge }
        : {}),
    }),
  );

  const availableBrands = [
    ...new Set(
      normalizedProducts.map(
        (product) => product.brand,
      ),
    ),
  ];

  const prices = normalizedProducts.map(
    (product) => product.price,
  );

  const minProductPrice =
    prices.length > 0
      ? Math.min(...prices)
      : 0;

  const maxProductPrice =
    prices.length > 0
      ? Math.max(...prices)
      : 0;

  /*
   * فیلتر و مرتب‌سازی محصولات
   */
  const results = useMemo(() => {
    const q = normalizeFa(query);

    const filteredProducts =
      normalizedProducts.filter(
        (product) => {
          /*
           * فیلتر دسته‌بندی
           */
          if (
            category !== "همه محصولات" &&
            product.category !== category
          ) {
            return false;
          }

          /*
           * فقط محصولات موجود
           */
          if (
            filters.onlyAvailable &&
            product.availability ===
              "out-of-stock"
          ) {
            return false;
          }

          /*
           * فیلتر برند
           */
          if (
            filters.brands.length > 0 &&
            !filters.brands.includes(
              product.brand,
            )
          ) {
            return false;
          }

          /*
           * فیلتر قیمت
           */
          if (
            filters.maxPrice !==
              Number.MAX_SAFE_INTEGER &&
            product.price >
              filters.maxPrice
          ) {
            return false;
          }

          /*
           * اگر جستجو خالی باشد
           */
          if (!q) {
            return true;
          }

          /*
           * اطلاعات قابل جستجو
           */
          const haystack = normalizeFa(
            [
              product.name,
              product.brand,
              product.category,
              ...product.keywords,
            ].join(" "),
          );

          /*
           * تمام کلمات جستجو باید
           * در اطلاعات محصول وجود داشته باشند
           */
          return q
            .split(" ")
            .filter(Boolean)
            .every((token) =>
              haystack.includes(token),
            );
        },
      );

    /*
     * مرتب‌سازی
     */
    const sorted = [...filteredProducts];

    switch (sort) {
      case "cheapest":
        sorted.sort(
          (a, b) =>
            a.price - b.price,
        );
        break;

      case "expensive":
        sorted.sort(
          (a, b) =>
            b.price - a.price,
        );
        break;

      case "popular":
        sorted.sort(
          (a, b) =>
            b.popularity - a.popularity,
        );
        break;

      case "newest":
      default:
        sorted.sort((a, b) =>
          b.createdAt.localeCompare(
            a.createdAt,
          ),
        );
        break;
    }

    return sorted;
  }, [
    query,
    category,
    filters,
    sort,
    normalizedProducts,
  ]);

  /*
   * تعداد فیلترهای فعال
   */
  const activeFilterCount =
    filters.brands.length +
    (filters.onlyAvailable ? 1 : 0) +
    (filters.maxPrice !==
    defaultFilters.maxPrice
      ? 1
      : 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* =====================================
            SHOP HERO
        ====================================== */}

        <section className="relative z-20 overflow-visible border-b border-border">
          {/* پس‌زمینه شبکه‌ای */}
          <div className="pointer-events-none absolute inset-0 opacity-25">
            <div className="hairline-grid h-full w-full" />
          </div>

          {/* نور تزئینی */}
          <div className="pointer-events-none absolute -right-24 top-10 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            {/* Breadcrumb */}

            <nav
              aria-label="مسیر صفحه"
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link
                to="/"
                className="transition-colors hover:text-foreground"
              >
                خانه
              </Link>

              <ChevronLeft className="h-3.5 w-3.5" />

              <span className="text-foreground">
                فروشگاه
              </span>
            </nav>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-end">
              {/* اطلاعات فروشگاه */}

              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-xs font-bold text-primary">
                  <PackageSearch className="h-3.5 w-3.5" />

                  فروشگاه یدک موتور
                </div>

                <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-4xl">
                  قطعه مورد نیازت را پیدا کن
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-8 text-muted-foreground sm:text-base">
                  در میان قطعات موتورسیکلت جستجو کن،
                  دسته‌بندی مورد نظر را انتخاب کن و
                  محصول مناسب را سریع پیدا کن.
                </p>
              </div>

              {/* Search */}

              <div className="relative z-50 lg:pb-1">
                <SearchBar
                  value={query}
                  onChange={setQuery}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================
            CONTENT
        ====================================== */}

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* ================================
              دسته‌بندی‌ها
          ================================= */}

          <section
            id="categories"
            className="scroll-mt-24"
          >
            <div className="mb-4">
              <h2 className="text-sm font-extrabold sm:text-base">
                دسته‌بندی قطعات
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                انتخاب سریع گروه محصول
              </p>
            </div>

<CategoryFilter
  value={category}
  onChange={setCategory}
  categories={categoryNames}
/>
          </section>

          {/* ================================
              MAIN SHOP LAYOUT
          ================================= */}

          <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* ============================
                DESKTOP FILTERS
            ============================= */}

            <aside className="hidden lg:block">
              <div className="surface-panel sticky top-24 overflow-hidden rounded-xl">
                {/* عنوان فیلتر */}

                <div className="border-b border-border px-6 py-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary" />

                    <h2 className="text-sm font-extrabold">
                      فیلتر محصولات
                    </h2>
                  </div>

                  {activeFilterCount > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {toPersianDigits(
                        activeFilterCount,
                      )}{" "}
                      فیلتر فعال
                    </p>
                  )}
                </div>

                {/* محتوای فیلتر */}

                <div className="p-6">
                  <ProductFilters
                    filters={filters}
                    onChange={setFilters}
                    minPrice={minProductPrice}
                    maxPrice={maxProductPrice}
                    brands={availableBrands}
                  />
                </div>
              </div>
            </aside>

            {/* ============================
                PRODUCTS
            ============================= */}

            <section
  id="products"
  className="min-w-0 scroll-mt-24"
>
              {/* Toolbar */}

              <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                {/* تعداد نتایج */}

                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-primary">
                    <PackageSearch className="h-4 w-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      نتایج جستجو
                    </p>

                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      <span className="font-bold text-foreground num">
                        {toPersianDigits(
                          results.length,
                        )}
                      </span>{" "}
                      محصول پیدا شد
                    </p>
                  </div>
                </div>

                {/* مرتب‌سازی و فیلتر */}

                <div className="flex shrink-0 items-center gap-2">
                  {/* Mobile Filter */}

                  <button
                    type="button"
                    onClick={() =>
                      setDrawerOpen(true)
                    }
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-xs font-bold text-muted-foreground transition-all duration-200 hover:border-primary/40 hover:text-foreground lg:hidden"
                  >
                    <SlidersHorizontal className="h-4 w-4" />

                    فیلترها

                    {activeFilterCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground num">
                        {toPersianDigits(
                          activeFilterCount,
                        )}
                      </span>
                    )}
                  </button>

                  {/* Sort */}

                  <SortControl
                    value={sort}
                    onChange={setSort}
                  />
                </div>
              </div>

              {/* Product Grid */}

              <div className="mt-6">
                {results.length > 0 ? (
                  <ProductGrid
                    products={results}
                  />
                ) : (
                  <EmptyResults />
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* =====================================
          MOBILE FILTER DRAWER
      ====================================== */}

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}

          <button
            type="button"
            aria-label="بستن فیلترها"
            onClick={() =>
              setDrawerOpen(false)
            }
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Drawer */}

          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-border-strong bg-surface-elevated p-6 pb-8 shadow-[0_-20px_60px_-30px_black]">
            {/* Header */}

            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <h2 className="text-base font-extrabold">
                  فیلتر محصولات
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  نتایج را دقیق‌تر کن
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDrawerOpen(false)
                }
                aria-label="بستن"
                className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filters */}

            <div className="py-5">
              <ProductFilters
                filters={filters}
                onChange={setFilters}
                minPrice={minProductPrice}
                maxPrice={maxProductPrice}
                brands={availableBrands}
              />
            </div>

            {/* Submit */}

            <button
              type="button"
              onClick={() =>
                setDrawerOpen(false)
              }
              className="w-full rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)]"
            >
              نمایش{" "}
              {toPersianDigits(
                results.length,
              )}{" "}
              محصول
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

/* =========================================
    EMPTY RESULTS
========================================= */

function EmptyResults() {
  return (
    <div className="surface-panel rounded-2xl px-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-border bg-surface">
        <PackageSearch className="h-6 w-6 text-muted-foreground" />
      </div>

      <h2 className="mt-5 text-base font-extrabold">
        محصولی پیدا نشد
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        جستجو یا فیلترهای انتخاب‌شده را تغییر بده و
        دوباره امتحان کن.
      </p>
    </div>
  );
}