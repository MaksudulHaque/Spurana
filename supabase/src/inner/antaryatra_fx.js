/* ============================================================
 * SPURANA · inner/antaryatra_fx.js
 * The original Antaryatra "cool graphics" restored from V1 — a
 * different animated canvas scene for each of the seven stages:
 * breath, bridge, heart, forest, ocean, mirror, rise. Each is
 * tinted by the stage's own colour. window.ATR_FX.stageBg(...)
 * is driven by the guided-session canvas in core/guide.js.
 * ============================================================ */
(function () {
  "use strict";
  function hexToRgb(hex) {
    var m = String(hex || "").match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 232, g: 0, b: 154 };
  }
  function stageBg(ctx, W, H, t, visual, color) {
    var rgb = hexToRgb(color);
    var R = rgb.r, G = rgb.g, B = rgb.b;
    // soft ambient backdrop
    var bg = ctx.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, W * 0.7);
    bg.addColorStop(0, "rgba(" + R + "," + G + "," + B + ",.12)");
    bg.addColorStop(1, "transparent");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    switch (visual) {
      case "breath":
        for (var i = 0; i < 4; i++) {
          var phase = (t * 0.15 + i * 0.25) % 1, r = phase * W * 0.45;
          ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(" + R + "," + G + "," + B + "," + Math.max(0, 0.3 - phase * 0.3) + ")";
          ctx.lineWidth = 1.5; ctx.stroke();
        }
        break;
      case "bridge": {
        var beamG = ctx.createLinearGradient(0, H * 0.5, W, H * 0.5);
        beamG.addColorStop(0, "transparent"); beamG.addColorStop(0.5, "rgba(" + R + "," + G + "," + B + ",.25)"); beamG.addColorStop(1, "transparent");
        ctx.fillStyle = beamG; ctx.fillRect(0, H * 0.5 - 25, W, 50);
        for (var b1 = 0; b1 < 50; b1++) {
          var s1 = b1 * 4127, x1 = ((s1 * 2.3 + t * 40) % (W + 50)) - 25, y1 = H * 0.5 + Math.sin(t * 0.5 + b1) * 15;
          ctx.beginPath(); ctx.arc(x1, y1, 1.5, 0, Math.PI * 2); ctx.fillStyle = "rgba(" + R + "," + G + "," + B + ",.7)"; ctx.fill();
        }
        break;
      }
      case "heart": {
        var pulse = Math.sin(t * 1.4) * 0.15 + 1, cx = W / 2, cy = H * 0.5;
        for (var k = 0; k < 6; k++) {
          var ang = k * Math.PI / 3 + t * 0.05, px = cx + Math.cos(ang) * 30 * pulse, py = cy + Math.sin(ang) * 30 * pulse;
          ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
          ctx.beginPath(); ctx.ellipse(0, 0, 18 * pulse, 8 * pulse, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + R + "," + G + "," + B + ",.18)"; ctx.fill(); ctx.restore();
        }
        var hG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40 * pulse);
        hG.addColorStop(0, "rgba(" + R + "," + G + "," + B + ",.5)"); hG.addColorStop(1, "transparent");
        ctx.fillStyle = hG; ctx.beginPath(); ctx.arc(cx, cy, 40 * pulse, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case "forest":
        for (var f = 0; f < 8; f++) {
          var fx = (W / 8) * f + W / 16 + Math.sin(t * 0.3 + f) * 5;
          ctx.fillStyle = "rgba(" + Math.floor(R * 0.5) + "," + Math.floor(G * 0.7) + "," + Math.floor(B * 0.5) + ",.4)";
          ctx.beginPath(); ctx.moveTo(fx - 15, H); ctx.lineTo(fx - 3, H * 0.4); ctx.lineTo(fx + 3, H * 0.4); ctx.lineTo(fx + 15, H); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.arc(fx, H * 0.4, 30, 0, Math.PI * 2); ctx.fill();
        }
        for (var fl = 0; fl < 25; fl++) {
          var sf = fl * 4127, xf = ((sf * 2.3 + Math.sin(t * 0.3 + sf) * 30 + t * 12) % W + W) % W, yf = ((sf * 3.1 + t * 15) % H + H) % H;
          ctx.save(); ctx.translate(xf, yf); ctx.rotate(t * 0.4 + sf);
          ctx.beginPath(); ctx.ellipse(0, 0, 4, 1.5, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(" + R + "," + G + "," + B + ",.75)"; ctx.fill(); ctx.restore();
        }
        break;
      case "ocean":
        for (var w = 0; w < 6; w++) {
          ctx.beginPath();
          for (var xo = 0; xo <= W; xo += 4) {
            var yBase = H * (0.5 + w * 0.08), wave = Math.sin(xo * 0.01 - t * (0.4 + w * 0.05)) * 15 + Math.sin(xo * 0.02 - t * (0.25 + w * 0.04)) * 8;
            xo === 0 ? ctx.moveTo(xo, yBase + wave) : ctx.lineTo(xo, yBase + wave);
          }
          ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
          ctx.fillStyle = "rgba(" + R + "," + G + "," + B + "," + (0.12 - w * 0.015) + ")"; ctx.fill();
        }
        for (var bb = 0; bb < 25; bb++) {
          var sb = bb * 3571, life = ((sb * 0.007 + t * 0.06) % 1), xb = (sb * 4.7) % W, yb = H * (1 - life);
          ctx.beginPath(); ctx.arc(xb, yb, 1.5 + (sb % 3), 0, Math.PI * 2); ctx.strokeStyle = "rgba(" + R + "," + G + "," + B + "," + (1 - life) * 0.4 + ")"; ctx.lineWidth = 0.7; ctx.stroke();
        }
        break;
      case "mirror": {
        ctx.save(); ctx.strokeStyle = "rgba(" + R + "," + G + "," + B + ",.4)"; ctx.lineWidth = 1;
        for (var ym = 0; ym < H; ym += 5) { var off = Math.sin(t * 0.5 + ym * 0.02) * 8; ctx.beginPath(); ctx.moveTo(W / 2 - 30 + off, ym); ctx.lineTo(W / 2 + 30 - off, ym); ctx.stroke(); }
        ctx.restore();
        var mG = ctx.createLinearGradient(W / 2 - 100, 0, W / 2 + 100, 0);
        mG.addColorStop(0, "transparent"); mG.addColorStop(0.5, "rgba(" + R + "," + G + "," + B + "," + (0.2 + Math.sin(t * 0.6) * 0.05) + ")"); mG.addColorStop(1, "transparent");
        ctx.fillStyle = mG; ctx.fillRect(W / 2 - 100, 0, 200, H);
        break;
      }
      case "rise":
        for (var rr = 0; rr < 60; rr++) {
          var sr = rr * 7331, lr = ((sr * 0.004 + t * 0.1) % 1), xr = W * 0.5 + Math.sin(sr + t * 0.5) * W * 0.4 * (1 - lr), yr = H - lr * H * 1.02, ra = Math.max(0, (1 - lr) * 3);
          var gl = ctx.createRadialGradient(xr, yr, 0, xr, yr, ra * 3);
          gl.addColorStop(0, "rgba(" + R + "," + G + "," + B + "," + (1 - lr) * 0.8 + ")"); gl.addColorStop(1, "transparent");
          ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(xr, yr, ra * 3, 0, Math.PI * 2); ctx.fill();
        }
        var sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, "rgba(" + R + "," + G + "," + B + ",.15)"); sky.addColorStop(1, "transparent");
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.4);
        break;
    }
  }
  window.ATR_FX = { stageBg: stageBg, hexToRgb: hexToRgb };
})();
