/// <reference lib="webworker" />
/**
 * Quantum AI Service Worker v3 — PWA offline caching.
 * Uses resilient per-file caching so one failed URL doesn't kill the install.
 */

const CACHE_NAME = "quantum-ai-v3";
const MODEL_CACHE = "quantum-ai-models";

// Install — cache each file individually so one failure doesn't break everything
self.addEventListener("install", (event) => {
  const swEvent = event;

  // We fetch and cache each file individually, catching errors per-file
  const filesToCache = [
    "/",
    "/index.html",
    "/manifest.webmanifest",
    "/logo.svg",
    "/assets/",  // Will be ignored — directory, not a real file
  ];

  swEvent.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        filesToCache.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn("[SW] Failed to cache (bad status):", url, response.status);
            })
            .catch((err) => {
              console.warn("[SW] Failed to cache:", url, err.message);
            })
        )
      );
    }).then(() => {
      console.log("[SW] Install complete — cache version:", CACHE_NAME);
      return self.skipWaiting();
    })
  );
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  const swEvent = event;
  swEvent.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== MODEL_CACHE)
          .map((key) => {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          })
      )
    ).then(() => {
      console.log("[SW] Activate complete — claiming clients");
      return self.clients.claim();
    })
  );
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const fetchEvent = event;
  const url = new URL(fetchEvent.request.url);

  // Only handle GET requests
  if (fetchEvent.request.method !== "GET") return;

  // External API calls — network only (never cache)
  if (
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("groq.com") ||
    url.hostname.includes("convex.cloud") ||
    url.hostname.includes("convex.site") ||
    url.hostname.includes("convex.dev")
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
        })
      )
    );
    return;
  }

  // Navigation requests (page loads) — network-first, fallback to cached index.html
  if (fetchEvent.request.mode === "navigate") {
    fetchEvent.respondWith(
      fetch(fetchEvent.request)
        .then((response) => {
          // Network succeeded — cache it and return
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(fetchEvent.request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed — try cache, then fall back to cached index.html
          return caches.match(fetchEvent.request).then((cachedPage) => {
            if (cachedPage) return cachedPage;
            return caches.match("/index.html").then((cachedIndex) => {
              return cachedIndex || new Response(
                "<html><body style='background:#0f1219;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;'><div style='text-align:center;'><h1 style='font-size:1.5rem;'>Quantum AI — Offline</h1><p style='opacity:0.6;margin-top:0.5rem;'>Please connect to the internet to load the app for the first time.</p></div></body></html>",
                { status: 503, headers: { "Content-Type": "text/html" } }
              );
            });
          });
        })
    );
    return;
  }

  // All other requests (JS, CSS, images, fonts, etc.) — cache-first, network fallback
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
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
          return new Response("Offline", { status: 503 });
        });
    })
  );
});

// Listen for messages from the app
self.addEventListener("message", (event) => {
  const msg = event;
  if (msg.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // App tells us which resources it loaded — cache them all for offline use
  if (msg.data?.type === "CACHE_LOADED_RESOURCES" && msg.data.urls) {
    const urls = msg.data.urls;
    console.log("[SW] Caching", urls.length, "loaded resources for offline");
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        urls.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch(() => {})
        )
      );
    });
  }
});
