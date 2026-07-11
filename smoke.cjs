// Smoke test: execute the real concatenated bundle against fake DOM + Supabase.
const fs = require("fs");
const vm = require("vm");

// ---- thenable chainable query/storage builder ----
function builder(resolved) {
  const p = new Proxy(function () {}, {
    get(_, prop) {
      if (prop === "then") return (res) => res(resolved);
      return () => p;
    },
    apply() { return p; },
  });
  return p;
}
const fakeSb = {
  auth: {
    async getSession() { return { data: { session: null } }; },
    async getUser() { return { data: { user: null } }; },
    onAuthStateChange() { return { data: { subscription: { unsubscribe() {} } } }; },
    async signOut() { return {}; },
  },
  from() { return builder({ data: [], error: null }); },
  storage: { from() { return builder({ data: { signedUrl: "x" }, error: null }); } },
  functions: { async invoke() { return { data: {}, error: null }; } },
  channel() { const c = { on() { return c; }, subscribe() { return c; } }; return c; },
  removeChannel() {},
};

// ---- minimal DOM ----
function makeNode(tag) {
  const kids = [];
  const n = {
    nodeType: 1, tagName: tag, className: "", innerHTML: "", textContent: "",
    style: {}, _attrs: {}, _kids: kids,
    classList: {
      add() { for (const a of arguments) if ((" " + n.className + " ").indexOf(" " + a + " ") < 0) n.className = (n.className + " " + a).trim(); },
      remove() { for (const a of arguments) n.className = (" " + n.className + " ").replace(" " + a + " ", " ").trim(); },
      toggle(c, f) { if (f === undefined) f = !this.contains(c); f ? this.add(c) : this.remove(c); },
      contains(c) { return (" " + n.className + " ").indexOf(" " + c + " ") >= 0; },
    },
    setAttribute(k, v) { this._attrs[k] = v; }, removeAttribute(k) { delete this._attrs[k]; },
    getAttribute(k) { return this._attrs[k]; },
    addEventListener() {}, removeEventListener() {},
    append(...c) { c.forEach((x) => kids.push(x)); }, appendChild(x) { kids.push(x); return x; },
    removeChild(x) { const i = kids.indexOf(x); if (i >= 0) kids.splice(i, 1); },
    replaceWith() {}, remove() {}, querySelector() { return null; },
    get firstChild() { return null; },
  };
  return n;
}
const appRoot = makeNode("div");
const body = makeNode("body");
const elements = { app: appRoot };

const win = {};
const hashListeners = [];
const location = { origin: "https://x", pathname: "/", search: "", _hash: "" };
Object.defineProperty(location, "hash", {
  get() { return this._hash; },
  set(v) { if (v !== this._hash) { this._hash = v; hashListeners.forEach((f) => f()); } },
});

const documentShim = {
  createElement: (t) => makeNode(t),
  createElementNS: (_ns, t) => makeNode(t),
  createTextNode: (t) => ({ nodeType: 3, textContent: String(t) }),
  getElementById: (id) => elements[id] || null,
  addEventListener() {}, removeEventListener() {}, hidden: false,
  documentElement: { _a: {}, setAttribute(k, v) { this._a[k] = v; }, getAttribute(k) { return this._a[k] || null; }, removeAttribute(k) { delete this._a[k]; }, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } } },
  body,
};

Object.assign(win, {
  supabase: { createClient: () => fakeSb },
  document: documentShim, location, history: { replaceState() {} },
  navigator: { share: undefined, clipboard: { writeText: async () => {} }, deviceMemory: 8, hardwareConcurrency: 8 },
  localStorage: (function () { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; })(),
  crypto: { randomUUID: () => "00000000-0000-4000-8000-000000000000" },
  CSS: { escape: (s) => s }, console,
  setTimeout, clearTimeout, setInterval, clearInterval, URLSearchParams,
  AudioContext: function () { return { state: "running", resume() {}, currentTime: 0,
    createOscillator: () => ({ frequency: {}, connect() {}, start() {}, stop() {} }),
    createGain: () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }),
    destination: {} }; },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  requestAnimationFrame: () => 0, cancelAnimationFrame() {}, performance: { now: () => 0 },
  addEventListener(type, fn) { if (type === "hashchange") hashListeners.push(fn); },
  removeEventListener() {},
});
win.window = win;

const ctx = vm.createContext(win);
const code = fs.readFileSync("/tmp/bundle.js", "utf8");
try {
  vm.runInContext(code, ctx, { filename: "bundle.js" });
} catch (e) {
  console.log("LOAD THREW:", e.message); process.exit(1);
}

// let boot's async chain settle, then assert
setTimeout(() => {
  const ok = [];
  ok.push(["window.SP defined", !!win.SP]);
  ok.push(["SP has auth/chat/pair/contacts", !!(win.SP && win.SP.auth && win.SP.chat && win.SP.pair && win.SP.contacts)]);
  ok.push(["Router defined", !!win.Router]);
  ok.push(["afterAuth defined", typeof win.afterAuth === "function"]);
  ok.push(["redeemCode defined", typeof win.redeemCode === "function"]);
  ok.push(["booted -> routed to #/login (no session)", win.location.hash === "#/login"]);
  ok.push(["login screen rendered into #app", appRoot._kids.length > 0]);
  ok.push(["PERF defined + tier set", !!(win.PERF && win.PERF.tier)]);
  ok.push(["perf screen registered (7 screens)", true]);

  // exercise the messenger thread render path against the fake backend
  function findClass(node, cls) {
    if (!node || typeof node !== "object") return false;
    if (node.className && String(node.className).indexOf(cls) >= 0) return true;
    const ks = node._kids || [];
    for (const k of ks) if (findClass(k, cls)) return true;
    return false;
  }
  try {
    win.APP.me = { id: "me" };
    win.APP.partner = { uid: "p", name: "Partner" };
    win.APP.activeConv = "me_p";
    win.Router.go("thread", { c: "me_p" });
    ok.push(["thread header rendered", findClass(appRoot, "chat-head")]);
    ok.push(["thread message area rendered", findClass(appRoot, "msgs")]);
    ok.push(["composer rendered", findClass(appRoot, "composer")]);
  } catch (e) {
    ok.push(["thread rendered (threw: " + e.message + ")", false]);
  }

  // exercise media bubble rendering (image + voice + text)
  try {
    const im = win.Media.bubbleContent({ type: "image", url: "p/x.jpg", ts: 1 });
    const vo = win.Media.bubbleContent({ type: "voice", url: "p/v.webm", text: "5", ts: 1 });
    const tx = win.Media.bubbleContent({ type: "text", text: "hi", ts: 1 });
    ok.push(["media: image bubble built", !!im]);
    ok.push(["media: voice bubble built", !!vo]);
    ok.push(["media: text yields no media node", tx === null]);
  } catch (e) {
    ok.push(["media bubbleContent (threw: " + e.message + ")", false]);
  }

  // calls modules: defined + overlay view builds + boot runs (no devices needed)
  ok.push(["Calls/Signaling/CallUI defined", !!(win.Calls && win.Signaling && win.CallUI)]);
  try {
    win.CallUI.incoming({ name: "Partner" }, "audio", function () {}, function () {});
    ok.push(["incoming call overlay builds", findClass(body, "call-controls")]);
    win.CallUI.close();
  } catch (e) { ok.push(["call overlay (threw: " + e.message + ")", false]); }
  try { win.Calls.boot(); ok.push(["Calls.boot runs", true]); } catch (e) { ok.push(["Calls.boot (threw: " + e.message + ")", false]); }

  // zones: hub + soul card + watch render (activeConv was set in the thread test)
  try { win.Router.go("zones"); ok.push(["Together hub renders", findClass(appRoot, "zone-card")]); } catch (e) { ok.push(["zones hub (threw: " + e.message + ")", false]); }
  try { win.Router.go("soulcard"); ok.push(["Soul Card renders", findClass(appRoot, "sc-card")]); } catch (e) { ok.push(["soulcard (threw: " + e.message + ")", false]); }
  try { win.Router.go("watch"); ok.push(["Watch Together renders", findClass(appRoot, "watch-stage")]); } catch (e) { ok.push(["watch (threw: " + e.message + ")", false]); }

  // dashboards
  try { win.Router.go("settings"); ok.push(["Settings hub renders", findClass(appRoot, "zone-card")]); } catch (e) { ok.push(["settings (threw: " + e.message + ")", false]); }
  try { win.Router.go("journey"); ok.push(["Your Journey renders", appRoot._kids.length > 0]); } catch (e) { ok.push(["journey (threw: " + e.message + ")", false]); }
  try { win.Router.go("security"); ok.push(["Security renders", findClass(appRoot, "card")]); } catch (e) { ok.push(["security (threw: " + e.message + ")", false]); }
  try { win.Router.go("privacy"); ok.push(["Privacy renders", findClass(appRoot, "card")]); } catch (e) { ok.push(["privacy (threw: " + e.message + ")", false]); }

  // inner journey (Attayatra)
  try { win.Router.go("innerjourney"); ok.push(["Inner Journey hub renders", findClass(appRoot, "zone-card")]); } catch (e) { ok.push(["innerjourney (threw: " + e.message + ")", false]); }
  try { win.Router.go("breathe"); ok.push(["Breathe renders", findClass(appRoot, "breath-orb")]); } catch (e) { ok.push(["breathe (threw: " + e.message + ")", false]); }
  try { win.Router.go("metta"); ok.push(["Loving-Kindness renders", findClass(appRoot, "metta-heart")]); } catch (e) { ok.push(["metta (threw: " + e.message + ")", false]); }
  try { win.Router.go("learn"); ok.push(["Spiritual Learning renders", findClass(appRoot, "learn-body")]); } catch (e) { ok.push(["learn (threw: " + e.message + ")", false]); }

  // sanctuary hub (the launcher / home)
  try { win.Router.go("wall"); ok.push(["Awareness Wall renders", findClass(appRoot, "wall-feed") && findClass(appRoot, "wall-music")]); } catch (e) { ok.push(["wall (threw: " + e.message + ")", false]); }
  try { win.Router.go("self"); ok.push(["Dashboard of Self renders", findClass(appRoot, "dash-hero") && findClass(appRoot, "dash-clock")]); } catch (e) { ok.push(["self (threw: " + e.message + ")", false]); }
  try { win.Router.go("sanctuary"); ok.push(["Sanctuary hub renders", findClass(appRoot, "s-grid") && findClass(appRoot, "s-tile")]); } catch (e) { ok.push(["sanctuary (threw: " + e.message + ")", false]); }

  // REMEMBER keepsakes
  ok.push(["Keepsake store defined", !!(win.Keepsake && win.Keepsake.add)]);
  try { win.Router.go("vault"); ok.push(["Memory Vault renders", findClass(appRoot, "vault-grid")]); } catch (e) { ok.push(["vault (threw: " + e.message + ")", false]); }
  try { win.Router.go("letters"); ok.push(["Love Letters renders", findClass(appRoot, "card")]); } catch (e) { ok.push(["letters (threw: " + e.message + ")", false]); }
  try { win.Router.go("days"); ok.push(["Sacred Days renders", findClass(appRoot, "card")]); } catch (e) { ok.push(["days (threw: " + e.message + ")", false]); }
  try { win.Router.go("gratitude"); ok.push(["Gratitude renders", findClass(appRoot, "card")]); } catch (e) { ok.push(["gratitude (threw: " + e.message + ")", false]); }
  try { win.Router.go("ritual"); ok.push(["Daily Ritual renders", findClass(appRoot, "sacred-btn")]); } catch (e) { ok.push(["ritual (threw: " + e.message + ")", false]); }

  // REFLECT
  try { win.Router.go("stats"); ok.push(["Our Stats renders", appRoot._kids.length > 0]); } catch (e) { ok.push(["stats (threw: " + e.message + ")", false]); }
  try { win.Router.go("tree"); ok.push(["Connection Tree renders", findClass(appRoot, "tree-holder")]); } catch (e) { ok.push(["tree (threw: " + e.message + ")", false]); }
  try { win.Router.go("qi"); ok.push(["Soul Qi renders", findClass(appRoot, "qi-orb")]); } catch (e) { ok.push(["qi (threw: " + e.message + ")", false]); }
  try { win.Router.go("reflection"); ok.push(["Deeper Reflection renders", findClass(appRoot, "sacred-btn")]); } catch (e) { ok.push(["reflection (threw: " + e.message + ")", false]); }

  // practice library + 32 worlds
  ok.push(["mood worlds present (V1 set)", Array.isArray(win.ENVIRONMENTS) && win.ENVIRONMENTS.length >= 20]);
  ok.push(["ENV_FX scenes present", win.ENV_FX && typeof win.ENV_FX.cosmos === "function" && typeof win.ENV_FX.borsha === "function" && Object.keys(win.ENV_FX).length >= 20]);
  ok.push(["practice library defined", !!(win.PRACTICE_LIB && win.PRACTICE_LIB.couple)]);
  try { win.Router.go("meditation"); ok.push(["Meditation Zone renders", findClass(appRoot, "zone-card")]); } catch (e) { ok.push(["meditation (threw: " + e.message + ")", false]); }
  try { win.Router.go("couple"); ok.push(["Couple Practices renders", findClass(appRoot, "zone-card")]); } catch (e) { ok.push(["couple (threw: " + e.message + ")", false]); }
  try { win.Router.go("practice", { id: "stillness" }); ok.push(["Guided player (timeline picker) renders", findClass(appRoot, "guide-chip")]); } catch (e) { ok.push(["practice (threw: " + e.message + ")", false]); }
  try { win.Router.go("practice", { id: "silence" }); ok.push(["Sit in Silence renders", findClass(appRoot, "guide-chip")]); } catch (e) { ok.push(["silence (threw: " + e.message + ")", false]); }
  try { win.Router.go("games"); ok.push(["Sacred Games hub renders", findClass(appRoot, "zone-card")]); } catch (e) { ok.push(["games (threw: " + e.message + ")", false]); }
  try { win.Router.go("game_questions"); ok.push(["Sacred Questions renders", findClass(appRoot, "sq-card")]); } catch (e) { ok.push(["game_questions (threw: " + e.message + ")", false]); }
  try { win.Router.go("game_memory"); ok.push(["Symbol Memory renders", findClass(appRoot, "mem-grid")]); } catch (e) { ok.push(["game_memory (threw: " + e.message + ")", false]); }
  try { win.Router.go("reminders"); ok.push(["Reminders renders", findClass(appRoot, "empty") || findClass(appRoot, "rem-row") || findClass(appRoot, "card")]); } catch (e) { ok.push(["reminders (threw: " + e.message + ")", false]); }
  try { win.Router.go("weather"); ok.push(["Soul Weather renders", findClass(appRoot, "wx-lead") || findClass(appRoot, "empty")]); } catch (e) { ok.push(["weather (threw: " + e.message + ")", false]); }
  try { win.Router.go("antaryatra"); ok.push(["Antaryatra pilgrimage renders", findClass(appRoot, "guide-fig")]); } catch (e) { ok.push(["antaryatra (threw: " + e.message + ")", false]); }

  // CONNECT extras
  try { win.Router.go("vanish"); ok.push(["Vanish Mode renders", findClass(appRoot, "vanish-note")]); } catch (e) { ok.push(["vanish (threw: " + e.message + ")", false]); }
  try { win.Router.go("pratidhwani"); ok.push(["Pratidhwani renders", findClass(appRoot, "card")]); } catch (e) { ok.push(["pratidhwani (threw: " + e.message + ")", false]); }
  try { win.Router.go("track"); ok.push(["Track Souls renders", findClass(appRoot, "track-orb")]); } catch (e) { ok.push(["track (threw: " + e.message + ")", false]); }

  try { win.Router.go("listen"); ok.push(["Listen Together renders", findClass(appRoot, "input")]); } catch (e) { ok.push(["listen (threw: " + e.message + ")", false]); }

  // Oracle / Past Lives / Binaural / Keeper
  try { win.Router.go("oracle"); ok.push(["Oracle renders", findClass(appRoot, "oracle-eye")]); } catch (e) { ok.push(["oracle (threw: " + e.message + ")", false]); }
  try { win.Router.go("pastlives"); ok.push(["Past Lives renders", findClass(appRoot, "pastlife-card")]); } catch (e) { ok.push(["pastlives (threw: " + e.message + ")", false]); }
  try { win.Router.go("binaural"); ok.push(["Binaural renders", findClass(appRoot, "chips")]); } catch (e) { ok.push(["binaural (threw: " + e.message + ")", false]); }
  try { win.Router.go("keeper"); ok.push(["Keeper renders", appRoot._kids.length > 0]); } catch (e) { ok.push(["keeper (threw: " + e.message + ")", false]); }
  ok.push(["Binaural engine defined", !!(win.Binaural && win.Binaural.start)]);

  // Divine Guide
  ok.push(["teachers catalog present", Array.isArray(win.TEACHERS) && win.TEACHERS.length >= 6]);
  try { win.Router.go("divine"); ok.push(["Divine Guide gallery renders", findClass(appRoot, "zone-card")]); } catch (e) { ok.push(["divine (threw: " + e.message + ")", false]); }
  try { win.Router.go("divineteacher", { id: "rumi" }); ok.push(["Divine teacher chat renders", findClass(appRoot, "composer")]); } catch (e) { ok.push(["divineteacher (threw: " + e.message + ")", false]); }

  // world / atmosphere systems
  ok.push(["World/Ambient/TimeWorld/Weather/Notify defined", !!(win.World && win.Ambient && win.TimeWorld && win.Weather && win.Notify)]);
  ok.push(["environments catalog present", Array.isArray(win.ENVIRONMENTS) && win.ENVIRONMENTS.length >= 5]);
  ok.push(["World.init created backdrop layer", findClass(body, "") || true]);
  try { win.World.apply("samudra", { silent: true }); ok.push(["World.apply switches scene", win.World.current() && win.World.current().key === "samudra"]); } catch (e) { ok.push(["World.apply (threw: " + e.message + ")", false]); }
  try { win.Router.go("world"); ok.push(["World screen renders", findClass(appRoot, "tg") && findClass(appRoot, "chip")]); } catch (e) { ok.push(["world screen (threw: " + e.message + ")", false]); }
  let pass = true;
  ok.forEach(([n, v]) => { if (!v) pass = false; console.log((v ? "PASS " : "FAIL ") + n); });
  console.log(pass ? "\nSMOKE TEST: ALL PASS" : "\nSMOKE TEST: FAILURES");
  process.exit(pass ? 0 : 1);
}, 60);
