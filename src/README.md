# `src/` layout

```
src/
├── index.js            React entry — mounts <IronRealm />
├── iron-realm.jsx      App: screens, modals, game logic, XP engine, theming
├── data/               Pure data. No imports, no runtime code — safe to edit freely.
│   ├── exercises.js    EXERCISE_DB, EMG activation profiles, equipment classification
│   ├── programs.js     Built-in training programs (MALE_PROGRAMS / FEMALE_PROGRAMS)
│   ├── progression.js  XP thresholds, level milestones, MET tables, atrophy constants
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
  Fresh muscles) → body matrix → `ListGroup`s (Progress / Identity / Account) →
  muscle levels. Volume trend + Shadow race moved into a Progress sheet; Recovery +
  Focus recommendations moved into the Condition report.

The transforms are scripted and self-verifying: see `scripts/theme/`.

## Conventions

- **Data lives in `data/`, never inline in `iron-realm.jsx`.** Each module is a set of
  `export const` literals with no dependencies, so adding an exercise or a program is a
  one-file change with no risk to app logic.
- **Anything that pulls in three.js goes in `fx/`** and is imported with `React.lazy`.
  The app never imports `three` directly. This keeps the ~130 KB gz three.js chunk out of
  the initial bundle; it streams in after first paint.
- **Test suites** live in `../qa/` (Playwright). `qa-suite.mjs` and `qa-suite2.mjs` are the
  regression gates — run both after any change to `iron-realm.jsx`.

## Bundle shape (production build)

| chunk | gz | what |
|---|---|---|
| `main.*.js` | ~247 KB | app + data |
| `408.*.chunk.js` | ~133 KB | three.js (deferred) |
| three `*.chunk.js` | ~1 KB each | the fx component wrappers |

Before the split the app shipped as a single 379 KB gz chunk.
