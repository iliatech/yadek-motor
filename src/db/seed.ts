import { db } from "./index";
import { categories, products } from "./schema";
import { eq } from "drizzle-orm";

/*
 * =========================
 * Seed Data
 * یدک موتور دیاموند
 * =========================
 */

const categoryData = [
  {
    name: "قطعات موتور",
    slug: "engine-parts",
    description: "قطعات اصلی و تخصصی موتور موتورسیکلت",
  },
  {
    name: "سیستم ترمز",
    slug: "braking-system",
    description: "لنت، دیسک و قطعات سیستم ترمز",
  },
  {
    name: "سیستم برق",
    slug: "electrical-system",
    description: "شمع، چراغ، لامپ و قطعات برقی موتورسیکلت",
  },
  {
    name: "زنجیر و انتقال قدرت",
    slug: "chain-transmission",
    description: "زنجیر، چرخ‌دنده و قطعات انتقال قدرت",
  },
  {
    name: "روغن و مواد مصرفی",
    slug: "oils-consumables",
    description: "روغن موتور، فیلتر و مواد مصرفی",
  },
  {
    name: "بدنه و لوازم جانبی",
    slug: "body-accessories",
    description: "آینه، دسته و لوازم جانبی موتورسیکلت",
  },
];

/*
 * =========================
 * Products
 * =========================
 */

const productData = [
  {
    name: "لنت ترمز جلو دیسکی",
    slug: "brake-pad-front",
    description:
      "لنت ترمز جلو دیسکی با ترکیب نیمه‌متالیک، مناسب استفاده شهری و مسیرهای طولانی. توقف مطمئن، صدای کم و سایش پایین روی دیسک.",
    brand: "برمبو",
    category: "سیستم ترمز",
    price: 480000,
    oldPrice: 560000,
    stock: 20,
    availability: "in-stock",
    image: "/products/product-brake-pad.webp",
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
    name: "شمع موتور ایریدیوم",
    slug: "spark-plug",
    description:
      "شمع ایریدیوم با الکترود نازک برای جرقه قوی‌تر، روشن شدن سریع موتور در هوای سرد و کاهش مصرف سوخت.",
    brand: "ان‌جی‌کی",
    category: "سیستم برق",
    price: 265000,
    oldPrice: null,
    stock: 30,
    availability: "in-stock",
    image: "/products/product-spark-plug.webp",
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
    badge: null,
  },

  {
    name: "زنجیر موتورسیکلت ۴۲۸H",
    slug: "motorcycle-chain-428h",
    description:
      "زنجیر ۴۲۸H با اورینگ و آبکاری ضدزنگ، طراحی‌شده برای تحمل گشتاور بالا و کشیدگی کمتر در کارکرد طولانی.",
    brand: "دی‌آی‌دی",
    category: "زنجیر و انتقال قدرت",
    price: 1250000,
    oldPrice: null,
    stock: 7,
    availability: "low-stock",
    image: "/products/product-chain.webp",
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
    badge: null,
  },

  {
    name: "روغن موتور نیمه‌سنتتیک ۲۰W-۵۰",
    slug: "engine-oil-20w50",
    description:
      "روغن موتور نیمه‌سنتتیک ۲۰W-۵۰ مخصوص موتورهای چهارزمانه با کلاچ تر؛ محافظت از قطعات داخلی و عملکرد نرم گیربکس.",
    brand: "موتول",
    category: "روغن و مواد مصرفی",
    price: 690000,
    oldPrice: null,
    stock: 25,
    availability: "in-stock",
    image: "/products/product-oil.webp",
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
    name: "دیسک ترمز جلو ۲۴۰ میلی‌متری",
    slug: "brake-disc-front-240",
    description:
      "دیسک ترمز جلو ۲۴۰ میلی‌متری از فولاد ضدزنگ با شیارهای خنک‌کننده برای کاهش دمای ترمز در ترمزگیری پیاپی.",
    brand: "ای‌بی‌ام",
    category: "سیستم ترمز",
    price: 2150000,
    oldPrice: null,
    stock: 12,
    availability: "in-stock",
    image: "/products/product-disc.webp",
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
    badge: null,
  },

  {
    name: "آینه موتور بازوی بلند",
    slug: "long-arm-motorcycle-mirror",
    description:
      "آینه بازوی بلند با بدنه آلومینیومی و شیشه محدب؛ دید عقب گسترده و لرزش بسیار کم در سرعت بالا.",
    brand: "ریزوما",
    category: "بدنه و لوازم جانبی",
    price: 540000,
    oldPrice: 620000,
    stock: 0,
    availability: "out-of-stock",
    image: "/products/product-mirror.webp",
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
    badge: null,
  },

  {
    name: "چراغ جلو ال‌ای‌دی گرد",
    slug: "round-led-headlight",
    description:
      "چراغ جلو ال‌ای‌دی گرد با نور سفید یکنواخت، مصرف برق پایین و بدنه آلومینیومی خنک‌شونده.",
    brand: "کوایتو",
    category: "سیستم برق",
    price: 1890000,
    oldPrice: 2100000,
    stock: 15,
    availability: "in-stock",
    image: "/products/product-headlight.webp",
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
    name: "لامپ موتور هالوژن ۳۵ وات",
    slug: "motorcycle-halogen-bulb",
    description:
      "لامپ هالوژن ۳۵ وات با نور گرم و پایدار، سازگار با اغلب چراغ‌های استاندارد موتورسیکلت.",
    brand: "اسرام",
    category: "سیستم برق",
    price: 145000,
    oldPrice: null,
    stock: 40,
    availability: "in-stock",
    image: "/products/product-bulb.webp",
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
    badge: null,
  },

  {
    name: "فیلتر هوا اسفنجی",
    slug: "sponge-air-filter",
    description:
      "فیلتر هوای اسفنجی قابل شست‌وشو با دو لایه فیلتراسیون؛ تنفس بهتر موتور و جلوگیری از ورود گردوغبار.",
    brand: "کی‌اند‌ان",
    category: "روغن و مواد مصرفی",
    price: 320000,
    oldPrice: null,
    stock: 18,
    availability: "in-stock",
    image: "/products/product-air-filter.webp",
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
    badge: null,
  },

  {
    name: "دسته کلاچ آلومینیومی",
    slug: "aluminum-clutch-lever",
    description:
      "دسته کلاچ CNC آلومینیومی با تنظیم فاصله، لمس نرم و مقاومت بالا در برابر ضربه.",
    brand: "ریزوما",
    category: "بدنه و لوازم جانبی",
    price: 430000,
    oldPrice: null,
    stock: 6,
    availability: "low-stock",
    image: "/products/product-clutch-lever.webp",
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
    badge: null,
  },

  {
    name: "کاربراتور کامل موتورسیکلت",
    slug: "complete-motorcycle-carburetor",
    description:
      "کاربراتور کامل با ژیگلور تنظیم‌شده، مناسب تعویض مستقیم؛ استارت راحت‌تر و شتاب یکنواخت.",
    brand: "میکونی",
    category: "قطعات موتور",
    price: 3450000,
    oldPrice: 3900000,
    stock: 10,
    availability: "in-stock",
    image: "/products/product-carburetor.webp",
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
    badge: null,
  },

  {
    name: "کیت رینگ و فیلتر روغن موتور",
    slug: "piston-ring-oil-filter-kit",
    description:
      "کیت رینگ همراه با فیلتر روغن، ساخته‌شده با تلورانس دقیق برای کاهش مصرف روغن و بازگرداندن کمپرس موتور.",
    brand: "هوندا اصلی",
    category: "قطعات موتور",
    price: 1150000,
    oldPrice: null,
    stock: 9,
    availability: "in-stock",
    image: "/products/product-piston.webp",
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
    badge: null,
  },

  {
    name: "لنت ترمز عقب کاسه‌ای",
    slug: "rear-drum-brake-pad",
    description:
      "لنت ترمز عقب کاسه‌ای با ترکیب نسوز؛ عملکرد پایدار در گرما و عمر بالا در ترافیک شهری.",
    brand: "ونتو",
    category: "سیستم ترمز",
    price: 310000,
    oldPrice: null,
    stock: 14,
    availability: "in-stock",
    image: "/products/product-brake-pad.webp",
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
    badge: null,
  },

  {
    name: "کیت دنده زنجیر جلو و عقب",
    slug: "front-rear-sprocket-kit",
    description:
      "کیت دنده زنجیر جلو و عقب از فولاد سخت‌کاری‌شده؛ انتقال قدرت روان‌تر و کاهش سروصدای زنجیر.",
    brand: "جی‌تی",
    category: "زنجیر و انتقال قدرت",
    price: 980000,
    oldPrice: 1120000,
    stock: 5,
    availability: "low-stock",
    image: "/products/product-chain.webp",
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
    badge: null,
  },
];

/*
 * =========================
 * Seed Function
 * =========================
 */

async function seed() {
  console.log("شروع Seed دیتابیس...");

  /*
   * =========================
   * Categories
   * =========================
   */

  console.log("بررسی دسته‌بندی‌ها...");

  let createdCategories = 0;
  let existingCategories = 0;

  for (const category of categoryData) {
    const existing = await db
      .select({
        id: categories.id,
      })
      .from(categories)
      .where(eq(categories.slug, category.slug))
      .limit(1);

    if (existing.length > 0) {
      existingCategories++;
      continue;
    }

    await db.insert(categories).values(category);
    createdCategories++;
  }

  /*
   * =========================
   * Load Categories
   * =========================
   */

  const savedCategories = await db
    .select()
    .from(categories);

  const categoryMap = new Map(
    savedCategories.map((category) => [
      category.name,
      category.id,
    ]),
  );

  /*
   * =========================
   * Products
   * =========================
   */

  console.log("بررسی محصولات...");

  let createdProducts = 0;
  let existingProducts = 0;

  for (const product of productData) {
    const categoryId = categoryMap.get(product.category);

    if (!categoryId) {
      throw new Error(
        `دسته‌بندی پیدا نشد: ${product.category}`,
      );
    }

    const existing = await db
      .select({
        id: products.id,
      })
      .from(products)
      .where(eq(products.slug, product.slug))
      .limit(1);

    if (existing.length > 0) {
      existingProducts++;
      continue;
    }

    await db.insert(products).values({
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      categoryId,
      price: product.price,
      oldPrice: product.oldPrice,
      stock: product.stock,
      availability: product.availability,
      image: product.image,
      rating: product.rating,
      reviews: product.reviews,
      popularity: product.popularity,
      keywords: product.keywords,
      badge: product.badge,
      createdAt: product.createdAt,
      updatedAt: new Date().toISOString(),
    });

    createdProducts++;
  }

  /*
   * =========================
   * Finish
   * =========================
   */

  console.log("");
  console.log("================================");
  console.log("Seed با موفقیت انجام شد.");
  console.log("================================");
  console.log(`دسته‌بندی جدید: ${createdCategories}`);
  console.log(`دسته‌بندی موجود: ${existingCategories}`);
  console.log(`محصول جدید: ${createdProducts}`);
  console.log(`محصول موجود: ${existingProducts}`);
  console.log(`کل دسته‌بندی‌ها: ${savedCategories.length}`);

  const savedProducts = await db
    .select({
      id: products.id,
    })
    .from(products);

  console.log(`کل محصولات: ${savedProducts.length}`);
  console.log("");
}

seed().catch((error) => {
  console.error("");
  console.error("Seed با خطا متوقف شد:");
  console.error(error);
  process.exit(1);
});