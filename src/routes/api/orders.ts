import { createFileRoute } from "@tanstack/react-router";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  orders,
  orderItems,
  products,
} from "@/db/schema";

import {
  SESSION_COOKIE_NAME,
  getSession,
} from "@/lib/auth";

/*
 * =========================================================
 * Types
 * =========================================================
 */

type OrderItemInput = {
  productId: number;
  quantity: number;
};

type ShippingMethod =
  | "normal"
  | "fast";

type CreateOrderBody = {
  firstName: string;
  lastName: string;
  customerPhone: string;
  customerEmail?: string | null;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  description?: string;
  shippingMethod?: ShippingMethod;
  items: OrderItemInput[];
};

type CalculatedOrderItem = {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
};

/*
 * =========================================================
 * Constants
 * =========================================================
 */

const MAX_ITEMS_PER_ORDER = 100;
const MAX_QUANTITY_PER_ITEM = 1000;

const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 30;
const MAX_PROVINCE_LENGTH = 100;
const MAX_CITY_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 1000;
const MAX_POSTAL_CODE_LENGTH = 30;
const MAX_EMAIL_LENGTH = 254;
const MAX_DESCRIPTION_LENGTH = 2000;

/*
 * =========================================================
 * Helpers
 * =========================================================
 */

/**
 * ساخت شماره سفارش
 */
function generateOrderNumber(): string {
  const uuid =
    crypto
      .randomUUID()
      .replaceAll("-", "")
      .slice(0, 12)
      .toUpperCase();

  return `YM-${Date.now()}-${uuid}`;
}

/**
 * بررسی عدد صحیح مثبت
 */
function isPositiveInteger(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  );
}

/**
 * بررسی رشته
 */
function isValidString(
  value: unknown,
  maxLength = 500,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

/**
 * بررسی روش ارسال
 */
function isShippingMethod(
  value: unknown,
): value is ShippingMethod {
  return (
    value === "normal" ||
    value === "fast"
  );
}

/**
 * استخراج Session از Cookie
 */
async function getCurrentSession(
  request: Request,
) {
  const cookieHeader =
    request.headers.get("Cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies =
    cookieHeader.split(";");

  let sessionId: string | null =
    null;

  for (const cookie of cookies) {
    const [
      name,
      ...valueParts
    ] =
      cookie
        .trim()
        .split("=");

    if (
      name ===
      SESSION_COOKIE_NAME
    ) {
      const rawValue =
        valueParts.join("=");

      if (!rawValue) {
        return null;
      }

      try {
        sessionId =
          decodeURIComponent(
            rawValue,
          );
      } catch {
        return null;
      }

      break;
    }
  }

  if (!sessionId) {
    return null;
  }

  return getSession(sessionId);
}

/**
 * هزینه ارسال
 *
 * normal = رایگان
 * fast = 120,000 ریال
 */
function getShippingCost(
  shippingMethod: ShippingMethod,
): number {
  return shippingMethod === "fast"
    ? 120000
    : 0;
}

/**
 * بررسی مبلغ معتبر
 */
function isValidMoney(
  value: number,
): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0
  );
}

/*
 * =========================================================
 * Validation Error
 * =========================================================
 */

class OrderValidationError
  extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name =
      "OrderValidationError";
  }
}

/*
 * =========================================================
 * Route
 * =========================================================
 */

export const Route =
  createFileRoute(
    "/api/orders",
  )({
    server: {
      handlers: {
        /*
         * ===================================================
         * POST /api/orders
         *
         * ایجاد سفارش در وضعیت pending_payment
         *
         * مهم:
         * در این مرحله موجودی کم نمی‌شود.
         * ===================================================
         */

        POST: async ({
          request,
        }) => {
          try {
            /*
             * -----------------------------------------------
             * بررسی Session
             * -----------------------------------------------
             */

            console.log(
              "[ORDERS] BEFORE SESSION",
            );

            const session =
              await getCurrentSession(
                request,
              );

            console.log(
              "[ORDERS] AFTER SESSION",
            );

            if (!session) {
              return Response.json(
                {
                  success: false,
                  message:
                    "برای ثبت سفارش ابتدا وارد حساب کاربری شوید.",
                },
                {
                  status: 401,
                },
              );
            }

            /*
             * -----------------------------------------------
             * دریافت Body
             * -----------------------------------------------
             */

            let rawBody: unknown;

            try {
              rawBody =
                await request.json();
            } catch {
              return Response.json(
                {
                  success: false,
                  message:
                    "اطلاعات ارسال‌شده معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            if (
              typeof rawBody !==
                "object" ||
              rawBody === null ||
              Array.isArray(rawBody)
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "اطلاعات ارسال‌شده معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            const body =
              rawBody as Partial<CreateOrderBody>;

            /*
             * -----------------------------------------------
             * اعتبارسنجی اطلاعات مشتری
             * -----------------------------------------------
             */

            if (
              !isValidString(
                body.firstName,
                MAX_NAME_LENGTH,
              ) ||
              !isValidString(
                body.lastName,
                MAX_NAME_LENGTH,
              ) ||
              !isValidString(
                body.customerPhone,
                MAX_PHONE_LENGTH,
              ) ||
              !isValidString(
                body.province,
                MAX_PROVINCE_LENGTH,
              ) ||
              !isValidString(
                body.city,
                MAX_CITY_LENGTH,
              ) ||
              !isValidString(
                body.address,
                MAX_ADDRESS_LENGTH,
              ) ||
              !isValidString(
                body.postalCode,
                MAX_POSTAL_CODE_LENGTH,
              )
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "اطلاعات مشتری کامل یا معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            const firstName =
              body.firstName.trim();

            const lastName =
              body.lastName.trim();

            const customerPhone =
              body.customerPhone.trim();

            const province =
              body.province.trim();

            const city =
              body.city.trim();

            const address =
              body.address.trim();

            const postalCode =
              body.postalCode.trim();

            /*
             * -----------------------------------------------
             * ایمیل
             * -----------------------------------------------
             */

            let customerEmail:
              | string
              | null = null;

            if (
              body.customerEmail !==
                undefined &&
              body.customerEmail !==
                null &&
              body.customerEmail.trim() !==
                ""
            ) {
              if (
                !isValidString(
                  body.customerEmail,
                  MAX_EMAIL_LENGTH,
                ) ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                  body.customerEmail.trim(),
                )
              ) {
                return Response.json(
                  {
                    success: false,
                    message:
                      "ایمیل واردشده معتبر نیست.",
                  },
                  {
                    status: 400,
                  },
                );
              }

              customerEmail =
                body.customerEmail.trim();
            }

            /*
             * -----------------------------------------------
             * روش ارسال
             * -----------------------------------------------
             */

            const shippingMethod =
              body.shippingMethod ??
              "normal";

            if (
              !isShippingMethod(
                shippingMethod,
              )
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "روش ارسال انتخاب‌شده معتبر نیست.",
                },
                {
                  status: 400,
                },
              );
            }

            const shippingCost =
              getShippingCost(
                shippingMethod,
              );

            /*
             * -----------------------------------------------
             * اعتبارسنجی آیتم‌ها
             * -----------------------------------------------
             */

            if (
              !Array.isArray(
                body.items,
              ) ||
              body.items.length === 0
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "سبد خرید خالی است.",
                },
                {
                  status: 400,
                },
              );
            }

            if (
              body.items.length >
              MAX_ITEMS_PER_ORDER
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "تعداد محصولات سفارش بیش از حد مجاز است.",
                },
                {
                  status: 400,
                },
              );
            }

            /*
             * -----------------------------------------------
             * Normalize Items
             * -----------------------------------------------
             */

            const normalizedItems:
              OrderItemInput[] = [];

            for (
              const item of body.items
            ) {
              if (
                typeof item !==
                  "object" ||
                item === null ||
                !isPositiveInteger(
                  item.productId,
                ) ||
                !isPositiveInteger(
                  item.quantity,
                )
              ) {
                return Response.json(
                  {
                    success: false,
                    message:
                      "اطلاعات یکی از محصولات نامعتبر است.",
                  },
                  {
                    status: 400,
                  },
                );
              }

              if (
                item.quantity >
                MAX_QUANTITY_PER_ITEM
              ) {
                return Response.json(
                  {
                    success: false,
                    message:
                      "تعداد یکی از محصولات بیش از حد مجاز است.",
                  },
                  {
                    status: 400,
                  },
                );
              }

              normalizedItems.push({
                productId:
                  item.productId,
                quantity:
                  item.quantity,
              });
            }

            /*
             * -----------------------------------------------
             * جلوگیری از محصول تکراری
             * -----------------------------------------------
             */

            const productIds =
              normalizedItems.map(
                (item) =>
                  item.productId,
              );

            const uniqueProductIds = [
              ...new Set(productIds),
            ];

            if (
              uniqueProductIds.length !==
              productIds.length
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    "یک محصول بیش از یک بار در سفارش قرار گرفته است.",
                },
                {
                  status: 400,
                },
              );
            }

            /*
             * -----------------------------------------------
             * توضیحات
             * -----------------------------------------------
             */

            const description =
              typeof body.description ===
              "string"
                ? body.description
                    .trim()
                    .slice(
                      0,
                      MAX_DESCRIPTION_LENGTH,
                    )
                : null;

            /*
             * -----------------------------------------------
             * Account ID
             *
             * هرگز از Client دریافت نمی‌شود.
             * -----------------------------------------------
             */

            const accountId =
              session.user.id;

            /*
             * =================================================
             * دریافت محصولات واقعی از DB
             *
             * عمداً خارج از transaction
             * =================================================
             */

            console.log(
              "[ORDERS] BEFORE PRODUCTS QUERY",
            );

            const databaseProducts =
              await db
                .select({
                  id:
                    products.id,

                  name:
                    products.name,

                  price:
                    products.price,

                  stock:
                    products.stock,

                  availability:
                    products.availability,
                })
                .from(products)
                .where(
                  inArray(
                    products.id,
                    uniqueProductIds,
                  ),
                );

            console.log(
              "[ORDERS] AFTER PRODUCTS QUERY",
            );

            /*
             * -----------------------------------------------
             * بررسی وجود همه محصولات
             * -----------------------------------------------
             */

            if (
              databaseProducts.length !==
              uniqueProductIds.length
            ) {
              throw new OrderValidationError(
                "یکی از محصولات سفارش پیدا نشد.",
                400,
              );
            }

            /*
             * -----------------------------------------------
             * Map محصولات
             * -----------------------------------------------
             */

            const productsById =
              new Map(
                databaseProducts.map(
                  (product) => [
                    product.id,
                    product,
                  ],
                ),
              );

            /*
             * -----------------------------------------------
             * محاسبه امن سفارش
             * -----------------------------------------------
             */

            const calculatedItems:
              CalculatedOrderItem[] = [];

            for (
              const item of normalizedItems
            ) {
              const product =
                productsById.get(
                  item.productId,
                );

              if (!product) {
                throw new OrderValidationError(
                  "یکی از محصولات سفارش پیدا نشد.",
                  400,
                );
              }

              /*
               * بررسی موجودی
               *
               * فقط بررسی می‌کنیم.
               * هنوز موجودی را کم نمی‌کنیم.
               */

              if (
                product.availability !==
                  "in-stock" ||
                product.stock <= 0
              ) {
                throw new OrderValidationError(
                  `محصول «${product.name}» موجود نیست.`,
                  409,
                );
              }

              if (
                item.quantity >
                product.stock
              ) {
                throw new OrderValidationError(
                  `موجودی محصول «${product.name}» کافی نیست.`,
                  409,
                );
              }

              /*
               * قیمت واقعی از دیتابیس
               */

              const unitPrice =
                Number(
                  product.price,
                );

              if (
                !isValidMoney(
                  unitPrice,
                )
              ) {
                throw new Error(
                  "INVALID_PRODUCT_PRICE",
                );
              }

              const totalPrice =
                unitPrice *
                item.quantity;

              calculatedItems.push({
                productId:
                  product.id,

                productName:
                  product.name,

                unitPrice,

                quantity:
                  item.quantity,

                totalPrice,
              });
            }

            /*
             * -----------------------------------------------
             * محاسبه مبلغ
             * -----------------------------------------------
             */

            const subtotal =
              calculatedItems.reduce(
                (
                  sum,
                  item,
                ) =>
                  sum +
                  item.totalPrice,
                0,
              );

            const total =
              subtotal +
              shippingCost;

            /*
             * -----------------------------------------------
             * شماره سفارش
             * -----------------------------------------------
             */

            const orderNumber =
              generateOrderNumber();

            /*
             * =================================================
             * ایجاد سفارش
             *
             * بدون transaction
             * =================================================
             */

            console.log(
              "[ORDERS] BEFORE ORDER INSERT",
            );

            const insertedOrders =
              await db
                .insert(orders)
                .values({
                  orderNumber,

                  accountId,

                  firstName,

                  lastName,

                  customerPhone,

                  customerEmail,

                  province,

                  city,

                  address,

                  postalCode,

                  description,

                  subtotal,

                  shippingCost,

                  total,

                  status:
                    "pending_payment",

                  paymentStatus:
                    "unpaid",
                })
                .returning({
                  id:
                    orders.id,

                  orderNumber:
                    orders.orderNumber,

                  subtotal:
                    orders.subtotal,

                  shippingCost:
                    orders.shippingCost,

                  total:
                    orders.total,

                  status:
                    orders.status,

                  paymentStatus:
                    orders.paymentStatus,
                });

            console.log(
              "[ORDERS] AFTER ORDER INSERT",
            );

            const createdOrder =
              insertedOrders[0];

            if (!createdOrder) {
              throw new Error(
                "ORDER_INSERT_FAILED",
              );
            }

            /*
             * -----------------------------------------------
             * ایجاد آیتم‌های سفارش
             * -----------------------------------------------
             */

            console.log(
              "[ORDERS] BEFORE ORDER ITEMS INSERT",
            );

            await db
              .insert(orderItems)
              .values(
                calculatedItems.map(
                  (item) => ({
                    orderId:
                      createdOrder.id,

                    productId:
                      item.productId,

                    productName:
                      item.productName,

                    unitPrice:
                      item.unitPrice,

                    quantity:
                      item.quantity,

                    totalPrice:
                      item.totalPrice,
                  }),
                ),
              );

            console.log(
              "[ORDERS] AFTER ORDER ITEMS INSERT",
            );

            /*
             * -----------------------------------------------
             * پاسخ موفق
             * -----------------------------------------------
             */

            return Response.json(
              {
                success: true,

                order: {
                  id:
                    createdOrder.id,

                  orderNumber:
                    createdOrder.orderNumber,

                  subtotal:
                    Number(
                      createdOrder.subtotal,
                    ),

                  shippingCost:
                    Number(
                      createdOrder.shippingCost,
                    ),

                  shippingMethod,

                  total:
                    Number(
                      createdOrder.total,
                    ),

                  status:
                    createdOrder.status,

                  paymentStatus:
                    createdOrder.paymentStatus,
                },
              },
              {
                status: 201,
              },
            );
          } catch (error) {
            /*
             * -----------------------------------------------
             * خطاهای قابل نمایش به کاربر
             * -----------------------------------------------
             */

            if (
              error instanceof
              OrderValidationError
            ) {
              return Response.json(
                {
                  success: false,
                  message:
                    error.message,
                },
                {
                  status:
                    error.status,
                },
              );
            }

            /*
             * -----------------------------------------------
             * خطای داخلی
             * -----------------------------------------------
             */

            console.error(
              "POST /api/orders ERROR:",
              error,
            );

            return Response.json(
              {
                success: false,
                message:
                  "خطا در ایجاد سفارش. لطفاً دوباره تلاش کنید.",
              },
              {
                status: 500,
              },
            );
          }
        },

        /*
         * ===================================================
         * GET /api/orders
         *
         * دریافت سفارش‌های کاربر فعلی
         * ===================================================
         */

        GET: async ({
          request,
        }) => {
          try {
            /*
             * -----------------------------------------------
             * دریافت Session
             * -----------------------------------------------
             */

            const session =
              await getCurrentSession(
                request,
              );

            if (!session) {
              return Response.json(
                {
                  success: false,
                  authenticated:
                    false,
                  orders: [],
                  count: 0,
                  message:
                    "برای مشاهده سفارش‌ها ابتدا وارد حساب کاربری شوید.",
                },
                {
                  status: 401,
                },
              );
            }

            const accountId =
              session.user.id;

            /*
             * -----------------------------------------------
             * دریافت سفارش‌های کاربر
             * -----------------------------------------------
             */

            const dbOrders =
              await db
                .select({
                  id:
                    orders.id,

                  orderNumber:
                    orders.orderNumber,

                  accountId:
                    orders.accountId,

                  firstName:
                    orders.firstName,

                  lastName:
                    orders.lastName,

                  customerPhone:
                    orders.customerPhone,

                  customerEmail:
                    orders.customerEmail,

                  province:
                    orders.province,

                  city:
                    orders.city,

                  address:
                    orders.address,

                  postalCode:
                    orders.postalCode,

                  description:
                    orders.description,

                  subtotal:
                    orders.subtotal,

                  shippingCost:
                    orders.shippingCost,

                  total:
                    orders.total,

                  status:
                    orders.status,

                  paymentStatus:
                    orders.paymentStatus,

                  createdAt:
                    orders.createdAt,

                  updatedAt:
                    orders.updatedAt,
                })
                .from(orders)
                .where(
                  eq(
                    orders.accountId,
                    accountId,
                  ),
                )
                .orderBy(
                  orders.createdAt,
                );

            /*
             * -----------------------------------------------
             * اگر سفارشی وجود ندارد
             * -----------------------------------------------
             */

            if (
              dbOrders.length === 0
            ) {
              return Response.json({
                success: true,
                authenticated:
                  true,
                orders: [],
                count: 0,
              });
            }

            /*
             * -----------------------------------------------
             * Order IDs
             * -----------------------------------------------
             */

            const orderIds =
              dbOrders.map(
                (order) =>
                  order.id,
              );

            /*
             * -----------------------------------------------
             * دریافت تمام آیتم‌ها
             * -----------------------------------------------
             */

            const dbItems =
              await db
                .select({
                  id:
                    orderItems.id,

                  orderId:
                    orderItems.orderId,

                  productId:
                    orderItems.productId,

                  productName:
                    orderItems.productName,

                  unitPrice:
                    orderItems.unitPrice,

                  quantity:
                    orderItems.quantity,

                  totalPrice:
                    orderItems.totalPrice,

                  image:
                    products.image,
                })
                .from(orderItems)
                .leftJoin(
                  products,
                  eq(
                    orderItems.productId,
                    products.id,
                  ),
                )
                .where(
                  inArray(
                    orderItems.orderId,
                    orderIds,
                  ),
                );

            /*
             * -----------------------------------------------
             * گروه‌بندی آیتم‌ها
             * -----------------------------------------------
             */

            const itemsByOrderId =
              new Map<
                number,
                typeof dbItems
              >();

            for (
              const item of dbItems
            ) {
              const existing =
                itemsByOrderId.get(
                  item.orderId,
                );

              if (existing) {
                existing.push(item);
              } else {
                itemsByOrderId.set(
                  item.orderId,
                  [item],
                );
              }
            }

            /*
             * -----------------------------------------------
             * ساخت خروجی
             * -----------------------------------------------
             */

            const result =
              dbOrders.map(
                (order) => {
                  const items =
                    itemsByOrderId.get(
                      order.id,
                    ) ?? [];

                  return {
                    id:
                      order.id,

                    orderNumber:
                      order.orderNumber,

                    accountId:
                      order.accountId,

                    customer: {
                      firstName:
                        order.firstName,

                      lastName:
                        order.lastName,

                      phone:
                        order.customerPhone,

                      email:
                        order.customerEmail,
                    },

                    shipping: {
                      province:
                        order.province,

                      city:
                        order.city,

                      address:
                        order.address,

                      postalCode:
                        order.postalCode,
                    },

                    description:
                      order.description,

                    subtotal:
                      Number(
                        order.subtotal,
                      ),

                    shippingCost:
                      Number(
                        order.shippingCost,
                      ),

                    total:
                      Number(
                        order.total,
                      ),

                    status:
                      order.status,

                    paymentStatus:
                      order.paymentStatus,

                    createdAt:
                      order.createdAt,

                    updatedAt:
                      order.updatedAt,

                    shippingMethod:
                      "normal" as const,

                    items:
                      items.map(
                        (item) => ({
                          id:
                            item.id,

                          productId:
                            item.productId,

                          productName:
                            item.productName,

                          unitPrice:
                            Number(
                              item.unitPrice,
                            ),

                          quantity:
                            Number(
                              item.quantity,
                            ),

                          totalPrice:
                            Number(
                              item.totalPrice,
                            ),

                          image:
                            item.image ??
                            null,
                        }),
                      ),
                  };
                },
              );

            /*
             * -----------------------------------------------
             * پاسخ موفق
             * -----------------------------------------------
             */

            return Response.json({
              success: true,

              authenticated:
                true,

              orders: result,

              count:
                result.length,
            });
          } catch (error) {
            console.error(
              "GET /api/orders ERROR:",
              error,
            );

            return Response.json(
              {
                success: false,
                authenticated:
                  false,
                orders: [],
                count: 0,
                message:
                  "خطا در دریافت سفارش‌ها.",
              },
              {
                status: 500,
              },
            );
          }
        },
      },
    },
  });