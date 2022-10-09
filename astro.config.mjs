import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    server: {
        host: true,
        port: 5000
    },
    site: "https://elpekenin.dev",
    trailingSlash: "always",
    vite: {
        ssr: {
          external: ["svgo"],
        },
      },
});

