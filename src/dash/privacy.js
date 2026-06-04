/* ============================================================
 * SPURANA · dash/privacy.js  (STEP 10)
 * Export your data (client-side JSON download) and permanently
 * delete your account (typed confirmation -> delete-account fn).
 * ============================================================ */
(function () {
  "use strict";
  Router.register("privacy", function (root) {
    root.appendChild(topBar({ title: "Privacy & Data", back: true }));
    const body = H.el("div", { class: "pad scroll grow stack reveal" });
    root.appendChild(body);

    body.appendChild(H.el("p", { class: "muted", style: "font-family:var(--f-soul);font-style:italic;font-size:15px" },
      "Your words are yours. Take them with you, or erase them completely \u2014 your choice, always."));

    // ── export ──
    const exportBtn = H.el("button", { class: "btn btn-primary btn-block", onClick: doExport }, "Export my data (JSON)");
    body.appendChild(H.el("div", { class: "card stack" }, [
      H.el("div", { class: "f-label" }, "Export"),
      H.el("div", { class: "muted", style: "font-size:13.5px" }, "Download everything tied to your soul \u2014 profile, messages, bonds and history \u2014 as a file."),
      exportBtn,
    ]));

    async function doExport() {
      exportBtn.setAttribute("disabled", "true"); exportBtn.textContent = "Gathering\u2026";
      const { data, error } = await SP.account.exportData();
      exportBtn.removeAttribute("disabled"); exportBtn.textContent = "Export my data (JSON)";
      if (error || !data) { toast("Couldn't export right now.", true); return; }
      try {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = H.el("a", { href: url, download: "spurana-my-data.json" });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast("Your data is downloading \u2726");
      } catch (e) { toast("Couldn't prepare the file.", true); }
    }

    // ── delete ──
    const confirmInput = H.el("input", { class: "input", placeholder: "Type DELETE to confirm" });
    const delBtn = H.el("button", { class: "btn btn-danger btn-block", disabled: "true", onClick: doDelete }, "Permanently delete my account");
    confirmInput.addEventListener("input", () => { if (confirmInput.value.trim() === "DELETE") delBtn.removeAttribute("disabled"); else delBtn.setAttribute("disabled", "true"); });
    body.appendChild(H.el("div", { class: "card stack", style: "border-color:rgba(255,68,102,0.3)" }, [
      H.el("div", { class: "f-label", style: "color:#FF8AA0" }, "Danger zone"),
      H.el("div", { class: "muted", style: "font-size:13.5px" }, "This erases your account, profile, messages and bonds. It cannot be undone."),
      confirmInput, delBtn,
    ]));

    async function doDelete() {
      if (confirmInput.value.trim() !== "DELETE") return;
      delBtn.setAttribute("disabled", "true"); delBtn.textContent = "Erasing\u2026";
      const { error } = await SP.account.deleteAccount();
      if (error) { toast(error.message || "Couldn't delete the account.", true); delBtn.removeAttribute("disabled"); delBtn.textContent = "Permanently delete my account"; return; }
      APP.session = null; APP.me = null; APP.profile = null;
      toast("Your account has been erased.");
      Router.go("login");
    }
    return {};
  });
})();
