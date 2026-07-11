/* ============================================================
 * SPURANA · world/backdrop.js — applies environments + the
 * "World & Atmosphere" settings screen. Owns window.World.
 * ============================================================ */
(function () {
  "use strict";
  const KEY = "spurana.scene";
  let cur = null;

  function norm(e) { return Array.isArray(e) ? { key: e[0], name: e[1], icon: e[2], hue: e[3], accent: e[4], deep: e[5], sound: e[6] } : e; }
  function list() { return (window.ENVIRONMENTS || []).map(norm); }
  function gradient(e) {
    return "radial-gradient(125% 65% at 50% 120%, rgba(" + e.accent + ",0.16), transparent 62%)," +
      "radial-gradient(150% 80% at 50% -25%, rgba(" + e.accent + ",0.05), transparent 52%)," + e.deep;
  }
  function byKey(k) { return list().find((e) => e.key === k) || list()[0]; }
  function lite() { return document.documentElement.getAttribute("data-perf") === "lite"; }
  function bgLayer() {
    let el = document.getElementById("worldbg");
    if (!el) { el = H.el("div", { id: "worldbg" }); (document.body || document.documentElement).appendChild(el); }
    return el;
  }
  function apply(key, opts) {
    const e = byKey(key); if (!e) return; const changing = !cur || cur.key !== e.key; cur = e;
    document.documentElement.setAttribute("data-env", e.key);
    bgLayer().style.background = lite() ? e.deep : gradient(e);
    window.__envHue = e.hue; window.__envAccent = e.accent; window.__envKey = e.key;
    const cv = document.getElementById("cosmicCanvas");
    if (cv && changing && !lite()) { cv.style.transition = "opacity 1s ease"; cv.style.opacity = "0"; setTimeout(function () { try { if (window.startCosmos) window.startCosmos(); } catch (x) {} cv.style.opacity = ""; }, 650); }
    else { try { if (window.startCosmos) window.startCosmos(); } catch (x) {} }
    try { if (window.Ambient) Ambient.setPreset(e.sound); } catch (x) {}
    if (!(opts && opts.silent)) { try { localStorage.setItem(KEY, key); } catch (x) {} }
  }
  function saved() { try { return localStorage.getItem(KEY) || "cosmos"; } catch (e) { return "cosmos"; } }
  function init() {
    bgLayer();
    if (window.TimeWorld && TimeWorld.isOn()) TimeWorld.applyNow();
    else apply(saved(), { silent: true });
  }

  window.World = { apply, init, hue: () => (cur ? cur.hue : 320), current: () => cur, saved };

  function toggleRow(label, desc, get, set) {
    const knob = H.el("span", { class: "tg-knob" });
    const tg = H.el("button", { class: "tg" + (get() ? " on" : ""), onClick: () => { const v = !tg.classList.contains("on"); tg.classList.toggle("on", v); set(v); } }, knob);
    return H.el("div", { class: "card row spread" }, [H.el("div", null, [H.el("div", { class: "zc-title", style: "font-size:16px" }, label), H.el("div", { class: "zc-desc" }, desc)]), tg]);
  }

  Router.register("world", function (root) {
    root.appendChild(topBar({ title: "World & Atmosphere", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    body.appendChild(H.el("div", { class: "f-label" }, "Scene"));
    const chips = H.el("div", { class: "chips" }, list().map((e) => H.el("button", {
      class: "chip" + (cur && cur.key === e.key ? " on" : ""), "data-k": e.key,
      onClick: () => { if (window.TimeWorld && TimeWorld.isOn()) { toast("Turn off Time Worlds to choose a scene."); return; } apply(e.key); Array.from(chips.children).forEach((c) => c.classList.toggle("on", c.getAttribute("data-k") === e.key)); try { if (window.Ambient) { Ambient.setPreset(e.sound); Ambient.enable(true); } } catch (x) {} },
    }, e.icon + "  " + e.name)));
    body.appendChild(chips);

    body.appendChild(toggleRow("Time Worlds", "The scene shifts with the hour \u2014 dawn, day, dusk, night.",
      () => window.TimeWorld && TimeWorld.isOn(),
      (v) => { if (window.TimeWorld) TimeWorld.enable(v); if (!v) apply(saved(), { silent: true }); }));

    body.appendChild(toggleRow("Ambient Sound", "A gentle generative soundscape for the current scene.",
      () => window.Ambient && Ambient.isOn(),
      (v) => { if (window.Ambient) { Ambient.enable(v); if (v && cur) Ambient.setPreset(cur.sound); } }));
    const vol = H.el("input", { type: "range", min: "0", max: "1", step: "0.01", value: String(window.Ambient ? Ambient.vol() : 0.3), class: "slider", oninput: (ev) => { if (window.Ambient) Ambient.setVolume(parseFloat(ev.target.value)); } });
    body.appendChild(H.el("div", { class: "card" }, [H.el("div", { class: "f-label" }, "Ambient volume"), vol]));

    body.appendChild(toggleRow("Live Weather", "Reflect your local sky \u2014 rain, snow or storm drift over the scene.",
      () => window.Weather && Weather.isOn(),
      (v) => { if (window.Weather) Weather.enable(v); }));

    body.appendChild(toggleRow("Notifications", "Be told when your beloved writes while you're away.",
      () => window.Notify && Notify.isOn(),
      async (v) => { if (v && window.Notify) { const ok = await Notify.enable(); if (!ok) toast("Allow notifications in your browser to enable."); } }));

    return {};
  });
})();
