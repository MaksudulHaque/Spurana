/* ============================================================
 * SPURANA · core/push.js — push notifications (native app).
 * Registers this device with FCM, keeps its token in push_tokens
 * (RLS: own rows only), creates the "Messages" channel with
 * vibration, and routes notification taps straight into the
 * thread. Foreground messages become a soft pulse + toast
 * instead of a tray notification. No-op in the browser.
 * ============================================================ */
(function () {
  "use strict";

  function PN() {
    var C = window.Capacitor;
    if (!(C && C.isNativePlatform && C.isNativePlatform())) return null;
    return (C.Plugins && C.Plugins.PushNotifications) || null;
  }

  var registered = false;

  function init() {
    var pn = PN();
    if (registered || !pn || !window.APP || !APP.me) return;
    registered = true;

    try {
      if (pn.createChannel) pn.createChannel({
        id: "messages", name: "Messages", description: "Words from your soul",
        importance: 5, visibility: 1, vibration: true, lights: true, sound: "default",
      });
      if (pn.createChannel) pn.createChannel({
        id: "ptt", name: "Push-to-Talk", description: "Your soul is speaking",
        importance: 5, visibility: 1, vibration: true, lights: true, sound: "default",
      });
      if (pn.createChannel) pn.createChannel({
        id: "buzz", name: "Buzz", description: "A jolt from your soul",
        importance: 5, visibility: 1, vibration: true, lights: true, sound: "default",
      });
    } catch (e) {}

    try {
      pn.addListener("registration", function (t) {
        try {
          if (!t || !t.value) return;
          SP._sb.from("push_tokens").upsert({
            uid: APP.me.id, token: t.value, platform: "android",
            updated_at: new Date().toISOString(),
          }, { onConflict: "token" }).then(function () {});
        } catch (e) {}
      });

      pn.addListener("registrationError", function () {
        if (window.toast) toast("Notifications couldn't register.", true);
      });

      // app open: no tray card — a soft heartbeat + a whisper instead
      pn.addListener("pushNotificationReceived", function (n) {
        try {
          if (window.Native && Native.pattern) Native.pattern([40, 70, 40]);
          var title = (n && n.title) || "";
          var body = (n && n.body) || "";
          if (window.toast && (title || body)) toast((title ? title + ": " : "") + body);
        } catch (e) {}
      });

      // tapped from the tray → open that thread
      pn.addListener("pushNotificationActionPerformed", function (a) {
        try {
          var d = (a && a.notification && a.notification.data) || {};
          if (d.conv) { APP.activeConv = d.conv; Router.go("thread", { c: d.conv }); }
        } catch (e) {}
      });
    } catch (e) {}

    try {
      pn.requestPermissions().then(function (r) {
        try { pn.register(); } catch (e) {}
      }).catch(function () { try { pn.register(); } catch (e) {} });
    } catch (e) {}
  }

  // wait for login, then register (native only)
  try {
    var T = (typeof setInterval === "function") ? setInterval : (window.setInterval ? window.setInterval.bind(window) : null);
    var CI = (typeof clearInterval === "function") ? clearInterval : (window.clearInterval ? window.clearInterval.bind(window) : null);
    if (T && PN()) {
      var tries = 0;
      var iv = T(function () {
        tries++;
        if (window.APP && APP.me) { CI(iv); init(); }
        else if (tries > 60) CI(iv);
      }, 2000);
    }
  } catch (e) {}
})();
