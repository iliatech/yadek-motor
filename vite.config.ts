/// <reference types="vite/client" />

import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    port: 8080,
    host: true,
  },

  resolve: {
    tsconfigPaths: true,
  },

  plugins: [
    cloudflare({
      viteEnvironment: {
        name: "ssr",
      },
    }),

    tanstackStart(),

    tailwindcss(),

    react(),
  ],
});