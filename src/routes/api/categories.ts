import { createFileRoute } from "@tanstack/react-router";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { categories } from "@/db/schema";

export const Route = createFileRoute("/api/categories")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const rows = await db
            .select({
              id: categories.id,
              name: categories.name,
              slug: categories.slug,
              description: categories.description,
            })
            .from(categories)
            .orderBy(asc(categories.name));

          return Response.json({
            success: true,
            categories: rows,
            count: rows.length,
          });
        } catch (error) {
          console.error(
            "GET /api/categories error:",
            error,
          );

          return Response.json(
            {
              success: false,
              message: "خطا در دریافت دسته‌بندی‌ها",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});