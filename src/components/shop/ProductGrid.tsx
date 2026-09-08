import { SearchX } from "lucide-react";
import type { Product } from "@/data/shop";
import { ProductCard } from "@/components/site/ProductCard";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="surface-panel flex flex-col items-center rounded-xl px-6 py-20 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground">
          <SearchX className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <h3 className="mt-5 text-base font-extrabold">محصولی پیدا نشد</h3>
        <p className="mt-2 max-w-xs text-sm leading-7 text-muted-foreground">
          عبارت دیگری را امتحان کنید یا از دسته‌بندی‌ها استفاده کنید.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
