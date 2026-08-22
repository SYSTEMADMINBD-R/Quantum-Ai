/// <reference lib="webworker" />
/**
 * Quantum AI Service Worker — PWA offline caching.
 * Pre-caches the app shell (index.html + critical assets) and
 * runtime-caches all Vite-built JS/CSS bundles so the app loads offline.
 */

const CACHE_NAME = "quantum-ai-v2";
const MODEL_CACHE = "quantum-ai-models";

// Critical app shell — must be available offline
const APP_SHELL = [
  "/",
  "/app",
  "/auth",
  "/index.html",
  "/manifest.webmanifest",
  "/logo.svg",
];

// Install — pre-cache app shell
self.addEventListener("install", (event) => {
  const swEvent = event as ExtendableEvent;
  swEvent.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL);
    }),
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  const swEvent = event as ExtendableEvent;
  swEvent.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== MODEL_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const fetchEvent = event as FetchEvent;
  const url = new URL(fetchEvent.request.url);

  // Only handle GET
  if (fetchEvent.request.method !== "GET") return;

  // External API calls — network only (never cache)
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("groq.com") ||
    url.hostname.includes("convex.cloud") ||
    url.hostname.includes("convex.site")
  ) {
    return; // Let browser handle normally (network only)
  }

  // Hugging Face model files — cache for offline
  if (url.hostname.includes("huggingface.co")) {
    fetchEvent.respondWith(
      caches.open(MODEL_CACHE).then((cache) =>
        cache.match(fetchEvent.request).then((cached) => {
          if (cached) return cached;
          return fetch(fetchEvent.request)
            .then((response) => {
              if (response.ok) {
                cache.put(fetchEvent.request, response.clone());
              }
              return response;
            })
            .catch(() => new Response("Offline — model file not cached", { status: 503 }));
        }),
      ),
    );
    return;
  }

  // Navigation requests (page loads) — cache-first, fallback to cached index.html
  if (fetchEvent.request.mode === "navigate") {
    fetchEvent.respondWith(
      caches.match(fetchEvent.request).then((cached) => {
        if (cached) return cached;
        return fetch(fetchEvent.request)
          .then((response) => {
            // Cache successful navigation responses
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(fetchEvent.request, clone);
              });
            }
            return response;
          })
          .catch(() => {
            // Offline: serve cached index.html so React Router can handle routing
            return caches.match("/index.html").then((cachedIndex) => {
              return cachedIndex || new Response("Offline — please connect to the internet to load the app for the first time.", {
                status: 503,
                headers: { "Content-Type": "text/html" },
              });
            });
          });
      }),
    );
    return;
  }

  // All other requests (JS, CSS, images, fonts, etc.) — cache first, network fallback
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((cached) => {
      if (cached) return cached;

      return fetch(fetchEvent.request)
        .then((response) => {
          // Only cache same-origin successful responses
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(fetchEvent.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // If it's an image, return a placeholder
          if (fetchEvent.request.destination === "image") {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="#888">Offline</text></svg>',
              { headers: { "Content-Type": "image/svg+xml" } },
            );
          }
          return new Response("Offline", { status: 503 });
        });
    }),
  );
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  const msg = event as MessageEvent;
  if (msg.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
