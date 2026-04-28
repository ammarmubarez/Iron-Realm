-- Migration 003: Admin moderation tools
-- Run in Supabase SQL Editor AFTER 002_profile_visibility.sql.
-- Safe to re-run.

-- ── 1. Suspended flag ─────────────────────────────────────────────────────────
-- Suspended profiles are hidden from leaderboards and from get_friend_profile
-- for non-admins. They can still sign in (Supabase Auth has its own ban
-- mechanism if you want to prevent that), but they're invisible to the social
-- layer.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- ── 2. Admin can UPDATE any profile ──────────────────────────────────────────
-- Adds a parallel UPDATE policy. Policies are OR'd: regular users still update
-- only their own row (existing profiles_update policy), admin updates anyone.

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ── 3. Updated leaderboard view: hide suspended users from non-admins ────────

CREATE OR REPLACE VIEW public.friend_leaderboard AS
SELECT
  f.user_id      AS viewer_id,
  p.user_id      AS friend_id,
  p.username,
  p.display_name,
  p.monarch_theme,
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

-- ── 4. Updated get_friend_profile: null for suspended users (non-admin) ──────

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

-- ── 5. admin_get_user_email — fetch email for password-reset trigger ─────────
-- The reset email itself is sent client-side via auth.resetPasswordForEmail.
-- This RPC just exposes the target's email to admin (it lives in auth.users
-- which the client cannot read directly).

CREATE OR REPLACE FUNCTION public.admin_get_user_email(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  viewer_is_admin boolean := false;
  target_email    text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;

  SELECT is_admin INTO viewer_is_admin
    FROM public.profiles
   WHERE user_id = auth.uid();

  IF NOT viewer_is_admin THEN RETURN NULL; END IF;

  SELECT email INTO target_email
    FROM auth.users
   WHERE id = target_user_id;

  RETURN target_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_email(uuid) TO authenticated;
