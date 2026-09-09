# App Store & Google Play readiness — Iron Realm

What the code now provides, and the list of things only the account owner
can do. Work top to bottom; the "you" items need an Apple Developer account
($99/yr), a Google Play developer account ($25 once), and a Mac with Xcode
for the iOS build.

## Done in the code (v2.3)

| Requirement | Where |
|---|---|
| In-app **account deletion** (Apple 5.1.1(v), Google Play account-deletion policy) | Settings → Privacy → Delete account; `delete_own_account()` RPC |
| **Privacy policy URL** (both stores) | `public/privacy.html` → `https://ammarmubarez.github.io/Iron-Realm/privacy.html` once deployed |
| **Terms / EULA** with health disclaimer and assumption of risk | `public/terms.html`, linked from Settings and the sign-up form |
| Sign-up **consent** to Terms and Privacy | Create-account form footer |
| **Data export** (GDPR/CCPA portability) | Settings → Data backup → Export |
| App is **self-contained**, not a remote web view (Apple 4.2 / 2.5.2) | `capacitor.config.ts` bundles `build/`; `npm run build:native` |
| **No third-party trackers/SDKs** → simplest App Privacy answers | No analytics, no ads, fonts bundled |
| **No inline/remote script**, CSP, HSTS, no-referrer | `scripts/security/postbuild-csp.js`, `netlify.toml` |
| Server-side authorisation (RLS + column protection) | `supabase/migrations/011_security_hardening.sql` — **run it** |
| Password minimum 8 chars, username rules | `AuthPanel`, `validateUsername`, DB CHECK |
| Version string in Settings | Legal section |

## You must do — both stores

1. **Fill the legal pages.** Every `[…]` placeholder in `public/privacy.html`
   and `public/terms.html`: operator name/address, contact email, security
   contact, Supabase region, effective date, governing law. Have a lawyer
   read them if you are selling anything or operating outside the US.
2. **Run migration 011** in the Supabase SQL editor and complete the dashboard
   checklist in `docs/SECURITY.md` (email confirmation, leaked-password
   protection, redirect URLs, private bucket).
3. **Build the native bundle**: `npm run build:native && npx cap sync`.
   Do not ship a build made with plain `npm run build` (its asset paths are
   for GitHub Pages) and do not set `CAP_SERVER_URL` for a store build.
4. **Support URL and marketing URL** — the GitHub Pages site or a repo README
   is acceptable for support; add a contact email there.
5. **Screenshots** for each required device size (6.7", 6.5", 5.5" iPhone;
   12.9" iPad if you allow iPad; phone + 7"/10" tablet for Play).
6. **Age rating**: fitness apps with no user-generated media rate 4+ (Apple)
   / Everyone (Google). Terms say 13+; set the store minimum accordingly.
7. **Test accounts** for reviewers: create one with a few workouts and a
   friend, and put the credentials in App Review notes.

## Apple App Store specifics

- **Xcode + macOS** required. Then: `npx cap add ios`, open `ios/App` in
  Xcode, set the bundle id `com.ironrealm.app`, team, and version/build.
- **App Privacy "nutrition label"** (App Store Connect → App Privacy). With
  the current code, declare:
  - *Health & Fitness* (workouts, body weight/height) — collected, linked to
    the user **only when signed in**, used for App Functionality, not for
    tracking.
  - *Contact Info → Email* — linked, App Functionality.
  - *User Content* (logs, Mind & Spirit notes) — linked when signed in.
  - *Identifiers → User ID* — linked, App Functionality.
  - *Usage Data / Diagnostics* — **not collected**.
  - "Data used to track you" — **none**. Do not add an analytics SDK without
    updating this.
- **Export compliance**: the app only uses standard TLS (HTTPS). Add
  `ITSAppUsesNonExemptEncryption = NO` to `Info.plist` so you are not asked
  every upload.
- **Sign in with Apple (4.8)** is required only if you add a third-party
  social login (Google/Facebook). Email + password alone does not trigger it.
  Keep it that way, or add Sign in with Apple when you add Google.
- **HealthKit later**: adding Apple Health sync requires the HealthKit
  entitlement, `NSHealthShareUsageDescription` /
  `NSHealthUpdateUsageDescription` strings, and an updated privacy policy
  before submission. Health data may never be used for advertising (5.1.3).
- **Minimum functionality (4.2)**: the reviewer must see more than a web
  page. Native status bar/splash are configured; consider adding local
  notifications (workout reminders) via `@capacitor/local-notifications`
  before the first submission — it is the cheapest "native" signal.
- **iPad**: either support it properly or restrict to iPhone in Xcode.
- **Review notes**: state that the app works fully offline as a guest and
  that account creation is optional.

## Google Play specifics

- **Target SDK**: Play requires targeting the current Android API level
  (35 for 2026 submissions). Check `android/variables.gradle`
  `targetSdkVersion` and update Capacitor if needed.
- **App signing**: enrol in Play App Signing; keep the upload keystore out
  of git (`android/*.keystore` is not ignored yet — add it).
- **Data safety form** — mirror the Apple label above: data collected only
  when signed in (email, fitness info, user IDs, app content), encrypted in
  transit, deletion available in-app, **no data shared** with third parties,
  not used for ads.
- **Account deletion web link**: Play requires a URL as well as the in-app
  path. Point it at the privacy policy's deletion section
  (`privacy.html#6-retention-and-deletion` — add the anchor id if you want a
  deep link) and describe the in-app steps.
- **Privacy policy URL** in the store listing and inside the app (done).
- **Content rating questionnaire**: no violence, no user-to-user chat (friend
  requests only), no location.
- **Remove `android/app/build/` from git** if it is tracked; it should be
  ignored.

## After launch

- Keep `docs/SECURITY.md`'s dashboard checklist true after any Supabase
  change.
- Any new data collection (Health sync, analytics, crash reporting) requires:
  privacy policy update → store privacy labels update → new build.
- Bump `APP_VERSION` for every store build; `version.json` follows it.
