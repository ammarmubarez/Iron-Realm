# Theme transforms (v1 → v2.0)

Deterministic, self-verifying scripts that produced the v2.0 calm theme from the
v1 "System" look. They are kept for the record and as a template for future
mechanical passes — each one aborts at the first missing anchor rather than
double-applying, and only writes the file after its own residue checks pass.

Run order (from the repo root, on the v1.16 source):

    python3 scripts/theme/00_split_modules.py          # data + three.js FX out of iron-realm.jsx
    python3 scripts/theme/01_calm_theme_and_hunter.py  # palette → ui/tokens, one font, strip glows, Hunter restructure
    python3 scripts/theme/02_labels_borders_runes.py   # string-literal labels, border alphas, rune field
    python3 scripts/theme/03_home_header.py            # Home header: orbs, rings, emblem → calm avatar

They have already been applied to main; re-running them is expected to fail on
the first anchor. See src/README.md for what the result looks like.
