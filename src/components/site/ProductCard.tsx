import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Star,
  ArrowLeft,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

import {
  availabilityLabels,
  formatRial,
  getDiscountPercent,
  toPersianDigits,
  type Product,
} from "@/data/shop";

import { cn } from "@/lib/utils";

const dotColor: Record<
  Product["availability"],
  string
> = {
  "in-stock": "bg-success",
  "low-stock": "bg-warning",
  "out-of-stock":
    "bg-muted-foreground",
};

export function ProductCard({
  product,
}: {
  product: Product;
}) {
  const { addToCart } = useCart();

  const soldOut =
    product.availability ===
    "out-of-stock";

  const discount =
    getDiscountPercent(product);

  const handleAdd = () => {
    if (soldOut) return;

    addToCart(product, 1);

    toast.success(
      "محصول به سبد خرید اضافه شد",
      {
        description: `${product.name} — ۱ عدد`,
      },
    );
  };

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "border border-border bg-surface",
        "transition-all duration-300",
        "hover:-translate-y-1",
        "hover:border-primary/30",
        "hover:shadow-[var(--shadow-panel)]",
      )}
    >
      <Link
        to="/product/$productId"
        params={{
          productId: product.id,
        }}
        aria-label={product.name}
        className="relative block aspect-square overflow-hidden bg-background"
      >
        <div
          className="
            pointer-events-none
            absolute inset-0 z-[1]
            bg-[radial-gradient(circle_at_50%_35%,oklch(0.78_0.13_72_/_10%),transparent_55%)]
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />

        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className={cn(
            "h-full w-full object-cover",
            "transition-transform duration-700 ease-out",
            "group-hover:scale-[1.06]",
            soldOut &&
              "opacity-45 grayscale",
          )}
          onError={(event) => {
            console.error(
              "Product image failed:",
              product.name,
              product.image,
            );

            event.currentTarget.src =
              "/products/product-placeholder.webp";
          }}
        />

        <div
          className="
            pointer-events-none
            absolute inset-x-0 bottom-0
            h-24
            bg-gradient-to-t
            from-background/60
            to-transparent
          "
        />

        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
          {product.badge && (
            <span
              className="
                rounded-full
                bg-primary
                px-3 py-1.5
                text-[11px]
                font-extrabold
                text-primary-foreground
                shadow-[var(--shadow-accent)]
              "
            >
              {product.badge}
            </span>
          )}

          {discount && (
            <span
              className="
                rounded-full
                border border-primary/40
                bg-background/90
                px-3 py-1.5
                text-[11px]
                font-bold
                text-primary
                backdrop-blur-md
                num
              "
            >
              {toPersianDigits(
                discount,
              )}
              ٪ تخفیف
            </span>
          )}
        </div>

        <span
          className="
            absolute left-3 top-3 z-10
            rounded-full
            border border-border-strong
            bg-background/85
            px-3 py-1.5
            text-[11px]
            font-medium
            text-muted-foreground
            backdrop-blur-md
          "
        >
          {product.category}
        </span>

        <span
          className={cn(
            "absolute bottom-3 left-3 z-10",
            "flex items-center gap-1.5",
            "rounded-full border border-border-strong",
            "bg-background/85 px-3 py-1.5",
            "text-[11px] font-bold text-foreground",
            "opacity-0 backdrop-blur-md",
            "translate-y-2",
            "transition-all duration-300",
            "group-hover:translate-y-0",
            "group-hover:opacity-100",
          )}
        >
          مشاهده محصول
          <ArrowLeft
            className="h-3.5 w-3.5 text-primary"
          />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-xs font-medium text-muted-foreground">
            {product.brand}
          </span>

          <span
            className="
              flex shrink-0 items-center gap-1.5
              rounded-full
              border border-border
              bg-background/60
              px-2 py-1
              text-xs
              text-muted-foreground
            "
          >
            <Star
              className="h-3.5 w-3.5 fill-primary text-primary"
            />

            <span className="num">
              {toPersianDigits(
                product.rating.toFixed(1),
              )}
            </span>
          </span>
        </div>

        <h3 className="mt-3 min-h-[3.5rem] text-sm font-extrabold leading-7 sm:text-base">
          <Link
            to="/product/$productId"
            params={{
              productId: product.id,
            }}
            className="
              transition-colors
              duration-200
              hover:text-primary
            "
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              dotColor[
                product.availability
              ],
            )}
          />

          <span className="text-xs text-muted-foreground">
            {
              availabilityLabels[
                product.availability
              ]
            }
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-4 h-px bg-border" />

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {product.oldPrice && (
                <span
                  className="
                    mb-1 block
                    text-xs
                    text-muted-foreground
                    line-through
                    num
                  "
                >
                  {formatRial(
                    product.oldPrice,
                  )}
                </span>
              )}

              <div className="flex items-baseline gap-1">
                <span
                  className="
                    truncate
                    text-lg
                    font-black
                    num
                  "
                >
                  {formatRial(
                    product.price,
                  )}
                </span>

                <span
                  className="
                    shrink-0
                    text-[10px]
                    text-muted-foreground
                  "
                >
                  ریال
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={soldOut}
              onClick={handleAdd}
              aria-label={`افزودن ${product.name} به سبد خرید`}
              className={cn(
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold",
                "transition-all duration-300",
                soldOut
                  ? "cursor-not-allowed border border-border bg-background text-muted-foreground"
                  : [
                      "border border-primary/20",
                      "bg-primary/10 text-primary",
                      "hover:border-primary",
                      "hover:bg-primary",
                      "hover:text-primary-foreground",
                      "hover:shadow-[var(--shadow-accent)]",
                    ],
              )}
            >
              <ShoppingCart className="h-4 w-4" />

              <span>
                {soldOut
                  ? "ناموجود"
                  : "افزودن"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}