-- ============================================================
-- SPURANA · schema.sql — tables + Row-Level Security (RLS)
-- THE security boundary. The app uses a public (publishable/anon)
-- key, so EVERYTHING that protects user data is the RLS below.
-- Run in Supabase → SQL Editor. Safe to re-run (idempotent).
--
-- Core idea: a conversation id is the two user ids sorted and
-- joined with "_"  (SP.convIdFor → "uidA_uidB"). So "is the caller
-- a member of this conversation?" = the caller's uid is one of the
-- two halves of conv_id. No separate members table needed.
-- ============================================================

-- ---- helper: is auth.uid() a member of a "a_b" conversation key? ----
create or replace function public.is_member(key text)
returns boolean language sql stable as $$
  select auth.uid()::text = any (string_to_array(key, '_'))
$$;

-- =========================== TABLES ===========================
-- (create-if-not-exists; if your tables already exist with these
--  columns, these are no-ops. Reconcile names if yours differ.)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text, avatar_url text, created_at timestamptz default now()
);

create table if not exists public.contacts (
  id bigint generated always as identity primary key,
  uid uuid not null, contact_uid uuid not null, contact_name text,
  created_at timestamptz default now(), unique(uid, contact_uid)
);

create table if not exists public.conversations (
  conv_id text primary key,
  last_preview text, last_ts bigint, updated_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conv_id text not null, uid uuid not null, name text,
  text text, type text default 'text', url text,
  reactions jsonb default '{}'::jsonb,
  ts bigint, deleted boolean default false, edited_at timestamptz
);
create index if not exists messages_conv_ts on public.messages(conv_id, ts);
create index if not exists messages_conv_type on public.messages(conv_id, type);

create table if not exists public.rtc_signals (
  channel text not null, caller_uid uuid not null,
  type text, sdp text, media text, updated_at timestamptz default now(),
  primary key (channel, caller_uid)
);

create table if not exists public.watch_session (
  conv_id text primary key, video_id text, playing boolean,
  position double precision, ts bigint, last_by uuid, updated_at timestamptz default now()
);
create table if not exists public.listen_session (
  conv_id text primary key, url text, playing boolean,
  position double precision, ts bigint, last_by uuid, updated_at timestamptz default now()
);
create table if not exists public.soul_card (
  conv_id text primary key, card_index int, drawn_at timestamptz default now()
);

create table if not exists public.hc_logs (
  id bigint generated always as identity primary key,
  uid uuid not null, ts bigint, kind text, seconds int, pattern text
);
create table if not exists public.cp_logs (
  id bigint generated always as identity primary key,
  uid uuid not null, conv_id text, ts bigint, kind text, seconds int
);
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  uid uuid not null, ts bigint, kind text, detail jsonb
);

-- =========================== RLS ===========================
alter table public.profiles       enable row level security;
alter table public.contacts       enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.rtc_signals    enable row level security;
alter table public.watch_session  enable row level security;
alter table public.listen_session enable row level security;
alter table public.soul_card      enable row level security;
alter table public.hc_logs        enable row level security;
alter table public.cp_logs        enable row level security;
alter table public.activity_log   enable row level security;

-- ---- profiles: read any profile's PUBLIC fields (name/avatar only),
--      but only the owner may write their own. Keep no private data here.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---- contacts: only your own pairing rows ----
drop policy if exists contacts_rw on public.contacts;
create policy contacts_rw on public.contacts for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());

-- ---- conversations: only members of the conversation ----
drop policy if exists conv_rw on public.conversations;
create policy conv_rw on public.conversations for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));

-- ---- messages (incl. keepsakes): members read; sender writes own;
--      sender edits/deletes own. This is the heart of the app's privacy.
drop policy if exists msg_read on public.messages;
create policy msg_read on public.messages for select to authenticated using (is_member(conv_id));
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated
  with check (uid = auth.uid() and is_member(conv_id));
drop policy if exists msg_update on public.messages;
create policy msg_update on public.messages for update to authenticated
  using (uid = auth.uid() and is_member(conv_id)) with check (uid = auth.uid());

-- ---- WebRTC signaling: members of the channel only ----
drop policy if exists rtc_rw on public.rtc_signals;
create policy rtc_rw on public.rtc_signals for all to authenticated
  using (is_member(channel)) with check (is_member(channel) and caller_uid = auth.uid());

-- ---- shared sessions (watch / listen / soul card): members only ----
drop policy if exists watch_rw on public.watch_session;
create policy watch_rw on public.watch_session for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));
drop policy if exists listen_rw on public.listen_session;
create policy listen_rw on public.listen_session for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));
drop policy if exists soul_rw on public.soul_card;
create policy soul_rw on public.soul_card for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));

-- ---- practice / activity logs: strictly your own ----
drop policy if exists hc_rw on public.hc_logs;
create policy hc_rw on public.hc_logs for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists cp_rw on public.cp_logs;
create policy cp_rw on public.cp_logs for all to authenticated
  using (uid = auth.uid() and (conv_id is null or is_member(conv_id)))
  with check (uid = auth.uid());
drop policy if exists act_rw on public.activity_log;
create policy act_rw on public.activity_log for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());

-- =========================== STORAGE ===========================
-- private 'media' bucket: only members of the conv-prefixed path.
-- Media.upload stores at  <conv_id>/<file>  →  first path segment = conv_id.
insert into storage.buckets (id, name, public) values ('media','media', false)
  on conflict (id) do nothing;
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select to authenticated
  using (bucket_id = 'media' and is_member(split_part(name,'/',1)));
drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_member(split_part(name,'/',1)));

-- =========================== REALTIME ===========================
-- expose the tables the app subscribes to over Realtime.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.rtc_signals;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.watch_session;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.listen_session;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.soul_card;
exception when duplicate_object then null; end $$;

-- ============================================================
-- After running: log in on two accounts, pair them, and confirm
-- each can read ONLY their shared conversation. Then try to read
-- another conv_id's messages from the SQL/REST API as one user —
-- it must return zero rows. That negative result is your proof.
-- ============================================================
