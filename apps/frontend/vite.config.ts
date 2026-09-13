import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Gestão de Economia Doméstica",
        short_name: "Economia Doméstica",
        description: "Orçamento, registo de despesas e alertas de rutura orçamental para a família.",
        lang: "pt",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#f4f7f6",
        theme_color: "#0d7377",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", networkTimeoutSeconds: 5 },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3333", changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      "/api": { target: "http://localhost:3333", changeOrigin: true },
    },
  },
});
