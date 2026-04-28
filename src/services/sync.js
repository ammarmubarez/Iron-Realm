// Iron Realm — profile snapshot sync.
// The local store remains source of truth; this module pushes a compact
// snapshot of the active profile into public.profiles so friends can see it.

import { supabase, isConfigured } from "./supabaseClient";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function isUsernameAvailable(username) {
  if (!isConfigured) return true;
  const u = (username || "").trim().toLowerCase();
  if (!u) return false;
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("username", u)
    .maybeSingle();
  if (error) throw error;
  return !data;
}

export async function getProfileRow(userId) {
  if (!isConfigured || !userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Insert or update the user's row. Used the first time a username is set,
// and as the authoritative writer thereafter.
export async function upsertProfileRow({ userId, username, snapshot }) {
  if (!isConfigured) return null;
  const row = { user_id: userId, ...snapshot };
  if (username) row.username = username.toLowerCase();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Push only mutable fields (no username). Skips silently if not configured
// or no userId. Returns the row that was sent on success, null otherwise.
export async function pushSnapshot({ userId, snapshot }) {
  if (!isConfigured || !userId) return null;
  const { error } = await supabase
    .from("profiles")
    .update(snapshot)
    .eq("user_id", userId);
  if (error) throw error;
  return snapshot;
}

// Reduce the local profile + settings to the public mirror shape.
// Pure function — no I/O. Safe to call frequently.
export function buildSnapshotFromLocal(localProfile, settings = {}) {
  const workouts = localProfile.workouts || [];
  const level = localProfile.overallLevel || 1;
  return {
    display_name:   localProfile.name || null,
    monarch_theme:  settings.monarchTheme || null,
    rank_label:     _rankLetter(level),
    overall_level:  level,
    overall_xp:     localProfile.overallXP || 0,
    weekly_xp:      sumWeeklyXP(workouts),
    total_workouts: workouts.length,
    prs:            localProfile.prs || {},
    share_prs:      settings.sharePrs !== false,
  };
}

function _rankLetter(level) {
  if (level >= 30) return "S";
  if (level >= 20) return "A";
  if (level >= 12) return "B";
  if (level >= 7)  return "C";
  if (level >= 4)  return "D";
  return "E";
}

function sumWeeklyXP(workouts) {
  const cutoff = Date.now() - WEEK_MS;
  let total = 0;
  for (const w of workouts) {
    if (w && w.date && w.date >= cutoff) total += w.xp || 0;
  }
  return total;
}
