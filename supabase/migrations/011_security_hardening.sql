-- Migration 011: Security hardening (v2.3)
-- Run in the Supabase SQL Editor AFTER 010_patron_lift.sql. Safe to re-run.
--
-- Closes four findings from the v2.3 security audit:
--
--  1. PRIVILEGE ESCALATION. profiles_update lets a user write any column of
--     their own row, including is_admin and suspended. A signed-in user could
--     run  update profiles set is_admin = true  from the browser console and
--     gain every admin power (read all PRs, fetch any user's email, trigger
--     password resets, suspend accounts). A BEFORE trigger now refuses any
--     change to the privileged columns unless the caller is already admin.
--
--  2. PRIVATE DATA READABLE. profiles_select was `using (true)`, so any
--     authenticated user could select every row of profiles directly —
--     including prs of users who set share_prs = false, and the is_admin /
--     suspended flags. Direct reads are now owner-only; username search and
--     friend-request cards read a `profile_directory` view that exposes only
--     public columns.
--
--  3. FRIEND-REQUEST SPAM. No limit on outgoing requests. Capped at 20 per
--     hour and 100 pending per sender.
--
--  4. NO ACCOUNT DELETION. Apple (5.1.1 v) and Google Play both require an
--     in-app way to delete the account and its data. delete_own_account()
--     removes the cloud backup, the profile (cascading friendships and
--     requests) and the auth user, for the caller only.
--
-- Plus input bounds on free-text columns so a client cannot store megabytes
-- in display_name or an invalid colour in banner_color.

-- ── 1. Protect privileged columns ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_is_admin boolean := false;
BEGIN
  -- service_role / migrations (no JWT) may do anything
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;

  SELECT is_admin INTO caller_is_admin FROM public.profiles WHERE user_id = auth.uid();
  caller_is_admin := COALESCE(caller_is_admin, false);

  IF TG_OP = 'INSERT' THEN
    IF NOT caller_is_admin AND (NEW.is_admin OR NEW.suspended) THEN
      RAISE EXCEPTION 'Not authorized to set privileged profile fields';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.user_id <> OLD.user_id THEN
    RAISE EXCEPTION 'user_id is immutable';
  END IF;
  IF NOT caller_is_admin AND (
       NEW.is_admin  IS DISTINCT FROM OLD.is_admin
    OR NEW.suspended IS DISTINCT FROM OLD.suspended
  ) THEN
    RAISE EXCEPTION 'Not authorized to change privileged profile fields';
  END IF;
  -- An admin may never strip their own admin flag by accident through the
  -- generic update path; use the SQL editor for that.
  IF caller_is_admin AND NEW.user_id = auth.uid() AND NEW.is_admin = false AND OLD.is_admin = true THEN
    RAISE EXCEPTION 'Use the SQL editor to remove your own admin flag';
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS profiles_protect_privileged ON public.profiles;
CREATE TRIGGER profiles_protect_privileged
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ── 2. Owner-only direct reads + public directory view ──────────────────────
-- A SELECT policy on profiles must not sub-select profiles (Postgres raises
-- "infinite recursion detected in policy"), so the admin check goes through a
-- definer helper that bypasses RLS.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE user_id = auth.uid()), false);
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Public columns only. The view is owned by postgres so it bypasses the
-- owner-only policy above by design; it is the ONLY way for one user to see
-- another user's profile outside the friends RPC and leaderboard view.
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
  equipped_aspect
FROM public.profiles
WHERE suspended = false;

GRANT SELECT ON public.profile_directory TO authenticated;
REVOKE ALL ON public.profile_directory FROM anon;

-- Username availability for the sign-up form. Sign-up runs BEFORE the user
-- has a session, so it cannot read profiles at all; this definer RPC answers
-- the one question it needs without exposing any row.
CREATE OR REPLACE FUNCTION public.username_taken(u text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE username = lower(trim(u)));
$$;
REVOKE ALL ON FUNCTION public.username_taken(text) FROM public;
GRANT EXECUTE ON FUNCTION public.username_taken(text) TO anon, authenticated;

-- ── 3. Friend-request rate limit ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.limit_friend_requests()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent  int;
  pending int;
BEGIN
  SELECT count(*) INTO recent  FROM public.friend_requests
    WHERE from_user = NEW.from_user AND created_at > now() - interval '1 hour';
  SELECT count(*) INTO pending FROM public.friend_requests
    WHERE from_user = NEW.from_user AND status = 'pending';
  IF recent >= 20 THEN
    RAISE EXCEPTION 'Too many friend requests — try again in an hour';
  END IF;
  IF pending >= 100 THEN
    RAISE EXCEPTION 'Too many pending friend requests';
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS friend_requests_rate_limit ON public.friend_requests;
CREATE TRIGGER friend_requests_rate_limit
  BEFORE INSERT ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.limit_friend_requests();

-- ── 4. Self-service account deletion ─────────────────────────────────────────
-- Deletes ONLY the caller. Storage objects first (the bucket policy would
-- otherwise orphan them), then the auth user, which cascades to profiles,
-- friend_requests, friendships and the audit log target rows.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  DELETE FROM storage.objects
    WHERE bucket_id = 'profile-state' AND (storage.foldername(name))[1] = uid::text;
  DELETE FROM public.profiles WHERE user_id = uid;
  DELETE FROM auth.users WHERE id = uid;
END$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM public;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;

-- ── 5. Input bounds on free-text columns ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_display_name_len') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_display_name_len
      CHECK (display_name IS NULL OR length(display_name) BETWEEN 1 AND 30);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_banner_color_hex') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_banner_color_hex
      CHECK (banner_color IS NULL OR banner_color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_text_len') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_text_len
      CHECK (
        (monarch_theme   IS NULL OR length(monarch_theme)   <= 40) AND
        (rank_label      IS NULL OR length(rank_label)      <= 4)  AND
        (equipped_title  IS NULL OR length(equipped_title)  <= 60) AND
        (equipped_aspect IS NULL OR length(equipped_aspect) <= 40) AND
        (patron_lift     IS NULL OR length(patron_lift)     <= 60)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_prs_size') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_prs_size
      CHECK (pg_column_size(prs) <= 65536);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_counters_nonneg') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_counters_nonneg
      CHECK (overall_level BETWEEN 1 AND 100 AND overall_xp >= 0 AND weekly_xp >= 0 AND total_workouts >= 0);
  END IF;
END$$;
