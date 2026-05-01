const CACHE_NAME = "portfolio-cache-v4";

const ASSETS_TO_CACHE = [
  "index.html",
  "manifest.json",
  "Portfolio.css",
  "Portfolio.js",
  "p192.png",
  "p512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});
