-- Migration 001: Admin system
-- Run in Supabase SQL Editor AFTER schema.sql and policies.sql.
-- Safe to re-run (all statements use IF NOT EXISTS / DROP IF EXISTS / OR REPLACE).

-- ── 1. New columns ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- hidden=true means this side of the friendship is invisible to user_id.
-- Used so admin can silently follow every new user without appearing in
-- their friends list until admin chooses to reveal themselves.
ALTER TABLE public.friendships
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- ── 2. Updated friendships select policy ─────────────────────────────────────
-- Old: both sides can see any friendship they are part of.
-- New: user_id side only sees the row when hidden=false OR they are admin.
--      friend_id side always sees it (admin needs this to manage their rows).

DROP POLICY IF EXISTS "fs_select" ON public.friendships;
CREATE POLICY "fs_select" ON public.friendships
  FOR SELECT USING (
    auth.uid() = friend_id
    OR (
      auth.uid() = user_id
      AND (
        hidden = false
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE user_id = auth.uid() AND is_admin = true
        )
      )
    )
  );

-- ── 3. Admin can toggle hidden on rows where they are friend_id ───────────────
-- This lets admin reveal (hidden→false) or re-hide (hidden→true)
-- themselves in any user's friends list.

DROP POLICY IF EXISTS "fs_admin_update" ON public.friendships;
CREATE POLICY "fs_admin_update" ON public.friendships
  FOR UPDATE USING (
    friend_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ── 4. Auto-friend trigger ────────────────────────────────────────────────────
-- Fires after every new profile insert.
-- Finds the admin (if one exists) and silently creates the two friendship rows:
--   admin → new user  : hidden=false  (admin sees them immediately)
--   new user → admin  : hidden=true   (admin is invisible until revealed)

CREATE OR REPLACE FUNCTION public.on_profile_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT user_id INTO admin_id
    FROM public.profiles
   WHERE is_admin = true
   LIMIT 1;

  IF admin_id IS NOT NULL AND admin_id <> NEW.user_id THEN
    INSERT INTO public.friendships (user_id, friend_id, hidden)
      VALUES (admin_id, NEW.user_id, false)
      ON CONFLICT DO NOTHING;

    INSERT INTO public.friendships (user_id, friend_id, hidden)
      VALUES (NEW.user_id, admin_id, true)
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.on_profile_created();

-- ── 5. After running this file, promote your account ─────────────────────────
-- Run this separately in the SQL Editor (replace with your actual username):
--
--   UPDATE public.profiles SET is_admin = true WHERE username = 'your_username';
--
-- Once set, every future sign-up will be silently auto-friended with you.
-- Existing accounts (e.g. test users created before this migration) will NOT
-- be auto-friended — add them manually if needed:
--
--   INSERT INTO public.friendships (user_id, friend_id, hidden)
--     VALUES ('<admin_user_id>', '<other_user_id>', false)
--     ON CONFLICT DO NOTHING;
--   INSERT INTO public.friendships (user_id, friend_id, hidden)
--     VALUES ('<other_user_id>', '<admin_user_id>', true)
--     ON CONFLICT DO NOTHING;
