"""Calm pass, round 3 — Home header polish.

  1. "Rising energy orbs": five 3px dots animating upward forever behind the
     header — the stray specks visible in the calm build.
  2. The header's hairline "top cyan line" gradient.
  3. The animated rank emblem (spinning conic aura + two dashed rings + pulsing
     letter) → the same calm avatar circle the Hunter screen uses.
  4. 3px solid muscle-coloured left borders on cards → 2px at 67% alpha, so the
     colour still codes the muscle without framing the card.
"""
import re, sys
PATH = "src/iron-realm.jsx"
src = open(PATH).read()

def cut(pattern, label, flags=0):
    global src
    m = re.search(pattern, src, flags)
    if not m: print(f"ANCHOR FAILED: {label}"); sys.exit(1)
    src = src[:m.start()] + src[m.end():]

cut(r"\n        \{/\* Rising energy orbs \*/\}\n[\s\S]*?\n        \)\)\}\n", "energy orbs")
cut(r"\n        \{/\* Top cyan line \*/\}\n        <div style=\{\{ position: \"absolute\", top: 0, left: 0, right: 0, height: 1,\n[^\n]*\n", "top cyan line")

m = re.search(r"            \{/\* Animated rank emblem \*/\}\n[\s\S]*?\}\}>\{rank\.rank\}</div>\n            </div>\n", src)
if not m: print("ANCHOR FAILED: rank emblem"); sys.exit(1)
src = src[:m.start()] + """            <div aria-hidden="true" style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, background: BG2,
              border: `2px solid ${rank.color}`, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: rank.color }}>{rank.rank}</div>
""" + src[m.end():]

pat = re.compile(r"borderLeft: `3px solid (\$\{[^}]+\})`")
n4 = len(pat.findall(src)); src = pat.sub(r"borderLeft: `2px solid \1aa`", src)

left = {"orbs": src.count("Rising energy orbs"), "emblem rings": src.count("emblem-ring"),
        "3px left borders": len(pat.findall(src)), "orbRise refs": len(re.findall(r"orbRise", src))}
print(f"  left borders softened: {n4}   remaining: {left}")
if left["orbs"] or left["emblem rings"] or left["3px left borders"]: sys.exit(1)
open(PATH, "w").write(src)
