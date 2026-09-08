import { sqliteTable, AnySQLiteColumn, uniqueIndex, integer, text, foreignKey, real } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const categories = sqliteTable("categories", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	createdAt: text("created_at").notNull(),
},
(table) => [
	uniqueIndex("categories_slug_unique").on(table.slug),
]);

export const products = sqliteTable("products", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	brand: text().notNull(),
	categoryId: integer("category_id").notNull().references(() => categories.id),
	price: real().notNull(),
	stock: integer().default(0).notNull(),
	image: text(),
	availability: text().default("in-stock").notNull(),
	popularity: integer().default(0).notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	oldPrice: real("old_price"),
	rating: real().notNull(),
	reviews: integer().default(0).notNull(),
	keywords: text().default("[]").notNull(),
	badge: text(),
},
(table) => [
	uniqueIndex("products_slug_unique").on(table.slug),
]);

export const orderItems = sqliteTable("order_items", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	orderId: integer("order_id").notNull().references(() => orders.id),
	productId: integer("product_id").notNull().references(() => products.id),
	productName: text("product_name").notNull(),
	unitPrice: real("unit_price").notNull(),
	quantity: integer().notNull(),
	totalPrice: real("total_price").notNull(),
});

export const sessions = sqliteTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => users.id),
	expiresAt: text("expires_at").notNull(),
	createdAt: text("created_at").notNull(),
});

export const users = sqliteTable("users", {
	id: text().primaryKey().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	phone: text().notNull(),
	email: text(),
	passwordHash: text("password_hash").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("users_phone_unique").on(table.phone),
]);

export const orders = sqliteTable("orders", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	orderNumber: text("order_number").notNull(),
	accountId: text("account_id").references(() => users.id),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	customerPhone: text("customer_phone").notNull(),
	customerEmail: text("customer_email"),
	province: text().notNull(),
	city: text().notNull(),
	address: text().notNull(),
	postalCode: text("postal_code").notNull(),
	description: text(),
	subtotal: real().notNull(),
	shippingCost: real("shipping_cost").notNull(),
	total: real().notNull(),
	status: text().default("pending").notNull(),
	paymentStatus: text("payment_status").default("unpaid").notNull(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("orders_order_number_unique").on(table.orderNumber),
]);

