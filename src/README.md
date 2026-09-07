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
├── fx/                 three.js visuals — lazy-loaded so three.js stays off the critical path
│   ├── SystemParticles.jsx   Ambient particle field behind every screen
│   ├── SoulCore.jsx          Rank emblem on the Character screen
│   └── CompanionOrb.jsx      Companion orb on the Home header
└── services/           Supabase: auth, sync, friends, admin, cloud state
```

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
