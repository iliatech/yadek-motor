import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { fetchProducts } from "@/lib/api";
import type { Product } from "@/data/shop";

import { ProductCard } from "./ProductCard";
import { SectionHeading } from "./SectionHeading";

export function FeaturedProducts() {
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const featuredProducts: Product[] = products
    .filter((product) => product.badge)
    .sort(
      (a, b) =>
        b.popularity - a.popularity,
    )
    .slice(0, 6)
    .map((product) => ({
      id: String(product.id),
      name: product.name,
      brand: product.brand,
      category: product.categoryName ?? "",
      price: product.price,

      ...(product.oldPrice !== null
        ? {
            oldPrice: product.oldPrice,
          }
        : {}),

      /*
       * تصویر مستقیماً از API / دیتابیس
       *
       * قبلاً اینجا:
       * /products/${product.image}
       *
       * ساخته می‌شد که مسیر تصویر را خراب می‌کرد.
       */
      image: product.image,

      availability:
        product.availability,

      rating: product.rating,
      reviews: product.reviews,
      popularity: product.popularity,
      createdAt: product.createdAt,

      keywords:
        product.keywords ?? [],

      ...(product.badge
        ? {
            badge: product.badge,
          }
        : {}),
    }));

  return (
    <section className="border-y border-border bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="محصولات منتخب"
          subtitle="قطعات اصلی و پرمصرف با ضمانت اصالت کالا."
          action={
            <Link
              to="/shop"
              className="shrink-0 rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:text-foreground"
            >
              همه محصولات
            </Link>
          }
        />

        <div className="mt-10">
          {isLoading && (
            <p className="text-sm text-muted-foreground">
              در حال دریافت محصولات...
            </p>
          )}

          {isError && (
            <p className="text-sm text-destructive">
              خطا در دریافت محصولات
            </p>
          )}

          {!isLoading && !isError && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}