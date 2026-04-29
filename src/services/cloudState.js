// Iron Realm — full-state cloud sync.
//
// Stores the user's complete local store as gzip-compressed JSON in
// Supabase Storage at profile-state/{user_id}/state.json.gz. Used to
// recover full progress (workouts, sub-stats, settings, nutrition log,
// weight log) when signing in on a new device.
//
// The compact "profiles" row is a separate concern — that's the public
// mirror used by the leaderboard. This file holds the private full state.

import { supabase, isConfigured } from "./supabaseClient";

const BUCKET    = "profile-state";
const FILE_NAME = "state.json.gz";

const pathFor = (userId) => `${userId}/${FILE_NAME}`;

// ── Compression helpers (CompressionStream is supported in all current
//    Chrome/Safari/Firefox versions, including Capacitor's Android WebView). ──

async function gzipString(s) {
  const stream = new Blob([s]).stream().pipeThrough(new CompressionStream("gzip"));
  return await new Response(stream).blob();
}

async function gunzipBlob(blob) {
  const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  return await new Response(stream).text();
}

// ── Push / pull ──────────────────────────────────────────────────────────────

export async function pushFullState(userId, store) {
  if (!isConfigured || !userId || !store) return false;
  const json = JSON.stringify(store);
  const gz   = await gzipString(json);
  const { error } = await supabase.storage.from(BUCKET).upload(pathFor(userId), gz, {
    upsert: true,
    contentType: "application/gzip",
  });
  if (error) throw error;
  return true;
}

// Returns the parsed store object, or null if no state exists yet
// (first sign-in for an account, or restore from a different device that
// never synced). Callers should treat null as "nothing to restore — keep
// whatever is already on this device".
export async function pullFullState(userId) {
  if (!isConfigured || !userId) return null;
  const { data, error } = await supabase.storage.from(BUCKET).download(pathFor(userId));
  if (error || !data) return null;
  try {
    const text = await gunzipBlob(data);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function deleteFullState(userId) {
  if (!isConfigured || !userId) return false;
  const { error } = await supabase.storage.from(BUCKET).remove([pathFor(userId)]);
  if (error) throw error;
  return true;
}
