/* SPURANA · core/notify.js — desktop notifications for new messages. */
window.Notify = (function () {
  "use strict";
  function supported() { return "Notification" in window; }
  function isOn() { return supported() && Notification.permission === "granted"; }
  async function enable() { if (!supported()) return false; try { const p = await Notification.requestPermission(); return p === "granted"; } catch (e) { return false; } }
  function fire(title, body) { try { if (isOn() && document.hidden) new Notification(title, { body: body || "", icon: "icon-192.png", silent: false }); } catch (e) {} }
  return { enable, fire, isOn, supported };
})();
