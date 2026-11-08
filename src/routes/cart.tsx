import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { useCart } from "@/hooks/useCart";
import { toPersianDigits } from "@/data/shop";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "سبد خرید | یدک موتور" },
      {
        name: "description",
        content: "مشاهده و مدیریت محصولات انتخاب‌شده در سبد خرید یدک موتور.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const {
    items,
    cartCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const formatPrice = (price: number) =>
    `${toPersianDigits(price.toLocaleString("fa-IR"))} ریال`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="relative border-b border-border">
          <div className="hairline-grid absolute inset-0 opacity-30" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <nav
              aria-label="مسیر صفحه"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Link
                to="/"
                className="transition-colors hover:text-foreground"
              >
                خانه
              </Link>

              <ArrowLeft className="h-3.5 w-3.5" />

              <span className="text-foreground">سبد خرید</span>
            </nav>

            <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-4xl">
              سبد خرید
            </h1>

            {cartCount > 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {toPersianDigits(cartCount)} عدد کالا در سبد خرید شماست.
              </p>
            )}
          </div>
        </section>

        {items.length === 0 ? (
          <section className="mx-auto flex min-h-[500px] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-border bg-surface">
                <ShoppingCart className="h-9 w-9 text-muted-foreground" />
              </div>

              <h2 className="mt-6 text-xl font-extrabold">
                سبد خرید شما خالی است
              </h2>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                هنوز محصولی به سبد خرید اضافه نکرده‌اید.
              </p>

              <Link
                to="/shop"
                className="mt-7 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
              >
                مشاهده فروشگاه
              </Link>
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-extrabold">
                    محصولات سبد خرید
                  </h2>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    خالی کردن سبد
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.product.id}
                      className="surface-panel rounded-xl p-4 sm:p-5"
                    >
                      <div className="flex gap-4">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface sm:h-28 sm:w-28">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {item.product.brand}
                              </p>

                              <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-6">
                                {item.product.name}
                              </h3>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(item.product.id)
                              }
                              aria-label={`حذف ${item.product.name}`}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center rounded-lg border border-border">
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                  )
                                }
                                aria-label="افزایش تعداد"
                                className="grid h-9 w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <Plus className="h-4 w-4" />
                              </button>

                              <span className="grid h-9 min-w-10 place-items-center border-x border-border px-2 text-sm font-bold num">
                                {toPersianDigits(item.quantity)}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                  )
                                }
                                aria-label="کاهش تعداد"
                                className="grid h-9 w-9 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="text-left">
                              <p className="text-xs text-muted-foreground">
                                قیمت واحد
                              </p>

                              <p className="mt-1 text-sm font-extrabold num">
                                {formatPrice(item.product.price)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 border-t border-border pt-3 text-left">
                            <span className="text-xs text-muted-foreground">
                              جمع این محصول
                            </span>

                            <span className="mr-2 text-sm font-extrabold num">
                              {formatPrice(
                                item.product.price * item.quantity,
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                <div className="surface-panel rounded-xl p-6">
                  <h2 className="text-base font-extrabold">
                    خلاصه سفارش
                  </h2>

                  <div className="mt-6 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        تعداد کالا
                      </span>

                      <span className="font-bold num">
                        {toPersianDigits(cartCount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        جمع محصولات
                      </span>

                      <span className="font-bold num">
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-extrabold">
                          مبلغ نهایی
                        </span>

                        <span className="text-lg font-extrabold num">
                          {formatPrice(subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Link
                        to="/checkout"
                        className="mt-6 flex w-full items-center justify-center rounded-lg bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        ادامه فرایند خرید
                    </Link>

                  <Link
                    to="/shop"
                    className="mt-3 flex w-full items-center justify-center rounded-lg border border-border py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-surface"
                  >
                    ادامه خرید
                  </Link>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}