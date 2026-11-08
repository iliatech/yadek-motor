import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PackageOpen, Sparkles } from "lucide-react";

import { ProductCard } from "@/components/site/ProductCard";
import { fetchProducts } from "@/lib/api";

import {
  toPersianDigits,
  type Product,
} from "@/data/shop";

function normalizeProductImage(
  image: string | null | undefined,
) {
  if (!image) {
    return "/products/placeholder.webp";
  }

  if (
    image.startsWith("/") ||
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `/products/${image}`;
}

export function RelatedProducts({
  product,
}: {
  product: Product;
}) {
  const {
    data: products = [],
    isLoading,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  /*
   * تبدیل محصولات API به فرمت Product
   */
  const normalizedProducts: Product[] = products.map(
    (apiProduct) => {
      const baseProduct = {
        id: String(apiProduct.id),
        name: apiProduct.name,
        brand: apiProduct.brand,
        category: apiProduct.categoryName ?? "",
        price: apiProduct.price,

        image: normalizeProductImage(
          apiProduct.image,
        ),

        availability: apiProduct.availability,
        rating: apiProduct.rating,
        reviews: apiProduct.reviews,
        popularity: apiProduct.popularity,
        createdAt: apiProduct.createdAt,
        keywords: apiProduct.keywords ?? [],
      };

      return {
        ...baseProduct,

        ...(apiProduct.oldPrice !== null &&
        apiProduct.oldPrice !== undefined
          ? {
              oldPrice: apiProduct.oldPrice,
            }
          : {}),

        ...(apiProduct.badge
          ? {
              badge: apiProduct.badge,
            }
          : {}),
      };
    },
  );

  /*
   * پیدا کردن محصولات مرتبط
   *
   * - از همان دسته‌بندی محصول فعلی
   * - محصول فعلی حذف می‌شود
   * - حداکثر 4 محصول
   */
  const related = normalizedProducts
    .filter(
      (item) =>
        item.id !== product.id &&
        item.category === product.category,
    )
    .sort(
      (a, b) =>
        b.popularity - a.popularity,
    )
    .slice(0, 4);

  /*
   * هنگام دریافت اطلاعات چیزی نمایش نده
   */
  if (isLoading) {
    return null;
  }

  /*
   * اگر محصول مرتبطی وجود نداشت
   */
  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-border pt-12 sm:mt-20 sm:pt-16">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" />

            پیشنهادهای مرتبط
          </div>

          <h2 className="mt-4 text-xl font-extrabold tracking-tight sm:text-2xl">
            شاید به این محصولات هم نیاز داشته باشی
          </h2>

          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {toPersianDigits(related.length)} قطعه پیشنهادی از دسته‌بندی{" "}
            <span className="font-bold text-foreground">
              {product.category}
            </span>{" "}
            برای بررسی بیشتر.
          </p>
        </div>

        <Link
          to="/shop"
          search={{
            q: "",
            category: product.category,
          }}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-bold text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-foreground"
        >
          مشاهده همه

          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 group-hover:text-primary" />
        </Link>
      </div>

      {/* Products */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((item) => (
          <ProductCard
            key={item.id}
            product={item}
          />
        ))}
      </div>

      {/* Bottom hint */}
      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-border bg-surface/30 px-4 py-4 text-center text-xs text-muted-foreground">
        <PackageOpen className="h-4 w-4 shrink-0 text-primary" />

        <span>
          برای مشاهده قطعات بیشتر، دسته‌بندی{" "}
          <Link
            to="/shop"
            search={{
              q: "",
              category: product.category,
            }}
            className="font-bold text-foreground transition-colors hover:text-primary"
          >
            {product.category}
          </Link>{" "}
          را بررسی کن.
        </span>
      </div>
    </section>
  );
}