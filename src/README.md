# `src/` layout

```
src/
├── index.js            React entry — mounts <IronRealm />
├── iron-realm.jsx      App: screens, modals, game logic, XP engine, theming
├── data/               Pure data. No imports, no runtime code — safe to edit freely.
│   ├── exercises.js    EXERCISE_DB, emgFor(), bodyweight load fractions, equipment classification
│   ├── emg.js          Per-exercise muscle activation profiles (v2.4 anatomy pass)
│   ├── strength.js     Strength standards + lift families — suggests a load for an unlogged lift
│   ├── programs.js     Built-in training programs (MALE_PROGRAMS / FEMALE_PROGRAMS)
│   ├── programShare.js Custom-program shape, validation, export/import + share envelope
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
└── services/           Supabase: auth, sync, friends, admin, cloud state, program sharing
```

## v2.14 — maintenance measured from your own weigh-ins

`data/metabolism.js`. Mifflin-St Jeor is a population average that scatters
±10–15 % per person and drifts down during a diet; the 3,500 kcal-per-pound rule
compounds that over weeks. So the formula is now only the starting guess.

    maintenance = mean daily intake − (pounds gained per day × 3,500)

- **Least-squares slope**, not first-minus-last: scale weight swings pounds on
  water and glycogen, so two endpoints can be a full pound/week off the trend.
- **Gates before it is used at all**: 4+ weigh-ins, a 14-day span, and ≥ 60 % of
  the 42-day window with food logged. Unlogged days are the real hazard —
  averaging logged days assumes the rest matched. Each gate returns a plain-
  language `reason` that the card shows.
- **Confidence-weighted blend** toward the measured value (full trust at 35 days
  and 90 % coverage), so it never swings on thin data. `FULL_TRUST_DAYS` must sit
  inside `TDEE_WINDOW_DAYS` or confidence silently caps below 1.
- **Sanity band**: a result below 55 % or above 160 % of the formula is treated
  as mis-logged food or a changed scale, not a remarkable metabolism.
- `maintenanceFor()` (memoised on a cheap signature, since `calcTDEE` runs most
  renders) feeds `calcTDEE`, `planSummaryFor` and `fuelContext`. The calorie card
  shows the source, the drift from the formula, the confidence and the observed
  scale trend.

Validated against synthetic data with known ground truth: a true 2,500
maintenance reads 2,468 and a true 3,100 reads 3,068 through ±1 lb scale noise;
thin or sparsely logged data correctly stays on the formula.

## v2.13 — the calorie floor can be lifted, with informed consent

Two floors instead of one, because "don't plan a crash diet by accident" and
"never plan one at all" are different rules:

- **Advisory floor** (`intakeFloor`): resting metabolic rate, or 1,500/1,200 kcal,
  whichever is higher. Default behaviour, and the card now says both what it
  capped to *and* what the hunter actually asked for.
- **Lifting it**: "Use my exact number instead" opens a consent panel listing the
  real risks (muscle loss, low energy availability and its hormonal/bone effects,
  gallstones and deficiencies, and that sub-800 kcal is supervised medicine). The
  confirm button stays disabled until the checkbox is ticked. Acknowledgement is
  stored per profile as `belowFloorAckAt`, and "Put the safety cap back" reverses
  it. Once lifted, `calcTDEE` uses the exact offset — a silently adjusted target
  is a wrong target.
- **Hard floor** (`HARD_INTAKE_FLOOR`, 800 kcal): not liftable by consent at all.
  Verified: a 150 lb male or 130 lb female requesting −2,000 lands on 800, not
  below.

`public/terms.html` gained section 1b covering self-set targets and stating
plainly that acknowledging a risk records the decision — it does not make the
target safe or move responsibility away from the user and their clinicians.

## v2.12 — editing no longer deletes, and every XP change is on the record

**The bug.** Editing an exercise logged from the Schedule deleted it. The Schedule
saved the replacement first and then removed "the original" by matching
`(date, exerciseName)` — but `getDayDate()` gives every entry on a weekday the
same midnight timestamp, so that match hit the replacement too and both went.
Reproduced, then fixed three ways:

- Every workout entry carries a stable `id` (backfilled on load for old entries).
- An edit is one atomic write: `entry.replaces` removes the original in the same
  commit that adds the new one, so neither can clobber the other. Both edit call
  sites now use it; the Schedule one had them in the wrong order as well.
- `commitWorkoutChange()` is the only thing allowed to touch `p.workouts`. It
  removes at most ONE entry, rebuilds the derived stats and appends an audit
  event.

**The ledger** (`data/xpAudit.js`, `profile.xpLog`). Every log / edit / delete /
revert records the XP before and after plus enough to reverse it exactly: the id
of the entry added, and the whole entry removed. Progress → XP log lists them
with a one-tap undo and flags anything worth a look (a single gain over 1,500
kcal, a delete that raised XP, a log that lowered it). Capped at 250 events.

**Founder review** (`services/xpAudit.js`, migration 013). Events mirror to
`xp_audit`: time, type, exercise name, delta, running total, anomaly flag — no
sets, loads, body metrics or nutrition. Append-only by policy (INSERT only, no
UPDATE or DELETE), owner-or-admin read via `is_admin()`. The admin profile modal
gains an "XP LOG" section; it is read-only, because reverting belongs to the
device that owns the data. `public/privacy.html` documents exactly this.

## v2.11 — the calorie target is a plan, not a hidden constant

The goal's fixed `tdeeOffset` (cut −400, bulk +300 …) is now only a fallback.
Onboarding gains a fifth step, "Calorie plan", and Settings → Account → Edit
profile gains the same control plus a goal picker.

- **Pick a weekly rate** in lb/kg and the daily offset follows (1 lb of fat ≈
  3,500 kcal, so 1 lb/week ≈ 500 kcal/day). Presets are 0.5/1/1.5/2 lb for loss
  and 0.25/0.5/0.75/1 lb for gain, each annotated with its share of body weight
  and colour-coded: loss is gentle ≤ 0.55 %/wk, standard ≤ 1 %/wk, and past 1 %
  costs strength and muscle (Garthe 2011); gain is lean ≤ 0.3 %/wk, solid
  ≤ 0.55 %/wk, mostly fat beyond (Garthe 2013).
- **Or type the offset directly.** Both controls write one stored field,
  `profile.calorieOffset` (signed kcal/day), and the displayed rate is always
  derived back from it, so they cannot disagree. `null` means "use the goal's
  old default", which keeps pre-v2.11 profiles working unchanged.
- **Intake floor**: `calcTDEE` never plans below `intakeFloor(bmr, isFemale)` —
  BMR, or the 1,500/1,200 kcal clinical floors, whichever is higher. A 2 lb/week
  target on a small frame is clamped and the UI says so instead of quietly
  prescribing a crash diet. `planSummaryFor(profile)` exposes requested vs
  effective offset for anything that needs to show the difference.

## v2.10 — protein no longer charges the calorie currency

Two currencies, two gates, and the UI now says which one fired:

- `calcNetXP(workoutXP, calsEaten, tdee)` takes **calories only**. It used to also
  apply the protein multiplier, so one protein shortfall was charged twice: against
  Muscle XP (correct) and against Hunter XP, which is kilocalories burned and cannot
  be changed by what you ate. The log path never applied protein, so the modal was
  also previewing a lower number than it stored.
- The red line names the real cause: "-10 Hunter XP — 449 kcal over your cut target"
  instead of always blaming a calorie surplus. It only renders when calories actually
  reduced the number; the protein shortfall keeps its own gold line on Muscle XP.
- `calorieBudgetLabel(profile)` — `calcTDEE` returns maintenance **plus the goal
  offset**, so it is a budget, not maintenance: on a cut you can be 300 kcal under
  maintenance and still over budget. The UI now says "over your cut target" rather
  than "surplus". The nutrition card's single blended "% XP" badge is likewise split
  into "% HUNTER XP" (calories) and "% MUSCLE XP" (protein).

## v2.9 custom programs — build, export, import, share

- **One resolver.** `allProgramsFor(profile)` / `resolveProgram(profile)` return Free Workout,
  the hunter's `customPrograms` and the built-ins for their gender. The Programs screen,
  the Schedule and the Home "today" card all go through it, so a custom program drives the
  app exactly like a built-in one. Before v2.9 each screen resolved programs itself and
  `customPrograms` was written but never read.
- **Builder** (`ProgramBuilderModal`): name, icon, accent, description, then seven days each
  with a label, a rest toggle and an ordered exercise list (sets + rep target, reorder,
  remove). A live weekly-volume panel shows credited sets per muscle group against the
  10–20 sets/week band, using the same `statCredits` the XP engine uses — so a program can
  be checked before it is ever run.
- **Export / import**: `data/programShare.js`. A `.json` file (readable, versioned envelope)
  or an `IR1:` share code (base64url of a compact payload — a 5-day program is ~1 KB, small
  enough to paste into a chat). `normalizeProgram()` is the ONLY way a program enters the
  store: it rebuilds every field, clamps strings and counts, forces the accent to the
  palette, drops exercises not in the local database, and re-derives `diff`/`type` locally
  so a share cannot smuggle values into the XP engine. Dropped exercises are reported.
- **Friend sharing**: `services/programs.js` + `supabase/migrations/012_program_sharing.sql`.
  RLS lets a hunter insert only as themselves and only to an existing friend; both parties
  can read, only the recipient can dismiss. Rate limited (30/hour, 200 pending), payload
  capped at 32 KB, and the row is immutable after insert. The Program tab carries an inbox
  badge, and the recipient chooses whether to import — nothing is written automatically.

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
