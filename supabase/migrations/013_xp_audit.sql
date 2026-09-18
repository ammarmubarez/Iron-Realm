-- Migration 013: XP audit trail (v2.12)
-- Run in the Supabase SQL Editor AFTER 012_program_sharing.sql. Safe to re-run.
--
-- Mirrors each hunter's local XP audit events so the founder can review them for
-- glitches or cheating. What is NOT here matters as much as what is:
--   · no set-by-set detail, no weights, no body metrics, no nutrition
--   · only: when, what kind of change, which exercise, how much XP moved, and
--     the running total afterwards
-- Reverting is done on the device that owns the data — an admin reading this
-- table can see that something went wrong and tell the hunter, but cannot
-- silently rewrite another account's training history from here.
--
-- PRIVACY: this grants admins visibility they did not have before. The privacy
-- policy is updated in the same release; do not run this migration without
-- shipping that copy, or the policy becomes untrue.

CREATE TABLE IF NOT EXISTS public.xp_audit (
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id      text NOT NULL CHECK (length(event_id) BETWEEN 1 AND 64),
  ts            timestamptz NOT NULL,
  type          text NOT NULL CHECK (type IN ('log','edit','delete','revert','import','repair')),
  exercise      text CHECK (exercise IS NULL OR length(exercise) <= 60),
  delta         int  NOT NULL CHECK (delta BETWEEN -1000000 AND 1000000),
  overall_after int  NOT NULL CHECK (overall_after BETWEEN -1000000 AND 100000000),
  anomaly       text CHECK (anomaly IS NULL OR length(anomaly) <= 60),
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS xp_audit_user_ts ON public.xp_audit (user_id, ts DESC);
CREATE INDEX IF NOT EXISTS xp_audit_flagged ON public.xp_audit (ts DESC) WHERE anomaly IS NOT NULL;

ALTER TABLE public.xp_audit ENABLE ROW LEVEL SECURITY;

-- Owner reads their own; admins read everyone's. public.is_admin() is the
-- definer helper from migration 011 (a policy on a table must not sub-select
-- that same table).
DROP POLICY IF EXISTS xp_audit_select ON public.xp_audit;
CREATE POLICY xp_audit_select ON public.xp_audit
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- Only the owner writes their own rows, and only ever as append-only history:
-- no UPDATE policy and no DELETE policy, so an event cannot be edited or
-- erased from the client once written. Rows go when the account goes (cascade).
DROP POLICY IF EXISTS xp_audit_insert ON public.xp_audit;
CREATE POLICY xp_audit_insert ON public.xp_audit
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Founder review: the most recent flagged events across all hunters, with the
-- username attached. Admin-only by the underlying table policy.
CREATE OR REPLACE VIEW public.xp_audit_flagged AS
SELECT a.user_id, p.username, a.event_id, a.ts, a.type, a.exercise,
       a.delta, a.overall_after, a.anomaly
FROM public.xp_audit a
JOIN public.profiles p ON p.user_id = a.user_id
WHERE a.anomaly IS NOT NULL;

GRANT SELECT ON public.xp_audit_flagged TO authenticated;
REVOKE ALL ON public.xp_audit_flagged FROM anon;
