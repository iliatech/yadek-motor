import { createFileRoute } from "@tanstack/react-router";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { products } from "@/db/schema";

const SITE_URL = "https://diamondmotor.ir";

type SitemapUrl = {
  loc: string;
  lastmod?: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const productRows = await db
          .select({
            slug: products.slug,
            updatedAt: products.updatedAt,
          })
          .from(products)
          .orderBy(asc(products.id));

        const urls: SitemapUrl[] = [
          {
            loc: `${SITE_URL}/`,
          },
          {
            loc: `${SITE_URL}/shop`,
          },

          ...productRows.map((product) => ({
            loc: `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
            lastmod: product.updatedAt,
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${
      url.lastmod
        ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>`
        : ""
    }
  </url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});