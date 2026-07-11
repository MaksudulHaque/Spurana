/* ============================================================
 * SPURANA · core/keepsake.js — store for "Remember" keepsakes.
 * Polymorphic rows in the existing `messages` table, keyed by a
 * custom `type` (letter | memory | gratitude | sacred_day).
 * Inserts directly (no conversations preview pollution). The
 * chat thread excludes these types so they live only in their
 * own screens. No new tables required.
 * ============================================================ */
window.Keepsake = (function () {
  "use strict";
  const TYPES = ["letter", "memory", "gratitude", "sacred_day", "reflection", "echo", "mood", "reminder"];
  async function list(conv, type) {
    try {
      const { data, error } = await SP._sb.from("messages").select("*")
        .eq("conv_id", conv).eq("type", type).order("ts", { ascending: false }).limit(200);
      return error ? [] : (data || []).filter((m) => !m.deleted);
    } catch (e) { return []; }
  }
  async function add(conv, type, fields) {
    const me = APP.me && APP.me.id; const name = (APP.profile && APP.profile.name) || "A soul";
    const row = Object.assign({ conv_id: conv, uid: me, name: name, type: type, ts: Date.now() }, fields || {});
    try { const { data, error } = await SP._sb.from("messages").insert(row).select().single(); return error ? null : data; }
    catch (e) { return null; }
  }
  async function remove(id) { try { await SP._sb.from("messages").update({ deleted: true }).eq("id", id); return true; } catch (e) { return false; } }
  function subscribe(conv, type, cb) {
    try {
      return SP._sb.channel("keep:" + type + ":" + conv)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "conv_id=eq." + conv },
          (p) => { if (p.new && p.new.type === type && !p.new.deleted) cb(p.new); })
        .subscribe();
    } catch (e) { return null; }
  }
  function unsub(ch) { try { if (ch && SP._sb) SP._sb.removeChannel(ch); } catch (e) {} }
  return { TYPES, list, add, remove, subscribe, unsub };
})();
