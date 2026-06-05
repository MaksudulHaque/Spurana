/* ============================================================
 * SPURANA · build.mjs
 * Tiny, dependency-free bundler. Concatenates the modular src/
 * into ONE www/index.html (CDN supabase-js stays external).
 *   node build.mjs
 * The MANIFEST below is the single source of truth for load order.
 * ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { minify } from "terser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "src");
const OUT = join(__dirname, "www");

// ---- load order (correct, deterministic) ----
const CSS = ["styles/theme.css", "styles/chat.css", "styles/calls.css", "styles/zones.css"];
const JS = [
  "core/supabase.js",   // SP client — first (after the CDN lib in the shell)
  "core/config.js",
  "core/state.js",
  "core/router.js",
  "core/audio.js",
  "core/perf.js",
  "core/brand.js",
  "world/env_fx.js",
  "core/ambient.js",
  "core/guide.js",
  "inner/antaryatra_fx.js",
  "core/notify.js",
  "core/keepsake.js",
  "core/binaural.js",
  "auth/session.js",
  "auth/signup.js",
  "auth/login.js",
  "pair/invite.js",
  "pair/redeem.js",
  "chat/composer.js",
  "chat/media.js",
  "chat/echoes.js",
  "chat/list.js",
  "chat/thread.js",
  "calls/signaling.js", "calls/engine.js", "calls/ui.js",
  "zones/watch.js", "zones/listen.js", "zones/soulcard.js", "zones/practices.js",
  "games/play.js",
  "dash/journey.js", "dash/security.js", "dash/privacy.js",
  "inner/journey.js",
  "inner/breathe.js",
  "inner/metta.js",
  "inner/learn.js",
  "world/environments.js",
  "world/backdrop.js",
  "world/timeworld.js",
  "world/weather.js",
  "sanctuary/icons.js",
  "sanctuary/hub.js",
  "remember/keepsakes.js",
  "reflect/reflect.js",
  "reflect/weather.js",
  "reflect/reminders.js",
  "practice/library.js",
  "connect/extras.js",
  "oracle/oracle.js",
  "divine/divine.js",
  "dash/self.js",
  "core/boot.js",       // entry point — last
];

const read = (p) => readFileSync(join(SRC, p), "utf8");

// Conservative CSS minify: strip /* */ comments + collapse blank lines.
// (No risky JS regex minification — concatenation + gzip is the real win,
//  and unminified JS keeps stack traces readable while we build.)
function minifyCss(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\n{2,}/g, "\n").trim();
}

// CRITICAL: inline <script>/<style> blocks must not contain a literal
// closing tag, or the HTML parser ends the block early. The SP client's
// header comment includes "</script>" examples — escape the sequence so
// it stays inert text to the parser but identical to JS/CSS at runtime.
const escScript = (s) => s.replace(/<\/(script)/gi, "<\\/$1");
const escStyle = (s) => s.replace(/<\/(style)/gi, "<\\/$1");

const cssBundle = escStyle(CSS.map((f) => "/* " + f + " */\n" + minifyCss(read(f))).join("\n"));
const jsRaw = JS.map((f) => "\n/* ===== " + f + " ===== */\n" + read(f)).join("\n");
let jsMin = jsRaw;
try {
  const r = await minify(jsRaw, { compress: { sequences: true, dead_code: true, conditionals: true, booleans: true, unused: false, join_vars: true }, mangle: false, format: { comments: false } });
  if (r && r.code) jsMin = r.code;
  console.log("[build] minified JS " + (jsRaw.length / 1024).toFixed(0) + "KB -> " + (jsMin.length / 1024).toFixed(0) + "KB");
} catch (e) { console.warn("[build] minify skipped (shipping readable JS):", e.message); }
const jsBundle = escScript(jsMin);

let shell = read("index.shell.html");
shell = shell.replace("/*__STYLES__*/", () => cssBundle);
shell = shell.replace("/*__SCRIPTS__*/", () => jsBundle);

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), shell, "utf8");

// Copy PWA icons into the output.
import { readdirSync, copyFileSync } from "node:fs";
const ICONS = join(__dirname, "icons");
if (existsSync(ICONS)) for (const f of readdirSync(ICONS)) copyFileSync(join(ICONS, f), join(OUT, f));

// Build version (content hash) — invalidates the SW cache on every change.
import { createHash } from "node:crypto";
const VER = createHash("sha1").update(shell).digest("hex").slice(0, 8);

// PWA manifest (install-to-home).
const manifest = {
  name: "Spurana", short_name: "Spurana",
  description: "A sacred space for two souls.",
  start_url: ".", scope: ".", display: "standalone", orientation: "portrait",
  background_color: "#060409", theme_color: "#060409",
  categories: ["social", "lifestyle"],
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

// Service worker — offline shell. Network-first for navigation (so updates land),
// cache-first for static + fonts, and NEVER touch Supabase API / realtime / YouTube.
const sw = `/* SPURANA service worker — auto-generated. build ${VER} */
const CACHE = "spurana-${VER}";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
const BYPASS = [/supabase\\.co/, /\\/realtime\\//, /youtube\\.com/, /youtube-nocookie\\.com/, /ytimg\\.com/, /googlevideo\\.com/];
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
`;
writeFileSync(join(OUT, "sw.js"), sw, "utf8");

const bytes = Buffer.byteLength(shell, "utf8");
console.log("[build] wrote www/index.html  (" + (bytes / 1024).toFixed(1) + " KB)");
console.log("[build] modules: " + JS.length + " js, " + CSS.length + " css");
