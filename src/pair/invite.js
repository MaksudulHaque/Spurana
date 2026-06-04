/* ============================================================
 * SPURANA · pair/invite.js  (STEP 3)
 * "Invite your beloved": calls the `pair` Edge Function (create),
 * shows the code and a shareable link carrying ?code=XXXX.
 * ============================================================ */
(function () {
  "use strict";

  Router.register("invite", function (root) {
    root.appendChild(topBar({ title: "Invite your beloved", back: true }));

    const body = H.el("div", { class: "pad reveal stack" });
    root.appendChild(body);

    body.appendChild(H.el("p", { class: "muted center" },
      "Share this code — or the link — with the one you wish to bond with. " +
      "When they enter it, your private sanctuary opens for the two of you."));

    const codeBox = H.el("div", {
      class: "card center",
      style: "font-family:var(--font-display);font-size:40px;letter-spacing:6px;color:var(--gold)",
    }, "·····");
    body.appendChild(codeBox);

    const expiry = H.el("div", { class: "center faint", style: "font-size:13px" }, "");
    body.appendChild(expiry);

    const copyBtn = H.el("button", { class: "btn btn-primary btn-block", disabled: "true" }, "Copy invite link");
    const shareBtn = H.el("button", { class: "btn btn-ghost btn-block", disabled: "true" }, "Share…");
    const regen = H.el("button", { class: "btn btn-ghost btn-block" }, "Generate a fresh code");
    body.append(copyBtn, shareBtn, regen);

    let link = "";

    function linkFor(code) {
      // hash-routed SPA: put the code in the query string so boot can read it pre-login
      return location.origin + location.pathname + "?code=" + encodeURIComponent(code);
    }

    async function generate() {
      codeBox.textContent = "·····"; expiry.textContent = "";
      copyBtn.setAttribute("disabled", "true"); shareBtn.setAttribute("disabled", "true");
      regen.setAttribute("disabled", "true"); regen.textContent = "Summoning…";
      const { data, error } = await SP.pair.createInvite();
      regen.removeAttribute("disabled"); regen.textContent = "Generate a fresh code";
      if (error || !data || !data.code) { toast((error && error.message) || "Could not create an invite.", true); return; }
      codeBox.textContent = data.code;
      link = linkFor(data.code);
      copyBtn.removeAttribute("disabled"); shareBtn.removeAttribute("disabled");
      if (data.expires_at) {
        const d = new Date(data.expires_at);
        if (!isNaN(d)) expiry.textContent = "Expires " + d.toLocaleString();
      }
    }

    copyBtn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(link); toast("Invite link copied."); }
      catch (e) { toast(link); }
    });
    shareBtn.addEventListener("click", async () => {
      if (navigator.share) { try { await navigator.share({ title: "Spurana", text: "Bond with me on Spurana", url: link }); } catch (e) {} }
      else { try { await navigator.clipboard.writeText(link); toast("Link copied (sharing not supported here)."); } catch (e) { toast(link); } }
    });
    regen.addEventListener("click", generate);

    generate();
    return {};
  });
})();
