import type { CartItem } from "@/hooks/useCart";

/*
 * ========================================
 * وضعیت سفارش
 * ========================================
 */

export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "paid";

/*
 * ========================================
 * روش ارسال
 * ========================================
 */

export type ShippingMethod =
  | "normal"
  | "fast";

/*
 * ========================================
 * اطلاعات مشتری
 * ========================================
 */

export type OrderCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
};

/*
 * ========================================
 * آیتم سفارش
 * ========================================
 */

export type OrderItem = {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };

  quantity: number;
};

/*
 * ========================================
 * ساختار سفارش
 * ========================================
 */

export type Order = {
  id: string;

  databaseId: number;

  accountId?: string | undefined;

  customer: OrderCustomer;

  items: OrderItem[];

  subtotal: number;

  shippingCost: number;

  shippingMethod: ShippingMethod;

  total: number;

  description?: string | undefined;

  status: OrderStatus;

  createdAt: string;
};

/*
 * ========================================
 * ورودی ایجاد سفارش
 * ========================================
 */

export type CreateOrderInput = {
  /*
   * برای سازگاری با کدهای فعلی Frontend
   * نگه داشته شده است.
   *
   * Backend نباید به accountId ارسالی
   * از Frontend اعتماد کند.
   */

  accountId?: string | undefined;

  customer: OrderCustomer;

  items: CartItem[];

  subtotal: number;

  shippingCost?: number | undefined;

  shippingMethod?: ShippingMethod | undefined;

  total?: number | undefined;

  description?: string | undefined;
};

/*
 * ========================================
 * پاسخ API ایجاد سفارش
 * ========================================
 */

type CreateOrderApiResponse = {
  success: boolean;

  order?: {
    id: number;
    orderNumber: string;
    subtotal?: number;
    shippingCost?: number;
    shippingMethod?: ShippingMethod;
    total?: number;
  };

  message?: string;
};

/*
 * ========================================
 * ساختار واقعی API سفارش‌ها
 *
 * مطابق پاسخ واقعی GET /api/orders
 * ========================================
 */

type GetOrdersApiItem = {
  id: number;

  orderNumber: string;

  accountId?: string | null;

  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string | null;
  };

  shipping: {
    province: string;
    city: string;
    address: string;
    postalCode: string;
  };

  items: Array<{
    id: number;

    productId: number;

    productName: string;

    unitPrice: number;

    quantity: number;

    totalPrice: number;

    image: string | null;
  }>;

  subtotal: number;

  shippingCost: number;

  total: number;

  description?: string | null;

  status: OrderStatus;

  paymentStatus?: string;

  createdAt: string;

  updatedAt?: string;
};

type GetOrdersApiResponse = {
  success?: boolean;

  authenticated?: boolean;

  orders?: GetOrdersApiItem[];

  count?: number;

  message?: string;
};

/*
 * ========================================
 * محصول API
 * ========================================
 */

type ApiProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string | null;
};

/*
 * ========================================
 * دریافت محصولات برای تبدیل slug → ID
 * ========================================
 */

async function getProductsForOrder(): Promise<
  ApiProduct[]
> {
  const response =
    await fetch(
      "/api/products",
      {
        method: "GET",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      "دریافت اطلاعات محصولات انجام نشد.",
    );
  }

  const data =
    (await response.json()) as {
      success?: boolean;

      products?: ApiProduct[];

      message?: string;
    };

  if (
    !data.success ||
    !Array.isArray(
      data.products,
    )
  ) {
    throw new Error(
      data.message ??
        "اطلاعات محصولات معتبر نیست.",
    );
  }

  return data.products;
}

/*
 * ========================================
 * تبدیل ID یا Slug به ID دیتابیس
 * ========================================
 */

async function resolveProductIds(
  items: CartItem[],
): Promise<
  Array<{
    productId: number;
    quantity: number;
  }>
> {
  const numericItems: Array<{
    productId: number;
    quantity: number;
  }> = [];

  let allIdsAreNumeric = true;

  for (const item of items) {
    const rawProductId =
      String(
        item.product.id,
      );

    const productId =
      Number(
        rawProductId,
      );

    const quantity =
      Number(
        item.quantity,
      );

    if (
      !Number.isInteger(
        productId,
      ) ||
      productId <= 0
    ) {
      allIdsAreNumeric = false;
    }

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity <= 0
    ) {
      throw new Error(
        "تعداد یکی از محصولات معتبر نیست.",
      );
    }

    numericItems.push({
      productId,
      quantity,
    });
  }

  /*
   * اگر همه IDها عددی باشند،
   * مستقیماً استفاده می‌شوند.
   */

  if (allIdsAreNumeric) {
    return numericItems;
  }

  /*
   * اگر Cart از slug استفاده کند،
   * فقط یک بار محصولات دریافت می‌شوند.
   */

  const products =
    await getProductsForOrder();

  const productsBySlug =
    new Map<
      string,
      ApiProduct
    >();

  for (const product of products) {
    productsBySlug.set(
      product.slug,
      product,
    );
  }

  const resolvedItems: Array<{
    productId: number;
    quantity: number;
  }> = [];

  for (const item of items) {
    const productKey =
      String(
        item.product.id,
      );

    const quantity =
      Number(
        item.quantity,
      );

    const product =
      productsBySlug.get(
        productKey,
      );

    if (!product) {
      throw new Error(
        `محصول «${productKey}» در دیتابیس پیدا نشد.`,
      );
    }

    if (
      !Number.isInteger(
        product.id,
      ) ||
      product.id <= 0
    ) {
      throw new Error(
        "شناسه محصول در دیتابیس معتبر نیست.",
      );
    }

    resolvedItems.push({
      productId:
        product.id,

      quantity,
    });
  }

  return resolvedItems;
}

/*
 * ========================================
 * تبدیل پاسخ واقعی API به Order Frontend
 * ========================================
 */

function normalizeApiOrder(
  apiOrder: GetOrdersApiItem,
): Order {
  return {
    /*
     * شماره سفارش برای Frontend
     * شناسه قابل نمایش و جستجو است.
     */

    id:
      apiOrder.orderNumber,

    /*
     * ID عددی واقعی دیتابیس
     *
     * برای ساخت Payment بسیار مهم است.
     */

    databaseId:
      apiOrder.id,

    /*
     * حساب کاربری صاحب سفارش
     */

    accountId:
      apiOrder.accountId ??
      undefined,

    /*
     * اطلاعات مشتری
     */

    customer: {
      firstName:
        apiOrder.customer
          ?.firstName ?? "",

      lastName:
        apiOrder.customer
          ?.lastName ?? "",

      phone:
        apiOrder.customer
          ?.phone ?? "",

      province:
        apiOrder.shipping
          ?.province ?? "",

      city:
        apiOrder.shipping
          ?.city ?? "",

      address:
        apiOrder.shipping
          ?.address ?? "",

      postalCode:
        apiOrder.shipping
          ?.postalCode ?? "",
    },

    /*
     * ====================================
     * تبدیل آیتم‌های واقعی API
     *
     * Backend این ساختار را برمی‌گرداند:
     *
     * {
     *   productId,
     *   productName,
     *   unitPrice,
     *   quantity,
     *   totalPrice,
     *   image
     * }
     *
     * نه:
     *
     * {
     *   product: {...}
     * }
     * ====================================
     */

    items:
      Array.isArray(
        apiOrder.items,
      )
        ? apiOrder.items.map(
            (item) => ({
              product: {
                id:
                  String(
                    item.productId,
                  ),

                name:
                  item.productName,

                price:
                  Number(
                    item.unitPrice,
                  ),

                image:
                  item.image ??
                  "",
              },

              quantity:
                Number(
                  item.quantity,
                ),
            }),
          )
        : [],

    /*
     * مبالغ سفارش
     */

    subtotal:
      Number(
        apiOrder.subtotal,
      ),

    shippingCost:
      Number(
        apiOrder.shippingCost,
      ),

    /*
     * shippingMethod فعلاً در دیتابیس
     * ذخیره نشده است.
     *
     * بنابراین normal به عنوان fallback
     * استفاده می‌شود.
     */

    shippingMethod:
      "normal",

    total:
      Number(
        apiOrder.total,
      ),

    description:
      apiOrder.description ??
      "",

    /*
     * وضعیت واقعی سفارش از Backend
     *
     * شامل pending_payment و paid نیز می‌شود.
     */

    status:
      apiOrder.status,

    createdAt:
      apiOrder.createdAt,
  };
}

/*
 * ========================================
 * دریافت سفارش‌های کاربر
 * ========================================
 */

export async function getOrders(): Promise<
  Order[]
> {
  try {
    const response =
      await fetch(
        "/api/orders",
        {
          method: "GET",

          credentials:
            "include",

          headers: {
            Accept:
              "application/json",
          },
        },
      );

    /*
     * کاربر وارد حساب نشده است.
     */

    if (
      response.status === 401
    ) {
      return [];
    }

    if (!response.ok) {
      console.error(
        "GET /api/orders failed:",
        response.status,
      );

      return [];
    }

    const data: unknown =
      await response.json();

    if (
      typeof data !==
        "object" ||
      data === null
    ) {
      return [];
    }

    const apiData =
      data as GetOrdersApiResponse;

    if (
      apiData.success !== true ||
      !Array.isArray(
        apiData.orders,
      )
    ) {
      return [];
    }

    /*
     * تبدیل ساختار واقعی Backend
     * به ساختار مورد انتظار Frontend.
     */

    return apiData.orders.map(
      normalizeApiOrder,
    );
  } catch (error) {
    console.error(
      "GET ORDERS NETWORK ERROR:",
      error,
    );

    return [];
  }
}

/*
 * ========================================
 * ایجاد سفارش
 * ========================================
 */

export async function createOrder({
  customer,
  items,
  subtotal,
  shippingCost = 0,
  shippingMethod = "normal",
  total,
  description = "",
}: CreateOrderInput): Promise<Order> {
  /*
   * ======================================
   * اعتبارسنجی روش ارسال
   * ======================================
   */

  if (
    shippingMethod !== "normal" &&
    shippingMethod !== "fast"
  ) {
    throw new Error(
      "روش ارسال انتخاب‌شده معتبر نیست.",
    );
  }

  /*
   * ======================================
   * بررسی خالی نبودن سبد
   * ======================================
   */

  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new Error(
      "سبد خرید شما خالی است.",
    );
  }

  /*
   * ======================================
   * تبدیل مقادیر عددی
   *
   * فقط برای Frontend.
   * Backend مرجع اصلی قیمت است.
   * ======================================
   */

  const numericSubtotal =
    Number(subtotal);

  const numericShippingCost =
    Number(shippingCost);

  const numericTotal =
    total !== undefined
      ? Number(total)
      : numericSubtotal +
        numericShippingCost;

  if (
    !Number.isFinite(
      numericSubtotal,
    ) ||
    numericSubtotal < 0
  ) {
    throw new Error(
      "مبلغ سبد خرید معتبر نیست.",
    );
  }

  if (
    !Number.isFinite(
      numericShippingCost,
    ) ||
    numericShippingCost < 0
  ) {
    throw new Error(
      "هزینه ارسال معتبر نیست.",
    );
  }

  if (
    !Number.isFinite(
      numericTotal,
    ) ||
    numericTotal < 0
  ) {
    throw new Error(
      "مبلغ نهایی سفارش معتبر نیست.",
    );
  }

  /*
   * ======================================
   * تبدیل Cart ID/Slug به DB ID
   * ======================================
   */

  const apiItems =
    await resolveProductIds(
      items,
    );

  /*
   * ======================================
   * بررسی نهایی آیتم‌ها
   * ======================================
   */

  const invalidItem =
    apiItems.find(
      (item) =>
        !Number.isInteger(
          item.productId,
        ) ||
        item.productId <= 0 ||
        !Number.isInteger(
          item.quantity,
        ) ||
        item.quantity <= 0,
    );

  if (invalidItem) {
    throw new Error(
      "اطلاعات یکی از محصولات معتبر نیست.",
    );
  }

  /*
   * ======================================
   * بدنه درخواست
   *
   * accountId عمداً ارسال نمی‌شود.
   * Backend کاربر را از Session پیدا می‌کند.
   * ======================================
   */

  const requestBody = {
    firstName:
      customer.firstName.trim(),

    lastName:
      customer.lastName.trim(),

    customerPhone:
      customer.phone.trim(),

    province:
      customer.province.trim(),

    city:
      customer.city.trim(),

    address:
      customer.address.trim(),

    postalCode:
      customer.postalCode.trim(),

    shippingMethod,

    shippingCost:
      numericShippingCost,

    subtotal:
      numericSubtotal,

    total:
      numericTotal,

    description:
      description.trim(),

    items:
      apiItems,
  };

  /*
   * ======================================
   * ارسال درخواست
   * ======================================
   */

  let response: Response;

  try {
    response =
      await fetch(
        "/api/orders",
        {
          method: "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(
              requestBody,
            ),
        },
      );
  } catch (error) {
    console.error(
      "ORDER NETWORK ERROR:",
      error,
    );

    throw new Error(
      "ارتباط با سرور برقرار نشد.",
    );
  }

  /*
   * ======================================
   * دریافت پاسخ
   * ======================================
   */

  const responseText =
    await response.text();

  let data: CreateOrderApiResponse;

  try {
    data =
      JSON.parse(
        responseText,
      ) as CreateOrderApiResponse;
  } catch {
    throw new Error(
      `پاسخ نامعتبر از سرور دریافت شد. کد خطا: ${response.status}`,
    );
  }

  /*
   * ======================================
   * Session
   * ======================================
   */

  if (
    response.status === 401
  ) {
    throw new Error(
      "برای ثبت سفارش ابتدا وارد حساب کاربری شوید.",
    );
  }

  /*
   * ======================================
   * دسترسی
   * ======================================
   */

  if (
    response.status === 403
  ) {
    throw new Error(
      data.message ??
        "دسترسی شما برای ثبت سفارش مجاز نیست.",
    );
  }

  /*
   * ======================================
   * بررسی موفقیت
   * ======================================
   */

  if (
    !response.ok ||
    !data.success ||
    !data.order
  ) {
    console.error(
      "ORDER API ERROR:",
      data,
    );

    throw new Error(
      data.message ??
        "ثبت سفارش ناموفق بود.",
    );
  }

  /*
   * ======================================
   * استفاده از مقادیر Backend
   * ======================================
   */

  const finalShippingMethod =
    data.order
      .shippingMethod ??
    shippingMethod;

  const finalSubtotal =
    Number(
      data.order.subtotal ??
        numericSubtotal,
    );

  const finalShippingCost =
    Number(
      data.order.shippingCost ??
        numericShippingCost,
    );

  const finalTotal =
    Number(
      data.order.total ??
        numericTotal,
    );

  /*
   * ======================================
   * ساخت Order Frontend
   * ======================================
   */

  const order: Order = {
    id:
      data.order
        .orderNumber,

    databaseId:
      data.order.id,

    customer: {
      firstName:
        customer.firstName.trim(),

      lastName:
        customer.lastName.trim(),

      phone:
        customer.phone.trim(),

      province:
        customer.province.trim(),

      city:
        customer.city.trim(),

      address:
        customer.address.trim(),

      postalCode:
        customer.postalCode.trim(),
    },

    items:
      items.map(
        (item) => ({
          product: {
            id:
              String(
                item.product.id,
              ),

            name:
              item.product.name,

            price:
              Number(
                item.product.price,
              ),

            image:
              item.product.image,
          },

          quantity:
            Number(
              item.quantity,
            ),
        }),
      ),

    subtotal:
      finalSubtotal,

    shippingCost:
      finalShippingCost,

    shippingMethod:
      finalShippingMethod,

    total:
      finalTotal,

    description:
      description.trim(),

    /*
     * سفارش تازه ایجاد شده هنوز
     * پرداخت نشده است.
     */

    status:
      "pending",

    createdAt:
      new Date().toISOString(),
  };

  return order;
}

/*
 * ========================================
 * دریافت یک سفارش
 * ========================================
 */

export async function getOrderById(
  id: string,
): Promise<
  Order | undefined
> {
  const orders =
    await getOrders();

  return orders.find(
    (order) =>
      order.id === id,
  );
}

/*
 * ========================================
 * برچسب فارسی وضعیت سفارش
 * ========================================
 */

export const orderStatusLabels: Record<
  OrderStatus,
  string
> = {
  pending:
    "در انتظار بررسی",

  pending_payment:
    "در انتظار پرداخت",

  processing:
    "در حال پردازش",

  shipped:
    "ارسال شده",

  delivered:
    "تحویل داده شده",

  cancelled:
    "لغو شده",

  paid:
    "پرداخت شده",
};

/*
 * ========================================
 * برچسب فارسی روش ارسال
 * ========================================
 */

export const shippingMethodLabels: Record<
  ShippingMethod,
  string
> = {
  normal:
    "ارسال عادی",

  fast:
    "ارسال سریع",
};