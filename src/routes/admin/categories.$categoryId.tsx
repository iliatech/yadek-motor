import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  FolderTree,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
  createdAt: string;
};

type Product = {
  id: number;
  name: string;
  slug?: string | null;
  brand?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  price?: number | null;
  image?: string | null;
};

type CategoriesResponse = {
  success: boolean;
  categories: Category[];
  message?: string;
};

type ProductsResponse = {
  success?: boolean;
  products?: Product[];
  count?: number;
  message?: string;
};

type MutationResponse = {
  success?: boolean;
  product?: Product;
  message?: string;
  error?: string;
};

export const Route = createFileRoute("/admin/categories/$categoryId")({
  component: CategoryProductsPage,
});

function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) =>
      String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)),
    );
}

function formatPrice(price: number | null | undefined) {
  if (price === null || price === undefined) {
    return "قیمت نامشخص";
  }

  return `${new Intl.NumberFormat("fa-IR").format(price)} ریال`;
}

function CategoryProductsPage() {
  const navigate = useNavigate();
  const { categoryId } = Route.useParams();

  console.log("[CATEGORY PAGE] rendered");

  console.log("[CATEGORY PAGE] params:", {
    categoryId,
  });

  const parsedCategoryId = Number(normalizeDigits(categoryId));

  console.log("[CATEGORY PAGE] parsed category id:", {
    categoryId,
    parsedCategoryId,
    isInteger: Number.isInteger(parsedCategoryId),
  });

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [addingProductId, setAddingProductId] = useState<number | null>(
    null,
  );

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function loadData(showRefresh = false) {
    console.log("[CATEGORY PAGE] loadData started:", {
      categoryId,
      parsedCategoryId,
      showRefresh,
    });

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setMessage(null);

      console.log("[CATEGORY PAGE] fetching APIs...");

      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/products"),
      ]);

      console.log("[CATEGORY PAGE] APIs responded:", {
        categoriesStatus: categoriesResponse.status,
        categoriesOk: categoriesResponse.ok,
        productsStatus: productsResponse.status,
        productsOk: productsResponse.ok,
      });

      const categoriesData =
        (await categoriesResponse.json()) as CategoriesResponse;

      const productsData =
        (await productsResponse.json()) as ProductsResponse;

      console.log("[CATEGORY PAGE] categories data:", categoriesData);

      console.log("[CATEGORY PAGE] products data:", productsData);

      console.log("[CATEGORY PAGE] products count:", {
        count: productsData.products?.length ?? 0,
      });

      if (!categoriesResponse.ok || !categoriesData.success) {
        throw new Error(
          categoriesData.message ||
            "دریافت دسته‌بندی‌ها ناموفق بود.",
        );
      }

      if (!productsResponse.ok || productsData.success === false) {
        throw new Error(
          productsData.message ||
            "دریافت محصولات ناموفق بود.",
        );
      }

      console.log("[CATEGORY PAGE] searching category:", {
        parsedCategoryId,
        availableCategoryIds:
          categoriesData.categories?.map((item) => item.id) ?? [],
      });

      const foundCategory = categoriesData.categories.find(
        (item) => item.id === parsedCategoryId,
      );

      console.log("[CATEGORY PAGE] found category:", foundCategory);

      if (!foundCategory) {
        throw new Error(
          "دسته‌بندی موردنظر پیدا نشد.",
        );
      }

      setCategory(foundCategory);

      setProducts(productsData.products ?? []);

      console.log("[CATEGORY PAGE] state updated successfully:", {
        categoryId: foundCategory.id,
        categoryName: foundCategory.name,
        productsCount: productsData.products?.length ?? 0,
      });
    } catch (error) {
      console.error("[CATEGORY PAGE] loadData failed:", error);

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "خطایی در دریافت اطلاعات رخ داد.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);

      console.log("[CATEGORY PAGE] loadData finished");
    }
  }

  useEffect(() => {
    console.log("[CATEGORY PAGE] useEffect:", {
      categoryId,
      parsedCategoryId,
    });

    if (
      !Number.isInteger(parsedCategoryId) ||
      parsedCategoryId <= 0
    ) {
      console.error(
        "[CATEGORY PAGE] invalid category id:",
        parsedCategoryId,
      );

      setLoading(false);

      setMessage({
        type: "error",
        text: "شناسه دسته‌بندی معتبر نیست.",
      });

      return;
    }

    console.log(
      "[CATEGORY PAGE] calling loadData...",
    );

    void loadData();
  }, [parsedCategoryId]);

  const categoryProducts = useMemo(() => {
    const result = products.filter(
      (product) =>
        Number(product.categoryId) === parsedCategoryId,
    );

    console.log("[CATEGORY PAGE] categoryProducts calculated:", {
      parsedCategoryId,
      totalProducts: products.length,
      categoryProducts: result.length,
    });

    return result;
  }, [products, parsedCategoryId]);

  const availableProducts = useMemo(() => {
    const search = productSearch.trim().toLowerCase();

    const result = products
      .filter(
        (product) =>
          Number(product.categoryId) !== parsedCategoryId,
      )
      .filter((product) => {
        if (!search) return true;

        return (
          product.name.toLowerCase().includes(search) ||
          product.brand?.toLowerCase().includes(search) ||
          String(product.id).includes(search)
        );
      });

    return result;
  }, [
    products,
    parsedCategoryId,
    productSearch,
  ]);

  async function addProductToCategory(product: Product) {
    if (!category) return;

    const previousCategory =
      product.categoryName ||
      (product.categoryId
        ? `دسته شماره ${product.categoryId}`
        : "بدون دسته‌بندی");

    const confirmed = window.confirm(
      product.categoryId
        ? `این محصول در حال حاضر در «${previousCategory}» قرار دارد.\n\nبا افزودن آن به «${category.name}»، دسته فعلی محصول تغییر می‌کند.\n\nادامه می‌دهید؟`
        : `محصول «${product.name}» به دسته «${category.name}» اضافه شود؟`,
    );

    if (!confirmed) return;

    try {
      setAddingProductId(product.id);
      setMessage(null);

      const response = await fetch(
        `/api/admin/products?productId=${product.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            categoryId: parsedCategoryId,
          }),
        },
      );

      const data =
        (await response.json()) as MutationResponse;

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            "افزودن محصول به دسته‌بندی ناموفق بود.",
        );
      }

      setMessage({
        type: "success",
        text: `محصول «${product.name}» به دسته «${category.name}» اضافه شد.`,
      });

      await loadData(true);
    } catch (error) {
      console.error(
        "[CATEGORY PAGE] addProductToCategory failed:",
        error,
      );

      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "افزودن محصول ناموفق بود.",
      });
    } finally {
      setAddingProductId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex items-center justify-center py-24 text-zinc-400">
            <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
            در حال دریافت اطلاعات...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0b0b0b] text-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/admin/categories",
                })
              }
              className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              بازگشت به دسته‌بندی‌ها
            </button>

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <FolderTree className="h-7 w-7 text-zinc-300" />
              </div>

              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {category?.name}
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                  مدیریت محصولات این دسته‌بندی
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-700 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              بروزرسانی
            </button>

            <button
              type="button"
              onClick={() => {
                setProductSearch("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" />
              افزودن محصول
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <X className="h-5 w-5 shrink-0" />
            )}

            <span>{message.text}</span>
          </div>
        )}

        {/* Category summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-zinc-500">
                تعداد محصولات
              </span>

              <Package className="h-5 w-5 text-zinc-500" />
            </div>

            <div className="text-2xl font-bold">
              {categoryProducts.length}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-3 text-sm text-zinc-500">
              شناسه دسته
            </div>

            <div className="text-2xl font-bold">
              {category?.id}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-3 text-sm text-zinc-500">
              Slug
            </div>

            <div className="truncate text-lg font-semibold text-zinc-300">
              {category?.slug}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950">
          <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">
                محصولات این دسته
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                محصولاتی که در حال حاضر به این دسته‌بندی متصل هستند
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setProductSearch("");
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              افزودن محصول
            </button>
          </div>

          {categoryProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
                <Package className="h-7 w-7 text-zinc-600" />
              </div>

              <h3 className="text-lg font-semibold">
                هنوز محصولی در این دسته نیست
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
                از دکمه «افزودن محصول» استفاده کنید و محصولات
                موردنظر را به این دسته منتقل کنید.
              </p>

              <button
                type="button"
                onClick={() => {
                  setProductSearch("");
                  setShowAddModal(true);
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200"
              >
                <Plus className="h-4 w-4" />
                افزودن اولین محصول
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {categoryProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 transition hover:border-zinc-700"
                >
                  <div className="flex gap-4 p-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-7 w-7 text-zinc-700" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100">
                        {product.name}
                      </h3>

                      {product.brand && (
                        <p className="mt-1 text-xs text-zinc-500">
                          {product.brand}
                        </p>
                      )}

                      <p className="mt-3 text-sm font-medium text-zinc-300">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-[#111111] shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-5">
              <div>
                <h2 className="text-lg font-bold">
                  افزودن محصول به دسته
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  دسته:{" "}
                  <span className="text-zinc-300">
                    {category?.name}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-zinc-800 p-5">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />

                <input
                  value={productSearch}
                  onChange={(event) =>
                    setProductSearch(event.target.value)
                  }
                  placeholder="جستجوی نام محصول، برند یا شناسه..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pr-11 pl-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-zinc-600"
                  autoFocus
                />
              </div>
            </div>

            {/* Product List */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {availableProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Package className="mb-4 h-10 w-10 text-zinc-700" />

                  <p className="text-sm font-medium text-zinc-300">
                    محصولی پیدا نشد
                  </p>

                  <p className="mt-2 text-xs text-zinc-600">
                    {productSearch
                      ? "عبارت جستجو را تغییر دهید."
                      : "همه محصولات در این دسته قرار دارند."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 transition hover:border-zinc-700"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-zinc-700" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold text-zinc-100">
                          {product.name}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                          {product.brand && (
                            <span>{product.brand}</span>
                          )}

                          <span>
                            #{product.id}
                          </span>

                          {product.categoryName && (
                            <span>
                              دسته فعلی:{" "}
                              {product.categoryName}
                            </span>
                          )}
                        </div>

                        {product.price !== null &&
                          product.price !== undefined && (
                            <p className="mt-1 text-xs text-zinc-400">
                              {formatPrice(product.price)}
                            </p>
                          )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void addProductToCategory(product)
                        }
                        disabled={
                          addingProductId === product.id
                        }
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingProductId === product.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            در حال افزودن
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            افزودن
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-zinc-800 p-5">
              <span className="text-xs text-zinc-600">
                {availableProducts.length} محصول قابل انتخاب
              </span>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}