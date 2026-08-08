// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { generateSW } from "workbox-build";
import type { Plugin } from "vite";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * TanStack Start marks client builds as SSR, so vite-plugin-pwa skips SW generation.
 * Generate the service worker into dist/client after the client bundle lands.
 */
function tanstackStartPwaSw(): Plugin {
  let generated = false;

  return {
    name: "tanstack-start-pwa-sw",
    apply: "build",
    async closeBundle() {
      const outDir = path.resolve("dist/client");
      if (!existsSync(outDir) || generated) return;
      generated = true;

      try {
        const { count, size, warnings } = await generateSW({
          globDirectory: outDir,
          globPatterns: ["**/*.{js,css,ico,png,svg,woff2,webmanifest}"],
          swDest: path.join(outDir, "sw.js"),
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "threadly-images",
                expiration: {
                  maxEntries: 80,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "threadly-api",
                networkTimeoutSeconds: 8,
                expiration: {
                  maxEntries: 40,
                  maxAgeSeconds: 60 * 5,
                },
              },
            },
          ],
        });

        if (warnings.length) {
          console.warn("[pwa] workbox warnings:", warnings);
        }
        console.log(`[pwa] Generated sw.js — precached ${count} files (${size} bytes)`);
      } catch (error) {
        console.error("[pwa] Failed to generate service worker:", error);
      }
    },
  };
}

export default defineConfig({
  plugins: [tanstackStartPwaSw()],
  vite: {
    server: {
      proxy: {
        "/api": { target: "http://localhost:3001", changeOrigin: true },
        "/uploads": { target: "http://localhost:3001", changeOrigin: true },
      },
    },
  },
});
