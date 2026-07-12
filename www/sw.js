/* SPURANA service worker — auto-generated. build feff0a19 */
const CACHE = "spurana-feff0a19";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
const BYPASS = [/supabase\.co/, /\/realtime\//, /youtube\.com/, /youtube-nocookie\.com/, /ytimg\.com/, /googlevideo\.com/];
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (BYPASS.some((re) => re.test(url.href))) return;                 // realtime/auth/media/video → always live
  if (req.mode === "navigate") {                                       // app shell: fresh when online, cached when not
    e.respondWith(fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put("./index.html", r.clone())); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r && r.status === 200 && (url.origin === location.origin || /gstatic|googleapis|jsdelivr/.test(url.host))) {
      const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp));
    }
    return r;
  }).catch(() => hit)));
});
