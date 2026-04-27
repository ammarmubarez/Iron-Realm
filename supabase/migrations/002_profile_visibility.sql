-- Migration 002: Profile visibility — friend profile gating + leaderboard fixes
-- Run in Supabase SQL Editor AFTER 001_admin.sql.
-- Safe to re-run.

-- ── 1. Updated friend_leaderboard view ───────────────────────────────────────
-- Changes from original:
--   • WHERE f.hidden = false — hidden shadow-friendships are excluded so
--     new users don't see admin in their leaderboard until revealed.
--   • PR masking now checks is_admin: admin always gets full prs jsonb;
--     everyone else gets it only when share_prs = true.
--
-- Why admin still sees everyone:
--   The auto-friend trigger inserts (user_id=admin, friend_id=newuser, hidden=false)
--   for every new sign-up. So the view naturally returns all users for admin
--   without a separate query path.

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

-- ── 2. get_friend_profile RPC — gated individual profile fetch ────────────────
-- Clients call: supabase.rpc('get_friend_profile', { target_user_id: '...' })
--
-- Access rules:
--   • Not authenticated           → null
--   • Authenticated, not a friend → null  (privacy gate)
--   • Friend (regular user)       → public fields; prs only if share_prs = true
--   • Admin                       → all fields, prs always included
--
-- SECURITY DEFINER lets the function read profiles directly without being
-- blocked by RLS; it enforces its own access rules above.

create or replace function public.get_friend_profile(target_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  viewer_id        uuid    := auth.uid();
  viewer_is_admin  boolean := false;
  is_friend        boolean := false;
  p                public.profiles%rowtype;
  result           jsonb;
begin
  if viewer_id is null then return null; end if;

  select is_admin into viewer_is_admin
    from public.profiles
   where user_id = viewer_id;

  -- Friends check: a non-hidden friendship row must exist
  select exists (
    select 1 from public.friendships
     where user_id = viewer_id
       and friend_id = target_user_id
       and hidden = false
  ) into is_friend;

  if not (is_friend or viewer_is_admin) then return null; end if;

  select * into p from public.profiles where user_id = target_user_id;
  if not found then return null; end if;

  -- Fields visible to all friends
  result := jsonb_build_object(
    'user_id',        p.user_id,
    'username',       p.username,
    'display_name',   p.display_name,
    'monarch_theme',  p.monarch_theme,
    'rank_label',     p.rank_label,
    'overall_level',  p.overall_level,
    'overall_xp',     p.overall_xp,
    'weekly_xp',      p.weekly_xp,
    'total_workouts', p.total_workouts,
    'updated_at',     p.updated_at,
    'prs',            case
                        when viewer_is_admin or p.share_prs then p.prs
                        else '{}'::jsonb
                      end
  );

  -- Extra fields only admin receives
  if viewer_is_admin then
    result := result || jsonb_build_object(
      'share_prs',  p.share_prs,
      'is_admin',   p.is_admin,
      'created_at', p.created_at
    );
  end if;

  return result;
end;
$$;

grant execute on function public.get_friend_profile(uuid) to authenticated;
