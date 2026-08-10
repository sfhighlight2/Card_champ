// Service worker.
//
// The previous version served EVERYTHING stale-while-revalidate, including
// index.html. After a deploy, returning visitors got the cached old shell whose
// hashed chunk files had been deleted from the server, so every lazy-loaded
// view failed: permanent spinners, dead tabs, and a mix of old and new code.
// With several deploys in a day the app looked broken to anyone who had
// visited before.
//
// The correct split:
//   - Navigations (index.html): NETWORK FIRST. The shell decides which chunk
//     hashes are current, so it must never be served stale while online. The
//     cached copy is only an offline fallback.
//   - /assets/*: CACHE FIRST. Vite content-hashes these filenames, so a cached
//     entry can never be wrong — a new shell references new names.
//   - Everything else same-origin (icons, manifest): network first, cache as
//     offline fallback.
//
// Bumping the cache name discards every cache written by the old worker.
const CACHE = "cardchamps-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // API traffic (Supabase) is cross-origin and must never be cached here.
  if (url.origin !== self.location.origin) return;

  // Immutable, content-hashed build output: cache first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        const res = await fetch(event.request);
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      })
    );
    return;
  }

  // The shell and everything else: network first, cache purely as an offline
  // fallback so a previously visited app still opens on a plane.
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      try {
        const res = await fetch(event.request);
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        // A navigation with no cached page at all: fall back to the cached
        // shell if we have one.
        if (event.request.mode === "navigate") {
          const shell = await cache.match("/");
          if (shell) return shell;
        }
        throw new Error("offline and uncached");
      }
    })
  );
});
