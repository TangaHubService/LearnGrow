import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png"],
      manifest: {
        name: "KuraLearn",
        short_name: "KuraLearn",
        description: "Rwanda CBC AI-powered learning platform",
        theme_color: "#4f46e5",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/lessons\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "lessons-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/courses\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "courses-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/v1\/assignments\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "assignments-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/uploads\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "uploads-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep large libraries out of the main bundle. The PWA can only precache files up to 2 MiB.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (
            /[\\/]node_modules[\\/](@tiptap|prosemirror-[^\\/]+|linkify-it|markdown-it)[\\/]/.test(
              id,
            )
          )
            return "vendor-editor";
          if (/[\\/]node_modules[\\/](recharts|d3-[^\\/]+|victory-vendor)[\\/]/.test(id))
            return "vendor-charts";
          if (
            /[\\/]node_modules[\\/](xlsx|jspdf|jspdf-autotable|html2canvas|canvg|dompurify)[\\/]/.test(
              id,
            )
          )
            return "vendor-export";
          if (
            /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler|@remix-run)[\\/]/.test(
              id,
            )
          )
            return "vendor-react";
          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
