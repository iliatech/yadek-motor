import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/data/shop";
import { fetchProducts } from "@/lib/api";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
};

const CartContext =
  createContext<CartContextValue | null>(null);

const STORAGE_KEY = "yadak-motor-cart";

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /*
   * --------------------------------------------------
   * خواندن سبد خرید از localStorage
   * --------------------------------------------------
   *
   * ابتدا سبد ذخیره‌شده را مستقیماً restore می‌کنیم
   * تا بعد از refresh / login / redirect سبد خالی نشود.
   *
   * سپس اطلاعات محصولات را از API تازه می‌کنیم.
   */
  useEffect(() => {
    let cancelled = false;

    const loadCart = async () => {
      let savedItems: CartItem[] = [];

      try {
        const savedCart =
          window.localStorage.getItem(
            STORAGE_KEY,
          );

        if (savedCart) {
          const parsed: unknown =
            JSON.parse(savedCart);

          if (Array.isArray(parsed)) {
            savedItems = parsed.filter(
              (item): item is CartItem =>
                typeof item === "object" &&
                item !== null &&
                "product" in item &&
                "quantity" in item &&
                typeof item.quantity ===
                  "number" &&
                item.quantity > 0,
            );
          }
        }
      } catch {
        savedItems = [];
      }

      /*
       * بسیار مهم:
       * اول اطلاعات قبلی Cart را restore می‌کنیم.
       */
      if (!cancelled) {
        setItems(savedItems);
        setHydrated(true);
      }

      /*
       * اگر سبد خالی است، نیازی به دریافت محصولات
       * فقط برای refresh کردن Cart نداریم.
       */
      if (savedItems.length === 0) {
        return;
      }

      /*
       * دریافت آخرین اطلاعات محصولات از API
       */
      try {
        const latestProducts =
          await fetchProducts();

        if (cancelled) {
          return;
        }

        /*
         * تبدیل محصولات API به Product
         */
        const normalizedProducts: Product[] =
          latestProducts.map(
            (apiProduct) => ({
              id: String(apiProduct.id),

              name: apiProduct.name,

              brand: apiProduct.brand,

              category:
                apiProduct.categoryName ?? "",

              price: apiProduct.price,

              image: apiProduct.image
                ? apiProduct.image.startsWith("/")
                  ? apiProduct.image
                  : `/products/${apiProduct.image}`
                : "/products/placeholder.webp",

              availability:
                apiProduct.availability,

              rating: apiProduct.rating,

              reviews: apiProduct.reviews,

              popularity:
                apiProduct.popularity,

              createdAt:
                apiProduct.createdAt,

              keywords:
                apiProduct.keywords ?? [],

              ...(apiProduct.oldPrice !==
                null &&
              apiProduct.oldPrice !==
                undefined
                ? {
                    oldPrice:
                      apiProduct.oldPrice,
                  }
                : {}),

              ...(apiProduct.badge
                ? {
                    badge:
                      apiProduct.badge,
                  }
                : {}),
            }),
          );

        /*
         * اطلاعات ذخیره‌شده را با اطلاعات جدید
         * API هماهنگ می‌کنیم.
         *
         * اگر محصول در API پیدا نشد،
         * فعلاً از Cart حذفش نمی‌کنیم.
         * این باعث می‌شود یک خطای موقت API
         * سبد کاربر را از بین نبرد.
         */
        const refreshedItems: CartItem[] =
          savedItems.map((savedItem) => {
            const latestProduct =
              normalizedProducts.find(
                (product) =>
                  product.id ===
                  String(
                    savedItem.product.id,
                  ),
              );

            if (!latestProduct) {
              return savedItem;
            }

            return {
              product: latestProduct,
              quantity: Math.max(
                1,
                savedItem.quantity,
              ),
            };
          });

        if (cancelled) {
          return;
        }

        setItems(refreshedItems);

        /*
         * localStorage را هم با اطلاعات جدید
         * هماهنگ می‌کنیم.
         */
        try {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
              refreshedItems,
            ),
          );
        } catch {
          // localStorage در دسترس نیست
        }
      } catch {
        /*
         * اگر API در دسترس نبود،
         * Cart قبلی را نگه می‌داریم.
         */
        if (!cancelled) {
          setItems(savedItems);
        }
      }
    };

    void loadCart();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * --------------------------------------------------
   * ذخیره سبد خرید در localStorage
   * --------------------------------------------------
   */
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items),
      );
    } catch {
      // localStorage در دسترس نیست
    }
  }, [items, hydrated]);

  /*
   * --------------------------------------------------
   * افزودن محصول به سبد
   * --------------------------------------------------
   */
  const addToCart = (
    product: Product,
    quantity = 1,
  ) => {
    if (quantity <= 0) {
      return;
    }

    setItems((currentItems) => {
      const existingItem =
        currentItems.find(
          (item) =>
            item.product.id === product.id,
        );

      if (existingItem) {
        return currentItems.map(
          (item) =>
            item.product.id ===
            product.id
              ? {
                  ...item,
                  product,
                  quantity:
                    item.quantity +
                    quantity,
                }
              : item,
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity,
        },
      ];
    });
  };

  /*
   * --------------------------------------------------
   * تغییر تعداد محصول
   * --------------------------------------------------
   */
  const updateQuantity = (
    productId: string,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      setItems((currentItems) =>
        currentItems.filter(
          (item) =>
            item.product.id !==
            productId,
        ),
      );

      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
            }
          : item,
      ),
    );
  };

  /*
   * --------------------------------------------------
   * حذف محصول
   * --------------------------------------------------
   */
  const removeFromCart = (
    productId: string,
  ) => {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          item.product.id !==
          productId,
      ),
    );
  };

  /*
   * --------------------------------------------------
   * خالی کردن کامل سبد
   * --------------------------------------------------
   */
const clearCart = () => {
  setItems([]);

  try {
    window.localStorage.removeItem(
      STORAGE_KEY,
    );
  } catch {
    // localStorage در دسترس نیست
  }
};

  /*
   * --------------------------------------------------
   * تعداد کل کالاها
   * --------------------------------------------------
   */
  const cartCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0,
      ),
    [items],
  );

  /*
   * --------------------------------------------------
   * مبلغ کل سبد
   * --------------------------------------------------
   */
  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.product.price *
            item.quantity,
        0,
      ),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      cartCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
    }),
    [
      items,
      cartCount,
      subtotal,
    ],
  );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider",
    );
  }

  return context;
}