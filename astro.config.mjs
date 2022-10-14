import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import sitemap from "@astrojs/sitemap";


function mySummarizer (str) {
  return "Expandir el índice"
}


export default defineConfig({
  build: {
    format: "file"
  },
  integrations: [
    react(),
    sitemap(),
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
  ],
  mode: "deploy",
  markdown: {
    remarkPlugins: [
      [
        remarkToc,
        {
          heading: "Indice",
        }
      ],
      [
        remarkCollapse,
        {
          test: "Indice",
          summary: mySummarizer
        },
      ],    ],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true,
    },
    extendDefaultPlugins: true,
  },
  server: {
    host: true,
    port: 5000
  },
  site: "https://elpekenin.dev/",
  trailingSlash: "ignore",
});
