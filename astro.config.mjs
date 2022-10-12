import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  mode: "deploy",
  server: {
    host: true,
    port: 5000
  },
  site: "https://elpekenin.dev",
  trailingSlash: "always",
  vite: {
    ssr: {
      external: ["svgo"]
    }
  }
});