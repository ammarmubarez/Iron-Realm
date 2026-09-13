# `src/` layout

```
src/
├── index.js            React entry — mounts <IronRealm />
├── iron-realm.jsx      App: screens, modals, game logic, XP engine, theming
├── data/               Pure data. No imports, no runtime code — safe to edit freely.
│   ├── exercises.js    EXERCISE_DB, EMG profiles + aliases (emgFor), bodyweight load fractions, equipment
│   ├── programs.js     Built-in training programs (MALE_PROGRAMS / FEMALE_PROGRAMS)
│   ├── progression.js  XP curves, milestones, MET tables, muscle-stimulus factors, atrophy constants
│   ├── muscles.js      MUSCLE_META, SVG-region ↔ muscle mapping, angle groups
│   ├── bodyPaths.js    SVG path data for the body-matrix figure (large, cold data)
│   ├── profile.js      Goals, activity levels, equipment categories, rituals
│   ├── cosmetics.js    Monarch themes, name auras, aspects, titles, relics
│   ├── mind.js         Mind & Spirit activity ladders
│   └── tips.js         Daily training tips
├── ui/                 The UI kit (v2.0 calm theme, modelled on Oura + Opal via Mobbin)
│   ├── tokens.js       Palette + type tokens — the ONLY place colours are defined
│   ├── Button.jsx      primary / glass / outline pill button (Oura)
│   ├── ListGroup.jsx   Grouped settings list: quiet header + rows with chevrons (Opal)
│   ├── StatTile.jsx    Hero stat tile: big number, label, thin progress bar (Opal)
│   └── Segmented.jsx   Pill tab switch for views inside a card or sheet (Opal)
├── fx/                 three.js visuals — NOT rendered in the calm theme, kept for reference
│   ├── SystemParticles.jsx   Ambient particle field (retired v2.0)
│   ├── SoulCore.jsx          Animated rank emblem (retired v2.0)
│   └── CompanionOrb.jsx      Companion orb (retired v2.0)
└── services/           Supabase: auth, sync, friends, admin, cloud state
```

## v2.8 randomizer — a weight for every lift

Plan rows now read "Suggested: 3 sets · 6–10 reps at 180 lb" with a note on where the
number came from. `loadFor()` takes the 1RM from, in order: a stored PR on the lift, a PR
on a lift in the same family (`data/strength.js` `LIFT_FAMILIES`: a bench PR sets incline
and machine-press loads), or the strength standard for the hunter's body weight, sex, age
and the muscle's current level (`STRENGTH_ANCHORS`, allometric body-weight scaling, female
factors, −1 %/yr past 40). The level already includes detraining, so an atrophied muscle
is prescribed a lighter load. Bodyweight lifts say "bodyweight"; unknown lifts say to pick
a weight that leaves 1–2 reps.

## v2.7 randomizer — fuel-aware dose and 1RM loads

The dose now starts from the muscle's own level (8 sets below level 4, 10 up to level 11,
12 from level 12; ceiling 12) and is scaled by `fuelDoseModifier(fuelContext(profile))`:
the 3-day food-log average against Mifflin-St Jeor maintenance (deficit ≥ 12 % → ×0.85,
≥ 25 % → ×0.75, surplus ≥ 5 % → ×1.15) and protein against the g/kg target (< 75 % →
×0.85). With no food logged, the goal's planned offset stands in. Strength lifts with a
stored e1RM get a working load for the middle of the rep range at 2 RIR (inverted Epley,
rounded to 5 lb) and lifts with a known max are preferred so overload can be tracked.
The number of lifts follows the dose: 2 for ≤ 6 sets, 4 for ≥ 12. The banner ends with
the fuel reason, e.g. "fuel: deficit −1151 kcal · protein 100/160 g → volume ×0.64".

## v2.6 session randomizer — region slots and a real dose

`generateWorkout()` no longer uses hand-written name lists. Each muscle group has
`SESSION_SLOTS` (regions whose prime mover the session must cover: chest = sternal,
clavicular, +1; biceps = short head, long head, brachialis; core = rectus, hip flexors,
obliques …) and candidates are found from `data/emg.js` (region activation ≥ 85). Every
pick carries an `rx` prescription: sets, rep range by lift type (compound 6–10, isolation
10–15, bodyweight 8–15, holds 30–45 s), 1–2 RIR and rest. Sets are tuned so the group's
credited total lands at the per-session plateau (8 novice / 10 otherwise), minus what the
group already has this week (20/wk plateau) and minus indirect credit from groups
generated earlier in the same session (`buildRandomPlan` runs them in order). The plan
banner shows "CHEST ≈ 9 hard sets · TRICEP ≈ 9 (4 indirect)".

## v2.5 body diagram — five new regions

`data/bodyPaths.js` now has 38 regions: serratus anterior, brachialis, brachioradialis and
hip flexors (iliopsoas) on the front views, infraspinatus (rotator cuff) and
brachioradialis on the back views, for both genders. They are hand-drawn in the figure's
own coordinate space and mirrored about x = 338.245; `data/emg.js` credits them
(184 profiles re-scored), `data/muscles.js` / `exercises.js` map them to stats, and
`data/progression.js` gives them detraining factors. The female views' two misspelled
keys (`upper-trapzeius`, `later-head-triceps`) were corrected at the same time.

**Restoring the classic 33-region figure**: the pre-v2.5 data is on the branch
`checkpoint/v2.4.0-diagram`. To roll the diagram back while keeping everything else:

```
git checkout checkpoint/v2.4.0-diagram -- src/data/bodyPaths.js src/data/muscles.js src/data/exercises.js src/data/emg.js src/data/progression.js
node scripts/physiology/validate-emg.mjs --write
```

## v2.3 security & store readiness

- `scripts/security/postbuild-csp.js` injects the production CSP into `build/index.html`
  (`npm run build` and `npm run build:native` both run it). No inline scripts
  (`INLINE_RUNTIME_CHUNK=false` in `.env`), fonts self-hosted in `public/fonts/`.
- Store builds bundle the web app: `npm run build:native && npx cap sync`. Never point a
  store build at a remote URL. The GitHub Pages auto-update only runs on that origin.
- Cloud authorisation is server-side: see `supabase/migrations/011_security_hardening.sql`
  (privileged-column trigger, owner-only profile reads, `profile_directory` view,
  friend-request rate limit, `delete_own_account()`).
- Legal pages: `public/privacy.html`, `public/terms.html` (fill the `[…]` placeholders).
- Full findings: `docs/SECURITY.md`. Store checklist: `docs/APP_STORE_READINESS.md`.

## v2.2 physiology pass — how XP, levels and decay work

Two currencies, computed per set in `iron-realm.jsx` from constants in `data/progression.js`:

- **Hunter XP = kilocalories** (`calcSetXP`). MET × body mass × time under load, plus the
  mechanical work of the load (`WORK_KCAL_PER_KG_REP`). Feeds the overall level and is
  netted against a calorie surplus. Scales with body mass — a 220 lb hunter burns more.
- **Muscle XP = hypertrophy stimulus** (`calcSetStim`). One hard set = 10, scaled by
  `effortFactor(RIR)` (RPE if logged, else inverted Epley against the stored PR, else 2
  RIR), `loadFactor(%1RM)`, `repFactor(reps)` and `volumeFactor(weekly sets)`. Holds
  count 45 s per set. Cardio: minutes × MET ÷ 7. Body mass does **not** scale it;
  bodyweight moves load `BW_FRACTION` of the body (push-up 64 %, leg raise 35 %).
  Protein below target scales it down; a calorie surplus does not.
- **Routing** (v2.4): every built-in exercise has a literature-based activation profile
  in `data/emg.js` (prime mover = 100, others relative; sources and anatomy notes at the
  top of the file). `statCredits()` turns it into SET CREDIT per muscle group: the
  best-activated head, mapped through a^1.5, so a compound set is a full set for its
  prime mover and a fractional set for helpers (hip thrust: glutes ×1.0, legs ×0.3).
  Custom exercises without a profile get one derived from their `svgTargets`. `svgTargets`
  (what the body figure highlights) are generated from the profile at ≥ 30 by
  `node scripts/physiology/validate-emg.mjs --write`, which also fails the build-side
  check if any exercise lacks a profile. Calisthenics give a 25 % side credit to Agility.
- **Per-muscle detraining** (v2.4): `ATROPHY_MUSCLE_FACTOR` scales the half-life by
  fibre type (Johnson 1973) and daily loading — soleus 1.8×, quads 1.3×, erectors 1.4×,
  chest/triceps 0.9×.
- **Levels**: `MUSCLE_THRESHOLDS` is generated by `muscleLevelIncrement(n)`, anchored to
  the natural-hypertrophy timeline at 12 hard sets/week (LVL 4 ≈ 7 weeks, LVL 12 ≈ 2
  years, LVL 30 ≈ 8 years). Overall thresholds are unchanged (kcal).
- **Decay**: `ATROPHY` — muscle 21-day grace then 150-day half-life to a 45 % floor
  (≈ −14 % at 12 weeks, −29 % at 6 months); endurance 7-day grace, 100-day half-life,
  40 % floor. Half-life shortens with age past 40 (`ageDetrainingFactor`).
- **One rebuild path**: `rebuildProfileStats(profile)` recomputes everything from the
  workout ledger, chronologically. It runs on load, log, edit and delete, so stats can
  never drift from the log, and a model change re-scores all history.

## v2.0 calm theme — what changed and where

The v1 "System" look (neon glows, letter-spaced Orbitron caps, clip-path corners,
holographic scan frames, an animated three.js particle field) was overstimulating.
v2.0 rebuilt it around two Mobbin references: **Oura** for buttons, **Opal** for the
profile/settings structure and the near-monochrome palette.

- **Colour** lives only in `ui/tokens.js`. `iron-realm.jsx` imports the names it always
  used (`BG`, `BG2`, `GOLD`, `MUTED`…), so a palette change is a one-file edit.
  `ACCENT`/`ACCENT2` remain `let`s inside `iron-realm.jsx` because the brightness and
  monarch-theme settings re-tint them at runtime.
- **Type**: one face, `FONT_DISPLAY` (Rajdhani), and one tracking token, `TRACK`.
  Orbitron is no longer loaded.
- **Effects**: no `text-shadow`, no glow `box-shadow`, no `clip-path`, no infinite
  pulse/shimmer/glitch keyframes, no aurora, particles, rune fields or tilt cards.
  Event moments (level-up ceremony, relic drop) are kept.
- **Hunter screen** follows Opal's profile: avatar + rank pill → two `StatTile`s (Level,
  Condition) → body matrix → Mind & Spirit card → Identity `ListGroup` (signature lift,
  relic vault). Tapping the Level tile opens a "Muscle levels" sheet with the `StatTree`.
  Recovery + Focus recommendations live in the Condition report.
- **Progress screen** (v2.1, nav tab right of Hunter): Volume trend + Shadow race inline,
  then a `ListGroup` for PR history, Training heatmap and Condition report. Hunter-account
  management lives in Settings (v2.0.1).

The transforms are scripted and self-verifying: see `scripts/theme/`.

## Conventions

- **Data lives in `data/`, never inline in `iron-realm.jsx`.** Each module is a set of
  `export const` literals with no dependencies, so adding an exercise or a program is a
  one-file change with no risk to app logic.
- **Anything that pulls in three.js goes in `fx/`** and, if it is ever re-enabled, must be
  imported with `React.lazy` so `three` stays off the critical path. The app never imports
  `three` directly. In v2.0 nothing renders these components, so three.js is not in the
  bundle at all.
- **Colour and type come from `ui/tokens.js`.** Do not hard-code hex values in
  `iron-realm.jsx`; the palette is meant to be changeable in one place.
- **Test suites** live in `../qa/` (Playwright). `qa-suite.mjs` and `qa-suite2.mjs` are the
  regression gates — run both after any change to `iron-realm.jsx`.

## Bundle shape (production build)

| version | gz | shape |
|---|---|---|
| v1.14 | 379 KB | one chunk, three.js inlined |
| v1.15 | 247 KB + 133 KB deferred | three.js split into a lazy chunk |
| **v2.0** | **244 KB** | one chunk, no three.js, Orbitron no longer loaded |
