/* ============================================================================
 * SPURANA · Supabase Client Module  (Beta Green L 1 · OJOS ROJOS INC · 2026)
 * v2 — SCHEMA-MATCHED (verified against the live database column names)
 * Supersedes the earlier spurana-supabase.js — delete the older copy.
 * ----------------------------------------------------------------------------
 * LOAD (in index.html, before this file):
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="spurana-supabase.js"></script>
 * Everything is then available under  window.SP
 *
 * RULES BAKED IN:
 *  - ONE client instance. Publishable key only.
 *  - conv_id deterministic: sorted(uidA,uidB) joined by "_".
 *  - REALTIME DISCIPLINE: only the ACTIVE conversation holds a subscription;
 *    SP.chat.join() auto-closes the previous one (free-tier 200-conn ceiling).
 *  - Media path: {conv_id}/{uuid}.{ext}; the storage path is saved in messages.url
 *  - Every method returns { data, error }.
 * ==========================================================================*/
(function () {
  "use strict";

  const SUPABASE_URL = "https://voztfjtahecsbroictxl.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_etbybaOfcIvOh7LFaxmnpQ_-7IggfAM";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("[SP] supabase-js not loaded. Add the CDN <script> before this file.");
    return;
  }

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });

  const ok = (data) => ({ data, error: null });
  const err = (error) => ({ data: null, error });
  function convIdFor(a, b) { return a < b ? `${a}_${b}` : `${b}_${a}`; }
  function uuid() {
    return (crypto.randomUUID && crypto.randomUUID()) ||
      "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
  }
  async function currentUser() {
    const { data } = await sb.auth.getUser();
    return data && data.user ? data.user : null;
  }
  // cache the signed-in profile name (used as messages.name for rendering)
  let _myName = null;
  async function myName() {
    if (_myName) return _myName;
    const u = await currentUser(); if (!u) return null;
    const { data } = await sb.from("profiles").select("name").eq("id", u.id).maybeSingle();
    _myName = (data && data.name) || "A soul"; return _myName;
  }

  // ===========================================================================
  // AUTH
  // ===========================================================================
  const auth = {
    async signUp({ email, password, name, deity, realm, consent }) {
      if (!consent) return err(new Error("You must accept the Privacy & Consent Notice."));
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return err(error);
      const u = data.user;
      if (u) {
        await sb.from("profiles").upsert({ id: u.id, email, name: name || "A soul", deity: deity || null, realm: realm || null });
        await sb.from("activity_log").insert({ uid: u.id, kind: "signup", meta: {} });
        _myName = name || "A soul";
      }
      return ok(data);
    },
    async signIn({ email, password }) {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return err(error);
      if (data.user) { _myName = null; await sb.from("activity_log").insert({ uid: data.user.id, kind: "login", meta: {} }); }
      return ok(data);
    },
    async signOut() { _myName = null; return ok(await sb.auth.signOut()); },
    async signOutEverywhere() { _myName = null; return ok(await sb.auth.signOut({ scope: "global" })); },
    async getSession() { const { data } = await sb.auth.getSession(); return ok(data.session); },
    onChange(cb) { return sb.auth.onAuthStateChange((event, session) => cb(event, session)); },
    async resetPassword(email) { return ok(await sb.auth.resetPasswordForEmail(email)); },
  };

  // ===========================================================================
  // PROFILE
  // ===========================================================================
  const profile = {
    async get(uid) {
      const id = uid || (await currentUser())?.id;
      if (!id) return err(new Error("not signed in"));
      const { data, error } = await sb.from("profiles").select("*").eq("id", id).single();
      return error ? err(error) : ok(data);
    },
    async update(fields) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      if (fields.name) _myName = fields.name;
      const { data, error } = await sb.from("profiles").update(fields).eq("id", u.id).select().single();
      return error ? err(error) : ok(data);
    },
  };

  // ===========================================================================
  // PAIRING / BONDING — uses the `pair` Edge Function
  // ===========================================================================
  const pair = {
    async createInvite() {
      const { data, error } = await sb.functions.invoke("pair", { body: { action: "create" } });
      return error ? err(error) : ok(data); // { code, expires_at }
    },
    async redeemInvite(code) {
      const { data, error } = await sb.functions.invoke("pair", { body: { action: "redeem", code } });
      return error ? err(error) : ok(data); // { conv_id, partner_uid, partner_name }
    },
  };

  // ===========================================================================
  // CONTACTS / CONVERSATIONS
  // ===========================================================================
  const contacts = {
    async list() {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      const { data, error } = await sb.from("contacts").select("*").eq("owner_uid", u.id);
      return error ? err(error) : ok(data);
    },
    async convIdWith(partnerUid) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      return ok(convIdFor(u.id, partnerUid));
    },
  };

  // ===========================================================================
  // CHAT — realtime scoped to the ACTIVE conversation only
  // ===========================================================================
  let _activeChannel = null;
  const chat = {
    async history(convId, limit = 50) {
      const { data, error } = await sb.from("messages").select("*")
        .eq("conv_id", convId).order("ts", { ascending: true }).limit(limit);
      return error ? err(error) : ok(data);
    },
    // opts: { text, type='text', url=null (storage path for media), reactions=null }
    async send(convId, opts) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      const o = opts || {};
      const row = { conv_id: convId, uid: u.id, name: await myName(), text: o.text || null, type: o.type || "text", ts: Date.now() };
      if (o.url) row.url = o.url;                 // media stored in messages.url
      if (o.reactions) row.reactions = o.reactions;
      const { data, error } = await sb.from("messages").insert(row).select().single();
      if (!error) {
        await sb.from("conversations").upsert({
          conv_id: convId,
          last_msg_preview: (o.text || o.type || "message").slice(0, 120),
          last_msg_ts: Date.now(), last_msg_uid: u.id, last_msg_name: await myName(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "conv_id" });
      }
      return error ? err(error) : ok(data);
    },
    async react(messageId, reactions) {
      const { data, error } = await sb.from("messages").update({ reactions }).eq("id", messageId).select().single();
      return error ? err(error) : ok(data);
    },
    async edit(messageId, text) {
      const { data, error } = await sb.from("messages").update({ text, edited_at: Date.now() }).eq("id", messageId).select().single();
      return error ? err(error) : ok(data);
    },
    async remove(messageId) {
      const { data, error } = await sb.from("messages").update({ deleted: true }).eq("id", messageId).select().single();
      return error ? err(error) : ok(data);
    },
    join(convId, onInsert, onUpdate) {
      this.leave();
      _activeChannel = sb.channel("conv:" + convId)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conv_id=eq.${convId}` },
          (p) => onInsert && onInsert(p.new))
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `conv_id=eq.${convId}` },
          (p) => onUpdate && onUpdate(p.new))
        .subscribe();
      return _activeChannel;
    },
    leave() { if (_activeChannel) { sb.removeChannel(_activeChannel); _activeChannel = null; } },
    async markRead(convId) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      return ok(await sb.from("unread").upsert({ uid: u.id, conv_id: convId, count: 0 }));
    },
  };

  // ===========================================================================
  // MEDIA — private 'media' bucket, path {conv_id}/{uuid}.{ext}; path saved in messages.url
  // ===========================================================================
  const media = {
    async upload(convId, file) {
      const ext = (file.name && file.name.split(".").pop()) || "bin";
      const path = `${convId}/${uuid()}.${ext}`;
      const { error } = await sb.storage.from("media").upload(path, file, { upsert: false });
      return error ? err(error) : ok({ path }); // pass path as send(convId,{type:'image',url:path})
    },
    async signedUrl(path, expiresSec = 3600) {
      const { data, error } = await sb.storage.from("media").createSignedUrl(path, expiresSec);
      return error ? err(error) : ok(data.signedUrl);
    },
  };

  // ===========================================================================
  // PRESENCE / TYPING — typing throttled to 1/sec
  // ===========================================================================
  let _typingAt = 0;
  const presence = {
    async setOnline(online) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      return ok(await sb.from("presence").upsert({ uid: u.id, online, last_seen: Date.now(), updated_at: new Date().toISOString() }));
    },
    async setTyping(isTyping) {
      const now = Date.now(); if (now - _typingAt < 1000) return ok(null);
      _typingAt = now;
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      return ok(await sb.from("typing").upsert({ uid: u.id, is_typing: isTyping, updated_at: new Date().toISOString() }));
    },
  };

  // ===========================================================================
  // CALLS — WebRTC signaling over rtc_signals (channel === conv_id).
  // Keep your SacredCall engine; swap only the transport to these helpers.
  // ===========================================================================
  let _rtcChannel = null;
  const calls = {
    async sendSignal(convId, payload) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      const row = { channel: convId, caller_uid: u.id, updated_at: new Date().toISOString(), ...payload };
      return ok(await sb.from("rtc_signals").upsert(row, { onConflict: "channel" }));
    },
    subscribe(convId, onSignal) {
      this.unsubscribe();
      _rtcChannel = sb.channel("rtc:" + convId)
        .on("postgres_changes", { event: "*", schema: "public", table: "rtc_signals", filter: `channel=eq.${convId}` },
          (p) => onSignal && onSignal(p.new))
        .subscribe();
      return _rtcChannel;
    },
    unsubscribe() { if (_rtcChannel) { sb.removeChannel(_rtcChannel); _rtcChannel = null; } },
    async clear(convId) { return ok(await sb.from("rtc_signals").delete().eq("channel", convId)); },
  };

  // ===========================================================================
  // SHARED EXPERIENCES — per-couple watch / listen / soul card
  // ===========================================================================
  function sharedTable(table) {
    return {
      async get(convId) {
        const { data, error } = await sb.from(table).select("*").eq("conv_id", convId).maybeSingle();
        return error ? err(error) : ok(data);
      },
      async set(convId, fields) {
        const u = await currentUser();
        const row = { conv_id: convId, ...fields, last_by: u?.id, last_by_name: await myName(), updated_at: new Date().toISOString() };
        return ok(await sb.from(table).upsert(row, { onConflict: "conv_id" }));
      },
      subscribe(convId, cb) {
        return sb.channel(`${table}:${convId}`)
          .on("postgres_changes", { event: "*", schema: "public", table, filter: `conv_id=eq.${convId}` },
            (p) => cb && cb(p.new))
          .subscribe();
      },
    };
  }
  const shared = {
    watch: sharedTable("watch_session"),
    listen: sharedTable("listen_session"),
    soulCard: sharedTable("soul_card"),
    async logPractice(table, fields) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      return ok(await sb.from(table).insert({ uid: u.id, ts: Date.now(), ...fields }));
    },
  };

  const activity = {
    async log(kind, meta = {}, convId = null) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      return ok(await sb.from("activity_log").insert({ uid: u.id, kind, conv_id: convId, meta }));
    },
    async recent(limit = 50) {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      const { data, error } = await sb.from("activity_log").select("*")
        .eq("uid", u.id).order("created_at", { ascending: false }).limit(limit);
      return error ? err(error) : ok(data);
    },
  };

  const account = {
    async exportData() {
      const u = await currentUser(); if (!u) return err(new Error("not signed in"));
      const map = { profiles: "id", messages: "uid", contacts: "owner_uid", activity_log: "uid", hc_logs: "uid", cp_logs: "uid" };
      const out = {};
      for (const t in map) { const { data } = await sb.from(t).select("*").eq(map[t], u.id); out[t] = data || []; }
      return ok(out);
    },
    async deleteAccount() {
      const { data, error } = await sb.functions.invoke("delete-account", { body: { confirm: "DELETE" } });
      if (!error) await sb.auth.signOut();
      return error ? err(error) : ok(data);
    },
  };

  window.SP = { _sb: sb, convIdFor, uuid, auth, profile, pair, contacts, chat, media, presence, calls, shared, activity, account };
  console.log("[SP] Spurana Supabase client v2 (schema-matched) ready.");
})();
