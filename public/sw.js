const VERSION = "sd-v2.0.4";
const SHELL = [
  "/", "/index.html", "/css/app.css", "/js/i18n.js", "/js/store.js", "/js/api.js",
  "/js/gps.js", "/js/photos.js", "/js/map.js", "/js/sync.js", "/js/ui.js", "/js/app.js",
  "/vendor/jsQR.js", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req).catch(() => new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } })));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((res) => {
      if (res && res.status === 200) caches.open(VERSION).then((c) => c.put(req, res.clone()));
      return res;
    }).catch(() => hit || caches.match("/index.html"));
    return hit || net;
  }));
});
