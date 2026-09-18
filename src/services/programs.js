// Iron Realm — sharing custom programs with friends.
//
// The server guarantees WHO sent a program (RLS: sender must be the caller and
// already a friend of the recipient — migration 012). It does not guarantee the
// payload is sane: every row read here is untrusted input and must go through
// normalizeProgram() before it reaches the store.

import { supabase, isConfigured } from "./supabaseClient";

// Send one program to a friend. `payload` is the compact share envelope from
// data/programShare.js (encodeProgram → parsed object).
export async function shareProgram({ toUserId, name, payload }) {
  if (!isConfigured) throw new Error("Sign in to share programs.");
  const { data: auth } = await supabase.auth.getUser();
  const fromUser = auth?.user?.id;
  if (!fromUser) throw new Error("Sign in to share programs.");
  const { error } = await supabase.from("shared_programs").insert({
    from_user: fromUser, to_user: toUserId, name: String(name).slice(0, 40), payload,
  });
  if (error) throw error;
  return true;
}

// Programs friends have sent this hunter and that they have not dismissed.
export async function fetchProgramInbox() {
  if (!isConfigured) return [];
  const { data, error } = await supabase
    .from("program_inbox")
    .select("id, from_user, from_username, from_display_name, name, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

// Count for the Program tab badge. Never throws — a badge is not worth an error.
export async function countProgramInbox() {
  if (!isConfigured) return 0;
  const { count, error } = await supabase
    .from("program_inbox")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count || 0;
}

// Dismiss (after importing, or to decline). Only the recipient can do this.
export async function dismissSharedProgram(id) {
  if (!isConfigured) return false;
  const { error } = await supabase.from("shared_programs").update({ dismissed: true }).eq("id", id);
  if (error) throw error;
  return true;
}
