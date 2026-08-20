/// <reference lib="webworker" />
/**
 * Quantum AI Service Worker — PWA offline caching.
 * Caches all app assets so the app loads without internet.
 * Also caches model files from Hugging Face for offline AI.
 */

const CACHE_NAME = "quantum-ai-v1";
const MODEL_CACHE = "quantum-ai-models";

// App shell assets to pre-cache
const APP_SHELL = [
  "/",
  "/app",
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

// Fetch — network first for API calls, cache first for assets
self.addEventListener("fetch", (event) => {
  const fetchEvent = event as FetchEvent;
  const url = new URL(fetchEvent.request.url);

  // Skip non-GET requests
  if (fetchEvent.request.method !== "GET") return;

  // API calls — network only (Gemini, Groq, etc.)
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("groq.com") ||
    url.hostname.includes("huggingface.co")
  ) {
    // For Hugging Face model files, cache them for offline use
    if (url.hostname.includes("huggingface.co")) {
      fetchEvent.respondWith(
        caches.open(MODEL_CACHE).then((cache) =>
          cache.match(fetchEvent.request).then((cached) => {
            if (cached) return cached;
            return fetch(fetchEvent.request).then((response) => {
              if (response.ok) {
                cache.put(fetchEvent.request, response.clone());
              }
              return response;
            }).catch(() => new Response("Offline — model file not cached", { status: 503 }));
          }),
        ),
      );
      return;
    }

    // Other API calls — network only
    return;
  }

  // Static assets — cache first, network fallback
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then((cached) => {
      if (cached) return cached;

      return fetch(fetchEvent.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && url.origin === self.location.origin) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(fetchEvent.request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback for navigation
          if (fetchEvent.request.mode === "navigate") {
            return caches.match("/app");
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
