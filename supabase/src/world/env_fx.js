/* ============================================================
 * SPURANA · world/env_fx.js — the mood-world scenes.
 * Built on V1's per-world architecture (each world its own
 * draw(ctx,W,H,t)), improvised to a richer grade: layered depth,
 * soft glow, organic multi-frequency motion, atmospheric washes,
 * and a signature gesture per world. Driven at low internal
 * resolution + throttled, so it stays cool.
 * ============================================================ */
(function () {
  "use strict";
  const TAU = Math.PI * 2;
  // stable pseudo-random 0..1 from an index (so star/particle fields don't jitter)
  function rng(i) { const s = Math.sin(i * 127.1 + 11.7) * 43758.5453; return s - Math.floor(s); }
  function glow(ctx, x, y, r, inner, outer) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, inner); g.addColorStop(1, outer); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function wash(ctx, W, H, stops) { const g = ctx.createLinearGradient(0, 0, 0, H); for (const s of stops) g.addColorStop(s[0], s[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function heart(ctx, x, y, s) { ctx.beginPath(); for (let a = 0; a <= TAU + 0.16; a += 0.16) { const px = 16 * Math.pow(Math.sin(a), 3), py = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); const X = x + px * s / 16, Y = y - py * s / 16; a === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y); } ctx.closePath(); }
  const sin = Math.sin, cos = Math.cos, max = Math.max, min = Math.min, abs = Math.abs, PI = Math.PI;

  window.ENV_FX = {

    /* COSMOS — drifting nebulae, depth starfield, a wandering comet */
    cosmos(ctx, W, H, t) {
      for (let i = 0; i < 3; i++) { const hue = [265, 295, 225][i]; glow(ctx, W * (0.28 + 0.22 * i) + sin(t * 0.05 + i) * 40, H * (0.3 + 0.18 * i) + cos(t * 0.04 + i) * 40, W * 0.42, "hsla(" + hue + ",70%,55%,0.07)", "hsla(" + hue + ",70%,55%,0)"); }
      for (let i = 0; i < 90; i++) { const x = rng(i) * W, y = rng(i + 99) * H, z = rng(i + 33), tw = (sin(t * (0.4 + z) + i) + 1) * 0.5, r = 0.5 + z * 1.8; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = "rgba(" + (220 + (z * 35 | 0)) + ",212,255," + (0.3 + tw * 0.6) + ")"; ctx.fill(); if (tw > 0.86 && z > 0.6) glow(ctx, x, y, r * 7, "rgba(205,195,255," + (tw - 0.86) * 0.5 + ")", "rgba(205,195,255,0)"); }
      const ss = (t * 0.05) % 1; if (ss < 0.1) { const p = ss / 0.1, sx = W * 0.12 + p * W * 0.7, sy = H * 0.14 + p * H * 0.32, a = sin(p * PI); ctx.strokeStyle = "rgba(255,250,245," + a * 0.9 + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 70, sy - 34); ctx.stroke(); glow(ctx, sx, sy, 6, "rgba(255,250,245," + a + ")", "rgba(255,250,245,0)"); }
    },

    /* BORSHA — monsoon: blue wash, two rain layers, slant wind, ripples, far lightning */
    borsha(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(18,34,68,0.34)"], [1, "rgba(34,60,112,0.5)"]]);
      const lf = (t * 0.06) % 1; if (lf < 0.035) { ctx.fillStyle = "rgba(180,200,255," + (0.035 - lf) * 4 + ")"; ctx.fillRect(0, 0, W, H); }
      ctx.lineCap = "round";
      for (let layer = 0; layer < 2; layer++) { const cnt = layer ? 150 : 80, spd = layer ? 720 : 430, len = layer ? 18 : 34, op = layer ? 0.32 : 0.62, lw = layer ? 1 : 1.9; ctx.strokeStyle = "rgba(185,212,255," + op + ")"; ctx.lineWidth = lw; for (let i = 0; i < cnt; i++) { const s = i * 7919 + layer * 131, x = (rng(s) * W + t * 16) % W, y = (rng(s + 1) * H + t * spd) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - len * 0.18, y + len); ctx.stroke(); } }
      for (let i = 0; i < 14; i++) { const s = i * 317 + Math.floor(t * 1.2) * 97, rx = rng(s) * W, rr = (t * 55 + s * 13) % 46; ctx.strokeStyle = "rgba(185,212,255," + max(0, 0.5 - rr / 100) + ")"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(rx, H - 9, rr, rr * 0.22, 0, 0, TAU); ctx.stroke(); }
    },

    /* AGNI — fire: pulsing base glow, rising embers with cores + halos, smoke */
    agni(ctx, W, H, t) {
      glow(ctx, W / 2, H, W * 0.7, "rgba(255,100,20," + (0.32 + sin(t * 1.5) * 0.06) + ")", "transparent");
      glow(ctx, W / 2, H, W * 0.42, "rgba(255,170,60,0.25)", "transparent");
      for (let i = 0; i < 70; i++) { const s = i * 6271, life = (rng(s) + t * (0.12 + rng(s + 2) * 0.12)) % 1, x = W * 0.5 + sin(s + t * 0.8) * W * 0.34 * (1 - life), y = H - life * H * 1.05, r = max(0, (1 - life) * 4.5); glow(ctx, x, y, r * 4, "rgba(255," + (200 * (1 - life) | 0) + ",60," + (1 - life) * 0.9 + ")", "transparent"); ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, TAU); ctx.fillStyle = "rgba(255,245,200," + (1 - life) * 0.95 + ")"; ctx.fill(); }
      for (let i = 0; i < 6; i++) { const s = i * 911, life = (rng(s) + t * 0.05) % 1, x = W * 0.5 + sin(s + t * 0.3) * W * 0.2, y = H - life * H; glow(ctx, x, y, 60 * life, "rgba(40,20,10," + (1 - life) * 0.12 + ")", "transparent"); }
    },

    /* SAMUDRA — ocean: depth, moonlit wave lines, glitter path, foam */
    samudra(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(0,28,96,0.22)"], [1, "rgba(0,14,56,0.55)"]]);
      glow(ctx, W * 0.5, H * 0.12, W * 0.3, "rgba(220,235,255,0.18)", "transparent");
      for (let w = 0; w < 11; w++) { ctx.beginPath(); ctx.strokeStyle = "rgba(120,180,255," + (0.2 - w * 0.013) + ")"; ctx.lineWidth = 1.8; for (let x = 0; x <= W; x += 4) { const y = H * (0.36 + w * 0.06) + sin(x * 0.006 + t * (0.4 + w * 0.05)) * 14 + sin(x * 0.009 + t * (0.2 + w * 0.04)) * 8; x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      for (let i = 0; i < 70; i++) { const s = i * 3571, x = W * 0.5 + sin(s) * W * 0.22 + sin(t * 0.3 + i) * 8, y = H * (0.18 + rng(s) * 0.5) + sin(t * 0.5 + i) * 20, gl = (sin(t * 2 + i * 0.7) + 1) * 0.5; ctx.beginPath(); ctx.arc(x, y, 1 + gl * 1.6, 0, TAU); ctx.fillStyle = "rgba(225,240,255," + gl * 0.85 + ")"; ctx.fill(); }
    },

    /* HIMALAYA — snow: cold wash, two depth layers of flakes, ground mist */
    himalaya(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(150,180,220,0.12)"], [1, "rgba(80,110,150,0.2)"]]);
      for (let layer = 0; layer < 2; layer++) { const cnt = layer ? 120 : 70, sp = layer ? 60 : 30, sz = layer ? 2.6 : 1.4, op = layer ? 0.85 : 0.5; for (let i = 0; i < cnt; i++) { const s = i * 5113 + layer * 71, x = (rng(s) * W + sin(t * 0.4 + i) * 24 * (layer + 1)) % W, y = (rng(s + 1) * H + t * sp) % H; ctx.beginPath(); ctx.arc((x + W) % W, y, sz * (0.6 + rng(s + 3) * 0.7), 0, TAU); ctx.fillStyle = "rgba(245,250,255," + op + ")"; ctx.fill(); } }
      glow(ctx, W / 2, H, W * 0.9, "rgba(220,235,255,0.12)", "transparent");
    },

    /* ARANYA — forest: canopy light, god-rays, drifting leaves, glow spores */
    aranya(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(20,60,35,0.28)"], [1, "rgba(8,30,18,0.45)"]]);
      ctx.save(); for (let i = 0; i < 5; i++) { const x = W * (0.1 + i * 0.2) + sin(t * 0.1 + i) * 20; const g = ctx.createLinearGradient(x, 0, x - 40, H); g.addColorStop(0, "rgba(180,230,150," + (0.05 + sin(t * 0.3 + i) * 0.02) + ")"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x - 30, H); ctx.lineTo(x - 90, H); ctx.closePath(); ctx.fill(); } ctx.restore();
      for (let i = 0; i < 30; i++) { const s = i * 4099, y = (rng(s) * H + t * 22) % H, x = rng(s + 1) * W + sin(t * 0.6 + i) * 26, rot = t + i; ctx.save(); ctx.translate((x + W) % W, y); ctx.rotate(rot); ctx.fillStyle = "hsla(" + (90 + rng(s) * 40) + ",50%,45%,0.5)"; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      for (let i = 0; i < 22; i++) { const x = rng(i) * W + sin(t * 0.5 + i) * 18, y = rng(i + 50) * H + cos(t * 0.4 + i) * 18, gl = (sin(t * 1.5 + i) + 1) * 0.5; glow(ctx, x, y, 4 + gl * 4, "rgba(180,255,140," + gl * 0.4 + ")", "transparent"); }
    },

    /* LAVA — molten cracks pulsing, rising sparks, hot base */
    lava(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(20,6,4,0.4)"], [1, "rgba(60,12,6,0.5)"]]);
      glow(ctx, W / 2, H, W * 0.7, "rgba(255,70,20,0.3)", "transparent");
      ctx.lineCap = "round"; for (let i = 0; i < 7; i++) { const s = i * 733, pulse = 0.4 + (sin(t * 1.2 + i) + 1) * 0.3, y0 = rng(s) * H; ctx.strokeStyle = "rgba(255," + (90 + pulse * 80 | 0) + ",30," + pulse + ")"; ctx.lineWidth = 1.5 + pulse * 2; ctx.beginPath(); let x = 0, y = y0; ctx.moveTo(x, y); while (x < W) { x += 24; y = y0 + sin(x * 0.05 + i) * 26; ctx.lineTo(x, y); } ctx.stroke(); glow(ctx, W * rng(s + 1), y0, 30, "rgba(255,120,30," + pulse * 0.4 + ")", "transparent"); }
      for (let i = 0; i < 40; i++) { const s = i * 2917, life = (rng(s) + t * 0.25) % 1, x = rng(s + 1) * W, y = H - life * H; ctx.beginPath(); ctx.arc(x, y, max(0, (1 - life) * 2.2), 0, TAU); ctx.fillStyle = "rgba(255,200,120," + (1 - life) * 0.8 + ")"; ctx.fill(); }
    },

    /* AURORA — layered flowing ribbons over a star field */
    aurora(ctx, W, H, t) {
      for (let i = 0; i < 50; i++) { const x = rng(i) * W, y = rng(i + 9) * H * 0.7; ctx.beginPath(); ctx.arc(x, y, rng(i + 3) * 1.2, 0, TAU); ctx.fillStyle = "rgba(220,230,255," + (0.2 + rng(i + 1) * 0.4) + ")"; ctx.fill(); }
      const cols = [[60, 230, 170], [80, 180, 255], [170, 110, 240]];
      for (let b = 0; b < 3; b++) { const c = cols[b], yb = H * (0.2 + b * 0.16); ctx.beginPath(); ctx.moveTo(0, yb); for (let x = 0; x <= W; x += 14) ctx.lineTo(x, yb + sin(x / 130 + t * (0.5 + b * 0.15) + b) * 36 + sin(x / 47 + t * 0.7) * 12); for (let x = W; x >= 0; x -= 14) ctx.lineTo(x, yb + 110 + sin(x / 90 + t * 0.4 + b) * 20); ctx.closePath(); const g = ctx.createLinearGradient(0, yb - 60, 0, yb + 120); const a = 0.06 + 0.03 * sin(t * 0.6 + b); g.addColorStop(0, "rgba(" + c.join(",") + ",0)"); g.addColorStop(0.4, "rgba(" + c.join(",") + "," + a + ")"); g.addColorStop(1, "rgba(" + c.join(",") + ",0)"); ctx.fillStyle = g; ctx.fill(); }
    },

    /* SANDHYA — dusk: horizon gradient, low sun, drifting clouds, birds */
    sandhya(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(40,30,90,0.4)"], [0.55, "rgba(200,90,70,0.3)"], [1, "rgba(255,160,80,0.4)"]]);
      glow(ctx, W * 0.5, H * 0.72, W * 0.5, "rgba(255,200,120,0.5)", "transparent");
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.72, W * 0.09, 0, TAU); ctx.fillStyle = "rgba(255,230,170,0.85)"; ctx.fill();
      for (let i = 0; i < 5; i++) { const y = H * (0.2 + i * 0.08), x = ((t * (6 + i * 2) + i * 200) % (W + 200)) - 100; glow(ctx, x, y, 70, "rgba(60,40,80,0.14)", "transparent"); }
      ctx.strokeStyle = "rgba(20,10,30,0.5)"; ctx.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const bx = ((t * 14 + i * 90) % (W + 100)) - 50, by = H * (0.3 + i * 0.04), fl = sin(t * 4 + i) * 4; ctx.beginPath(); ctx.moveTo(bx - 7, by + fl); ctx.lineTo(bx, by); ctx.lineTo(bx + 7, by + fl); ctx.stroke(); }
    },

    /* SAKURA — soft pink, falling fluttering petals at depth, bokeh */
    sakura(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(60,20,45,0.25)"], [1, "rgba(40,12,30,0.35)"]]);
      for (let i = 0; i < 16; i++) { const x = rng(i) * W, y = rng(i + 7) * H, gl = (sin(t * 0.8 + i) + 1) * 0.5; glow(ctx, x, y, 16 + gl * 12, "rgba(255,180,210," + (0.05 + gl * 0.05) + ")", "transparent"); }
      for (let i = 0; i < 70; i++) { const s = i * 6131, z = rng(s + 5), y = (rng(s) * H + t * (18 + z * 26)) % H, x = rng(s + 1) * W + sin(t * (0.5 + z) + i) * 30, rot = t * (0.6 + z) + i, sq = 0.4 + 0.6 * abs(sin(rot)); ctx.save(); ctx.translate((x + W) % W, y); ctx.rotate(rot); ctx.scale(1, sq); ctx.fillStyle = "rgba(255," + (170 + z * 40 | 0) + ",205," + (0.4 + z * 0.4) + ")"; ctx.beginPath(); ctx.ellipse(0, 0, 3 + z * 4, (3 + z * 4) * 0.6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    },

    /* PADMA — still water, glowing lotus center, ripples, golden motes */
    padma(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(30,15,45,0.3)"], [1, "rgba(15,8,30,0.45)"]]);
      const cx = W * 0.5, cy = H * 0.55; const pulse = 0.5 + (sin(t * 0.8) + 1) * 0.25;
      glow(ctx, cx, cy, W * 0.28, "rgba(255,150,210," + pulse * 0.25 + ")", "transparent");
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.05, r = W * 0.07 * pulse; ctx.save(); ctx.translate(cx + cos(a) * r, cy + sin(a) * r); ctx.rotate(a); ctx.fillStyle = "rgba(255,180,220,0.5)"; ctx.beginPath(); ctx.ellipse(0, 0, 7, 18, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      for (let i = 0; i < 4; i++) { const rr = ((t * 30 + i * 60) % 180); ctx.strokeStyle = "rgba(255,180,220," + max(0, 0.3 - rr / 600) + ")"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.4, 0, 0, TAU); ctx.stroke(); }
      for (let i = 0; i < 26; i++) { const x = rng(i) * W + sin(t * 0.4 + i) * 16, y = rng(i + 30) * H - (t * 8 % H), gl = (sin(t + i) + 1) * 0.5; glow(ctx, x, (y + H) % H, 3 + gl * 3, "rgba(255,220,150," + gl * 0.4 + ")", "transparent"); }
    },

    /* BAJRA — storm: dark clouds, rain, forked lightning + screen flash */
    bajra(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(15,18,40,0.5)"], [1, "rgba(30,35,70,0.5)"]]);
      ctx.strokeStyle = "rgba(150,170,230,0.4)"; ctx.lineWidth = 1; for (let i = 0; i < 120; i++) { const s = i * 7919, x = (rng(s) * W + t * 20) % W, y = (rng(s + 1) * H + t * 650) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 18); ctx.stroke(); }
      const cyc = (t * 0.5) % 4; if (cyc < 0.18) { const fa = (0.18 - cyc) / 0.18; ctx.fillStyle = "rgba(200,210,255," + fa * 0.5 + ")"; ctx.fillRect(0, 0, W, H); let x = W * (0.3 + rng(Math.floor(t)) * 0.4), y = 0; ctx.strokeStyle = "rgba(230,240,255," + fa + ")"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); while (y < H * 0.7) { y += H * 0.08; x += (rng(Math.floor(t * 9) + y) - 0.5) * 60; ctx.lineTo(x, y); } ctx.stroke(); }
    },

    /* DHOOP — warm light shafts + curling incense smoke + golden motes */
    dhoop(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(60,40,15,0.3)"], [1, "rgba(30,18,6,0.4)"]]);
      ctx.save(); for (let i = 0; i < 4; i++) { const x = W * (0.2 + i * 0.22); const g = ctx.createLinearGradient(x, 0, x - 60, H); g.addColorStop(0, "rgba(255,220,140," + (0.07 + sin(t * 0.3 + i) * 0.02) + ")"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 40, 0); ctx.lineTo(x + 40, 0); ctx.lineTo(x - 60, H); ctx.lineTo(x - 140, H); ctx.closePath(); ctx.fill(); } ctx.restore();
      for (let i = 0; i < 3; i++) { const bx = W * (0.3 + i * 0.2); ctx.strokeStyle = "rgba(220,210,190,0.12)"; ctx.lineWidth = 8; ctx.beginPath(); for (let y = H; y > H * 0.2; y -= 10) { const p = (H - y) / H; ctx.lineTo(bx + sin(y * 0.04 + t + i) * 24 * p, y); } ctx.stroke(); }
      for (let i = 0; i < 28; i++) { const x = rng(i) * W + sin(t * 0.4 + i) * 16, y = (rng(i + 20) * H - t * 10) % H, gl = (sin(t + i) + 1) * 0.5; glow(ctx, x, (y + H) % H, 3 + gl * 3, "rgba(255,210,130," + gl * 0.45 + ")", "transparent"); }
    },

    /* CHANDRA — big soft moon, halo, drifting haze, faint stars */
    chandra(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(10,14,34,0.45)"], [1, "rgba(20,26,54,0.45)"]]);
      for (let i = 0; i < 50; i++) { const x = rng(i) * W, y = rng(i + 9) * H, tw = (sin(t * 0.6 + i) + 1) * 0.5; ctx.beginPath(); ctx.arc(x, y, rng(i + 2) * 1.1, 0, TAU); ctx.fillStyle = "rgba(210,220,255," + (0.2 + tw * 0.4) + ")"; ctx.fill(); }
      const mx = W * 0.66, my = H * 0.32; glow(ctx, mx, my, W * 0.3, "rgba(220,230,255,0.18)", "transparent"); glow(ctx, mx, my, W * 0.12, "rgba(245,248,255,0.95)", "rgba(230,238,255,0.2)");
      ctx.fillStyle = "rgba(200,210,235,0.12)"; [[mx - 18, my - 10, 8], [mx + 14, my + 12, 6], [mx + 4, my - 20, 5]].forEach(c => { ctx.beginPath(); ctx.arc(c[0], c[1], c[2], 0, TAU); ctx.fill(); });
      for (let i = 0; i < 4; i++) { const y = H * (0.4 + i * 0.12), x = ((t * (5 + i * 2)) % (W + 200)) - 100; glow(ctx, x, y, 80, "rgba(60,70,110,0.1)", "transparent"); }
    },

    /* RAAT — deep night: dense stars, low horizon glow, fireflies */
    raat(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(6,8,24,0.5)"], [1, "rgba(14,16,40,0.4)"]]);
      for (let i = 0; i < 110; i++) { const x = rng(i) * W, y = rng(i + 9) * H * 0.85, tw = (sin(t * 0.7 + i * 0.5) + 1) * 0.5; ctx.beginPath(); ctx.arc(x, y, rng(i + 2) * 1.2, 0, TAU); ctx.fillStyle = "rgba(210,218,255," + (0.2 + tw * 0.55) + ")"; ctx.fill(); }
      glow(ctx, W * 0.5, H, W * 0.8, "rgba(60,50,110,0.18)", "transparent");
      for (let i = 0; i < 16; i++) { const x = rng(i + 3) * W + sin(t * 0.7 + i) * 30, y = H * 0.55 + rng(i + 40) * H * 0.4 + cos(t * 0.5 + i) * 20, gl = max(0, sin(t * 1.5 + i * 2)); glow(ctx, x, y, 4 + gl * 5, "rgba(200,255,120," + gl * 0.7 + ")", "transparent"); }
    },

    /* DESERT — dune silhouettes, big sun, heat haze, drifting sand */
    desert(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(80,50,30,0.35)"], [0.6, "rgba(200,140,80,0.3)"], [1, "rgba(120,70,40,0.4)"]]);
      glow(ctx, W * 0.5, H * 0.4, W * 0.3, "rgba(255,220,150,0.5)", "transparent");
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.4, W * 0.08, 0, TAU); ctx.fillStyle = "rgba(255,235,190,0.9)"; ctx.fill();
      for (let d = 0; d < 3; d++) { const yb = H * (0.6 + d * 0.13); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 10) ctx.lineTo(x, yb + sin(x * 0.004 + d * 2) * 24 + sin(x * 0.011 + d) * 10); ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = "rgba(" + (90 - d * 20) + "," + (55 - d * 12) + "," + (30 - d * 6) + ",0.55)"; ctx.fill(); }
      for (let i = 0; i < 40; i++) { const x = (rng(i) * W + t * 40) % W, y = H * 0.55 + rng(i + 5) * H * 0.4; ctx.fillStyle = "rgba(230,190,140,0.18)"; ctx.fillRect(x, y, 6, 1); }
    },

    /* MANDIR — temple: golden glow, floating diya flames, incense motes */
    mandir(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(50,30,10,0.35)"], [1, "rgba(25,14,4,0.45)"]]);
      glow(ctx, W * 0.5, H * 0.45, W * 0.5, "rgba(230,170,90,0.16)", "transparent");
      for (let i = 0; i < 12; i++) { const x = W * (0.12 + (i % 6) * 0.155), y = H * (0.4 + Math.floor(i / 6) * 0.22) + sin(t * 1.5 + i) * 3, fl = 0.6 + (sin(t * 6 + i) + 1) * 0.2; glow(ctx, x, y, 14 * fl, "rgba(255,180,80," + fl * 0.6 + ")", "transparent"); ctx.beginPath(); ctx.ellipse(x, y, 2.4 * fl, 5 * fl, 0, 0, TAU); ctx.fillStyle = "rgba(255,240,200," + fl + ")"; ctx.fill(); }
      for (let i = 0; i < 26; i++) { const x = rng(i) * W + sin(t * 0.4 + i) * 14, y = (rng(i + 22) * H - t * 9) % H, gl = (sin(t + i) + 1) * 0.5; glow(ctx, x, (y + H) % H, 3 + gl * 2.5, "rgba(255,200,120," + gl * 0.4 + ")", "transparent"); }
    },

    /* BAUL — warm earthy wandering glow + drifting "song" motes */
    baul(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(50,30,16,0.3)"], [1, "rgba(30,16,8,0.4)"]]);
      for (let i = 0; i < 3; i++) glow(ctx, W * 0.5 + sin(t * 0.2 + i * 2) * W * 0.3, H * 0.5 + cos(t * 0.15 + i * 2) * H * 0.25, W * 0.3, "hsla(" + (28 + i * 12) + ",70%,55%,0.08)", "transparent");
      for (let i = 0; i < 34; i++) { const ph = t * (0.3 + rng(i) * 0.4) + i, x = (rng(i) * W + sin(ph) * 40 + W) % W, y = (rng(i + 9) * H - t * 12 + cos(ph) * 20 + H) % H, gl = (sin(t * 1.2 + i) + 1) * 0.5; glow(ctx, x, y, 3 + gl * 4, "rgba(255,190,110," + (0.3 + gl * 0.4) + ")", "transparent"); }
    },

    /* NODI — river: horizontal flowing currents, reflections, bank mist */
    nodi(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(20,40,60,0.3)"], [1, "rgba(10,25,45,0.45)"]]);
      for (let i = 0; i < 16; i++) { const y = H * (0.2 + i * 0.05); ctx.beginPath(); ctx.strokeStyle = "rgba(120,180,210," + (0.18 - i * 0.008) + ")"; ctx.lineWidth = 1.4; for (let x = 0; x <= W; x += 6) { const yy = y + sin(x * 0.01 + t * (0.6 + i * 0.04) + i) * 6; x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      for (let i = 0; i < 40; i++) { const x = (rng(i) * W + t * (20 + rng(i + 3) * 30)) % W, y = H * (0.3 + rng(i + 5) * 0.55), gl = (sin(t * 1.5 + i) + 1) * 0.5; ctx.beginPath(); ctx.arc(x, y, 1 + gl, 0, TAU); ctx.fillStyle = "rgba(200,230,255," + gl * 0.6 + ")"; ctx.fill(); }
      glow(ctx, W * 0.5, 0, W * 0.7, "rgba(120,150,180,0.1)", "transparent");
    },

    /* KANTHA — warm cozy, slow stitched-light running threads */
    kantha(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(55,28,30,0.3)"], [1, "rgba(35,16,18,0.4)"]]);
      const cols = ["255,190,120", "255,150,170", "150,210,200", "230,200,120"];
      for (let r = 0; r < 7; r++) { const y = H * (0.12 + r * 0.13), c = cols[r % cols.length]; for (let i = 0; i < 40; i++) { const x = i / 40 * W, on = (sin(x * 0.02 - t * 1.5 + r) > 0); if (i % 2 === 0 && on) { ctx.strokeStyle = "rgba(" + c + ",0.5)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + sin(x * 0.05 + r) * 4); ctx.lineTo(x + W / 40 * 0.6, y + sin((x + 10) * 0.05 + r) * 4); ctx.stroke(); } } }
      for (let i = 0; i < 18; i++) { const x = rng(i) * W + sin(t * 0.4 + i) * 12, y = rng(i + 7) * H, gl = (sin(t + i) + 1) * 0.5; glow(ctx, x, y, 3 + gl * 3, "rgba(255,210,150," + gl * 0.35 + ")", "transparent"); }
    },

    /* SUNDARBAN — misty mangrove: fog layers, water, fireflies, silhouettes */
    sundarban(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(20,40,40,0.35)"], [1, "rgba(10,26,28,0.45)"]]);
      for (let i = 0; i < 3; i++) { const y = H * (0.3 + i * 0.2), x = ((t * (8 + i * 3)) % (W + 300)) - 150; glow(ctx, x, y, 130, "rgba(150,180,170,0.1)", "transparent"); }
      ctx.fillStyle = "rgba(8,18,18,0.6)"; for (let i = 0; i < 7; i++) { const bx = W * (0.05 + i * 0.15); ctx.fillRect(bx, H * 0.5, 4, H * 0.5); for (let r = 0; r < 3; r++) { ctx.save(); ctx.translate(bx + 2, H * 0.5); ctx.rotate(-0.5 + r * 0.5); ctx.fillRect(0, 0, 3, H * 0.4); ctx.restore(); } }
      for (let i = 0; i < 8; i++) { const y = H * 0.6 + i * 6; ctx.strokeStyle = "rgba(120,160,170,0.12)"; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 0; x <= W; x += 8) { const yy = y + sin(x * 0.02 + t + i) * 3; x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      for (let i = 0; i < 14; i++) { const x = rng(i) * W + sin(t * 0.6 + i) * 24, y = H * 0.35 + rng(i + 5) * H * 0.3, gl = max(0, sin(t * 1.4 + i * 2)); glow(ctx, x, y, 3 + gl * 4, "rgba(190,255,130," + gl * 0.7 + ")", "transparent"); }
    },

    /* GRAHAN — eclipse: black disc, fiery corona, dim red sky, emerging stars */
    grahan(ctx, W, H, t) {
      wash(ctx, W, H, [[0, "rgba(20,6,16,0.5)"], [1, "rgba(30,8,10,0.45)"]]);
      for (let i = 0; i < 60; i++) { const x = rng(i) * W, y = rng(i + 9) * H, tw = (sin(t * 0.8 + i) + 1) * 0.5; ctx.beginPath(); ctx.arc(x, y, rng(i + 2) * 1.1, 0, TAU); ctx.fillStyle = "rgba(220,210,230," + (0.15 + tw * 0.4) + ")"; ctx.fill(); }
      const cx = W * 0.5, cy = H * 0.4, R = W * 0.12; const pulse = 0.7 + (sin(t * 0.8) + 1) * 0.15;
      glow(ctx, cx, cy, R * 3.4 * pulse, "rgba(255,160,90," + 0.3 * pulse + ")", "transparent");
      glow(ctx, cx, cy, R * 1.7, "rgba(255,210,150,0.5)", "transparent");
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = "#05030a"; ctx.fill();
      ctx.strokeStyle = "rgba(255,200,140," + pulse + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R + 1, 0, TAU); ctx.stroke();
    },

    /* ═══ STATES OF THE HEART — 30 emotional scenes ═══ */

    anuraag(ctx, W, H, t) { /* Love — two souls orbiting one heart */
      wash(ctx, W, H, [[0, "rgba(40,12,28,0.4)"], [1, "rgba(22,6,16,0.45)"]]);
      const cx = W / 2, cy = H / 2, beat = 0.6 + (sin(t * 1.8) + 1) * 0.2;
      glow(ctx, cx, cy, W * 0.24 * beat, "rgba(255,120,170," + 0.22 * beat + ")", "transparent");
      ctx.fillStyle = "rgba(255,140,180," + 0.5 * beat + ")"; heart(ctx, cx, cy, W * 0.12 * beat); ctx.fill();
      for (let k = 0; k < 2; k++) { const a = t * 0.7 + k * PI, x = cx + cos(a) * W * 0.24, y = cy + sin(a) * H * 0.16; ctx.strokeStyle = "rgba(255,150,190,0.16)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke(); glow(ctx, x, y, 15, "rgba(255,225,240,0.9)", "transparent"); }
    },

    biroho(ctx, W, H, t) { /* Longing — reaching, never quite touching */
      wash(ctx, W, H, [[0, "rgba(14,16,40,0.5)"], [1, "rgba(8,10,26,0.5)"]]);
      const y = H / 2, lx = W * 0.2 + sin(t * 0.4) * 8, rx = W * 0.8 - sin(t * 0.4) * 8, reach = 0.46 + sin(t * 0.6) * 0.1;
      glow(ctx, lx, y, 17, "rgba(255,180,160,0.85)", "transparent");
      glow(ctx, rx, y, 17, "rgba(160,190,255,0.85)", "transparent");
      ctx.strokeStyle = "rgba(220,200,230,0.2)"; ctx.setLineDash([3, 9]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx + (rx - lx) * reach, y); ctx.moveTo(rx, y); ctx.lineTo(rx - (rx - lx) * reach, y); ctx.stroke(); ctx.setLineDash([]);
    },

    milon(ctx, W, H, t) { /* Union — two become one */
      wash(ctx, W, H, [[0, "rgba(40,20,40,0.4)"], [1, "rgba(20,10,24,0.45)"]]);
      const cy = H / 2, cx = W / 2, ph = (sin(t * 0.5) + 1) * 0.5, gap = W * 0.22 * (1 - ph);
      glow(ctx, cx - gap, cy, 20 + ph * 18, "rgba(255,170,150," + (0.5 + ph * 0.4) + ")", "transparent");
      glow(ctx, cx + gap, cy, 20 + ph * 18, "rgba(170,190,255," + (0.5 + ph * 0.4) + ")", "transparent");
      if (ph > 0.85) glow(ctx, cx, cy, W * 0.22 * (ph - 0.85) * 7, "rgba(255,230,240," + (ph - 0.85) * 4 + ")", "transparent");
    },

    dhukdhuk(ctx, W, H, t) { /* Heartbeat */
      wash(ctx, W, H, [[0, "rgba(35,8,16,0.4)"], [1, "rgba(20,5,10,0.45)"]]);
      const c = t % 1.1; let b = 0;
      if (c < 0.12) b = c / 0.12; else if (c < 0.24) b = 1 - (c - 0.12) / 0.12 * 0.45; else if (c < 0.36) b = 0.55 + (c - 0.24) / 0.12 * 0.45; else if (c < 0.5) b = 1 - (c - 0.36) / 0.14; else b = max(0, 0.15 - (c - 0.5) * 0.3);
      const cx = W / 2, cy = H / 2, s = W * 0.13 * (0.85 + b * 0.45);
      glow(ctx, cx, cy, s * 2.4, "rgba(255,80,110," + (0.18 + b * 0.4) + ")", "transparent");
      ctx.fillStyle = "rgba(255,120,150," + (0.5 + b * 0.4) + ")"; heart(ctx, cx, cy, s); ctx.fill();
      if (b > 0.6) { ctx.strokeStyle = "rgba(255,140,160," + (b - 0.6) + ")"; ctx.lineWidth = 2; heart(ctx, cx, cy, s + (b - 0.6) * W * 0.5); ctx.stroke(); }
    },

    tomakei(ctx, W, H, t) { /* Missing you — a light crossing the dark toward another */
      wash(ctx, W, H, [[0, "rgba(8,10,26,0.55)"], [1, "rgba(5,6,18,0.55)"]]);
      for (let i = 0; i < 40; i++) { const x = rng(i) * W, y = rng(i + 9) * H, tw = (sin(t * 0.6 + i) + 1) * 0.5; ctx.beginPath(); ctx.arc(x, y, rng(i + 2) * 1, 0, TAU); ctx.fillStyle = "rgba(200,210,255," + (0.15 + tw * 0.3) + ")"; ctx.fill(); }
      const dx = W * 0.82, dy = H * 0.32; glow(ctx, dx, dy, 26, "rgba(255,200,170,0.5)", "transparent");
      const p = (sin(t * 0.3) + 1) * 0.5, x = W * 0.18 + (dx - W * 0.18) * p, y = H * 0.7 + (dy - H * 0.7) * p;
      glow(ctx, x, y, 14, "rgba(180,210,255,0.95)", "transparent");
      ctx.strokeStyle = "rgba(180,200,255,0.12)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(dx, dy); ctx.stroke();
    },

    bhalobasha(ctx, W, H, t) { /* Affection — rising heart-motes */
      wash(ctx, W, H, [[0, "rgba(40,14,30,0.35)"], [1, "rgba(22,8,18,0.4)"]]);
      for (let i = 0; i < 26; i++) { const s = i * 911, life = (rng(s) + t * (0.06 + rng(s + 1) * 0.06)) % 1, x = rng(s + 2) * W + sin(t * 0.6 + i) * 20, y = H - life * H, sz = 6 + rng(s + 3) * 8; ctx.fillStyle = "rgba(255," + (140 + rng(s) * 60 | 0) + ",180," + (1 - life) * 0.6 + ")"; heart(ctx, (x + W) % W, y, sz); ctx.fill(); }
    },

    angikar(ctx, W, H, t) { /* Promise — a ring of light drawing itself */
      wash(ctx, W, H, [[0, "rgba(30,22,10,0.4)"], [1, "rgba(16,12,5,0.45)"]]);
      const cx = W / 2, cy = H / 2, R = W * 0.18, prog = (t * 0.25) % 1.4;
      glow(ctx, cx, cy, R * 1.6, "rgba(255,210,120,0.12)", "transparent");
      ctx.strokeStyle = "rgba(255,215,140,0.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.strokeStyle = "rgba(255,235,180,0.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, -PI / 2, -PI / 2 + min(1, prog) * TAU); ctx.stroke();
      const a = -PI / 2 + min(1, prog) * TAU; glow(ctx, cx + cos(a) * R, cy + sin(a) * R, 10, "rgba(255,245,210,1)", "transparent");
    },

    smriti(ctx, W, H, t) { /* Memory — soft frames of light drifting & fading */
      wash(ctx, W, H, [[0, "rgba(24,20,34,0.45)"], [1, "rgba(12,10,20,0.45)"]]);
      for (let i = 0; i < 9; i++) { const s = i * 521, life = (rng(s) + t * 0.05) % 1, x = rng(s + 1) * W * 0.8 + W * 0.1, y = H - life * H * 1.1, a = sin(life * PI) * 0.4, w = 50 + rng(s + 2) * 40; ctx.save(); ctx.globalAlpha = a; glow(ctx, x, y, w, "rgba(230,210,255,0.5)", "transparent"); ctx.strokeStyle = "rgba(240,230,255,0.6)"; ctx.lineWidth = 1; ctx.strokeRect(x - w * 0.35, y - w * 0.28, w * 0.7, w * 0.56); ctx.restore(); }
    },

    bhakti(ctx, W, H, t) { /* Devotion — one unwavering flame */
      wash(ctx, W, H, [[0, "rgba(20,10,4,0.5)"], [1, "rgba(10,5,2,0.5)"]]);
      const cx = W / 2, cy = H * 0.58, fl = 0.85 + sin(t * 8) * 0.05 + sin(t * 13) * 0.03;
      glow(ctx, cx, cy, W * 0.22, "rgba(255,180,90," + 0.22 * fl + ")", "transparent");
      glow(ctx, cx, cy - 10, 30 * fl, "rgba(255,160,60,0.6)", "transparent");
      ctx.fillStyle = "rgba(255,235,190,0.95)"; ctx.beginPath(); ctx.ellipse(cx, cy - 8, 6 * fl, 16 * fl, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(120,160,255,0.7)"; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 3, 7, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 8; i++) { const s = i * 331, lf = (rng(s) + t * 0.2) % 1; ctx.fillStyle = "rgba(255,200,120," + (1 - lf) * 0.5 + ")"; ctx.beginPath(); ctx.arc(cx + sin(s + t) * 14, cy - 20 - lf * H * 0.3, max(0, (1 - lf) * 1.6), 0, TAU); ctx.fill(); }
    },

    asha(ctx, W, H, t) { /* Hope — a dawn rising within */
      const r = (sin(t * 0.2) + 1) * 0.5;
      wash(ctx, W, H, [[0, "rgba(20,16,40,0.45)"], [0.6, "rgba(120,70,80," + (0.2 + r * 0.2) + ")"], [1, "rgba(255,170,110," + (0.2 + r * 0.3) + ")"]]);
      glow(ctx, W * 0.5, H * (0.95 - r * 0.25), W * 0.5, "rgba(255,210,150," + (0.3 + r * 0.3) + ")", "transparent");
      for (let i = 0; i < 30; i++) { const x = rng(i) * W, y = rng(i + 9) * H * 0.5, tw = (sin(t * 0.5 + i) + 1) * 0.5; ctx.beginPath(); ctx.arc(x, y, rng(i + 2), 0, TAU); ctx.fillStyle = "rgba(230,235,255," + (0.1 + tw * 0.3) * (1 - r) + ")"; ctx.fill(); }
    },

    kritagyata(ctx, W, H, t) { /* Gratitude — floating lanterns rising */
      wash(ctx, W, H, [[0, "rgba(18,14,30,0.45)"], [1, "rgba(10,8,18,0.45)"]]);
      for (let i = 0; i < 22; i++) { const s = i * 733, life = (rng(s) + t * 0.04) % 1, x = rng(s + 1) * W + sin(t * 0.3 + i) * 14, y = H - life * H * 1.1, a = sin(life * PI); glow(ctx, (x + W) % W, y, 16, "rgba(255,190,110," + a * 0.5 + ")", "transparent"); ctx.fillStyle = "rgba(255,220,150," + a * 0.9 + ")"; ctx.fillRect((x + W) % W - 3, y - 4, 6, 8); }
    },

    birohini(ctx, W, H, t) { /* Separation — two shores, one water */
      wash(ctx, W, H, [[0, "rgba(20,24,48,0.5)"], [1, "rgba(10,14,30,0.5)"]]);
      const my = H * 0.5; glow(ctx, W * 0.2, my - 4, 16, "rgba(255,190,150,0.8)", "transparent"); glow(ctx, W * 0.8, my - 4, 16, "rgba(160,200,255,0.8)", "transparent");
      for (let i = 0; i < 10; i++) { const y = my + 14 + i * 7; ctx.strokeStyle = "rgba(140,170,220," + (0.16 - i * 0.012) + ")"; ctx.lineWidth = 1.4; ctx.beginPath(); for (let x = 0; x <= W; x += 6) { const yy = y + sin(x * 0.02 + t * 0.6 + i) * 4; x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      ctx.globalAlpha = 0.4; glow(ctx, W * 0.2, my + 22, 12, "rgba(255,190,150,0.6)", "transparent"); glow(ctx, W * 0.8, my + 22, 12, "rgba(160,200,255,0.6)", "transparent"); ctx.globalAlpha = 1;
    },

    punarmilon(ctx, W, H, t) { /* Reunion — two trails sweep together */
      wash(ctx, W, H, [[0, "rgba(30,16,36,0.4)"], [1, "rgba(16,8,20,0.45)"]]);
      const cx = W / 2, cy = H / 2, p = (t * 0.4) % 2, e = min(1, p);
      const lx = W * 0.1 + (cx - W * 0.1) * e, rx = W * 0.9 - (W * 0.9 - cx) * e;
      ctx.strokeStyle = "rgba(255,170,150,0.4)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.1, cy); ctx.lineTo(lx, cy + sin(e * PI) * -30); ctx.stroke();
      ctx.strokeStyle = "rgba(160,190,255,0.4)"; ctx.beginPath(); ctx.moveTo(W * 0.9, cy); ctx.lineTo(rx, cy + sin(e * PI) * 30); ctx.stroke();
      glow(ctx, lx, cy + sin(e * PI) * -30, 12, "rgba(255,210,190,0.9)", "transparent"); glow(ctx, rx, cy + sin(e * PI) * 30, 12, "rgba(190,210,255,0.9)", "transparent");
      if (e >= 1 && p < 1.4) glow(ctx, cx, cy, W * 0.3 * (p - 1), "rgba(255,240,245," + (1.4 - p) + ")", "transparent");
    },

    prosanti(ctx, W, H, t) { /* Peace — a slow breathing light */
      const b = (sin(t * 0.4) + 1) * 0.5;
      wash(ctx, W, H, [[0, "rgba(16,24,36,0.45)"], [1, "rgba(8,14,22,0.45)"]]);
      glow(ctx, W / 2, H / 2, W * (0.25 + b * 0.25), "rgba(150,200,210," + (0.12 + b * 0.14) + ")", "transparent");
      glow(ctx, W / 2, H / 2, W * 0.08, "rgba(220,240,245," + (0.3 + b * 0.2) + ")", "transparent");
    },

    anondo(ctx, W, H, t) { /* Bliss — golden joy spiralling up */
      wash(ctx, W, H, [[0, "rgba(36,26,10,0.35)"], [1, "rgba(20,14,6,0.4)"]]);
      for (let i = 0; i < 60; i++) { const s = i * 467, life = (rng(s) + t * 0.12) % 1, ang = s + t * 2, rad = (1 - life) * W * 0.3, x = W / 2 + cos(ang) * rad, y = H - life * H, gl = sin(life * PI); ctx.beginPath(); ctx.arc(x, y, 1 + gl * 2, 0, TAU); ctx.fillStyle = "rgba(255," + (210 + rng(s) * 40 | 0) + ",130," + gl * 0.8 + ")"; ctx.fill(); }
    },

    akuti(ctx, W, H, t) { /* Yearning — heart stretching toward a far light */
      wash(ctx, W, H, [[0, "rgba(30,12,28,0.45)"], [1, "rgba(16,6,16,0.45)"]]);
      const cx = W * 0.35, cy = H * 0.6, reach = (sin(t * 0.8) + 1) * 0.5, tx = W * 0.78, ty = H * 0.3;
      glow(ctx, tx, ty, 20, "rgba(255,220,180,0.6)", "transparent");
      const hx = cx + (tx - cx) * reach * 0.4, hy = cy + (ty - cy) * reach * 0.4;
      ctx.fillStyle = "rgba(255,130,170,0.7)"; heart(ctx, hx, hy, W * 0.09 * (1 - reach * 0.2)); ctx.fill();
      ctx.strokeStyle = "rgba(255,180,200,0.2)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
    },

    swantona(ctx, W, H, t) { /* Comfort — being held by warm waves */
      wash(ctx, W, H, [[0, "rgba(34,20,14,0.4)"], [1, "rgba(20,12,8,0.45)"]]);
      for (let i = 0; i < 6; i++) { const r = ((t * 22 + i * 70) % 420), a = max(0, 0.22 - r / 1900); ctx.strokeStyle = "rgba(255,190,140," + a + ")"; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.stroke(); }
      glow(ctx, W / 2, H / 2, W * 0.1, "rgba(255,225,190,0.4)", "transparent");
    },

    nirobota(ctx, W, H, t) { /* Serenity — one slow ripple on still water */
      wash(ctx, W, H, [[0, "rgba(14,22,30,0.5)"], [1, "rgba(8,14,20,0.5)"]]);
      const r = (t * 26) % 360; ctx.strokeStyle = "rgba(170,210,220," + max(0, 0.4 - r / 900) + ")"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, r, r * 0.4, 0, 0, TAU); ctx.stroke();
      const r2 = ((t * 26) + 180) % 360; ctx.strokeStyle = "rgba(170,210,220," + max(0, 0.4 - r2 / 900) + ")"; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, r2, r2 * 0.4, 0, 0, TAU); ctx.stroke();
      glow(ctx, W / 2, H / 2, 14, "rgba(220,240,245,0.6)", "transparent");
    },

    abeg(ctx, W, H, t) { /* Passion — deep pulse, rising heat */
      const b = (sin(t * 1.4) + 1) * 0.5;
      wash(ctx, W, H, [[0, "rgba(40,6,14,0.45)"], [1, "rgba(60,8,16," + (0.4 + b * 0.2) + ")"]]);
      glow(ctx, W / 2, H * 0.6, W * (0.3 + b * 0.15), "rgba(255,40,70," + (0.2 + b * 0.25) + ")", "transparent");
      for (let i = 0; i < 40; i++) { const s = i * 613, life = (rng(s) + t * 0.18) % 1, x = W / 2 + sin(s + t) * W * 0.3 * (1 - life), y = H - life * H; ctx.beginPath(); ctx.arc(x, y, max(0, (1 - life) * 2.4), 0, TAU); ctx.fillStyle = "rgba(255," + (90 + (1 - life) * 120 | 0) + ",110," + (1 - life) * 0.7 + ")"; ctx.fill(); }
    },

    komolota(ctx, W, H, t) { /* Tenderness — soft feathers falling */
      wash(ctx, W, H, [[0, "rgba(34,22,34,0.35)"], [1, "rgba(20,14,22,0.4)"]]);
      for (let i = 0; i < 30; i++) { const s = i * 829, y = (rng(s) * H + t * 14) % H, x = rng(s + 1) * W + sin(t * 0.5 + i) * 26, rot = sin(t * 0.8 + i) * 0.6; ctx.save(); ctx.translate((x + W) % W, y); ctx.rotate(rot); ctx.fillStyle = "rgba(255,200,220,0.45)"; ctx.beginPath(); ctx.ellipse(0, 0, 9, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    },

    atmarbandhu(ctx, W, H, t) { /* Soulmate — twin stars in stable orbit */
      wash(ctx, W, H, [[0, "rgba(14,14,34,0.5)"], [1, "rgba(8,8,22,0.5)"]]);
      for (let i = 0; i < 40; i++) { const x = rng(i) * W, y = rng(i + 9) * H; ctx.beginPath(); ctx.arc(x, y, rng(i + 2) * 1, 0, TAU); ctx.fillStyle = "rgba(200,210,255," + (0.15 + rng(i + 1) * 0.3) + ")"; ctx.fill(); }
      const cx = W / 2, cy = H / 2, a = t * 0.6, R = W * 0.15;
      const x1 = cx + cos(a) * R, y1 = cy + sin(a) * R * 0.7, x2 = cx - cos(a) * R, y2 = cy - sin(a) * R * 0.7;
      ctx.strokeStyle = "rgba(220,200,255,0.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      glow(ctx, x1, y1, 13, "rgba(255,220,200,0.95)", "transparent"); glow(ctx, x2, y2, 13, "rgba(200,220,255,0.95)", "transparent");
    },

    arogya(ctx, W, H, t) { /* Healing — gentle restoring pulses */
      wash(ctx, W, H, [[0, "rgba(14,28,22,0.4)"], [1, "rgba(8,18,14,0.45)"]]);
      for (let i = 0; i < 5; i++) { const r = ((t * 30 + i * 90) % 460), a = max(0, 0.2 - r / 2200); ctx.strokeStyle = "rgba(120,230,180," + a + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, TAU); ctx.stroke(); }
      glow(ctx, W / 2, H / 2, W * 0.12 * (1 + sin(t) * 0.1), "rgba(160,255,200,0.4)", "transparent");
    },

    chirodin(ctx, W, H, t) { /* Forever — light tracing an infinity */
      wash(ctx, W, H, [[0, "rgba(20,16,34,0.45)"], [1, "rgba(10,8,20,0.45)"]]);
      const cx = W / 2, cy = H / 2, A = W * 0.22;
      ctx.strokeStyle = "rgba(200,170,255,0.18)"; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const u = i / 80 * TAU, x = cx + A * cos(u) / (1 + sin(u) * sin(u)), y = cy + A * sin(u) * cos(u) / (1 + sin(u) * sin(u)); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      const u = (t * 0.6) % TAU, x = cx + A * cos(u) / (1 + sin(u) * sin(u)), y = cy + A * sin(u) * cos(u) / (1 + sin(u) * sin(u));
      glow(ctx, x, y, 12, "rgba(235,215,255,1)", "transparent");
    },

    fisfis(ctx, W, H, t) { /* Whisper — faint intimate motes drifting close */
      wash(ctx, W, H, [[0, "rgba(20,16,28,0.5)"], [1, "rgba(12,10,18,0.5)"]]);
      for (let i = 0; i < 24; i++) { const s = i * 367, x = (rng(s) * W + sin(t * 0.3 + i) * 30 + W) % W, y = (rng(s + 1) * H + cos(t * 0.25 + i) * 20 + H) % H, gl = (sin(t * 0.8 + i) + 1) * 0.5; glow(ctx, x, y, 3 + gl * 5, "rgba(230,215,245," + gl * 0.3 + ")", "transparent"); }
    },

    ushnota(ctx, W, H, t) { /* Warmth — a hearth glow filling from below */
      const b = 0.85 + sin(t * 3) * 0.05 + sin(t * 7) * 0.03;
      wash(ctx, W, H, [[0, "rgba(20,10,6,0.45)"], [1, "rgba(50,20,8," + (0.3 + b * 0.15) + ")"]]);
      glow(ctx, W / 2, H * 1.05, W * 0.8 * b, "rgba(255,140,60,0.3)", "transparent");
      glow(ctx, W / 2, H * 1.05, W * 0.45, "rgba(255,190,110,0.25)", "transparent");
      for (let i = 0; i < 18; i++) { const s = i * 521, lf = (rng(s) + t * 0.15) % 1; ctx.fillStyle = "rgba(255,200,120," + (1 - lf) * 0.5 + ")"; ctx.beginPath(); ctx.arc(W / 2 + sin(s + t) * W * 0.3 * (1 - lf), H - lf * H * 0.8, max(0, (1 - lf) * 1.8), 0, TAU); ctx.fill(); }
    },

    nirapotta(ctx, W, H, t) { /* Safe — a soft protective dome of light */
      wash(ctx, W, H, [[0, "rgba(16,18,32,0.45)"], [1, "rgba(8,10,20,0.45)"]]);
      const cx = W / 2, cy = H * 0.62, b = (sin(t * 0.5) + 1) * 0.5;
      glow(ctx, cx, cy, W * (0.34 + b * 0.05), "rgba(150,190,230," + (0.1 + b * 0.08) + ")", "transparent");
      ctx.strokeStyle = "rgba(180,210,240,0.25)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, W * 0.32, PI, TAU); ctx.stroke();
      glow(ctx, cx, cy, 16, "rgba(255,230,200,0.7)", "transparent");
    },

    bandhan(ctx, W, H, t) { /* Bond — a luminous thread vibrating between two */
      wash(ctx, W, H, [[0, "rgba(22,14,30,0.45)"], [1, "rgba(12,8,18,0.45)"]]);
      const y = H / 2, lx = W * 0.22, rx = W * 0.78;
      ctx.strokeStyle = "rgba(255,200,150,0.5)"; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = lx; x <= rx; x += 5) { const k = (x - lx) / (rx - lx), amp = sin(k * PI) * 14; ctx.lineTo(x, y + sin(k * 12 - t * 4) * amp); } ctx.stroke();
      glow(ctx, lx, y, 14, "rgba(255,200,170,0.95)", "transparent"); glow(ctx, rx, y, 14, "rgba(200,210,255,0.95)", "transparent");
    },

    anibban(ctx, W, H, t) { /* Eternal flame — steady, with rising sparks */
      wash(ctx, W, H, [[0, "rgba(16,8,6,0.5)"], [1, "rgba(8,4,3,0.5)"]]);
      const cx = W / 2, cy = H * 0.62, fl = 0.9 + sin(t * 9) * 0.04;
      glow(ctx, cx, cy, W * 0.26, "rgba(255,160,70,0.18)", "transparent");
      glow(ctx, cx, cy - 14, 36 * fl, "rgba(255,150,50,0.6)", "transparent");
      ctx.fillStyle = "rgba(255,230,180,0.95)"; ctx.beginPath(); ctx.ellipse(cx, cy - 12, 7 * fl, 20 * fl, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 26; i++) { const s = i * 419, lf = (rng(s) + t * 0.22) % 1; ctx.fillStyle = "rgba(255,200,120," + (1 - lf) * 0.7 + ")"; ctx.beginPath(); ctx.arc(cx + sin(s + t * 1.5) * 20 * lf, cy - 26 - lf * H * 0.4, max(0, (1 - lf) * 2), 0, TAU); ctx.fill(); }
    },

    hridoy(ctx, W, H, t) { /* Heart's glow — one great breathing heart */
      const b = (sin(t * 1.2) + 1) * 0.5;
      wash(ctx, W, H, [[0, "rgba(36,8,18,0.4)"], [1, "rgba(20,5,10,0.45)"]]);
      const cx = W / 2, cy = H / 2, s = W * 0.24 * (0.92 + b * 0.12);
      glow(ctx, cx, cy, s * 2, "rgba(255,70,110," + (0.16 + b * 0.18) + ")", "transparent");
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s); g.addColorStop(0, "rgba(255,170,190," + (0.7 + b * 0.2) + ")"); g.addColorStop(1, "rgba(255,90,130,0.3)"); ctx.fillStyle = g; heart(ctx, cx, cy, s); ctx.fill();
    },

    duihridoy(ctx, W, H, t) { /* Two hearts beating as one */
      wash(ctx, W, H, [[0, "rgba(34,10,22,0.4)"], [1, "rgba(18,6,12,0.45)"]]);
      const b = (sin(t * 1.6) + 1) * 0.5, cy = H / 2, gap = W * 0.12, s = W * 0.12 * (0.85 + b * 0.3);
      ctx.fillStyle = "rgba(255,130,170," + (0.5 + b * 0.3) + ")"; heart(ctx, W / 2 - gap, cy, s); ctx.fill();
      ctx.fillStyle = "rgba(180,190,255," + (0.5 + b * 0.3) + ")"; heart(ctx, W / 2 + gap, cy, s); ctx.fill();
      glow(ctx, W / 2, cy, W * 0.16 * b, "rgba(255,220,240," + b * 0.4 + ")", "transparent");
    },

  };
})();
