import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import rehypeMathjax from "rehype-mathjax/chtml.js";
import react from "@astrojs/react";
import remarkCollapse from "remark-collapse";
import remarkMath from "remark-math";
import remarkToc from "remark-toc";
import sitemap from "@astrojs/sitemap";


function mySummarizer (str) {
  if (str.toLowerCase().includes("index"))
    return "Expand table of contents"

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
      remarkMath,
      [
        remarkToc,
        {
          heading: "Índice|Indice|Index",
          tight: true
        }
      ],
      [
        remarkCollapse,
        {
          test: "Índice|Indice|Index",
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
