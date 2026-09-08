export type Availability =
  | "in-stock"
  | "low-stock"
  | "out-of-stock";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
images?: string[];
  availability: Availability;
  rating: number;
  reviews: number;
  popularity: number;
  createdAt: string;
  keywords: string[];
  badge?: string;
};

export const availabilityLabels: Record<
  Availability,
  string
> = {
  "in-stock": "موجود در انبار",
  "low-stock": "موجودی محدود",
  "out-of-stock": "ناموجود",
};

export const categories = [
  "همه محصولات",
  "قطعات موتور",
  "سیستم ترمز",
  "سیستم برق",
  "زنجیر و انتقال قدرت",
  "روغن و مواد مصرفی",
  "بدنه و لوازم جانبی",
] as const;

export type Category = (typeof categories)[number];

export const products: Product[] = [
  {
    id: "brake-pad-front",
    name: "لنت ترمز جلو دیسکی",
    brand: "برمبو",
    category: "سیستم ترمز",
    price: 480000,
    oldPrice: 560000,
    image: "/products/product-brake-pad.webp",
    availability: "in-stock",
    rating: 4.7,
    reviews: 128,
    popularity: 98,
    createdAt: "2026-07-28",
    keywords: [
      "لنت",
      "ترمز",
      "لنت جلو",
      "لنت ترمز",
      "سیستم ترمز",
      "دیسکی",
    ],
    badge: "پرفروش",
  },

  {
    id: "spark-plug",
    name: "شمع موتور ایریدیوم",
    brand: "ان‌جی‌کی",
    category: "سیستم برق",
    price: 265000,
    image: "/products/product-spark-plug.webp",
    availability: "in-stock",
    rating: 4.8,
    reviews: 214,
    popularity: 95,
    createdAt: "2026-06-14",
    keywords: [
      "شمع",
      "شمع موتور",
      "جرقه",
      "ایریدیوم",
      "برق",
    ],
  },

  {
    id: "chain",
    name: "زنجیر موتورسیکلت ۴۲۸H",
    brand: "دی‌آی‌دی",
    category: "زنجیر و انتقال قدرت",
    price: 1250000,
    image: "/products/product-chain.webp",
    availability: "low-stock",
    rating: 4.5,
    reviews: 76,
    popularity: 80,
    createdAt: "2026-05-02",
    keywords: [
      "زنجیر",
      "زنجیر موتور",
      "انتقال قدرت",
      "چرخ زنجیر",
      "428",
    ],
  },

  {
    id: "engine-oil",
    name: "روغن موتور نیمه‌سنتتیک ۲۰W-۵۰",
    brand: "موتول",
    category: "روغن و مواد مصرفی",
    price: 690000,
    image: "/products/product-oil.webp",
    availability: "in-stock",
    rating: 4.6,
    reviews: 302,
    popularity: 99,
    createdAt: "2026-08-05",
    keywords: [
      "روغن",
      "روغن موتور",
      "روغن چهارزمانه",
      "مصرفی",
      "20w50",
    ],
    badge: "پیشنهاد ویژه",
  },

  {
    id: "brake-disc",
    name: "دیسک ترمز جلو ۲۴۰ میلی‌متری",
    brand: "ای‌بی‌ام",
    category: "سیستم ترمز",
    price: 2150000,
    image: "/products/product-disc.webp",
    availability: "in-stock",
    rating: 4.4,
    reviews: 41,
    popularity: 72,
    createdAt: "2026-07-11",
    keywords: [
      "دیسک",
      "دیسک ترمز",
      "ترمز",
      "صفحه ترمز",
      "سیستم ترمز",
    ],
  },

  {
    id: "mirror",
    name: "آینه موتور بازوی بلند",
    brand: "ریزوما",
    category: "بدنه و لوازم جانبی",
    price: 540000,
    oldPrice: 620000,
    image: "/products/product-mirror.webp",
    availability: "out-of-stock",
    rating: 4.2,
    reviews: 58,
    popularity: 60,
    createdAt: "2026-04-19",
    keywords: [
      "آینه",
      "آینه بغل",
      "آینه موتور",
      "لوازم جانبی",
      "بدنه",
    ],
  },

  {
    id: "headlight",
    name: "چراغ جلو ال‌ای‌دی گرد",
    brand: "کوایتو",
    category: "سیستم برق",
    price: 1890000,
    oldPrice: 2100000,
    image: "/products/product-headlight.webp",
    availability: "in-stock",
    rating: 4.6,
    reviews: 93,
    popularity: 88,
    createdAt: "2026-08-12",
    keywords: [
      "چراغ",
      "چراغ جلو",
      "نور",
      "ال ای دی",
      "برق",
    ],
    badge: "جدید",
  },

  {
    id: "bulb",
    name: "لامپ موتور هالوژن ۳۵ وات",
    brand: "اسرام",
    category: "سیستم برق",
    price: 145000,
    image: "/products/product-bulb.webp",
    availability: "in-stock",
    rating: 4.1,
    reviews: 67,
    popularity: 64,
    createdAt: "2026-03-08",
    keywords: [
      "لامپ",
      "لامپ موتور",
      "هالوژن",
      "چراغ",
      "نور",
      "برق",
    ],
  },

  {
    id: "air-filter",
    name: "فیلتر هوا اسفنجی",
    brand: "کی‌اند‌ان",
    category: "روغن و مواد مصرفی",
    price: 320000,
    image: "/products/product-air-filter.webp",
    availability: "in-stock",
    rating: 4.3,
    reviews: 84,
    popularity: 70,
    createdAt: "2026-06-30",
    keywords: [
      "فیلتر",
      "فیلتر هوا",
      "هوا",
      "مصرفی",
      "تنفس موتور",
    ],
  },

  {
    id: "clutch-lever",
    name: "دسته کلاچ آلومینیومی",
    brand: "ریزوما",
    category: "بدنه و لوازم جانبی",
    price: 430000,
    image: "/products/product-clutch-lever.webp",
    availability: "low-stock",
    rating: 4.0,
    reviews: 29,
    popularity: 52,
    createdAt: "2026-05-21",
    keywords: [
      "دسته",
      "کلاچ",
      "دسته کلاچ",
      "اهرم",
      "لوازم جانبی",
    ],
  },

  {
    id: "carburetor",
    name: "کاربراتور کامل موتورسیکلت",
    brand: "میکونی",
    category: "قطعات موتور",
    price: 3450000,
    oldPrice: 3900000,
    image: "/products/product-carburetor.webp",
    availability: "in-stock",
    rating: 4.5,
    reviews: 47,
    popularity: 76,
    createdAt: "2026-07-02",
    keywords: [
      "کاربراتور",
      "کاربرات",
      "سوخت",
      "موتور",
      "قطعات موتور",
    ],
  },

  {
    id: "piston-kit",
    name: "کیت رینگ و فیلتر روغن موتور",
    brand: "هوندا اصلی",
    category: "قطعات موتور",
    price: 1150000,
    image: "/products/product-piston.webp",
    availability: "in-stock",
    rating: 4.7,
    reviews: 61,
    popularity: 74,
    createdAt: "2026-08-01",
    keywords: [
      "رینگ",
      "پیستون",
      "فیلتر روغن",
      "موتور",
      "قطعات موتور",
    ],
  },

  {
    id: "brake-pad-rear",
    name: "لنت ترمز عقب کاسه‌ای",
    brand: "ونتو",
    category: "سیستم ترمز",
    price: 310000,
    image: "/products/product-brake-pad.webp",
    availability: "in-stock",
    rating: 4.2,
    reviews: 55,
    popularity: 68,
    createdAt: "2026-04-05",
    keywords: [
      "لنت",
      "لنت عقب",
      "ترمز",
      "کاسه ترمز",
      "سیستم ترمز",
    ],
  },

  {
    id: "sprocket-kit",
    name: "کیت دنده زنجیر جلو و عقب",
    brand: "جی‌تی",
    category: "زنجیر و انتقال قدرت",
    price: 980000,
    oldPrice: 1120000,
    image: "/products/product-chain.webp",
    availability: "low-stock",
    rating: 4.4,
    reviews: 38,
    popularity: 66,
    createdAt: "2026-06-08",
    keywords: [
      "دنده",
      "زنجیر",
      "چرخ دنده",
      "انتقال قدرت",
      "کیت زنجیر",
    ],
  },
];

export const featuredProducts = products.slice(0, 6);

export const brands = Array.from(
  new Set(products.map((p) => p.brand)),
).sort();

export const priceBounds = {
  min: 0,
  max:
    Math.ceil(
      Math.max(
        ...products.map((p) => p.price),
      ) / 100000,
    ) * 100000,
};

export const quickSearches = [
  "لنت ترمز",
  "شمع",
  "زنجیر",
  "روغن موتور",
  "چراغ جلو",
];

export const navItems = [
  { label: "خانه", href: "/" },
  { label: "فروشگاه", href: "/shop" },
  {
    label: "دسته‌بندی‌ها",
    href: "/shop#categories",
  },
  {
    label: "درباره ما",
    href: "/#about",
  },
  {
    label: "تماس با ما",
    href: "/#contact",
  },
] as const;

const faDigits = [
  "۰",
  "۱",
  "۲",
  "۳",
  "۴",
  "۵",
  "۶",
  "۷",
  "۸",
  "۹",
];

export function toPersianDigits(
  value: string | number,
) {
  return String(value).replace(
    /\d/g,
    (d) => faDigits[Number(d)] ?? d,
  );
}

export function formatToman(value: number) {
  return toPersianDigits(
    value.toLocaleString("en-US"),
  );
}

export function normalizeFa(input: string) {
  return input
    .toLowerCase()
    .replace(/[\u064A\u0649]/g, "ی")
    .replace(/\u0643/g, "ک")
    .replace(
      /[\u200c\u200f\u200e]/g,
      " ",
    )
    .replace(/[\u064B-\u0652]/g, "")
    .replace(
      /[۰-۹]/g,
      (d) =>
        String(
          "۰۱۲۳۴۵۶۷۸۹".indexOf(d),
        ),
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function getDiscountPercent(
  product: Product,
) {
  if (
    !product.oldPrice ||
    product.oldPrice <= product.price
  ) {
    return null;
  }

  return Math.round(
    ((product.oldPrice -
      product.price) /
      product.oldPrice) *
      100,
  );
}

const descriptions: Record<
  string,
  string
> = {
  "brake-pad-front":
    "لنت ترمز جلو دیسکی با ترکیب نیمه‌متالیک، مناسب استفاده شهری و مسیرهای طولانی. توقف مطمئن، صدای کم و سایش پایین روی دیسک.",

  "spark-plug":
    "شمع ایریدیوم با الکترود نازک برای جرقه قوی‌تر، روشن شدن سریع موتور در هوای سرد و کاهش مصرف سوخت.",

  chain:
    "زنجیر ۴۲۸H با اورینگ و آبکاری ضدزنگ، طراحی‌شده برای تحمل گشتاور بالا و کشیدگی کمتر در کارکرد طولانی.",

  "engine-oil":
    "روغن موتور نیمه‌سنتتیک ۲۰W-۵۰ مخصوص موتورهای چهارزمانه با کلاچ تر؛ محافظت از قطعات داخلی و عملکرد نرم گیربکس.",

  "brake-disc":
    "دیسک ترمز جلو ۲۴۰ میلی‌متری از فولاد ضدزنگ با شیارهای خنک‌کننده برای کاهش دمای ترمز در ترمزگیری پیاپی.",

  mirror:
    "آینه بازوی بلند با بدنه آلومینیومی و شیشه محدب؛ دید عقب گسترده و لرزش بسیار کم در سرعت بالا.",

  headlight:
    "چراغ جلو ال‌ای‌دی گرد با نور سفید یکنواخت، مصرف برق پایین و بدنه آلومینیومی خنک‌شونده.",

  bulb:
    "لامپ هالوژن ۳۵ وات با نور گرم و پایدار، سازگار با اغلب چراغ‌های استاندارد موتورسیکلت.",

  "air-filter":
    "فیلتر هوای اسفنجی قابل شست‌وشو با دو لایه فیلتراسیون؛ تنفس بهتر موتور و جلوگیری از ورود گردوغبار.",

  "clutch-lever":
    "دسته کلاچ CNC آلومینیومی با تنظیم فاصله، لمس نرم و مقاومت بالا در برابر ضربه.",

  carburetor:
    "کاربراتور کامل با ژیگلور تنظیم‌شده، مناسب تعویض مستقیم؛ استارت راحت‌تر و شتاب یکنواخت.",

  "piston-kit":
    "کیت رینگ همراه با فیلتر روغن، ساخته‌شده با تلورانس دقیق برای کاهش مصرف روغن و بازگرداندن کمپرس موتور.",

  "brake-pad-rear":
    "لنت ترمز عقب کاسه‌ای با ترکیب نسوز؛ عملکرد پایدار در گرما و عمر بالا در ترافیک شهری.",

  "sprocket-kit":
    "کیت دنده زنجیر جلو و عقب از فولاد سخت‌کاری‌شده؛ انتقال قدرت روان‌تر و کاهش سروصدای زنجیر.",
};

export function getProductDescription(
  product: Product,
) {
  return (
    descriptions[product.id] ??
    `${product.name} از برند ${product.brand}، با ضمانت اصالت کالا.`
  );
}

export function getSku(product: Product) {
  return `YM-${product.id
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .slice(0, 14)}`;
}

export function getProductById(
  id: string,
) {
  return products.find(
    (p) => p.id === id,
  );
}

export function getGallery(product: Product) {
  const images = [
    product.image,
    ...(product.images ?? []),
  ].filter(Boolean);

  return [...new Set(images)];
}
export function getRelatedProducts(
  product: Product,
  count = 4,
) {
  const sameCategory =
    products.filter(
      (p) =>
        p.id !== product.id &&
        p.category === product.category,
    );

  const others =
    products.filter(
      (p) =>
        p.id !== product.id &&
        p.category !== product.category,
    );

  return [
    ...sameCategory,
    ...others.sort(
      (a, b) =>
        b.popularity -
        a.popularity,
    ),
  ].slice(0, count);
}

export function getSpecs(
  product: Product,
) {
  return [
    {
      label: "برند",
      value: product.brand,
    },
    {
      label: "دسته‌بندی",
      value: product.category,
    },
    {
      label: "وضعیت موجودی",
      value:
        availabilityLabels[
          product.availability
        ],
    },
    {
      label: "کد محصول",
      value: getSku(product),
    },
    {
      label: "گارانتی",
      value:
        "۱۸ ماه ضمانت اصالت کالا",
    },
    {
      label: "ارسال",
      value:
        "ارسال از انبار تهران، ۱ تا ۳ روز کاری",
    },
  ];
}