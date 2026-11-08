import {
  createFileRoute,
  Outlet,
  useLocation,
  useNavigate,
} from "@tanstack/react-router";
import {
  FolderTree,
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  X,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
};

type CategoriesResponse =
  | Category[]
  | {
      categories?: Category[];
    };

type ErrorResponse = {
  error?: string;
};

export const Route = createFileRoute(
  "/admin/categories",
)({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const location = useLocation();

  const isCategoryDetail =
    location.pathname.startsWith(
      "/admin/categories/",
    );

  if (isCategoryDetail) {
    return <Outlet />;
  }

  return <CategoriesListPage />;
}

function CategoriesListPage() {
  const navigate = useNavigate();

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] =
    useState<CategoryForm>({
      name: "",
      slug: "",
      description: "",
    });

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/categories",
      );

      if (!response.ok) {
        throw new Error(
          "خطا در دریافت دسته‌بندی‌ها",
        );
      }

      const data =
        (await response.json()) as CategoriesResponse;

      const loadedCategories =
        Array.isArray(data)
          ? data
          : Array.isArray(
                data["categories"],
              )
            ? data["categories"]
            : [];

      setCategories(
        loadedCategories,
      );
    } catch (err) {
      console.error(err);

      setError(
        "دریافت دسته‌بندی‌ها با خطا مواجه شد.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const filteredCategories =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return categories;
      }

      return categories.filter(
        (category) => {
          return (
            category.name
              .toLowerCase()
              .includes(query) ||
            category.slug
              .toLowerCase()
              .includes(query) ||
            (
              category.description ??
              ""
            )
              .toLowerCase()
              .includes(query)
          );
        },
      );
    }, [categories, search]);

  function openCreateModal() {
    setEditingCategory(null);

    setForm({
      name: "",
      slug: "",
      description: "",
    });

    setError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function openEditModal(
    category: Category,
  ) {
    setEditingCategory(category);

    setForm({
      name: category.name,
      slug: category.slug,
      description:
        category.description ?? "",
    });

    setError("");
    setSuccessMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingCategory(null);

    setForm({
      name: "",
      slug: "",
      description: "",
    });
  }

  async function saveCategory() {
    const name =
      form.name.trim();

    const slug =
      form.slug.trim();

    const description =
      form.description.trim();

    if (!name) {
      setError(
        "نام دسته‌بندی را وارد کنید.",
      );

      return;
    }

    if (!slug) {
      setError(
        "اسلاگ دسته‌بندی را وارد کنید.",
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (editingCategory) {
        const response =
          await fetch(
            `/api/admin/categories?categoryId=${editingCategory.id}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                name,
                slug,
                description,
              }),
            },
          );

        if (!response.ok) {
          const data =
            (await response
              .json()
              .catch(
                () => null,
              )) as
              | ErrorResponse
              | null;

          throw new Error(
            data?.["error"] ||
              "ویرایش دسته‌بندی انجام نشد.",
          );
        }

        setSuccessMessage(
          "دسته‌بندی با موفقیت ویرایش شد.",
        );
      } else {
        const response =
          await fetch(
            "/api/admin/categories",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                name,
                slug,
                description,
              }),
            },
          );

        if (!response.ok) {
          const data =
            (await response
              .json()
              .catch(
                () => null,
              )) as
              | ErrorResponse
              | null;

          throw new Error(
            data?.["error"] ||
              "ایجاد دسته‌بندی انجام نشد.",
          );
        }

        setSuccessMessage(
          "دسته‌بندی با موفقیت ایجاد شد.",
        );
      }

      setShowModal(false);
      setEditingCategory(null);

      setForm({
        name: "",
        slug: "",
        description: "",
      });

      await loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "عملیات انجام نشد.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(
    category: Category,
  ) {
    if (
      category.productCount &&
      category.productCount > 0
    ) {
      setError(
        `دسته‌بندی «${category.name}» دارای ${category.productCount} محصول است و فعلاً قابل حذف نیست.`,
      );

      return;
    }

    const confirmed =
      window.confirm(
        `آیا از حذف دسته‌بندی «${category.name}» مطمئن هستید؟`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError("");
      setSuccessMessage("");

      const response =
        await fetch(
          `/api/admin/categories?categoryId=${category.id}`,
          {
            method: "DELETE",
          },
        );

      if (!response.ok) {
        const data =
          (await response
            .json()
            .catch(
              () => null,
            )) as
            | ErrorResponse
            | null;

        throw new Error(
          data?.["error"] ||
            "حذف دسته‌بندی انجام نشد.",
        );
      }

      setSuccessMessage(
        "دسته‌بندی با موفقیت حذف شد.",
      );

      await loadCategories();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "حذف دسته‌بندی انجام نشد.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function openCategoryProducts(
    category: Category,
  ) {
    const targetPath =
      `/admin/categories/${category.id}`;

    console.log(
      "[CATEGORY NAVIGATION]:",
      targetPath,
    );

    void navigate({
      to: "/admin/categories/$categoryId",
      params: {
        categoryId:
          String(category.id),
      },
    });
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0d0d0d]">
                <FolderTree className="h-5 w-5 text-white" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  مدیریت دسته‌بندی‌ها
                </h1>

                <p className="mt-1 text-sm text-white/45">
                  ایجاد، ویرایش و مدیریت دسته‌بندی محصولات
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            دسته‌بندی جدید
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="mr-auto text-white/40 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {successMessage}
            </span>

            <button
              type="button"
              onClick={() =>
                setSuccessMessage("")
              }
              className="mr-auto text-white/40 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-[#0b0b0b] p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="جستجوی دسته‌بندی..."
              className="w-full rounded-xl border border-white/10 bg-[#060606] py-3 pl-4 pr-10 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
            />
          </div>
        </div>

        {/* Categories */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-[#0b0b0b]">
            <div className="flex items-center gap-2 text-sm text-white/45">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال دریافت دسته‌بندی‌ها...
            </div>
          </div>
        ) : filteredCategories.length ===
          0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0b0b0b] px-4 text-center">
            <FolderTree className="mb-4 h-10 w-10 text-white/25" />

            <h2 className="text-base font-semibold">
              دسته‌بندی‌ای پیدا نشد
            </h2>

            <p className="mt-2 text-sm text-white/40">
              {search
                ? "عبارت جستجو را تغییر دهید."
                : "هنوز دسته‌بندی‌ای ایجاد نشده است."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCategories.map(
              (category) => (
                <div
                  key={category.id}
                  className="group rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 transition hover:border-white/20"
                >
                  {/* Category title */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#050505]">
                      <FolderTree className="h-4 w-4 text-white/70" />
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-white">
                        {category.name}
                      </h2>

                      <p
                        dir="ltr"
                        className="mt-1 truncate text-left text-xs text-white/35"
                      >
                        {category.slug}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {category.description && (
                    <p className="mb-4 line-clamp-2 text-sm leading-6 text-white/45">
                      {
                        category.description
                      }
                    </p>
                  )}

                  {/* Product count */}
                  <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-sm">
                    <Package className="h-4 w-4 text-white/40" />

                    <span className="text-white/40">
                      تعداد محصولات:
                    </span>

                    <span className="font-semibold text-white">
                      {category.productCount ??
                        0}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openCategoryProducts(
                          category,
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-xs font-medium text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
                    >
                      <Package className="h-4 w-4" />
                      محصولات
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(
                          category,
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-xs font-medium text-white/80 transition hover:border-white/25 hover:bg-white/[0.04]"
                    >
                      <Pencil className="h-4 w-4" />
                      ویرایش
                    </button>

                    <button
                      type="button"
                      disabled={
                        deletingId ===
                        category.id
                      }
                      onClick={() =>
                        void deleteCategory(
                          category,
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.03] px-3 py-2.5 text-xs font-medium text-red-300 transition hover:border-red-500/30 hover:bg-red-500/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId ===
                      category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}

                      حذف
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0b] shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <h2 className="font-semibold text-white">
                  {editingCategory
                    ? "ویرایش دسته‌بندی"
                    : "ایجاد دسته‌بندی"}
                </h2>

                <p className="mt-1 text-xs text-white/40">
                  اطلاعات دسته‌بندی را وارد کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  نام دسته‌بندی
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name: event.target
                          .value,
                      }),
                    )
                  }
                  placeholder="مثلاً سیستم ترمز"
                  className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  اسلاگ
                </label>

                <input
                  type="text"
                  value={form.slug}
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        slug: event.target
                          .value,
                      }),
                    )
                  }
                  placeholder="مثلاً brake-system"
                  dir="ltr"
                  className="w-full rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-left text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  توضیحات
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        description:
                          event.target
                            .value,
                      }),
                    )
                  }
                  placeholder="توضیح کوتاه درباره این دسته‌بندی..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-xl border border-white/10 bg-[#050505] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.04] disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveCategory()
                }
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {editingCategory
                  ? "ذخیره تغییرات"
                  : "ایجاد دسته‌بندی"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}