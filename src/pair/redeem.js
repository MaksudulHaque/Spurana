/* ============================================================
 * SPURANA · pair/redeem.js  (STEP 3)
 * "Enter a code": calls the `pair` Edge Function (redeem). The
 * server has already created the conversation + participants +
 * contacts, so on success we set the active conversation and open
 * the thread. window.redeemCode() is reused by boot for ?code links.
 * ============================================================ */
(function () {
  "use strict";

  // Shared redeem routine (used by the screen AND by boot for ?code= links).
  window.redeemCode = async function (code) {
    const c = (code || "").trim();
    if (!c) return { ok: false, msg: "Enter a code." };
    const { data, error } = await SP.pair.redeemInvite(c);
    if (error || !data || !data.conv_id) {
      return { ok: false, msg: (error && error.message) || "That code didn’t work. It may be used or expired." };
    }
    APP.activeConv = data.conv_id;
    APP.partner = { uid: data.partner_uid, name: data.partner_name || "Your beloved" };
    try { await SP.activity.log("pair_redeem", {}, data.conv_id); } catch (e) {}
    // refresh contacts so the new bond shows in the list
    try { const r = await SP.contacts.list(); if (r.data) APP.contacts = r.data; } catch (e) {}
    return { ok: true, conv: data.conv_id, partner: APP.partner };
  };

  Router.register("redeem", function (root) {
    root.appendChild(topBar({ title: "Enter a code", back: true }));

    const input = H.el("input", {
      class: "input", type: "text", placeholder: "Paste the code",
      style: "text-align:center;letter-spacing:4px;font-size:22px;font-family:var(--font-display)",
      autocapitalize: "characters", autocomplete: "off",
    });
    const btn = H.el("button", { class: "btn btn-primary btn-block" }, "Bond");

    async function go() {
      btn.setAttribute("disabled", "true"); btn.textContent = "Bonding…";
      const r = await window.redeemCode(input.value);
      if (!r.ok) {
        toast(r.msg, true);
        btn.removeAttribute("disabled"); btn.textContent = "Bond";
        return;
      }
      toast("Bonded with " + r.partner.name + " ✦");
      Router.go("thread", { c: r.conv });
    }
    btn.addEventListener("click", go);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });

    root.appendChild(H.el("div", { class: "pad reveal stack" }, [
      H.el("p", { class: "muted center" }, "Enter the code your beloved shared with you."),
      input,
      btn,
    ]));
    return {};
  });
})();
