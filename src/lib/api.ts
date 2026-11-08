import type { Product } from "@/data/shop";
export type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
};

export type CategoriesResponse = {
  success: boolean;
  categories: ApiCategory[];
  count: number;
};

export async function fetchCategories(): Promise<ApiCategory[]> {
  const response = await fetch("/api/categories");

  if (!response.ok) {
    throw new Error("خطا در دریافت دسته‌بندی‌ها");
  }

  const data: CategoriesResponse = await response.json();

  if (!data.success || !Array.isArray(data.categories)) {
    throw new Error("دریافت دسته‌بندی‌ها ناموفق بود");
  }

  return data.categories;
}
export type ApiProduct = Product & {
  categoryId: number;
  categoryName: string | null;
  slug: string;
  description: string | null;
  stock: number;
  updatedAt: string;
};

export type ProductsResponse = {
  success: boolean;
  products: ApiProduct[];
  count: number;
};

export type ProductResponse = {
  success: boolean;
  product: ApiProduct;
};

export async function fetchProducts(): Promise<ApiProduct[]> {
  const response = await fetch("/api/products");

  if (!response.ok) {
    throw new Error("خطا در دریافت محصولات");
  }

  const data: ProductsResponse = await response.json();

  if (!data.success) {
    throw new Error("دریافت محصولات ناموفق بود");
  }

  return data.products;
}

export async function fetchProduct(
  productId: string,
): Promise<ApiProduct> {
  const response = await fetch(
    `/api/products/${productId}`,
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("محصول پیدا نشد");
    }

    throw new Error("خطا در دریافت محصول");
  }

  const data: ProductResponse = await response.json();

  if (!data.success) {
    throw new Error("دریافت محصول ناموفق بود");
  }

  return data.product;
}
export type CreateOrderItemInput = {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

export type CreateOrderInput = {
  accountId?: string;

  firstName: string;
  lastName: string;

  customerPhone: string;
  customerEmail?: string;

  province: string;
  city: string;
  address: string;
  postalCode: string;

  description?: string;

  subtotal: number;
  shippingCost: number;
  total: number;

  items: CreateOrderItemInput[];
};

export type CreateOrderResponse = {
  success: boolean;
  order?: {
    id: number;
    orderNumber: string;
  };
  message?: string;
};

export async function createOrderApi(
  order: CreateOrderInput,
): Promise<CreateOrderResponse> {
  const response = await fetch(
    "/api/orders",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(order),
    },
  );

  const data =
    (await response.json()) as CreateOrderResponse;

  if (!response.ok || !data.success) {
    throw new Error(
      data.message ??
        "ثبت سفارش ناموفق بود",
    );
  }

  return data;
}