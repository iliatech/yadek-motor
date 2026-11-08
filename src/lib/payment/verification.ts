import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  orderItems,
  orders,
  payments,
  products,
} from "@/db/schema";

import {
  getPaymentProvider,
  type PaymentProviderName,
} from "@/lib/payment";

export class PaymentVerifyError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "PaymentVerifyError";
    this.status = status;
  }
}

function isPaymentProviderName(
  value: unknown,
): value is PaymentProviderName {
  return (
    value === "mock" ||
    value === "zarinpal" ||
    value === "idpay" ||
    value === "zibal"
  );
}

export async function verifyPaymentById(
  paymentId: number,
  options?: {
    userId?: string;
  },
) {
  /*
   * 1. Find payment
   */
  const payment = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      amount: payments.amount,
      status: payments.status,
      provider: payments.provider,
      authority: payments.authority,
      referenceId: payments.referenceId,
      trackingCode: payments.trackingCode,
      description: payments.description,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
    })
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!payment) {
    throw new PaymentVerifyError(
      "پرداخت موردنظر پیدا نشد.",
      404,
    );
  }

  /*
   * 2. Find order
   */
  const order = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      accountId: orders.accountId,
      total: orders.total,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .where(eq(orders.id, payment.orderId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!order) {
    throw new PaymentVerifyError(
      "سفارش مرتبط با پرداخت پیدا نشد.",
      404,
    );
  }

  /*
   * 3. Ownership check
   *
   * Callback از زرین‌پال user session ندارد،
   * بنابراین فقط وقتی userId داده شده باشد
   * مالکیت را بررسی می‌کنیم.
   */
  if (
    options?.userId !== undefined &&
    order.accountId !== options.userId
  ) {
    throw new PaymentVerifyError(
      "شما اجازه دسترسی به این پرداخت را ندارید.",
      403,
    );
  }

  /*
   * 4. Already paid
   */
  if (
    payment.status === "paid" &&
    order.paymentStatus === "paid"
  ) {
    return {
      success: true as const,
      alreadyPaid: true,
      payment,
      order,
    };
  }

  /*
   * 5. Payment must be pending
   */
  if (payment.status !== "pending") {
    throw new PaymentVerifyError(
      "این پرداخت در وضعیت قابل تأیید نیست.",
      400,
    );
  }

  /*
   * 6. Validate amount
   */
  const paymentAmount = Number(payment.amount);
  const orderTotal = Number(order.total);

  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount <= 0
  ) {
    throw new PaymentVerifyError(
      "مبلغ پرداخت نامعتبر است.",
      400,
    );
  }

  if (
    !Number.isFinite(orderTotal) ||
    orderTotal <= 0
  ) {
    throw new PaymentVerifyError(
      "مبلغ سفارش نامعتبر است.",
      400,
    );
  }

  if (paymentAmount !== orderTotal) {
    throw new PaymentVerifyError(
      "مبلغ پرداخت با مبلغ سفارش مطابقت ندارد.",
      400,
    );
  }

  /*
   * 7. Validate provider
   */
  if (!isPaymentProviderName(payment.provider)) {
    throw new PaymentVerifyError(
      "درگاه پرداخت نامعتبر است.",
      400,
    );
  }

  /*
   * 8. Provider
   */
  const provider = getPaymentProvider(
    payment.provider,
  );

  /*
   * 9. Verify with ZarinPal/Provider
   */
  let verificationResult;

  try {
    verificationResult =
      await provider.verifyPayment({
        paymentId: payment.id,
        authority: payment.authority,
        amount: paymentAmount,
      });
  } catch (error) {
    console.error(
      "[PAYMENT_VERIFY_PROVIDER_ERROR]",
      error,
    );

    throw new PaymentVerifyError(
      "خطا در ارتباط با درگاه پرداخت.",
      502,
    );
  }

  /*
   * 10. Provider rejected payment
   */
  if (!verificationResult.success) {
    await db
      .update(payments)
      .set({
        status: "failed",
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(payments.id, payment.id),
          eq(payments.status, "pending"),
        ),
      );

    throw new PaymentVerifyError(
      verificationResult.message ||
        "پرداخت توسط درگاه تأیید نشد.",
      400,
    );
  }

  /*
   * 11. Re-read payment
   *
   * برای جلوگیری از تکمیل همزمان.
   */
  const currentPayment = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      amount: payments.amount,
      status: payments.status,
      provider: payments.provider,
      authority: payments.authority,
      referenceId: payments.referenceId,
      trackingCode: payments.trackingCode,
      description: payments.description,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
    })
    .from(payments)
    .where(eq(payments.id, payment.id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!currentPayment) {
    throw new PaymentVerifyError(
      "پرداخت پیدا نشد.",
      404,
    );
  }

  if (currentPayment.status === "paid") {
    const currentOrder = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        accountId: orders.accountId,
        total: orders.total,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
      })
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .limit(1)
      .then((rows) => rows[0]);

    if (
      currentOrder?.paymentStatus === "paid"
    ) {
      return {
        success: true as const,
        alreadyPaid: true,
        payment: currentPayment,
        order: currentOrder,
      };
    }

    throw new PaymentVerifyError(
      "پرداخت قبلاً تأیید شده اما وضعیت سفارش هنوز تکمیل نشده است.",
      409,
    );
  }

  if (currentPayment.status !== "pending") {
    throw new PaymentVerifyError(
      "وضعیت پرداخت دیگر قابل تکمیل نیست.",
      400,
    );
  }

  /*
   * 12. Get order items
   */
  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      productName: orderItems.productName,
      unitPrice: orderItems.unitPrice,
      quantity: orderItems.quantity,
      totalPrice: orderItems.totalPrice,
    })
    .from(orderItems)
    .where(
      eq(
        orderItems.orderId,
        payment.orderId,
      ),
    );

  if (items.length === 0) {
    throw new PaymentVerifyError(
      "سفارش هیچ قلمی ندارد.",
      400,
    );
  }

  /*
   * 13. Validate quantities
   */
  for (const item of items) {
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0
    ) {
      throw new PaymentVerifyError(
        `تعداد محصول «${item.productName}» نامعتبر است.`,
        400,
      );
    }
  }

  /*
   * 14. Decrease stock
   */
  const updatedStockProducts: {
    productId: number;
    quantity: number;
  }[] = [];

  try {
    for (const item of items) {
      const updatedProducts = await db
        .update(products)
        .set({
          stock:
            sql`${products.stock} - ${item.quantity}`,
          updatedAt:
            new Date().toISOString(),
        })
        .where(
          and(
            eq(products.id, item.productId),
            gte(
              products.stock,
              item.quantity,
            ),
          ),
        )
        .returning({
          id: products.id,
          stock: products.stock,
        });

      if (updatedProducts.length !== 1) {
        throw new PaymentVerifyError(
          `موجودی محصول «${item.productName}» برای تکمیل سفارش کافی نیست.`,
          409,
        );
      }

      const updatedProduct =
        updatedProducts[0];

      if (!updatedProduct) {
        throw new PaymentVerifyError(
          `محصول «${item.productName}» پس از کاهش موجودی پیدا نشد.`,
          500,
        );
      }

      updatedStockProducts.push({
        productId: item.productId,
        quantity: item.quantity,
      });

      await db
        .update(products)
        .set({
          availability:
            updatedProduct.stock > 0
              ? "in-stock"
              : "out-of-stock",
          updatedAt:
            new Date().toISOString(),
        })
        .where(
          eq(
            products.id,
            item.productId,
          ),
        );
    }
  } catch (error) {
    console.error(
      "[PAYMENT_VERIFY_STOCK_ERROR]",
      error,
    );

    for (
      const changedProduct of updatedStockProducts
    ) {
      try {
        await db
          .update(products)
          .set({
            stock:
              sql`${products.stock} + ${changedProduct.quantity}`,
            availability: "in-stock",
            updatedAt:
              new Date().toISOString(),
          })
          .where(
            eq(
              products.id,
              changedProduct.productId,
            ),
          );
      } catch (rollbackError) {
        console.error(
          "[PAYMENT_VERIFY_STOCK_ROLLBACK_ERROR]",
          rollbackError,
        );
      }
    }

    throw error;
  }

  /*
   * 15. Mark payment paid
   */
  const paidPayments = await db
    .update(payments)
    .set({
      status: "paid",
      referenceId:
        verificationResult.referenceId ??
        null,
      trackingCode:
        verificationResult.trackingCode ??
        null,
      updatedAt:
        new Date().toISOString(),
    })
    .where(
      and(
        eq(payments.id, payment.id),
        eq(payments.status, "pending"),
      ),
    )
    .returning({
      id: payments.id,
      orderId: payments.orderId,
      amount: payments.amount,
      status: payments.status,
      provider: payments.provider,
      authority: payments.authority,
      referenceId: payments.referenceId,
      trackingCode: payments.trackingCode,
      description: payments.description,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
    });

  if (paidPayments.length !== 1) {
    for (
      const item of updatedStockProducts
    ) {
      try {
        await db
          .update(products)
          .set({
            stock:
              sql`${products.stock} + ${item.quantity}`,
            availability: "in-stock",
            updatedAt:
              new Date().toISOString(),
          })
          .where(
            eq(
              products.id,
              item.productId,
            ),
          );
      } catch (rollbackError) {
        console.error(
          "[PAYMENT_VERIFY_PAYMENT_ROLLBACK_ERROR]",
          rollbackError,
        );
      }
    }

    throw new PaymentVerifyError(
      "وضعیت پرداخت همزمان تغییر کرده است.",
      409,
    );
  }

  const paidPayment =
    paidPayments[0];

  if (!paidPayment) {
    throw new PaymentVerifyError(
      "پرداخت پس از به‌روزرسانی پیدا نشد.",
      500,
    );
  }

  /*
   * 16. Mark order paid
   */
  const paidOrders = await db
    .update(orders)
    .set({
      status: "pending",
      paymentStatus: "paid",
      updatedAt:
        new Date().toISOString(),
    })
    .where(
      and(
        eq(
          orders.id,
          payment.orderId,
        ),
        eq(
          orders.paymentStatus,
          "unpaid",
        ),
      ),
    )
    .returning({
      id: orders.id,
      orderNumber: orders.orderNumber,
      accountId: orders.accountId,
      total: orders.total,
      status: orders.status,
      paymentStatus:
        orders.paymentStatus,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    });

  if (paidOrders.length !== 1) {
    try {
      await db
        .update(payments)
        .set({
          status: "pending",
          referenceId: null,
          trackingCode: null,
          updatedAt:
            new Date().toISOString(),
        })
        .where(
          eq(
            payments.id,
            payment.id,
          ),
        );
    } catch (rollbackPaymentError) {
      console.error(
        "[PAYMENT_VERIFY_ORDER_ROLLBACK_PAYMENT_ERROR]",
        rollbackPaymentError,
      );
    }

    for (
      const item of updatedStockProducts
    ) {
      try {
        await db
          .update(products)
          .set({
            stock:
              sql`${products.stock} + ${item.quantity}`,
            availability: "in-stock",
            updatedAt:
              new Date().toISOString(),
          })
          .where(
            eq(
              products.id,
              item.productId,
            ),
          );
      } catch (rollbackStockError) {
        console.error(
          "[PAYMENT_VERIFY_ORDER_ROLLBACK_STOCK_ERROR]",
          rollbackStockError,
        );
      }
    }

    throw new PaymentVerifyError(
      "وضعیت سفارش قابل تغییر نیست.",
      409,
    );
  }

  const paidOrder = paidOrders[0];

  if (!paidOrder) {
    throw new PaymentVerifyError(
      "سفارش پس از به‌روزرسانی پیدا نشد.",
      500,
    );
  }

  return {
    success: true as const,
    alreadyPaid: false,
    payment: paidPayment,
    order: paidOrder,
  };
}