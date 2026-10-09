// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import svgr from "vite-plugin-svgr";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss(), svgr()],
  },
  markdown: {
    shikiConfig: {
      theme: "one-light",
    },
  },
  prefetch: {
    prefetchAll: true,
  },
  integrations: [react(), mdx()],
});
