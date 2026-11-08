import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Package,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductGallery } from "@/components/product/ProductGallery";
import { PurchaseBox } from "@/components/product/PurchaseBox";
import { ProductTabs } from "@/components/product/ProductTabs";
import { RelatedProducts } from "@/components/product/RelatedProducts";

import {
  availabilityLabels,
  getGallery,
  getProductDescription,
  getSku,
  toPersianDigits,
  type Product,
} from "@/data/shop";

import { fetchProduct } from "@/lib/api";
import { cn } from "@/lib/utils";

const SITE_URL = "https://diamondmotor.ir";

export const Route = createFileRoute("/product/$productId")({
  head: ({ params }) => {
    const productId = params.productId;

    const canonicalUrl = `${SITE_URL}/product/${encodeURIComponent(
      productId,
    )}`;

    return {
      meta: [
        {
          title: "محصول | یدک موتور",
        },
        {
          name: "description",
          content:
            "مشاهده مشخصات، قیمت و موجودی قطعه موتورسیکلت در فروشگاه یدک موتور.",
        },

        /*
         * Open Graph
         */
        {
          property: "og:type",
          content: "product",
        },
        {
          property: "og:title",
          content: "محصول | یدک موتور",
        },
        {
          property: "og:description",
          content:
            "مشاهده مشخصات، قیمت و موجودی قطعه موتورسیکلت در فروشگاه یدک موتور.",
        },
        {
          property: "og:url",
          content: canonicalUrl,
        },

        /*
         * Twitter
         */
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: "محصول | یدک موتور",
        },
        {
          name: "twitter:description",
          content:
            "مشاهده مشخصات، قیمت و موجودی قطعه موتورسیکلت در فروشگاه یدک موتور.",
        },
      ],

      links: [
        {
          rel: "canonical",
          href: canonicalUrl,
        },
      ],
    };
  },

  component: ProductDetailPage,
});

const dotColor: Record<string, string> = {
  "in-stock": "bg-success",
  "low-stock": "bg-warning",
  "out-of-stock": "bg-muted-foreground",
};

function ProductDetailPage() {
  const { productId } = Route.useParams();

  const {
    data: apiProduct,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });

  /*
   * تبدیل محصول API به فرمت Product
   */
  const product: Product | null = apiProduct
    ? {
        id: String(apiProduct.id),
        name: apiProduct.name,
        brand: apiProduct.brand,
        category: apiProduct.categoryName ?? "",
        price: apiProduct.price,

        ...(apiProduct.oldPrice !== null &&
        apiProduct.oldPrice !== undefined
          ? {
              oldPrice: apiProduct.oldPrice,
            }
          : {}),

        image: apiProduct.image
          ? apiProduct.image.startsWith("/")
            ? apiProduct.image
            : `/products/${apiProduct.image}`
          : "/products/placeholder.webp",

        images: (apiProduct.images ?? []).map((image) =>
          image.startsWith("/")
            ? image
            : `/products/${image}`,
        ),

        availability: apiProduct.availability,
        rating: apiProduct.rating,
        reviews: apiProduct.reviews,
        popularity: apiProduct.popularity,
        createdAt: apiProduct.createdAt,
        keywords: apiProduct.keywords ?? [],

        ...(apiProduct.badge
          ? {
              badge: apiProduct.badge,
            }
          : {}),
      }
    : null;

  /*
   * Loading
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground">
            در حال دریافت اطلاعات محصول...
          </p>
        </main>

        <Footer />
      </div>
    );
  }

  /*
   * Error / 404
   */
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <section className="surface-panel relative overflow-hidden rounded-2xl px-6 py-20 text-center sm:px-10 sm:py-28">
            <div className="hairline-grid absolute inset-0 opacity-40" />

            <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-border bg-surface text-primary">
                <Package className="h-6 w-6" />
              </div>

              <span className="mt-6 inline-flex items-center rounded-full border border-border-strong bg-surface/70 px-3.5 py-1.5 text-xs text-muted-foreground">
                خطای ۴۰۴
              </span>

              <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                محصول پیدا نشد
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-8 text-muted-foreground">
                این محصول وجود ندارد، حذف شده است یا آدرس صفحه
                اشتباه وارد شده است.
              </p>

              <Link
                to="/shop"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-accent)]"
              >
                مشاهده فروشگاه
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    );
  }

  const isAvailable =
    product.availability !== "out-of-stock";

  const productUrl = `${SITE_URL}/product/${encodeURIComponent(
    productId,
  )}`;

  const productImage =
    product.image.startsWith("http://") ||
    product.image.startsWith("https://")
      ? product.image
      : `${SITE_URL}${product.image}`;

  const productDescription =
    getProductDescription(product);

  /*
   * Product JSON-LD
   */
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",

    name: product.name,

    description: productDescription,

    image: [
      productImage,
      ...getGallery(product)
        .filter(
          (image) => image !== product.image,
        )
        .map((image) =>
          image.startsWith("http://") ||
          image.startsWith("https://")
            ? image
            : `${SITE_URL}${image}`,
        ),
    ],

    sku: getSku(product),

    brand: {
      "@type": "Brand",
      name: product.brand,
    },

    category: product.category,

    offers: {
      "@type": "Offer",

      url: productUrl,

      priceCurrency: "IRR",

      price: product.price,

      availability:
        product.availability === "in-stock"
          ? "https://schema.org/InStock"
          : product.availability ===
              "low-stock"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/OutOfStock",

      itemCondition:
        "https://schema.org/NewCondition",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Breadcrumb */}
        <div className="border-b border-border bg-surface/20">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <nav
              aria-label="مسیر صفحه"
              className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
            >
              <Link
                to="/"
                className="transition-colors hover:text-foreground"
              >
                خانه
              </Link>

              <ChevronLeft className="h-3.5 w-3.5 shrink-0" />

              <Link
                to="/shop"
                className="transition-colors hover:text-foreground"
              >
                فروشگاه
              </Link>

              <ChevronLeft className="h-3.5 w-3.5 shrink-0" />

              <Link
                to="/shop"
                search={{
                  q: "",
                  category: product.category,
                }}
                className="transition-colors hover:text-foreground"
              >
                {product.category}
              </Link>

              <ChevronLeft className="h-3.5 w-3.5 shrink-0" />

              <span
                aria-current="page"
                className="min-w-0 truncate text-foreground"
              >
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Product */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
            {/* Gallery */}
            <ProductGallery
              images={getGallery(product)}
              alt={product.name}
            />

            {/* Product Info */}
            <div className="min-w-0">
              {/* Category + Brand */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/shop"
                  search={{
                    q: "",
                    category: product.category,
                  }}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {product.category}
                </Link>

                <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                  {product.brand}
                </span>
              </div>

              {/* Title */}
              <h1 className="mt-5 text-2xl leading-[1.5] font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>

              {/* Meta */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border pb-5 text-xs text-muted-foreground">
                {/* Rating */}
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />

                  <span className="font-bold text-foreground num">
                    {toPersianDigits(
                      product.rating.toFixed(1),
                    )}
                  </span>

                  <span>
                    از{" "}
                    {toPersianDigits(
                      product.reviews,
                    )}{" "}
                    نظر
                  </span>
                </span>

                {/* Availability */}
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      dotColor[
                        product.availability
                      ],
                    )}
                  />

                  {
                    availabilityLabels[
                      product.availability
                    ]
                  }
                </span>

                {/* SKU */}
                <span className="num">
                  کد کالا: {getSku(product)}
                </span>
              </div>

              {/* Description */}
              <p className="mt-6 text-sm leading-8 text-muted-foreground sm:text-base">
                {productDescription}
              </p>

              {/* Benefits */}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-bold">
                      ضمانت اصالت کالا
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      خرید مطمئن قطعات
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 p-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
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
              </div>

              {/* Purchase */}
              <div className="mt-8">
                <PurchaseBox product={product} />
              </div>

              {/* Out of stock */}
              {!isAvailable && (
                <p className="mt-4 rounded-lg border border-border bg-surface/40 px-4 py-3 text-xs leading-6 text-muted-foreground">
                  این محصول در حال حاضر ناموجود است.
                  می‌توانید محصولات مشابه را در پایین
                  صفحه مشاهده کنید.
                </p>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="mt-16 sm:mt-20">
            <ProductTabs product={product} />
          </div>

          {/* Related Products */}
          <div className="mt-16 sm:mt-20">
            <RelatedProducts product={product} />
          </div>
        </section>
      </main>

      <Footer />

      {/* Product structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            productJsonLd,
          ),
        }}
      />
    </div>
  );
}