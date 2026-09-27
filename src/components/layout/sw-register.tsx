"use client";

import { useEffect } from "react";

/**
 * Registers the service worker as early as possible so the PWA
 * install criteria (controlled page) are met for beforeinstallprompt.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Don't register on insecure origins — SW is blocked and it pollutes logs.
    if (window.isSecureContext === false) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // offline caching is a bonus, not required for the app to run
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    // Also try shortly after mount so a second visit can control the page sooner.
    const t = window.setTimeout(register, 50);

    return () => {
      window.removeEventListener("load", register);
      window.clearTimeout(t);
    };
  }, []);

  return null;
}
