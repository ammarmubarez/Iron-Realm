-- Migration 005: Profile state cloud sync via Supabase Storage
-- Run in Supabase SQL Editor AFTER 004_admin_audit_log.sql.
-- Safe to re-run.
--
-- Stores each user's full local-store JSON (gzip-compressed) at
-- {user_id}/state.json.gz in a private bucket. RLS ensures owners can
-- only access their own folder.

-- ── 1. Bucket ────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('profile-state', 'profile-state', false, 10485760)  -- 10 MB cap per file
  ON CONFLICT (id) DO UPDATE
    SET public          = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit;

-- ── 2. Policies — one per CRUD verb, all keyed on the leading folder ─────────
-- Path layout is {user_id}/state.json.gz, so foldername()[1] is the owner uid.

DROP POLICY IF EXISTS "profile_state_owner_select" ON storage.objects;
CREATE POLICY "profile_state_owner_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-state'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "profile_state_owner_insert" ON storage.objects;
CREATE POLICY "profile_state_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-state'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "profile_state_owner_update" ON storage.objects;
CREATE POLICY "profile_state_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-state'
    AND auth.uid()::text = (storage.foldername(name))[1]
  ) WITH CHECK (
    bucket_id = 'profile-state'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "profile_state_owner_delete" ON storage.objects;
CREATE POLICY "profile_state_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-state'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
