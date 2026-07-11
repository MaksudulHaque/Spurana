/* ============================================================
 * SPURANA · remember/keepsakes.js — the REMEMBER section.
 * Memory Vault · Love Letters · Sacred Days · Gratitude · Ritual.
 * All couple-shared, stored via Keepsake (messages table).
 * ============================================================ */
(function () {
  "use strict";

  function relDay(ts) {
    const d = new Date(Number(ts));
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
  function needConv() { if (!APP.activeConv) { Router.go("chat"); return null; } return APP.activeConv; }

  // ── Memory Vault ──
  Router.register("vault", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Memory Vault", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    const caption = H.el("input", { class: "input", placeholder: "A caption for this memory\u2026" });
    const addBtn = H.el("button", { class: "btn btn-primary", onClick: pick }, "Add photo \uD83D\uDCF7");
    body.appendChild(H.el("div", { class: "card stack" }, [H.el("div", { class: "f-label" }, "Keep a memory"), caption, addBtn]));
    const grid = H.el("div", { class: "vault-grid" });
    body.appendChild(grid);
    const empty = H.el("div", { class: "empty" }, [H.el("div", { class: "big" }, "\uD83D\uDC9E"), H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "Your shared memories will gather here.")]);
    body.appendChild(empty);

    function tile(m) {
      const img = H.el("img", { class: "photo loading", alt: "memory" });
      SP.media.signedUrl(m.url).then((r) => { if (r && r.data) { img.src = r.data; img.classList.remove("loading"); } });
      img.addEventListener("click", () => { if (img.src && window.Media) Media.lightbox(img.src); });
      return H.el("div", { class: "vault-card" }, [img, H.el("div", { class: "vault-cap" }, m.text || ""), H.el("div", { class: "vault-date" }, relDay(m.ts))]);
    }
    function render(items) { H.clear(grid); empty.classList.toggle("hidden", items.length > 0); items.forEach((m) => grid.appendChild(tile(m))); }

    function pick() {
      const input = H.el("input", { type: "file", accept: "image/*", style: "display:none" });
      document.body.appendChild(input);
      input.addEventListener("change", async () => {
        const f = input.files && input.files[0]; input.remove(); if (!f) return;
        addBtn.setAttribute("disabled", "true"); addBtn.textContent = "Keeping\u2026";
        const up = await SP.media.upload(conv, f);
        if (up.error || !up.data) { toast("Couldn't save.", true); addBtn.removeAttribute("disabled"); addBtn.textContent = "Add photo \uD83D\uDCF7"; return; }
        const m = await Keepsake.add(conv, "memory", { url: up.data.path, text: caption.value.trim() });
        addBtn.removeAttribute("disabled"); addBtn.textContent = "Add photo \uD83D\uDCF7"; caption.value = "";
        if (m) { grid.insertBefore(tile(m), grid.firstChild); empty.classList.add("hidden"); toast("Memory kept \u2726"); }
      });
      input.click();
    }

    let ch = null;
    (async () => { render(await Keepsake.list(conv, "memory")); ch = Keepsake.subscribe(conv, "memory", (m) => { if (m.uid !== (APP.me && APP.me.id)) { grid.insertBefore(tile(m), grid.firstChild); empty.classList.add("hidden"); } }); })();
    return { teardown() { Keepsake.unsub(ch); } };
  });

  // ── Love Letters ──
  Router.register("letters", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Love Letters", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    const ta = H.el("textarea", { class: "input", rows: "4", placeholder: "Pour your heart onto the page\u2026", style: "resize:none" });
    const seal = H.el("button", { class: "btn btn-primary btn-block", onClick: write }, "Seal & send \u2726");
    body.appendChild(H.el("div", { class: "card stack" }, [H.el("div", { class: "f-label" }, "Write a letter"), ta, seal]));
    const listEl = H.el("div", { class: "stack" });
    body.appendChild(listEl);
    const empty = H.el("div", { class: "empty" }, [H.el("div", { class: "big" }, "\uD83D\uDC8C"), H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "Letters you write each other live here, always.")]);
    body.appendChild(empty);

    function card(m) {
      const mine = m.uid === (APP.me && APP.me.id);
      return H.el("div", { class: "letter" + (mine ? " mine" : "") }, [
        H.el("div", { class: "letter-body" }, m.text || ""),
        H.el("div", { class: "letter-sign" }, "\u2014 " + (m.name || (mine ? "You" : "Your beloved")) + " \u00b7 " + relDay(m.ts)),
      ]);
    }
    function render(items) { H.clear(listEl); empty.classList.toggle("hidden", items.length > 0); items.forEach((m) => listEl.appendChild(card(m))); }
    async function write() {
      const t = ta.value.trim(); if (!t) return;
      seal.setAttribute("disabled", "true");
      const m = await Keepsake.add(conv, "letter", { text: t });
      seal.removeAttribute("disabled");
      if (m) { ta.value = ""; listEl.insertBefore(card(m), listEl.firstChild); empty.classList.add("hidden"); toast("Sealed \u2726"); }
      else toast("Couldn't send.", true);
    }
    let ch = null;
    (async () => { render(await Keepsake.list(conv, "letter")); ch = Keepsake.subscribe(conv, "letter", (m) => { if (m.uid !== (APP.me && APP.me.id)) { listEl.insertBefore(card(m), listEl.firstChild); empty.classList.add("hidden"); } }); })();
    return { teardown() { Keepsake.unsub(ch); } };
  });

  // ── Sacred Days ──
  Router.register("days", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Sacred Days", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    const title = H.el("input", { class: "input", placeholder: "What day? (anniversary, first kiss\u2026)" });
    const date = H.el("input", { class: "input", type: "date" });
    const addBtn = H.el("button", { class: "btn btn-primary btn-block", onClick: add }, "Mark this day \u2726");
    body.appendChild(H.el("div", { class: "card stack" }, [H.el("div", { class: "f-label" }, "A day to remember"), title, date, addBtn]));
    const listEl = H.el("div", { class: "stack" });
    body.appendChild(listEl);
    const empty = H.el("div", { class: "empty" }, [H.el("div", { class: "big" }, "\uD83D\uDDD3"), H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "The days that matter \u2014 with you both, counting toward them.")]);
    body.appendChild(empty);

    function parse(m) { try { const o = JSON.parse(m.text); return { t: o.t, d: o.d }; } catch (e) { return { t: m.text || "", d: null }; } }
    function countdown(dStr) {
      if (!dStr) return "";
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const target = new Date(dStr + "T00:00:00");
      const anni = new Date(target); anni.setFullYear(today.getFullYear());
      if (anni < today) anni.setFullYear(today.getFullYear() + 1);
      const days = Math.round((anni - today) / 86400000);
      if (days === 0) return "Today \u2726"; if (days === 1) return "Tomorrow";
      return "in " + days + " days";
    }
    function card(m) { const o = parse(m); return H.el("div", { class: "card row spread" }, [H.el("div", null, [H.el("div", { class: "zc-title", style: "font-size:17px" }, o.t), H.el("div", { class: "zc-desc" }, o.d ? new Date(o.d + "T00:00:00").toLocaleDateString([], { month: "long", day: "numeric" }) : "")]), H.el("div", { class: "day-count" }, countdown(o.d))]); }
    function sortItems(items) { return items.map((m) => ({ m: m, c: parse(m) })).sort((a, b) => (a.c.d || "").localeCompare(b.c.d || "")).map((x) => x.m); }
    function render(items) { H.clear(listEl); empty.classList.toggle("hidden", items.length > 0); sortItems(items).forEach((m) => listEl.appendChild(card(m))); }
    async function add() {
      const t = title.value.trim(); if (!t) { toast("Name the day."); return; } if (!date.value) { toast("Pick a date."); return; }
      const m = await Keepsake.add(conv, "sacred_day", { text: JSON.stringify({ t: t, d: date.value }) });
      if (m) { title.value = ""; date.value = ""; listEl.appendChild(card(m)); empty.classList.add("hidden"); toast("Marked \u2726"); }
      else toast("Couldn't save.", true);
    }
    let ch = null;
    (async () => { render(await Keepsake.list(conv, "sacred_day")); ch = Keepsake.subscribe(conv, "sacred_day", (m) => { if (m.uid !== (APP.me && APP.me.id)) { listEl.appendChild(card(m)); empty.classList.add("hidden"); } }); })();
    return { teardown() { Keepsake.unsub(ch); } };
  });

  // ── Gratitude ──
  Router.register("gratitude", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Gratitude", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);
    const inp = H.el("input", { class: "input", placeholder: "Today I'm grateful for\u2026" });
    const addBtn = H.el("button", { class: "btn btn-primary", onClick: add }, "Add");
    body.appendChild(H.el("div", { class: "card" }, [H.el("div", { class: "f-label" }, "A note of gratitude"), H.el("div", { class: "row", style: "gap:8px" }, [inp, addBtn])]));
    const listEl = H.el("div", { class: "stack" });
    body.appendChild(listEl);
    const empty = H.el("div", { class: "empty" }, [H.el("div", { class: "big" }, "\uD83C\uDF1F"), H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic" }, "Small thanks, gathered between two hearts.")]);
    body.appendChild(empty);
    function card(m) { return H.el("div", { class: "card" }, [H.el("div", { style: "font-family:var(--f-soul);font-size:17px;color:var(--text)" }, m.text || ""), H.el("div", { class: "zc-desc", style: "margin-top:4px" }, (m.name || "") + " \u00b7 " + relDay(m.ts))]); }
    function render(items) { H.clear(listEl); empty.classList.toggle("hidden", items.length > 0); items.forEach((m) => listEl.appendChild(card(m))); }
    async function add() { const t = inp.value.trim(); if (!t) return; const m = await Keepsake.add(conv, "gratitude", { text: t }); if (m) { inp.value = ""; listEl.insertBefore(card(m), listEl.firstChild); empty.classList.add("hidden"); } else toast("Couldn't save.", true); }
    let ch = null;
    (async () => { render(await Keepsake.list(conv, "gratitude")); ch = Keepsake.subscribe(conv, "gratitude", (m) => { if (m.uid !== (APP.me && APP.me.id)) { listEl.insertBefore(card(m), listEl.firstChild); empty.classList.add("hidden"); } }); })();
    return { teardown() { Keepsake.unsub(ch); } };
  });

  // ── Daily Ritual / Today ──
  const PROMPTS = ["What are you grateful for today?", "What moment with your beloved do you want to keep?", "What do you wish for them today?", "What did you learn about love today?"];
  Router.register("ritual", function (root) {
    const conv = needConv(); if (!conv) return {};
    root.appendChild(topBar({ title: "Daily Ritual", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal", style: "align-items:center" });
    root.appendChild(body);
    const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    body.appendChild(H.el("div", { class: "center", style: "font-family:var(--f-tech);font-size:12px;letter-spacing:.2em;color:var(--gold)" }, today.toUpperCase()));
    const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];
    body.appendChild(H.el("p", { class: "center", style: "font-family:var(--f-soul);font-style:italic;font-size:21px;color:#eaccff;max-width:340px" }, prompt));
    const ta = H.el("textarea", { class: "input", rows: "3", placeholder: "Take a breath, and answer\u2026", style: "resize:none;max-width:420px" });
    const keep = H.el("button", { class: "sacred-btn", onClick: async () => { const t = ta.value.trim(); if (!t) return; const m = await Keepsake.add(conv, "gratitude", { text: t }); if (m) { toast("Kept in Gratitude \u2726"); Router.go("gratitude"); } else toast("Couldn't save.", true); } }, "Keep \u2726");
    body.append(ta, keep);
    return {};
  });
})();
