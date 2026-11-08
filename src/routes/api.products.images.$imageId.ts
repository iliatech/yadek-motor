import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { env } from "cloudflare:workers";

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

        const image = await db
          .select({
            id: productImages.id,
            productId: productImages.productId,
            image: productImages.image,
          })
          .from(productImages)
          .where(eq(productImages.id, imageId))
          .get();

        if (!image) {
          return new Response("Image not found", {
            status: 404,
          });
        }

        const kvKey = `products/${image["productId"]}/${imageId}.webp`;

        const object = await env.PRODUCT_IMAGES.get(
          kvKey,
          {
            type: "arrayBuffer",
          },
        );

        if (!object) {
          return new Response("Image file not found", {
            status: 404,
          });
        }

        return new Response(object, {
          status: 200,
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control":
              "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});