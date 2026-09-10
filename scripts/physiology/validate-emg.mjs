// Validates src/data/emg.js against the exercise DB and programs, and (with
// --write) regenerates each exercise's svgTargets from its profile so the
// body figure highlights what the XP engine credits.
//
//   node scripts/physiology/validate-emg.mjs          # check only
//   node scripts/physiology/validate-emg.mjs --write  # also rewrite svgTargets
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, "../../src/data");
const dataUrl = (src) => "data:text/javascript;base64," + Buffer.from(src).toString("base64");
const emgSrc = readFileSync(join(dataDir, "emg.js"), "utf8");
const emgMod = await import(dataUrl(emgSrc));
const exSrc = readFileSync(join(dataDir, "exercises.js"), "utf8").replace('from "./emg"', `from "${dataUrl(emgSrc)}"`);
const { EXERCISE_DB, SVG_TO_STAT, EXERCISE_EMG } = await import(dataUrl(exSrc));
const progSrc = readFileSync(join(dataDir, "programs.js"), "utf8");
const programNames = new Set([...progSrc.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]));

const errors = [];
const all = [];
for (const [grp, list] of Object.entries(EXERCISE_DB)) for (const ex of list) all.push({ grp, ...ex });
const dbNames = new Set(all.map(e => e.name));
const validIds = new Set(Object.keys(SVG_TO_STAT));
// 1. every non-cardio DB exercise has a profile
for (const ex of all) {
  if (ex.type === "cardio") continue;
  if (!EXERCISE_EMG[ex.name]) errors.push(`no profile: ${ex.name} (${ex.grp})`);
}
// 2. every program exercise (that is an exercise, not a title) has a profile
for (const n of programNames) {
  if (dbNames.has(n)) continue;
  const cardio = all.find(e => e.name === n && e.type === "cardio");
  if (!cardio && !EXERCISE_EMG[n] && /Pushdown|Squat|Curl|Raise|Extension|Flyes|Bench|Press|Row|Deadlift/.test(n)) errors.push(`program exercise without profile: ${n}`);
}
// 3. profile sanity: valid ids, one prime mover at 100, values 1..100
for (const [name, prof] of Object.entries(EXERCISE_EMG)) {
  const vals = Object.values(prof);
  if (Math.max(...vals) !== 100) errors.push(`${name}: prime mover must be 100 (max ${Math.max(...vals)})`);
  for (const [id, v] of Object.entries(prof)) {
    if (!validIds.has(id)) errors.push(`${name}: unknown muscle id ${id}`);
    if (v < 1 || v > 100) errors.push(`${name}: ${id}=${v} out of range`);
  }
  if (!dbNames.has(name) && !programNames.has(name)) errors.push(`orphan profile (not in DB or programs): ${name}`);
}
// 4. report stat shares for the built-in DB
const credit = (a) => Math.pow(a / 100, 1.5);
const shares = (prof) => { const best = {}; for (const [id, v] of Object.entries(prof)) { const st = SVG_TO_STAT[id]; best[st] = Math.max(best[st] || 0, v); } return Object.entries(best).map(([k, a]) => [k, credit(a)]).sort((a, b) => b[1] - a[1]); };
if (process.argv.includes("--report")) {
  for (const ex of all) { if (ex.type === "cardio") continue; const sh = shares(EXERCISE_EMG[ex.name]); console.log(`${ex.name.padEnd(32)} ${sh.map(([k, v]) => `${k} ×${v.toFixed(2)}`).join(", ")}`); }
}
console.log(`exercises: ${all.length} | profiles: ${Object.keys(EXERCISE_EMG).length} | errors: ${errors.length}`);
errors.forEach(e => console.log("  ✗", e));
if (errors.length) process.exit(1);

// 5. --write: svgTargets = muscles at ≥ 30 % of the prime mover, ordered by activation
if (process.argv.includes("--write")) {
  let src = readFileSync(join(dataDir, "exercises.js"), "utf8");
  let n = 0;
  src = src.replace(/(\{ name: "([^"]+)"[^\n]*?svgTargets: )\[[^\]]*\]/g, (m, head, name) => {
    const prof = EXERCISE_EMG[name];
    if (!prof) return m;
    const ids = Object.entries(prof).filter(([, v]) => v >= 30).sort((a, b) => b[1] - a[1]).map(([id]) => `"${id}"`);
    n++;
    return `${head}[${ids.join(",")}]`;
  });
  writeFileSync(join(dataDir, "exercises.js"), src);
  console.log(`svgTargets rewritten for ${n} exercises`);
}
