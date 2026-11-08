import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Categories } from "@/components/site/Categories";
import { FeaturedProducts } from "@/components/site/FeaturedProducts";
import { WhyUs } from "@/components/site/WhyUs";
import { CtaSection } from "@/components/site/CtaSection";
import { Footer } from "@/components/site/Footer";

const title = "یدک موتور | فروشگاه لوازم یدکی موتورسیکلت";
const description =
  "خرید آنلاین قطعات و لوازم یدکی موتورسیکلت؛ لنت ترمز، شمع، زنجیر، روغن موتور و لوازم جانبی با ضمانت اصالت و ارسال سریع.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
        <WhyUs />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
