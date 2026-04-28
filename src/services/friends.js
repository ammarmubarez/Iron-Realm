// Iron Realm — friends, requests, and leaderboard queries.

import { supabase, isConfigured } from "./supabaseClient";

// ── Leaderboard ──────────────────────────────────────────────────────────────

export async function fetchLeaderboard(sortBy = "weekly_xp") {
  if (!isConfigured) return [];
  const col = ["weekly_xp", "overall_xp", "overall_level"].includes(sortBy)
    ? sortBy
    : "weekly_xp";
  const { data, error } = await supabase
    .from("friend_leaderboard")
    .select("*")
    .order(col, { ascending: false })
    .limit(200);
  if (error) throw error;
  return data || [];
}

// ── Individual profile (gated RPC) ───────────────────────────────────────────

export async function getFriendProfile(targetUserId) {
  if (!isConfigured) return null;
  const { data, error } = await supabase.rpc("get_friend_profile", {
    target_user_id: targetUserId,
  });
  if (error) throw error;
  return data;
}

// ── Hidden-status check (admin only) ─────────────────────────────────────────
// Returns whether admin is currently hidden from the target user's friends list.

export async function getHiddenStatus(targetUserId, adminUserId) {
  if (!isConfigured) return true;
  const { data } = await supabase
    .from("friendships")
    .select("hidden")
    .eq("user_id", targetUserId)
    .eq("friend_id", adminUserId)
    .maybeSingle();
  return data?.hidden ?? true;
}

export async function setFriendHidden(targetUserId, adminUserId, hidden) {
  if (!isConfigured) throw new Error("Not configured.");
  const { error } = await supabase
    .from("friendships")
    .update({ hidden })
    .eq("user_id", targetUserId)
    .eq("friend_id", adminUserId);
  if (error) throw error;
}

// ── Username search ───────────────────────────────────────────────────────────

export async function searchUsers(query) {
  if (!isConfigured || !query || query.trim().length < 2) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, overall_level, rank_label")
    .ilike("username", `${query.trim().toLowerCase()}%`)
    .limit(10);
  if (error) throw error;
  return data || [];
}

// ── Friend requests ───────────────────────────────────────────────────────────

export async function sendFriendRequest(toUserId) {
  if (!isConfigured) throw new Error("Not configured.");
  const { error } = await supabase
    .from("friend_requests")
    .insert({ to_user: toUserId });
  if (error) throw error;
}

export async function fetchRequests(myUserId) {
  if (!isConfigured || !myUserId) return { incoming: [], outgoing: [], profileMap: {} };

  const { data: reqs, error } = await supabase
    .from("friend_requests")
    .select("id, from_user, to_user, status, created_at")
    .eq("status", "pending");
  if (error) throw error;

  const allReqs = reqs || [];
  const userIds = [...new Set(allReqs.flatMap((r) => [r.from_user, r.to_user]))].filter(
    (id) => id !== myUserId
  );

  let profileMap = {};
  if (userIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, overall_level")
      .in("user_id", userIds);
    (profs || []).forEach((p) => {
      profileMap[p.user_id] = p;
    });
  }

  return {
    incoming: allReqs.filter((r) => r.to_user === myUserId),
    outgoing: allReqs.filter((r) => r.from_user === myUserId),
    profileMap,
  };
}

export async function acceptRequest(requestId) {
  if (!isConfigured) throw new Error("Not configured.");
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "accepted" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function rejectRequest(requestId) {
  if (!isConfigured) throw new Error("Not configured.");
  const { error } = await supabase
    .from("friend_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);
  if (error) throw error;
}

export async function cancelRequest(requestId) {
  if (!isConfigured) throw new Error("Not configured.");
  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId);
  if (error) throw error;
}

// ── Pending count (for NavBar badge) ─────────────────────────────────────────

export async function countIncoming(myUserId) {
  if (!isConfigured || !myUserId) return 0;
  const { count, error } = await supabase
    .from("friend_requests")
    .select("id", { count: "exact", head: true })
    .eq("to_user", myUserId)
    .eq("status", "pending");
  if (error) return 0;
  return count || 0;
}
