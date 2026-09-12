# Iron Realm — Supabase setup

This folder contains the database schema and Row-Level-Security policies
needed to power the friends + leaderboard features (v1.7+).

## One-time setup

### 1. Create the project

1. Go to <https://supabase.com> and sign in.
2. Click **New project**. Pick any name (e.g. `iron-realm`), set a strong DB
   password (save it somewhere), choose the closest region.
3. Wait ~2 minutes for it to provision.

### 2. Wire local credentials

In the Supabase dashboard, open **Project Settings → API** and copy:

- **Project URL** → `REACT_APP_SUPABASE_URL`
- **Project API Keys → anon / public** → `REACT_APP_SUPABASE_ANON_KEY`

⚠️ Never use the `service_role` key in the client app — it bypasses RLS.

Create `.env.local` in the repo root (next to `package.json`):

```
REACT_APP_SUPABASE_URL=https://your-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOi...
```

`.env.local` is gitignored — keep it that way.

### 3. Run the SQL

In the Supabase dashboard, open **SQL Editor** and run the files **in this
order**:

1. `supabase/schema.sql` — creates tables, indexes, triggers, view.
2. `supabase/policies.sql` — enables RLS and installs access policies.

Both files are idempotent: re-running them is safe and applies any updates.

### 4. Auth settings (optional but recommended)

In the dashboard, **Authentication → Providers**:

- **Email**: enabled by default. For dev you can turn **Confirm email** off
  to skip the verification flow; turn it back on for production.

**Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` for dev; `https://ammarmubarez.github.io/Iron-Realm`
  for production. Add `capacitor://localhost` and `https://localhost` to the
  redirect allow-list for the native apps.

### 5. Verify

In **Database → Tables** you should see `profiles`, `friend_requests`,
`friendships`. RLS is on (the lock icon is filled). Done.

### 6. GitHub Pages (production deploys)

`.env.local` only works on your dev machine — it is gitignored, so the
GitHub Actions build (`.github/workflows/deploy.yml`) never sees it. The
workflow reads the two values from repository secrets instead:

1. GitHub → your repo → **Settings → Secrets and variables → Actions**.
2. Add `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` with the
   same values you put in `.env.local`.
3. Push to `main` (or re-run the last workflow) so the new build picks them up.

Tip: you can use a different Supabase project for production vs. local dev
to keep test data separate. Put the prod project's keys in the repository
secrets and the dev project's keys in `.env.local`.

## Schema overview

| Object | Purpose |
|---|---|
| `profiles` | Public mirror of each user's active local profile. Powers leaderboard cards. |
| `friend_requests` | Pending / accepted / rejected friend requests between users. |
| `friendships` | Materialised accepted pairs (two rows per pair for cheap symmetric queries). |
| `friend_leaderboard` (view) | Joins your friendships to friend profile rows; PRs blanked when `share_prs = false`. |

Triggers auto-maintain symmetry: accepting a request inserts both
friendship rows; deleting one row removes the mirror.
