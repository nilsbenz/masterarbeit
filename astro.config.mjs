// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import AstroPWA from "@vite-pwa/astro";
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
  integrations: [
    react(),
    mdx(),
    AstroPWA({
      base: "/",
      scope: "/",
      includeAssets: ["favicon.svg"],
      registerType: "autoUpdate",
      manifest: {
        name: "KI Dojo",
        short_name: "KI Dojo",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      pwaAssets: {
        config: true,
      },
      workbox: {
        navigateFallback: "/",
        globPatterns: ["**/*.{css,js,html,svg,png,ico,txt}"],
      },
      experimental: {
        directoryAndTrailingSlashHandler: true,
      },
    }),
  ],
});
