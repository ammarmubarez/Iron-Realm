// Iron Realm — syncing the XP audit trail and reading it back as founder.
//
// The device is the source of truth for a hunter's training data; this table is
// a read-only mirror of the audit events so glitches and suspicious jumps can be
// reviewed. Rows are append-only by RLS (no UPDATE or DELETE policy), so a
// client cannot rewrite its own history after the fact.

import { supabase, isConfigured } from "./supabaseClient";

// Push events that are not already mirrored. Upsert on (user_id, event_id) so a
// retry after a dropped connection is harmless.
export async function pushAuditEvents(userId, rows) {
  if (!isConfigured || !userId || !rows?.length) return 0;
  const payload = rows.slice(-200).map(r => ({ ...r, user_id: userId }));
  const { error } = await supabase
    .from("xp_audit")
    .upsert(payload, { onConflict: "user_id,event_id", ignoreDuplicates: true });
  if (error) throw error;
  return payload.length;
}

// One hunter's audit trail, newest first. Owner or admin (RLS decides).
export async function fetchAuditFor(userId, limit = 100) {
  if (!isConfigured || !userId) return [];
  const { data, error } = await supabase
    .from("xp_audit")
    .select("event_id, ts, type, exercise, delta, overall_after, anomaly")
    .eq("user_id", userId)
    .order("ts", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

// Founder sweep: everything currently flagged, across all hunters. Admin-only —
// a non-admin gets an empty list from RLS rather than an error.
export async function fetchFlagged(limit = 100) {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from("xp_audit_flagged")
    .select("user_id, username, event_id, ts, type, exercise, delta, overall_after, anomaly")
    .order("ts", { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}
