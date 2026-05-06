-- Migration 006: Friend count in profile viewer
-- Run AFTER 005_profile_state_storage.sql. Safe to re-run.
--
-- Extends get_friend_profile() to include 'friend_count' — the number of
-- (non-hidden) accepted friendships for the target user. The count is
-- visible only when the existing friendship/admin gate already lets the
-- caller see the profile, so no new privacy surface is introduced.

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

  -- Hide suspended users from non-admin friends
  IF p.suspended AND NOT viewer_is_admin THEN RETURN NULL; END IF;

  -- Friend count: non-hidden accepted friendships from the target's side
  SELECT count(*) INTO fc
    FROM public.friendships
   WHERE user_id = target_user_id
     AND hidden  = false;

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
    'friend_count',   fc,
    'prs',            CASE
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
