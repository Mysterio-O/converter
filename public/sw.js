/* MediaForge service worker — caches app shell + engine assets for offline use */
const SHELL_CACHE = "mediaforge-shell-v1";
const ASSET_CACHE = "mediaforge-assets-v1";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-192-maskable.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isCacheableAsset =
    url.hostname.includes("jsdelivr.net") ||
    url.hostname.includes("fonts.g") ||
    url.hostname.includes("fonts.gstatic.com");

  // network-first for navigations, cache-first for static/CDN assets
  if (request.mode === "navigate") {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        try {
          const res = await fetch(request);
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          const cached = await cache.match(request);
          return cached || cache.match("/") || Response.error();
        }
      })
    );
    return;
  }

  if (isCacheableAsset || url.origin === self.location.origin) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        } catch {
          return cached || Response.error();
        }
      })
    );
  }
});
