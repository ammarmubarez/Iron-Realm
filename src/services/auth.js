// Iron Realm — auth helpers around Supabase.
// All functions throw on failure with a user-readable .message.

import { supabase, isConfigured } from "./supabaseClient";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export function validateUsername(raw) {
  const u = (raw || "").trim().toLowerCase();
  if (!USERNAME_RE.test(u)) {
    throw new Error("Username must be 3–20 lowercase letters, numbers, or underscores.");
  }
  return u;
}

export async function signUp({ email, password }) {
  if (!isConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signUp({
    email: (email || "").trim(),
    password: password || "",
  });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signIn({ email, password }) {
  if (!isConfigured) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email || "").trim(),
    password: password || "",
  });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

export async function signOut() {
  if (!isConfigured) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!isConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  if (!isConfigured) return () => {};
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => sub.subscription.unsubscribe();
}
