-- Migration 004: Admin audit log
-- Run in Supabase SQL Editor AFTER 003_admin_moderation.sql.
-- Safe to re-run.
--
-- Records every moderation action taken by an admin against another user.
-- Admin-only SELECT (RLS). INSERT goes through log_admin_action() which
-- runs SECURITY DEFINER and re-checks the caller's admin flag, so the
-- table itself never needs an INSERT policy.

-- ── 1. Table ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action          text NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_target_idx
  ON public.admin_audit_log (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_admin_idx
  ON public.admin_audit_log (admin_user_id, created_at DESC);

-- ── 2. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_select" ON public.admin_audit_log;
CREATE POLICY "audit_log_admin_select" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- ── 3. log_admin_action — gated insert ───────────────────────────────────────
-- Returns the new row id on success, NULL if caller is not signed in.
-- Raises an exception if caller is not an admin (catch on the client and
-- surface as a generic error — the underlying action already succeeded).

CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_target_user_id uuid,
  p_action         text,
  p_metadata       jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_is_admin boolean := false;
  new_id          uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;

  SELECT is_admin INTO caller_is_admin
    FROM public.profiles
   WHERE user_id = auth.uid();

  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Not authorized.';
  END IF;

  INSERT INTO public.admin_audit_log (admin_user_id, target_user_id, action, metadata)
    VALUES (auth.uid(), p_target_user_id, p_action, COALESCE(p_metadata, '{}'::jsonb))
    RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_action(uuid, text, jsonb) TO authenticated;

-- ── 4. fetch_audit_log — admin-only convenience reader ───────────────────────
-- Returns the most recent N entries for a target user, joined with the admin's
-- username so the UI doesn't need a second round-trip.

CREATE OR REPLACE FUNCTION public.fetch_audit_log(
  p_target_user_id uuid DEFAULT NULL,
  p_limit          int  DEFAULT 50
)
RETURNS TABLE (
  id             uuid,
  admin_user_id  uuid,
  admin_username text,
  target_user_id uuid,
  action         text,
  metadata       jsonb,
  created_at     timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_is_admin boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;

  SELECT is_admin INTO caller_is_admin
    FROM public.profiles
   WHERE user_id = auth.uid();

  IF NOT caller_is_admin THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.admin_user_id,
    p.username AS admin_username,
    a.target_user_id,
    a.action,
    a.metadata,
    a.created_at
  FROM public.admin_audit_log a
  LEFT JOIN public.profiles p ON p.user_id = a.admin_user_id
  WHERE p_target_user_id IS NULL OR a.target_user_id = p_target_user_id
  ORDER BY a.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_audit_log(uuid, int) TO authenticated;
