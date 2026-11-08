import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Image as ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent } from "react";

type Availability =
  | "in-stock"
  | "low-stock"
  | "out-of-stock";

type ProductImage = {
  id: number;
  image: string;
  sortOrder: number;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  brand: string;
  categoryId: number;
  categoryName: string | null;
  price: number;
  oldPrice: number | null;
  stock: number;
  availability: Availability;
  image: string | null;
  images: ProductImage[];
  rating: number;
  reviews: number;
  popularity: number;
  keywords: string[] | null;
  badge: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProductsResponse = {
  products: Product[];
  message?: string;
};

type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
};

type CategoriesResponse = {
  success: boolean;
  categories?: Category[];
  count?: number;
  message?: string;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  brand: string;
  categoryId: string;
  price: string;
  oldPrice: string;
  stock: string;
  availability: Availability;
  image: string;
  rating: string;
  reviews: string;
  popularity: string;
  keywords: string;
  badge: string;
};

type UploadResponse = {
  success: boolean;
  image?: string;
  fileName?: string;
  productId?: number;
  imageId?: number;
  sortOrder?: number;
  isPrimary?: boolean;
  message?: string;
};

type ProductApiResponse = {
  success: boolean;
  product?: {
    id: number;
    name?: string;
    slug?: string;
    image?: string | null;
    updatedAt?: string;
  };
  message?: string;
};

type ImageManagementResponse = {
  success: boolean;
  primaryImage?: string | null;
  images?: ProductImage[];
  deletedImage?: ProductImage;
  message?: string;
};

type PendingImage = {
  id: string;
  file: File;
  preview: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  categoryId: "",
  price: "",
  oldPrice: "",
  stock: "0",
  availability: "in-stock",
  image: "",
  rating: "0",
  reviews: "0",
  popularity: "0",
  keywords: "",
  badge: "",
};

const AVAILABILITY_OPTIONS: {
  value: Availability;
  label: string;
}[] = [
  {
    value: "in-stock",
    label: "موجود در انبار",
  },
  {
    value: "low-stock",
    label: "موجودی محدود",
  },
  {
    value: "out-of-stock",
    label: "ناموجود",
  },
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_WEBP_DIMENSION = 1920;
const WEBP_QUALITY = 0.84;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const Route = createFileRoute(
  "/admin/products",
)({
  component: AdminProductsPage,
});

function toPersianDigits(
  value: string | number,
) {
  const digits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value).replace(
    /\d/g,
    (digit) =>
      digits[Number(digit)] ?? digit,
  );
}

function normalizeDigits(value: string) {
  return value
    .replace(
      /[۰-۹]/g,
      (digit) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(digit),
        ),
    )
    .replace(
      /[٠-٩]/g,
      (digit) =>
        String(
          "٠١٢٣٤٥٦٧٨٩".indexOf(digit),
        ),
    );
}

function formatPrice(value: number) {
  return `${toPersianDigits(
    value.toLocaleString("en-US"),
  )} تومان`;
}

function getAvailabilityLabel(
  availability: Availability,
) {
  return (
    AVAILABILITY_OPTIONS.find(
      (item) =>
        item.value === availability,
    )?.label ?? availability
  );
}

function getAvailabilityClass(
  availability: Availability,
) {
  switch (availability) {
    case "in-stock":
      return "border-green-500/20 bg-green-500/10 text-green-300";

    case "low-stock":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";

    case "out-of-stock":
      return "border-red-500/20 bg-red-500/10 text-red-300";

    default:
      return "border-white/10 bg-white/5 text-neutral-300";
  }
}

function getImageUrl(
  image: string | null | undefined,
) {
  if (!image) {
    return "";
  }

  const normalized = image.trim();

  if (!normalized) {
    return "";
  }

  if (
    normalized.startsWith("/") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  return `/products/${normalized}`;
}

/*
 * =========================================================
 * Convert Image To WebP
 * =========================================================
 */

async function convertImageToWebP(
  file: File,
): Promise<File> {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type,
    )
  ) {
    throw new Error(
      `فرمت فایل «${file.name}» معتبر نیست. فقط JPG، JPEG، PNG یا WEBP مجاز است.`,
    );
  }

  if (file.size <= 0) {
    throw new Error(
      `فایل «${file.name}» خالی است.`,
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error(
      `حجم فایل «${file.name}» بیشتر از ۵ مگابایت است.`,
    );
  }

  const objectUrl =
    URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>(
      (resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          resolve(img);
        };

        img.onerror = () => {
          reject(
            new Error(
              `خواندن تصویر «${file.name}» امکان‌پذیر نیست.`,
            ),
          );
        };

        img.src = objectUrl;
      },
    );

    const originalWidth =
      image.naturalWidth;

    const originalHeight =
      image.naturalHeight;

    if (
      originalWidth <= 0 ||
      originalHeight <= 0
    ) {
      throw new Error(
        `ابعاد تصویر «${file.name}» معتبر نیست.`,
      );
    }

    const maxDimension = Math.max(
      originalWidth,
      originalHeight,
    );

    const scale =
      maxDimension >
      MAX_WEBP_DIMENSION
        ? MAX_WEBP_DIMENSION /
          maxDimension
        : 1;

    const width = Math.max(
      1,
      Math.round(
        originalWidth * scale,
      ),
    );

    const height = Math.max(
      1,
      Math.round(
        originalHeight * scale,
      ),
    );

    const canvas =
      document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "امکان پردازش تصویر در مرورگر وجود ندارد.",
      );
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality =
      "high";

    context.drawImage(
      image,
      0,
      0,
      width,
      height,
    );

    const blob =
      await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            resolve,
            "image/webp",
            WEBP_QUALITY,
          );
        },
      );

    if (!blob) {
      throw new Error(
        `تبدیل تصویر «${file.name}» به WebP ناموفق بود.`,
      );
    }

    if (blob.size <= 0) {
      throw new Error(
        `فایل WebP تولیدشده برای «${file.name}» خالی است.`,
      );
    }

    if (blob.size > MAX_IMAGE_SIZE) {
      throw new Error(
        `حجم تصویر تبدیل‌شده «${file.name}» هنوز بیشتر از ۵ مگابایت است.`,
      );
    }

    const originalName =
      file.name.replace(
        /\.[^/.]+$/,
        "",
      );

    return new File(
      [blob],
      `${originalName}.webp`,
      {
        type: "image/webp",
        lastModified:
          Date.now(),
      },
    );
  } finally {
    URL.revokeObjectURL(
      objectUrl,
    );
  }
}

function productToForm(
  product: Product,
): ProductForm {
  return {
    name: product.name,
    slug: product.slug,
    description:
      product.description ?? "",
    brand: product.brand,
    categoryId: String(
      product.categoryId,
    ),
    price: String(product.price),
    oldPrice:
      product.oldPrice === null
        ? ""
        : String(product.oldPrice),
    stock: String(product.stock),
    availability: product.availability,
    image: product.image ?? "",
    rating: String(product.rating),
    reviews: String(product.reviews),
    popularity: String(product.popularity),
    keywords:
      product.keywords?.join(", ") ?? "",
    badge: product.badge ?? "",
  };
}

function AdminProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [categoriesLoading, setCategoriesLoading] =
    useState(true);

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

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [form, setForm] =
    useState<ProductForm>(EMPTY_FORM);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [pendingImages, setPendingImages] =
    useState<PendingImage[]>([]);

  const pendingImagesRef =
    useRef<PendingImage[]>([]);

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    pendingImagesRef.current =
      pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      for (const item of
        pendingImagesRef.current) {
        URL.revokeObjectURL(
          item.preview,
        );
      }
    };
  }, []);

  /*
   * =========================================================
   * Load Products
   * =========================================================
   */

  const loadProducts = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/admin/products",
        );

        let data: ProductsResponse;

        try {
          data =
            (await response.json()) as ProductsResponse;
        } catch {
          throw new Error(
            "پاسخ نامعتبر از سرور دریافت شد.",
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ??
              "دریافت محصولات ناموفق بود.",
          );
        }

        setProducts(
          Array.isArray(data.products)
            ? data.products
            : [],
        );
      } catch (err) {
        console.error(
          "ADMIN PRODUCTS ERROR:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "خطا در دریافت محصولات.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  /*
   * =========================================================
   * Load Categories independently from products
   * =========================================================
   */

  const loadCategories = useCallback(
    async () => {
      try {
        setCategoriesLoading(true);

        const response = await fetch(
          "/api/admin/categories",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            credentials: "same-origin",
          },
        );

        let data: CategoriesResponse;

        try {
          data = (await response.json()) as CategoriesResponse;
        } catch {
          throw new Error(
            "پاسخ دسته‌بندی‌ها از سرور معتبر نیست.",
          );
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ??
              (response.status === 401 || response.status === 403
                ? "برای دریافت دسته‌بندی‌ها باید با حساب مدیر وارد شوید."
                : "دریافت دسته‌بندی‌ها ناموفق بود."),
          );
        }

        const validCategories = Array.isArray(data.categories)
          ? data.categories.filter(
              (category) =>
                Number.isInteger(Number(category.id)) &&
                Number(category.id) > 0 &&
                typeof category.name === "string" &&
                category.name.trim().length > 0,
            )
          : [];

        setCategories(
          validCategories
            .map((category) => ({
              ...category,
              id: Number(category.id),
              productCount: Number(category.productCount ?? 0),
            }))
            .sort((a, b) =>
              a.name.localeCompare(b.name, "fa"),
            ),
        );
      } catch (err) {
        console.error("ADMIN CATEGORIES ERROR:", err);
        setCategories([]);
        setError(
          err instanceof Error
            ? err.message
            : "خطا در دریافت دسته‌بندی‌ها.",
        );
      } finally {
        setCategoriesLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  /*
   * =========================================================
   * Search
   * =========================================================
   */

  const filteredProducts = useMemo(() => {
    const normalizedSearch =
      normalizeDigits(
        search.trim().toLowerCase(),
      );

    if (!normalizedSearch) {
      return products;
    }

    return products.filter(
      (product) => {
        const text =
          `${product.name} ${product.brand} ${
            product.categoryName ?? ""
          } ${product.slug}`.toLowerCase();

        return text.includes(
          normalizedSearch,
        );
      },
    );
  }, [products, search]);

  /*
   * =========================================================
   * Pending Image Helpers
   * =========================================================
   */

  function clearPendingImages() {
    setPendingImages((current) => {
      for (const item of current) {
        URL.revokeObjectURL(
          item.preview,
        );
      }

      return [];
    });
  }

  async function addPendingImages(
    files: File[],
  ) {
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const convertedImages: PendingImage[] =
        [];

      for (
        let index = 0;
        index < files.length;
        index += 1
      ) {
        const file = files[index];

        if (!file) {
          continue;
        }

        setSuccessMessage(
          `در حال تبدیل تصویر ${toPersianDigits(
            index + 1,
          )} از ${toPersianDigits(
            files.length,
          )} به WebP...`,
        );

        try {
          const webpFile =
            await convertImageToWebP(
              file,
            );

          const preview =
            URL.createObjectURL(
              webpFile,
            );

          convertedImages.push({
            id: `${Date.now()}-${index}-${Math.random()
              .toString(36)
              .slice(2)}`,
            file: webpFile,
            preview,
          });
        } catch (err) {
          console.error(
            "IMAGE CONVERSION ERROR:",
            err,
          );

          setError(
            err instanceof Error
              ? err.message
              : `تبدیل تصویر «${file.name}» ناموفق بود.`,
          );
        }
      }

      if (
        convertedImages.length > 0
      ) {
        setPendingImages(
          (current) => [
            ...current,
            ...convertedImages,
          ],
        );

        setSuccessMessage(
          `${toPersianDigits(
            convertedImages.length,
          )} تصویر با موفقیت به WebP تبدیل شد و آماده آپلود است.`,
        );
      } else {
        setSuccessMessage("");
      }
    } finally {
      setUploading(false);
    }
  }

  function removePendingImage(
    imageId: string,
  ) {
    setPendingImages((current) => {
      const image = current.find(
        (item) =>
          item.id === imageId,
      );

      if (image) {
        URL.revokeObjectURL(
          image.preview,
        );
      }

      return current.filter(
        (item) =>
          item.id !== imageId,
      );
    });
  }

  /*
   * =========================================================
   * Open Create
   * =========================================================
   */

  function openCreateModal() {
    clearPendingImages();

    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
      categoryId:
        categories.length > 0
          ? String(categories[0]?.id ?? "")
          : "",
    });

    setError("");
    setSuccessMessage("");
    setModalOpen(true);
  }

  /*
   * =========================================================
   * Open Edit
   * =========================================================
   */

  function openEditModal(
    product: Product,
  ) {
    const numericId = Number(
      product.id,
    );

    if (
      !Number.isInteger(numericId) ||
      numericId <= 0
    ) {
      setError(
        "شناسه محصول معتبر نیست.",
      );

      return;
    }

    clearPendingImages();

    setEditingProduct({
      ...product,
      id: numericId,
      images: Array.isArray(
        product.images,
      )
        ? [...product.images].sort(
            (a, b) =>
              a.sortOrder -
              b.sortOrder,
          )
        : [],
    });

    setForm(
      productToForm(product),
    );

    setError("");
    setSuccessMessage("");
    setModalOpen(true);
  }

  /*
   * =========================================================
   * Close Modal
   * =========================================================
   */

  function closeModal() {
    if (saving || uploading) {
      return;
    }

    clearPendingImages();

    setModalOpen(false);
    setEditingProduct(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");
  }

  /*
   * =========================================================
   * Update Form
   * =========================================================
   */

  function updateField(
    field: keyof ProductForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /*
   * =========================================================
   * Image Input
   * =========================================================
   */

  function handleImageChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    void addPendingImages(files);
  }

  /*
   * =========================================================
   * Upload One Image
   * =========================================================
   */

  async function uploadImage(
    productId: number,
    file: File,
  ): Promise<UploadResponse> {
    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      throw new Error(
        "شناسه محصول معتبر نیست.",
      );
    }

    if (
      file.type !== "image/webp"
    ) {
      throw new Error(
        `تصویر «${file.name}» باید WebP باشد.`,
      );
    }

    if (file.size <= 0) {
      throw new Error(
        `فایل «${file.name}» خالی است.`,
      );
    }

    if (
      file.size > MAX_IMAGE_SIZE
    ) {
      throw new Error(
        `حجم تصویر «${file.name}» نباید بیشتر از ۵ مگابایت باشد.`,
      );
    }

    const formData = new FormData();

    formData.append(
      "productId",
      String(productId),
    );

    formData.append(
      "file",
      file,
    );

    const response = await fetch(
      "/api/admin/uploads/products",
      {
        method: "POST",
        body: formData,
      },
    );

    let data: UploadResponse;

    try {
      data =
        (await response.json()) as UploadResponse;
    } catch {
      throw new Error(
        "پاسخ نامعتبر از سرور دریافت شد.",
      );
    }

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ??
          `آپلود تصویر «${file.name}» ناموفق بود.`,
      );
    }

    return data;
  }

  /*
   * =========================================================
   * Upload All Pending Images
   * =========================================================
   */

  async function uploadPendingImages(
    productId: number,
  ) {
    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      throw new Error(
        "شناسه محصول معتبر نیست.",
      );
    }

    if (
      pendingImages.length === 0
    ) {
      return;
    }

    setUploading(true);

    try {
      const total =
        pendingImages.length;

      for (
        let index = 0;
        index < total;
        index += 1
      ) {
        const item =
          pendingImages[index];

        if (!item) {
          continue;
        }

        setSuccessMessage(
          `در حال آپلود تصویر ${toPersianDigits(
            index + 1,
          )} از ${toPersianDigits(
            total,
          )}...`,
        );

        await uploadImage(
          productId,
          item.file,
        );
      }
    } finally {
      setUploading(false);
    }
  }

  /*
   * =========================================================
   * Image Management API
   * =========================================================
   */

  async function setImageAsPrimary(
    productId: number,
    imageId: number,
  ) {
    if (
      saving ||
      uploading
    ) {
      return;
    }

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(imageId) ||
      imageId <= 0
    ) {
      setError(
        "شناسه محصول یا تصویر معتبر نیست.",
      );

      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/admin/products/images",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "set-primary",
            productId,
            imageId,
          }),
        },
      );

      const data =
        (await response.json()) as ImageManagementResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "تغییر تصویر اصلی انجام نشد.",
        );
      }

      const images =
        Array.isArray(data.images)
          ? data.images
          : [];

      const primaryImage =
        data.primaryImage ?? "";

      if (
        editingProduct?.id ===
        productId
      ) {
        setEditingProduct({
          ...editingProduct,
          image: primaryImage,
          images,
        });
      }

      updateField(
        "image",
        primaryImage,
      );

      setProducts((current) =>
        current.map(
          (product) =>
            Number(product.id) ===
            productId
              ? {
                  ...product,
                  image:
                    primaryImage,
                  images,
                }
              : product,
        ),
      );

      setSuccessMessage(
        "تصویر اصلی با موفقیت تغییر کرد.",
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "setImageAsPrimary error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "تغییر تصویر اصلی انجام نشد.",
      );
    } finally {
      setUploading(false);
    }
  }

  /*
   * =========================================================
   * Delete Product Image
   * =========================================================
   */

  async function deleteProductImage(
    productId: number,
    imageId: number,
  ) {
    if (
      saving ||
      uploading
    ) {
      return;
    }

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(imageId) ||
      imageId <= 0
    ) {
      setError(
        "این تصویر قابل حذف نیست.",
      );

      return;
    }

    const confirmed =
      window.confirm(
        "آیا از حذف این تصویر مطمئن هستید؟ این عملیات قابل بازگشت نیست.",
      );

    if (!confirmed) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/admin/products/images",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId,
            imageId,
          }),
        },
      );

      const data =
        (await response.json()) as ImageManagementResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "حذف تصویر انجام نشد.",
        );
      }

      const images =
        Array.isArray(data.images)
          ? data.images
          : [];

      const primaryImage =
        data.primaryImage ?? "";

      updateField(
        "image",
        primaryImage,
      );

      if (
        editingProduct?.id ===
        productId
      ) {
        setEditingProduct({
          ...editingProduct,
          image: primaryImage,
          images,
        });
      }

      setProducts((current) =>
        current.map(
          (product) =>
            Number(product.id) ===
            productId
              ? {
                  ...product,
                  image:
                    primaryImage,
                  images,
                }
              : product,
        ),
      );

      setSuccessMessage(
        "تصویر با موفقیت حذف شد.",
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "deleteProductImage error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "حذف تصویر انجام نشد.",
      );
    } finally {
      setUploading(false);
    }
  }

  /*
   * =========================================================
   * Reorder Product Images
   * =========================================================
   */

  async function reorderProductImages(
    productId: number,
    imageIds: number[],
  ) {
    if (
      saving ||
      uploading
    ) {
      return;
    }

    if (
      !Number.isInteger(productId) ||
      productId <= 0
    ) {
      setError(
        "شناسه محصول معتبر نیست.",
      );

      return;
    }

    if (imageIds.length === 0) {
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccessMessage("");

      const response = await fetch(
        "/api/admin/products/images",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "reorder",
            productId,
            imageIds,
          }),
        },
      );

      const data =
        (await response.json()) as ImageManagementResponse;

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "تغییر ترتیب تصاویر انجام نشد.",
        );
      }

      const images =
        Array.isArray(data.images)
          ? data.images
          : [];

      const primaryImage =
        data.primaryImage ?? "";

      updateField(
        "image",
        primaryImage,
      );

      if (
        editingProduct?.id ===
        productId
      ) {
        setEditingProduct({
          ...editingProduct,
          image: primaryImage,
          images,
        });
      }

      setProducts((current) =>
        current.map(
          (product) =>
            Number(product.id) ===
            productId
              ? {
                  ...product,
                  image:
                    primaryImage,
                  images,
                }
              : product,
        ),
      );

      setSuccessMessage(
        "ترتیب تصاویر با موفقیت ذخیره شد.",
      );

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "reorderProductImages error:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "تغییر ترتیب تصاویر انجام نشد.",
      );
    } finally {
      setUploading(false);
    }
  }

  /*
   * =========================================================
   * Move Product Image
   * =========================================================
   */

  async function moveProductImage(
    productId: number,
    imageIndex: number,
    direction: "up" | "down",
  ) {
    if (
      !editingProduct ||
      editingProduct.id !== productId ||
      saving ||
      uploading
    ) {
      return;
    }

    const originalImages = [
      ...editingProduct.images,
    ];

    const images = [
      ...editingProduct.images,
    ];

    const targetIndex =
      direction === "up"
        ? imageIndex - 1
        : imageIndex + 1;

    if (
      imageIndex < 0 ||
      imageIndex >= images.length ||
      targetIndex < 0 ||
      targetIndex >= images.length
    ) {
      return;
    }

    const current =
      images[imageIndex];

    const target =
      images[targetIndex];

    if (!current || !target) {
      return;
    }

    if (
      current.id === 0 ||
      target.id === 0
    ) {
      return;
    }

    [
      images[imageIndex],
      images[targetIndex],
    ] = [
      target,
      current,
    ];

    setEditingProduct({
      ...editingProduct,
      images,
    });

    try {
      await reorderProductImages(
        productId,
        images.map(
          (image) => image.id,
        ),
      );
    } catch {
      setEditingProduct({
        ...editingProduct,
        images: originalImages,
      });
    }
  }

  /*
   * =========================================================
   * Save Product
   * =========================================================
   */

  async function saveProduct() {
    if (
      saving ||
      uploading
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const normalizedName =
        form.name.trim();

      const normalizedSlug =
        form.slug.trim();

      const normalizedBrand =
        form.brand.trim();

      const normalizedCategoryId =
        normalizeDigits(
          form.categoryId.trim(),
        );

      const normalizedPrice =
        normalizeDigits(
          form.price.trim(),
        );

      const normalizedOldPrice =
        normalizeDigits(
          form.oldPrice.trim(),
        );

      const normalizedStock =
        normalizeDigits(
          form.stock.trim(),
        );

      const normalizedRating =
        normalizeDigits(
          form.rating.trim(),
        );

      const normalizedReviews =
        normalizeDigits(
          form.reviews.trim(),
        );

      const normalizedPopularity =
        normalizeDigits(
          form.popularity.trim(),
        );

      const categoryId = Number(
        normalizedCategoryId,
      );

      const price = Number(
        normalizedPrice,
      );

      const oldPrice =
        form.oldPrice.trim() === ""
          ? null
          : Number(
              normalizedOldPrice,
            );

      const stock = Number(
        normalizedStock,
      );

      const rating = Number(
        normalizedRating,
      );

      const reviews = Number(
        normalizedReviews,
      );

      const popularity = Number(
        normalizedPopularity,
      );

      const payload = {
        name: normalizedName,
        slug: normalizedSlug,
        description:
          form.description.trim() ||
          null,
        brand: normalizedBrand,
        categoryId,
        price,
        oldPrice,
        stock,
        availability:
          form.availability,
        image:
          form.image.trim() || null,
        rating,
        reviews,
        popularity,
        keywords:
          form.keywords
            .split(",")
            .map((item) =>
              item.trim(),
            )
            .filter(Boolean),
        badge:
          form.badge.trim() || null,
      };

      /*
       * Validation
       */

      if (!payload.name) {
        throw new Error(
          "نام محصول الزامی است.",
        );
      }

      if (
        payload.name.length > 200
      ) {
        throw new Error(
          "نام محصول نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد.",
        );
      }

      if (!payload.brand) {
        throw new Error(
          "برند محصول الزامی است.",
        );
      }

      if (
        !Number.isInteger(
          payload.categoryId,
        ) ||
        payload.categoryId <= 0
      ) {
        throw new Error(
          "لطفاً دسته‌بندی محصول را انتخاب کنید.",
        );
      }

      if (
        !Number.isFinite(
          payload.price,
        ) ||
        payload.price < 0
      ) {
        throw new Error(
          "قیمت محصول معتبر نیست.",
        );
      }

      if (
        payload.oldPrice !== null &&
        (!Number.isFinite(
          payload.oldPrice,
        ) ||
          payload.oldPrice < 0)
      ) {
        throw new Error(
          "قیمت قبلی معتبر نیست.",
        );
      }

      if (
        !Number.isFinite(
          payload.stock,
        ) ||
        !Number.isInteger(
          payload.stock,
        ) ||
        payload.stock < 0
      ) {
        throw new Error(
          "موجودی محصول معتبر نیست.",
        );
      }

      if (
        !Number.isFinite(
          payload.rating,
        ) ||
        payload.rating < 0 ||
        payload.rating > 5
      ) {
        throw new Error(
          "امتیاز محصول باید بین ۰ تا ۵ باشد.",
        );
      }

      if (
        !Number.isFinite(
          payload.reviews,
        ) ||
        !Number.isInteger(
          payload.reviews,
        ) ||
        payload.reviews < 0
      ) {
        throw new Error(
          "تعداد نظرات معتبر نیست.",
        );
      }

      if (
        !Number.isFinite(
          payload.popularity,
        ) ||
        !Number.isInteger(
          payload.popularity,
        ) ||
        payload.popularity < 0
      ) {
        throw new Error(
          "مقدار محبوبیت معتبر نیست.",
        );
      }

      if (
        payload.availability ===
          "out-of-stock" &&
        payload.stock !== 0
      ) {
        throw new Error(
          "برای محصول ناموجود، موجودی باید صفر باشد.",
        );
      }

      /*
       * Determine Editing
       */

      const isEditing =
        editingProduct !== null;

      let productId: number | null =
        null;

      if (isEditing) {
        productId = Number(
          editingProduct.id,
        );

        if (
          !Number.isInteger(
            productId,
          ) ||
          productId <= 0
        ) {
          throw new Error(
            "شناسه محصول معتبر نیست.",
          );
        }
      }

/*
 * Product Request
 */

const response = await fetch(
  isEditing
    ? `/api/admin/products?productId=${encodeURIComponent(
        String(productId),
      )}`
    : "/api/admin/products",
  {
    method: isEditing
      ? "PATCH"
      : "POST",
    headers: {
      "Content-Type":
        "application/json",
    },
    body: JSON.stringify(payload),
  },
);

      let data: ProductApiResponse;

      try {
        data =
          (await response.json()) as ProductApiResponse;
      } catch {
        throw new Error(
          "پاسخ نامعتبر از سرور دریافت شد.",
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ??
            "ذخیره محصول ناموفق بود.",
        );
      }

      /*
       * دریافت Product ID
       */

      let savedProductId: number;

      if (isEditing) {
        if (
          productId === null ||
          !Number.isInteger(productId) ||
          productId <= 0
        ) {
          throw new Error(
            "شناسه محصول معتبر نیست.",
          );
        }

        savedProductId = productId;
      } else {
        const createdProductId =
          Number(data.product?.id);

        if (
          !Number.isInteger(
            createdProductId,
          ) ||
          createdProductId <= 0
        ) {
          throw new Error(
            "محصول ذخیره شد اما شناسه محصول از سرور دریافت نشد.",
          );
        }

        savedProductId =
          createdProductId;
      }

      /*
       * Upload WebP Images
       */

      if (
        pendingImages.length > 0
      ) {
        await uploadPendingImages(
          savedProductId,
        );
      }

      /*
       * Reload
       */

      await loadProducts();

      /*
       * Success
       */

      setSuccessMessage(
        pendingImages.length > 0
          ? isEditing
            ? "محصول و تصاویر با موفقیت ویرایش شدند."
            : "محصول و تصاویر با موفقیت ایجاد شدند."
          : isEditing
            ? "محصول با موفقیت ویرایش شد."
            : "محصول با موفقیت ایجاد شد.",
      );

      clearPendingImages();

      setModalOpen(false);
      setEditingProduct(null);

      setForm({
        ...EMPTY_FORM,
      });

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 4000);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "ذخیره محصول ناموفق بود.",
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  /*
   * =========================================================
   * Delete Product
   * =========================================================
   */

async function deleteProduct(
  product: Product,
) {
  const productId = Number(
    product.id,
  );

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    setError(
      "شناسه محصول معتبر نیست.",
    );

    return;
  }

  const confirmed =
    window.confirm(
      `آیا از حذف «${product.name}» مطمئن هستید؟`,
    );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingId(productId);
    setError("");
    setSuccessMessage("");

    const response = await fetch(
  `/api/admin/products?productId=${encodeURIComponent(String(productId))}`,
  {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  },
)

    let data: {
      success: boolean;
      message?: string;
    };

    try {
      data =
        (await response.json()) as {
          success: boolean;
          message?: string;
        };
    } catch {
      throw new Error(
        "پاسخ نامعتبر از سرور دریافت شد.",
      );
    }

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ??
          "حذف محصول ناموفق بود.",
      );
    }

    setProducts((current) =>
      current.filter(
        (item) =>
          Number(item.id) !==
          productId,
      ),
    );

    setSuccessMessage(
      "محصول با موفقیت حذف شد.",
    );

    window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  } catch (err) {
    console.error(err);

    setError(
      err instanceof Error
        ? err.message
        : "حذف محصول ناموفق بود.",
    );
  } finally {
    setDeletingId(null);
  }
}

  /*
   * =========================================================
   * Render
   * =========================================================
   */

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
                <Package className="h-6 w-6" />
              </div>

              <h1 className="text-2xl font-bold md:text-3xl">
                مدیریت محصولات
              </h1>
            </div>

            <p className="text-sm text-neutral-400">
              ایجاد، ویرایش و مدیریت محصولات
              فروشگاه
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
              <span className="text-xs text-neutral-500">
                تعداد محصولات
              </span>

              <div className="mt-1 text-xl font-bold">
                {toPersianDigits(
                  products.length,
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                void loadProducts();
              }}
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

              افزودن محصول
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
              placeholder="جستجوی نام، برند، دسته‌بندی یا slug..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-neutral-600"
            />
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-neutral-500" />

            <p className="text-neutral-400">
              در حال دریافت محصولات...
            </p>
          </div>
        )}

        {!loading &&
          filteredProducts.length ===
            0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
              <Package className="mx-auto mb-4 h-12 w-12 text-neutral-600" />

              <h2 className="text-lg font-bold">
                محصولی پیدا نشد
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                محصولی مطابق جستجوی شما
                وجود ندارد.
              </p>
            </div>
          )}

        {!loading &&
          filteredProducts.length >
            0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map(
                (product) => {
                  const imageUrl =
                    getImageUrl(
                      product.image,
                    );

                  const imageCount =
                    product.images
                      ?.length ?? 0;

                  return (
                    <article
                      key={product.id}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-900">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={
                              product.name
                            }
                            className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-neutral-700" />
                          </div>
                        )}

                        {product.badge && (
                          <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-neutral-950">
                            {
                              product.badge
                            }
                          </span>
                        )}

                        {imageCount > 0 && (
                          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white backdrop-blur">
                            <ImageIcon className="h-3.5 w-3.5" />

                            {toPersianDigits(
                              imageCount,
                            )}{" "}
                            تصویر
                          </span>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-bold leading-7">
                              {
                                product.name
                              }
                            </h2>

                            <p className="mt-1 text-xs text-neutral-500">
                              {
                                product.brand
                              }
                            </p>
                          </div>

                          <span className="shrink-0 rounded-lg bg-white/5 px-2 py-1 font-mono text-[10px] text-neutral-500">
                            #
                            {toPersianDigits(
                              product.id,
                            )}
                          </span>
                        </div>

                        <div className="mb-4 text-xs text-neutral-500">
                          {product.categoryName ??
                            "بدون دسته‌بندی"}
                        </div>

                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold">
                              {formatPrice(
                                product.price,
                              )}
                            </div>

                            {product.oldPrice !==
                              null && (
                              <div className="mt-1 text-xs text-neutral-600 line-through">
                                {formatPrice(
                                  product.oldPrice,
                                )}
                              </div>
                            )}
                          </div>

                          <div className="text-left">
                            <div className="text-xs text-neutral-500">
                              موجودی
                            </div>

                            <div className="mt-1 font-bold">
                              {toPersianDigits(
                                product.stock,
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-5 flex items-center justify-between">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getAvailabilityClass(
                              product.availability,
                            )}`}
                          >
                            {getAvailabilityLabel(
                              product.availability,
                            )}
                          </span>

                          <span className="text-xs text-neutral-500">
                            امتیاز{" "}
                            {toPersianDigits(
                              product.rating,
                            )}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                product,
                              )
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                          >
                            <Edit3 className="h-4 w-4" />

                            ویرایش
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void deleteProduct(
                                product,
                              );
                            }}
                            disabled={
                              deletingId ===
                              Number(
                                product.id,
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId ===
                            Number(
                              product.id,
                            ) ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-5xl rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold">
                  {editingProduct !== null
                    ? "ویرایش محصول"
                    : "افزودن محصول جدید"}
                </h2>

                <p className="mt-1 text-xs text-neutral-500">
                  اطلاعات محصول را وارد
                  کنید.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={
                  saving ||
                  uploading
                }
                className="rounded-lg p-2 text-neutral-500 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {error && (
                <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                  {successMessage}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="نام محصول"
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value,
                    )
                  }
                  placeholder="مثلاً لنت ترمز جلو"
                  required
                />

                <Field
                  label="برند"
                  value={form.brand}
                  onChange={(value) =>
                    updateField(
                      "brand",
                      value,
                    )
                  }
                  placeholder="مثلاً برمبو"
                  required
                />

                <Field
                  label="Slug"
                  value={form.slug}
                  onChange={(value) =>
                    updateField(
                      "slug",
                      value,
                    )
                  }
                  placeholder="اگر خالی باشد از نام ساخته می‌شود"
                />

                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    دسته‌بندی
                  </label>

                  <select
                    value={
                      form.categoryId
                    }
                    onChange={(event) =>
                      updateField(
                        "categoryId",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                  >
                    <option value="">
                      انتخاب دسته‌بندی
                    </option>

                    {categories.map((category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>

                  {categoriesLoading ? (
                    <p className="mt-2 text-xs text-neutral-400">
                      در حال دریافت دسته‌بندی‌ها...
                    </p>
                  ) : categories.length === 0 ? (
                    <p className="mt-2 text-xs text-yellow-500">
                      دسته‌بندی‌ای دریافت نشد. ابتدا اتصال سرور و وجود دسته‌بندی‌ها را بررسی کنید.
                    </p>
                  ) : null}
                </div>

                <Field
                  label="قیمت"
                  value={form.price}
                  onChange={(value) =>
                    updateField(
                      "price",
                      value,
                    )
                  }
                  placeholder="مثلاً 480000"
                  inputMode="numeric"
                  required
                />

                <Field
                  label="قیمت قبلی"
                  value={form.oldPrice}
                  onChange={(value) =>
                    updateField(
                      "oldPrice",
                      value,
                    )
                  }
                  placeholder="اختیاری"
                  inputMode="numeric"
                />

                <Field
                  label="موجودی"
                  value={form.stock}
                  onChange={(value) =>
                    updateField(
                      "stock",
                      value,
                    )
                  }
                  inputMode="numeric"
                />

                <div>
                  <label className="mb-2 block text-sm text-neutral-400">
                    وضعیت موجودی
                  </label>

                  <select
                    value={
                      form.availability
                    }
                    onChange={(event) =>
                      updateField(
                        "availability",
                        event.target
                          .value as Availability,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
                  >
                    {AVAILABILITY_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                {/* Images */}

                <div className="md:col-span-2">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm text-neutral-400">
                      تصاویر محصول
                    </label>

                    <span className="text-xs text-neutral-600">
                      امکان انتخاب چند تصویر
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-neutral-900 p-4">
                    {editingProduct !==
                      null &&
                      editingProduct.images.length >
                        0 && (
                        <div className="mb-5">
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-neutral-300">
                              تصاویر فعلی
                            </h3>

                            <span className="text-xs text-neutral-600">
                              {toPersianDigits(
                                editingProduct
                                  .images
                                  .length,
                              )}{" "}
                              تصویر
                            </span>
                          </div>

                          <p className="mb-4 text-xs leading-6 text-neutral-600">
                            تصویر اول به‌عنوان تصویر
                            اصلی محصول استفاده می‌شود.
                            با دکمه‌های بالا و پایین
                            می‌توانید ترتیب تصاویر را
                            تغییر دهید.
                          </p>

                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {editingProduct.images.map(
                              (
                                image,
                                imageIndex,
                              ) => {
                                const imageUrl =
                                  getImageUrl(
                                    image.image,
                                  );

                                const isPrimary =
                                  form.image.trim() ===
                                  image.image;

                                const isLegacy =
                                  image.id ===
                                  0;

                                return (
                                  <div
                                    key={`${image.id}-${image.sortOrder}`}
                                    className={`group relative overflow-hidden rounded-xl border ${
                                      isPrimary
                                        ? "border-white/40 ring-1 ring-white/20"
                                        : "border-white/10"
                                    } bg-neutral-950`}
                                  >
                                    <div className="relative aspect-square">
                                      {imageUrl ? (
                                        <img
                                          src={
                                            imageUrl
                                          }
                                          alt="تصویر محصول"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full items-center justify-center">
                                          <ImageIcon className="h-8 w-8 text-neutral-700" />
                                        </div>
                                      )}

                                      <div className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-black/75 px-2 text-[10px] text-white backdrop-blur">
                                        {toPersianDigits(
                                          imageIndex +
                                            1,
                                        )}
                                      </div>

                                      {isPrimary && (
                                        <div className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-neutral-950">
                                          تصویر اصلی
                                        </div>
                                      )}
                                    </div>

                                    <div className="border-t border-white/10 bg-black/40 p-2">
                                      <div className="mb-2 grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            void moveProductImage(
                                              editingProduct.id,
                                              imageIndex,
                                              "up",
                                            )
                                          }
                                          disabled={
                                            saving ||
                                            uploading ||
                                            imageIndex ===
                                              0 ||
                                            isLegacy
                                          }
                                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[10px] text-neutral-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                          <ArrowUp className="h-3.5 w-3.5" />
                                          بالا
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            void moveProductImage(
                                              editingProduct.id,
                                              imageIndex,
                                              "down",
                                            )
                                          }
                                          disabled={
                                            saving ||
                                            uploading ||
                                            imageIndex ===
                                              editingProduct
                                                .images
                                                .length -
                                                1 ||
                                            isLegacy
                                          }
                                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[10px] text-neutral-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                          <ArrowDown className="h-3.5 w-3.5" />
                                          پایین
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-[1fr_auto] gap-2">
                                        {!isPrimary ? (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              void setImageAsPrimary(
                                                editingProduct.id,
                                                image.id,
                                              )
                                            }
                                            disabled={
                                              saving ||
                                              uploading ||
                                              isLegacy
                                            }
                                            className="rounded-lg bg-white px-2 py-2 text-[10px] font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-30"
                                          >
                                            انتخاب به‌عنوان
                                            اصلی
                                          </button>
                                        ) : (
                                          <div className="flex items-center justify-center rounded-lg bg-white/5 px-2 py-2 text-[10px] text-neutral-500">
                                            تصویر اصلی
                                          </div>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() =>
                                            void deleteProductImage(
                                              editingProduct.id,
                                              image.id,
                                            )
                                          }
                                          disabled={
                                            saving ||
                                            uploading ||
                                            isLegacy
                                          }
                                          className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {pendingImages.length >
                      0 && (
                      <div className="mb-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-neutral-300">
                            تصاویر جدید
                          </h3>

                          <span className="text-xs text-neutral-600">
                            {toPersianDigits(
                              pendingImages.length,
                            )}{" "}
                            تصویر آماده آپلود
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                          {pendingImages.map(
                            (
                              image,
                              index,
                            ) => (
                              <div
                                key={
                                  image.id
                                }
                                className="group relative overflow-hidden rounded-xl border border-white/10 bg-neutral-950"
                              >
                                <div className="aspect-square">
                                  <img
                                    src={
                                      image.preview
                                    }
                                    alt={`تصویر جدید ${index + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>

                                <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur">
                                  WebP
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removePendingImage(
                                      image.id,
                                    )
                                  }
                                  disabled={
                                    saving ||
                                    uploading
                                  }
                                  className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-lg bg-red-500/90 px-2 py-1.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  حذف
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      disabled={
                        saving ||
                        uploading
                      }
                      className="flex min-h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-8 text-center transition hover:border-white/30 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="mb-4 h-10 w-10 animate-spin text-neutral-500" />

                          <span className="text-sm font-medium">
                            در حال پردازش تصاویر...
                          </span>

                          <span className="mt-2 text-xs text-neutral-600">
                            تصاویر قبل از آپلود به WebP
                            تبدیل می‌شوند
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="mb-4 rounded-2xl bg-white/5 p-4">
                            <Upload className="h-8 w-8 text-neutral-400" />
                          </div>

                          <span className="text-sm font-medium">
                            برای انتخاب تصاویر
                            کلیک کنید
                          </span>

                          <span className="mt-2 text-xs text-neutral-600">
                            امکان انتخاب چند تصویر
                            همزمان
                          </span>

                          <span className="mt-1 text-xs text-neutral-600">
                            JPG، JPEG، PNG یا WEBP
                            — تبدیل خودکار به WebP
                          </span>

                          <span className="mt-1 text-xs text-neutral-600">
                            حداکثر ۵ مگابایت برای هر
                            تصویر
                          </span>
                        </>
                      )}
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={
                        handleImageChange
                      }
                      className="hidden"
                    />

                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-neutral-400">
                          تصویر اصلی فعلی
                        </span>

                        {form.image.trim() && (
                          <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-neutral-300">
                            فعال
                          </span>
                        )}
                      </div>

                      {form.image.trim() ? (
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-neutral-950">
                            <img
                              src={getImageUrl(
                                form.image,
                              )}
                              alt="تصویر اصلی"
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="break-all text-xs text-neutral-500">
                              {
                                form.image
                              }
                            </p>
                          </div>

                          {editingProduct ===
                            null && (
                            <button
                              type="button"
                              onClick={() =>
                                updateField(
                                  "image",
                                  "",
                                )
                              }
                              disabled={
                                saving ||
                                uploading
                              }
                              className="shrink-0 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-600">
                          هنوز تصویر اصلی
                          انتخاب نشده است. اولین
                          تصویر آپلودشده برای
                          محصول جدید به‌صورت خودکار
                          تصویر اصلی می‌شود.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Field
                  label="نشان محصول"
                  value={form.badge}
                  onChange={(value) =>
                    updateField(
                      "badge",
                      value,
                    )
                  }
                  placeholder="مثلاً پرفروش"
                />

                <Field
                  label="امتیاز"
                  value={form.rating}
                  onChange={(value) =>
                    updateField(
                      "rating",
                      value,
                    )
                  }
                  inputMode="decimal"
                />

                <Field
                  label="تعداد نظرات"
                  value={form.reviews}
                  onChange={(value) =>
                    updateField(
                      "reviews",
                      value,
                    )
                  }
                  inputMode="numeric"
                />

                <Field
                  label="محبوبیت"
                  value={form.popularity}
                  onChange={(value) =>
                    updateField(
                      "popularity",
                      value,
                    )
                  }
                  inputMode="numeric"
                />

                <Field
                  label="کلمات کلیدی"
                  value={form.keywords}
                  onChange={(value) =>
                    updateField(
                      "keywords",
                      value,
                    )
                  }
                  placeholder="لنت, ترمز, لنت جلو"
                />

                <div className="md:col-span-2">
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
                        event.target
                          .value,
                      )
                    }
                    rows={5}
                    placeholder="توضیحات محصول..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={
                  saving ||
                  uploading
                }
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={() => {
                  void saveProduct();
                }}
                disabled={
                  saving ||
                  uploading
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {(saving || uploading) && (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                )}

                {uploading
                  ? "در حال پردازش تصاویر..."
                  : saving
                    ? "در حال ذخیره..."
                    : editingProduct !==
                        null
                      ? "ذخیره تغییرات"
                      : "ایجاد محصول"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?:
    | "text"
    | "numeric"
    | "decimal";
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-neutral-400">
        {label}

        {required && (
          <span className="mr-1 text-red-400">
            *
          </span>
        )}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/30"
      />
    </div>
  );
}