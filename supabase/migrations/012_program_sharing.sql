-- Migration 012: Friend-to-friend program sharing (v2.9)
-- Run in the Supabase SQL Editor AFTER 011_security_hardening.sql. Safe to re-run.
--
-- A hunter can send one of their custom programs to a FRIEND. The recipient
-- sees it in an inbox and chooses whether to import it; nothing is ever written
-- into their account automatically.
--
-- Threat model (same posture as migration 011):
--   · Only the sender may insert, and only to someone they are already friends
--     with — this is not a channel for messaging strangers.
--   · Only the two parties may read the row.
--   · Only the recipient may dismiss; either party may delete.
--   · The payload is bounded (32 KB) and rate limited (30/hour, 200 pending),
--     so the table cannot be used to fill another account's inbox or storage.
--   · The payload is opaque JSON to the database. The CLIENT re-validates it
--     through normalizeProgram() before it can touch the store — the server
--     guarantees who sent it, not that its contents are sane.

CREATE TABLE IF NOT EXISTS public.shared_programs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 40),
  payload     jsonb NOT NULL,
  dismissed   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (from_user <> to_user),
  CHECK (pg_column_size(payload) <= 32768)
);

CREATE INDEX IF NOT EXISTS shared_programs_inbox
  ON public.shared_programs (to_user, created_at DESC) WHERE dismissed = false;

ALTER TABLE public.shared_programs ENABLE ROW LEVEL SECURITY;

-- ── Read: the two parties only ───────────────────────────────────────────────
DROP POLICY IF EXISTS shared_programs_select ON public.shared_programs;
CREATE POLICY shared_programs_select ON public.shared_programs
  FOR SELECT TO authenticated
  USING (auth.uid() = to_user OR auth.uid() = from_user);

-- ── Insert: sender must be the caller AND already a friend of the recipient ──
DROP POLICY IF EXISTS shared_programs_insert ON public.shared_programs;
CREATE POLICY shared_programs_insert ON public.shared_programs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = from_user
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.user_id = auth.uid() AND f.friend_id = to_user
    )
  );

-- ── Update: recipient may dismiss; nothing else is writable ──────────────────
DROP POLICY IF EXISTS shared_programs_update ON public.shared_programs;
CREATE POLICY shared_programs_update ON public.shared_programs
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user)
  WITH CHECK (auth.uid() = to_user);

CREATE OR REPLACE FUNCTION public.shared_programs_immutable()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF NEW.from_user <> OLD.from_user OR NEW.to_user <> OLD.to_user
     OR NEW.payload IS DISTINCT FROM OLD.payload OR NEW.name <> OLD.name THEN
    RAISE EXCEPTION 'Only the dismissed flag may be changed';
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS shared_programs_no_edit ON public.shared_programs;
CREATE TRIGGER shared_programs_no_edit
  BEFORE UPDATE ON public.shared_programs
  FOR EACH ROW EXECUTE FUNCTION public.shared_programs_immutable();

-- ── Delete: either party ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS shared_programs_delete ON public.shared_programs;
CREATE POLICY shared_programs_delete ON public.shared_programs
  FOR DELETE TO authenticated
  USING (auth.uid() = to_user OR auth.uid() = from_user);

-- ── Rate limit ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.limit_program_shares()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  recent int;
  pending int;
BEGIN
  SELECT count(*) INTO recent FROM public.shared_programs
    WHERE from_user = NEW.from_user AND created_at > now() - interval '1 hour';
  IF recent >= 30 THEN
    RAISE EXCEPTION 'Too many programs shared — try again in an hour';
  END IF;
  SELECT count(*) INTO pending FROM public.shared_programs
    WHERE to_user = NEW.to_user AND dismissed = false;
  IF pending >= 200 THEN
    RAISE EXCEPTION 'That hunter''s program inbox is full';
  END IF;
  RETURN NEW;
END$$;

DROP TRIGGER IF EXISTS shared_programs_rate_limit ON public.shared_programs;
CREATE TRIGGER shared_programs_rate_limit
  BEFORE INSERT ON public.shared_programs
  FOR EACH ROW EXECUTE FUNCTION public.limit_program_shares();

-- ── Inbox view: joins the sender's public name without exposing their row ────
CREATE OR REPLACE VIEW public.program_inbox AS
SELECT
  sp.id, sp.from_user, sp.to_user, sp.name, sp.payload, sp.created_at,
  p.username    AS from_username,
  p.display_name AS from_display_name
FROM public.shared_programs sp
JOIN public.profiles p ON p.user_id = sp.from_user
WHERE sp.dismissed = false
  AND sp.to_user = auth.uid();

GRANT SELECT ON public.program_inbox TO authenticated;
REVOKE ALL ON public.program_inbox FROM anon;
