-- Migration 014: Prestige (v2.16)
-- Run in the Supabase SQL Editor AFTER 013_xp_audit.sql. Safe to re-run.
--
-- A hunter at level 55 with every muscle group balanced may prestige: Hunter
-- level returns to 1 and they carry a mark. The device owns the rule and the
-- history (profile.prestige); the server mirrors ONLY the count, so friends
-- and the leaderboard can show the mark. Muscle levels never reset — see
-- src/data/prestige.js for why.
--
-- Also widens the xp_audit type check so a prestige is recorded in the founder
-- audit trail as what it is, rather than as an unexplained −300,000 XP delete.
-- UNTIL THIS RUNS, audit rows from a prestiged device fail the CHECK and that
-- device's audit batch stops mirroring — run it with the release.

-- ── 1. The mark ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prestige_count int NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_prestige_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_prestige_range
      CHECK (prestige_count BETWEEN 0 AND 10);
  END IF;
END$$;

-- ── 2. Audit trail accepts the new event type ────────────────────────────────
ALTER TABLE public.xp_audit DROP CONSTRAINT IF EXISTS xp_audit_type_check;
ALTER TABLE public.xp_audit ADD CONSTRAINT xp_audit_type_check
  CHECK (type IN ('log','edit','delete','revert','import','repair','prestige'));

-- ── 3. Public surfaces carry the count ───────────────────────────────────────
-- CREATE OR REPLACE VIEW may only append columns, so prestige_count goes last.
CREATE OR REPLACE VIEW public.friend_leaderboard AS
SELECT
  f.user_id      AS viewer_id,
  p.user_id      AS friend_id,
  p.username,
  p.display_name,
  p.monarch_theme,
  p.banner_color,
  p.equipped_title,
  p.equipped_aspect,
  p.rank_label,
  p.overall_level,
  p.overall_xp,
  p.weekly_xp,
  p.total_workouts,
  CASE
    WHEN (SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()) = true
      THEN p.prs
    WHEN p.share_prs
      THEN p.prs
    ELSE '{}'::jsonb
  END AS prs,
  p.updated_at,
  p.suspended,
  p.prestige_count
FROM public.friendships f
JOIN public.profiles p ON p.user_id = f.friend_id
WHERE f.hidden = false
  AND (
    p.suspended = false
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

CREATE OR REPLACE VIEW public.profile_directory AS
SELECT
  user_id,
  username,
  display_name,
  overall_level,
  rank_label,
  monarch_theme,
  banner_color,
  equipped_title,
  equipped_aspect,
  prestige_count
FROM public.profiles
WHERE suspended = false;

GRANT SELECT ON public.profile_directory TO authenticated;
REVOKE ALL ON public.profile_directory FROM anon;

CREATE OR REPLACE FUNCTION public.get_friend_profile(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  viewer_id        uuid    := auth.uid();
  viewer_is_admin  boolean := false;
  is_friend        boolean := false;
  p                public.profiles%ROWTYPE;
  fc               integer := 0;
  result           jsonb;
BEGIN
  IF viewer_id IS NULL THEN RETURN NULL; END IF;

  SELECT is_admin INTO viewer_is_admin
    FROM public.profiles
   WHERE user_id = viewer_id;

  SELECT EXISTS (
    SELECT 1 FROM public.friendships
     WHERE user_id = viewer_id
       AND friend_id = target_user_id
       AND hidden = false
  ) INTO is_friend;

  IF NOT (is_friend OR viewer_is_admin) THEN RETURN NULL; END IF;

  SELECT * INTO p FROM public.profiles WHERE user_id = target_user_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  IF p.suspended AND NOT viewer_is_admin THEN RETURN NULL; END IF;

  SELECT count(*) INTO fc
    FROM public.friendships
   WHERE user_id = target_user_id
     AND hidden  = false;

  result := jsonb_build_object(
    'user_id',         p.user_id,
    'username',        p.username,
    'display_name',    p.display_name,
    'monarch_theme',   p.monarch_theme,
    'banner_color',    p.banner_color,
    'equipped_title',  p.equipped_title,
    'equipped_aspect', p.equipped_aspect,
    'rank_label',      p.rank_label,
    'overall_level',   p.overall_level,
    'overall_xp',      p.overall_xp,
    'weekly_xp',       p.weekly_xp,
    'total_workouts',  p.total_workouts,
    'prestige_count',  p.prestige_count,
    'updated_at',      p.updated_at,
    'friend_count',    fc,
    'prs',             CASE
                         WHEN viewer_is_admin OR p.share_prs THEN p.prs
                         ELSE '{}'::jsonb
                       END
  );

  IF viewer_is_admin THEN
    result := result || jsonb_build_object(
      'share_prs',  p.share_prs,
      'is_admin',   p.is_admin,
      'suspended',  p.suspended,
      'created_at', p.created_at
    );
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_friend_profile(uuid) TO authenticated;
