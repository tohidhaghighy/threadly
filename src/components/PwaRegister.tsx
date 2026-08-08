import { useEffect } from "react";
import { initPwaInstallCapture } from "@/lib/pwa";

/**
 * Registers the service worker (production) and captures install prompts.
 * Safe for SSR — only runs in the browser.
 *
 * Uses a direct `/sw.js` registration because TanStack Start's client build
 * is SSR-flagged and vite-plugin-pwa does not emit the worker on its own.
 */
export function PwaRegister() {
  useEffect(() => {
    const disposeInstall = initPwaInstallCapture();
    let cancelled = false;

    async function register() {
      if (!("serviceWorker" in navigator)) return;
      if (!import.meta.env.PROD) return;

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        if (cancelled) return;
        void registration.update();
      } catch {
        // SW unavailable (preview without build artifact, or unsupported host).
      }
    }

    void register();

    return () => {
      cancelled = true;
      disposeInstall();
    };
  }, []);

  return null;
}
