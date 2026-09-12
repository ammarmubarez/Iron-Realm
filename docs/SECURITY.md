# Security review — Iron Realm v2.3

Scope: the React/Capacitor client (`src/`), the Supabase schema, policies and
migrations (`supabase/`), the deploy shell (`public/index.html`, GitHub Pages) and third-party dependencies. Reviewed 2026-09-09.

## Findings and fixes

| # | Severity | Finding | Fix (v2.3) |
|---|----------|---------|------------|
| 1 | **Critical** | **Privilege escalation.** `profiles_update` let a user write any column of their own row, including `is_admin` and `suspended`. One `update profiles set is_admin = true` from the browser console granted every admin power: read all users' PRs, fetch any user's email (`admin_get_user_email`), send password-reset emails to anyone, suspend accounts, edit any profile. | `protect_profile_privileged_columns` BEFORE trigger refuses changes to `is_admin`/`suspended`/`user_id` unless the caller is already admin (migration 011). |
| 2 | **High** | **Private data readable.** `profiles_select` was `using (true)`: every authenticated user could read every row of `profiles` directly, including PRs of users who set `share_prs = false` and the moderation flags. | Direct reads are owner-only (+ admin). Username search and request cards use the new `profile_directory` view, which exposes only public columns and hides suspended users. Sign-up availability uses a definer RPC `username_taken`. |
| 3 | Medium | **Remote code loading in the native app.** `capacitor.config.ts` pointed the Android shell at GitHub Pages, so the store app was a thin WebView over a remote site: rejected by Apple (4.2 / 2.5.2), fragile offline, and a compromised host would compromise every install. | Store builds bundle the web app (`npm run build:native && npx cap sync`). A dev server URL is opt-in via `CAP_SERVER_URL`. Mixed content and WebView debugging disabled. |
| 4 | Medium | **No Content-Security-Policy.** Any injected script would run with full access to the store and session. | Production CSP injected at build time (`scripts/security/postbuild-csp.js`): `script-src 'self'`, no inline scripts (`INLINE_RUNTIME_CHUNK=false`), `object-src 'none'`, `connect-src` limited to Supabase. GitHub Pages cannot send custom headers, so HSTS, `X-Frame-Options` and `Permissions-Policy` are not set on the web version; the native builds are unaffected (no third-party framing is possible in a WebView). |
| 5 | Medium | **Friend-request spam.** No limit on outgoing requests. | Trigger caps 20 requests/hour and 100 pending per sender. |
| 6 | Medium | **No account deletion.** Required by Apple 5.1.1(v) and Google Play; also a GDPR/CCPA right. | `delete_own_account()` definer RPC scoped to `auth.uid()` removes the backup object, profile (cascading friendships/requests) and auth user. Settings → Privacy → Delete account, two-step confirm. |
| 7 | Low | **Third-party font requests.** Every launch called Google Fonts, leaking IP + user agent to Google (a GDPR issue in the EU after *LG München 3 O 17493/20*) and blocking a strict CSP. Orbitron was still requested though unused. | Rajdhani self-hosted under `public/fonts/` (SIL OFL). No third-party request is made to render the app. |
| 8 | Low | **Broken HTML shell.** `public/index.html` contained a leftover Vite `<script type="module" src="/src/main.jsx">` (a 404 on every load and a CSP violation) and root-absolute `/manifest.json`, `/icons/…` paths that 404 under `/Iron-Realm/`. | Rewritten with `%PUBLIC_URL%` paths, no stray script, `referrer` meta. |
| 9 | Low | **Unvalidated backup import.** Any JSON with a `profiles` key replaced the store; a malformed file could crash every screen. | `validateBackup()` shape-checks the file (object types, ≤ 50 profiles, name length) and caps it at 25 MB. |
| 10 | Low | **Unbounded free-text columns.** `display_name`, `banner_color`, titles and `prs` had no server-side bounds. | CHECK constraints: lengths, `#rrggbb` colour, `prs` ≤ 64 KB, counters non-negative, level 1–100. |
| 11 | Info | **Source maps shipped** to the public site. | `GENERATE_SOURCEMAP=false`. |
| 12 | Info | **Unused `three` dependency** (≈ 600 KB of code in `node_modules`, not in the bundle). | Removed. `@capacitor/cli` moved to devDependencies. |

## Accepted / by design

- **Self-reported leaderboard numbers.** Levels and XP are computed on the
  client and pushed as a snapshot; a motivated user can post fake numbers.
  Server-side recomputation would require uploading every set. The counters
  are now bounded (constraint 10) and admins can reset a profile. Treat the
  leaderboard as social, not competitive.
- **Anon key in the client.** Expected for Supabase; the anon key is only as
  powerful as RLS allows, which is why findings 1–2 mattered.
- **`style-src 'unsafe-inline'`.** The app mounts its stylesheet as `<style>`
  elements. Moving to a static CSS file would allow dropping it; low value
  since `script-src 'self'` already blocks script injection.
- **Local storage is unencrypted.** Workout and Mind & Spirit data sit in
  `localStorage` / the WebView store, readable by anyone with the unlocked
  device. This is normal for a fitness app; device lock is the control.
  Disclosed in the privacy policy.

## Dependency audit

`npm audit --omit=dev` still reports issues, all inside `react-scripts` (the
build tool, which CRA lists as a runtime dependency): `nth-check`, `postcss`,
`serialize-javascript`, `qs`, `underscore`, `uuid`. None of these ship in the
bundle; they run only at build time on the developer's machine. Fixing them
requires replacing CRA (Vite is the usual path) — recommended as the next
infrastructure change, not a blocker for launch. Non-breaking fixes were
applied (`ws`, `websocket-driver`); the runtime dependency set is React,
ReactDOM, `@supabase/supabase-js` and Capacitor.

Re-run: `npm run audit:prod`.

## Supabase dashboard checklist (not in code — do these in the dashboard)

- [ ] Run `supabase/migrations/011_security_hardening.sql` in the SQL editor.
- [ ] Authentication → Providers → Email: **Confirm email** ON.
- [ ] Authentication → Settings: minimum password length 8+, **leaked-password
      protection** ON (Pro plan), disable **anonymous sign-ins**.
- [ ] Authentication → Rate limits: keep defaults or tighten sign-up/OTP.
- [ ] Authentication → URL configuration: Site URL and redirect allow-list
      limited to your domains (GitHub Pages, `capacitor://localhost`,
      `https://localhost`).
- [ ] Authentication → Attack protection: enable CAPTCHA (hCaptcha/Turnstile)
      on sign-up if bot sign-ups appear.
- [ ] Database → confirm RLS is enabled on every table (`profiles`,
      `friend_requests`, `friendships`, `admin_audit_log`) and the
      `profile-state` bucket is **private**.
- [ ] Project Settings → API: rotate the anon key if it was ever committed
      (it was not found in this repo).
- [ ] Never put `service_role` in the client or in `.env.local`.

## Reporting

Security contact: fill in `[security contact email]` in `public/privacy.html`
and consider adding a `SECURITY.md` at the repo root pointing there.
