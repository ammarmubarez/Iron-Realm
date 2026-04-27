-- Iron Realm — Supabase schema (v1.7 — Social foundation)
-- Run this in the Supabase SQL editor BEFORE policies.sql.
-- Idempotent: safe to re-run.

-- ── PROFILES ──────────────────────────────────────────────────────────────
-- Public mirror of each user's active local profile. Source of truth for the
-- friend leaderboard. The local app keeps full state (workouts, sub-stats,
-- per-muscle XP, etc.); this row is a compact snapshot for sharing.

create table if not exists public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null
                 check (
                   length(username) between 3 and 20
                   and username ~ '^[a-z0-9_]+$'
                 ),
  display_name   text,
  monarch_theme  text,
  rank_label     text,
  overall_level  int  not null default 1,
  overall_xp     int  not null default 0,
  weekly_xp      int  not null default 0,
  total_workouts int  not null default 0,
  prs            jsonb not null default '{}'::jsonb,
  share_prs      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists profiles_overall_xp_idx
  on public.profiles (overall_xp desc);
create index if not exists profiles_weekly_xp_idx
  on public.profiles (weekly_xp desc);
create index if not exists profiles_username_lookup
  on public.profiles (username);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ── FRIEND REQUESTS ────────────────────────────────────────────────────────
create table if not exists public.friend_requests (
  id           uuid primary key default gen_random_uuid(),
  from_user    uuid not null references auth.users(id) on delete cascade,
  to_user      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending','accepted','rejected')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  unique (from_user, to_user),
  check (from_user <> to_user)
);

create index if not exists friend_requests_to_pending
  on public.friend_requests (to_user) where status = 'pending';
create index if not exists friend_requests_from_pending
  on public.friend_requests (from_user) where status = 'pending';


-- ── FRIENDSHIPS ────────────────────────────────────────────────────────────
-- Two rows per accepted pair so symmetric queries are O(1).
create table if not exists public.friendships (
  user_id    uuid not null references auth.users(id) on delete cascade,
  friend_id  uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

create index if not exists friendships_user_idx on public.friendships (user_id);


-- ── ACCEPT TRIGGER ─────────────────────────────────────────────────────────
-- When a friend_request transitions to 'accepted', materialise both
-- friendship rows. Runs as security definer so it can write to friendships
-- without an INSERT policy.
create or replace function public.handle_friend_request_accepted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.friendships (user_id, friend_id)
      values (new.from_user, new.to_user)
      on conflict do nothing;
    insert into public.friendships (user_id, friend_id)
      values (new.to_user, new.from_user)
      on conflict do nothing;
    new.responded_at := now();
  elsif new.status = 'rejected' and old.status <> 'rejected' then
    new.responded_at := now();
  end if;
  return new;
end$$;

drop trigger if exists friend_requests_on_accept on public.friend_requests;
create trigger friend_requests_on_accept
  before update on public.friend_requests
  for each row execute function public.handle_friend_request_accepted();


-- ── UNFRIEND MIRROR ────────────────────────────────────────────────────────
-- When one side deletes the friendship, drop the mirror row too. Runs as
-- security definer so it bypasses the per-row delete policy.
create or replace function public.handle_friendship_unfriend()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.friendships
   where user_id = old.friend_id and friend_id = old.user_id;
  return old;
end$$;

drop trigger if exists friendships_mirror_delete on public.friendships;
create trigger friendships_mirror_delete
  after delete on public.friendships
  for each row execute function public.handle_friendship_unfriend();


-- ── LEADERBOARD VIEW ───────────────────────────────────────────────────────
-- Friends-only feed for the active user. RLS on friendships + profiles
-- ensures callers only see their own non-hidden friends' rows.
-- Admin auto-friends every new user (hidden=false on admin side) so their
-- view naturally includes all users — no separate query path needed.
-- PRs blanked when share_prs=false unless viewer is admin.
create or replace view public.friend_leaderboard as
select
  f.user_id      as viewer_id,
  p.user_id      as friend_id,
  p.username,
  p.display_name,
  p.monarch_theme,
  p.rank_label,
  p.overall_level,
  p.overall_xp,
  p.weekly_xp,
  p.total_workouts,
  case
    when (select is_admin from public.profiles where user_id = auth.uid()) = true
      then p.prs
    when p.share_prs
      then p.prs
    else '{}'::jsonb
  end as prs,
  p.updated_at
from public.friendships f
join public.profiles p on p.user_id = f.friend_id
where f.hidden = false;
