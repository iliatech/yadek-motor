import { useState } from "react";
import {
  Check,
  Minus,
  PackageCheck,
  Plus,
  ShoppingCart,
  Truck,
} from "lucide-react";

import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";

import {
  formatRial,
  getDiscountPercent,
  toPersianDigits,
  type Product,
} from "@/data/shop";

import { cn } from "@/lib/utils";

type PurchaseBoxProps = {
  product: Product;
};

export function PurchaseBox({
  product,
}: PurchaseBoxProps) {
  const { addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);

  const soldOut =
    product.availability === "out-of-stock";

  const discount = getDiscountPercent(product);

  const handleAdd = () => {
    if (soldOut) return;

    addToCart(product, quantity);

    toast.success("به سبد خرید اضافه شد", {
      description: `${product.name} — ${toPersianDigits(
        quantity,
      )} عدد`,
    });
  };

  const increaseQuantity = () => {
    if (soldOut) return;

    setQuantity((current) => current + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((current) =>
      Math.max(1, current - 1),
    );
  };

  return (
    <div className="surface-panel overflow-hidden rounded-2xl">

      {/* =========================================
          PRICE
      ========================================= */}
      <div className="border-b border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">

          <div>
            <p className="text-xs text-muted-foreground">
              قیمت محصول
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="text-2xl font-extrabold tracking-tight num sm:text-3xl">
                {formatRial(product.price)}

                <span className="mr-1 text-sm font-normal text-muted-foreground">
                  ریال
                </span>
              </span>

              {discount && (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary num">
                  {toPersianDigits(discount)}٪ تخفیف
                </span>
              )}
            </div>

            {product.oldPrice && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  قیمت قبل:
                </span>

                <span className="text-xs text-muted-foreground line-through num">
                  {formatRial(product.oldPrice)} ریال
                </span>
              </div>
            )}
          </div>

          {/* وضعیت محصول */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
              soldOut
                ? "border-border bg-surface text-muted-foreground"
                : "border-success/30 bg-success/10 text-success",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                soldOut
                  ? "bg-muted-foreground"
                  : "bg-success",
              )}
            />

            {soldOut
              ? "ناموجود"
              : "آماده ارسال"}
          </div>
        </div>
      </div>

      {/* =========================================
          PURCHASE CONTROLS
      ========================================= */}
      <div className="p-5 sm:p-6">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">

          {/* تعداد */}
          <div className="flex h-[52px] shrink-0 items-center justify-between rounded-xl border border-border bg-background/40 p-1.5 sm:w-[150px]">

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={soldOut}
              aria-label="افزایش تعداد"
              className="grid h-full aspect-square place-items-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>

            <span
              aria-live="polite"
              className="min-w-10 text-center text-sm font-extrabold num"
            >
              {toPersianDigits(quantity)}
            </span>

            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={soldOut || quantity <= 1}
              aria-label="کاهش تعداد"
              className="grid h-full aspect-square place-items-center rounded-lg border border-border text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>

          {/* افزودن به سبد */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            className="group inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {soldOut ? (
              <>
                <PackageCheck className="h-4 w-4" />
                محصول ناموجود است
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                افزودن به سبد خرید
              </>
            )}
          </button>
        </div>

        {/* =========================================
            BENEFITS
        ========================================= */}
        <div className="mt-5 grid gap-3 border-t border-border pt-5 sm:grid-cols-2">

          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-primary">
              <Truck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-bold">
                ارسال سریع
              </p>

              <p className="mt-1 text-[11px] text-muted-foreground">
                ارسال به سراسر کشور
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-primary">
              <Check className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-bold">
                خرید مطمئن
              </p>

              <p className="mt-1 text-[11px] text-muted-foreground">
                ضمانت اصالت کالا
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}