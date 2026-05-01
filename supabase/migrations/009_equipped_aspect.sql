-- Migration 009: Equipped aspect (level-30 awakening)
-- Run AFTER 008_equipped_title.sql. Safe to re-run.
--
-- Stores the user's permanent aspect choice as a human-readable name
-- (e.g., "Beast" / "Shadow" / "Architect" / "Sovereign"). Nullable;
-- 30-char cap.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS equipped_aspect text
    CHECK (equipped_aspect IS NULL OR length(equipped_aspect) <= 30);

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
  p.suspended
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
