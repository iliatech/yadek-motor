import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { db } from "../db";
import { productImages } from "../db/schema";

export const Route = createFileRoute(
  "/api/products/images/$imageId",
)({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { imageId: imageIdParam } = params;
        const imageId = Number(imageIdParam);

        if (!Number.isInteger(imageId) || imageId <= 0) {
          return new Response("Invalid image ID", {
            status: 400,
          });
        }

        const imageRows = await db
          .select({
            id: productImages.id,
            productId: productImages.productId,
            image: productImages.image,
          })
          .from(productImages)
          .where(eq(productImages.id, imageId))
          .limit(1);

        const image = imageRows[0];

        if (!image) {
          return new Response("Image not found", {
            status: 404,
          });
        }

        const filePath = join(
          process.cwd(),
          "uploads",
          "products",
          String(image.productId),
          `${imageId}.webp`,
        );

        try {
          const fileBuffer = await readFile(filePath);

          return new Response(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/webp",
              "Cache-Control":
                "public, max-age=31536000, immutable",
            },
          });
        } catch {
          return new Response("Image file not found", {
            status: 404,
          });
        }
      },
    },
  },
});
