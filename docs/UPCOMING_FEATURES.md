# Iron Realm — Upcoming Features

Draft roadmap for upcoming Iron Realm releases. Current released version: **1.7.0**.

Group features under the version you intend to ship them in. Move items between
sections as priorities shift. Strike through (`~~text~~`) or delete items once
they ship.

---

## v1.7 — _Released_

**Theme:** Social + progression visibility

### Features (shipped)
- ~~Supabase backend (auth, profile sync, friends, leaderboard)~~
- ~~Admin moderation: suspended flag, password-reset email, wipe stats, toggle admin/share_prs, reveal/hide~~
- ~~Friends-only profile visibility (RLS-enforced)~~
- ~~PR History modal with progression sparklines~~
- ~~Workout Heatmap (13-week grid, daily XP intensity, streaks, day-detail drill-down)~~
- ~~User-controlled `share_prs` privacy toggle in Settings~~
- ~~Editable display name in Settings~~
- ~~Welcome screen (Create / Sign in / Continue as guest) + cloud state sync for cross-device restore~~
- ~~Last-active indicator on leaderboard cards and profile viewer~~
- ~~Friend count in profile viewer~~
- ~~Admin audit log (moderation actions table + admin-only viewer)~~
- ~~Imbalance detector (Focus Recommendations on Hunter screen)~~
- ~~Bookmark exercises in the database~~
- ~~Profile banner color customization~~
- ~~12-week volume / tonnage chart on Hunter screen~~
- ~~Superset grouping in workout logger~~
- ~~Daily rituals + cosmetic title rewards (Daily Hunter / Iron Apostle / Sovereign)~~
- ~~Aspect awakening at level 30 (permanent path: Beast / Shadow / Architect / Sovereign)~~

### Improvements
- ~~`homepage` field set for GitHub Pages deploy (`/iron-realm` base path)~~

### Bug fixes
- ~~Snapshot push no longer overwrites user-edited `display_name` and `share_prs`~~

### Migrations to run in Supabase (in order)
- 001_admin.sql · 002_profile_visibility.sql · 003_admin_moderation.sql
- 004_admin_audit_log.sql · 005_profile_state_storage.sql · 006_friend_count.sql
- 007_banner_color.sql · 008_equipped_title.sql · 009_equipped_aspect.sql

---

## v1.8

**Theme:**
**Target date:**

### Features
-

### Improvements
-

### Bug fixes
-

---

## v1.9

**Theme:**
**Target date:**

### Features
-

### Improvements
-

### Bug fixes
-

---

## v2.0 — _Major release_

**Theme:**
**Target date:**

### Features
- Boss raids — multi-week group challenges with friends, shared XP contribution

### Improvements
-

### Breaking changes
-

---

## Backlog / Unscheduled

Ideas that haven't been assigned to a release yet.

- Admin audit log — record moderation actions to a DB table for accountability
- Hard-delete account via Supabase Edge Function (requires service_role key server-side)

---

## Notes

-
