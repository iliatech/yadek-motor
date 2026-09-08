import { createFileRoute } from "@tanstack/react-router";
import {
  Edit3,
  FolderTree,
  Plus,
  RefreshCw,
  Search,
  Trash2,
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

type CategoriesResponse = {
  success: boolean;
  categories: Category[];
  count: number;
  message?: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
};

type MutationResponse = {
  success: boolean;
  message?: string;
  category?: Category;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
};

export const Route = createFileRoute(
  "/admin/categories",
)({
  component: AdminCategoriesPage,
});

function toPersianDigits(value: string | number) {
  const digits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value).replace(
    /\d/g,
    (digit) => digits[Number(digit)] ?? digit,
  );
}

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function AdminCategoriesPage() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [form, setForm] =
    useState<CategoryForm>(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/categories",
      );

      const data =
        (await response.json()) as CategoriesResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "دریافت دسته‌بندی‌ها ناموفق بود.",
        );
      }

      setCategories(data.categories);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "خطا در دریافت دسته‌بندی‌ها.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name
          .toLowerCase()
          .includes(query) ||
        category.slug
          .toLowerCase()
          .includes(query) ||
        (
          category.description ?? ""
        )
          .toLowerCase()
          .includes(query),
    );
  }, [categories, search]);

  function openCreateModal() {
    setEditingCategory(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
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
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCategory(null);
    setForm(EMPTY_FORM);
  }

  function updateField(
    field: keyof CategoryForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleNameChange(
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        editingCategory
          ? current.slug
          : createSlug(value),
    }));
  }

  async function saveCategory() {
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const name = form.name.trim();

      const slug =
        form.slug.trim() ||
        createSlug(name);

      const description =
        form.description.trim() ||
        null;

      if (!name) {
        throw new Error(
          "نام دسته‌بندی الزامی است.",
        );
      }

      if (!slug) {
        throw new Error(
          "Slug دسته‌بندی معتبر نیست.",
        );
      }

      const payload = editingCategory
        ? {
            categoryId:
              editingCategory.id,
            name,
            slug,
            description,
          }
        : {
            name,
            slug,
            description,
          };

      const response = await fetch(
        "/api/admin/categories",
        {
          method: editingCategory
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const data =
        (await response.json()) as MutationResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "ذخیره دسته‌بندی ناموفق بود.",
        );
      }

      await loadCategories();

      setSuccessMessage(
        editingCategory
          ? "دسته‌بندی با موفقیت ویرایش شد."
          : "دسته‌بندی با موفقیت ایجاد شد.",
      );

      closeModal();

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "ذخیره دسته‌بندی ناموفق بود.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(
    category: Category,
  ) {
    if (category.productCount > 0) {
      setError(
        "این دسته‌بندی دارای محصول است و نمی‌توان آن را حذف کرد.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        `آیا از حذف «${category.name}» مطمئن هستید؟`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category.id);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/admin/categories",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            categoryId:
              category.id,
          }),
        },
      );

      const data =
        (await response.json()) as MutationResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "حذف دسته‌بندی ناموفق بود.",
        );
      }

      setCategories((current) =>
        current.filter(
          (item) =>
            item.id !== category.id,
        ),
      );

      setSuccessMessage(
        "دسته‌بندی با موفقیت حذف شد.",
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "حذف دسته‌بندی ناموفق بود.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-neutral-950 px-4 py-8 text-white md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3">
                <FolderTree className="h-6 w-6" />
              </div>

              <h1 className="text-2xl font-bold md:text-3xl">
                مدیریت دسته‌بندی‌ها
              </h1>
            </div>

            <p className="text-sm text-neutral-400">
              ایجاد، ویرایش و مدیریت دسته‌بندی‌های فروشگاه
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <span className="text-xs text-neutral-500">
                تعداد دسته‌بندی‌ها
              </span>

              <div className="mt-1 text-xl font-bold">
                {toPersianDigits(
                  categories.length,
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={loadCategories}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={
                  loading
                    ? "h-4 w-4 animate-spin"
                    : "h-4 w-4"
                }
              />

              بروزرسانی
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200"
            >
              <Plus className="h-4 w-4" />

              افزودن دسته‌بندی
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm text-green-300">
            {successMessage}
          </div>
        )}

        {error && !modalOpen && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-neutral-500" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="جستجوی نام، slug یا توضیحات..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
            />
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-neutral-500" />

            <p className="text-neutral-400">
              در حال دریافت دسته‌بندی‌ها...
            </p>
          </div>
        )}

        {!loading &&
          filteredCategories.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
              <FolderTree className="mx-auto mb-4 h-12 w-12 text-neutral-600" />

              <h2 className="text-lg font-bold">
                دسته‌بندی‌ای پیدا نشد
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                دسته‌بندی مطابق جستجوی شما وجود ندارد.
              </p>
            </div>
          )}

        {!loading &&
          filteredCategories.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCategories.map(
                (category) => (
                  <article
                    key={category.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white/10 p-3">
                          <FolderTree className="h-5 w-5" />
                        </div>

                        <div>
                          <h2 className="font-bold">
                            {category.name}
                          </h2>

                          <p className="mt-1 font-mono text-xs text-neutral-500">
                            {category.slug}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-lg bg-white/5 px-2 py-1 font-mono text-[10px] text-neutral-500">
                        #
                        {toPersianDigits(
                          category.id,
                        )}
                      </span>
                    </div>

                    {category.description && (
                      <p className="mb-5 line-clamp-3 text-sm leading-7 text-neutral-400">
                        {
                          category.description
                        }
                      </p>
                    )}

                    <div className="mb-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <div>
                        <span className="text-xs text-neutral-500">
                          تعداد محصولات
                        </span>

                        <div className="mt-1 font-bold">
                          {toPersianDigits(
                            category.productCount,
                          )}
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-xs text-neutral-500">
                          ایجاد شده
                        </span>

                        <div className="mt-1 text-xs text-neutral-400">
                          {formatDate(
                            category.createdAt,
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(
                            category,
                          )
                        }
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                      >
                        <Edit3 className="h-4 w-4" />

                        ویرایش
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteCategory(
                            category,
                          )
                        }
                        disabled={
                          deletingId ===
                            category.id ||
                          category.productCount >
                            0
                        }
                        title={
                          category.productCount >
                          0
                            ? "این دسته دارای محصول است."
                            : "حذف دسته‌بندی"
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId ===
                        category.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">
                  {editingCategory
                    ? "ویرایش دسته‌بندی"
                    : "افزودن دسته‌بندی جدید"}
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  اطلاعات دسته‌بندی را وارد کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    نام دسته‌بندی
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <input
                    value={form.name}
                    onChange={(event) =>
                      handleNameChange(
                        event.target.value,
                      )
                    }
                    placeholder="مثلاً لوازم ترمز"
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    Slug
                  </label>

                  <input
                    value={form.slug}
                    onChange={(event) =>
                      updateField(
                        "slug",
                        event.target.value,
                      )
                    }
                    placeholder="مثلاً brake-parts"
                    dir="ltr"
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
                  />

                  <p className="mt-2 text-xs text-neutral-600">
                    اگر خالی باشد، از نام دسته‌بندی ساخته می‌شود.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    توضیحات
                  </label>

                  <textarea
                    value={
                      form.description
                    }
                    onChange={(event) =>
                      updateField(
                        "description",
                        event.target.value,
                      )
                    }
                    rows={5}
                    placeholder="توضیحات دسته‌بندی..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={saveCategory}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}

                {editingCategory
                  ? "ذخیره تغییرات"
                  : "ایجاد دسته‌بندی"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}