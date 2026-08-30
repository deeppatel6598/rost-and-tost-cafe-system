/*
 * Service worker for the guest ordering app.
 *
 * Scope is deliberately narrow. It caches the app shell so a student on a
 * dead spot in the canteen still sees the interface rather than the browser's
 * offline page, and it serves stale-while-revalidate for static assets.
 *
 * It never caches API responses. Menus change (sold-out toggles), order
 * status changes by the second, and a cached "your order is being cooked"
 * would be worse than a visible error. Order submission is likewise not
 * handled here — retries live in the app with an idempotency key, so a
 * request that lands is never duplicated by a background replay.
 */

const CACHE = "sk-canteen-shell-v1";
const SHELL = ["/scan", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Live data must always come from the network.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations: network first, fall back to whatever shell we have.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((hit) => hit ?? caches.match("/scan"))),
    );
    return;
  }

  // Static assets: serve cached immediately, refresh in the background.
  if (url.pathname.startsWith("/_next/static/") || SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => hit);
        return hit ?? network;
      }),
    );
  }
});
