// Iron Realm — admin moderation tools.
// All operations rely on RLS: the profiles_admin_update policy allows admin
// to UPDATE any profile row, and admin_get_user_email RPC exposes auth emails
// only to admin callers. None of these require the service_role key.

import { supabase, isConfigured } from "./supabaseClient";

// ── Profile field updates ────────────────────────────────────────────────────

export async function updateProfileField(targetUserId, fields) {
  if (!isConfigured) throw new Error("Not configured.");
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("user_id", targetUserId);
  if (error) throw error;
}

export const setSuspended = (uid, val) => updateProfileField(uid, { suspended: val });
export const setSharePrs  = (uid, val) => updateProfileField(uid, { share_prs: val });
export const setIsAdmin   = (uid, val) => updateProfileField(uid, { is_admin: val });

export async function resetUserStats(targetUserId) {
  return updateProfileField(targetUserId, {
    overall_xp: 0,
    weekly_xp: 0,
    overall_level: 1,
    total_workouts: 0,
    rank_label: "E",
    prs: {},
  });
}

// ── Password reset (admin-triggered) ─────────────────────────────────────────
// Looks up the target's email server-side (admin-only RPC) then triggers
// Supabase's standard password recovery email. Admin never sees the password.

export async function sendPasswordResetForUser(targetUserId, redirectTo = null) {
  if (!isConfigured) throw new Error("Not configured.");
  const { data: email, error: rpcErr } = await supabase
    .rpc("admin_get_user_email", { target_user_id: targetUserId });
  if (rpcErr) throw rpcErr;
  if (!email) throw new Error("Could not retrieve email (admin only).");
  const opts = redirectTo ? { redirectTo } : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(email, opts);
  if (error) throw error;
  return email;
}
