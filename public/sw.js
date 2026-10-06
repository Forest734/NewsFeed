// Service worker: keeps the app's files and the last news.json, so the app
// opens with no signal and shows the headlines it last fetched. Always asks
// the network first, so new news and new versions of the app show at once.
//
// Only this site's own files go through here; story pictures load straight
// from the news sites and aren't kept.

const CACHE = "newsfeed-v1";
const FILES = ["./", "index.html", "styles.css", "app.js", "lib.js", "news.json", "manifest.webmanifest", "icons/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Best effort: a missing file mustn't stop the worker installing.
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.allSettled(FILES.map((f) => cache.add(f)))));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  event.respondWith(networkFirst(event.request));
});

// "no-cache" makes the browser check with the server every time, instead of
// reusing a copy it guesses is still fresh (GitHub Pages allows that guess
// for ten minutes, which would hide a new news.json).
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}
