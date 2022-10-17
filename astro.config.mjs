import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import rehypeMathjax from "rehype-mathjax/chtml.js";
import react from "@astrojs/react";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import remarkMath from "remark-math";
import sitemap from "@astrojs/sitemap";
import { pathRemarkPlugin } from "./path-remark-plug.mjs";


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
      pathRemarkPlugin,
      remarkMath,
      [
        remarkToc,
        {
          heading: "Índice",
          tight: true
        }
      ],
      [
        remarkCollapse,
        {
          test: "Índice",
          summary: mySummarizer
        },
      ],
    ],
    rehypePlugins: [
      [
        rehypeMathjax,
        {
          chtml: {
            fontURL: "https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2",
            scale: 2.25
          }
        }
      ]
    ],
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
