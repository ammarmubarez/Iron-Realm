// Iron Realm — Supabase client.
// Reads credentials from .env.local at build time. If either var is missing
// we export `null` and `isConfigured = false` so the rest of the app can
// gracefully fall back to local-only mode.

import { createClient } from "@supabase/supabase-js";

const url     = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = isConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
