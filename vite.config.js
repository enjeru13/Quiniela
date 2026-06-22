/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["favicon.svg", "logo.png"],
        manifest: {
          name: "Quiniela Mundial 2026",
          short_name: "Quiniela",
          description: "Predice los partidos del Mundial 2026",
          theme_color: "#000000",
          background_color: "#000000",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "logo.png", sizes: "192x192", type: "image/png" },
            { src: "logo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          ],
        },
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.js",
        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },
      }),
    ],
    server: {
      proxy: {
        "/api/fd": {
          target: "https://api.football-data.org",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/fd/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("X-Auth-Token", env.VITE_FOOTBALL_DATA_KEY);
            });
          },
        },
      },
    },
  };
});
