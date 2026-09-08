import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

/*
 * =========================================================
 * Users
 * =========================================================
 */

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey(),

  firstName: text("first_name")
    .notNull(),

  lastName: text("last_name")
    .notNull(),

  phone: text("phone")
    .notNull()
    .unique(),

  email: text("email"),
  
  role: text("role")
  .notNull()
  .default("user"),

  /*
   * رمز عبور به صورت Hash ذخیره می‌شود.
   * هرگز رمز عبور خام را در دیتابیس ذخیره نکن.
   */
  passwordHash: text("password_hash")
    .notNull(),

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),

  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),
});

/*
 * =========================================================
 * Sessions
 * =========================================================
 */

export const sessions = sqliteTable("sessions", {
  id: text("id")
    .primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(
      () => users.id,
    ),

  expiresAt: text("expires_at")
    .notNull(),

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),
});

/*
 * =========================================================
 * Categories
 * =========================================================
 */

export const categories = sqliteTable("categories", {
  id: integer("id")
    .primaryKey({
      autoIncrement: true,
    }),

  name: text("name")
    .notNull(),

  slug: text("slug")
    .notNull()
    .unique(),

  description: text("description"),

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),
});

/*
 * =========================================================
 * Products
 * =========================================================
 */

export const products = sqliteTable("products", {
  id: integer("id")
    .primaryKey({
      autoIncrement: true,
    }),

  name: text("name")
    .notNull(),

  slug: text("slug")
    .notNull()
    .unique(),

  description: text("description"),

  brand: text("brand")
    .notNull(),

  categoryId: integer("category_id")
    .notNull()
    .references(
      () => categories.id,
    ),

  price: real("price")
    .notNull(),

  oldPrice: real("old_price"),

  stock: integer("stock")
    .notNull()
    .default(0),

  availability: text("availability")
    .notNull()
    .default("in-stock"),

  image: text("image"),

  rating: real("rating")
    .notNull()
    .default(0),

  reviews: integer("reviews")
    .notNull()
    .default(0),

  popularity: integer("popularity")
    .notNull()
    .default(0),

  keywords: text("keywords", {
    mode: "json",
  })
    .$type<string[]>()
    .notNull()
    .default([]),

  badge: text("badge"),

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),

  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),
});

/*
 * =========================================================
 * Product Images
 * =========================================================
 *
 * هر محصول می‌تواند چند تصویر داشته باشد.
 *
 * image در جدول products همچنان تصویر اصلی محصول است
 * و برای سازگاری با محصولات فعلی حذف نمی‌شود.
 */

export const productImages = sqliteTable(
  "product_images",
  {
    id: integer("id")
      .primaryKey({
        autoIncrement: true,
      }),

    productId: integer("product_id")
      .notNull()
      .references(
        () => products.id,
        {
          onDelete: "cascade",
        },
      ),

    image: text("image")
      .notNull(),

    sortOrder: integer("sort_order")
      .notNull()
      .default(0),

    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() =>
        new Date().toISOString(),
      ),

    updatedAt: text("updated_at")
      .notNull()
      .$defaultFn(() =>
        new Date().toISOString(),
      ),
  },
);

/*
 * =========================================================
 * Orders
 * =========================================================
 */

export const orders = sqliteTable("orders", {
  id: integer("id")
    .primaryKey({
      autoIncrement: true,
    }),

  orderNumber: text("order_number")
    .notNull()
    .unique(),

  /*
   * حساب کاربری
   *
   * برای سفارش مهمان می‌تواند null باشد.
   */

  accountId: text("account_id")
    .references(
      () => users.id,
    ),

  /*
   * اطلاعات مشتری
   */

  firstName: text("first_name")
    .notNull(),

  lastName: text("last_name")
    .notNull(),

  customerPhone: text("customer_phone")
    .notNull(),

  customerEmail: text("customer_email"),

  /*
   * آدرس ارسال
   */

  province: text("province")
    .notNull(),

  city: text("city")
    .notNull(),

  address: text("address")
    .notNull(),

  postalCode: text("postal_code")
    .notNull(),

  /*
   * توضیحات سفارش
   */

  description: text("description"),

  /*
   * مبالغ
   */

  subtotal: real("subtotal")
    .notNull(),

  shippingCost: real("shipping_cost")
    .notNull()
    .default(0),

  total: real("total")
    .notNull(),

  /*
   * وضعیت سفارش
   */

  status: text("status")
    .notNull()
    .default("pending"),

  /*
   * وضعیت پرداخت
   */

  paymentStatus: text("payment_status")
    .notNull()
    .default("unpaid"),

  /*
   * تاریخ‌ها
   */

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),

  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() =>
      new Date().toISOString(),
    ),
});
/* Payments */
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  amount: real("amount").notNull(),

  status: text("status")
    .notNull()
    .default("pending"),

  provider: text("provider")
    .notNull()
    .default("mock"),

  authority: text("authority"),

  referenceId: text("reference_id"),

  trackingCode: text("tracking_code"),

  description: text("description"),

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),

  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

/*
 * =========================================================
 * Order Items
 * =========================================================
 */

export const orderItems = sqliteTable("order_items", {
  id: integer("id")
    .primaryKey({
      autoIncrement: true,
    }),

  orderId: integer("order_id")
    .notNull()
    .references(
      () => orders.id,
    ),

  productId: integer("product_id")
    .notNull()
    .references(
      () => products.id,
    ),

  /*
   * Snapshot محصول در زمان خرید
   */

  productName: text("product_name")
    .notNull(),

  unitPrice: real("unit_price")
    .notNull(),

  quantity: integer("quantity")
    .notNull(),

  totalPrice: real("total_price")
    .notNull(),
});