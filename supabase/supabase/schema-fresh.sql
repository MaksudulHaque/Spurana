-- SPURANA · schema-fresh.sql — run ONCE in Supabase SQL Editor.
-- Drops the app tables so columns match the code exactly, then rebuilds
-- with full RLS. Does NOT touch auth.users (logins stay). Pre-launch: safe.
drop table if exists public.pair_codes      cascade;
drop table if exists public.activity_log    cascade;
drop table if exists public.cp_logs          cascade;
drop table if exists public.hc_logs          cascade;
drop table if exists public.unread           cascade;
drop table if exists public.typing           cascade;
drop table if exists public.presence         cascade;
drop table if exists public.soul_card        cascade;
drop table if exists public.listen_session   cascade;
drop table if exists public.watch_session    cascade;
drop table if exists public.rtc_signals      cascade;
drop table if exists public.messages         cascade;
drop table if exists public.conversations    cascade;
drop table if exists public.contacts         cascade;
drop table if exists public.profiles         cascade;

-- ============================================================
-- SPURANA · schema.sql  (canonical — matches the app code exactly)
-- Conversation id = the two user ids sorted + joined with "_".
-- is_member(key) = caller's uid is one half of that key. Every
-- per-couple table is gated by it via RLS.
-- ============================================================
create or replace function public.is_member(key text)
returns boolean language sql stable as $$
  select auth.uid()::text = any (string_to_array(key, '_'))
$$;

-- ===== TABLES (columns mirror src/core/supabase.js) =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text, name text, deity text, realm text, avatar_url text,
  created_at timestamptz default now()
);
create table if not exists public.contacts (
  id bigint generated always as identity primary key,
  owner_uid uuid not null, contact_uid uuid not null, contact_name text,
  created_at timestamptz default now(), unique(owner_uid, contact_uid)
);
create table if not exists public.conversations (
  conv_id text primary key,
  last_msg_preview text, last_msg_ts bigint, last_msg_uid uuid, last_msg_name text,
  updated_at timestamptz default now()
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conv_id text not null, uid uuid not null, name text,
  text text, type text default 'text', url text,
  reactions jsonb default '{}'::jsonb,
  ts bigint, deleted boolean default false, edited_at bigint
);
create index if not exists messages_conv_ts on public.messages(conv_id, ts);
create table if not exists public.rtc_signals (
  channel text primary key, caller_uid uuid not null,
  type text, sdp text, media text, updated_at timestamptz default now()
);
create table if not exists public.watch_session (
  conv_id text primary key,
  video_id text, playing boolean, position double precision, ts bigint,
  last_by uuid, last_by_name text, updated_at timestamptz default now()
);
create table if not exists public.listen_session (
  conv_id text primary key,
  url text, playing boolean, position double precision, ts bigint,
  last_by uuid, last_by_name text, updated_at timestamptz default now()
);
create table if not exists public.soul_card (
  conv_id text primary key,
  card_index int, last_by uuid, last_by_name text, updated_at timestamptz default now()
);
create table if not exists public.presence (
  uid uuid primary key, online boolean, last_seen bigint, updated_at timestamptz default now()
);
create table if not exists public.typing (
  uid uuid primary key, is_typing boolean, conv_id text, updated_at timestamptz default now()
);
create table if not exists public.unread (
  uid uuid not null, conv_id text not null, count int default 0,
  primary key (uid, conv_id)
);
create table if not exists public.hc_logs (
  id bigint generated always as identity primary key,
  uid uuid not null, ts bigint, kind text, pattern text, seconds int
);
create table if not exists public.cp_logs (
  id bigint generated always as identity primary key,
  uid uuid not null, conv_id text, ts bigint, kind text, seconds int
);
create table if not exists public.activity_log (
  id bigint generated always as identity primary key,
  uid uuid not null, kind text, conv_id text, meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create table if not exists public.pair_codes (
  code text primary key, creator_uid uuid not null,
  created_at timestamptz default now(), expires_at timestamptz
);

-- ===== RLS =====
alter table public.profiles       enable row level security;
alter table public.contacts       enable row level security;
alter table public.conversations  enable row level security;
alter table public.messages       enable row level security;
alter table public.rtc_signals    enable row level security;
alter table public.watch_session  enable row level security;
alter table public.listen_session enable row level security;
alter table public.soul_card      enable row level security;
alter table public.presence       enable row level security;
alter table public.typing         enable row level security;
alter table public.unread         enable row level security;
alter table public.hc_logs        enable row level security;
alter table public.cp_logs        enable row level security;
alter table public.activity_log   enable row level security;
alter table public.pair_codes     enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists profiles_write on public.profiles;
create policy profiles_write on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists contacts_rw on public.contacts;
create policy contacts_rw on public.contacts for all to authenticated
  using (owner_uid = auth.uid()) with check (owner_uid = auth.uid());

drop policy if exists conv_rw on public.conversations;
create policy conv_rw on public.conversations for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));

drop policy if exists msg_read on public.messages;
create policy msg_read on public.messages for select to authenticated using (is_member(conv_id));
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated
  with check (uid = auth.uid() and is_member(conv_id));
drop policy if exists msg_update on public.messages;
create policy msg_update on public.messages for update to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));

drop policy if exists rtc_rw on public.rtc_signals;
create policy rtc_rw on public.rtc_signals for all to authenticated
  using (is_member(channel)) with check (is_member(channel));

drop policy if exists watch_rw on public.watch_session;
create policy watch_rw on public.watch_session for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));
drop policy if exists listen_rw on public.listen_session;
create policy listen_rw on public.listen_session for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));
drop policy if exists soul_rw on public.soul_card;
create policy soul_rw on public.soul_card for all to authenticated
  using (is_member(conv_id)) with check (is_member(conv_id));

drop policy if exists presence_read on public.presence;
create policy presence_read on public.presence for select to authenticated using (true);
drop policy if exists presence_write on public.presence;
create policy presence_write on public.presence for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists typing_read on public.typing;
create policy typing_read on public.typing for select to authenticated using (true);
drop policy if exists typing_write on public.typing;
create policy typing_write on public.typing for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());

drop policy if exists unread_rw on public.unread;
create policy unread_rw on public.unread for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists hc_rw on public.hc_logs;
create policy hc_rw on public.hc_logs for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists cp_rw on public.cp_logs;
create policy cp_rw on public.cp_logs for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());
drop policy if exists act_rw on public.activity_log;
create policy act_rw on public.activity_log for all to authenticated
  using (uid = auth.uid()) with check (uid = auth.uid());

-- pair_codes: RLS on, ZERO policies → only the edge function (service role) touches it.

-- ===== STORAGE: private 'media' bucket, path "{conv_id}/{file}" =====
insert into storage.buckets (id, name, public) values ('media','media',false)
on conflict (id) do nothing;
drop policy if exists media_read on storage.objects;
create policy media_read on storage.objects for select to authenticated
  using (bucket_id = 'media' and is_member(split_part(name,'/',1)));
drop policy if exists media_write on storage.objects;
create policy media_write on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and is_member(split_part(name,'/',1)));

-- ===== REALTIME =====
do $$ begin alter publication supabase_realtime add table public.messages;      exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.rtc_signals;    exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.watch_session;  exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.listen_session; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.soul_card;      exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.presence;       exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.typing;         exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.conversations;  exception when duplicate_object then null; end $$;
