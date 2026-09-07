"""Calm pass, round 2 — residues found on review of the first pass.

  1. Section labels that were string literals ("// BODY WEIGHT") rather than
     JSX text or templates, so the first pass missed them.
  2. Tinted card borders: every `1px solid ${COLOR}44`-style border kept its
     hue at 20-60% alpha and still shouted. Soften all of them to 13% (`22`)
     — the colour code survives as a hint, not a frame.
  3. The parallax rune field on Home (static glyphs after the keyframe purge,
     but still visual noise).
  4. Bracketed labels containing an em-dash or digits ("[ VOLUME TREND — 12 WEEKS ]").
"""
import re, sys
PATH = "src/iron-realm.jsx"
src = open(PATH).read()

# 1. string-literal "// LABEL" → "LABEL"
n1 = len(re.findall(r"""(["'`])// (?=[A-Z])""", src))
src = re.sub(r"""(["'`])// (?=[A-Z])""", r"\1", src)

# 2. soften tinted borders: alpha 33..ff → 22 on `solid ${X}NN`
pat = re.compile(r"(solid \$\{[A-Za-z0-9_.?]+\})([3-9a-fA-F][0-9a-fA-F])(?=`)")
n2 = len(pat.findall(src))
src = pat.sub(r"\g<1>22", src)

# 3. rune field
m = re.search(r"\n\s*\{/\* Parallax rune field[^\n]*\n\s*<div style=\{\{ position: \"sticky\"[\s\S]*?\n\s*\)\)\}\n\s*</div>\n", src)
if not m: print("ANCHOR FAILED: rune field"); sys.exit(1)
src = src[:m.start()] + "\n" + src[m.end():]

# 4. any remaining "[ … ]" label, JSX text or template
n4a = len(re.findall(r">\[ ([^\]<]{2,60}) \]<", src)); src = re.sub(r">\[ ([^\]<]{2,60}) \]<", r">\1<", src)
n4b = len(re.findall(r"\{`\[ (.+?) \]`\}", src));   src = re.sub(r"\{`\[ (.+?) \]`\}", r"{`\1`}", src)

print(f"  labels: {n1}  borders softened: {n2}  rune field: removed  brackets: {n4a + n4b}")
left = {"// labels": len(re.findall(r"""["'`]// [A-Z]""", src)), "loud borders": len(pat.findall(src)),
        "rune field": src.count("Parallax rune field")}
print("  remaining:", left)
if any(left.values()): print("residue remains"); sys.exit(1)
open(PATH, "w").write(src)
