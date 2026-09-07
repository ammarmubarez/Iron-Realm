import re
src = open('src/iron-realm.jsx').read(); orig_len = len(src)

def skip_str(s, j):
    q = s[j]; j += 1
    while j < len(s):
        if s[j] == '\\': j += 2; continue
        if s[j] == q: return j + 1
        if q == '`' and s[j] == '$' and s[j+1] == '{': j = match(s, j+1) + 1; continue
        j += 1
    return j
def match(s, i):
    pairs = {'(': ')', '[': ']', '{': '}'}; stack = [pairs[s[i]]]; j = i + 1
    while j < len(s) and stack:
        c = s[j]
        if c in '"\'`': j = skip_str(s, j); continue
        if c == '/' and s[j+1] == '/': j = s.index('\n', j); continue
        if c == '/' and s[j+1] == '*': j = s.index('*/', j) + 2; continue
        if c in pairs: stack.append(pairs[c])
        elif c == stack[-1]: stack.pop()
        j += 1
    return j - 1
def with_leading_comments(start):
    while True:
        prev_nl = src.rfind('\n', 0, start - 1)
        if src[prev_nl + 1:start - 1].strip().startswith('//'): start = prev_nl + 1
        else: return start
def const_span(name):
    m = re.search(r'^const ' + re.escape(name) + r'\s*=', src, re.M)
    if not m: return None
    j = m.end()
    while True:
        c = src[j]
        if c in '"\'`': j = skip_str(src, j); continue
        if c in '([{': j = match(src, j) + 1; continue
        if c == ';': j += 1; break
        j += 1
    if src[j:j+1] == '\n': j += 1
    return with_leading_comments(m.start()), j

MODULES = {
  "bodyPaths":   ["_MUSCLE_PATHS", "_BODY_PATHS"],
  "exercises":   ["EXERCISE_EMG", "SVG_TO_STAT", "EXERCISE_DB", "MACHINE_NAME_PATTERNS", "BAR_NAME_PATTERNS", "BENCH_REQUIRED"],
  "programs":    ["MALE_PROGRAMS", "FEMALE_PROGRAMS"],
  "progression": ["OVERALL_THRESHOLDS", "MUSCLE_THRESHOLDS", "OVERALL_MILESTONE_NAMES", "OVERALL_MILESTONE_DESC",
                  "MUSCLE_MILESTONE_NAMES", "MUSCLE_MILESTONE_DESC", "MET_VALUES", "ATROPHY"],
  "muscles":     ["MUSCLE_META", "_ID_TO_MUSCLE", "ANGLE_GROUPS", "SELECTION_RULES", "_ANGLE_GROUP_LABELS", "_CUSTOM_SUB_OPTIONS"],
  "profile":     ["GOAL_CONFIG", "FITNESS_GOALS", "ACTIVITY_LEVELS", "EQUIPMENT_CATEGORIES", "_ACCENT_PRESETS", "DAILY_RITUALS"],
  "cosmetics":   ["MONARCHS", "NAME_AURAS", "ASPECTS", "COSMETIC_TITLES", "RELIC_RARITIES", "RELIC_POOL", "RELIC_FRAME_COLORS"],
  "tips":        ["DAILY_TIPS"],
  "mind":        ["MIND_ACTIVITIES"],
}
HEADERS = {
  "bodyPaths":   "SVG path data for the body matrix figure (silhouettes and every muscle region).",
  "exercises":   "The exercise database, EMG activation profiles, and equipment classification.",
  "programs":    "Built-in training programs.",
  "progression": "XP curves, level milestones, MET tables and the atrophy model constants.",
  "muscles":     "Muscle metadata, SVG-region mapping, angle groups and selection rules.",
  "profile":     "Profile options: goals, activity levels, equipment, accent presets, daily rituals.",
  "cosmetics":   "Cosmetics: monarch themes, name auras, aspects, titles and relics.",
  "tips":        "Daily evidence-based training tips shown on the Home screen.",
  "mind":        "Mind & Spirit activity ladders.",
}
moved, spans = {}, []
for mod, names in MODULES.items():
    for n in names:
        sp = const_span(n)
        if not sp: print(f"  !! not found: {n}"); continue
        moved[n] = src[sp[0]:sp[1]]; spans.append((sp[0], sp[1], n))
spans.sort()
for (a, b, n), (c, d, m) in zip(spans, spans[1:]): assert b <= c, f"overlap {n}/{m}"
for s, e, n in reversed(spans): src = src[:s] + src[e:]
order = {n: i for i, (_, _, n) in enumerate(spans)}
imports = []
for mod, names in MODULES.items():
    have = sorted([n for n in names if n in moved], key=lambda n: order[n])
    if not have: continue
    body = "\n".join(moved[n].rstrip() + "\n" for n in have)
    body = re.sub(r'^const ', 'export const ', body, flags=re.M)
    open(f"src/data/{mod}.js", "w").write(
        f"// {HEADERS[mod]}\n// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.\n\n{body}")
    imports.append(f'import {{ {", ".join(have)} }} from "./data/{mod}";')
    print(f"  data/{mod}.js  <- {', '.join(have)}")

def func_span(name):
    m = re.search(r'^function ' + name + r'\(', src, re.M)
    bstart = src.index('{', match(src, m.end() - 1))
    end = match(src, bstart) + 1
    if src[end:end+1] == '\n': end += 1
    return with_leading_comments(m.start()), end
FX = ["SystemParticles", "SoulCore", "CompanionOrb"]
fx_spans = sorted(func_span(n) + (n,) for n in FX)
for s, e, n in reversed(fx_spans):
    text = src[s:e]
    hooks = [h for h in ["useState", "useEffect", "useRef", "useMemo", "useCallback"] if re.search(r'\b' + h + r'\(', text)]
    text = re.sub(r'^function ' + n + r'\(', f'export default function {n}(', text, count=1, flags=re.M)
    open(f"src/fx/{n}.jsx", "w").write(
        (f'import {{ {", ".join(hooks)} }} from "react";\n' if hooks else '') + 'import * as THREE from "three";\n\n' + text)
    src = src[:s] + src[e:]
    print(f"  fx/{n}.jsx  (hooks: {hooks})")
for n in FX:
    pos = 0; wrapped = 0
    while True:
        m = re.search(r'<' + n + r'\b', src[pos:])
        if not m: break
        s = pos + m.start(); j = s
        while True:
            c = src[j]
            if c == '{': j = match(src, j) + 1; continue
            if c in '"\'': j = skip_str(src, j); continue
            if src.startswith('/>', j): j += 2; break
            j += 1
        src = src[:s] + '<Suspense fallback={null}>' + src[s:j] + '</Suspense>' + src[j:]
        pos = j + 37; wrapped += 1
    assert wrapped >= 1, f"no usage wrapped for {n}"

old_react = 'import { useState, useEffect, useCallback, useRef, useMemo } from "react";'
assert old_react in src
src = src.replace(old_react, 'import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";', 1)
assert 'import * as THREE from "three";\n' in src
src = src.replace('import * as THREE from "three";\n', '', 1)
anchor = 'import { createPortal } from "react-dom";\n'
assert anchor in src
lazy_decl = "\n".join(f'const {n:15} = lazy(() => import("./fx/{n}"));' for n in FX)
src = src.replace(anchor, anchor + "\n".join(imports) +
    "\n\n// Visual FX use three.js — loaded on demand so it never blocks first paint.\n" + lazy_decl + "\n", 1)
src = src.replace('const APP_VERSION = "1.14.1";', 'const APP_VERSION = "1.15.0";')

leftover = [n for n in moved if re.search(r'^const ' + re.escape(n) + r'\s*=', src, re.M)]
assert not leftover, f"still defined in main: {leftover}"
assert 'THREE.' not in src, "THREE still referenced in main"
open('src/iron-realm.jsx', 'w').write(src)
print(f"\nmain file: {orig_len:,} -> {len(src):,} bytes ({(1-len(src)/orig_len)*100:.0f}% smaller), {src.count(chr(10))+1:,} lines")
