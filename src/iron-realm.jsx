/* eslint-disable */
import { useState, useEffect, useCallback, useRef, useMemo, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { _MUSCLE_PATHS, _BODY_PATHS } from "./data/bodyPaths";
import { EXERCISE_EMG, SVG_TO_STAT, EXERCISE_DB, MACHINE_NAME_PATTERNS, BAR_NAME_PATTERNS, BENCH_REQUIRED } from "./data/exercises";
import { MALE_PROGRAMS, FEMALE_PROGRAMS } from "./data/programs";
import { OVERALL_THRESHOLDS, MUSCLE_THRESHOLDS, OVERALL_MILESTONE_NAMES, OVERALL_MILESTONE_DESC, MUSCLE_MILESTONE_NAMES, MUSCLE_MILESTONE_DESC, MET_VALUES, ATROPHY } from "./data/progression";
import { MUSCLE_META, _ID_TO_MUSCLE, ANGLE_GROUPS, SELECTION_RULES, _ANGLE_GROUP_LABELS, _CUSTOM_SUB_OPTIONS } from "./data/muscles";
import { _ACCENT_PRESETS, FITNESS_GOALS, GOAL_CONFIG, EQUIPMENT_CATEGORIES, ACTIVITY_LEVELS, DAILY_RITUALS } from "./data/profile";
import { MONARCHS, NAME_AURAS, RELIC_RARITIES, RELIC_POOL, RELIC_FRAME_COLORS, COSMETIC_TITLES, ASPECTS } from "./data/cosmetics";
import { DAILY_TIPS } from "./data/tips";
import { MIND_ACTIVITIES } from "./data/mind";

import * as authService from "./services/auth";
import * as syncService from "./services/sync";
import * as friendsService from "./services/friends";
import * as adminService from "./services/admin";
import * as cloudStateService from "./services/cloudState";
import { isConfigured as supabaseConfigured } from "./services/supabaseClient";

// Visual FX use three.js (~130 KB gz) — loaded on demand in their own chunk so
// they never block first paint. Each usage is wrapped in <Suspense fallback={null}>.
const SystemParticles = lazy(() => import("./fx/SystemParticles"));
const SoulCore        = lazy(() => import("./fx/SoulCore"));
const CompanionOrb    = lazy(() => import("./fx/CompanionOrb"));

const APP_VERSION = "1.15.0";

// ─── THEME — Iron Realm System UI ──────────────────────────────────────────────
const BG      = "#03060f";   // void black
const BG2     = "#070d1a";   // system panel dark
const BG3     = "#0b1425";   // inner panel
let ACCENT  = "#00d4ff";   // system electric cyan
let ACCENT2 = "#0044aa";   // deep system blue
const GOLD    = "#e8c44a";   // hunter rank gold
const GOLD2   = "#ffe680";   // bright gold highlight
const TEXT    = "#d0e8ff";   // system text — cold blue-white
const MUTED   = "#3a5878";   // inactive / dim
const RED     = "#ff3a3a";   // danger / enemy red
const GREEN   = "#00ff88";   // system success / buff
const CYAN2   = "#00ffee";   // highlight teal
const DARK1   = "#020508";   // deepest void

// Weight unit helper — reads live from store settings
// Components call wtLabel() for "lbs"/"kg" and wtVal(lbs) to convert
const getWtUnit   = () => { try { const s = localStorage.getItem("iron_realm_store_v1"); return s ? (JSON.parse(s).settings?.weightUnit || "lbs") : "lbs"; } catch { return "lbs"; } };
const wtLabel     = () => getWtUnit();
const wtVal       = (lbs) => getWtUnit() === "kg" ? +(lbs * 0.453592).toFixed(1) : lbs;
const wtValBack   = (val) => getWtUnit() === "kg" ? +(val / 0.453592).toFixed(1) : val;



// Helper — get theme label or fall back to default
const themeLabel = (settings, key, def) => {
  if (!settings?.monarchTheme) return def;
  const m = MONARCHS.find(m => m.id === settings.monarchTheme);
  return m?.labels?.[key] || def;
};

// Adjust accent hex by brightness multiplier (0.3–1.5)
function applyBrightness(hex, mult) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  const clamp = v => Math.min(255, Math.max(0, Math.round(v * mult)));
  return '#' + [clamp(r),clamp(g),clamp(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}


// Get today's tip — rotates daily based on day of year
const getTodayTip = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
};

const XP_FOR_OVERALL_LEVEL = (lvl) => OVERALL_THRESHOLDS[Math.min(lvl - 1, 99)];
const XP_FOR_MUSCLE_LEVEL  = (lvl) => MUSCLE_THRESHOLDS[Math.min(lvl - 1, 99)];



function getOverallMilestoneName(level) {
  const idx = Math.min(level - 1, OVERALL_MILESTONE_NAMES.length - 1);
  return OVERALL_MILESTONE_NAMES[Math.max(0, idx)];
}
function getOverallMilestoneDesc(level) {
  const idx = Math.min(level - 1, OVERALL_MILESTONE_DESC.length - 1);
  return OVERALL_MILESTONE_DESC[Math.max(0, idx)];
}
function getMuscleMilestoneName(level) {
  const idx = Math.min(level - 1, MUSCLE_MILESTONE_NAMES.length - 1);
  return MUSCLE_MILESTONE_NAMES[Math.max(0, idx)];
}
function getMuscleMilestoneDesc(level) {
  const idx = Math.min(level - 1, MUSCLE_MILESTONE_DESC.length - 1);
  return MUSCLE_MILESTONE_DESC[Math.max(0, idx)];
}
// first-level thresholds for display
const FIRST_OVERALL_THRESHOLD = OVERALL_THRESHOLDS[0];
const FIRST_MUSCLE_THRESHOLD  = MUSCLE_THRESHOLDS[0];










// Renders a small coloured hexagonal badge with a 2-letter glyph
function MuscleIcon({ muscle, size = 28 }) {
  const meta = MUSCLE_META[muscle];
  if (!meta) return null;
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
      <polygon points="14,2 25,8 25,20 14,26 3,20 3,8"
        fill={meta.color + "22"} stroke={meta.color} strokeWidth="1.2" />
      <text x="14" y="17" textAnchor="middle"
        style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 7, fontWeight: 700, fill: meta.color, letterSpacing: 0.5 }}>
        {meta.glyph}
      </text>
    </svg>
  );
}

// ─── INITIAL STATE ────────────────────────────────────────────────────────────
const newProfile = (id, name = "Hunter") => ({
  id,
  name,
  gender: null,
  goal: null,
  age: null,
  weightLbs: 170,
  heightIn: 70,
  activityLevel: "moderate",
  program: null,
  customSchedule: null,
  stats: { chest:0, back:0, legs:0, shoulders:0, bicep:0, tricep:0, forearms:0, core:0, glutes:0, calves:0, cardio:0, calisthenics:0 },
  levels: { chest:1, back:1, legs:1, shoulders:1, bicep:1, tricep:1, forearms:1, core:1, glutes:1, calves:1, cardio:1, calisthenics:1 },
  overallXP: 0,
  overallLevel: 1,
  workouts: [],
  foodLog: [],   // [{ date: timestamp, calories: number }]
  customPrograms: [],
  customExercises: [],
  prs: {},              // { exerciseName: estimated1RM }
  lastWeightUpdate: null,
  weightLog: [],
  bookmarkedExercises: [],   // array of exercise names pinned to top of database
  dailyRituals: { completionLog: {} }, // { 'YYYY-MM-DD': ['pushups','stretch',...] }
  mindLog: [],  // [{ id, date, stat:'intelligence'|'faith', activity, label, qty, xp }] — mind/spirit growth ledger
  mindTasks: [],     // pinned daily tasks: [{ id, stat, activity, label, qty, xp }]
  mindTasksLog: {},  // { 'YYYY-MM-DD': [taskId, ...] } — which daily tasks were completed each day
  cosmetics:    { unlockedTitles: [], equippedTitle: null },
  patronLift:   null,   // exercise name pinned as signature lift
  createdAt: Date.now(),
});

const INIT_STORE = {
  activeId: "p1",
  profiles: { p1: { ...newProfile("p1"), onboarded: false } },
  settings: {
    accentColor:   "#00d4ff",
    accent2Color:  "#0044aa",
    monarchTheme: null,   // null or monarch id string
    brightness:    1.0,       // 0.5 = dim, 1.0 = normal, 1.3 = vivid
    weightUnit:    "lbs",
    showXPGain:    true,
    showMilestones: true,
    compactCards:  false,
    travelMode:    false, // filters exercise lists to your hotel-gym equipment
    travelEquipment: ["BODYWEIGHT", "BENCH", "DUMBBELL", "KETTLEBELL", "CARDIO"],
  },
};

// Travel mode: an exercise is available if it can be done with whatever
// equipment is checked in settings.travelEquipment (hotel-gym scenario by
// default = bodyweight + dumbbell + kettlebell + cardio). Strength exercises
// are classified from their name; calisthenics and cardio map directly from
// the exercise type.



function needsBench(exercise) {
  if (!exercise) return false;
  const primary = exerciseEquipment(exercise);
  if (primary === "MACHINE" || primary === "CABLE") return false;
  return BENCH_REQUIRED.has(exercise.name);
}

function exerciseEquipment(exercise) {
  if (!exercise) return null;
  if (exercise.type === "calisthenics") {
    const n = (exercise.name || "").toLowerCase();
    // Rings always need rings; every dip needs a station EXCEPT bench dips,
    // which only need an edge to sit on (chair, bed, step — see BODYWEIGHT).
    if (n.includes("ring")) return "PULLUP_BAR";
    if (n.includes("dip") && !n.includes("bench")) return "PULLUP_BAR";
    if (BAR_NAME_PATTERNS.some(p => n.includes(p))) return "PULLUP_BAR";
    return "BODYWEIGHT";
  }
  if (exercise.type === "cardio")       return "CARDIO";
  if (exercise.type !== "strength")     return null;
  const name = (exercise.name || "").toLowerCase();
  if (name.includes("dumbbell"))   return "DUMBBELL";
  if (name.includes("kettlebell")) return "KETTLEBELL";
  if (name.includes("cable"))      return "CABLE";
  if (MACHINE_NAME_PATTERNS.some(p => name.includes(p))) return "MACHINE";
  return "BARBELL"; // default for strength exercises
}

// Travel mode: a fixed program day can contain exercises the user can't do
// (a hotel room has no dip station). Rather than leave a hole in the plan,
// swap in the closest doable exercise for the same muscle — preferring the
// same movement type and difficulty — so the session stays complete.
function travelSubstitute(planEx, availableEquipment, customExercises = []) {
  if (isTravelFriendly(planEx, availableEquipment)) return null;
  const muscle = planEx.muscle || planEx.primary || "chest";
  const pool = [...(EXERCISE_DB[muscle] || []),
                ...(customExercises || []).filter(e => e.primary === muscle)]
    .filter(e => e.name !== planEx.name && isTravelFriendly(e, availableEquipment));
  if (!pool.length) return null;
  const DIFFS = ["beginner", "intermediate", "advanced", "elite"];
  const want = DIFFS.indexOf(planEx.diff || "intermediate");
  const score = e =>
    (e.type === planEx.type ? 0 : 10) +
    Math.abs(DIFFS.indexOf(e.diff) - (want < 0 ? 1 : want));
  return [...pool].sort((a, b) => score(a) - score(b))[0];
}

function isTravelFriendly(exercise, availableEquipment) {
  const equip = exerciseEquipment(exercise);
  if (!equip) return false;
  const list = Array.isArray(availableEquipment) && availableEquipment.length > 0
    ? availableEquipment
    : ["BODYWEIGHT", "CARDIO"];
  if (!list.includes(equip)) return false;
  // A bench is a second, independent requirement — no bench, no bench press,
  // however many dumbbells are on hand.
  if (needsBench(exercise) && !list.includes("BENCH")) return false;
  return true;
}


// ── CORE FORMULA ──────────────────────────────────────────────────────────────
// Calories = MET × bodyWeightKg × durationHours
// Duration is estimated from actual sets × reps/time logged:
//   • Strength : ~3 sec/rep + 90 sec rest between sets  (realistic time-under-tension)
//   • Calisthenics: ~4 sec/rep + 90 sec rest
//   • Cardio  : duration in minutes entered directly
//
// XP earned = calories burned (1:1)
// Overall level-up: scaling curve — 500 × n^1.6 XP per level
// Muscle level-up : scaling curve — 120 × n^1.5 XP per level

// ── SPEED → MET LOOKUP ───────────────────────────────────────────────────────
// Source: Ainsworth BE et al. "2011 Compendium of Physical Activities"
// Med Sci Sports Exerc. 2011;43(8):1575-1581
// Interpolates MET linearly between measured breakpoints.
// Formula: Calories = MET(speed) × weight_kg × hours

const SPEED_MET_TABLE = [
  // [mph, MET]
  [2.0, 2.8], [2.5, 3.0], [3.0, 3.5], [3.5, 4.3],
  [4.0, 5.0], [4.5, 6.3], [5.0, 8.3], [5.5, 9.0],
  [6.0, 10.0],[6.5, 10.5],[7.0, 11.0],[7.5, 11.5],
  [8.0, 11.8],[8.5, 12.3],[9.0, 12.8],[10.0, 14.5],
  [12.0, 16.0],
];

function metFromSpeed(mph) {
  const s = Math.max(1.0, mph);
  // Below table min
  if (s <= SPEED_MET_TABLE[0][0]) return SPEED_MET_TABLE[0][1];
  // Above table max
  if (s >= SPEED_MET_TABLE[SPEED_MET_TABLE.length - 1][0]) return SPEED_MET_TABLE[SPEED_MET_TABLE.length - 1][1];
  // Linear interpolation between bracketing points
  for (let i = 0; i < SPEED_MET_TABLE.length - 1; i++) {
    const [s0, m0] = SPEED_MET_TABLE[i];
    const [s1, m1] = SPEED_MET_TABLE[i + 1];
    if (s >= s0 && s <= s1) {
      const t = (s - s0) / (s1 - s0);
      return m0 + t * (m1 - m0);
    }
  }
  return 7.0;
}

// ── CALORIE CALCULATION ───────────────────────────────────────────────────────
// Cardio:   Calories = MET × weight_kg × hours  (unchanged)
// Strength: Calories = MET × weight_kg × set_duration  (base)
//           then multiplied by intensity + RIR modifiers per set

// Stepping machines: intensity is set by step rate, not just duration. Anchored
// on the Compendium of Physical Activities value for a stair-treadmill ergometer
// (9.0 METs, ~50 steps/min), scaling linearly with rate and clamped to the range
// the machines actually cover.
function metFromStepRate(spm) {
  const rate = Math.max(0, parseFloat(spm) || 0);
  return Math.min(17, Math.max(4, 4.5 + 0.09 * rate));
}

function calcCalories(exercise, sets, repsOrTime, weightLbs = 170, extraData = {}) {
  const weightKg = weightLbs * 0.453592;
  const val = parseFloat(repsOrTime) || 0;

  if (exercise.type === "cardio") {
    const durationHours = val / 60;
    if (exercise.cardioMode === "speed") {
      const mph = parseFloat(extraData.speedMph) || exercise.defaultSpeed || 3.5;
      const met = metFromSpeed(mph);
      return Math.round(met * weightKg * durationHours);
    }
    if (exercise.cardioMode === "spm") {
      const spm = parseFloat(extraData.stepsPerMin) || exercise.defaultSpm || 50;
      return Math.round(metFromStepRate(spm) * weightKg * durationHours);
    }
    const met = exercise.met || MET_VALUES.cardio[exercise.diff] || 7.0;
    return Math.round(met * weightKg * durationHours);
  }

  if (exercise.type === "calisthenics") {
    const met = MET_VALUES.calisthenics[exercise.diff] || 5.5;
    const durationHours = (sets * (val * 4 + 90)) / 3600;
    return Math.round(met * weightKg * durationHours);
  }

  // Strength base calories
  const met = MET_VALUES.strength[exercise.diff] || 5.0;
  const durationHours = (sets * (val * 3 + 90)) / 3600;
  return Math.round(met * weightKg * durationHours);
}

// ── HYPERTROPHY XP MODIFIERS ──────────────────────────────────────────────────
// Source [1]: Epley B (1985) — 1RM estimation
// Source [2]: Morton RW et al (2016) J Appl Physiol 121(1):129-138
// Source [3]: Schoenfeld BJ, Grgic J (2019) Strength Cond J 41(5):108-113
// Source [4]: Kraemer WJ et al (2002) Med Sci Sports Exerc 34(2):364-380

// Estimate 1RM from a set (Epley 1985). Only valid for 1-12 reps.
function epley1RM(weight, reps) {
  if (reps < 1 || reps > 12) return null;
  return weight * (1 + reps / 30);
}

// RPE (Rate of Perceived Exertion) — 1-10 scale
// Returns label + color for a given RPE value
const RPE_META = {
  6:  { label: "Easy",      color: "#4ade80", hint: "4+ reps left" },
  7:  { label: "Moderate",  color: "#86efac", hint: "3 reps left" },
  8:  { label: "Hard",      color: "#fbbf24", hint: "2 reps left" },
  9:  { label: "Very hard", color: "#f97316", hint: "1 rep left" },
  10: { label: "Max",       color: "#ef4444", hint: "Failure" },
};

// Suggest next-session weight change based on RPE
// RPE ≤ 6: +5%   RPE 7: +2.5%   RPE 8: hold   RPE 9: hold   RPE 10: -5%
function rpeWeightSuggestion(rpe, weight) {
  if (!rpe || !weight) return null;
  if (rpe <= 6)  return { delta: +Math.round(weight * 0.05), reason: "Too easy — push up" };
  if (rpe === 7) return { delta: +Math.round(weight * 0.025), reason: "Room to grow" };
  if (rpe === 8) return { delta: 0, reason: "Solid working weight" };
  if (rpe === 9) return { delta: 0, reason: "Hold steady — push for +1 rep" };
  if (rpe >= 10) return { delta: -Math.round(weight * 0.05), reason: "Pushed too hard — back off" };
  return null;
}

// Intensity modifier: reward training close to your max [2]
function intensityModifier(pct) {
  if (pct < 0.40) return 0.50;
  if (pct < 0.60) return 0.80;
  if (pct < 0.75) return 1.00;
  if (pct < 0.85) return 1.15;
  if (pct < 0.95) return 1.25;
  return 1.10; // at/above 95% — max effort but low volume
}

// RIR modifier: reward proximity to failure [3]
// Estimates reps-in-reserve via inverted Epley: maxReps = (1RM/weight - 1) × 30
function rirModifier(weight, reps, e1rm) {
  if (!e1rm || e1rm <= 0) return 1.0;
  const maxRepsAtWeight = (e1rm / weight - 1) * 30;
  const rir = Math.max(0, maxRepsAtWeight - reps);
  if (rir <= 1) return 1.30;
  if (rir <= 3) return 1.10;
  if (rir <= 5) return 1.00;
  if (rir <= 8) return 0.85;
  return 0.65;
}

// PR bonus: reward progressive overload [4]
function prBonus(newE1RM, storedE1RM) {
  if (!storedE1RM || newE1RM <= storedE1RM) return 1.0;
  const improvement = (newE1RM - storedE1RM) / storedE1RM;
  if (improvement >= 0.10) return 1.30;
  if (improvement >= 0.05) return 1.20;
  return 1.10;
}

// Build a chronological history of PR-setting events, exercise by exercise.
// Walks workouts oldest-first, tracks the running max e1RM per exercise,
// and emits an event whenever a workout sets a new high.
function getPRTimeline(workouts) {
  const sorted = [...(workouts || [])].sort((a, b) => (a.date || 0) - (b.date || 0));
  const timeline = {};
  const running  = {};
  for (const w of sorted) {
    const ex = w.exercise || {};
    if (ex.type === "cardio") continue;
    const name = ex.name || w.exerciseName;
    if (!name) continue;
    const e1rm = Number.isFinite(w.newE1RM) && w.newE1RM > 0
      ? w.newE1RM
      : (w.weight && w.reps ? epley1RM(w.weight, w.reps) : 0);
    if (!e1rm) continue;
    const prev = running[name] || 0;
    if (e1rm > prev) {
      running[name] = e1rm;
      (timeline[name] = timeline[name] || []).push({
        date:   w.date,
        e1rm:   Math.round(e1rm),
        weight: w.weight,
        reps:   w.reps,
        type:   ex.type,
      });
    }
  }
  return timeline;
}

// XP for a single strength set with all modifiers applied
// Bodyweight work carries a SIGNED load: positive adds a plate or vest,
// negative is machine assistance (an assisted pull-up/dip counterweight
// offsets part of your bodyweight). Floored at 10% of bodyweight — you are
// always moving your limbs, and past full assistance the number is nonsense
// rather than easier, so it must never produce zero or negative XP.
function effectiveCaliLoadLbs(bodyWeightLbs, setWeightLbs) {
  const bw = bodyWeightLbs || 0;
  return Math.max(bw * 0.1, bw + (setWeightLbs || 0));
}

function calcSetXP(exercise, reps, setWeightLbs, bodyWeightLbs, storedE1RM) {
  // Isometric holds: the logged value is SECONDS of tension, not reps. Duration
  // is the hold time itself — no rep→time conversion, and no e1RM (an Epley
  // estimate from a hold time is meaningless).
  if (exercise.iso) {
    const seconds = reps || 0;
    const table = exercise.type === "strength" ? MET_VALUES.strength : MET_VALUES.calisthenics;
    const isoMet = table[exercise.diff] || 5.5;
    const totalKg = effectiveCaliLoadLbs(bodyWeightLbs, setWeightLbs) * 0.453592;
    return Math.round(isoMet * totalKg * (seconds / 3600));
  }
  const weightKg = bodyWeightLbs * 0.453592;
  const met = MET_VALUES.strength[exercise.diff] || 5.0;
  // Pure rep-volume: ~6s per controlled strength rep, no per-set overhead.
  // Two sets of 10 now earn the same baseXP as one set of 20.
  const durationHours = (reps * 6) / 3600;
  const baseXP = met * weightKg * durationHours;

  // Calisthenics: bodyweight + any added weight (plate, vest, etc.)
  if (exercise.type === "calisthenics") {
    const caliMet = MET_VALUES.calisthenics[exercise.diff] || 5.5;
    const caliDur = (reps * 4) / 3600;
    const totalKg = effectiveCaliLoadLbs(bodyWeightLbs, setWeightLbs) * 0.453592;
    return Math.round(caliMet * totalKg * caliDur);
  }

  const newE1RM  = epley1RM(setWeightLbs, reps);
  const e1rm     = newE1RM || storedE1RM || (setWeightLbs * 1.3);
  const pct      = setWeightLbs / e1rm;
  const iMod     = intensityModifier(pct);
  const rMod     = rirModifier(setWeightLbs, reps, e1rm);
  const pBonus   = prBonus(newE1RM, storedE1RM);

  return Math.round(baseXP * iMod * rMod * pBonus);
}

// Main XP function — handles all exercise types
// For strength with per-set data (setsDetail), calculates per-set XP
function calcXP(exercise, sets, repsOrTime, weightLbs = 170, extraData = {}) {
  // Cardio: unchanged
  if (exercise.type === "cardio") {
    return calcCalories(exercise, sets, repsOrTime, weightLbs, extraData);
  }

  // Per-set data available (new logging modal)
  if (extraData.setsDetail && extraData.setsDetail.length > 0) {
    const storedE1RM = extraData.storedE1RM || null;
    return extraData.setsDetail.reduce((sum, s) => {
      return sum + calcSetXP(exercise, s.reps, s.weight, weightLbs, storedE1RM);
    }, 0);
  }

  // Fallback: old-style aggregate (sets × reps × weight)
  return calcCalories(exercise, sets, repsOrTime, weightLbs, extraData);
}

// Overall level: based on fat-burn (3,500 cal = 1 lb fat = 1 level)
// Determine overall level from cumulative XP using scaling thresholds
function getLevelFromXP(xp) {
  let remaining = xp;
  let level = 1;
  while (level <= 100) {
    const needed = XP_FOR_OVERALL_LEVEL(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  const needed = XP_FOR_OVERALL_LEVEL(level);
  return { level, current: remaining, needed };
}

// Determine muscle level from cumulative muscle XP
function getMuscleLevel(xp) {
  let remaining = xp;
  let level = 1;
  while (level <= 100) {
    const needed = XP_FOR_MUSCLE_LEVEL(level);
    if (remaining < needed) break;
    remaining -= needed;
    level++;
  }
  return level;
}

function getMuscleProgress(xp) {
  let remaining = xp;
  let level = 1;
  while (level <= 100) {
    const needed = XP_FOR_MUSCLE_LEVEL(level);
    if (remaining < needed) return { level, current: remaining, needed };
    remaining -= needed;
    level++;
  }
  return { level, current: 0, needed: XP_FOR_MUSCLE_LEVEL(level) };
}

// ── TDEE: Total Daily Energy Expenditure ─────────────────────────────────────
// Formula: Mifflin-St Jeor BMR × activity multiplier
//
// BMR (Mifflin-St Jeor, 1990 — most validated for general population):
//   Male:   BMR = (10 × kg) + (6.25 × cm) − (5 × age) + 5
//   Female: BMR = (10 × kg) + (6.25 × cm) − (5 × age) − 161
//
// Activity multipliers: based on the standard Ainsworth/ACSM framework,
// but adjusted downward ~5-10% from the classic 1.2–1.9 range.
// Reason: the classic multipliers overestimate real-world TDEE because
// (a) people overestimate workout intensity, and (b) the body partially
// compensates by reducing non-exercise movement (NEAT). This correction
// aligns with what tools like MacroFactor and NASM coaches use in practice.
//
// Sources:
//   Mifflin MD et al. "A new predictive equation for resting energy expenditure"
//   Am J Clin Nutr. 1990;51(2):241-247
//
//   Pontzer H et al. "Constrained Total Energy Expenditure"
//   Curr Biol. 2016;26(3):410-417  (explains why high multipliers overestimate)
//
//   Thomas DM et al. "A mathematical model of weight change with adaptation"
//   Am J Clin Nutr. 2010 (validates conservative multipliers for tracking)


function calcTDEE(profile) {
  const weightKg = (profile.weightLbs || 170) * 0.453592;
  const heightCm = (profile.heightIn  || 70)  * 2.54;
  const age      = profile.age || 25;
  const isFemale = profile.gender === "female";
  // Mifflin-St Jeor BMR
  const bmr = isFemale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const lvl = ACTIVITY_LEVELS.find(a => a.id === profile.activityLevel) || ACTIVITY_LEVELS[2];
  const base = Math.round(bmr * lvl.multiplier);
  const goalCfg = GOAL_CONFIG[profile.goal] || { tdeeOffset: 0 };
  return base + goalCfg.tdeeOffset;
}

// Returns maintenance (no offset) for displaying separately
function _calcMaintenance(profile) {
  const weightKg = (profile.weightLbs || 170) * 0.453592;
  const heightCm = (profile.heightIn  || 70)  * 2.54;
  const age      = profile.age || 25;
  const isFemale = profile.gender === "female";
  const bmr = isFemale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const lvl = ACTIVITY_LEVELS.find(a => a.id === profile.activityLevel) || ACTIVITY_LEVELS[2];
  return Math.round(bmr * lvl.multiplier);
}

// Returns today's food log entry for a profile (calories eaten today)
// Protein target: Morton et al. 2018 meta-analysis
// 1.6g/kg for maintenance/cutting, 2.0g/kg for hypertrophy, 2.2g/kg for bulking
function calcProteinTarget(profile) {
  const weightKg = (profile.weightLbs || 170) * 0.453592;
  const goalMap = {
    bulk: 2.2, lean_bulk: 2.0, recomp: 1.8,
    cut: 1.6, maintain: 1.6, strength: 2.0,
    endurance: 1.4, athletic: 1.8
  };
  const gPerKg = goalMap[profile.goal] || 1.8;
  return Math.round(weightKg * gPerKg);
}

// Protein XP multiplier — based on % of daily target met
// Source: Phillips & Van Loon 2011, insufficient protein impairs MPS
function calcProteinMultiplier(proteinEaten, proteinTarget) {
  if (!proteinEaten || proteinEaten <= 0) return 1.0; // not logged = no penalty
  const pct = proteinEaten / proteinTarget;
  if (pct >= 1.0)  return 1.0;
  if (pct >= 0.75) return 0.85;
  if (pct >= 0.50) return 0.70;
  return 0.55;
}

function getTodayFood(profile) {
  const todayStr = new Date().toDateString();
  return (profile.foodLog || []).find(f => new Date(f.date).toDateString() === todayStr);
}

// Net XP = workout XP - calories eaten above TDEE (surplus cancels XP)
// If eating at deficit or maintenance: full XP. Surplus: XP reduced by excess.
function calcNetXP(workoutXP, calsEaten, tdee, proteinEaten = 0, proteinTarget = 0) {
  // Step 1: calorie surplus penalty (existing)
  const surplus     = Math.max(0, calsEaten - tdee);
  const afterSurplus = Math.max(0, workoutXP - surplus);
  // Step 2: protein multiplier (new) — only applies to strength/hypertrophy XP
  const protMult    = proteinTarget > 0 ? calcProteinMultiplier(proteinEaten, proteinTarget) : 1.0;
  return Math.round(afterSurplus * protMult);
}

function getRank(level) {
  // Rank letter for display (E–S tier system)
  const rankLetter =
    level >= 30 ? "S" :
    level >= 20 ? "A" :
    level >= 12 ? "B" :
    level >= 7  ? "C" :
    level >= 4  ? "D" : "E";
  const rankColor =
    level >= 30 ? "#FFD700" :
    level >= 20 ? "#9B59B6" :
    level >= 12 ? "#4a9eff" :
    level >= 7  ? "#4ecb71" :
    level >= 4  ? "#f59e0b" : "#e05555";
  return {
    rank:  rankLetter,
    color: rankColor,
    label: getOverallMilestoneName(level),
    desc:  getOverallMilestoneDesc(level),
  };
}


function auraUnlocked(aura, level) { return (level || 1) >= aura.minLevel; }

// Highest aura the level qualifies for.
function highestAura(level) {
  let top = NAME_AURAS[0];
  for (const a of NAME_AURAS) if (auraUnlocked(a, level)) top = a;
  return top;
}

// Resolve which aura to actually render: the equipped choice if it's unlocked
// at this level, otherwise fall back to the highest unlocked (handles switching
// to a lower-level profile, or "auto").
function resolveAura(level, equippedId) {
  if (equippedId && equippedId !== "auto") {
    const chosen = NAME_AURAS.find(a => a.id === equippedId);
    if (chosen && auraUnlocked(chosen, level)) return chosen;
  }
  return highestAura(level);
}

// Renders a name with its unlocked aura. `color` seeds the glow-family auras
// (--aura); gradient auras use their own fixed palettes.
function AuraName({ name, level, equippedId, color, style, className = "" }) {
  const aura = resolveAura(level, equippedId);
  return (
    <span className={`${aura.className} ${className}`}
      style={{ "--aura": color || GOLD, ...(aura.className ? {} : { color: color || GOLD }), ...style }}>
      {name}
    </span>
  );
}

// Muscle rank — uses milestone names
function getMuscleRank(level) {
  const rankLetter =
    level >= 9 ? "S" :
    level >= 7 ? "A" :
    level >= 5 ? "B" :
    level >= 3 ? "C" :
    level >= 2 ? "D" : "E";
  const rankColor =
    level >= 9 ? "#FFD700" :
    level >= 7 ? "#9B59B6" :
    level >= 5 ? "#4a9eff" :
    level >= 3 ? "#4ecb71" :
    level >= 2 ? "#f59e0b" : "#e05555";
  return {
    rank:  rankLetter,
    color: rankColor,
    label: getMuscleMilestoneName(level),
    desc:  getMuscleMilestoneDesc(level),
  };
}

// ─── CSS — SOLO LEVELING SYSTEM UI ───────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { overscroll-behavior-y: none; }
  body { background: ${BG}; }
  /* Push content below Android/iOS status bar */
  #iron-realm-root {
    padding-top: env(safe-area-inset-top, 0px);
  }
  /* Push navbar above home gesture bar */
  .navbar-fixed {
    padding-bottom: env(safe-area-inset-bottom, 0px) !important;
  }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: ${DARK1}; }
  ::-webkit-scrollbar-thumb { background: ${ACCENT}66; border-radius: 0; }

  /* ── SOLO LEVELING KEYFRAMES ── */
  @keyframes runeFloat { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.12} 50%{transform:translateY(-12px) rotate(6deg);opacity:.28} }
  @keyframes sysGlow { 0%,100%{text-shadow:0 0 8px ${ACCENT},0 0 20px ${ACCENT}44} 50%{text-shadow:0 0 16px ${ACCENT},0 0 40px ${ACCENT}88,0 0 60px ${ACCENT}33} }
  @keyframes borderPulse { 0%,100%{border-color:${ACCENT}33;box-shadow:0 0 8px ${ACCENT}11} 50%{border-color:${ACCENT};box-shadow:0 0 20px ${ACCENT}44,inset 0 0 20px ${ACCENT}0a} }
  @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes xpFill { from{width:0} to{width:var(--w)} }
  @keyframes scanLine { 0%{top:-100%} 100%{top:200%} }
  @keyframes toastIn { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes hexPulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
  @keyframes sysBoot { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }
  @keyframes cornerBlink { 0%,90%,100%{opacity:1} 95%{opacity:.3} }

  /* ── v1.9 MOTION PACK ── */
  @keyframes auraSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ringSpinRev { from{transform:rotate(360deg)} to{transform:rotate(0deg)} }
  @keyframes shimmerSweep { 0%{left:-60%} 100%{left:130%} }
  @keyframes glitchIn {
    0%{clip-path:inset(40% 0 42% 0);transform:translateX(-8px);opacity:0}
    15%{clip-path:inset(8% 0 64% 0);transform:translateX(5px);opacity:.7}
    30%{clip-path:inset(54% 0 6% 0);transform:translateX(-4px);opacity:.85}
    45%{clip-path:inset(0 0 0 0);transform:translateX(3px);opacity:1}
    60%{clip-path:inset(22% 0 38% 0);transform:translateX(-2px)}
    75%{clip-path:inset(0 0 0 0);transform:translateX(1px)}
    100%{clip-path:inset(0 0 0 0);transform:translateX(0);opacity:1}
  }
  @keyframes cardIn { from{transform:translateY(20px) scale(.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
  @keyframes orbRise { 0%{transform:translateY(0) translateX(0);opacity:0} 12%{opacity:.8} 85%{opacity:.25} 100%{transform:translateY(-64px) translateX(var(--drift,6px));opacity:0} }
  @keyframes breatheGlow { 0%,100%{border-color:${ACCENT}33;box-shadow:inset 0 0 0 ${ACCENT}00} 50%{border-color:${ACCENT}99;box-shadow:inset 0 0 18px ${ACCENT}0c} }
  @keyframes emblemPulse { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.06);filter:brightness(1.3)} }

  .glitch-in { animation: glitchIn .7s linear both; }
  .card-in   { animation: cardIn .55s cubic-bezier(.16,1,.3,1) both; }
  .card-in-1 { animation-delay: .06s } .card-in-2 { animation-delay: .14s }
  .card-in-3 { animation-delay: .22s } .card-in-4 { animation-delay: .30s }
  .card-in-5 { animation-delay: .38s } .card-in-6 { animation-delay: .46s }
  .breathe   { animation: breatheGlow 3.2s ease-in-out infinite; }
  .card-in.breathe { animation: cardIn .55s cubic-bezier(.16,1,.3,1) both, breatheGlow 3.2s ease-in-out .8s infinite; }
  .shimmer-bar { position: relative; overflow: hidden; }
  .shimmer-bar::after {
    content:''; position:absolute; top:0; bottom:0; left:-60%; width:45%;
    background: linear-gradient(100deg, transparent, #ffffff3e, transparent);
    animation: shimmerSweep 2.6s ease-in-out 1.2s infinite;
    pointer-events: none;
  }
  .emblem-ring  { animation: auraSpin 14s linear infinite; transform-origin: center; }
  .emblem-ring2 { animation: ringSpinRev 9s linear infinite; transform-origin: center; }
  button:active { transform: scale(.96); transition: transform .08s; }

  /* ── v1.9 SCROLL + INTERACTIVE PACK ── */
  .reveal { opacity: 0; transform: translateY(28px);
    transition: opacity .65s cubic-bezier(.16,1,.3,1), transform .65s cubic-bezier(.16,1,.3,1); }
  .reveal.reveal-left  { transform: translateX(-36px); }
  .reveal.reveal-right { transform: translateX(36px); }
  .reveal.reveal-scale { transform: scale(.9); }
  .reveal.revealed { opacity: 1; transform: none; }
  @keyframes rippleBurst { from{transform:scale(0);opacity:.55} to{transform:scale(3);opacity:0} }
  .ripple-fx { position:absolute; border-radius:50%; pointer-events:none; z-index:5;
    background: radial-gradient(circle, ${ACCENT}aa 0%, ${ACCENT}22 55%, transparent 72%);
    animation: rippleBurst .55s ease-out forwards; }
  .tilt-wrap { transition: transform .3s cubic-bezier(.16,1,.3,1); will-change: transform;
    transform-style: preserve-3d; }
  @keyframes checkPop { 0%{transform:scale(0) rotate(-30deg)} 60%{transform:scale(1.35) rotate(8deg)} 100%{transform:scale(1) rotate(0)} }
  .check-pop { animation: checkPop .35s cubic-bezier(.16,1,.3,1) both; }
  @keyframes streakFlame { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
  .streak-flame { display:inline-block; animation: streakFlame 1.6s ease-in-out infinite; }

  /* ── v1.9 CHARACTER HOLOGRAM ── */
  @keyframes drawPath { from{stroke-dashoffset:1} to{stroke-dashoffset:0} }
  .body-draw { stroke-dasharray: 1;
    animation: drawPath 1.5s cubic-bezier(.4,0,.2,1) backwards;
    animation-delay: calc(var(--i, 0) * 28ms); }
  @keyframes musclesIn { from{opacity:0} to{opacity:1} }
  .muscle-in { animation: musclesIn .7s ease-out backwards;
    animation-delay: calc(.7s + var(--i, 0) * 55ms); }
  @keyframes musclePulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .muscle-highlight { animation: musclePulse 1.1s ease-in-out infinite; }
  @keyframes bodyBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.013)} }
  .body-breathe { animation: bodyBreathe 4.5s ease-in-out 2.2s infinite; transform-origin: 50% 28%; }
  @keyframes scanSweep { 0%{top:-14%} 60%{top:104%} 100%{top:104%} }
  .body-scan { position:absolute; left:6%; right:6%; height:42px; pointer-events:none;
    background: linear-gradient(180deg, transparent, ${ACCENT}14 35%, ${ACCENT}48 50%, ${ACCENT}14 65%, transparent);
    mix-blend-mode: screen;
    animation: scanSweep 4.6s cubic-bezier(.45,0,.55,1) 1.8s infinite; }
  .holo-corner { position:absolute; width:18px; height:18px; pointer-events:none;
    border-color: ${ACCENT}88; border-style: solid; border-width: 0; }

  /* ── v1.9 CEREMONY + TRANSITIONS ── */
  @keyframes shockwave { from{transform:scale(.2);opacity:.9} to{transform:scale(4.5);opacity:0} }
  @keyframes burst { from{transform:translate(0,0) scale(1);opacity:1} to{transform:translate(var(--tx),var(--ty)) scale(.15);opacity:0} }
  @keyframes slamIn { 0%{transform:scale(3.2);opacity:0;filter:blur(10px)} 60%{transform:scale(.92);opacity:1;filter:blur(0)} 100%{transform:scale(1)} }
  @keyframes relicGlowPulse { 0%,100%{box-shadow:0 0 12px var(--relic)55} 50%{box-shadow:0 0 26px var(--relic), 0 0 46px var(--relic)44} }
  @keyframes screenWipe { from{opacity:0} to{opacity:1} }
  /* fill must be 'backwards', not 'both': a retained transform animation turns
     this wrapper into a containing block, which re-anchors every position:fixed
     modal inside it to the wrapper instead of the viewport — shifting modals up
     by the screen's scroll offset (the relic-vault scrolling bug). */
  .screen-wipe { animation: screenWipe .28s cubic-bezier(.16,1,.3,1) backwards; }

  /* ── v1.9.1 NEXT WAVE ── */
  @keyframes barRise { from{transform:scaleY(0)} to{transform:scaleY(1)} }
  @keyframes lineDraw { to{stroke-dashoffset:0} }
  @keyframes dotIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
  .nav-tab { position:relative; }
  .nav-tab::after {
    content:''; position:absolute; bottom:6px; left:50%; transform:translateX(-50%) scale(0);
    width:34px; height:3px; border-radius:2px;
    background: linear-gradient(90deg, ${ACCENT}, ${GOLD});
    box-shadow: 0 0 10px ${ACCENT}, 0 0 18px ${ACCENT}66;
    transition: transform .35s cubic-bezier(.16,1,.3,1), opacity .25s;
    opacity: 0;
  }
  .nav-tab.is-active::after { transform: translateX(-50%) scale(1); opacity: 1; }
  .nav-tab.is-active { animation: emblemPulse 2.5s ease-in-out infinite; }
  .magnet-btn { position: relative; will-change: transform; transition: transform .35s cubic-bezier(.16,1,.3,1); }
  .magnet-glow { position: absolute; inset: -2px; pointer-events: none; border-radius: inherit;
    opacity: 0; transition: opacity .25s;
    background: radial-gradient(circle at var(--mgx, 50%) var(--mgy, 50%),
      ${ACCENT}44 0%, ${ACCENT}11 28%, transparent 60%); }
  .magnet-btn:hover .magnet-glow, .magnet-btn:focus-visible .magnet-glow { opacity: 1; }
  @keyframes auroraDrift { 0%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-6%, 4%) rotate(2deg)} 100%{transform:translate(0,0) rotate(0deg)} }
  .aurora-bg { position: fixed; inset: -20%; z-index: -2; pointer-events: none; opacity: .55;
    background:
      radial-gradient(ellipse at 22% 32%, ${ACCENT}33 0%, transparent 48%),
      radial-gradient(ellipse at 78% 22%, #b455ff2a 0%, transparent 50%),
      radial-gradient(ellipse at 62% 78%, ${GOLD}22 0%, transparent 50%);
    filter: blur(20px); animation: auroraDrift 22s ease-in-out infinite; }

  /* ── v1.9.2 POLISH ── */
  /* Holographic gradient title — chromatic shift through cyan/violet/gold */
  @keyframes holoText { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .holo-text {
    background: linear-gradient(90deg, ${ACCENT}, #b455ff, ${GOLD}, #b455ff, ${ACCENT});
    background-size: 300% 100%;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: holoText 9s linear infinite;
    filter: drop-shadow(0 0 8px ${ACCENT}55);
  }
  /* Section divider — thin line with a glowing pulse that travels across */
  @keyframes dividerPulse { 0%{left:-10%} 100%{left:110%} }
  .holo-divider { position: relative; height: 1px; margin: 12px 0;
    background: linear-gradient(90deg, transparent, ${ACCENT}66 20%, ${ACCENT}88 50%, ${ACCENT}66 80%, transparent);
    overflow: hidden; }
  .holo-divider::after { content:''; position: absolute; top: -3px; height: 7px; width: 22%;
    background: radial-gradient(ellipse at center, ${ACCENT}cc, transparent 70%);
    animation: dividerPulse 5s linear infinite; filter: blur(2px); }
  /* Flowing-light XP bar — a moving sheen layered over the fill */
  @keyframes xpFlow { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  .xp-flow { position: relative; overflow: hidden; }
  .xp-flow::before {
    content:''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(90deg, transparent 20%, #ffffff66 50%, transparent 80%);
    animation: xpFlow 3s ease-in-out infinite;
    mix-blend-mode: screen;
  }
  /* Tap sparkle: small particles burst from press point */
  @keyframes sparkOut { from{transform:translate(0,0) scale(1);opacity:1} to{transform:translate(var(--sx),var(--sy)) scale(.2);opacity:0} }
  .spark-fx { position: absolute; width: 4px; height: 4px; border-radius: 50%;
    pointer-events: none; z-index: 6; animation: sparkOut .5s cubic-bezier(.2,.7,.3,1) forwards; }

  /* ── NAME AURAS (level-gated unlocks) ── */
  @keyframes auraGlowPulse { 0%,100%{text-shadow:0 0 6px var(--aura,${GOLD})88} 50%{text-shadow:0 0 12px var(--aura,${GOLD}),0 0 22px var(--aura,${GOLD})66} }
  @keyframes auraBreathe { 0%,100%{text-shadow:0 0 8px var(--aura,${GOLD}),0 0 16px var(--aura,${GOLD})44;transform:scale(1)} 50%{text-shadow:0 0 16px var(--aura,${GOLD}),0 0 34px var(--aura,${GOLD})88;transform:scale(1.03)} }
  @keyframes auraShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes auraChroma { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes auraPrism { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }

  .aura-glow { animation: auraGlowPulse 2.4s ease-in-out infinite; }
  .aura-pulse { display:inline-block; animation: auraBreathe 2.2s ease-in-out infinite; transform-origin:left center; }
  .aura-shimmer {
    background: linear-gradient(100deg, var(--aura,${GOLD}) 0%, var(--aura,${GOLD}) 38%, #ffffff 50%, var(--aura,${GOLD}) 62%, var(--aura,${GOLD}) 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: auraShimmer 3.2s linear infinite;
    filter: drop-shadow(0 0 6px var(--aura,${GOLD})66);
  }
  .aura-chroma {
    background: linear-gradient(90deg, ${ACCENT}, #a855f7, ${ACCENT});
    background-size: 200% 100%;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: auraChroma 4s ease-in-out infinite;
    filter: drop-shadow(0 0 7px ${ACCENT}55);
  }
  .aura-prismatic {
    background: linear-gradient(90deg, #ff4d4d, #ffb24d, #ffed4d, #4dff88, ${ACCENT}, #a855f7, #ff4dd8, #ff4d4d);
    background-size: 300% 100%;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: auraPrism 4.5s linear infinite;
    filter: drop-shadow(0 0 8px ${ACCENT}66);
  }

  /* ── BASE CLASSES ── */
  .slide-up { animation: slideUp .3s cubic-bezier(0.16,1,0.3,1) both; }
  .fade-in  { animation: fadeIn .4s ease-out both; }
  .sys-glow { animation: sysGlow 2.5s ease-in-out infinite; }

  /* ── SYSTEM WINDOW ── */
  .sys-window {
    background: linear-gradient(160deg, ${BG2}f8, ${DARK1}f0);
    border: 1px solid ${ACCENT}44;
    border-top: 1px solid ${ACCENT}99;
    position: relative;
    clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px));
  }
  .sys-window::before {
    content:''; position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(180deg, ${ACCENT}08 0%, transparent 40%);
  }
  .sys-window::after {
    content:''; position:absolute; top:0; left:0; right:0; height:1px;
    background: linear-gradient(90deg, transparent, ${ACCENT}cc, transparent);
  }

  /* ── ANGULAR CARD (clipped corners) ── */
  .card {
    background: ${BG2};
    border: 1px solid ${ACCENT}33;
    border-left: 2px solid ${ACCENT}88;
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
    transition: all .2s;
    position: relative;
  }
  .card:hover {
    border-color: ${ACCENT}88;
    border-left-color: ${ACCENT};
    box-shadow: 0 0 20px ${ACCENT}22, inset 0 0 20px ${ACCENT}05;
  }

  /* ── BUTTONS ── */
  .btn-primary {
    background: linear-gradient(90deg, ${ACCENT2}cc, ${ACCENT}33);
    color: ${ACCENT}; border: 1px solid ${ACCENT}88;
    border-top: 1px solid ${ACCENT}cc;
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
    font-family: 'Orbitron', sans-serif; font-weight: 700;
    letter-spacing: 3px; cursor: pointer; transition: all .15s;
    text-shadow: 0 0 10px ${ACCENT};
  }
  .btn-primary:hover {
    background: linear-gradient(90deg, ${ACCENT}44, ${ACCENT}66);
    box-shadow: 0 0 24px ${ACCENT}55, inset 0 0 12px ${ACCENT}22;
    color: #fff;
  }
  .btn-gold {
    background: linear-gradient(90deg, #3a2800cc, ${GOLD}55);
    color: ${GOLD2}; border: 1px solid ${GOLD}88;
    border-top: 1px solid ${GOLD}dd;
    clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
    font-family: 'Orbitron', sans-serif; font-weight: 700;
    letter-spacing: 3px; cursor: pointer; transition: all .15s;
    text-shadow: 0 0 10px ${GOLD};
  }
  .btn-gold:hover {
    background: linear-gradient(90deg, ${GOLD}33, ${GOLD}66);
    box-shadow: 0 0 24px ${GOLD}55;
    color: #fff;
  }

  /* ── INPUTS ── */
  .input-field {
    background: ${DARK1}; border: 1px solid ${ACCENT}44;
    border-bottom: 1px solid ${ACCENT}88;
    border-radius: 0;
    color: ${ACCENT}; font-family: 'Orbitron', sans-serif; font-size: 14px;
    padding: 10px 14px; width: 100%; outline: none; transition: all .2s;
    caret-color: ${ACCENT};
  }
  .input-field::placeholder { color: ${MUTED}; font-family: 'Rajdhani', sans-serif; }
  .input-field:focus {
    border-color: ${ACCENT}99;
    box-shadow: 0 0 12px ${ACCENT}33, inset 0 0 12px ${ACCENT}08;
    color: #fff; font-size: 16px;
  }

  /* ── SELECT ── */
  select.input-field { -webkit-appearance: none; }

  /* ── NAV ── */
  .tab-btn { background: none; border: none; cursor: pointer; transition: all .2s; }

  /* ── SCAN LINE OVERLAY (cosmetic, on system windows) ── */
  .scanlines::before {
    content:''; position:absolute; inset:0; pointer-events:none; z-index:1;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, ${ACCENT}04 2px, ${ACCENT}04 4px);
  }

  /* ── XP BAR ── */
  .xp-bar-bg {
    background: ${DARK1};
    border: 1px solid ${ACCENT}33;
    border-radius: 0;
    height: 6px; overflow: hidden; position: relative;
  }
  .xp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, ${ACCENT}88, ${ACCENT}, ${CYAN2});
    box-shadow: 0 0 8px ${ACCENT}, 0 0 20px ${ACCENT}44;
    transition: width .8s cubic-bezier(0.16,1,0.3,1);
  }
`;


function SvgFigure({ svgKey, levels, subLevels, showCardio, highlight }) {
  // Use sub-muscle level if available (SVG IDs like "short-head-bicep")
  // otherwise fall back to parent group level
  const getLevel = (svgId) => {
    if (subLevels && subLevels[svgId] !== undefined) return subLevels[svgId];
    const parent = _ID_TO_MUSCLE[svgId];
    return (levels && parent && levels[parent]) || 1;
  };
  const getRankColor = (lvl) => {
    if (lvl < 2)  return "#e8eef8";   // untrained  — ice white
    if (lvl < 6)  return "#4a7090";   // E-rank     — dark slate
    if (lvl < 13) return "#00a8cc";   // D-rank     — dim cyan
    if (lvl < 21) return "#00d4ff";   // C-rank     — full cyan (accent)
    if (lvl < 31) return "#4466ff";   // B-rank     — electric blue
    if (lvl < 51) return "#9944ff";   // A-rank     — violet
    return "#e8c44a";                  // S-rank+    — gold
  };
  const getColor = (svgId) => {
    if (highlight === svgId) return ACCENT;
    return getRankColor(getLevel(svgId));
  };
  const getGlow = (svgId) => {
    if (highlight === svgId)
      return `drop-shadow(0 0 10px ${ACCENT}) drop-shadow(0 0 20px ${ACCENT}88)`;
    const lvl = getLevel(svgId);
    if (lvl < 8) return null;
    const t = Math.min(1, (lvl - 8) / 30);
    return `drop-shadow(0 0 ${(3 + t * 7).toFixed(1)}px ${getRankColor(lvl)})`;
  };
  const LINE = "#2a4a6a";
  const muscleGroups = _MUSCLE_PATHS[svgKey] || {};
  const bodyPaths    = _BODY_PATHS[svgKey]   || [];
  return (
    <svg viewBox="0 0 676.49 1203.49" fill="none" className="body-breathe"
      style={{ width: "100%", maxHeight: 380 }}>
      {Object.entries(muscleGroups).map(([gid, paths], gi) => {
        const color  = getColor(gid);
        const glow   = getGlow(gid);
        return (
          <g key={gid} id={gid}
            className={highlight === gid ? "muscle-in muscle-highlight" : "muscle-in"}
            style={{ "--i": gi, ...(glow ? { filter: glow } : null) }}>
            {paths.map((p, i) => p.type === "line"
              ? <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                  stroke={p.fill === "none" ? LINE : color}
                  strokeWidth={p.sw} fill="none"
                  strokeLinecap="round" strokeLinejoin="round"/>
              : <path key={i} d={p.d}
                  fill={p.fill === "none" ? "none" : color}
                  stroke={p.fill === "none" ? LINE : "none"}
                  strokeWidth={p.fill === "none" ? p.sw : undefined}
                  strokeLinecap={p.fill === "none" ? "round" : undefined}
                  strokeLinejoin={p.fill === "none" ? "round" : undefined}/>
            )}
          </g>
        );
      })}
      <g id="body-outline" fill="none" stroke={LINE}
        strokeLinecap="round" strokeLinejoin="round">
        {bodyPaths.map((p, i) => p.type === "line"
          ? <line key={i} className="body-draw" pathLength="1" style={{ "--i": i }}
              x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} strokeWidth={p.sw}/>
          : <path key={i} className="body-draw" pathLength="1" style={{ "--i": i }}
              d={p.d} strokeWidth={p.sw}/>
        )}
      </g>
      {showCardio && (levels.cardio||1) > 5 && (
        <ellipse cx="338" cy="600" rx="315" ry="555" fill="none"
          stroke={MUSCLE_META.cardio.color} strokeWidth="2" strokeDasharray="10 6"
          opacity={Math.min(0.4, (levels.cardio - 5) / 30)}
          style={{ animation: "runeFloat 3s ease-in-out infinite" }}/>
      )}
    </svg>
  );
}

function BodyFigure({ levels, subLevels, gender, highlight }) {
  const isFemale = gender === "female";
  return (
    <div style={{ position: "relative", padding: "26px 10px 18px", overflow: "hidden",
      background: `radial-gradient(ellipse at 50% 40%, ${ACCENT}08 0%, transparent 70%)` }}>
      {/* Holographic corner brackets */}
      <div className="holo-corner" style={{ top: 6, left: 6, borderTopWidth: 1.5, borderLeftWidth: 1.5 }} />
      <div className="holo-corner" style={{ top: 6, right: 6, borderTopWidth: 1.5, borderRightWidth: 1.5 }} />
      <div className="holo-corner" style={{ bottom: 6, left: 6, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }} />
      <div className="holo-corner" style={{ bottom: 6, right: 6, borderBottomWidth: 1.5, borderRightWidth: 1.5 }} />
      <div style={{ position: "absolute", top: 10, left: 0, right: 0, textAlign: "center",
        fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: ACCENT, letterSpacing: 5,
        opacity: 0.7, animation: "cornerBlink 4s linear infinite" }}>{"// BODY MATRIX"}</div>
      <div style={{ display: "flex", gap: 2, width: "100%", justifyContent: "center" }}>
        <SvgFigure svgKey={isFemale ? "femaleFront" : "maleFront"} levels={levels} subLevels={subLevels} showCardio highlight={highlight} />
        <SvgFigure svgKey={isFemale ? "femaleBack"  : "maleBack"}  levels={levels} subLevels={subLevels} highlight={highlight} />
      </div>
      {/* System scan sweep */}
      <div className="body-scan" />
    </div>
  );
}

/* ── v1.9 INTERACTIVE MOTION ── */
// Scroll-reveal: fades/slides children in the first time they enter the viewport
function Reveal({ children, dir = "up", delay = 0, style, className = "", ...rest }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); obs.disconnect(); }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const dirClass = dir === "left" ? "reveal-left" : dir === "right" ? "reveal-right" : dir === "scale" ? "reveal-scale" : "";
  return (
    <div ref={ref} className={`reveal ${dirClass} ${seen ? "revealed" : ""} ${className}`}
      style={{ ...style, transitionDelay: seen ? `${delay}ms` : "0ms" }} {...rest}>
      {children}
    </div>
  );
}

// Pointer-tracking 3D tilt with a light glare that follows the finger/cursor
function TiltCard({ children, max = 7, style }) {
  const ref = useRef(null);
  const move = e => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${(px * max).toFixed(2)}deg) rotateX(${(-py * max).toFixed(2)}deg) scale(1.012)`;
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const reset = () => { const el = ref.current; if (el) el.style.transform = ""; };
  return (
    <div ref={ref} className="tilt-wrap" style={style}
      onPointerMove={move} onPointerLeave={reset} onPointerUp={reset} onPointerCancel={reset}>
      {children}
    </div>
  );
}

// Animated number: eases from previous value to the new one
function CountUp({ value, decimals = 0, duration = 900, locale = false }) {
  const [disp, setDisp] = useState(value);
  const prevRef = useRef(null);
  useEffect(() => {
    const from = prevRef.current === null ? 0 : prevRef.current;
    prevRef.current = value;
    if (from === value) { setDisp(value); return; }
    const t0 = performance.now();
    let raf;
    const tick = now => {
      const p = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(from + (value - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{locale ? Math.round(disp).toLocaleString() : disp.toFixed(decimals)}</>;
}




// Magnetic button: tracks pointer for subtle translate + a follow-glow.
// Wraps any node; falls back to a plain div on touch (no pull on tap).
function MagneticButton({ children, strength = 6, style, onClick, className = "", ...rest }) {
  const ref = useRef(null);
  const move = e => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translate(${(px * strength).toFixed(2)}px, ${(py * strength).toFixed(2)}px)`;
    el.style.setProperty("--mgx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--mgy", `${((py + 0.5) * 100).toFixed(1)}%`);
  };
  const reset = () => { const el = ref.current; if (el) el.style.transform = ""; };
  return (
    <button ref={ref} onClick={onClick} className={`magnet-btn ${className}`} style={style}
      onPointerMove={move} onPointerLeave={reset} onPointerUp={reset} {...rest}>
      <span className="magnet-glow" />
      {children}
    </button>
  );
}

// Full-screen level-up ceremony: vignette, triple shockwave, particle burst,
// the new level slamming in. Tap anywhere (or wait) to dismiss.
function LevelUpCeremony({ level, settings, onDone }) {
  const rank = getRank(level);
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);
  const parts = useMemo(() => Array.from({ length: 26 }, () => ({
    tx: (Math.random() - 0.5) * 360, ty: (Math.random() - 0.5) * 360,
    d: 0.5 + Math.random() * 0.9, delay: Math.random() * 0.25, gold: Math.random() < 0.4,
  })), []);
  return (
    createPortal(<div onClick={onDone} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 3000, display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", cursor: "pointer",
      background: "radial-gradient(circle at 50% 45%, rgba(3,6,15,.55), rgba(3,6,15,.96))",
      animation: "fadeIn .25s ease-out both" }}>
      {[0, 0.18, 0.36].map((d, i) => (
        <div key={i} style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%",
          border: `2px solid ${rank.color}`, animation: `shockwave 1.1s cubic-bezier(.2,.7,.3,1) ${d}s both` }} />
      ))}
      {parts.map((p, i) => (
        <span key={i} style={{ position: "absolute", width: 5, height: 5, borderRadius: "50%",
          background: p.gold ? GOLD : rank.color, boxShadow: `0 0 8px ${p.gold ? GOLD : rank.color}`,
          "--tx": `${p.tx}px`, "--ty": `${p.ty}px`,
          animation: `burst ${p.d}s cubic-bezier(.16,1,.3,1) ${0.15 + p.delay}s both` }} />
      ))}
      <div className="glitch-in" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: 7,
        color: ACCENT, textShadow: `0 0 12px ${ACCENT}`, marginBottom: 10, textAlign: "center", padding: "0 20px" }}>
        {themeLabel(settings, "levelUp", "LEVEL UP!")}
      </div>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 84, fontWeight: 900, lineHeight: 1,
        color: rank.color, textShadow: `0 0 30px ${rank.color}, 0 0 80px ${rank.color}66`,
        animation: "slamIn .55s cubic-bezier(.16,1,.3,1) .12s both" }}>{level}</div>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, letterSpacing: 4, color: rank.color,
        opacity: 0.85, marginTop: 12, animation: "fadeIn .4s ease-out .5s both" }}>
        {rank.rank}-RANK · {rank.label.toUpperCase()}
      </div>
      <div style={{ position: "absolute", bottom: 48, fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
        color: MUTED, letterSpacing: 3, animation: "fadeIn .4s ease-out 1.2s both" }}>TAP TO CONTINUE</div>
    </div>, document.body)
  );
}

function XPBar({ current, needed, color = ACCENT, height = 6 }) {
  const pct = Math.min(100, (current / needed) * 100);
  return (
    <div style={{
      background: DARK1, border: `1px solid ${color}33`,
      borderRadius: 0, height: height + 2, overflow: "hidden", position: "relative"
    }}>
      <div className="xp-flow" style={{
        width: `${pct}%`, height: "100%",
        background: `linear-gradient(90deg, ${color}66, ${color}, ${color}cc)`,
        boxShadow: `0 0 8px ${color}, 0 0 16px ${color}44`,
        transition: "width .8s cubic-bezier(0.16,1,0.3,1)",
        position: "relative"
      }}>
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 3,
          background: "#fff", opacity: 0.8, boxShadow: `0 0 6px #fff`
        }}/>
      </div>
    </div>
  );
}


function StatTree({ tree, getGroupXP, getSuperXP, subStats, subLevels, selectedMuscle, onSelectMuscle, condition = {}, lastTrained = {} }) {
  const [openSuper, setOpenSuper] = useState({});
  const [openGroup, setOpenGroup] = useState({});

  const toggleSuper = (key) => setOpenSuper(s => ({ ...s, [key]: !s[key] }));
  const toggleGroup = (key) => setOpenGroup(s => ({ ...s, [key]: !s[key] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {tree.map(superNode => {
        const superXP  = getSuperXP(superNode);
        const superLvl = getMuscleLevel(superXP);
        const { current: sCur, needed: sNeed } = getMuscleProgress(superXP);
        const superRank = getRank(superLvl);
        const isOpenS = openSuper[superNode.key];

        return (
          <div key={superNode.key}>
            {/* ── Layer 1: Super-group row ── */}
            <div onClick={() => toggleSuper(superNode.key)} style={{
              background: `linear-gradient(90deg, ${superNode.color}14, ${DARK1})`,
              border: `1px solid ${isOpenS ? superNode.color + "88" : superNode.color + "44"}`,
              borderLeft: `3px solid ${superNode.color}`,
              padding: "11px 14px",
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)",
              cursor: "pointer", transition: "border-color .2s",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              {/* Hexagon glyph */}
              <div style={{
                width: 34, height: 34, flexShrink: 0,
                background: `linear-gradient(135deg, ${superNode.color}33, ${superNode.color}11)`,
                border: `1px solid ${superNode.color}66`,
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                  fontWeight: 900, color: superNode.color }}>{superNode.glyph}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700,
                    color: superNode.color, letterSpacing: 2, textShadow: `0 0 8px ${superNode.color}` }}>
                    {superNode.label.toUpperCase()}
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10,
                      color: superRank.color, fontWeight: 900 }}>{superRank.rank}</span>
                    <span style={{ color: superNode.color, fontSize: 10, opacity: 0.7,
                      transform: isOpenS ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform .2s", display: "inline-block" }}>▼</span>
                  </div>
                </div>
                <XPBar current={sCur} needed={sNeed} color={superNode.color} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 1 }}>
                    LVL {superLvl}
                  </span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>
                    {sCur.toLocaleString()} / {sNeed.toLocaleString()} XP
                  </span>
                </div>
              </div>
            </div>

            {/* ── Layer 2: Muscle groups (expanded from super-group) ── */}
            {isOpenS && (
              <div style={{
                borderLeft: `3px solid ${superNode.color}33`,
                marginLeft: 6,
                paddingLeft: 6,
                display: "flex", flexDirection: "column", gap: 4,
                paddingTop: 4, paddingBottom: 4,
              }}>
                {superNode.groups.map(group => {
                  const meta     = MUSCLE_META[group.key] || { name: group.key, color: superNode.color };
                  const groupXP  = getGroupXP(group.key, group.subs);
                  const groupLvl = getMuscleLevel(groupXP);
                  const { current: gCur, needed: gNeed } = getMuscleProgress(groupXP);
                  const groupRank = getMuscleRank(groupLvl);
                  const isOpenG  = openGroup[group.key];
                  const hasSubs  = group.subs.length > 0;

                  return (
                    <div key={group.key}>
                      {/* Layer 2 row */}
                      <div onClick={() => hasSubs && toggleGroup(group.key)} style={{
                        background: `linear-gradient(90deg, ${meta.color}0a, ${DARK1})`,
                        border: `1px solid ${isOpenG ? meta.color + "66" : meta.color + "28"}`,
                        borderLeft: `2px solid ${meta.color}`,
                        padding: "9px 12px",
                        cursor: hasSubs ? "pointer" : "default",
                        transition: "border-color .2s",
                        display: "flex", alignItems: "center", gap: 8,
                      }}>
                        <MuscleIcon muscle={group.key} size={22} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
                              color: meta.color, letterSpacing: 1.5,
                              textShadow: `0 0 6px ${meta.color}` }}>
                              {meta.name.toUpperCase()}
                            </span>
                            {(() => {
                              // Decay is otherwise invisible: the level bands are wide enough
                              // that months of rest never move the number. Show the condition
                              // loss and idle time directly on the muscle.
                              const cond = condition[group.key];
                              if (cond == null || cond >= 0.995) return null;
                              const lost = Math.round((1 - cond) * 100);
                              const days = lastTrained[group.key]
                                ? Math.floor((Date.now() - lastTrained[group.key]) / 86400000) : null;
                              return (
                                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8,
                                  color: RED, background: `${RED}14`, border: `1px solid ${RED}33`,
                                  borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap", flexShrink: 0 }}>
                                  ▼{lost}%{days != null ? ` · ${days}d` : ""}
                                </span>
                              );
                            })()}
                            </span>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <div style={{ textAlign: "right" }}>
                            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                              color: groupRank.color, fontWeight: 700 }}>{groupRank.rank}</span>
                            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8,
                              color: groupRank.color, opacity: 0.8 }}>{groupRank.label}</div>
                          </div>
                              {hasSubs && (
                                <span style={{ color: meta.color, fontSize: 9, opacity: 0.6,
                                  transform: isOpenG ? "rotate(180deg)" : "rotate(0deg)",
                                  transition: "transform .2s", display: "inline-block" }}>▼</span>
                              )}
                            </div>
                          </div>
                          <XPBar current={gCur} needed={gNeed} color={meta.color} height={3} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                              color: MUTED, letterSpacing: 1 }}>LVL {groupLvl}</span>
                            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED }}>
                              {gCur.toLocaleString()} / {gNeed.toLocaleString()} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── Layer 3: Sub-muscles ── */}
                      {isOpenG && hasSubs && (
                        <div style={{
                          background: `${meta.color}05`,
                          border: `1px solid ${meta.color}22`,
                          borderTop: "none",
                          borderLeft: `2px solid ${meta.color}33`,
                          padding: "10px 12px 12px 14px",
                          display: "flex", flexDirection: "column", gap: 9,
                        }}>
                          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8,
                            color: meta.color, letterSpacing: 3, opacity: 0.6, marginBottom: 2 }}>
                            {"// SUB-MUSCLE BREAKDOWN"}
                          </div>
                          {group.subs.map(svgId => {
                            const sm = MUSCLE_META[svgId];
                            if (!sm) return null;
                            const smXP  = subStats[svgId] || 0;
                            const smLvl = getMuscleLevel(smXP);
                            const { current: smCur, needed: smNeed } = getMuscleProgress(smXP);
                            const smRank = getRank(smLvl);
                            const isSelected = selectedMuscle === svgId;
                            return (
                              <div key={svgId} onClick={() => onSelectMuscle && onSelectMuscle(svgId)}
                                style={{ cursor: "pointer", padding: "4px 6px", margin: "-4px -6px",
                                  borderRadius: 6, background: isSelected ? `${sm.color}18` : "transparent",
                                  border: `1px solid ${isSelected ? sm.color+"66" : "transparent"}`,
                                  transition: "all .15s" }}>
                                <div style={{ display: "flex", justifyContent: "space-between",
                                  alignItems: "center", marginBottom: 3 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: "50%",
                                      background: sm.color, boxShadow: `0 0 4px ${sm.color}`,
                                      flexShrink: 0 }} />
                                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
                                      fontWeight: 700, color: isSelected ? sm.color : smXP > 0 ? TEXT : MUTED }}>
                                      {sm.name}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                    {smXP > 0 && (
                                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 7,
                                        color: smRank.color, fontWeight: 700 }}>{smRank.rank}</span>
                                    )}
                                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                                      color: smXP > 0 ? sm.color : MUTED, letterSpacing: 1 }}>
                                      LVL {smLvl}
                                    </span>
                                  </div>
                                </div>
                                <XPBar current={smCur} needed={smNeed} color={sm.color} height={3} />
                                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8,
                                  color: MUTED, marginTop: 2, textAlign: "right" }}>
                                  {smXP > 0
                                    ? `${smCur.toLocaleString()} / ${smNeed.toLocaleString()} XP`
                                    : "No data — log exercises targeting this muscle"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}






function generateWorkout(muscle, workouts, customExercises, overallLevel, goal, diffFilter = null, travelEquipment = null) {
  let allDB = [...(EXERCISE_DB[muscle] || []), ...(customExercises||[]).filter(e=>e.primary===muscle)];
  if (!allDB.length) return [];
  // Travel mode: hard-filter to exercises doable with the equipment on hand.
  // A muscle with zero matches returns an empty plan — surfacing exercises
  // the user can't perform is worse than skipping the muscle.
  if (Array.isArray(travelEquipment)) {
    allDB = allDB.filter(e => isTravelFriendly(e, travelEquipment));
    if (!allDB.length) return [];
  }
  // Apply difficulty filter — fall back to next difficulty up if slot would be empty
  if (diffFilter && diffFilter !== "all") {
    // const ORDER unused
    const filtered = allDB.filter(e => e.diff === diffFilter);
    // Only apply filter if it would leave enough exercises; otherwise keep all
    allDB = filtered.length >= 2 ? filtered : allDB;
  }

  const now = Date.now();
  const HR = 3600000; // ms per hour

  // Build a map of: exerciseName -> most recent date performed
  // Source: NSCA guidelines — 48–72hr recovery window for hypertrophy
  // Colquhoun et al. (2018): muscle protein synthesis peaks 24–48hr post-training
  const lastPerformed = {};
  (workouts||[]).filter(w => w.muscle === muscle || w.exercise?.primary === muscle)
    .forEach(w => {
      const name = w.exerciseName || w.exercise?.name;
      if (!name) return;
      if (!lastPerformed[name] || w.date > lastPerformed[name])
        lastPerformed[name] = w.date || 0;
    });

  // Recovery penalty based on hours since last performed
  // < 48hr  → -65 (muscle still in active protein synthesis / repair phase)
  // 48–72hr → -25 (approaching recovered but not fully adapted)
  // > 72hr  → 0   (fully recovered — no penalty)
  // This replaces the arbitrary "last 3 sessions" UX heuristic
  const recoveryPenalty = (exName) => {
    const last = lastPerformed[exName];
    if (!last) return 0;
    const hrsSince = (now - last) / HR;
    if (hrsSince < 48)  return -65;
    if (hrsSince < 72)  return -25;
    return 0;
  };

  const goalCfg = GOAL_CONFIG[goal] || { compoundBias:1.0, isoBias:1.0, calistBias:1.0, cardioBias:1.0 };

  const score = (ex) => {
    let s = 100;

    // Recovery-based penalty (science: NSCA, Schoenfeld 2010)
    s += recoveryPenalty(ex.name);

    // Difficulty matching — penalise mismatch between user level and exercise tier
    const diffMap = { beginner:1, intermediate:2, advanced:3, elite:4 };
    const userTier = Math.min(4, Math.ceil((overallLevel||1) / 10));
    const exTier = diffMap[ex.diff] || 2;
    s -= Math.abs(userTier - exTier) * 10;

    // Goal-based bias (compound vs isolation weighting)
    // Source: Kraemer & Ratamess (2004) — exercise selection should match training goal
    const svgCount = ex.svgTargets ? ex.svgTargets.length : 1;
    const isCompound = svgCount >= 3;
    const isCali  = ex.type === "calisthenics";
    const isCardio = ex.type === "cardio";
    if (isCali)          s *= goalCfg.calistBias;
    else if (isCardio)   s *= goalCfg.cardioBias;
    else if (isCompound) s *= goalCfg.compoundBias;
    else                 s *= goalCfg.isoBias;

    // Small random variance to prevent identical results on regenerate
    s += Math.random() * 20;
    return s;
  };

  const rules = SELECTION_RULES[muscle];
  const angleGroups = ANGLE_GROUPS[muscle] || {};
  const selected = [];
  const usedNames = new Set();

  if (rules) {
    for (const [angle, count] of rules.slots) {
      const builtInNames = angleGroups[angle] || [];
      const builtIn = builtInNames.map(name => allDB.find(e => e.name === name)).filter(e => e && !usedNames.has(e.name));
      const customs = allDB.filter(e => e.custom && e.angleGroup === angle && !usedNames.has(e.name));
      const candidates = [...builtIn, ...customs].sort((a,b) => score(b) - score(a));
      candidates.slice(0, count).forEach(e => { selected.push(e); usedNames.add(e.name); });
    }
    const remaining = rules.total - selected.length;
    if (remaining > 0) {
      allDB.filter(e => !usedNames.has(e.name)).sort((a,b) => score(b)-score(a)).slice(0, remaining)
        .forEach(e => { selected.push(e); usedNames.add(e.name); });
    }
  } else {
    allDB.sort((a,b) => score(b)-score(a)).slice(0,4).forEach(e => selected.push(e));
  }

  selected.sort((a,b) => (b.svgTargets?.length||1) - (a.svgTargets?.length||1));
  return selected;
}




// ─── QUICK ADD BAR ────────────────────────────────────────────────────────────
function QuickAddBar({ onAdd, isIso = false, repUnit = "reps", bodyweight = false }) {
  const [qCount, setQCount] = useState("2");
  const [qReps, setQReps] = useState("");
  const [qWeight, setQWeight] = useState("");
  // Bodyweight movements (calisthenics / isometric holds) legitimately carry no
  // added load, so 0 must count as valid there.
  const valid = parseInt(qCount) > 0 && parseFloat(qReps) > 0 &&
    (bodyweight ? (qWeight === "" || parseFloat(qWeight) >= 0) : parseFloat(qWeight) > 0);
  const handleAdd = () => {
    if (!valid) return;
    onAdd(parseInt(qCount), parseFloat(qReps), parseFloat(qWeight));
    setQReps("");
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 6 }}>QUICK ADD SETS</div>
      <div style={{ display: "grid", gridTemplateColumns: "52px 64px 1fr 52px", gap: 6, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <input className="input-field" type="number" value={qCount} onChange={e => setQCount(e.target.value)}
            placeholder="2" style={{ textAlign: "center", color: TEXT, padding: "9px 4px", fontWeight: 700 }} />
          <div style={{ position: "absolute", bottom: -12, left: 0, right: 0, fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, textAlign: "center" }}>sets</div>
        </div>
        <div style={{ position: "relative" }}>
          <input className="input-field" type="number" value={qReps} onChange={e => setQReps(e.target.value)}
            placeholder={isIso ? "30" : "10"} style={{ textAlign: "center", color: ACCENT, padding: "9px 4px" }} />
          <div style={{ position: "absolute", bottom: -12, left: 0, right: 0, fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, textAlign: "center" }}>{repUnit}</div>
        </div>
        <div style={{ position: "relative" }}>
          <input className="input-field" type="number" value={qWeight} onChange={e => setQWeight(e.target.value)}
            placeholder={bodyweight ? "0" : "135"} style={{ textAlign: "center", color: GOLD, padding: "9px 6px" }} />
          <div style={{ position: "absolute", bottom: -12, left: 0, right: 0, fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, textAlign: "center" }}>{wtLabel()}</div>
        </div>
        <button onClick={handleAdd} style={{
          background: valid ? `${ACCENT}22` : BG3, border: `1px solid ${valid ? ACCENT + "88" : ACCENT2 + "33"}`,
          borderRadius: 6, padding: "9px 6px", cursor: valid ? "pointer" : "not-allowed",
          fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
          color: valid ? ACCENT : MUTED, letterSpacing: 1, transition: "all .15s"
        }}>ADD</button>
      </div>
      {valid && (
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 14 }}>
          → {qCount}× {qReps} {repUnit}{parseFloat(qWeight) > 0 ? ` @ ${wtVal(qWeight)} ${wtLabel()}` : ""}
        </div>
      )}
    </div>
  );
}


// ─── EXERCISE LOG MODAL ───────────────────────────────────────────────────────
function ExerciseLogModal({ exercise, muscle, weightLbs, profile, onConfirm, onClose, editingEntry = null }) {
  const isCardio = exercise.type === "cardio";
  const isCali   = exercise.type === "calisthenics";
  const isIso    = !!exercise.iso;          // hold-for-time, logged in seconds
  const isSpeed  = isCardio && exercise.cardioMode === "speed";
  const isSpm    = isCardio && exercise.cardioMode === "spm";   // stepping machines
  const repUnit  = isIso ? "sec" : "reps";

  const defaultSet = { reps: "", weight: "", rpe: null };
  // Editing must START from what was logged — otherwise confirming an edit
  // replaces the original entry with whatever blank rows happened to be shown,
  // silently destroying the sets being edited.
  const [setRows, setSetRows] = useState(() => {
    const prior = editingEntry?.sets_detail;
    if (Array.isArray(prior) && prior.length > 0) {
      return prior.map(s => ({
        reps: s.reps == null ? "" : String(s.reps),
        weight: s.weight == null ? "" : String(s.weight),
        rpe: s.rpe == null ? null : s.rpe,
      }));
    }
    return [{ ...defaultSet }, { ...defaultSet }, { ...defaultSet }];
  });
  const updateSet = (i, field, val) => setSetRows(s => s.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addSet    = () => setSetRows(s => [...s, { ...defaultSet }]);
  const repeatLastSet = () => setSetRows(s => {
    // Walk backward to find the last row with both reps and weight set
    for (let i = s.length - 1; i >= 0; i--) {
      const r = s[i];
      if (parseFloat(r.reps) > 0 && (parseFloat(r.weight) > 0 || isCali)) {
        return [...s, { reps: r.reps, weight: r.weight, rpe: null }];
      }
    }
    return [...s, { ...defaultSet }];
  });
  const removeSet = (i) => setSetRows(s => s.filter((_, idx) => idx !== i));

  const [cardioMinutes, setCardioMinutes] = useState(
    editingEntry?.cardioData?.minutes != null ? String(editingEntry.cardioData.minutes)
      : (editingEntry && editingEntry.reps != null && exercise.type === "cardio" ? String(editingEntry.reps) : ""));
  const [speedMph, setSpeedMph] = useState(String(
    editingEntry?.cardioData?.speedMph ?? exercise.defaultSpeed ?? 3.5));
  const [stepsPerMin, setStepsPerMin] = useState(String(
    editingEntry?.cardioData?.stepsPerMin ?? exercise.defaultSpm ?? 60));

  const lastSession = (() => {
    if (!profile?.workouts) return null;
    const past = profile.workouts
      .filter(w => (w.exerciseName || w.exercise?.name) === exercise.name && w.sets_detail)
      .sort((a, b) => (b.date || 0) - (a.date || 0));
    return past[0] || null;
  })();

  const storedE1RM = profile?.prs?.[exercise.name] || null;

  const parsedMins  = parseFloat(cardioMinutes) || 0;
  const parsedSpeed = parseFloat(speedMph) || exercise.defaultSpeed || 3.5;
  const parsedSpm   = parseFloat(stepsPerMin) || exercise.defaultSpm || 60;
  const validSets   = setRows.filter(r => parseFloat(r.reps) > 0);

  const totalXP = isCardio
    ? (parsedMins > 0 ? calcXP(exercise, 1, parsedMins, weightLbs,
        isSpeed ? { speedMph: parsedSpeed } : isSpm ? { stepsPerMin: parsedSpm } : {}) : 0)
    : validSets.reduce((sum, r) => {
        const reps = parseFloat(r.reps) || 0;
        const w    = parseFloat(r.weight) || 0;
        if (reps <= 0) return sum;
        return sum + calcSetXP(exercise, reps, w, weightLbs, storedE1RM);
      }, 0);

  const sessionBestE1RM = isCali || isCardio || isIso ? null : validSets.reduce((best, r) => {
    const reps = parseFloat(r.reps) || 0;
    const w    = parseFloat(r.weight) || 0;
    if (reps < 1 || reps > 12 || w <= 0) return best;
    const e = epley1RM(w, reps);
    return e > best ? e : best;
  }, 0) || null;

  const isPR = sessionBestE1RM && storedE1RM && sessionBestE1RM > storedE1RM;
  const isFirstLog = sessionBestE1RM && !storedE1RM;

  const canLog = isCardio ? parsedMins > 0 : validSets.length > 0;

  const _todayFood = profile ? getTodayFood(profile) : null;
  const _calsEaten = _todayFood ? _todayFood.calories : 0;
  const _tdee      = profile ? calcTDEE(profile) : 2000;
  const _proteinEaten  = _todayFood ? (_todayFood.protein || 0) : 0;
  const _proteinTarget = profile ? calcProteinTarget(profile) : 160;
  const netXP      = calcNetXP(totalXP, _calsEaten, _tdee, _proteinEaten, _proteinTarget);
  const meta       = MUSCLE_META[muscle] || MUSCLE_META.chest;
  const diffColor  = { beginner: GREEN, intermediate: ACCENT, advanced: GOLD, elite: RED }[exercise.diff];

  const lastBest = lastSession?.sets_detail
    ? lastSession.sets_detail.reduce((best, s) => {
        const vol = (parseFloat(s.weight)||0) * (parseFloat(s.reps)||0);
        return vol > (best ? (parseFloat(best.weight)||0)*(parseFloat(best.reps)||0) : 0) ? s : best;
      }, null)
    : null;

  return (
    createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1100, background: "rgba(7,11,20,0.92)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center",
      paddingBottom: "96px" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`,
        border: `1px solid ${meta.color}66`, borderTop: `2px solid ${meta.color}`,
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
        width: "100%", maxWidth: 480,
        boxShadow: `0 -8px 40px ${meta.color}22`, position: "relative",
        maxHeight: "90vh", display: "flex", flexDirection: "column"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "24px 20px 8px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: exercise.angle ? 2 : 4 }}>{exercise.name}</div>
            {exercise.angle && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
                background: `${GOLD}15`, border: `1px solid ${GOLD}44`,
                borderRadius: 6, padding: "3px 10px", marginBottom: 8 }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                  color: GOLD, letterSpacing: 2 }}>ANGLE</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
                  fontWeight: 700, color: GOLD }}>{exercise.angle}</span>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: meta.color, background: `${meta.color}22`, padding: "2px 8px", borderRadius: 8 }}>{meta.name}</span>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: diffColor, background: `${diffColor}22`, padding: "2px 8px", borderRadius: 8 }}>{exercise.diff}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Last session comparison */}
        {lastSession && (
          <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}22`, borderRadius: 6, padding: "10px 12px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: ACCENT, letterSpacing: 3 }}>
                {"// LAST SESSION · "}{new Date(lastSession.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
              </div>
              {storedE1RM && (
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: GOLD, letterSpacing: 1 }}>EST. 1RM: {wtVal(storedE1RM).toFixed(0)} {wtLabel()}</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {lastSession.sets_detail.map((s, i) => (
                <div key={i} style={{ background: BG3, border: `1px solid ${ACCENT}22`, borderRadius: 5, padding: "4px 10px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: TEXT, fontWeight: 700 }}>{s.reps}<span style={{ color: MUTED, fontSize: 7 }}> {repUnit}</span></div>
                  {parseFloat(s.weight) > 0 && !isCali && (
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT }}>{wtVal(s.weight)} {wtLabel()}</div>
                  )}
                </div>
              ))}
            </div>
            {lastBest && !isCali && (
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, marginTop: 5 }}>
                BEST SET — {lastBest.reps} {repUnit}{isIso && !(lastBest.weight > 0) ? "" : ` @ ${wtVal(lastBest.weight)} ${wtLabel()}`}
              </div>
            )}
          </div>
        )}

        {/* Inputs */}
        {isCardio ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: (isSpeed || isSpm) ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>TIME (MIN)</div>
                <input className="input-field" type="number" value={cardioMinutes}
                  onChange={e => setCardioMinutes(e.target.value)} placeholder="30"
                  style={{ color: ACCENT, fontWeight: 700, fontSize: 16, textAlign: "center" }} />
              </div>
              {isSpm && (
                <div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>STEPS / MIN</div>
                  <input className="input-field" type="number" value={stepsPerMin}
                    onChange={e => setStepsPerMin(e.target.value)} placeholder={String(exercise.defaultSpm || 60)}
                    style={{ color: RED, fontWeight: 700, fontSize: 16, textAlign: "center" }} />
                </div>
              )}
              {isSpeed && (
                <div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>SPEED (MPH)</div>
                  <input className="input-field" type="number" step="0.1" value={speedMph}
                    onChange={e => setSpeedMph(e.target.value)} placeholder={String(exercise.defaultSpeed || 3.5)}
                    style={{ color: RED, fontWeight: 700, fontSize: 16, textAlign: "center" }} />
                </div>
              )}
            </div>
            {isSpeed && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>QUICK SELECT</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[{label:"2.0",sub:"slow walk"},{label:"3.0",sub:"walk"},{label:"3.5",sub:"brisk"},{label:"4.0",sub:"fast walk"},{label:"5.0",sub:"jog"},{label:"6.0",sub:"run"},{label:"7.5",sub:"fast run"},{label:"9.0",sub:"sprint"}].map(s => (
                    <button key={s.label} onClick={() => setSpeedMph(s.label)} style={{
                      background: speedMph === s.label ? `${RED}22` : BG3,
                      border: `1px solid ${speedMph === s.label ? RED : ACCENT2 + "33"}`,
                      borderRadius: 6, padding: "6px 10px", cursor: "pointer", textAlign: "center", flex: "0 0 auto"
                    }}>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: speedMph === s.label ? RED : TEXT }}>{s.label}</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>{s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isSpm && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>QUICK SELECT</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[{label:"40",sub:"easy"},{label:"50",sub:"steady"},{label:"60",sub:"moderate"},{label:"75",sub:"brisk"},{label:"90",sub:"hard"},{label:"110",sub:"very hard"},{label:"130",sub:"max"}].map(s => (
                    <button key={s.label} onClick={() => setStepsPerMin(s.label)} style={{
                      background: stepsPerMin === s.label ? `${RED}22` : BG3,
                      border: `1px solid ${stepsPerMin === s.label ? RED : ACCENT2 + "33"}`,
                      borderRadius: 6, padding: "6px 10px", cursor: "pointer", textAlign: "center", flex: "0 0 auto"
                    }}>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: stepsPerMin === s.label ? RED : TEXT }}>{s.label}</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>{s.sub}</div>
                    </button>
                  ))}
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 6 }}>
                  Machine only shows a level? level × 8 is a close estimate.
                </div>
              </div>
            )}
            {parsedMins > 0 && (
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, padding: "7px 10px", background: `${ACCENT}08`, border: `1px solid ${ACCENT}22`, borderRadius: 4 }}>
                {isSpeed ? `MET(${parsedSpeed} mph) × ${(weightLbs * 0.453592).toFixed(0)} kg × ${(parsedMins / 60).toFixed(2)} h`
                 : isSpm ? `MET ${metFromStepRate(parsedSpm).toFixed(1)} (${parsedSpm} steps/min) × ${(weightLbs * 0.453592).toFixed(0)} kg × ${(parsedMins / 60).toFixed(2)} h`
                 : `MET ${exercise.met} × ${(weightLbs * 0.453592).toFixed(0)} kg × ${(parsedMins / 60).toFixed(2)} h`}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            {(!isCali || isIso) && <QuickAddBar isIso={isIso} repUnit={repUnit} bodyweight={isCali || isIso} onAdd={(count, reps, weight) => {
              const newRows = Array.from({ length: count }, () => ({ reps: String(reps), weight: String(weight) }));
              setSetRows(s => [...s, ...newRows]);
            }} />}
            {setRows.length > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "28px 80px 1fr 24px", gap: 6, marginBottom: 4, marginTop: 16 }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1, textAlign: "center" }}>#</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1 }}>{isIso ? "HOLD (SEC)" : "REPS"}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1 }}>{isCali ? `ADDED / −ASSIST (${wtLabel().toUpperCase()})` : `WEIGHT (${wtLabel().toUpperCase()})`}</div>
                  <div />
                </div>
                {setRows.map((row, i) => {
                  const lastRow = lastSession?.sets_detail?.[i];
                  const prReps   = lastRow && parseFloat(row.reps)   > parseFloat(lastRow.reps);
                  const prWeight = lastRow && parseFloat(row.weight) > parseFloat(lastRow.weight);
                  const repsN   = parseFloat(row.reps);
                  const weightN = parseFloat(row.weight);
                  const showE1RM = !isCali && !isCardio
                    && repsN >= 1 && repsN <= 12 && weightN > 0;
                  const setE1RM = showE1RM ? epley1RM(weightN, repsN) : 0;
                  const beatsPR = showE1RM && storedE1RM && setE1RM > storedE1RM;
                  const closePR = showE1RM && storedE1RM && !beatsPR
                    && setE1RM >= storedE1RM * 0.95;
                  const e1rmColor = beatsPR ? GOLD : closePR ? GOLD2 : MUTED;
                  const rowFilled = repsN > 0 && (weightN > 0 || isCali);
                  const rpeMeta = row.rpe ? RPE_META[row.rpe] || RPE_META[Math.min(10, Math.max(6, row.rpe))] : null;
                  return (
                    <div key={i} style={{ marginBottom: 5 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "28px 80px 1fr 24px", gap: 6, alignItems: "center" }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700, color: repsN > 0 ? meta.color : MUTED, textAlign: "center" }}>{i + 1}</div>
                        <input className="input-field" type="number" value={row.reps}
                          onChange={e => updateSet(i, "reps", e.target.value)}
                          placeholder={lastRow ? lastRow.reps + " last" : (isIso ? "30" : "10")}
                          style={{ textAlign: "center", color: ACCENT, padding: "7px 6px", borderColor: prReps ? GREEN + "88" : undefined }} />
                        <input className="input-field" type="number" value={row.weight}
                          onChange={e => updateSet(i, "weight", e.target.value)}
                          placeholder={isCali ? "0 · −40 assist" : (lastRow ? lastRow.weight + " last" : "135")}
                          style={{ textAlign: "center", color: GOLD, padding: "7px 6px", borderColor: prWeight ? GREEN + "88" : undefined }} />
                        <button onClick={() => removeSet(i)} style={{ background: "none", border: "none", color: MUTED, fontSize: 15, cursor: "pointer", lineHeight: 1 }}>×</button>
                      </div>
                      {isCali && parseFloat(row.weight) !== 0 && !isNaN(parseFloat(row.weight)) && (
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                          color: parseFloat(row.weight) < 0 ? ACCENT : GOLD,
                          paddingLeft: 38, marginTop: 2, letterSpacing: 0.5 }}>
                          {parseFloat(row.weight) < 0
                            ? `assisted — lifting ${Math.round(wtVal(effectiveCaliLoadLbs(weightLbs, parseFloat(row.weight))))} ${wtLabel()} of your ${Math.round(wtVal(weightLbs))}`
                            : `weighted — lifting ${Math.round(wtVal(weightLbs + parseFloat(row.weight)))} ${wtLabel()} total`}
                        </div>
                      )}
                      {showE1RM && (
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: e1rmColor,
                          paddingLeft: 38, marginTop: 2, letterSpacing: 0.5,
                          textShadow: beatsPR ? `0 0 6px ${GOLD}88` : "none" }}>
                          → est. 1RM {Math.round(wtVal(setE1RM))} {wtLabel()}
                          {storedE1RM && (
                            <span style={{ color: MUTED, marginLeft: 6, fontSize: 9 }}>
                              (PR {Math.round(wtVal(storedE1RM))})
                            </span>
                          )}
                          {beatsPR && <span style={{ color: GOLD, marginLeft: 6, fontWeight: 700 }}>★ NEW</span>}
                        </div>
                      )}
                      {/* RPE picker — appears once reps + weight are filled, only for strength */}
                      {rowFilled && !isCardio && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, paddingLeft: 38, marginTop: 4, marginBottom: 2 }}>
                          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 2, marginRight: 2 }}>RPE</span>
                          {[6,7,8,9,10].map(v => {
                            const m = RPE_META[v];
                            const active = row.rpe === v;
                            return (
                              <button key={v} onClick={() => updateSet(i, "rpe", active ? null : v)} style={{
                                width: 26, height: 22, padding: 0,
                                background: active ? `${m.color}33` : "transparent",
                                border: `1px solid ${active ? m.color : MUTED + "33"}`,
                                borderRadius: 4, cursor: "pointer",
                                fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
                                color: active ? m.color : MUTED,
                              }}>{v}</button>
                            );
                          })}
                          {rpeMeta && (
                            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: rpeMeta.color, marginLeft: 4 }}>
                              {rpeMeta.label}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
            {(() => {
              const hasFilled = setRows.some(r => parseFloat(r.reps) > 0 && (parseFloat(r.weight) > 0 || isCali));
              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
                  {isCali && (
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED,
                    marginTop: 2, marginBottom: 6, lineHeight: 1.4 }}>
                    Leave blank for pure bodyweight · enter a plate/vest as +25 · enter machine
                    assistance as a negative, e.g. −60 for a 60 {wtLabel()} counterweight.
                  </div>
                )}
                <button onClick={addSet} style={{
                    background: `${ACCENT}06`, border: `1px dashed ${ACCENT}28`,
                    borderRadius: 6, padding: "7px", cursor: "pointer",
                    fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2
                  }}>+ BLANK SET</button>
                  <button onClick={repeatLastSet} disabled={!hasFilled} style={{
                    background: hasFilled ? `${GOLD}0a` : "transparent",
                    border: `1px dashed ${hasFilled ? GOLD + "44" : MUTED + "22"}`,
                    borderRadius: 6, padding: "7px",
                    cursor: hasFilled ? "pointer" : "not-allowed",
                    fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                    color: hasFilled ? GOLD : MUTED, letterSpacing: 2,
                    opacity: hasFilled ? 1 : 0.5,
                  }}>+ REPEAT LAST</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* XP Preview */}
        {totalXP > 0 && (
          <div style={{ background: `${GOLD}0d`, border: `1px solid ${isPR || isFirstLog ? GOLD : GOLD + "33"}`,
            clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
            padding: "14px 16px", marginBottom: 16, boxShadow: isPR ? `0 0 20px ${GOLD}44` : "none" }}>
            {(isPR || isFirstLog) && (
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 8, textShadow: `0 0 8px ${GOLD}` }}>
                {isFirstLog ? "FIRST LOG — 1RM ESTABLISHED" : `NEW PR! ${wtVal(storedE1RM).toFixed(0)} → ${wtVal(sessionBestE1RM).toFixed(0)} ${wtLabel()} EST. 1RM`}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 3, marginBottom: 4 }}>
                  {isPR ? "BOOSTED XP (PR BONUS)" : "HYPERTROPHY XP"}
                </div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 26, fontWeight: 900, color: GOLD, textShadow: `0 0 12px ${GOLD}` }}>+{totalXP}</div>
              </div>
              {netXP < totalXP && (
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 3, marginBottom: 4 }}>NET XP (AFTER FOOD)</div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 26, fontWeight: 900, color: RED, textShadow: `0 0 12px ${RED}` }}>+{netXP}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 2 }}>{validSets.length} sets logged</div>
                </div>
              )}
            </div>
            {netXP < totalXP && (
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: RED, marginTop: 6, letterSpacing: 1 }}>
                -{totalXP - netXP} XP absorbed by today's calorie surplus
              </div>
            )}
            {netXP === totalXP && (
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GREEN, marginTop: 6, letterSpacing: 1 }}>
                Full XP active — eating at deficit or maintenance
              </div>
            )}
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 7, color: MUTED, marginTop: 8, letterSpacing: 2 }}>
              {FIRST_OVERALL_THRESHOLD.toLocaleString()} XP = LVL 2 · {FIRST_MUSCLE_THRESHOLD.toLocaleString()} XP = MUSCLE LVL 2
            </div>
          </div>
        )}

        {/* RPE-based next-session suggestion */}
        {(() => {
          const rpeRows = setRows.filter(r => r.rpe && parseFloat(r.weight) > 0);
          if (rpeRows.length === 0 || isCali || isCardio) return null;
          const lastRow = rpeRows[rpeRows.length - 1];
          const wt = parseFloat(lastRow.weight);
          const sugg = rpeWeightSuggestion(lastRow.rpe, wt);
          if (!sugg) return null;
          const nextWeight = wt + sugg.delta;
          const arrow = sugg.delta > 0 ? "↑" : sugg.delta < 0 ? "↓" : "→";
          const color = sugg.delta > 0 ? GREEN : sugg.delta < 0 ? RED : ACCENT;
          return (
            <div style={{ margin: "0 20px 12px", padding: "10px 12px",
              background: `${color}0e`, border: `1px solid ${color}44`, borderRadius: 8 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color, letterSpacing: 3, marginBottom: 4 }}>
                {"// NEXT SESSION SUGGESTION"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT }}>
                  {sugg.reason}
                </div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color }}>
                  {arrow} {Math.round(wtVal(nextWeight))} {wtLabel()}
                  {sugg.delta !== 0 && (
                    <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>
                      ({sugg.delta > 0 ? "+" : ""}{Math.round(wtVal(sugg.delta))})
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        </div>{/* end scrollable content */}
        <div style={{ padding: "8px 20px 16px", borderTop: `1px solid ${meta.color}22` }}>
        <button className="btn-gold" onClick={() => {
          if (!canLog) return;
          if (isCardio) {
            onConfirm({ sets: 1, reps: parsedMins, weight: weightLbs, xp: totalXP, cals: totalXP,
              cardioData: { minutes: parsedMins, speedMph: isSpeed ? parsedSpeed : null,
                stepsPerMin: isSpm ? parsedSpm : null,
                met: isSpm ? metFromStepRate(parsedSpm) : exercise.met } });
          } else {
            const setsDetail = validSets.map(r => ({
              reps: parseFloat(r.reps) || 0,
              // Always store in lbs internally; convert from kg if needed
              weight: wtValBack(parseFloat(r.weight) || 0),
              ...(r.rpe ? { rpe: r.rpe } : {}),
            }));
            const avgWeight = setsDetail.reduce((s, r) => s + r.weight, 0) / setsDetail.length;
            const avgReps   = setsDetail.reduce((s, r) => s + r.reps, 0) / setsDetail.length;
            onConfirm({ sets: setsDetail.length, reps: Math.round(avgReps), weight: Math.round(avgWeight),
              sets_detail: setsDetail, newE1RM: sessionBestE1RM, isPR, xp: totalXP, cals: totalXP });
          }
        }} style={{ width: "100%", padding: "15px", fontSize: 15, letterSpacing: 3,
          opacity: canLog ? 1 : 0.4, cursor: canLog ? "pointer" : "not-allowed" }}>
          LOG {isCardio ? "CARDIO" : `${validSets.length} SET${validSets.length !== 1 ? "S" : ""}`}
        </button>
        </div>{/* end sticky footer */}
      </div>
    </div>, document.body)
  );
}


// ─── SCREEN: FREE WORKOUT ─────────────────────────────────────────────────────
function WorkoutFinishModal({ sessionLog, sessionStart, onClose, onComplete }) {
  if (!sessionLog || sessionLog.length === 0) return null;
  const totalXP   = sessionLog.reduce((s, l) => s + (l.xp || 0), 0);
  const totalSets = sessionLog.reduce((s, l) => s + (l.sets || 1), 0);
  const muscles   = [...new Set(sessionLog.map(l => l.muscle).filter(Boolean))];
  const prs       = sessionLog.filter(l => l.isPR);
  const durationMin = sessionStart ? Math.max(1, Math.round((Date.now() - sessionStart) / 60000)) : null;

  return (
    createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150, background: "rgba(3,6,15,0.96)", backdropFilter: "blur(14px)", display: "flex", alignItems: "safe center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${BG}fa)`,
        border: `1px solid ${GOLD}55`, borderTop: `3px solid ${GOLD}`,
        width: "100%", maxWidth: 460, padding: "28px 22px 28px",
        maxHeight: "90vh", overflowY: "auto", borderRadius: 12,
        boxShadow: `0 0 48px ${GOLD}33`,
      }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, letterSpacing: 6, marginBottom: 4 }}>SESSION COMPLETE</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 42, fontWeight: 900, color: GOLD, letterSpacing: 2,
            textShadow: `0 0 24px ${GOLD}66`, lineHeight: 1 }}>+{totalXP.toLocaleString()}</div>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: TEXT, letterSpacing: 2, marginTop: 2 }}>TOTAL XP</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 20 }}>
          <div style={{ background: BG3, border: `1px solid ${ACCENT}22`, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: ACCENT }}>{sessionLog.length}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 2, letterSpacing: 1 }}>EXERCISES</div>
          </div>
          <div style={{ background: BG3, border: `1px solid ${ACCENT}22`, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: ACCENT }}>{totalSets}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 2, letterSpacing: 1 }}>SETS</div>
          </div>
          <div style={{ background: BG3, border: `1px solid ${ACCENT}22`, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: ACCENT }}>{durationMin != null ? `${durationMin}m` : "—"}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 2, letterSpacing: 1 }}>DURATION</div>
          </div>
        </div>

        {prs.length > 0 && (
          <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}55`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 8 }}>★ NEW PERSONAL RECORDS</div>
            {prs.map((l, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0",
                borderBottom: i < prs.length - 1 ? `1px solid ${GOLD}22` : "none" }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT, fontWeight: 600 }}>{l.name}</span>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: GOLD, fontWeight: 700 }}>
                  {l.prevE1RM ? `${Math.round(wtVal(l.prevE1RM))} → ` : ""}{Math.round(wtVal(l.newE1RM || 0))} {wtLabel()}
                </span>
              </div>
            ))}
          </div>
        )}

        {muscles.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 8 }}>MUSCLES TRAINED</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {muscles.map(m => {
                const mm = MUSCLE_META[m] || { color: ACCENT, name: m };
                return (
                  <span key={m} style={{
                    background: `${mm.color}1a`, border: `1px solid ${mm.color}55`, borderRadius: 6,
                    padding: "5px 10px", fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                    color: mm.color, fontWeight: 700, letterSpacing: 1,
                  }}>{mm.name.toUpperCase()}</span>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 8 }}>EXERCISES LOGGED</div>
          {sessionLog.map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0",
              borderBottom: `1px solid ${ACCENT}11` }}>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT, display: "flex", alignItems: "center", gap: 6 }}>
                {l.isPR && <span style={{ color: GOLD, fontWeight: 700 }}>★</span>}
                {l.name}
                <span style={{ color: MUTED, fontSize: 10 }}>· {l.sets || 1} sets</span>
              </span>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: GOLD, fontWeight: 700 }}>+{l.xp || 0}</span>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button onClick={onClose} style={{
            padding: "12px", cursor: "pointer",
            background: BG3, border: `1px solid ${ACCENT}44`, borderRadius: 8,
            fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: ACCENT, fontWeight: 700, letterSpacing: 2,
          }}>KEEP TRAINING</button>
          <button onClick={onComplete} className="btn-gold" style={{ padding: "12px", fontSize: 11, letterSpacing: 2 }}>
            COMPLETE ✓
          </button>
        </div>
      </div>
    </div>, document.body)
  );
}

function FreeWorkoutScreen({ st, onLogExercise, onUnlogExercise, settings, toast }) {
  const MUSCLE_CATEGORIES = ["chest","back","legs","shoulders","bicep","tricep","forearms","core","glutes","calves","cardio"];
  const [selMuscle, setSelMuscle] = useState("chest");
  const [browseSearch, setBrowseSearch] = useState("");
  const [logModal, setLogModal] = useState(null);
  const [sessionLog, setSessionLog] = useState([]);
  const [sessionStart, setSessionStart] = useState(null);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [selDay, setSelDay] = useState(0); // 0=today
  const [currentSupersetGroup, setCurrentSupersetGroup] = useState(null);
  const travelMode = settings?.travelMode === true;
  const allBrowseExercises = [
    ...(EXERCISE_DB[selMuscle] || []),
    ...(st.customExercises||[]).filter(e => e.primary === selMuscle)
  ]
    .filter(e => !travelMode || isTravelFriendly(e, settings?.travelEquipment))
    .slice().sort((a, b) => a.name.localeCompare(b.name));
  const exercises = browseSearch.trim()
    ? allBrowseExercises.filter(e => e.name.toLowerCase().includes(browseSearch.toLowerCase()))
    : allBrowseExercises;
  const meta = MUSCLE_META[selMuscle] || MUSCLE_META.chest;

  // Build this week's workout log grouped by day
  const startOfWeek = (() => {
    const d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    return d.getTime();
  })();
  const DAY_LABELS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const todayDayIdx = (new Date().getDay() + 6) % 7;

  const weekWorkouts = (st.workouts || []).filter(w => (w.date || 0) >= startOfWeek);
  const byDay = DAY_LABELS.map((_, di) => {
    const dayStart = startOfWeek + di * 86400000;
    const dayEnd   = dayStart + 86400000;
    return weekWorkouts.filter(w => (w.date||0) >= dayStart && (w.date||0) < dayEnd);
  });

  const [tab, setTab] = useState("log"); // "log" | "browse"

  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: "transparent", padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${BG2}f8, ${DARK1}ee)`,
        borderBottom: `1px solid ${ACCENT}33`, padding: "18px 20px 0" }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700,
          color: GOLD, letterSpacing: 2, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
          {themeLabel(settings,"workout","WORKOUT")}
          {travelMode && <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, background: `${GOLD}22`, border: `1px solid ${GOLD}66`, borderRadius: 5, padding: "2px 8px", letterSpacing: 1 }}>✈ TRAVEL</span>}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {[["log","WEEKLY LOG"],["browse", "LOG EXERCISE"]].map(([t, lbl]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: "none", border: "none", borderBottom: `2px solid ${tab===t ? ACCENT : "transparent"}`,
              padding: "8px 18px 10px", cursor: "pointer",
              fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
              color: tab===t ? ACCENT : MUTED, letterSpacing: 2, transition: "all .15s"
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* ── WEEKLY LOG TAB ── */}
      {tab === "log" && (
        <div style={{ padding: "14px 16px" }}>
          {/* Day selector */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
            {DAY_LABELS.map((d, i) => {
              const isToday = i === todayDayIdx;
              const count   = byDay[i].length;
              const active  = selDay === i;
              return (
                <button key={d} onClick={() => setSelDay(i)}
              ref={active ? (el) => { if (el && !el._centered) { el._centered = 1; el.scrollIntoView({ inline: "center", block: "nearest" }); } } : null}
              style={{
                  flexShrink: 0, background: active ? `${ACCENT}22` : BG2,
                  border: `1px solid ${active ? ACCENT : isToday ? GOLD+"44" : ACCENT2+"33"}`,
                  borderRadius: 8, padding: "7px 12px", cursor: "pointer",
                  fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
                  color: active ? ACCENT : isToday ? GOLD : MUTED, letterSpacing: 1,
                  textAlign: "center"
                }}>
                  <div>{d}</div>
                  {count > 0 && (
                    <div style={{ fontSize: 8, color: active ? ACCENT : GOLD, marginTop: 2 }}>{count}</div>
                  )}
                  {isToday && !active && (
                    <div style={{ fontSize: 7, color: GOLD, marginTop: 1 }}>TODAY</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day's workouts */}
          {byDay[selDay].length === 0 ? (
            <div style={{ background: BG2, borderRadius: 10, padding: "24px 16px",
              textAlign: "center", border: `1px solid ${ACCENT}22` }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: MUTED }}>
                No workouts logged for {DAY_LABELS[selDay]}
              </div>
              <button onClick={() => setTab("browse")} style={{
                marginTop: 12, background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`,
                borderRadius: 8, padding: "8px 20px", cursor: "pointer",
                fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 2
              }}>LOG AN EXERCISE</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {byDay[selDay].map((w, i) => {
                const muscleMeta = MUSCLE_META[w.muscle] || MUSCLE_META[w.exercise?.primary] || MUSCLE_META.chest;
                const dayList = byDay[selDay];
                const inGroup = !!w.supersetGroup;
                const groupAbove = inGroup && dayList[i - 1]?.supersetGroup === w.supersetGroup;
                return (
                  <div key={i} style={{
                    background: BG2, border: `1px solid ${muscleMeta.color}33`,
                    borderLeft: `3px solid ${inGroup ? GOLD : muscleMeta.color}`,
                    borderRadius: 10, padding: "12px 14px",
                    marginTop: groupAbove ? -4 : 0,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14,
                          fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 6 }}>
                          {inGroup && <span style={{ fontSize: 10, color: GOLD, opacity: 0.8 }}>↔</span>}
                          {w.exerciseName}
                        </div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: muscleMeta.color }}>
                          {muscleMeta.name}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11,
                          fontWeight: 700, color: GOLD }}>+{w.xp}</span>
                        <button onClick={() => {
                          onUnlogExercise(w);
                          setEditModal({ exercise: w.exercise, muscle: w.muscle });
                        }} style={{
                          background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`,
                          borderRadius: 5, padding: "4px 9px", cursor: "pointer",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: ACCENT, letterSpacing: 1
                        }}>EDIT</button>
                        <button onClick={() => {
                          onUnlogExercise(w);
                          toast(`${w.exerciseName} removed`, MUTED);
                        }} style={{
                          background: `${RED}11`, border: `1px solid ${RED}33`,
                          borderRadius: 5, padding: "4px 9px", cursor: "pointer",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: RED, letterSpacing: 1
                        }}>DEL</button>
                      </div>
                    </div>
                    {w.sets_detail && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {w.sets_detail.map((s, si) => (
                          <span key={si} style={{
                            fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                            color: MUTED, background: BG3,
                            padding: "2px 8px", borderRadius: 4
                          }}>{s.reps}×{wtVal(s.weight)}{wtLabel()}</span>
                        ))}
                      </div>
                    )}
                    {!w.sets_detail && w.sets && (
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                        {w.sets} sets × {w.reps} reps{w.weight ? ` @ ${wtVal(w.weight)}${wtLabel()}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Day total */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12,
                  fontWeight: 700, color: GOLD }}>
                  +{byDay[selDay].reduce((s,w)=>s+(w.xp||0),0)} XP
                </span>
              </div>
            </div>
          )}

          {/* Today's session quick-log at bottom */}
          {selDay === todayDayIdx && sessionLog.length > 0 && (
            <div style={{ marginTop: 16, background: `${GOLD}0a`,
              border: `1px solid ${GOLD}33`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                  color: GOLD, letterSpacing: 3 }}>{"// THIS SESSION"}</div>
                <button onClick={() => setFinishModalOpen(true)} style={{
                  background: `${GOLD}22`, border: `1px solid ${GOLD}66`, borderRadius: 6,
                  padding: "5px 11px", cursor: "pointer",
                  fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 2,
                }}>FINISH ▶</button>
              </div>
              {sessionLog.map((l, i) => {
                const prev = sessionLog[i - 1];
                const next = sessionLog[i + 1];
                const inGroup    = !!l.supersetGroup;
                const groupAbove = inGroup && prev?.supersetGroup === l.supersetGroup;
                const groupBelow = inGroup && next?.supersetGroup === l.supersetGroup;
                return (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT,
                    padding: "4px 0 4px 8px", marginBottom: 4,
                    borderBottom: `1px solid ${ACCENT2}22`,
                    borderLeft: inGroup ? `2px solid ${GOLD}` : "2px solid transparent",
                    borderTopLeftRadius: groupAbove ? 0 : 4,
                    borderBottomLeftRadius: groupBelow ? 0 : 4,
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {inGroup && <span style={{ fontSize: 9, color: GOLD, opacity: 0.7 }}>↔</span>}
                      {l.name}
                    </span>
                    <span style={{ color: GOLD }}>+{l.xp} XP</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── BROWSE + LOG TAB ── */}
      {tab === "browse" && (
        <div style={{ padding: "14px 16px 0" }}>
          {/* Superset toggle */}
          <button
            onClick={() => setCurrentSupersetGroup(g => g ? null : `ss_${Date.now()}`)}
            style={{
              width: "100%", padding: "10px 12px", marginBottom: 10, cursor: "pointer",
              background: currentSupersetGroup ? `${GOLD}1a` : BG2,
              border: `1px solid ${currentSupersetGroup ? GOLD : ACCENT2 + "33"}`,
              borderRadius: 8, textAlign: "left",
              fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
              color: currentSupersetGroup ? GOLD : MUTED, letterSpacing: 2,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
            <span>↔ {currentSupersetGroup ? "SUPERSET ACTIVE" : "START SUPERSET"}</span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>
              {currentSupersetGroup ? "TAP TO END" : "GROUP NEXT EXERCISES"}
            </span>
          </button>

          {/* Search bar */}
          <input className="input-field"
            value={browseSearch}
            onChange={e => setBrowseSearch(e.target.value)}
            placeholder="Search exercises..."
            style={{ marginBottom: 10 }} />

          {/* Muscle tabs */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {MUSCLE_CATEGORIES.map(m => {
              const mm = MUSCLE_META[m];
              const active = selMuscle === m;
              return (
                <button key={m} onClick={() => setSelMuscle(m)} style={{
                  background: active ? `${mm.color}22` : BG2,
                  border: `1px solid ${active ? mm.color : ACCENT2+"33"}`,
                  borderRadius: 8, padding: "7px 13px", cursor: "pointer",
                  fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700,
                  color: active ? mm.color : MUTED, letterSpacing: 1, transition: "all .15s"
                }}>{mm.name.toUpperCase()}</button>
              );
            })}
          </div>

          {/* Exercise list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {exercises.map((ex, i) => {
              const diffColor = { beginner: GREEN, intermediate: ACCENT, advanced: GOLD, elite: RED }[ex.diff];
              const logged = sessionLog.filter(l => l.name === ex.name).length;
              return (
                <div key={i} style={{
                  background: logged ? `${meta.color}0d` : BG2,
                  border: `1px solid ${logged ? meta.color+"55" : meta.color+"22"}`,
                  borderLeft: `3px solid ${meta.color}`, borderRadius: 10, padding: "12px 14px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 5 }}>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15,
                      fontWeight: 700, color: TEXT }}>{ex.name}</div>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {logged > 0 && <span style={{ fontFamily: "'Orbitron',sans-serif",
                        fontSize: 8, color: meta.color, letterSpacing: 1 }}>×{logged}</span>}
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                        color: diffColor, background: `${diffColor}22`,
                        padding: "2px 7px", borderRadius: 8 }}>{ex.diff.toUpperCase()}</span>
                    </div>
                  </div>
                  {ex.primary && MUSCLE_META[ex.primary] && (() => {
                    const mm = MUSCLE_META[ex.primary];
                    const subs = ex.svgTargets
                      ? ex.svgTargets.map(t => MUSCLE_META[t]?.name).filter(Boolean)
                      : [];
                    return (
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                          fontWeight: 700, color: mm.color, background: `${mm.color}18`,
                          border: `1px solid ${mm.color}44`, padding: "2px 9px",
                          borderRadius: 6, marginRight: 6 }}>{mm.name}</span>
                        {subs.length > 0 && (
                          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                            color: MUTED }}>{subs.join(" · ")}</span>
                        )}
                      </div>
                    );
                  })()}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
                      color: MUTED }}>{ex.type} · {ex.diff}</span>
                    <button onClick={() => setLogModal({ exercise: ex, muscle: selMuscle })} style={{
                      background: `linear-gradient(90deg, ${meta.color}22, ${meta.color}33)`,
                      border: `1px solid ${meta.color}88`,
                      borderTop: `1px solid ${meta.color}cc`,
                      clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                      padding: "7px 18px", cursor: "pointer",
                      fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
                      color: meta.color, letterSpacing: 2
                    }}>{themeLabel(settings,"logIt","LOG IT")}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* Workout finish summary modal */}
      {finishModalOpen && (
        <WorkoutFinishModal
          sessionLog={sessionLog}
          sessionStart={sessionStart}
          onClose={() => setFinishModalOpen(false)}
          onComplete={() => {
            setSessionLog([]);
            setSessionStart(null);
            setFinishModalOpen(false);
            setCurrentSupersetGroup(null);
            toast("Session complete · well fought", GOLD);
          }}
        />
      )}

      {/* Log / Edit modal */}
      {(logModal || editModal) && (
        <ExerciseLogModal
          exercise={(logModal || editModal).exercise}
          muscle={(logModal || editModal).muscle}
          weightLbs={st.weightLbs || 170}
          profile={st}
          editingEntry={(logModal || editModal).originalEntry || null}
          onConfirm={data => {
            const modal = logModal || editModal;
            const supersetGroup = currentSupersetGroup || null;
            const entry = { exerciseName: modal.exercise.name, muscle: modal.muscle,
              exercise: modal.exercise, sets: data.sets, reps: data.reps,
              weight: data.weight, sets_detail: data.sets_detail,
              newE1RM: data.newE1RM, isPR: data.isPR, xp: data.xp, cals: data.cals, cardioData: data.cardioData,
              supersetGroup, date: Date.now() };
            if (modal.originalEntry) onUnlogExercise(modal.originalEntry);
            onLogExercise(entry);
            const prevE1RM = (st.prs || {})[modal.exercise.name] || null;
            setSessionLog(s => [...s, {
              name: modal.exercise.name,
              muscle: modal.muscle,
              xp: data.xp,
              sets: data.sets,
              reps: data.reps,
              weight: data.weight,
              isPR: data.isPR,
              newE1RM: data.newE1RM,
              prevE1RM,
              supersetGroup,
              date: Date.now(),
            }]);
            if (sessionStart == null) setSessionStart(Date.now());
            setLogModal(null); setEditModal(null);
            setTab("log"); setSelDay(todayDayIdx);
            toast(`${modal.exercise.name} logged! +${data.xp} XP`, GOLD);
          }}
          onClose={() => { setLogModal(null); setEditModal(null); }}
        />
      )}
    </div>
  );
}

function DatabaseScreen({ st, onLogExercise, onSaveCustomExercise, onToggleBookmark, settings, toast }) {
  const [selMuscle, setSelMuscle] = useState("chest");
  const [searchQ, setSearchQ] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const bookmarkedSet = new Set(st.bookmarkedExercises || []);

  const [randoMode, setRandoMode] = useState(false);
  const [randoMuscles, setRandoMuscles] = useState([]);
  const [randoPlan, setRandoPlan] = useState(null);
  const [randoDiff, setRandoDiff] = useState("all");


  const toggleRandoMuscle = (m) =>
    setRandoMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const runRandomizer = () => {
    if (randoMuscles.length === 0) return;
    const plans = randoMuscles.map(m => generateWorkout(m, st.workouts, st.customExercises, st.overallLevel, st.goal, randoDiff, settings?.travelMode ? (settings?.travelEquipment || []) : null));
    const combined = [];
    const maxLen = Math.max(...plans.map(p => p.length));
    for (let i = 0; i < maxLen; i++) { plans.forEach(p => { if (p[i]) combined.push(p[i]); }); }
    setRandoPlan(combined); setViewMode("plan"); setRandoMode(false);
    toast(`${combined.length} exercises generated`, GOLD);
  };

  const [cName, setCName] = useState("");
  const [cDiff, setCDiff] = useState("intermediate");
  const [cType, setCType] = useState("strength");
  const [activations, setActivations] = useState({});
  const [cAngleGroup, setCAngleGroup] = useState("");

  const setActivation = (svgId, val) => setActivations(a => ({ ...a, [svgId]: Math.max(0, Math.min(100, Number(val))) }));
  const totalPct = Object.values(activations).reduce((s, v) => s + v, 0);
  const resetCustomForm = () => { setCName(""); setCDiff("intermediate"); setCType("strength"); setActivations({}); setCAngleGroup(""); };

  const isSearching = searchQ.trim().length > 0;
  const allCustom = st.customExercises || [];
  // "arms" tab combines bicep + tricep + forearms
  const getExercisesForMuscle = (m) => {
    if (m === "arms") {
      return [
        ...(EXERCISE_DB.bicep    || []),
        ...(EXERCISE_DB.tricep   || []),
        ...(EXERCISE_DB.forearms || []),
        ...allCustom.filter(e => ["bicep","tricep","forearms"].includes(e.primary)),
      ];
    }
    return [...(EXERCISE_DB[m] || []), ...allCustom.filter(e => e.primary === m)];
  };

  // Always show browseable exercises — plan is shown as a separate banner above
  const travelMode = settings?.travelMode === true;
  const allExercises = (isSearching || bookmarksOnly)
    ? [...Object.entries(EXERCISE_DB).flatMap(([, exs]) => exs), ...allCustom]
    : getExercisesForMuscle(selMuscle);
  const filtered = (isSearching
    ? allExercises.filter(e => e.name.toLowerCase().includes(searchQ.toLowerCase()))
    : (bookmarksOnly
      ? allExercises.filter(e => bookmarkedSet.has(e.name))
      : allExercises)
  )
    .filter(e => !travelMode || isTravelFriendly(e, settings?.travelEquipment))
    .slice().sort((a, b) => {
      // Bookmarked first (when not filtered to bookmarks-only), then alphabetical
      const aB = bookmarkedSet.has(a.name), bB = bookmarkedSet.has(b.name);
      if (!bookmarksOnly && aB !== bB) return aB ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const handleSaveCustom = () => {
    if (!cName.trim()) { toast("Enter a name", RED); return; }
    const svgTargets = Object.keys(activations).filter(k => activations[k] > 0);
    if (svgTargets.length === 0) { toast("Select at least one muscle target", RED); return; }
    if (totalPct < 95 || totalPct > 105) { toast(`Activations must total 100% (currently ${totalPct}%)`, RED); return; }
    const emgMap = {};
    svgTargets.forEach(id => { emgMap[id] = activations[id]; });
    const exercise = { name: cName.trim(), diff: cDiff, type: cType, primary: selMuscle,
      svgTargets, emg: emgMap, angleGroup: cAngleGroup || null, custom: true };
    onSaveCustomExercise(exercise);
    resetCustomForm(); setCustomMode(false);
  };

  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: "transparent", padding: "20px 20px calc(120px + env(safe-area-inset-bottom, 0px))", paddingTop: "20px" }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
        <span className="glitch-in holo-text" style={{ fontFamily: "'Orbitron',sans-serif" }}>
          {themeLabel(settings,"database","DATABASE")}
        </span>
        {travelMode && <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, background: `${GOLD}22`, border: `1px solid ${GOLD}66`, borderRadius: 5, padding: "2px 8px", letterSpacing: 1 }}>✈ TRAVEL</span>}
      </div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, letterSpacing: 2, marginBottom: 18 }}>EXERCISE COMPENDIUM</div>

      {/* Search */}
      <input className="input-field" value={searchQ} onChange={e => setSearchQ(e.target.value)}
        placeholder="Search exercises..." style={{ marginBottom: 14 }} />

      {/* Muscle filter — major groups only, pill style */}
      {!isSearching && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
          <button onClick={() => setBookmarksOnly(b => !b)} style={{
            background: bookmarksOnly ? `${GOLD}22` : BG2,
            border: `1px solid ${bookmarksOnly ? GOLD : GOLD + "33"}`,
            borderRadius: 20, padding: "5px 11px", cursor: "pointer",
            fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700,
            color: bookmarksOnly ? GOLD : MUTED, transition: "all .15s",
            boxShadow: bookmarksOnly ? `0 0 8px ${GOLD}33` : "none",
          }}>★ {bookmarkedSet.size > 0 ? `${bookmarkedSet.size}` : ""}</button>
          {[
            { key: "chest",     name: "Chest" },
            { key: "back",      name: "Back" },
            { key: "shoulders", name: "Shoulders" },
            { key: "arms",      name: "Arms" },
            { key: "legs",      name: "Legs" },
            { key: "core",      name: "Core" },
            { key: "glutes",    name: "Glutes" },
            { key: "calves",    name: "Calves" },
            { key: "cardio",    name: "Cardio" },
          ].map(({ key, name }) => {
            const meta = MUSCLE_META[key] || MUSCLE_META.chest;
            const sel = !bookmarksOnly && selMuscle === key;
            return (
              <button key={key} onClick={() => { setSelMuscle(key); setSearchQ(""); setBookmarksOnly(false); }} style={{
                background: sel ? `${meta.color}22` : BG2,
                border: `1px solid ${sel ? meta.color : ACCENT2 + "33"}`,
                borderRadius: 20, padding: "5px 11px", cursor: "pointer",
                fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700,
                color: sel ? meta.color : MUTED, transition: "all .15s",
                boxShadow: sel ? `0 0 8px ${meta.color}33` : "none"
              }}>{name}</button>
            );
          })}
        </div>
      )}

      {/* Plan banner — always visible when plan exists, browse still works below */}
      {randoPlan && (
        <div style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}33`,
          borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3 }}>
              GENERATED PLAN — {randoMuscles.map(m => (MUSCLE_META[m]?.name||m).toUpperCase()).join(" + ")}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={runRandomizer} style={{ background: "none", border: `1px solid ${GOLD}44`,
                borderRadius: 5, padding: "3px 10px", cursor: "pointer",
                fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD }}>REGENERATE</button>
              <button onClick={() => { setRandoPlan(null); setRandoMuscles([]); }} style={{
                background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {randoPlan.map((ex, idx) => {
              const mm = MUSCLE_META[ex.primary] || MUSCLE_META.chest;
              return (
                <div key={idx} style={{
                  background: BG3, border: `1px solid ${mm.color}33`,
                  borderLeft: `3px solid ${mm.color}`, borderRadius: 8,
                  padding: "8px 12px", display: "flex",
                  justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                      fontWeight: 700, color: TEXT }}>{ex.name}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                      color: mm.color }}>{mm.name}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => setLogModal({ exercise: ex, muscle: ex.primary || selMuscle })}
                      style={{
                        background: `${mm.color}22`, border: `1px solid ${mm.color}66`,
                        borderRadius: 6, padding: "5px 12px", cursor: "pointer",
                        fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                        fontWeight: 700, color: mm.color, letterSpacing: 1
                      }}>LOG</button>
                    <button onClick={() => setRandoPlan(p => p.filter((_, i) => i !== idx))}
                      style={{ background: "none", border: "none",
                        color: MUTED, cursor: "pointer", fontSize: 14 }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Add custom exercise to plan */}
          <div style={{ marginTop: 10, fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
            color: MUTED, textAlign: "center" }}>
            Browse and log any exercise below — or use the plan above
          </div>
        </div>
      )}

      {/* Exercise cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {filtered.map((ex, i) => {
          const meta = isSearching ? (MUSCLE_META[ex.primary] || MUSCLE_META.chest) : (MUSCLE_META[selMuscle] || MUSCLE_META.chest);
          const diffColor = { beginner: GREEN, intermediate: ACCENT, advanced: GOLD, elite: RED }[ex.diff];
          const typeColor = { strength: ACCENT, calisthenics: "#aa44ff", cardio: RED }[ex.type] || ACCENT;
          const subs = ex.svgTargets ? ex.svgTargets.map(t => MUSCLE_META[t]?.name).filter(Boolean) : [];
          const isBookmarked = bookmarkedSet.has(ex.name);
          return (
            <div key={ex.name} className="card-in" style={{ background: BG2, border: `1px solid ${meta.color}22`, borderLeft: `3px solid ${meta.color}`, borderRadius: 10, padding: "12px 14px",
              animationDelay: `${Math.min(i, 8) * 45}ms` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                  <button onClick={() => onToggleBookmark?.(ex.name)} title={isBookmarked ? "Remove bookmark" : "Bookmark"} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 14, lineHeight: 1, padding: 0, color: isBookmarked ? GOLD : MUTED,
                    flexShrink: 0,
                  }}>{isBookmarked ? "★" : "☆"}</button>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 700, color: TEXT }}>{ex.name}</div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: diffColor, background: `${diffColor}22`, padding: "2px 7px", borderRadius: 8, letterSpacing: 1 }}>{ex.diff?.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: typeColor, background: `${typeColor}22`, padding: "2px 7px", borderRadius: 8, letterSpacing: 1 }}>{ex.type?.toUpperCase()}</span>
                </div>
              </div>
              {subs.length > 0 && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginBottom: 6 }}>
                  {subs.join(" · ")}
                </div>
              )}
              {ex.swap && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GREEN,
                  marginBottom: 6, opacity: 0.9 }}>
                  ⇄ {ex.swap}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: GOLD }}>{ex.diff} effort</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
                    ~{calcXP(ex, 3, ex.type === "strength" ? 135 : 10, st.weightLbs || 170)} XP est.
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px", fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED }}>No exercises found.</div>
        )}
      </div>

      {/* Custom exercise creator */}
      <div style={{ borderTop: `1px solid ${ACCENT2}33`, paddingTop: 16 }}>
        {!customMode ? (
          <button onClick={() => setCustomMode(true)} style={{
            width: "100%", background: `${ACCENT}0a`, border: `1px dashed ${ACCENT}44`,
            borderRadius: 10, padding: "13px", cursor: "pointer",
            fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: ACCENT, fontWeight: 700, letterSpacing: 2
          }}>+ CREATE CUSTOM EXERCISE</button>
        ) : (
          <div style={{ background: BG2, border: `1px solid ${ACCENT}33`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4, marginBottom: 12 }}>[ CUSTOM EXERCISE ]</div>

            {/* Name */}
            <input className="input-field" value={cName} onChange={e => setCName(e.target.value)}
              placeholder="Exercise name..." style={{ marginBottom: 10 }} />

            {/* Difficulty + Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>DIFFICULTY</div>
                <select value={cDiff} onChange={e => setCDiff(e.target.value)} className="input-field">
                  {["beginner","intermediate","advanced","elite"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>TYPE</div>
                <select value={cType} onChange={e => setCType(e.target.value)} className="input-field">
                  <option value="strength">Strength</option>
                  <option value="calisthenics">Calisthenics</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>
            </div>

            {/* Muscle Activation */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2 }}>MUSCLE ACTIVATION %</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10,
                  color: totalPct === 100 ? GREEN : totalPct > 100 ? RED : GOLD }}>
                  {totalPct}% / 100%
                </div>
              </div>

              {/* Common muscle targets grouped for easy selection */}
              {[
                { label: "SHOULDERS", targets: [
                  { id: "anterior-deltoid",  name: "Front Delt" },
                  { id: "lateral-deltoid",   name: "Side Delt" },
                  { id: "posterior-deltoid", name: "Rear Delt" },
                  { id: "upper-trapezius",   name: "Upper Trap" },
                ]},
                { label: "CHEST", targets: [
                  { id: "upper-pectoralis",      name: "Upper Pec" },
                  { id: "mid-lower-pectoralis",  name: "Mid/Lower Pec" },
                ]},
                { label: "BACK", targets: [
                  { id: "lats",             name: "Lats" },
                  { id: "traps-middle",     name: "Mid Trap" },
                  { id: "lower-trapezius",  name: "Lower Trap" },
                  { id: "lowerback",        name: "Lower Back" },
                ]},
                { label: "ARMS", targets: [
                  { id: "long-head-bicep",      name: "Bicep Long" },
                  { id: "short-head-bicep",     name: "Bicep Short" },
                  { id: "long-head-triceps",    name: "Tricep Long" },
                  { id: "lateral-head-triceps", name: "Tricep Lat" },
                  { id: "medial-head-triceps",  name: "Tricep Med" },
                  { id: "wrist-flexors",        name: "Forearm Flex" },
                ]},
                { label: "LEGS", targets: [
                  { id: "outer-quadricep",    name: "Outer Quad" },
                  { id: "rectus-femoris",     name: "Rectus Fem" },
                  { id: "inner-quadricep",    name: "Inner Quad" },
                  { id: "lateral-hamstrings", name: "Hamstring" },
                  { id: "gluteus-maximus",    name: "Glute Max" },
                  { id: "gluteus-medius",     name: "Glute Med" },
                  { id: "gastrocnemius",      name: "Calf" },
                ]},
                { label: "CORE", targets: [
                  { id: "upper-abdominals", name: "Upper Abs" },
                  { id: "lower-abdominals", name: "Lower Abs" },
                  { id: "obliques",         name: "Obliques" },
                ]},
              ].map(group => (
                <div key={group.label} style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                    color: ACCENT, letterSpacing: 2, marginBottom: 6 }}>{group.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {group.targets.map(({ id, name }) => {
                      const val = activations[id] || 0;
                      const isActive = val > 0;
                      return (
                        <div key={id} style={{
                          background: isActive ? `${ACCENT}18` : BG3,
                          border: `1px solid ${isActive ? ACCENT : MUTED+"33"}`,
                          borderRadius: 8, padding: "8px 10px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
                            fontWeight: 700, color: isActive ? ACCENT : MUTED }}>{name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <button onClick={() => setActivations(a => ({ ...a, [id]: Math.max(0, (a[id]||0) - 5) }))}
                              style={{ background: "none", border: `1px solid ${MUTED}44`, borderRadius: 4,
                                width: 20, height: 20, cursor: "pointer", color: MUTED, fontSize: 14,
                                display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10,
                              color: isActive ? ACCENT : MUTED, minWidth: 28, textAlign: "center" }}>
                              {val}%
                            </span>
                            <button onClick={() => setActivations(a => ({ ...a, [id]: Math.min(100, (a[id]||0) + 5) }))}
                              style={{ background: "none", border: `1px solid ${MUTED}44`, borderRadius: 4,
                                width: 20, height: 20, cursor: "pointer", color: MUTED, fontSize: 14,
                                display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 4 }}>
                Tap + / − to set each muscle's activation. Total must equal 100%.
              </div>
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => { setCustomMode(false); resetCustomForm(); }}
                style={{ background: "none", border: `1px solid ${MUTED}33`, borderRadius: 8,
                  padding: "10px", cursor: "pointer",
                  fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>CANCEL</button>
              <button className="btn-primary" onClick={handleSaveCustom}
                style={{ padding: "10px", fontSize: 13, letterSpacing: 2 }}>SAVE</button>
            </div>
          </div>
        )}
      </div>

      {/* Randomizer modal */}
      {randoMode && (
        createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1100, background: "rgba(7,11,20,0.93)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: "96px" }} onClick={() => setRandoMode(false)}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`, border: `1px solid ${GOLD}55`, borderTop: `2px solid ${GOLD}`, width: "100%", maxWidth: 480, padding: "24px 20px 36px", clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>RANDOM WORKOUT</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, marginBottom: 12 }}>Pick any muscle groups. I will build a hypertrophy-optimised session.</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {randoMuscles.map(m => { const mm = MUSCLE_META[m]; return <span key={m} style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color: mm?.color, background: `${mm?.color}22`, border: `1px solid ${mm?.color}66`, padding: "3px 10px", borderRadius: 6 }}>{mm?.name}</span>; })}
                {!randoMuscles.length && <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>None selected</span>}
              </div>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: randoMuscles.length ? ACCENT : MUTED }}>{randoMuscles.length} selected</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {["chest","back","shoulders","bicep","tricep","legs","glutes","core","calves","forearms"].map(m => {
                const mm = MUSCLE_META[m]; if (!mm) return null;
                const isSel = randoMuscles.includes(m);
                const lastW = (st.workouts||[]).filter(w=>w.muscle===m||w.exercise?.primary===m);
                const lastDate = lastW.length ? new Date(Math.max(...lastW.map(w=>w.date||0))) : null;
                const daysSince = lastDate ? Math.floor((Date.now()-lastDate)/86400000) : null;
                return (
                  <button key={m} onClick={() => toggleRandoMuscle(m)} style={{ background: isSel ? `${mm.color}28` : `${mm.color}0a`, border: `1px solid ${isSel ? mm.color : mm.color+"44"}`, borderLeft: `3px solid ${isSel ? mm.color : mm.color+"55"}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left", position: "relative" }}>
                    {isSel && <div style={{ position: "absolute", top: 6, right: 8, fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: mm.color, fontWeight: 900 }}>✓</div>}
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700, color: isSel ? mm.color : MUTED, letterSpacing: 1, marginBottom: 3 }}>{mm.name.toUpperCase()}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>{daysSince===null?"Never trained":daysSince===0?"Today":daysSince===1?"1 day ago":`${daysSince}d ago`}</div>
                  </button>
                );
              })}
            </div>
            {/* Difficulty filter */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
                letterSpacing: 3, marginBottom: 8 }}>DIFFICULTY</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { val: "all",          label: "ALL" },
                  { val: "beginner",     label: "BEGINNER" },
                  { val: "intermediate", label: "INTERMEDIATE" },
                  { val: "advanced",     label: "ADVANCED" },
                  { val: "elite",        label: "ELITE" },
                ].map(({ val, label }) => {
                  const isActive = randoDiff === val;
                  const diffColors = { all: ACCENT, beginner: GREEN, intermediate: GOLD, advanced: "#ff8844", elite: "#ff3344" };
                  const col = diffColors[val] || ACCENT;
                  return (
                    <button key={val} onClick={() => setRandoDiff(val)} style={{
                      flex: 1, padding: "6px 2px", cursor: "pointer",
                      background: isActive ? `${col}22` : BG3,
                      border: `1px solid ${isActive ? col : MUTED + "33"}`,
                      borderRadius: 6,
                      fontFamily: "'Orbitron',sans-serif", fontSize: 6, fontWeight: 700,
                      color: isActive ? col : MUTED, letterSpacing: 0.5,
                      transition: "all .15s",
                      boxShadow: isActive ? `0 0 8px ${col}44` : "none",
                    }}>{label}</button>
                  );
                })}
              </div>
              {randoDiff !== "all" && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
                  marginTop: 6, letterSpacing: 1 }}>
                  {randoDiff === "beginner" ? "Foundation movements — safe for all levels" :
                   randoDiff === "intermediate" ? "Progressive overload focus — solid technique required" :
                   randoDiff === "advanced" ? "High intensity — strong base needed" :
                   "Maximum stimulus — for experienced athletes only"}
                </div>
              )}
            </div>
            <button onClick={runRandomizer} disabled={!randoMuscles.length} style={{ width: "100%", padding: "13px", marginBottom: 8, cursor: randoMuscles.length ? "pointer" : "not-allowed", background: randoMuscles.length ? `linear-gradient(90deg, ${GOLD}33, ${GOLD}22)` : DARK1, border: `1px solid ${randoMuscles.length ? GOLD+"88" : MUTED+"33"}`, clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))", fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700, color: randoMuscles.length ? GOLD : MUTED, letterSpacing: 3, opacity: randoMuscles.length ? 1 : 0.5 }}>GENERATE WORKOUT</button>
            <button onClick={() => { setRandoMode(false); setRandoMuscles([]); }} style={{ width: "100%", background: "none", border: `1px solid ${MUTED}33`, borderRadius: 8, padding: "10px", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>CANCEL</button>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}


function ScheduleScreen({ st, onLogExercise, onUnlogExercise, onUpdateSchedule, onLogFood, settings, toast }) {
  const travelMode = settings?.travelMode === true;
  const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const [selDay, setSelDay] = useState(todayIdx);
  const [logModal, setLogModal] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [randoMode, setRandoMode] = useState(false);
  const [sessionLog, setSessionLog] = useState([]);
  const [sessionStart, setSessionStart] = useState(null);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const _savedRando = (() => { try { return JSON.parse(localStorage.getItem("ir_rando_plan") || "{}"); } catch { return {}; } })();
  const [randoMuscles, setRandoMuscles] = useState(_savedRando.muscles || []);
  const [randoPlan, setRandoPlan] = useState(_savedRando.plan || null);
  const [randoDiff, setRandoDiff] = useState(_savedRando.diff || "all");

  useEffect(() => {
    try { localStorage.setItem("ir_rando_plan", JSON.stringify({ muscles: randoMuscles, plan: randoPlan, diff: randoDiff })); } catch {}
  }, [randoMuscles, randoPlan, randoDiff]);

  const [nutInput, setNutInput] = useState({ cal: "", protein: "" });

  const toggleRandoMuscle = (m) =>
    setRandoMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const runRandomizer = () => {
    if (!randoMuscles.length) return;
    const plans = randoMuscles.map(m =>
      generateWorkout(m, st.workouts, st.customExercises, st.overallLevel, st.goal, randoDiff, settings?.travelMode ? (settings?.travelEquipment || []) : null));
    const combined = [];
    const maxLen = Math.max(...plans.map(p => p.length));
    for (let i = 0; i < maxLen; i++)
      plans.forEach(p => { if (p[i]) combined.push(p[i]); });
    setRandoPlan(combined);
    setRandoMode(false);
    toast(`${combined.length} exercises generated — tap to log`, GOLD);
  };

  const programs = st.gender === "female" ? FEMALE_PROGRAMS : MALE_PROGRAMS;
  const FREE_PROGRAM = { id: "free", name: "Free Workout", free: true };
  const allPrograms  = [FREE_PROGRAM, ...programs];
  const program      = allPrograms.find(p => p.id === st.program);
  const isFree       = !program || program.free;

  // Week boundaries (Mon–Sun)
  const startOfWeek = (() => {
    const d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  })();

  // Get date timestamp for a given day index
  const getDayDate = (di) => startOfWeek + di * 86400000;
  const getSelDayDate = () => getDayDate(selDay);

  // Get food log for selected day
  const getSelDayFood = () => {
    const dayStr = new Date(getSelDayDate()).toDateString();
    return (st.foodLog || []).find(f => new Date(f.date).toDateString() === dayStr);
  };

  // Group this week's workouts by day index
  const byDay = DAYS.map((_, di) => {
    const dayStart = startOfWeek + di * 86400000;
    const dayEnd   = dayStart + 86400000;
    return (st.workouts || []).filter(w => (w.date||0) >= dayStart && (w.date||0) < dayEnd);
  });

  const dayXP = (di) => byDay[di].reduce((s,w) => s + (w.xp||0), 0);
  const weekXP = DAYS.reduce((s,_,i) => s + dayXP(i), 0);

  // Program day plan (if structured program)
  const schedule   = st.customSchedule || program?.days || [];
  const todayPlan  = schedule[selDay];

  const handleEdit = (entry) => {
    // Store the full original entry — only unlog if user confirms new log
    setEditEntry({ exercise: entry.exercise, muscle: entry.muscle, originalEntry: entry });
  };

  const handleDelete = (entry) => {
    onUnlogExercise(entry);
    toast(`${entry.exerciseName} removed`, MUTED);
  };

  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: "transparent", padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${BG2}f8, ${DARK1}ee)`,
        borderBottom: `1px solid ${ACCENT}33`, padding: "18px 20px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700,
              color: GOLD, letterSpacing: 2, marginBottom: 2 }}>{themeLabel(settings,"schedule","SCHEDULE")}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
              {program ? program.name : "No program selected"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <button onClick={() => setRandoMode(true)} style={{
              background: `${GOLD}18`, border: `1px solid ${GOLD}55`,
              borderTop: `1px solid ${GOLD}99`,
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              padding: "8px 14px", cursor: "pointer",
              fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
              color: GOLD, letterSpacing: 2 }}>RANDOMIZE</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700,
              color: GOLD }}>{weekXP.toLocaleString()} XP</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
              color: MUTED, letterSpacing: 1 }}>THIS WEEK</div>
          </div>
          </div>
        </div>
      </div>

      {/* Randomizer plan banner */}
      {randoPlan && (
        <div style={{ background: `${GOLD}0d`, border: `1px solid ${GOLD}33`,
          padding: "10px 16px", borderBottom: `1px solid ${GOLD}22` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3 }}>
              TODAY'S PLAN — {randoMuscles.map(m => MUSCLE_META[m]?.name?.toUpperCase()).join(" + ")}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={runRandomizer} style={{ background: "none", border: `1px solid ${GOLD}44`,
                borderRadius: 5, padding: "3px 10px", cursor: "pointer",
                fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD }}>REGENERATE</button>
              <button onClick={() => { setRandoPlan(null); setRandoMuscles([]); }} style={{
                background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {randoPlan.map((ex, i) => {
              const mm = MUSCLE_META[ex.primary] || MUSCLE_META.chest;
              const subs = ex.svgTargets ? ex.svgTargets.map(t => MUSCLE_META[t]?.name).filter(Boolean).join(" · ") : null;
              const alreadyLogged = byDay[todayIdx]?.some(w => w.exerciseName === ex.name);
              return (
                <div key={i} style={{ background: alreadyLogged ? `${mm.color}0d` : BG2,
                  border: `1px solid ${alreadyLogged ? mm.color+"44" : mm.color+"22"}`,
                  borderLeft: `3px solid ${mm.color}`, borderRadius: 8, padding: "10px 12px",
                  display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                      fontWeight: 700, color: alreadyLogged ? mm.color : TEXT }}>{ex.name}</div>
                    {subs && <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                      color: mm.color, opacity: 0.8 }}>{subs}</div>}
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                      ~{calcXP(ex, 3, 135, st.weightLbs||170)} XP est.
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {alreadyLogged
                      ? <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: GREEN, letterSpacing: 1 }}>DONE</span>
                      : <button onClick={() => setLogModal({ exercise: ex, muscle: ex.primary || "chest", targetDate: getDayDate(selDay) })} style={{
                          background: `${mm.color}22`, border: `1px solid ${mm.color}66`,
                          borderRadius: 6, padding: "6px 12px", cursor: "pointer",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                          fontWeight: 700, color: mm.color, letterSpacing: 1 }}>LOG</button>
                    }
                    <button onClick={() => setRandoPlan(p => p.filter((_, j) => j !== i))}
                      style={{ background: "none", border: `1px solid ${MUTED}33`,
                        borderRadius: 6, width: 26, height: 26, cursor: "pointer",
                        color: MUTED, fontSize: 14, display: "flex",
                        alignItems: "center", justifyContent: "center" }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Day tabs */}
      <div style={{ display: "flex", padding: "10px 12px", gap: 5, overflowX: "auto",
        borderBottom: `1px solid ${ACCENT2}22` }}>
        {DAYS.map((d, i) => {
          const isToday  = i === todayIdx;
          const active   = selDay === i;
          const xp       = dayXP(i);
          const count    = byDay[i].length;
          const planDay  = schedule[i];
          const isRest   = planDay?.rest && count === 0;
          return (
            <button key={d} onClick={() => setSelDay(i)} style={{
              flexShrink: 0, background: active ? `${ACCENT}22` : BG2,
              border: `1px solid ${active ? ACCENT : isToday ? GOLD+"44" : ACCENT2+"33"}`,
              borderRadius: 8, padding: "7px 11px", cursor: "pointer", textAlign: "center",
              minWidth: 46
            }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
                color: active ? ACCENT : isToday ? GOLD : MUTED }}>{d}</div>
              {xp > 0 && (
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                  color: GOLD, marginTop: 2 }}>+{xp}</div>
              )}
              {isRest && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8,
                  color: MUTED, marginTop: 2 }}>REST</div>
              )}
              {count > 0 && !active && (
                <div style={{ width: 4, height: 4, borderRadius: "50%",
                  background: ACCENT, margin: "3px auto 0" }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Program plan for day (structured programs only) */}
        {!isFree && todayPlan && !todayPlan.rest && todayPlan.exercises?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
              letterSpacing: 3, marginBottom: 8 }}>{`// TODAY'S PLAN · ${todayPlan.label.toUpperCase()}`}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todayPlan.exercises.map((planned, i) => {
                // Travel mode: substitute anything the user can't perform today
                const sub = travelMode
                  ? travelSubstitute(planned, settings?.travelEquipment || [], st.customExercises)
                  : null;
                const ex = sub ? { ...sub, muscle: planned.muscle || sub.primary } : planned;
                const mm = MUSCLE_META[ex.muscle] || MUSCLE_META.chest;
                const alreadyLogged = byDay[selDay].some(w => w.exerciseName === ex.name);
                return (
                  <div key={i} className="card-in" style={{ background: BG2,
                    border: `1px solid ${alreadyLogged ? GREEN+"44" : mm.color+"22"}`,
                    borderLeft: `3px solid ${alreadyLogged ? GREEN : mm.color}`,
                    borderRadius: 8, padding: "10px 12px", animationDelay: `${Math.min(i, 8) * 55}ms`,
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                        fontWeight: 700, color: alreadyLogged ? GREEN : TEXT }}>{ex.name}</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                        color: mm.color }}>{mm.name}</div>
                      {sub && (
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                          color: GREEN, opacity: 0.85, marginTop: 1 }}>
                          ⇄ travel swap for {planned.name}
                        </div>
                      )}
                      {ex.swap && (
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                          color: MUTED, marginTop: 1 }}>{ex.swap}</div>
                      )}
                    </div>
                    {!alreadyLogged && (
                      <button onClick={() => setLogModal({ exercise: ex, muscle: ex.muscle || ex.primary || "chest" })}
                        style={{ background: `${mm.color}22`, border: `1px solid ${mm.color}66`,
                          borderRadius: 6, padding: "5px 14px", cursor: "pointer",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                          fontWeight: 700, color: mm.color, letterSpacing: 1 }}>LOG</button>
                    )}
                    {alreadyLogged && (
                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                        color: GREEN, letterSpacing: 1 }}>DONE</span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: `${ACCENT2}33`, margin: "16px 0" }} />
          </div>
        )}

        {!isFree && todayPlan?.rest && byDay[selDay].length === 0 && (
          <div style={{ background: BG2, border: `1px solid ${ACCENT2}33`, borderRadius: 10,
            padding: "20px", textAlign: "center", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color: MUTED,
              letterSpacing: 2 }}>REST DAY</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginTop: 4 }}>
              Recovery is part of the program
            </div>
          </div>
        )}


        {/* Nutrition widget for selected day */}
        {(() => {
          const selFood    = getSelDayFood();
          const cals       = selFood?.calories || 0;
          const prot       = selFood?.protein  || 0;
          const tdee       = calcTDEE(st);
          const protTarget = calcProteinTarget(st);
          const protMult   = prot > 0 ? calcProteinMultiplier(prot, protTarget) : 1.0;
          const surplus    = Math.max(0, cals - tdee);
          const calColor   = surplus > 0 ? RED : cals === 0 ? MUTED : GREEN;
          const protColor  = prot === 0 ? MUTED : protMult >= 1.0 ? GREEN : protMult >= 0.85 ? GOLD : RED;
          const dayLabel   = selDay === todayIdx ? "Today" : DAYS[selDay];
          const isPast     = selDay !== todayIdx;
          return (
            <div style={{ background: `linear-gradient(135deg, ${BG2}f0, ${DARK1}e8)`,
              border: `1px solid ${ACCENT}22`, borderTop: `1px solid ${ACCENT}44`,
              borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                  color: ACCENT, letterSpacing: 3 }}>{"// NUTRITION · " + dayLabel.toUpperCase()}</div>
                {cals > 0 && (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 900,
                    color: surplus === 0 && protMult >= 1.0 ? GREEN : GOLD }}>
                    {Math.round(calcNetXP(100, cals, tdee, prot, protTarget))}% XP
                  </div>
                )}
              </div>
              {cals > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color: MUTED }}>CALORIES</span>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: calColor }}>{cals.toLocaleString()} / {tdee.toLocaleString()}</span>
                  </div>
                  <div style={{ background: DARK1, height: 4, borderRadius: 2 }}>
                    <div style={{ width: `${Math.min(100, cals/tdee*100)}%`, height: "100%",
                      background: `linear-gradient(90deg, ${calColor}66, ${calColor})`, borderRadius: 2 }} />
                  </div>
                </div>
              )}
              {prot > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, fontWeight: 700, color: MUTED }}>PROTEIN</span>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: protColor }}>{prot}g / {protTarget}g</span>
                  </div>
                  <div style={{ background: DARK1, height: 4, borderRadius: 2 }}>
                    <div style={{ width: `${Math.min(100, prot/protTarget*100)}%`, height: "100%",
                      background: `linear-gradient(90deg, ${protColor}66, ${protColor})`, borderRadius: 2 }} />
                  </div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="input-field" type="number"
                    placeholder={cals > 0 ? String(cals) : "Calories"}
                    value={nutInput.cal}
                    onChange={e => setNutInput(n => ({ ...n, cal: e.target.value }))}
                    style={{ flex: 1, fontSize: 13 }} />
                  <input className="input-field" type="number"
                    placeholder={prot > 0 ? prot + "g" : "Protein (g)"}
                    value={nutInput.protein}
                    onChange={e => setNutInput(n => ({ ...n, protein: e.target.value }))}
                    style={{ flex: 1, fontSize: 13 }} />
                </div>
                <button onClick={() => {
                  const cal  = parseInt(nutInput.cal);
                  const pr   = parseInt(nutInput.protein) || 0;
                  if (!cal || cal < 0) return;
                  onLogFood(cal, pr, getSelDayDate());
                  setNutInput({ cal: "", protein: "" });
                  toast("Nutrition saved for " + dayLabel, GREEN);
                }} style={{
                  background: `linear-gradient(90deg, ${ACCENT2}cc, ${ACCENT}33)`,
                  border: `1px solid ${ACCENT}66`, borderTop: `1px solid ${ACCENT}aa`,
                  borderRadius: 8, color: ACCENT, cursor: "pointer",
                  fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
                  letterSpacing: 2, padding: "10px",
                }}>
                  {isPast ? "LOG FOR " + dayLabel.toUpperCase() : "LOG NUTRITION"}
                </button>
                {cals > 0 && (
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                    color: MUTED, textAlign: "center" }}>Tap to update existing entry</div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Logged workouts for selected day */}
        {byDay[selDay].length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                color: ACCENT, letterSpacing: 3 }}>{`// LOGGED · ${DAYS[selDay]}`}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11,
                fontWeight: 700, color: GOLD }}>+{dayXP(selDay).toLocaleString()} XP</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {byDay[selDay].map((w, i) => {
                const mm = MUSCLE_META[w.muscle] || MUSCLE_META[w.exercise?.primary] || MUSCLE_META.chest;
                return (
                  <div key={i} style={{ background: BG2,
                    border: `1px solid ${mm.color}33`,
                    borderLeft: `3px solid ${mm.color}`,
                    borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14,
                          fontWeight: 700, color: TEXT }}>{w.exerciseName}</div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                          color: mm.color }}>{mm.name}</div>
                        {w.exercise?.svgTargets?.length > 0 && (
                          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                            color: MUTED, marginTop: 2 }}>
                            {w.exercise.svgTargets.map(t => MUSCLE_META[t]?.name).filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12,
                          fontWeight: 700, color: GOLD }}>+{w.xp}</span>
                        <button onClick={() => handleEdit(w)} style={{
                          background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`,
                          borderRadius: 5, padding: "4px 9px", cursor: "pointer",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                          color: ACCENT, letterSpacing: 1 }}>EDIT</button>
                        <button onClick={() => handleDelete(w)} style={{
                          background: `${RED}11`, border: `1px solid ${RED}33`,
                          borderRadius: 5, padding: "4px 9px", cursor: "pointer",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                          color: RED, letterSpacing: 1 }}>DEL</button>
                      </div>
                    </div>
                    {w.sets_detail && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                        {w.sets_detail.map((s, si) => (
                          <span key={si} style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                            color: MUTED, background: BG3, padding: "2px 8px", borderRadius: 4 }}>
                            {s.reps}×{wtVal(s.weight)}{wtLabel()}
                          </span>
                        ))}
                      </div>
                    )}
                    {!w.sets_detail && w.sets && (
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                        {w.sets} sets × {w.reps} reps{w.weight ? ` @ ${wtVal(w.weight)}${wtLabel()}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setLogModal({ fromEmpty: true })} style={{
              marginTop: 10, width: "100%",
              background: `${ACCENT}0d`, border: `1px dashed ${ACCENT}44`, borderRadius: 8,
              padding: "10px", cursor: "pointer",
              fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 2
            }}>+ LOG ANOTHER EXERCISE</button>
          </div>
        )}

        {byDay[selDay].length === 0 && (isFree || !todayPlan || todayPlan.rest === false) && !todayPlan?.rest && (
          <div style={{ background: BG2, border: `1px solid ${ACCENT}22`, borderRadius: 10,
            padding: "24px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED,
              marginBottom: 10 }}>Nothing logged for {DAYS[selDay]}</div>
            <button onClick={() => setLogModal({ fromEmpty: true })} style={{
              background: `${ACCENT}18`, border: `1px solid ${ACCENT}44`, borderRadius: 8,
              padding: "9px 20px", cursor: "pointer",
              fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 2
            }}>+ LOG EXERCISE</button>
          </div>
        )}

        {/* FINISH SESSION — only on today, only when sessionLog has items */}
        {selDay === todayIdx && sessionLog.length > 0 && (
          <button onClick={() => setFinishModalOpen(true)} style={{
            width: "100%", marginTop: 14,
            background: `linear-gradient(90deg, ${GOLD}22, ${GOLD}11)`,
            border: `1px solid ${GOLD}66`, borderRadius: 10,
            padding: "12px 14px", cursor: "pointer",
            fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>FINISH SESSION ▶</span>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, opacity: 0.85 }}>
              {sessionLog.length} ex · +{sessionLog.reduce((s,l)=>s+(l.xp||0),0)} XP
            </span>
          </button>
        )}

        {/* Weekly XP summary */}
        <div style={{ marginTop: 20, background: BG2, border: `1px solid ${GOLD}22`,
          borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD,
            letterSpacing: 3, marginBottom: 10 }}>{"// WEEK SUMMARY"}</div>
          <div style={{ display: "flex", gap: 4 }}>
            {DAYS.map((d, i) => {
              const xp = dayXP(i);
              const max = Math.max(...DAYS.map((_,j) => dayXP(j)), 1);
              const h = Math.max(4, Math.round((xp / max) * 40));
              const isToday = i === todayIdx;
              return (
                <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3 }}>
                  <div style={{ width: "100%", height: 40, display: "flex",
                    alignItems: "flex-end", justifyContent: "center" }}>
                    <div style={{ width: "70%", height: h,
                      background: xp > 0 ? `linear-gradient(180deg, ${GOLD}, ${GOLD}88)` : BG3,
                      borderRadius: 2, transition: "height .4s" }} />
                  </div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 7,
                    color: isToday ? GOLD : MUTED }}>{d}</div>
                  {xp > 0 && (
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8,
                      color: GOLD }}>{xp}</div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
              {DAYS.reduce((s,_,i) => s + (byDay[i].length > 0 ? 1 : 0), 0)} training days
            </span>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12,
              fontWeight: 700, color: GOLD }}>{weekXP.toLocaleString()} XP total</span>
          </div>
        </div>
      </div>

      {/* Log modal — from empty day or plan */}
      {(logModal || editEntry) && (() => {
        const modal = logModal || editEntry;
        if (modal.fromEmpty) {
          // Show muscle picker then exercise
          return (
            createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1100,
              background: "rgba(7,11,20,0.93)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              paddingBottom: "96px" }}
              onClick={() => { setLogModal(null); setEditEntry(null); }}>
              <div onClick={e => e.stopPropagation()} className="slide-up" style={{
                background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`,
                border: `1px solid ${ACCENT}55`, borderTop: `2px solid ${ACCENT}`,
                width: "100%", maxWidth: 480, padding: "20px 20px 20px",
                clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
              }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: ACCENT,
                  letterSpacing: 2, marginBottom: 14 }}>LOG EXERCISE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["chest","back","shoulders","bicep","tricep","forearms","legs","glutes","calves","core","cardio"].map(m => {
                    const mm = MUSCLE_META[m]; if (!mm) return null;
                    return (
                      <button key={m} onClick={() => {
                        const exs = EXERCISE_DB[m] || [];
                        if (exs.length) setLogModal({ exercise: exs[0], muscle: m, pickExercise: true, muscleKey: m });
                      }} style={{
                        background: `${mm.color}18`, border: `1px solid ${mm.color}44`,
                        borderRadius: 20, padding: "6px 12px", cursor: "pointer",
                        fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
                        fontWeight: 700, color: mm.color
                      }}>{mm.name}</button>
                    );
                  })}
                </div>
              </div>
            </div>, document.body)
          );
        }
        if (modal.pickExercise) {
          const mm = MUSCLE_META[modal.muscleKey] || MUSCLE_META.chest;
          const allExs = [
            ...(EXERCISE_DB[modal.muscleKey] || []),
            ...(st.customExercises||[]).filter(e => e.primary === modal.muscleKey)
          ].slice().sort((a,b) => a.name.localeCompare(b.name));
          const exPickSearch = modal.exSearch || "";
          const visibleExs = exPickSearch.trim()
            ? allExs.filter(e => e.name.toLowerCase().includes(exPickSearch.toLowerCase()))
            : allExs;
          return (
            createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1100,
              background: "rgba(7,11,20,0.93)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              paddingBottom: "96px" }}
              onClick={() => { setLogModal(null); setEditEntry(null); }}>
              <div onClick={e => e.stopPropagation()} className="slide-up" style={{
                background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`,
                border: `1px solid ${mm.color}55`, borderTop: `2px solid ${mm.color}`,
                width: "100%", maxWidth: 480, padding: "20px 20px 36px", maxHeight: "75vh",
                overflowY: "auto", WebkitOverflowScrolling: "touch",
                clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: mm.color,
                    letterSpacing: 2 }}>{mm.name.toUpperCase()}</div>
                  <button onClick={() => setLogModal({ fromEmpty: true, targetDate: getSelDayDate() })}
                    style={{ background: "none", border: "none", color: MUTED,
                      cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 11 }}>← BACK</button>
                </div>
                {/* Search bar */}
                <input className="input-field"
                  value={exPickSearch}
                  onChange={e => setLogModal(m => ({ ...m, exSearch: e.target.value }))}
                  placeholder="Search exercises..."
                  style={{ marginBottom: 10 }}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {visibleExs.length === 0 && (
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                      color: MUTED, textAlign: "center", padding: 20 }}>No exercises found</div>
                  )}
                  {visibleExs.map((ex, i) => {
                    const diffColor = { beginner: GREEN, intermediate: ACCENT, advanced: GOLD, elite: RED }[ex.diff];
                    return (
                      <button key={i} onClick={() => setLogModal({ exercise: ex, muscle: modal.muscleKey })}
                        style={{ background: BG2, border: `1px solid ${mm.color}33`,
                          borderLeft: `3px solid ${mm.color}`, borderRadius: 8,
                          padding: "10px 14px", cursor: "pointer", textAlign: "left",
                          display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                          fontWeight: 700, color: TEXT }}>{ex.name}</span>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                            color: diffColor, background: `${diffColor}22`,
                            padding: "2px 7px", borderRadius: 6, letterSpacing: 1 }}>
                            {ex.diff?.toUpperCase()}
                          </span>
                          {ex.angle && (
                            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                              color: GOLD, background: `${GOLD}15`,
                              padding: "2px 7px", borderRadius: 6, letterSpacing: 0.5 }}>
                              {ex.angle}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>, document.body)
          );
        }
        return (
          <ExerciseLogModal
            exercise={modal.exercise}
            muscle={modal.muscle}
            weightLbs={st.weightLbs || 170}
            profile={st}
            editingEntry={modal.originalEntry || null}
            onConfirm={data => {
              // Use the selected day's date, not today
              const entryDate = modal.targetDate || getDayDate(selDay);
              onLogExercise({ exerciseName: modal.exercise.name, muscle: modal.muscle,
                exercise: modal.exercise, sets: data.sets, reps: data.reps,
                weight: data.weight, sets_detail: data.sets_detail,
                newE1RM: data.newE1RM, isPR: data.isPR, xp: data.xp, cals: data.cals, cardioData: data.cardioData,
                date: entryDate });
              // If editing, unlog the original entry first
              if (modal.originalEntry) onUnlogExercise(modal.originalEntry);
              if (!modal.originalEntry && selDay === todayIdx) {
                const prevE1RM = (st.prs || {})[modal.exercise.name] || null;
                setSessionLog(s => [...s, {
                  name: modal.exercise.name, muscle: modal.muscle,
                  xp: data.xp, sets: data.sets, reps: data.reps, weight: data.weight,
                  isPR: data.isPR, newE1RM: data.newE1RM, prevE1RM, date: Date.now(),
                }]);
                if (sessionStart == null) setSessionStart(Date.now());
              }
              setLogModal(null); setEditEntry(null);
              const dayLabel2 = selDay === todayIdx ? "today" : DAYS[selDay];
              toast(`${modal.exercise.name} logged for ${dayLabel2}! +${data.xp} XP`, GOLD);
            }}
            onClose={() => { setLogModal(null); setEditEntry(null); }}
          />
        );
      })()}

      {finishModalOpen && (
        <WorkoutFinishModal
          sessionLog={sessionLog}
          sessionStart={sessionStart}
          onClose={() => setFinishModalOpen(false)}
          onComplete={() => {
            setSessionLog([]);
            setSessionStart(null);
            setFinishModalOpen(false);
            toast("Session complete · well fought", GOLD);
          }}
        />
      )}

      {/* Randomizer muscle picker */}
      {randoMode && (
        createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1100, background: "rgba(7,11,20,0.93)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: "96px" }}
          onClick={() => setRandoMode(false)}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{
            background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`,
            border: `1px solid ${GOLD}55`, borderTop: `2px solid ${GOLD}`,
            width: "100%", maxWidth: 480, padding: "24px 20px 36px",
            clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
          }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700,
              color: GOLD, letterSpacing: 2, marginBottom: 4 }}>RANDOM WORKOUT</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, marginBottom: 12 }}>
              Pick which muscles to train. Builds the optimal hypertrophy session.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {randoMuscles.map(m => { const mm = MUSCLE_META[m]; return (
                  <span key={m} style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                    fontWeight: 700, color: mm?.color, background: `${mm?.color}22`,
                    border: `1px solid ${mm?.color}66`, padding: "3px 10px", borderRadius: 6 }}>{mm?.name}</span>
                );})}
                {!randoMuscles.length && <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>None selected</span>}
              </div>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                color: randoMuscles.length ? ACCENT : MUTED }}>{randoMuscles.length} selected</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {["chest","back","shoulders","bicep","tricep","forearms","legs","glutes","calves","core","cardio"].map(m => {
                const mm = MUSCLE_META[m]; if (!mm) return null;
                const isSel = randoMuscles.includes(m);
                const lastW = (st.workouts||[]).filter(w => w.muscle===m||w.exercise?.primary===m);
                const lastDate = lastW.length ? new Date(Math.max(...lastW.map(w=>w.date||0))) : null;
                const daysSince = lastDate ? Math.floor((Date.now()-lastDate)/86400000) : null;
                return (
                  <button key={m} onClick={() => toggleRandoMuscle(m)} style={{
                    background: isSel ? `${mm.color}28` : `${mm.color}0a`,
                    border: `1px solid ${isSel ? mm.color : mm.color+"44"}`,
                    borderLeft: `3px solid ${isSel ? mm.color : mm.color+"55"}`,
                    borderRadius: 8, padding: "10px 12px", cursor: "pointer",
                    textAlign: "left", position: "relative", transition: "all .15s"
                  }}>
                    {isSel && <div style={{ position: "absolute", top: 6, right: 8,
                      fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: mm.color, fontWeight: 900 }}>✓</div>}
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
                      color: isSel ? mm.color : MUTED, letterSpacing: 1, marginBottom: 3 }}>{mm.name.toUpperCase()}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>
                      {daysSince===null?"Never trained":daysSince===0?"Today":daysSince===1?"1 day ago":`${daysSince}d ago`}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Difficulty filter */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
                letterSpacing: 3, marginBottom: 8 }}>DIFFICULTY</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { val: "all",          label: "ALL" },
                  { val: "beginner",     label: "BEGINNER" },
                  { val: "intermediate", label: "INTERMEDIATE" },
                  { val: "advanced",     label: "ADVANCED" },
                  { val: "elite",        label: "ELITE" },
                ].map(({ val, label }) => {
                  const isActive = randoDiff === val;
                  const diffColors = { all: ACCENT, beginner: GREEN, intermediate: GOLD, advanced: "#ff8844", elite: "#ff3344" };
                  const col = diffColors[val] || ACCENT;
                  return (
                    <button key={val} onClick={() => setRandoDiff(val)} style={{
                      flex: 1, padding: "6px 2px", cursor: "pointer",
                      background: isActive ? `${col}22` : BG3,
                      border: `1px solid ${isActive ? col : MUTED + "33"}`,
                      borderRadius: 6,
                      fontFamily: "'Orbitron',sans-serif", fontSize: 6, fontWeight: 700,
                      color: isActive ? col : MUTED, letterSpacing: 0.5,
                      transition: "all .15s",
                      boxShadow: isActive ? `0 0 8px ${col}44` : "none",
                    }}>{label}</button>
                  );
                })}
              </div>
              {randoDiff !== "all" && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
                  marginTop: 6, letterSpacing: 1 }}>
                  {randoDiff === "beginner" ? "Foundation movements — safe for all levels" :
                   randoDiff === "intermediate" ? "Progressive overload focus — solid technique required" :
                   randoDiff === "advanced" ? "High intensity — strong base needed" :
                   "Maximum stimulus — for experienced athletes only"}
                </div>
              )}
            </div>
            <button onClick={runRandomizer} disabled={!randoMuscles.length} style={{
              width: "100%", padding: "13px", marginBottom: 8,
              cursor: randoMuscles.length ? "pointer" : "not-allowed",
              background: randoMuscles.length ? `linear-gradient(90deg, ${GOLD}33, ${GOLD}22)` : DARK1,
              border: `1px solid ${randoMuscles.length ? GOLD+"88" : MUTED+"33"}`,
              clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
              fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700,
              color: randoMuscles.length ? GOLD : MUTED, letterSpacing: 3,
              opacity: randoMuscles.length ? 1 : 0.5 }}>GENERATE WORKOUT</button>
            <button onClick={() => { setRandoMode(false); setRandoMuscles([]); }} style={{
              width: "100%", background: "none", border: `1px solid ${MUTED}33`,
              borderRadius: 8, padding: "10px", cursor: "pointer",
              fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>CANCEL</button>
          </div>
        </div>, document.body)
      )}
    </div>
  );
}



function ProgramScreen({ st, onSelectProgram, setScreen, toast }) {
  const programs = st.gender === "female" ? FEMALE_PROGRAMS : MALE_PROGRAMS;
  const [expanded, setExpanded] = useState(null);

  const FREE_PROGRAM = {
    id: "free", name: "Free Workout", icon: "⬡", color: ACCENT,
    athlete: "No structure", era: "Any time",
    desc: "Log whatever you want, whenever you want. Full XP still applies.",
    days: Array.from({ length: 7 }, (_, i) => ({
      label: ["MON","TUE","WED","THU","FRI","SAT","SUN"][i],
      rest: false, free: true, exercises: []
    }))
  };
  const allPrograms = [FREE_PROGRAM, ...programs];

  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: "transparent", padding: "20px 20px calc(120px + env(safe-area-inset-bottom, 0px))", paddingTop: "20px" }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700,
        color: GOLD, letterSpacing: 2, marginBottom: 4 }}>PROGRAMS</div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED,
        letterSpacing: 2, marginBottom: 20 }}>SELECT YOUR TRAINING REGIME</div>

      {st.program && (
        <button onClick={() => setScreen("schedule")} style={{
          width: "100%", background: `${GREEN}11`, border: `1px solid ${GREEN}44`, borderRadius: 10,
          padding: "12px 14px", marginBottom: 16, fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
          color: GREEN, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span>ACTIVE: {allPrograms.find(p => p.id === st.program)?.name}</span>
          <span style={{ fontSize: 11, color: ACCENT, letterSpacing: 1 }}>VIEW SCHEDULE</span>
        </button>
      )}

      {allPrograms.map(p => (
        <div key={p.id} className="card" style={{ marginBottom: 12, overflow: "hidden",
          border: `1px solid ${st.program === p.id ? p.color + "66" : ACCENT2 + "33"}` }}>
          <button onClick={() => setExpanded(expanded === p.id ? null : p.id)} style={{
            background: "none", border: "none", width: "100%", cursor: "pointer",
            padding: "14px 14px", display: "flex", gap: 12, alignItems: "center", textAlign: "left"
          }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900,
              color: p.color, letterSpacing: 2, minWidth: 36, textAlign: "center",
              textShadow: `0 0 12px ${p.color}66` }}>{p.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700,
                color: p.color, letterSpacing: 1, marginBottom: 2 }}>{p.name}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
                {p.athlete} · {p.era}
              </div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginTop: 2 }}>
                {p.desc}
              </div>
            </div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 16, color: MUTED }}>
              {expanded === p.id ? "▲" : "▼"}
            </div>
          </button>

          {expanded === p.id && (
            <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${ACCENT2}22`, paddingTop: 12 }}>
              {!p.free && (
                <>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
                    letterSpacing: 3, marginBottom: 8 }}>WEEKLY OVERVIEW</div>
                  {p.days.map((day, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                        color: ACCENT, minWidth: 28 }}>{["MON","TUE","WED","THU","FRI","SAT","SUN"][i]}</span>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
                        color: day.rest ? MUTED : TEXT }}>{day.label}</span>
                      {!day.rest && (
                        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                          · {day.exercises.length} exercises
                        </span>
                      )}
                    </div>
                  ))}
                </>
              )}
              {p.free && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, marginBottom: 12 }}>
                  No fixed schedule. Head to the Workout tab to log any exercise any day.
                  All XP, PRs, and muscle levels apply normally.
                </div>
              )}
              <button className="btn-primary" onClick={() => {
                onSelectProgram(p.id);
                toast(`${p.name} activated!`, GREEN);
                setTimeout(() => setScreen("schedule"), 600);
              }} style={{ width: "100%", padding: "12px", fontSize: 13, letterSpacing: 2, marginTop: p.free ? 0 : 14 }}>
                {st.program === p.id ? "ACTIVE — VIEW SCHEDULE" : "SELECT PROGRAM"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}



function StatBadge({ muscle, level, xp }) {
  const meta = MUSCLE_META[muscle] || MUSCLE_META.chest;
  const { current, needed } = getMuscleProgress(xp);
  const rank = getRank(level);
  return (
    <div style={{
      background: `linear-gradient(90deg, ${meta.color}08, ${DARK1})`,
      border: `1px solid ${meta.color}44`, borderLeft: `2px solid ${meta.color}`,
      padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
      clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
      position: "relative"
    }}>
      <MuscleIcon muscle={muscle} size={26} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700, color: meta.color, letterSpacing: 2, textShadow: `0 0 8px ${meta.color}` }}>{meta.name.toUpperCase()}</span>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: rank.color, fontWeight: 900, textShadow: `0 0 10px ${rank.color}` }}>{rank.rank}</span>
        </div>
        <XPBar current={current} needed={needed} color={meta.color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 1 }}>LVL {level}</span>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
        </div>
      </div>
    </div>
  );
}


// Cumulative XP for a life attribute, summed from the ledger.
function mindStatXP(profile, stat) {
  return (profile?.mindLog || []).reduce((sum, e) => e.stat === stat ? sum + (e.xp || 0) : sum, 0);
}

// Mind & Spirit XP feeds the overall Hunter rank at half weight — growth of
// the whole person moves the same bar the gym does, without a reading day
// outranking a squat day. Per-entry rounding keeps incremental updates
// identical to the from-scratch rebuild on load.
const MIND_OVERALL_WEIGHT = 0.5;
function mindOverallBonus(mindLog) {
  return (mindLog || []).reduce((s, e) => s + Math.round((e.xp || 0) * MIND_OVERALL_WEIGHT), 0);
}

const _LN2 = Math.log(2);
function atrophyParams(statKey) { return statKey === "cardio" ? ATROPHY.cardio : ATROPHY.muscular; }
// Decay condition c across a rest gap (grace days are free).
function decayCondition(c, gapDays, prm) {
  const d = Math.max(0, gapDays - prm.grace);
  if (d <= 0) return c;
  return prm.floor + (c - prm.floor) * Math.exp(-_LN2 * d / prm.halfLife);
}
// Fold a muscle's chronological XP events into (earned × final condition).
function atrophyState(events, prm) {
  const xp = atrophiedXP(events, prm);
  if (!events || events.length === 0) return { xp: 0, earned: 0, condition: 1, last: null };
  const earned = events.reduce((s, e) => s + (e.xp || 0), 0);
  const sorted = [...events].sort((a, b) => (a.date || 0) - (b.date || 0));
  let c = 1, last = null;
  for (const e of sorted) {
    if (last != null) {
      const gapDays = (e.date - last) / 86400000;
      if (gapDays > 0.25) {
        c = decayCondition(c, gapDays, prm);
        const share = Math.min(1, Math.max(0, e.share == null ? 1 : e.share));
        c = c + ATROPHY.REGAIN * share * (1 - c);
      }
    }
    last = e.date || last;
  }
  if (last != null) c = decayCondition(c, (Date.now() - last) / 86400000, prm);
  return { xp, earned, condition: c, last };
}

// Where condition lands after `extraDays` more rest, accounting for any grace
// window still unspent.
function projectCondition(c, daysIdle, extraDays, prm) {
  const decayedSoFar = Math.max(0, daysIdle - prm.grace);
  const decayedThen  = Math.max(0, daysIdle + extraDays - prm.grace);
  const add = decayedThen - decayedSoFar;
  if (add <= 0) return c;
  return prm.floor + (c - prm.floor) * Math.exp(-_LN2 * add / prm.halfLife);
}

// Plain-language state for a muscle's condition.
function conditionStatus(c) {
  if (c >= 0.995) return { label: "FRESH",     color: GREEN };
  if (c >= 0.95)  return { label: "HOLDING",   color: GREEN };
  if (c >= 0.85)  return { label: "SLIPPING",  color: GOLD };
  if (c >= 0.65)  return { label: "FADING",    color: "#ff8c42" };
  return { label: "DETRAINED", color: RED };
}

function atrophiedXP(events, prm) {
  if (!events || events.length === 0) return 0;
  const sorted = [...events].sort((a, b) => (a.date || 0) - (b.date || 0));
  let earned = 0, c = 1, last = null;
  for (const e of sorted) {
    if (last != null) {
      const gapDays = (e.date - last) / 86400000;
      // Only a DISTINCT session (>6h later) decays and then regains — EMG
      // splits emit several same-timestamp events for one workout, and a
      // single session must not stack the muscle-memory bonus.
      if (gapDays > 0.25) {
        c = decayCondition(c, gapDays, prm);
        const share = Math.min(1, Math.max(0, e.share == null ? 1 : e.share));
        c = c + ATROPHY.REGAIN * share * (1 - c);
      }
    }
    earned += e.xp || 0;
    last = e.date || last;
  }
  if (last != null) c = decayCondition(c, (Date.now() - last) / 86400000, prm);
  return Math.round(earned * c);
}

// XP a given activity + quantity is worth.
function activityXP(activity, qty) {
  if (activity.flat != null) return activity.flat;
  return Math.max(1, Math.round((activity.xpPer || 0) * (qty || activity.defaultQty || 1)));
}

// Whether a faith activity is an obligation (farḍ) rather than voluntary.
function isFardActivity(stat, activityId) {
  if (stat !== "faith") return false;
  return !!MIND_ACTIVITIES.faith.find(a => a.id === activityId)?.fard;
}

// Logging modal: pick attribute → tap an activity → (optional) set quantity → log.
function MindLogModal({ profile, settings, onUpdateSettings, onLog, onAddTask, onRemoveTask, onClose }) {
  const [stat, setStat] = useState("intelligence");
  const [qty, setQty]   = useState({});         // { activityId: number }
  const [customLabel, setCustomLabel] = useState("");
  const meta = MUSCLE_META[stat];
  const includeFard = settings?.faithScope === "all";
  const acts = MIND_ACTIVITIES[stat].filter(a => stat !== "faith" || includeFard || !a.fard);

  const buildEntry = (activity) => {
    const q = activity.unit ? (qty[activity.id] || activity.defaultQty || 1) : null;
    const label = activity.custom
      ? (customLabel.trim() || (stat === "faith" ? "Good deed" : "Learning"))
      : activity.label + (activity.unit ? ` · ${q} ${activity.unit}` : "");
    return { stat, activity: activity.id, label, qty: q, xp: activityXP(activity, q) };
  };

  const doLog = (activity) => {
    onLog({ id: `${Date.now()}_${Math.round(profile?.mindLog?.length || 0)}`,
      date: Date.now(), ...buildEntry(activity) });
  };

  // A pinned daily task matching this activity (custom tasks match on label too)
  const pinnedTask = (activity) => (profile?.mindTasks || []).find(t =>
    t.stat === stat && t.activity === activity.id &&
    (!activity.custom || t.label === (customLabel.trim() || (stat === "faith" ? "Good deed" : "Learning"))));

  const togglePin = (activity) => {
    const existing = pinnedTask(activity);
    if (existing) onRemoveTask?.(existing.id);
    else onAddTask?.({ id: `t_${Date.now()}`, ...buildEntry(activity) });
  };

  return (
    createPortal(<div onClick={onClose} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1200,
      background: "rgba(3,6,15,0.94)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 96 }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
        border: `1px solid ${meta.color}44`, borderTop: `2px solid ${meta.color}`,
        width: "100%", maxWidth: 480, maxHeight: "82dvh", display: "flex", flexDirection: "column",
        clipPath: "polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${meta.color}cc, transparent)` }} />
        <div style={{ padding: "18px 18px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700,
              color: meta.color, letterSpacing: 2 }}>LOG MIND & SPIRIT</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
          </div>
          {/* Attribute tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["intelligence", "faith"].map(s => {
              const m = MUSCLE_META[s]; const on = stat === s;
              const lvl = getMuscleLevel(mindStatXP(profile, s));
              return (
                <button key={s} onClick={() => setStat(s)} style={{
                  flex: 1, padding: "10px", cursor: "pointer",
                  background: on ? `${m.color}22` : BG3,
                  border: `1px solid ${on ? m.color : ACCENT2 + "33"}`, borderRadius: 8,
                  fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700,
                  color: on ? m.color : MUTED, letterSpacing: 1,
                }}>{m.name.toUpperCase()} · LVL {lvl}</button>
              );
            })}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "0 18px 24px" }}>
          {stat === "faith" && (
            <div onClick={() => onUpdateSettings?.({ faithScope: includeFard ? "sunnah" : "all" })} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 12px", marginBottom: 10, cursor: "pointer",
              background: BG3, border: `1px solid ${includeFard ? meta.color : MUTED + "33"}`, borderRadius: 8,
            }}>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700, color: TEXT }}>
                  Include obligatory (farḍ) acts
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                  Off = only voluntary (sunnah) deeds earn XP
                </div>
              </div>
              <div style={{ width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                background: includeFard ? meta.color : MUTED + "44",
                border: `1px solid ${includeFard ? meta.color + "88" : MUTED + "44"}`,
                position: "relative", transition: "all .2s" }}>
                <div style={{ position: "absolute", top: 2, left: includeFard ? 18 : 2,
                  width: 14, height: 14, borderRadius: "50%",
                  background: includeFard ? "#fff" : MUTED, transition: "left .2s" }} />
              </div>
            </div>
          )}
          {acts.map(a => {
            const q = a.unit ? (qty[a.id] ?? a.defaultQty ?? 1) : null;
            const xp = activityXP(a, q);
            return (
              <div key={a.id} style={{ background: BG3, border: `1px solid ${meta.color}22`,
                borderLeft: `3px solid ${meta.color}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, fontWeight: 700, color: TEXT }}>{a.label}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: meta.color }}>+{xp.toLocaleString()} XP{a.hasanatPer ? ` · ≈${((q || 1) * a.hasanatPer).toLocaleString()} ḥasanāt` : ""}</div>
                    {a.note && (
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 1, lineHeight: 1.3 }}>{a.note}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                    {(() => { const pinned = !!pinnedTask(a); return (
                      <button onClick={() => togglePin(a)}
                        title={pinned ? "Remove from daily tasks" : "Pin as daily task"} style={{
                        width: 34, height: 34, background: pinned ? `${GOLD}22` : "transparent",
                        border: `1px solid ${pinned ? GOLD : MUTED + "44"}`, borderRadius: 7,
                        cursor: "pointer", fontSize: 15, lineHeight: 1,
                        color: pinned ? GOLD : MUTED }}>{pinned ? "★" : "☆"}</button>
                    ); })()}
                    <button onClick={() => doLog(a)} style={{
                      background: `${meta.color}22`, border: `1px solid ${meta.color}66`,
                      borderTop: `1px solid ${meta.color}cc`,
                      clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                      padding: "8px 16px", cursor: "pointer",
                      fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
                      color: meta.color, letterSpacing: 1 }}>LOG</button>
                  </div>
                </div>
                {/* Quantity stepper for unit-based activities */}
                {a.unit && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <button onClick={() => setQty(s => ({ ...s, [a.id]: Math.max(1, (s[a.id] ?? a.defaultQty ?? 1) - 1) }))}
                      style={{ width: 28, height: 28, background: BG2, border: `1px solid ${MUTED}44`, borderRadius: 6,
                        color: TEXT, fontSize: 16, cursor: "pointer" }}>−</button>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: TEXT, minWidth: 54, textAlign: "center" }}>{q} {a.unit}</span>
                    <button onClick={() => setQty(s => ({ ...s, [a.id]: (s[a.id] ?? a.defaultQty ?? 1) + 1 }))}
                      style={{ width: 28, height: 28, background: BG2, border: `1px solid ${MUTED}44`, borderRadius: 6,
                        color: TEXT, fontSize: 16, cursor: "pointer" }}>+</button>
                  </div>
                )}
                {/* Custom label field */}
                {a.custom && (
                  <input className="input-field" value={customLabel} onChange={e => setCustomLabel(e.target.value)}
                    placeholder={stat === "faith" ? "What did you do? (e.g. helped a neighbor)" : "What did you do? (e.g. documentary, chess)"}
                    maxLength={40} style={{ marginTop: 8, fontSize: 13 }} />
                )}
              </div>
            );
          })}
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, lineHeight: 1.5, marginTop: 4 }}>
            {stat === "faith"
              ? "Points reward consistency and effort — they are not a measure of spiritual worth."
              : "Log anything you feel sharpens your mind. Effort scales the XP."}
            {" "}Mind & Spirit XP also feeds your overall Hunter rank at half weight.
          </div>
        </div>
      </div>
    </div>, document.body)
  );
}

// Home card: Intelligence + Faith badges, the daily task checklist, and the log modal.
function MindSpiritCard({ profile, settings, onUpdateSettings, onLogMind, onAddTask, onRemoveTask, onToggleTask }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ background: `linear-gradient(135deg, ${BG2}f0, ${DARK1}e8)`,
        border: `1px solid #8b8cf644`, borderTop: `1px solid #8b8cf699`,
        clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
        padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: "#8b8cf6", letterSpacing: 3 }}>{"// MIND & SPIRIT"}</div>
          <button onClick={() => setOpen(true)} style={{
            background: "#8b8cf622", border: "1px solid #8b8cf666", borderRadius: 6,
            padding: "5px 12px", cursor: "pointer",
            fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: "#a5a6ff", fontWeight: 700, letterSpacing: 1 }}>+ LOG</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {["intelligence", "faith"].map(s => (
            <StatBadge key={s} muscle={s} level={getMuscleLevel(mindStatXP(profile, s))} xp={mindStatXP(profile, s)} />
          ))}
        </div>

        {/* Daily task checklist — pinned via ☆ in the logger, resets each day */}
        {(() => {
          const includeFard = settings?.faithScope === "all";
          const tasks = (profile?.mindTasks || []).filter(t => includeFard || !isFardActivity(t.stat, t.activity));
          const todayKey = _dateKey(new Date());
          const doneToday = new Set((profile?.mindTasksLog || {})[todayKey] || []);
          if (tasks.length === 0) return (
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginTop: 10 }}>
              Tap <span style={{ color: "#a5a6ff", fontWeight: 700 }}>+ LOG</span> and pin activities with ☆ to build your daily task list.
            </div>
          );
          const doneCount = tasks.filter(t => doneToday.has(t.id)).length;
          return (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: "#8b8cf6", letterSpacing: 3 }}>{"// TODAY'S TASKS"}</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: doneCount === tasks.length ? GOLD : MUTED }}>
                  {doneCount}/{tasks.length}
                </div>
              </div>
              {tasks.map(t => {
                const m = MUSCLE_META[t.stat];
                const done = doneToday.has(t.id);
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 4px", borderBottom: `1px solid ${ACCENT2}11` }}>
                    <div onClick={() => onToggleTask?.(t.id)} className={done ? "check-pop" : ""} style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0, cursor: "pointer",
                      background: done ? m.color : "transparent",
                      border: `1.5px solid ${done ? m.color : MUTED}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: BG, fontSize: 12, fontWeight: 900,
                    }}>{done ? "✓" : ""}</div>
                    <span onClick={() => onToggleTask?.(t.id)} style={{
                      fontFamily: "'Rajdhani',sans-serif", fontSize: 13, cursor: "pointer",
                      color: done ? MUTED : TEXT,
                      textDecoration: done ? "line-through" : "none", flex: 1, minWidth: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{t.label}</span>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: m.color, flexShrink: 0 }}>+{t.xp}</span>
                    <button onClick={() => onRemoveTask?.(t.id)} title="Remove task" style={{
                      background: "none", border: "none", color: MUTED, fontSize: 14,
                      cursor: "pointer", padding: "0 2px", flexShrink: 0, opacity: 0.6 }}>×</button>
                  </div>
                );
              })}
              {doneCount === tasks.length && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: GOLD, marginTop: 8, textAlign: "center" }}>
                  ✦ All tasks complete. Well done.
                </div>
              )}
            </div>
          );
        })()}
      </div>
      {open && <MindLogModal profile={profile} settings={settings} onUpdateSettings={onUpdateSettings}
        onLog={(entry) => onLogMind?.(entry)}
        onAddTask={onAddTask} onRemoveTask={onRemoveTask} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toasts({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1300, display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: `linear-gradient(90deg, ${DARK1}f8, ${BG2}f0)`,
          border: `1px solid ${t.color}88`,
          borderLeft: `3px solid ${t.color}`,
          borderRadius: 0,
          clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
          padding: "10px 16px",
          fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 2,
          color: t.color, fontWeight: 700,
          boxShadow: `0 0 20px ${t.color}33, inset 0 0 20px ${t.color}0a`,
          animation: "toastIn .25s cubic-bezier(0.16,1,0.3,1)",
          textShadow: `0 0 8px ${t.color}`,
          position: "relative",
        }}>
          <span style={{ fontSize: 9, letterSpacing: 3, color: t.color, opacity: 0.7, display: "block", marginBottom: 2 }}>[ SYSTEM ]</span>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── NAV BAR ──────────────────────────────────────────────────────────────────

function NavBar({ screen, setScreen, overallLevel, settings, pendingCount = 0 }) {
  const NAV_ICONS = {
    leaderboard: (c) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="11" width="3.8" height="6" fill={c} opacity="0.6"/>
        <rect x="8.1"  y="6"  width="3.8" height="11" fill={c}/>
        <rect x="13.7" y="9"  width="3.8" height="8" fill={c} opacity="0.85"/>
        <polygon points="10,2 10.7,3.4 12.2,3.6 11.1,4.7 11.4,6.2 10,5.5 8.6,6.2 8.9,4.7 7.8,3.6 9.3,3.4" fill={c}/>
      </svg>
    ),
    friends: (c) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <circle cx="7.5" cy="6" r="2.5" stroke={c} strokeWidth="1.5"/>
        <path d="M2 17c0-3.04 2.46-5.5 5.5-5.5S13 13.96 13 17" stroke={c} strokeWidth="1.5"/>
        <circle cx="14" cy="6.5" r="2" stroke={c} strokeWidth="1.3" opacity="0.7"/>
        <path d="M13.5 11.6c1.9.4 3.5 2.1 3.5 4.4" stroke={c} strokeWidth="1.3" opacity="0.7"/>
      </svg>
    ),
    menu: (c) => (
      <svg width="28" height="28" viewBox="0 0 20 20" fill="none">
        <polygon points="10,2 18,7 18,13 10,18 2,13 2,7" stroke={c} strokeWidth="1.5" fill="none"/>
        <line x1="6" y1="10" x2="14" y2="10" stroke={c} strokeWidth="1.5"/>
        <line x1="10" y1="6" x2="10" y2="14" stroke={c} strokeWidth="1.5"/>
      </svg>
    ),
    schedule: (c) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="13" rx="1.5" stroke={c} strokeWidth="1.5"/>
        <line x1="6" y1="2" x2="6" y2="6" stroke={c} strokeWidth="1.5"/>
        <line x1="14" y1="2" x2="14" y2="6" stroke={c} strokeWidth="1.5"/>
        <line x1="2" y1="8" x2="18" y2="8" stroke={c} strokeWidth="1.2"/>
        <rect x="5" y="11" width="3" height="3" rx="0.5" fill={c}/>
        <rect x="12" y="11" width="3" height="3" rx="0.5" fill={c} opacity="0.5"/>
      </svg>
    ),
    database: (c) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <ellipse cx="10" cy="5" rx="7" ry="2.5" stroke={c} strokeWidth="1.5"/>
        <path d="M3 5v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V5" stroke={c} strokeWidth="1.5"/>
        <path d="M3 9v4c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V9" stroke={c} strokeWidth="1.5"/>
      </svg>
    ),
    character: (c) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="6" r="3.5" stroke={c} strokeWidth="1.5"/>
        <path d="M3 18c0-3.87 3.13-7 7-7s7 3.13 7 7" stroke={c} strokeWidth="1.5"/>
      </svg>
    ),
    program: (c) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="1.5" stroke={c} strokeWidth="1.5"/>
        <line x1="6" y1="7" x2="14" y2="7" stroke={c} strokeWidth="1.2"/>
        <line x1="6" y1="10" x2="14" y2="10" stroke={c} strokeWidth="1.2"/>
        <line x1="6" y1="13" x2="10" y2="13" stroke={c} strokeWidth="1.2"/>
      </svg>
    ),
  };

  const TABS = [
    { id: "character", label: themeLabel(settings, "hunter", "Hunter") },
    { id: "program",   label: "Program" },
    { id: "menu",      label: "Home" },
    { id: "schedule",  label: themeLabel(settings, "schedule", "Schedule") },
    { id: "database",  label: themeLabel(settings, "database", "Database") },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000,
      background: `linear-gradient(180deg, ${DARK1}ee, ${BG2}ff)`,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderTop: `1px solid ${ACCENT}44`,
      boxShadow: `0 -4px 24px ${ACCENT}18`,
      display: "flex", alignItems: "stretch",
      paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
      WebkitTransform: "translateZ(0)",
    }}>
      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${ACCENT}88 25%, ${ACCENT} 50%, ${ACCENT}88 75%, transparent)`,
      }} />

      {TABS.map(({ id, label, badge }) => {
        const active = screen === id;
        const c = active ? ACCENT : MUTED;
        const isHome = id === "menu";
        return (
          <button
            key={id}
            onClick={() => setScreen(id)}
            className={`nav-tab ${active ? "is-active" : ""}`}
            style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 4,
              padding: "10px 0 14px",
              background: isHome && active
                ? `linear-gradient(180deg, ${ACCENT}1f, transparent 70%)`
                : "none",
              border: "none",
              borderTop: isHome
                ? `2px solid ${active ? ACCENT : ACCENT + "44"}`
                : `2px solid transparent`,
              cursor: "pointer",
              transition: "all .25s cubic-bezier(.16,1,.3,1)",
              filter: active ? `drop-shadow(0 0 7px ${ACCENT})` : "none",
            }}>
            {badge > 0 && (
              <span style={{
                position: "absolute", top: 6, right: "18%",
                background: RED, color: "#fff", borderRadius: "50%",
                width: 14, height: 14, fontSize: 8,
                fontFamily: "'Orbitron',sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{badge}</span>
            )}
            {NAV_ICONS[id](c)}
            <span style={{
              fontFamily: "'Orbitron',sans-serif",
              fontSize: 7, fontWeight: 700, letterSpacing: 1,
              color: c,
              textShadow: active ? `0 0 8px ${ACCENT}` : "none",
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── SCREEN: WELCOME ──────────────────────────────────────────────────────────
// First-launch chooser. Three paths:
//   • Create account → opens AuthPanel in signup mode, then onboarding for body stats
//   • Sign in       → opens AuthPanel in signin mode, then attempts to restore
//                     full state from cloud Storage (skipping onboarding if present)
//   • Continue as guest → goes straight to the existing onboarding flow
//
// If Supabase isn't configured for this build, only "Continue as guest" is
// available and the cloud-related copy is hidden.

function WelcomeScreen({ supabaseConfigured, onCreateAccount, onSignIn, onGuest }) {
  const button = (label, sub, onClick, primary) => (
    <button onClick={onClick} style={{
      width: "100%", padding: "16px 18px", textAlign: "left", cursor: "pointer",
      background: primary ? `${ACCENT}1a` : BG3,
      border: `1px solid ${primary ? ACCENT : ACCENT2 + "55"}`,
      borderRadius: 10, marginBottom: 10,
      transition: "all .15s",
    }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700,
        color: primary ? ACCENT : TEXT, letterSpacing: 2 }}>{label}</div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
        color: MUTED, marginTop: 4, lineHeight: 1.4 }}>{sub}</div>
    </button>
  );

  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex",
      flexDirection: "column", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", width: "100%" }}>
        <div className="holo-text" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900,
          letterSpacing: 6, textAlign: "center", marginBottom: 8 }}>
          IRON REALM
        </div>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
          color: MUTED, textAlign: "center", marginBottom: 32, letterSpacing: 1 }}>
          Awaken the Hunter within.
        </div>

        {supabaseConfigured && (
          <>
            {button("CREATE ACCOUNT",
              "New Hunter. Sync progress across devices and join the leaderboard.",
              onCreateAccount, true)}
            {button("SIGN IN",
              "Returning Hunter. Restore your full progress from the cloud.",
              onSignIn, false)}
          </>
        )}
        {button("CONTINUE AS GUEST",
          supabaseConfigured
            ? "Train locally. You can create an account later from Settings."
            : "Train locally. (Online features are not configured for this build.)",
          onGuest, !supabaseConfigured)}

        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
          color: MUTED, textAlign: "center", marginTop: 24, lineHeight: 1.5 }}>
          Your data stays on this device.{supabaseConfigured ? " Signing in encrypts and stores a backup so you can recover on a new device." : ""}
        </div>
      </div>
    </div>
  );
}


// ─── SCREEN: ONBOARD ──────────────────────────────────────────────────────────

function OnboardScreen({ onComplete }) {
  const [step, setStep] = useState(0); // 0=welcome, 1=name, 2=gender, 3=goal, 4=body, 4=body
  const [name, setName] = useState("");
  const [gender, setGender] = useState(null);
  const [goal, setGoal] = useState(null);
  const [weightLbs, setWeightLbs] = useState("170");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("10");

  const Rune = ({ char, top, left, size, delay }) => (
    <div style={{ position: "absolute", top, left, fontSize: size, color: ACCENT,
      animation: `runeFloat 4s ease-in-out ${delay}s infinite`, opacity: 0.2, pointerEvents: "none" }}>{char}</div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "32px 22px", position: "relative", overflow: "hidden" }}>
      <Rune char="⬡" top="8%" left="5%" size={28} delay={0} />
      <Rune char="◈" top="15%" left="80%" size={22} delay={1} />
      <Rune char="⟁" top="70%" left="8%" size={20} delay={2} />
      <Rune char="◉" top="80%" left="85%" size={26} delay={0.5} />
      <Rune char="⬟" top="40%" left="90%" size={18} delay={1.5} />
      <Rune char="⌬" top="55%" left="2%" size={24} delay={0.8} />

      <div style={{ width: "100%", maxWidth: 380, position: "relative", zIndex: 1 }}>
        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="slide-up" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: ACCENT,
              letterSpacing: 6, marginBottom: 16 }}>— SYSTEM INITIALIZATION —</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 48, fontWeight: 900,
              color: GOLD, letterSpacing: 4, lineHeight: 1, textShadow: `0 0 40px ${GOLD}66` }}>IRON</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 48, fontWeight: 900,
              color: TEXT, letterSpacing: 4, lineHeight: 1, marginBottom: 8 }}>REALM</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED,
              letterSpacing: 3, marginBottom: 48 }}>AWAKEN, HUNTER.</div>

            <div style={{ background: `${ACCENT}11`, border: `1px solid ${ACCENT}33`,
              borderRadius: 12, padding: "20px", marginBottom: 32, textAlign: "left" }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: ACCENT,
                letterSpacing: 4, marginBottom: 10 }}>[ SYSTEM NOTICE ]</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
                A new player has been detected.<br />
                Initializing Hunter profile...<br />
                Prepare to enter the Iron Realm.
              </div>
            </div>

            <button className="btn-primary" onClick={() => setStep(1)}
              style={{ width: "100%", padding: "16px", fontSize: 16, letterSpacing: 3 }}>
              BEGIN INITIALIZATION
            </button>
            <div style={{ marginTop: 16, fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
              color: MUTED, textAlign: "center", lineHeight: 1.6, opacity: 0.7, padding: "0 10px" }}>
              Iron Realm provides fitness guidance based on published sports science research.
              It is not a substitute for medical advice. Consult a qualified physician or
              registered dietitian before starting any new exercise or nutrition program.
            </div>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="slide-up" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
              letterSpacing: 4, marginBottom: 8 }}>STEP 1 / 3</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700,
              color: GOLD, letterSpacing: 2, marginBottom: 6 }}>HUNTER NAME</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED,
              marginBottom: 32 }}>What shall we call you, Hunter?</div>

            <input className="input-field" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter your name..." maxLength={20}
              style={{ textAlign: "center", fontSize: 18, fontWeight: 700,
                letterSpacing: 2, marginBottom: 24, color: ACCENT }} />

            <button className="btn-primary" onClick={() => name.trim() && setStep(2)}
              style={{ width: "100%", padding: "16px", fontSize: 16, letterSpacing: 3,
                opacity: name.trim() ? 1 : 0.5 }}>
              CONFIRM
            </button>
          </div>
        )}

        {/* Step 2: Gender */}
        {step === 2 && (
          <div className="slide-up" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
              letterSpacing: 4, marginBottom: 8 }}>STEP 2 / 3</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700,
              color: GOLD, letterSpacing: 2, marginBottom: 6 }}>SELECT CLASS</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED,
              marginBottom: 32 }}>Choose your Hunter class to unlock programs.</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
              {[
                { id: "male", label: "WARRIOR", sub: "Male Programs" },
                { id: "female", label: "SHADOW", sub: "Female Programs" },
              ].map(g => (
                <button key={g.id} onClick={() => setGender(g.id)} style={{
                  background: gender === g.id ? `${ACCENT}22` : BG2,
                  border: `2px solid ${gender === g.id ? ACCENT : ACCENT2 + "44"}`,
                  borderRadius: 12, padding: "24px 12px", cursor: "pointer",
                  transition: "all .2s", boxShadow: gender === g.id ? `0 0 20px ${ACCENT}33` : "none"
                }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: goal === g.id ? ACCENT : MUTED, letterSpacing: 2, marginBottom: 10 }}>{g.glyph}</div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700,
                    color: gender === g.id ? ACCENT : TEXT, letterSpacing: 2, marginBottom: 4 }}>{g.label}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>{g.sub}</div>
                </button>
              ))}
            </div>

            <button className="btn-primary" onClick={() => gender && setStep(3)}
              style={{ width: "100%", padding: "16px", fontSize: 16, letterSpacing: 3, opacity: gender ? 1 : 0.5 }}>
              CONFIRM
            </button>
          </div>
        )}

        {/* Step 3: Goal */}
        {step === 3 && (
          <div className="slide-up">
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
                letterSpacing: 4, marginBottom: 8 }}>STEP 3 / 4</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700,
                color: GOLD, letterSpacing: 2, marginBottom: 6 }}>MISSION TYPE</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED }}>
                What is your primary objective?
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {FITNESS_GOALS.map(g => (
                <button key={g.id} onClick={() => setGoal(g.id)} style={{
                  background: goal === g.id ? `${ACCENT}22` : BG2,
                  border: `1px solid ${goal === g.id ? ACCENT : ACCENT2 + "44"}`,
                  borderRadius: 10, padding: "12px 10px", cursor: "pointer", textAlign: "left",
                  transition: "all .2s"
                }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: goal === g.id ? g.color : MUTED, letterSpacing: 1, marginBottom: 4 }}>{g.glyph}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, fontWeight: 700,
                    color: goal === g.id ? ACCENT : TEXT, letterSpacing: 1 }}>{g.label}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>{g.desc}</div>
                </button>
              ))}
            </div>

            <button className="btn-gold" onClick={() => goal && setStep(4)}
              style={{ width: "100%", padding: "16px", fontSize: 16, letterSpacing: 3, opacity: goal ? 1 : 0.5 }}>
              NEXT
            </button>
          </div>
        )}

        {/* Step 4: Body */}
        {step === 4 && (
          <div className="slide-up" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
              letterSpacing: 4, marginBottom: 8 }}>STEP 4 / 4</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 700,
              color: GOLD, letterSpacing: 2, marginBottom: 6 }}>BODY STATS</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED,
              marginBottom: 32 }}>Used to calculate calories burned accurately.</div>

            <div style={{ textAlign: "left", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>WEIGHT (LBS)</div>
              <input className="input-field" type="number" value={weightLbs} onChange={e => setWeightLbs(e.target.value)}
                placeholder={getWtUnit()==="kg"?"77":"170"} style={{ fontSize: 18, fontWeight: 700, color: ACCENT, textAlign: "center" }} />
            </div>

            <div style={{ textAlign: "left", marginBottom: 32 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 3, marginBottom: 6 }}>HEIGHT</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <input className="input-field" type="number" value={heightFt} onChange={e => setHeightFt(e.target.value)}
                    placeholder="5" style={{ textAlign: "center", color: ACCENT }} />
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, textAlign: "center", marginTop: 4 }}>FEET</div>
                </div>
                <div>
                  <input className="input-field" type="number" value={heightIn} onChange={e => setHeightIn(e.target.value)}
                    placeholder="10" style={{ textAlign: "center", color: ACCENT }} />
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, textAlign: "center", marginTop: 4 }}>INCHES</div>
                </div>
              </div>
            </div>

            <button className="btn-gold" onClick={() => {
              const totalIn = (parseInt(heightFt) || 5) * 12 + (parseInt(heightIn) || 10);
              onComplete({ name: name.trim() || "Hunter", gender, goal, weightLbs: parseFloat(weightLbs) || 170, heightIn: totalIn });
            }} style={{ width: "100%", padding: "16px", fontSize: 16, letterSpacing: 3 }}>
              ARISE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AUTH PANEL ───────────────────────────────────────────────────────────────
// Sign-in / create-account modal. Mounted from the Settings modal when the
// user picks "Sign in / create account".

function AuthPanel({ onClose, onSignIn, onSignUp, busy, error, initialMode = "signin" }) {
  const [mode, setMode]         = useState(initialMode); // "signin" | "signup"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [localErr, setLocalErr] = useState(null);

  const submit = async () => {
    setLocalErr(null);
    if (!email || !password) { setLocalErr("Email and password are required."); return; }
    if (mode === "signup") {
      if (password.length < 8) { setLocalErr("Password must be at least 8 characters."); return; }
      if (!username) { setLocalErr("Pick a username."); return; }
      await onSignUp({ email, password, username });
    } else {
      await onSignIn({ email, password });
    }
  };

  const message = localErr || error;
  const fieldStyle = {
    width: "100%", padding: "10px 12px", marginTop: 4,
    background: BG3, border: `1px solid ${ACCENT}33`, borderRadius: 6,
    color: TEXT, fontFamily: "'Rajdhani',sans-serif", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
    letterSpacing: 2, fontWeight: 700,
  };

  return (
    createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150, background: "rgba(3,6,15,0.95)",
      backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
        border: `1px solid ${ACCENT}44`, borderTop: `2px solid ${ACCENT}`,
        width: "100%", maxWidth: 480, padding: "24px 20px 40px",
        maxHeight: "85dvh", overflowY: "auto",
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${ACCENT}cc, transparent)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>
            {mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {["signin", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setLocalErr(null); }} style={{
              flex: 1, padding: "8px 10px", cursor: "pointer",
              background: mode === m ? `${ACCENT}22` : BG3,
              border: `1px solid ${mode === m ? ACCENT : MUTED + "44"}`,
              borderRadius: 6,
              fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
              letterSpacing: 2, color: mode === m ? ACCENT : MUTED,
            }}>
              {m === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <label style={{ display: "block" }}>
              <span style={labelStyle}>USERNAME</span>
              <input type="text" value={username} autoCapitalize="none" autoCorrect="off"
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="lowercase, 3–20 chars" maxLength={20} style={fieldStyle} />
            </label>
          )}
          <label style={{ display: "block" }}>
            <span style={labelStyle}>EMAIL</span>
            <input type="email" value={email} autoCapitalize="none" autoCorrect="off"
              onChange={e => setEmail(e.target.value)} style={fieldStyle} />
          </label>
          <label style={{ display: "block" }}>
            <span style={labelStyle}>PASSWORD</span>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "8+ characters" : ""}
              style={fieldStyle} />
          </label>

          {message && (
            <div style={{ background: `${RED}11`, border: `1px solid ${RED}55`, borderRadius: 6,
              padding: "10px 12px", fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: RED }}>
              {message}
            </div>
          )}

          <button onClick={submit} disabled={busy} className="btn-primary" style={{
            padding: "14px", fontSize: 12, letterSpacing: 2, marginTop: 4,
            opacity: busy ? 0.5 : 1, cursor: busy ? "wait" : "pointer",
          }}>
            {busy ? "..." : mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>

          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, textAlign: "center", marginTop: 6 }}>
            Your local profile stays on this device. Signing in only shares a public summary with friends.
          </div>
        </div>
      </div>
    </div>, document.body)
  );
}


// ─── SCREEN: MENU (HOME) ──────────────────────────────────────────────────────

// ─── DAILY RITUALS + COSMETICS ───────────────────────────────────────────────
// Three small daily activities that maintain a streak. No XP — completing
// them unlocks profile titles at 7/30/100 day milestones. Cosmetics are
// scoped to the local profile for now; a future commit syncs equipped_title
// to Supabase so it shows on leaderboards.


// Style applied to the rank card when a relic is equipped.
function relicStyle(relicId) {
  if (!relicId) return null;
  const relic = RELIC_POOL.find(r => r.id === relicId);
  if (!relic) return null;
  const c = RELIC_FRAME_COLORS[relicId];
  const base = { border: `2px solid ${c}`, boxShadow: `0 0 14px ${c}44` };
  if (relic.rarity === "epic" || relic.rarity === "legendary") {
    return { ...base, "--relic": c, animation: "relicGlowPulse 2.6s ease-in-out infinite" };
  }
  return base;
}
// Weighted rarity roll, then pick an unowned relic in that tier; if the tier is
// complete, escalate upward (then downward) so drops stay meaningful.
function rollRelic(ownedIds) {
  const owned = new Set(ownedIds || []);
  const order = ["common", "rare", "epic", "legendary"];
  const total = order.reduce((s, r) => s + RELIC_RARITIES[r].weight, 0);
  let roll = Math.random() * total, rarity = "common";
  for (const r of order) { roll -= RELIC_RARITIES[r].weight; if (roll <= 0) { rarity = r; break; } }
  const tierIdx = order.indexOf(rarity);
  const tiers = [...order.slice(tierIdx), ...order.slice(0, tierIdx).reverse()];
  for (const t of tiers) {
    const candidates = RELIC_POOL.filter(r => r.rarity === t && !owned.has(r.id));
    if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return null; // full collection
}

// Full-screen drop reveal, ceremony-style, tinted by rarity.
function RelicDropModal({ relic, onEquip, onClose }) {
  const rar = RELIC_RARITIES[relic.rarity];
  const c = RELIC_FRAME_COLORS[relic.id];
  return (
    createPortal(<div onClick={onClose} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 3200, display: "flex",
      alignItems: "center", justifyContent: "center", flexDirection: "column", cursor: "pointer",
      background: "radial-gradient(circle at 50% 45%, rgba(3,6,15,.6), rgba(3,6,15,.97))",
      animation: "fadeIn .25s ease-out both" }}>
      {[0, 0.2].map((d, i) => (
        <div key={i} style={{ position: "absolute", width: 120, height: 120, borderRadius: "50%",
          border: `2px solid ${c}`, animation: `shockwave 1.2s cubic-bezier(.2,.7,.3,1) ${d}s both` }} />
      ))}
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: 6,
        color: rar.color, textShadow: `0 0 10px ${rar.color}`, marginBottom: 12,
        animation: "fadeIn .4s ease-out .1s both" }}>RELIC DROP — {rar.name.toUpperCase()}</div>
      <div onClick={e => e.stopPropagation()} style={{
        width: 190, padding: "26px 18px", textAlign: "center",
        background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f4)`,
        border: `2px solid ${c}`, borderRadius: 14,
        "--relic": c, animation: "relicGlowPulse 2.2s ease-in-out infinite, slamIn .5s cubic-bezier(.16,1,.3,1) .15s both" }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>{relic.rarity === "legendary" ? "👑" : relic.rarity === "epic" ? "🔮" : relic.rarity === "rare" ? "💠" : "🛡️"}</div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: c,
          letterSpacing: 1, textShadow: `0 0 12px ${c}` }}>{relic.name}</div>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 6 }}>
          Card frame · earned by PR
        </div>
        <button onClick={onEquip} style={{
          marginTop: 14, width: "100%", padding: "10px", cursor: "pointer",
          background: `${c}22`, border: `1px solid ${c}88`, borderRadius: 8,
          fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
          color: c, letterSpacing: 2 }}>EQUIP NOW</button>
      </div>
      <div style={{ position: "absolute", bottom: 48, fontFamily: "'Rajdhani',sans-serif",
        fontSize: 11, color: MUTED, letterSpacing: 3,
        animation: "fadeIn .4s ease-out 1s both" }}>TAP ANYWHERE TO STASH</div>
    </div>, document.body)
  );
}



const AWAKENING_LEVEL = 30;

function _dateKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function _isRitualDayComplete(completionLog, dayKey) {
  const done = new Set(completionLog?.[dayKey] || []);
  return DAILY_RITUALS.every(r => done.has(r.id));
}

function _computeRitualStreak(completionLog) {
  // Walk back from today; today's incompleteness doesn't break streak yet.
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;
  if (!_isRitualDayComplete(completionLog, _dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (_isRitualDayComplete(completionLog, _dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function _newlyEarnedTitles(streak, alreadyUnlocked = []) {
  const owned = new Set(alreadyUnlocked);
  return COSMETIC_TITLES.filter(t => streak >= t.threshold && !owned.has(t.id));
}


const BANNER_PALETTE = [
  { hex: null,       name: "Default" },
  { hex: "#00d4ff",  name: "Cyan" },
  { hex: "#ffd700",  name: "Gold" },
  { hex: "#a855f7",  name: "Royal" },
  { hex: "#e85d4a",  name: "Crimson" },
  { hex: "#22c55e",  name: "Emerald" },
  { hex: "#ec4899",  name: "Magenta" },
  { hex: "#f59e0b",  name: "Amber" },
  { hex: "#6e44ff",  name: "Shadow" },
];

function MenuScreen({ st, setScreen, onLogFood, onUpdateWeight, settings, onUpdateSettings, toast,
                     account, onSignIn, onSignUp, onSignOut, onToggleSharePrs, onUpdateDisplayName,
                     onUpdateBannerColor, onToggleRitual, onEquipTitle, onLogMind,
                     onAddMindTask, onRemoveMindTask, onToggleMindTask, pendingCount = 0 }) {
  const rank = getRank(st.overallLevel);
  const { current, needed } = getLevelFromXP(st.overallXP);
  const [settingsOpen, setSettingsOpen] = useState(null); // null | "settings" | "help" | "account"
  const [importError, setImportError] = useState(null);
  const [displayNameDraft, setDisplayNameDraft] = useState("");
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  const currentDisplayName = account.remoteProfile?.display_name || "";
  useEffect(() => {
    setDisplayNameDraft(currentDisplayName);
  }, [currentDisplayName]);

  const dnDirty = displayNameDraft.trim() !== currentDisplayName.trim();
  const saveDisplayName = async () => {
    if (!onUpdateDisplayName || savingDisplayName) return;
    setSavingDisplayName(true);
    const ok = await onUpdateDisplayName(displayNameDraft.trim());
    setSavingDisplayName(false);
    if (!ok) setDisplayNameDraft(currentDisplayName);
  };
  const today = new Date().toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" });
  const _isArchitect = settings?.monarchTheme === "architect";
  const _isShadow    = settings?.monarchTheme === "shadow";
  const _isBeast     = settings?.monarchTheme === "beast";
  const programDays = st.program ? (st.gender === "male" ? MALE_PROGRAMS : FEMALE_PROGRAMS).find(p => p.id === st.program)?.days : null;
  const todayDayIdx = (new Date().getDay() + 6) % 7;
  const schedule = st.customSchedule || programDays || [];
  const todayWorkout = schedule[todayDayIdx];

  // Calorie tracking
  const tdee = calcTDEE(st);

  const todayFood = getTodayFood(st);
  const calsEaten = todayFood ? todayFood.calories : 0;


  const [weightInput, setWeightInput] = useState("");
  const [weightSaved, setWeightSaved] = useState(false);
  const [tipExpanded, setTipExpanded] = useState(false);
  const dailyTip = getTodayTip();



  return (
    <div onScroll={e => e.currentTarget.style.setProperty("--sy", e.currentTarget.scrollTop)}
      style={{ height: "100dvh", overflowY: "auto", background: "transparent", padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))", position: "relative" }}>
      {/* Background effects */}
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${ACCENT}0d 0%, transparent 60%)`, pointerEvents: "none" }} />
      {/* Shadow: void tendrils rising from the floor */}
      {settings?.monarchTheme === "shadow" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%",
            background: "linear-gradient(0deg, #1a0050cc 0%, #6e44ff22 60%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, #6e44ff06 3px, #6e44ff06 4px)",
            backgroundSize: "100% 4px" }} />
          {[15,35,55,75,88].map((left, i) => (
            <div key={i} style={{ position: "absolute", bottom: 0, left: `${left}%`,
              width: 1, height: `${30 + i * 8}%`,
              background: `linear-gradient(0deg, #6e44ff88, #6e44ff22, transparent)`,
              animation: `runeFloat ${2 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
              opacity: 0.5 }} />
          ))}
        </div>
      )}
      {/* Architect: terminal scanlines + blinking cursor on header */}
      {settings?.monarchTheme === "architect" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: 0,
            backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 1px, #ffffff04 1px, #ffffff04 2px)",
            backgroundSize: "100% 2px" }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2,
            background: "linear-gradient(90deg, transparent, #e8eef8aa, transparent)",
            animation: "runeFloat 3s ease-in-out infinite" }} />
        </div>
      )}
      {/* Parallax rune field — sticky layer, each rune drifts up at its own depth while you scroll */}
      <div style={{ position: "sticky", top: 0, height: 0, zIndex: 0, pointerEvents: "none" }}>
        {["⬡", "◈", "⟁", "✦", "◇", "⬢"].map((r, i) => (
          <div key={i} style={{ position: "absolute", top: 120 + i * 115,
            left: i % 2 === 0 ? `${4 + i}%` : `${86 - i * 2}%`,
            transform: `translateY(calc(var(--sy, 0) * ${(-0.1 - (i % 3) * 0.14).toFixed(2)}px))` }}>
            <div style={{ fontSize: 14 + (i % 3) * 4, color: i % 3 === 1 ? GOLD : ACCENT,
              animation: `runeFloat ${3 + i}s ease-in-out ${i * 0.7}s infinite`, opacity: 0.1 + (i % 3) * 0.04 }}>{r}</div>
          </div>
        ))}
      </div>

      {/* Header — System Window */}
      <div style={{
        background: `linear-gradient(180deg, ${BG2}f8, ${DARK1}ee)`,
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${ACCENT}44`,
        boxShadow: `0 4px 24px ${ACCENT}11`,
        padding: "14px 18px 12px", position: "sticky", top: 0, zIndex: 10
      }}>
        {/* Top cyan line */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${ACCENT}cc, transparent)` }} />
        {/* Rising energy orbs */}
        {[12, 30, 52, 71, 90].map((left, i) => (
          <div key={i} style={{
            position: "absolute", bottom: 4, left: `${left}%`, width: 3, height: 3,
            borderRadius: "50%", background: i % 2 === 0 ? ACCENT : GOLD,
            boxShadow: `0 0 6px ${i % 2 === 0 ? ACCENT : GOLD}`,
            "--drift": `${(i % 3 - 1) * 14}px`,
            animation: `orbRise ${2.6 + i * 0.7}s ease-out ${i * 0.9}s infinite`,
            pointerEvents: "none",
          }} />
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Animated rank emblem */}
            <div style={{ position: "relative", width: 54, height: 54, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: -5, borderRadius: "50%",
                background: `conic-gradient(from 0deg, transparent, ${rank.color}55, transparent 32%)`,
                animation: "auraSpin 5s linear infinite", filter: "blur(5px)" }} />
              <svg className="emblem-ring" width="54" height="54" viewBox="0 0 54 54"
                style={{ position: "absolute", inset: 0 }}>
                <circle cx="27" cy="27" r="25" fill="none" stroke={rank.color} strokeWidth="1"
                  strokeDasharray="7 9" opacity="0.75" />
              </svg>
              <svg className="emblem-ring2" width="54" height="54" viewBox="0 0 54 54"
                style={{ position: "absolute", inset: 0 }}>
                <circle cx="27" cy="27" r="20" fill="none" stroke={rank.color} strokeWidth="0.7"
                  strokeDasharray="2 7" opacity="0.5" />
              </svg>
              <div style={{
                fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: rank.color,
                textShadow: `0 0 16px ${rank.color}, 0 0 34px ${rank.color}66`, lineHeight: 1,
                animation: "emblemPulse 2.8s ease-in-out infinite",
              }}>{rank.rank}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: ACCENT, letterSpacing: 4, opacity: 0.7, marginBottom: 2 }}>{`// ${themeLabel(settings,"hunter","HUNTER")} STATUS`}</div>
              <div className="glitch-in" style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900,
                letterSpacing: 3 }}>
                <AuraName name={st.name.toUpperCase()} level={st.overallLevel}
                  equippedId={settings?.nameAura} color={GOLD} />
              </div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 7, color: rank.color, letterSpacing: 3, opacity: 0.85, marginTop: 2 }}>{rank.label.toUpperCase()}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Companion familiar — 3D orbiting halos in rank color */}
            <Suspense fallback={null}><CompanionOrb color={rank.color} size={36} /></Suspense>
            <button onClick={() => setSettingsOpen("help")} style={{
              background: "none", border: `1px solid ${MUTED}44`, borderRadius: "50%",
              width: 28, height: 28, cursor: "pointer", color: MUTED,
              fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>?</button>
            <button onClick={() => setSettingsOpen("settings")} style={{
              background: "none", border: "none", cursor: "pointer",
              color: MUTED, padding: 0, display: "flex", alignItems: "center"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 2, textShadow: `0 0 6px ${ACCENT}` }}>LVL {st.overallLevel}</span>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
        </div>
        <div className="shimmer-bar">
          <XPBar current={current} needed={needed} color={GOLD} height={4} />
        </div>
      </div>

      <div style={{ padding: "20px" }}>
        {/* Today's mission — tilts in 3D toward your touch, with a tracking glare */}
        <TiltCard>
        <div className="card-in card-in-1 breathe" style={{
          background: `linear-gradient(135deg, ${BG2}f0, ${DARK1}e8)`,
          border: `1px solid ${ACCENT}44`, borderTop: `1px solid ${ACCENT}99`,
          clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
          padding: "16px", marginBottom: 16, position: "relative"
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), #ffffff12, transparent 55%)" }} />
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 4, marginBottom: 10,
            textShadow: `0 0 8px ${ACCENT}` }}>{"// DAILY MISSION"}</div>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, marginBottom: 4 }}>{_isArchitect ? '[ SYSTEM ACTIVE ]' : _isShadow ? '[ SHADOW REALM ONLINE ]' : _isBeast ? '[ DESTRUCTION ENGAGED ]' : today}</div>
          {todayWorkout ? (
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: todayWorkout.rest ? MUTED : TEXT }}>
                {todayWorkout.rest ? "REST DAY" : todayWorkout.label}
              </div>
              {!todayWorkout.rest && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginTop: 4 }}>
                  {todayWorkout.exercises?.length || 0} exercises scheduled
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: MUTED }}>No program selected. Choose a program to get daily quests.</div>
          )}
        </div>
        </TiltCard>

                {/* ── DAILY TIP ── */}
        {(() => {
          const tip = dailyTip;
          const catColors = { TRAINING: ACCENT, RECOVERY: "#00ff88", NUTRITION: GOLD, "APP TIP": "#cc44ff" };
          const col = catColors[tip.category] || ACCENT;
          return (
            <div className="card-in card-in-2" onClick={() => setTipExpanded(e => !e)} style={{
              background: `linear-gradient(135deg, ${BG2}f0, ${DARK1}e8)`,
              border: `1px solid ${col}33`, borderLeft: `3px solid ${col}`,
              borderRadius: 10, padding: "12px 14px", marginBottom: 14, cursor: "pointer",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14,
                    color: col, filter: `drop-shadow(0 0 6px ${col})` }}>{tip.icon}</span>
                  <div>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                      color: col, letterSpacing: 3, marginBottom: 3 }}>
                      {"// DAILY TIP · " + tip.category}
                    </div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
                      fontWeight: 700, color: TEXT, lineHeight: 1.4 }}>
                      {tip.tip}
                    </div>
                  </div>
                </div>
                <span style={{ color: MUTED, fontSize: 16, flexShrink: 0, marginLeft: 8 }}>
                  {tipExpanded ? "▲" : "▼"}
                </span>
              </div>
              {tipExpanded && (
                <div style={{ marginTop: 10, paddingTop: 10,
                  borderTop: `1px solid ${col}22` }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
                    color: MUTED, lineHeight: 1.6, marginBottom: 6 }}>
                    {tip.detail}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                    color: col, opacity: 0.7 }}>
                    📖 {tip.source}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── WEIGHT WIDGET ── */}
        <div className="card-in card-in-3" style={{
          background: `linear-gradient(135deg, ${BG2}f0, ${DARK1}e8)`,
          border: `1px solid ${ACCENT}22`, borderTop: `1px solid ${ACCENT}44`,
          clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          padding: "12px 16px", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
              letterSpacing: 3, marginBottom: 6 }}>{"// BODY WEIGHT"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900,
                color: GOLD, textShadow: `0 0 12px ${GOLD}66` }}>
                <CountUp value={wtVal(st.weightLbs || 0)} decimals={1} />
              </div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
                color: MUTED, fontWeight: 700 }}>{wtLabel().toUpperCase()}</div>
            </div>
          </div>
          {weightSaved ? (
            <button onClick={() => { setWeightSaved(false); setWeightInput(""); }} style={{
              background: `${GREEN}18`, border: `1px solid ${GREEN}44`,
              borderRadius: 8, padding: "8px 14px", cursor: "pointer",
              fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GREEN, letterSpacing: 1,
            }}>UPDATED ✓</button>
          ) : (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                className="input-field"
                type="number"
                placeholder={`New ${wtLabel()}`}
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && weightInput) {
                    const raw = parseFloat(weightInput);
                    if (raw > 0) {
                      const inLbs = wtLabel() === "kg" ? raw / 0.453592 : raw;
                      onUpdateWeight(inLbs);
                      setWeightSaved(true);
                      setTimeout(() => setWeightSaved(false), 3000);
                    }
                  }
                }}
                style={{ width: 90, fontSize: 13 }}
              />
              <button onClick={() => {
                const raw = parseFloat(weightInput);
                if (!raw || raw <= 0) return;
                const inLbs = wtLabel() === "kg" ? raw / 0.453592 : raw;
                onUpdateWeight(inLbs);
                setWeightSaved(true);
                setTimeout(() => setWeightSaved(false), 3000);
              }} style={{
                background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`,
                borderTop: `1px solid ${ACCENT}99`,
                clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                padding: "9px 14px", cursor: "pointer",
                fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
                fontWeight: 700, letterSpacing: 1,
              }}>UPDATE</button>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card-in card-in-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <MagneticButton className="btn-primary" onClick={() => setScreen("schedule")}
            style={{ padding: "16px", fontSize: 14, letterSpacing: 2,
              animation: "borderPulse 3s ease-in-out infinite" }}>
            <span style={{ fontSize: 11 }}>{_isShadow ? "BEGIN THE HUNT" : _isBeast ? "UNLEASH" : _isArchitect ? "INITIATE PROTOCOL" : "START TRAINING"}</span>
          </MagneticButton>
          <MagneticButton onClick={() => setScreen("character")} style={{
            background: `${GOLD}11`, border: `1px solid ${GOLD}44`, borderRadius: 8,
            padding: "16px", cursor: "pointer",
            fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: GOLD, fontWeight: 700, letterSpacing: 2
          }}>
            <span style={{ fontSize: 11 }}>MY STATS</span>
          </MagneticButton>
        </div>

        {/* Social actions */}
        <div className="card-in card-in-5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <button onClick={() => setScreen("leaderboard")} style={{
            background: `${ACCENT}11`, border: `1px solid ${ACCENT}44`, borderRadius: 8,
            padding: "12px", cursor: "pointer", transition: "all .2s",
            fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: ACCENT, fontWeight: 700, letterSpacing: 2,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="2.5" y="11" width="3.8" height="6" fill="currentColor" opacity="0.6"/>
              <rect x="8.1"  y="6"  width="3.8" height="11" fill="currentColor"/>
              <rect x="13.7" y="9"  width="3.8" height="8" fill="currentColor" opacity="0.85"/>
            </svg>
            <span style={{ fontSize: 11 }}>LEADERBOARD</span>
          </button>
          <button onClick={() => setScreen("friends")} style={{
            background: `${ACCENT}11`, border: `1px solid ${ACCENT}44`, borderRadius: 8,
            padding: "12px", cursor: "pointer", position: "relative", transition: "all .2s",
            fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: ACCENT, fontWeight: 700, letterSpacing: 2,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="7.5" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M2 17c0-3.04 2.46-5.5 5.5-5.5S13 13.96 13 17" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="14" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3" opacity="0.7"/>
              <path d="M13.5 11.6c1.9.4 3.5 2.1 3.5 4.4" stroke="currentColor" strokeWidth="1.3" opacity="0.7"/>
            </svg>
            <span style={{ fontSize: 11 }}>FRIENDS</span>
            {pendingCount > 0 && (
              <span style={{
                position: "absolute", top: 6, right: 8,
                background: RED, color: "#fff", borderRadius: "50%",
                width: 18, height: 18, fontSize: 10, fontFamily: "'Orbitron',sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
              }}>{pendingCount}</span>
            )}
          </button>
        </div>

        <div className="holo-divider" />

        {/* Mind & Spirit */}
        <MindSpiritCard profile={st} settings={settings} onUpdateSettings={onUpdateSettings}
          onLogMind={onLogMind} onAddTask={onAddMindTask}
          onRemoveTask={onRemoveMindTask} onToggleTask={onToggleMindTask} />

        {/* Daily Rituals */}
        {(() => {
          const completionLog = st.dailyRituals?.completionLog || {};
          const todayKey = _dateKey(new Date());
          const doneToday = new Set(completionLog[todayKey] || []);
          const streak = _computeRitualStreak(completionLog);
          const allDone = DAILY_RITUALS.every(r => doneToday.has(r.id));
          return (
            <Reveal dir="scale">
            <div style={{ background: `${GOLD}0a`, border: `1px solid ${GOLD}33`,
              borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3 }}>
                  {"// DAILY RITUALS"}
                </div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: streak > 0 ? GOLD : MUTED, letterSpacing: 1 }}>
                  {streak > 0 ? <>{streak}<span className="streak-flame">🔥</span> day streak</> : "no streak"}
                </div>
              </div>
              {DAILY_RITUALS.map(r => {
                const done = doneToday.has(r.id);
                return (
                  <div key={r.id} onClick={() => onToggleRitual?.(r.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                    padding: "8px 4px", borderBottom: `1px solid ${ACCENT2}11`,
                  }}>
                    <div className={done ? "check-pop" : ""} style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      background: done ? GOLD : "transparent",
                      border: `1.5px solid ${done ? GOLD : MUTED}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: BG, fontSize: 12, fontWeight: 900,
                    }}>{done ? "✓" : ""}</div>
                    <span style={{
                      fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                      color: done ? MUTED : TEXT,
                      textDecoration: done ? "line-through" : "none",
                      flex: 1,
                    }}>{r.label}</span>
                  </div>
                );
              })}
              {allDone && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: GOLD, marginTop: 8, textAlign: "center" }}>
                  ✦ Day complete. Streak holds.
                </div>
              )}
            </div>
            </Reveal>
          );
        })()}

        {/* Equipped title selector — only show if user has unlocked any */}
        {(st.cosmetics?.unlockedTitles?.length || 0) > 0 && (
          <Reveal dir="left">
          <div style={{ background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 8 }}>
              {"// EQUIPPED TITLE"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <button onClick={() => onEquipTitle?.(null)} style={{
                padding: "5px 10px", cursor: "pointer",
                background: !st.cosmetics?.equippedTitle ? `${MUTED}33` : "transparent",
                border: `1px solid ${MUTED}55`, borderRadius: 5,
                fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 1,
              }}>None</button>
              {(st.cosmetics?.unlockedTitles || []).map(tid => {
                const t = COSMETIC_TITLES.find(x => x.id === tid);
                if (!t) return null;
                const equipped = st.cosmetics?.equippedTitle === tid;
                return (
                  <button key={tid} onClick={() => onEquipTitle?.(tid)} style={{
                    padding: "5px 10px", cursor: "pointer",
                    background: equipped ? `${GOLD}22` : "transparent",
                    border: `1px solid ${equipped ? GOLD : GOLD + "33"}`, borderRadius: 5,
                    fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: equipped ? GOLD : MUTED, letterSpacing: 1,
                  }}>{t.name}</button>
                );
              })}
            </div>
          </div>
          </Reveal>
        )}

        <div className="holo-divider" />
        {/* Recent workouts — entries slide in from alternating sides on scroll */}
        <div style={{ marginBottom: 8 }}>
          <Reveal>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 4, marginBottom: 10 }}>{_isBeast ? "[ RECENT KILLS ]" : _isShadow ? "[ SHADOW RECORD ]" : _isArchitect ? "[ ACTIVITY LOG ]" : "[ RECENT ACTIVITY ]"}</div>
          </Reveal>
          {st.workouts.length === 0 ? (
            <Reveal delay={80}>
              <div className="card" style={{ padding: 16, textAlign: "center" }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED }}>No battles recorded yet.<br />Begin your first training session.</div>
              </div>
            </Reveal>
          ) : (
            st.workouts.slice(-3).reverse().map((w, i) => (
              <Reveal key={i} dir={i % 2 === 0 ? "left" : "right"} delay={i * 90}>
                <div className="card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT }}>{w.muscle ? MUSCLE_META[w.muscle]?.name : "Training"}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>{new Date(w.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: GOLD }}>+{w.xp} XP</div>
                </div>
              </Reveal>
            ))
          )}
        </div>
      </div>
      {/* ── SETTINGS MODAL ── */}
      {settingsOpen === "settings" && (
        createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1200, background: "rgba(3,6,15,0.95)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: "96px" }}
          onClick={() => setSettingsOpen(null)}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{
            background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
            border: `1px solid ${ACCENT}44`, borderTop: `2px solid ${ACCENT}`,
            width: "100%", maxWidth: 480,
            maxHeight: "85dvh", display: "flex", flexDirection: "column",
            position: "relative",
            clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${ACCENT}cc, transparent)` }} />
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "24px 20px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>SETTINGS</div>
              <button onClick={() => setSettingsOpen(null)} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            {/* Account */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
                letterSpacing: 3, marginBottom: 10 }}>{"// ACCOUNT"}</div>
              {!account.supabaseConfigured ? (
                <div style={{ background: BG3, border: `1px solid ${MUTED}33`, borderRadius: 8,
                  padding: "12px 14px", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                  Online features (friends, leaderboard) are disabled — backend credentials are not configured for this build.
                </div>
              ) : account.session ? (
                <div style={{ background: BG3, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: 1 }}>
                        @{account.remoteProfile?.username || "..."}
                      </div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginTop: 2 }}>
                        {account.session.user?.email}
                      </div>
                    </div>
                    <button onClick={onSignOut} disabled={account.busy} style={{
                      background: `${RED}11`, border: `1px solid ${RED}55`, borderRadius: 6,
                      padding: "8px 14px", cursor: account.busy ? "wait" : "pointer",
                      fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: RED, fontWeight: 700, letterSpacing: 2,
                      opacity: account.busy ? 0.5 : 1,
                    }}>SIGN OUT</button>
                  </div>

                  {/* Display name editor */}
                  <div>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 2, marginBottom: 5 }}>
                      DISPLAY NAME
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "stretch" }}>
                      <input
                        type="text"
                        value={displayNameDraft}
                        maxLength={30}
                        placeholder="Shown on your profile"
                        onChange={e => setDisplayNameDraft(e.target.value)}
                        style={{
                          flex: 1, background: BG, border: `1px solid ${ACCENT}33`, borderRadius: 6,
                          padding: "8px 10px", color: TEXT,
                          fontFamily: "'Rajdhani',sans-serif", fontSize: 12, outline: "none",
                        }}
                      />
                      <button
                        onClick={saveDisplayName}
                        disabled={!dnDirty || savingDisplayName}
                        style={{
                          background: dnDirty ? `${ACCENT}22` : "transparent",
                          border: `1px solid ${dnDirty ? ACCENT : MUTED}55`,
                          borderRadius: 6, padding: "8px 12px",
                          cursor: dnDirty && !savingDisplayName ? "pointer" : "default",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 2,
                          color: dnDirty ? ACCENT : MUTED, opacity: savingDisplayName ? 0.5 : 1,
                        }}>
                        {savingDisplayName ? "..." : "SAVE"}
                      </button>
                    </div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 5 }}>
                      {displayNameDraft.length}/30 · leave blank to show only @{account.remoteProfile?.username}
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => setSettingsOpen("account")} style={{
                  width: "100%", padding: "12px 14px", cursor: "pointer", textAlign: "left",
                  background: `${ACCENT}11`, border: `1px solid ${ACCENT}55`, borderRadius: 8,
                  fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: 2,
                }}>
                  SIGN IN / CREATE ACCOUNT
                </button>
              )}
            </div>

            {/* Name Aura — level-gated username animations (all users) */}
            {(() => {
              const equippedAura = settings?.nameAura || "auto";
              const topId = highestAura(st.overallLevel).id;
              const auraColor = account.remoteProfile?.banner_color || GOLD;
              const options = [{ id: "auto", label: "Auto (highest)", minLevel: 1, className: "", desc: "Always show your best unlocked aura" }, ...NAME_AURAS];
              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3 }}>{"// NAME AURA"}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>unlocked by overall level</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {options.map(opt => {
                      const isAuto = opt.id === "auto";
                      const locked = !isAuto && st.overallLevel < opt.minLevel;
                      const selected = equippedAura === opt.id;
                      const isTop = !isAuto && opt.id === topId;
                      return (
                        <button key={opt.id} disabled={locked}
                          onClick={() => onUpdateSettings?.({ nameAura: opt.id })}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            gap: 10, padding: "9px 12px", cursor: locked ? "not-allowed" : "pointer",
                            background: selected ? `${ACCENT}18` : BG3,
                            border: `1px solid ${selected ? ACCENT : (locked ? MUTED + "22" : ACCENT2 + "33")}`,
                            borderRadius: 8, opacity: locked ? 0.5 : 1, textAlign: "left",
                          }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 800 }}>
                              {isAuto
                                ? <span style={{ color: TEXT }}>{st.name.toUpperCase()}</span>
                                : <span className={opt.className} style={{ "--aura": auraColor, ...(opt.className ? {} : { color: auraColor }) }}>{st.name.toUpperCase()}</span>}
                            </div>
                            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                              {opt.label}{isTop ? " · your current best" : ""} — {opt.desc}
                            </div>
                          </div>
                          <div style={{ flexShrink: 0, fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: 1,
                            color: locked ? MUTED : (selected ? ACCENT : GOLD) }}>
                            {locked ? `🔒 LVL ${opt.minLevel}` : (selected ? "EQUIPPED" : (isAuto ? "" : opt.rank))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Profile — banner color picker (signed in only) */}
            {account.session && account.remoteProfile && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
                  letterSpacing: 3, marginBottom: 10 }}>{"// PROFILE BANNER"}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {BANNER_PALETTE.map(({ hex, name }) => {
                    const sel = (account.remoteProfile.banner_color || null) === hex;
                    return (
                      <button
                        key={name}
                        onClick={() => onUpdateBannerColor?.(hex)}
                        title={name}
                        style={{
                          width: 36, height: 36, borderRadius: 10, cursor: "pointer",
                          background: hex || `linear-gradient(135deg, ${MUTED}33, ${BG3})`,
                          border: `2px solid ${sel ? "#fff" : (hex || MUTED) + "55"}`,
                          boxShadow: sel ? `0 0 10px ${hex || MUTED}` : "none",
                          padding: 0,
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 6 }}>
                  Tints your card on friends' leaderboards.
                </div>
              </div>
            )}

            {/* Privacy — only shown when signed in */}
            {account.session && account.remoteProfile && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
                  letterSpacing: 3, marginBottom: 10 }}>{"// PRIVACY"}</div>
                {(() => {
                  const sharePrs = account.remoteProfile.share_prs !== false;
                  return (
                    <div onClick={onToggleSharePrs} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 14px", cursor: "pointer",
                      background: BG3, border: `1px solid ${ACCENT2}33`, borderRadius: 8
                    }}>
                      <div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT }}>
                          Share Personal Records
                        </div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                          Friends can see your PRs on the leaderboard
                        </div>
                      </div>
                      <div style={{ width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                        background: sharePrs ? ACCENT : MUTED + "44",
                        border: `1px solid ${sharePrs ? ACCENT + "88" : MUTED + "44"}`,
                        position: "relative", transition: "all .2s" }}>
                        <div style={{ position: "absolute", top: 3, left: sharePrs ? 21 : 3,
                          width: 14, height: 14, borderRadius: "50%",
                          background: sharePrs ? "#fff" : MUTED, transition: "left .2s",
                          boxShadow: sharePrs ? `0 0 6px ${ACCENT}` : "none" }} />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Monarch Themes */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT,
                letterSpacing: 3, marginBottom: 10 }}>{"// MONARCH THEMES"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {MONARCHS.map(m => {
                  const isActive = settings?.monarchTheme === m.id;
                  return (
                    <button key={m.id}
                      onClick={() => onUpdateSettings({ monarchTheme: isActive ? null : m.id })}
                      style={{
                        width: "100%", padding: "12px 14px", cursor: "pointer", textAlign: "left",
                        background: isActive ? m.gradient : BG3,
                        border: `2px solid ${isActive ? m.accentColor : m.accentColor + "33"}`,
                        borderRadius: 10, position: "relative", overflow: "hidden",
                        boxShadow: isActive ? `0 0 20px ${m.glow}44` : "none",
                        transition: "all .2s"
                      }}>
                      {isActive && (
                        <div style={{ position: "absolute", inset: 0, background:
                          `radial-gradient(ellipse at 30% 50%, ${m.accentColor}15, transparent 60%)`,
                          pointerEvents: "none" }} />
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 900,
                            color: isActive ? m.accentColor : MUTED, letterSpacing: 2,
                            textShadow: isActive ? `0 0 12px ${m.glow}` : "none" }}>
                            {m.name.toUpperCase()}
                          </div>
                          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9,
                            color: isActive ? m.accentColor + "cc" : MUTED, marginTop: 2 }}>
                            {isActive ? `${m.quote} — ${m.title}` : m.title}
                          </div>
                          {isActive && (
                            <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                              {m.swatches.map(([c,n]) => (
                                <div key={n} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <div style={{ width: 7, height: 7, borderRadius: "50%",
                                    background: c, boxShadow: `0 0 4px ${c}` }} />
                                  <span style={{ fontFamily: "'Rajdhani',sans-serif",
                                    fontSize: 8, color: c }}>{n}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, marginLeft: 10,
                          background: `radial-gradient(circle, ${m.accentColor}88, ${m.accent2Color})`,
                          border: `2px solid ${isActive ? m.accentColor : m.accentColor + "44"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: isActive ? `0 0 14px ${m.glow}` : "none",
                          fontFamily: "'Orbitron',sans-serif", fontSize: 13,
                          color: isActive ? m.accentColor : m.accentColor + "88" }}>
                          {m.glyph}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Brightness */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3 }}>{"// BRIGHTNESS"}</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: ACCENT }}>
                  {settings?.brightness === 0.5 ? "DIM" : settings?.brightness >= 1.3 ? "VIVID" : "NORMAL"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { label: "DIM",    val: 0.5 },
                  { label: "LOW",    val: 0.75 },
                  { label: "NORMAL", val: 1.0 },
                  { label: "BRIGHT", val: 1.15 },
                  { label: "VIVID",  val: 1.3 },
                ].map(({ label, val }) => {
                  const isActive = Math.abs((settings?.brightness || 1.0) - val) < 0.05;
                  const previewColor = applyBrightness(settings?.shadowMonarch ? "#6e44ff" : (settings?.accentColor || ACCENT), val);
                  return (
                    <button key={label} onClick={() => onUpdateSettings({ brightness: val })} style={{
                      flex: 1, background: isActive ? `${previewColor}22` : BG3,
                      border: `1px solid ${isActive ? previewColor : ACCENT2 + "33"}`,
                      borderRadius: 8, padding: "10px 4px", cursor: "pointer", textAlign: "center",
                      transition: "all .15s"
                    }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: previewColor,
                        margin: "0 auto 5px", boxShadow: `0 0 ${Math.round(val*8)}px ${previewColor}` }} />
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 7,
                        color: isActive ? previewColor : MUTED, letterSpacing: 1 }}>{label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weight Unit */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 10 }}>{"// WEIGHT UNIT"}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {["lbs","kg"].map(u => {
                  const isActive = (settings?.weightUnit || "lbs") === u;
                  return (
                    <button key={u} onClick={() => onUpdateSettings({ weightUnit: u })} style={{
                      flex: 1, background: isActive ? `${ACCENT}22` : BG3,
                      border: `1px solid ${isActive ? ACCENT : ACCENT2 + "44"}`,
                      borderRadius: 8, padding: "12px", cursor: "pointer",
                      fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700,
                      color: isActive ? ACCENT : MUTED, letterSpacing: 2
                    }}>{u.toUpperCase()}</button>
                  );
                })}
              </div>
            </div>

            {/* Modes */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 10 }}>{"// MODES"}</div>
              {(() => {
                const isOn = settings?.travelMode === true;
                const equipList = Array.isArray(settings?.travelEquipment) && settings.travelEquipment.length > 0
                  ? settings.travelEquipment
                  : ["BODYWEIGHT", "CARDIO"];
                const toggleEquip = (id) => {
                  const set = new Set(equipList);
                  if (set.has(id)) set.delete(id); else set.add(id);
                  onUpdateSettings({ travelEquipment: [...set] });
                };
                return (
                  <>
                    <div onClick={() => onUpdateSettings({ travelMode: !isOn })} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "12px 14px", marginBottom: isOn ? 8 : 6, cursor: "pointer",
                      background: BG3, border: `1px solid ${isOn ? GOLD : ACCENT2 + "33"}`, borderRadius: 8
                    }}>
                      <div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT }}>
                          ✈ Travel mode
                        </div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                          Filter the database to whatever equipment you have access to
                        </div>
                      </div>
                      <div style={{ width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                        background: isOn ? GOLD : MUTED + "44", border: `1px solid ${isOn ? GOLD + "88" : MUTED + "44"}`,
                        position: "relative", transition: "all .2s" }}>
                        <div style={{ position: "absolute", top: 3, left: isOn ? 21 : 3,
                          width: 14, height: 14, borderRadius: "50%",
                          background: isOn ? "#fff" : MUTED, transition: "left .2s",
                          boxShadow: isOn ? `0 0 6px ${GOLD}` : "none" }} />
                      </div>
                    </div>

                    {isOn && (
                      <div style={{ background: `${GOLD}06`, border: `1px solid ${GOLD}33`, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: GOLD, letterSpacing: 2, marginBottom: 8 }}>
                          {"// EQUIPMENT AVAILABLE"}
                        </div>
                        {EQUIPMENT_CATEGORIES.map(eq => {
                          const on = equipList.includes(eq.id);
                          return (
                            <div key={eq.id} onClick={() => toggleEquip(eq.id)} style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "6px 4px", cursor: "pointer",
                            }}>
                              <div style={{
                                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                background: on ? GOLD : "transparent",
                                border: `1.5px solid ${on ? GOLD : MUTED}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: BG, fontSize: 11, fontWeight: 900,
                              }}>{on ? "✓" : ""}</div>
                              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: on ? TEXT : MUTED }}>
                                {eq.name}
                              </span>
                            </div>
                          );
                        })}
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
                          Default is a typical hotel gym (bodyweight, dumbbells, kettlebells, cardio). Add or remove based on what's at your location.
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Toggles */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 10 }}>{"// NOTIFICATIONS"}</div>
              {[
                { key: "showXPGain",     label: "XP gain toasts",         sub: "Show +XP popup on each log" },
                { key: "showMilestones", label: "Milestone descriptions", sub: "Show rank name on level-up" },
                { key: "compactCards",   label: "Compact exercise cards", sub: "Smaller cards in database" },
              ].map(({ key, label, sub }) => {
                const isOn = settings?.[key] !== false;
                return (
                  <div key={key} onClick={() => onUpdateSettings({ [key]: !isOn })} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 14px", marginBottom: 6, cursor: "pointer",
                    background: BG3, border: `1px solid ${ACCENT2}33`, borderRadius: 8
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT }}>{label}</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>{sub}</div>
                    </div>
                    <div style={{ width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                      background: isOn ? ACCENT : MUTED + "44", border: `1px solid ${isOn ? ACCENT + "88" : MUTED + "44"}`,
                      position: "relative", transition: "all .2s" }}>
                      <div style={{ position: "absolute", top: 3, left: isOn ? 21 : 3,
                        width: 14, height: 14, borderRadius: "50%",
                        background: isOn ? "#fff" : MUTED, transition: "left .2s",
                        boxShadow: isOn ? `0 0 6px ${ACCENT}` : "none" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* App info */}
            <div style={{ background: BG3, border: `1px solid ${ACCENT2}33`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 3, marginBottom: 8 }}>{"// SYSTEM INFO"}</div>
              {[
                ["Version", `v${APP_VERSION}`],
                ["App", "IRON REALM"],
                ["Exercises", "243"],
                ["XP Science", "NSCA · Schoenfeld · Contreras"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>{k}</span>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: ACCENT }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Data backup */}
            <div style={{ background: BG3, border: `1px solid ${ACCENT2}33`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 3, marginBottom: 10 }}>{"// DATA BACKUP"}</div>
              <button onClick={() => {
                try {
                  const data = localStorage.getItem("iron_realm_store_v1") || "{}";
                  const blob = new Blob([data], { type: "application/json" });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  a.href = url;
                  a.download = `iron-realm-backup-${new Date().toISOString().slice(0,10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast("Backup saved!", ACCENT);
                } catch { toast("Export failed", RED); }
              }} style={{
                width: "100%", marginBottom: 8, padding: "11px",
                background: `${ACCENT}15`, border: `1px solid ${ACCENT}55`,
                borderRadius: 6, cursor: "pointer",
                fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700,
                color: ACCENT, letterSpacing: 2
              }}>⬇ EXPORT DATA</button>
              <label style={{
                display: "block", width: "100%", padding: "11px",
                background: `${GOLD}15`, border: `1px solid ${GOLD}55`,
                borderRadius: 6, cursor: "pointer", textAlign: "center",
                fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700,
                color: GOLD, letterSpacing: 2, boxSizing: "border-box"
              }}>
                ⬆ IMPORT DATA
                <input type="file" accept=".json" style={{ display: "none" }} onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    try {
                      const parsed = JSON.parse(ev.target.result);
                      if (!parsed.profiles) throw new Error("Invalid backup file");
                      localStorage.setItem("iron_realm_store_v1", JSON.stringify(parsed));
                      toast("Data restored! Reloading…", GOLD);
                      setTimeout(() => window.location.reload(), 1200);
                    } catch { setImportError("Invalid backup file. Make sure you're using an Iron Realm export."); }
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }} />
              </label>
              {importError && <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: RED, marginTop: 6 }}>{importError}</div>}
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 8, lineHeight: 1.4 }}>
                Export saves all profiles, workouts, and progress as a JSON file. Import restores from a previous export.
              </div>
            </div>
            </div>
          </div>
        </div>, document.body)
      )}

      {/* ── HELP MODAL ── */}
      {settingsOpen === "help" && (
        createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1200, background: "rgba(3,6,15,0.95)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: "96px" }}
          onClick={() => setSettingsOpen(null)}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{
            background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
            border: `1px solid ${GOLD}44`, borderTop: `2px solid ${GOLD}`,
            width: "100%", maxWidth: 480,
            maxHeight: "85dvh", display: "flex", flexDirection: "column",
            position: "relative",
            clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${GOLD}cc, transparent)` }} />
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "24px 20px 32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: GOLD, letterSpacing: 2 }}>HOW TO PLAY</div>
              <button onClick={() => setSettingsOpen(null)} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>

            {[
              { icon: "⚔", title: "LOG WORKOUTS", color: ACCENT,
                body: "Go to SCHEDULE or WORKOUT to log exercises. Each set earns XP based on weight, reps, intensity, and proximity to failure. Compound lifts earn more XP than isolation work." },
              { icon: "◈", title: "XP & LEVELING", color: GOLD,
                body: "Your overall level rises as you accumulate XP. Each muscle group levels independently. XP is split across the sub-muscles you actually activate — based on real EMG data." },
              { icon: "⬡", title: "CALORIE SYSTEM", color: GREEN,
                body: "Log your daily calories on the Home screen. Eating at a surplus cancels XP equal to the excess calories — based on the energy balance principle from sports nutrition research." },
              { icon: "◇", title: "RANDOMIZER", color: ACCENT,
                body: "Hit RANDOMIZE in the Schedule screen to generate a hypertrophy-optimised workout. It avoids exercises you did within the last 48hrs (muscle recovery window) and matches your level and goal." },
              { icon: "▣", title: "DATABASE", color: ACCENT,
                body: "Browse 243 exercises organised by muscle group. Each card shows which sub-muscles are targeted. Use the search to find any exercise instantly." },
              { icon: "◉", title: "HUNTER STATS", color: GOLD,
                body: "The Hunter screen shows your full muscle breakdown. Expand Upper Body → Chest → and tap any sub-muscle to highlight it on the anatomy figure. Each sub-muscle has its own level." },
              { icon: "◆", title: "PROGRAMS", color: ACCENT,
                body: "Select a training program based on legendary athletes (Arnold Split, PPL, 5x5, etc.) or choose Free Workout for no fixed structure. Your schedule auto-populates from your program." },
              { icon: "△", title: "RANK SYSTEM", color: GOLD,
                body: "Your rank (E → D → C → B → A → S → SS → SSS → Shadow) is determined by your overall level. Each rank has 3 milestones earned through consistent training and dedication." },
            ].map(({ icon, title, color, body }) => (
              <div key={title} style={{ marginBottom: 16, background: BG3,
                border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`,
                borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, color, fontWeight: 900 }}>{icon}</span>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700, color, letterSpacing: 2 }}>{title}</span>
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{body}</div>
              </div>
            ))}
            </div>
          </div>
        </div>, document.body)
      )}

      {/* ── ACCOUNT MODAL ── */}
      {settingsOpen === "account" && (
        <AuthPanel
          onClose={() => setSettingsOpen(null)}
          onSignIn={async (creds) => {
            const ok = await onSignIn(creds);
            if (ok) setSettingsOpen(null);
          }}
          onSignUp={async (creds) => {
            const ok = await onSignUp(creds);
            if (ok) setSettingsOpen(null);
          }}
          busy={account.busy}
          error={account.error}
        />
      )}
    </div>
  );
}


// ─── SCREEN: DATABASE ─────────────────────────────────────────────────────────

// ─── PR HISTORY MODAL ────────────────────────────────────────────────────────

function PRSparkline({ events, color = GOLD }) {
  if (!events || events.length < 2) return null;
  const W = 80, H = 24, P = 2;
  const xs = events.map(e => e.date || 0);
  const ys = events.map(e => e.e1rm || 0);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const pts = events.map(e => {
    const x = P + ((e.date - xMin) / xRange) * (W - 2 * P);
    const y = H - P - ((e.e1rm - yMin) / yRange) * (H - 2 * P);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {events.map((e, i) => {
        const x = P + ((e.date - xMin) / xRange) * (W - 2 * P);
        const y = H - P - ((e.e1rm - yMin) / yRange) * (H - 2 * P);
        const isLast = i === events.length - 1;
        return <circle key={i} cx={x} cy={y} r={isLast ? 2 : 1.2} fill={isLast ? color : `${color}88`} />;
      })}
    </svg>
  );
}

// ─── CONDITION REPORT ─────────────────────────────────────────────────────────
// Every muscle's current condition, what has faded, how long it has been idle,
// and what a session would win back — the decay badge answers "how much", this
// answers "which, why, and what now".
function ConditionReportModal({ profile, onClose }) {
  const condition   = profile?.condition || {};
  const lastTrained = profile?.lastTrained || {};
  const earnedStats = profile?.earnedStats || {};
  const stats       = profile?.stats || {};

  const rows = Object.keys(MUSCLE_META)
    .filter(k => MUSCLE_META[k] && (earnedStats[k] > 0 || stats[k] > 0))
    .map(k => {
      const prm = atrophyParams(k);
      const c = condition[k] == null ? 1 : condition[k];
      const last = lastTrained[k] || null;
      const daysIdle = last ? Math.floor((Date.now() - last) / 86400000) : null;
      const earned = earnedStats[k] || stats[k] || 0;
      const now = stats[k] || 0;
      return { key: k, meta: MUSCLE_META[k], prm, c, last, daysIdle, earned,
        now, lost: Math.max(0, earned - now),
        status: conditionStatus(c),
        inGrace: daysIdle != null && daysIdle <= prm.grace,
        in30: projectCondition(c, daysIdle == null ? 0 : daysIdle, 30, prm),
        regain: c + ATROPHY.REGAIN * (1 - c) };
    })
    .sort((a, b) => a.c - b.c);

  const totalLost = rows.reduce((s, r) => s + r.lost, 0);
  const decaying  = rows.filter(r => r.c < 0.995).length;

  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain",
      zIndex: 1150, background: "rgba(3,6,15,0.95)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${BG}fa)`,
        border: `1px solid ${RED}33`, borderTop: `2px solid ${RED}`,
        width: "100%", maxWidth: 480, padding: "18px 16px 40px", maxHeight: "82dvh", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, color: RED, letterSpacing: 2 }}>
            CONDITION REPORT
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {rows.length === 0 ? (
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, padding: "20px 0" }}>
            No training history yet — log a workout and your condition will be tracked here.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, marginTop: 8 }}>
              {[{ v: decaying, l: "DECAYING", c: decaying ? RED : GREEN },
                { v: totalLost.toLocaleString(), l: "XP FADED", c: totalLost ? GOLD : GREEN },
                { v: rows.filter(r => r.status.label === "FRESH").length, l: "FRESH", c: GREEN }].map(s => (
                <div key={s.l} style={{ flex: 1, background: BG3, border: `1px solid ${s.c}22`,
                  borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: s.c }}>{s.v}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {rows.map(r => (
              <div key={r.key} style={{ background: BG2, border: `1px solid ${r.meta.color}22`,
                borderLeft: `3px solid ${r.status.color}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700,
                    color: r.meta.color, letterSpacing: 1 }}>{r.meta.name.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, fontWeight: 700,
                    color: r.status.color, letterSpacing: 1 }}>{r.status.label}</span>
                </div>

                <div style={{ position: "relative", height: 7, background: DARK1, borderRadius: 4,
                  overflow: "hidden", marginBottom: 6 }}>
                  <div style={{ position: "absolute", inset: 0, width: `${Math.round(r.c * 100)}%`,
                    background: `linear-gradient(90deg, ${r.status.color}55, ${r.status.color})`,
                    transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
                  <div style={{ position: "absolute", left: `${Math.round(r.prm.floor * 100)}%`, top: 0, bottom: 0,
                    width: 1, background: MUTED, opacity: 0.5 }} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'Rajdhani',sans-serif",
                  fontSize: 10, color: MUTED }}>
                  <span style={{ color: r.status.color }}>{Math.round(r.c * 100)}% condition</span>
                  <span>{r.daysIdle == null ? "never trained" : r.daysIdle === 0 ? "trained today" : `${r.daysIdle}d since trained`}</span>
                </div>

                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>
                  {r.lost > 0 && <span style={{ color: RED }}>▼ {r.lost.toLocaleString()} XP faded ({r.now.toLocaleString()} of {r.earned.toLocaleString()}). </span>}
                  {r.inGrace && r.c >= 0.995
                    ? `Inside the ${r.prm.grace}-day grace window — nothing lost yet.`
                    : r.inGrace
                      ? `Holding inside the ${r.prm.grace}-day grace window, but still down from an earlier layoff. One direct session → ${Math.round(r.regain * 100)}%.`
                      : r.c > r.prm.floor + 0.005
                        ? `Another 30 days idle → ${Math.round(r.in30 * 100)}%. One direct session → ${Math.round(r.regain * 100)}%.`
                        : `At the ${Math.round(r.prm.floor * 100)}% floor — muscle memory holds it here. One direct session → ${Math.round(r.regain * 100)}%.`}
                </div>
              </div>
            ))}

            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 10, lineHeight: 1.5 }}>
              Condition decays only after a grace window ({ATROPHY.muscular.grace}d for muscle, {ATROPHY.cardio.grace}d for endurance),
              fastest at first and levelling off toward a floor you never drop below. Each session rebuilds about a
              third of what is missing, scaled by how much of that session actually loaded the muscle — so compounds
              maintain, direct work rebuilds.
            </div>
          </>
        )}
      </div>
    </div>
  , document.body);
}

function PRHistoryModal({ workouts, prs, onClose }) {
  const timeline = useMemo(() => getPRTimeline(workouts), [workouts]);
  const [expanded, setExpanded] = useState(null);

  const items = Object.entries(prs || {})
    .map(([name, e1rm]) => ({
      name,
      e1rm: Math.round(Number(e1rm) || 0),
      events: timeline[name] || [],
    }))
    .filter(item => item.e1rm > 0)
    .sort((a, b) => b.e1rm - a.e1rm);

  return (
    createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150, background: "rgba(3,6,15,0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
        border: `1px solid ${GOLD}44`, borderTop: `2px solid ${GOLD}`,
        width: "100%", maxWidth: 480, padding: "24px 20px 40px",
        maxHeight: "90vh", overflowY: "auto", position: "relative",
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}cc, transparent)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: GOLD, letterSpacing: 2 }}>PERSONAL RECORDS</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginTop: 2 }}>{items.length} exercises tracked</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0", fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED }}>
            Log a strength workout to start tracking PRs.
          </div>
        )}

        {items.map(item => {
          const isOpen = expanded === item.name;
          const lastEvent = item.events[item.events.length - 1];
          return (
            <div key={item.name} style={{
              background: BG2, border: `1px solid ${GOLD}1a`,
              borderRadius: 8, marginBottom: 8, overflow: "hidden",
            }}>
              <button onClick={() => setExpanded(isOpen ? null : item.name)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                background: "none", border: "none", padding: "12px 14px",
                cursor: "pointer", textAlign: "left",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.name}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 2 }}>
                    {item.events.length} PR{item.events.length === 1 ? "" : "s"}
                    {lastEvent && ` · last ${new Date(lastEvent.date).toLocaleDateString()}`}
                  </div>
                </div>
                <PRSparkline events={item.events} />
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: 56 }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: GOLD }}>
                    {item.e1rm}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1 }}>{wtLabel().toUpperCase()} e1RM</div>
                </div>
              </button>

              {isOpen && item.events.length > 0 && (
                <div style={{ borderTop: `1px solid ${GOLD}22`, padding: "8px 14px 12px" }}>
                  {item.events.slice().reverse().map((e, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "6px 0",
                      borderBottom: i < item.events.length - 1 ? `1px solid ${GOLD}11` : "none",
                    }}>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: TEXT }}>
                        {wtVal(e.weight)} {wtLabel()} × {e.reps}
                      </div>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: GOLD }}>
                        {e.e1rm} e1RM
                      </div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                        {new Date(e.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isOpen && item.events.length === 0 && (
                <div style={{ borderTop: `1px solid ${GOLD}22`, padding: "10px 14px", fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
                  No tracked PR events yet — older workouts may pre-date the PR log.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>, document.body)
  );
}


// ─── WORKOUT HEATMAP MODAL ───────────────────────────────────────────────────

function HeatmapModal({ workouts, onClose }) {
  const WEEKS = 13;
  const TOTAL_DAYS = WEEKS * 7;

  const data = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startMs = today.getTime() - (TOTAL_DAYS - 1) * 86400000;

    const xpByDay = {};
    for (const w of (workouts || [])) {
      const d = new Date(w.date || 0);
      if (isNaN(d.getTime()) || d.getTime() < startMs) continue;
      d.setHours(0, 0, 0, 0);
      const k = d.getTime();
      xpByDay[k] = (xpByDay[k] || 0) + (w.xp || 0);
    }

    const cells = [];
    let weekIdx = 0;
    let totalXP = 0;
    let activeDays = 0;
    let maxDaily = 0;
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const d = new Date(startMs + i * 86400000);
      d.setHours(0, 0, 0, 0);
      const dow = d.getDay();
      if (i > 0 && dow === 0) weekIdx++;
      const xp = xpByDay[d.getTime()] || 0;
      cells.push({ date: d, key: d.getTime(), dow, weekIdx, xp });
      if (xp > 0) { totalXP += xp; activeDays++; }
      if (xp > maxDaily) maxDaily = xp;
    }

    let currentStreak = 0;
    for (let i = cells.length - 1; i >= 0; i--) {
      if (cells[i].xp > 0) currentStreak++;
      else if (i === cells.length - 1 && cells[i].xp === 0) continue; // grace for today not yet trained
      else break;
    }

    let longestStreak = 0;
    let runStreak = 0;
    for (const c of cells) {
      if (c.xp > 0) { runStreak++; longestStreak = Math.max(longestStreak, runStreak); }
      else runStreak = 0;
    }

    const totalWeeks = weekIdx + 1;
    return { cells, totalXP, activeDays, currentStreak, longestStreak, maxDaily, totalWeeks };
  }, [workouts]);

  const [selected, setSelected] = useState(null);

  const colorForXP = (xp) => {
    if (xp === 0) return "transparent";
    const intensity = Math.min(1, xp / Math.max(1, data.maxDaily));
    const alpha = 0.25 + intensity * 0.75;
    const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
    return `${ACCENT}${a}`;
  };

  // Day-of-week labels: show M, W, F to keep it sparse and readable
  const dowLabel = (i) => (i === 1 ? "M" : i === 3 ? "W" : i === 5 ? "F" : "");

  // Month labels at top: emit when the month changes between consecutive weeks
  const monthLabels = (() => {
    const result = []; // { weekIdx, label }
    let lastMonth = -1;
    for (const c of data.cells) {
      if (c.dow === 0 || c.weekIdx === 0) {
        const m = c.date.getMonth();
        if (m !== lastMonth) {
          result.push({ weekIdx: c.weekIdx, label: c.date.toLocaleString("en", { month: "short" }).toUpperCase() });
          lastMonth = m;
        }
      }
    }
    return result;
  })();

  const dayWorkouts = selected
    ? (workouts || []).filter(w => {
        const d = new Date(w.date || 0);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === selected.key;
      })
    : [];

  const Stat = ({ label, value, color = ACCENT }) => (
    <div style={{ background: BG3, border: `1px solid ${color}22`, borderRadius: 6, padding: "8px 6px", textAlign: "center" }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1, marginTop: 2 }}>{label}</div>
    </div>
  );

  const CELL = 13, GAP = 2;

  return (
    createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150, background: "rgba(3,6,15,0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
        border: `1px solid ${ACCENT}44`, borderTop: `2px solid ${ACCENT}`,
        width: "100%", maxWidth: 480, padding: "24px 20px 40px",
        maxHeight: "90vh", overflowY: "auto", position: "relative",
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${ACCENT}cc, transparent)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 700, color: ACCENT, letterSpacing: 2 }}>TRAINING HEATMAP</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginTop: 2 }}>last {WEEKS} weeks</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 18 }}>
          <Stat label="ACTIVE" value={data.activeDays} />
          <Stat label="CURRENT" value={data.currentStreak} color={GOLD} />
          <Stat label="LONGEST" value={data.longestStreak} color={GOLD} />
          <Stat label="TOTAL XP" value={data.totalXP.toLocaleString()} />
        </div>

        {/* Month labels */}
        <div style={{ position: "relative", height: 14, marginBottom: 4, marginLeft: 14 }}>
          {monthLabels.map(({ weekIdx, label }, i) => (
            <span key={i} style={{
              position: "absolute", left: weekIdx * (CELL + GAP),
              fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1,
            }}>{label}</span>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display: "flex", gap: GAP, marginBottom: 12 }}>
          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP, width: 12 }}>
            {[0, 1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{
                fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED,
                display: "flex", alignItems: "center",
              }}>{dowLabel(i)}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{
            display: "grid",
            gridTemplateRows: `repeat(7, ${CELL}px)`,
            gridAutoColumns: `${CELL}px`,
            gap: GAP,
          }}>
            {data.cells.map(c => {
              const isSelected = selected?.key === c.key;
              return (
                <button key={c.key}
                  onClick={() => setSelected(isSelected ? null : c)}
                  style={{
                    gridRow: c.dow + 1,
                    gridColumn: c.weekIdx + 1,
                    background: colorForXP(c.xp),
                    border: isSelected
                      ? `1.5px solid ${GOLD}`
                      : c.xp > 0 ? `1px solid ${ACCENT}66` : `1px solid ${ACCENT}1a`,
                    borderRadius: 2, cursor: "pointer", padding: 0,
                    transition: "transform .1s",
                    transform: isSelected ? "scale(1.15)" : "none",
                  }}
                  title={`${c.date.toLocaleDateString()} · ${c.xp} XP`}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1, marginBottom: 16 }}>
          <span>LESS</span>
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const a = Math.round((t === 0 ? 0 : 0.25 + t * 0.75) * 255).toString(16).padStart(2, "0");
            return <span key={t} style={{
              width: 10, height: 10,
              background: t === 0 ? "transparent" : `${ACCENT}${a}`,
              border: `1px solid ${ACCENT}${t === 0 ? "1a" : "66"}`,
              borderRadius: 2,
            }} />;
          })}
          <span>MORE</span>
        </div>

        {/* Selected day detail */}
        {selected && (
          <div style={{ background: BG3, border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: ACCENT, letterSpacing: 2 }}>
                {selected.date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
              </span>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: GOLD }}>
                +{selected.xp} XP
              </span>
            </div>
            {dayWorkouts.length === 0 ? (
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>No workouts logged this day.</div>
            ) : dayWorkouts.map((w, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "5px 0",
                borderBottom: i < dayWorkouts.length - 1 ? `1px solid ${ACCENT}11` : "none",
              }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 }}>
                  {w.exercise?.name || w.exerciseName || "Training"}
                </span>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: GOLD, flexShrink: 0 }}>+{w.xp} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>, document.body)
  );
}


// ─── AWAKENING MODAL ──────────────────────────────────────────────────────────
// Triggered the first time the user crosses the awakening level. Forces a
// permanent aspect choice — no XP rewards, just a cosmetic identity that
// tints their leaderboard card.

function AwakeningModal({ onChoose }) {
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150,
      background: "rgba(3,6,15,0.95)", backdropFilter: "blur(16px)",
      display: "flex", alignItems: "safe center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        width: "100%", maxWidth: 480, padding: "32px 22px",
        background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
        border: `1px solid ${GOLD}55`, borderTop: `2px solid ${GOLD}`,
        borderRadius: 14, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}cc, transparent)` }} />

        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: GOLD,
            letterSpacing: 6, marginBottom: 6 }}>// AWAKENING</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900,
            color: GOLD, letterSpacing: 3, marginBottom: 8,
            textShadow: `0 0 20px ${GOLD}66` }}>
            CHOOSE YOUR PATH
          </div>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
            color: MUTED, lineHeight: 1.5 }}>
            Level {AWAKENING_LEVEL} reached. Pick the aspect that defines you.<br/>
            <span style={{ color: GOLD }}>This choice is permanent.</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ASPECTS.map(a => (
            <button key={a.id} onClick={() => onChoose(a.id)} style={{
              padding: "14px 16px", textAlign: "left", cursor: "pointer",
              background: `${a.color}10`, border: `1.5px solid ${a.color}66`,
              borderRadius: 10, transition: "all .15s",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `radial-gradient(circle, ${a.color}55, ${a.color}11)`,
                border: `2px solid ${a.color}88`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, color: a.color,
                boxShadow: `0 0 14px ${a.color}44`,
              }}>{a.glyph}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13,
                  fontWeight: 700, color: a.color, letterSpacing: 2 }}>
                  PATH OF THE {a.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11,
                  color: MUTED, marginTop: 3, lineHeight: 1.4 }}>
                  {a.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  , document.body);
}


// ─── VOLUME CHART ─────────────────────────────────────────────────────────────
// Inline 12-week tonnage line chart for the Hunter screen. Stored weights are
// in lbs; we convert to display unit at render time via wtVal/wtLabel.

function _workoutTonnage(w) {
  if (Array.isArray(w?.sets_detail) && w.sets_detail.length > 0) {
    return w.sets_detail.reduce((s, set) => s + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
  }
  const weight = Number(w?.weight) || 0;
  const reps   = Number(w?.reps)   || 0;
  const sets   = Number(w?.sets)   || 1;
  return weight * reps * sets;
}

// ─── MUSCLE RECOVERY ─────────────────────────────────────────────────────────
// Heuristic recovery state per major muscle group based on time since last
// session targeting it. No volume weighting — keeps the logic simple and
// transparent. Thresholds tuned for hypertrophy/recovery norms.

const RECOVERY_MUSCLES = [
  { key: "chest",     name: "Chest" },
  { key: "back",      name: "Back" },
  { key: "shoulders", name: "Shoulders" },
  { key: "bicep",     name: "Biceps" },
  { key: "tricep",    name: "Triceps" },
  { key: "forearms",  name: "Forearms" },
  { key: "legs",      name: "Legs" },
  { key: "glutes",    name: "Glutes" },
  { key: "calves",    name: "Calves" },
  { key: "core",      name: "Core" },
];

function _recoveryState(hoursAgo) {
  if (hoursAgo == null)  return { label: "UNTRAINED", color: "#666",   weight: 0 };
  if (hoursAgo < 24)     return { label: "FATIGUED",  color: "#e05555", weight: 4 };
  if (hoursAgo < 48)     return { label: "RECOVERING",color: "#f59e0b", weight: 3 };
  if (hoursAgo < 72)     return { label: "RECOVERED", color: "#e8c44a", weight: 2 };
  return                     { label: "FRESH",      color: "#4ecb71", weight: 1 };
}

function _computeRecovery(workouts) {
  const lastByMuscle = {};
  for (const w of workouts || []) {
    if (!w?.date || !w?.muscle) continue;
    if (!lastByMuscle[w.muscle] || w.date > lastByMuscle[w.muscle]) {
      lastByMuscle[w.muscle] = w.date;
    }
  }
  const now = Date.now();
  return RECOVERY_MUSCLES.map(m => {
    const last = lastByMuscle[m.key];
    const hoursAgo = last ? (now - last) / 3600000 : null;
    return { ...m, hoursAgo, lastDate: last, state: _recoveryState(hoursAgo) };
  });
}

function RecoveryGrid({ workouts }) {
  const rows = useMemo(() => _computeRecovery(workouts), [workouts]);
  return (
    <div style={{ background: BG2, border: `1px solid ${ACCENT}22`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4, marginBottom: 10 }}>
        [ MUSCLE RECOVERY ]
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {rows.map(r => (
          <div key={r.key} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 9px", background: `${r.state.color}11`,
            border: `1px solid ${r.state.color}44`, borderRadius: 6,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
              background: r.state.color, boxShadow: `0 0 6px ${r.state.color}88`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, color: TEXT, lineHeight: 1.1 }}>
                {r.name}
              </div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: r.state.color, letterSpacing: 1 }}>
                {r.lastDate ? _timeAgo(r.lastDate) : "never"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function _weeklyTonnage(workouts, weeks = 12) {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const buckets = Array(weeks).fill(0);
  for (const w of workouts || []) {
    if (!w?.date) continue;
    const ageWeeks = Math.floor((now - w.date) / weekMs);
    if (ageWeeks < 0 || ageWeeks >= weeks) continue;
    buckets[weeks - 1 - ageWeeks] += _workoutTonnage(w);
  }
  return buckets;
}

// ─── SHADOW RACE ──────────────────────────────────────────────────────────────
// Race your past self: cumulative tonnage this month vs the pace last-month
// you had set by this same day of the month.
function ShadowRace({ workouts }) {
  const d = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth(), day = now.getDate();
    const startThis = new Date(y, m, 1).getTime();
    const startPrev = new Date(y, m - 1, 1).getTime();
    const endPrevSameDay = new Date(y, m - 1, day, 23, 59, 59).getTime();
    let cur = 0, ghost = 0, prevTotal = 0;
    for (const w of workouts || []) {
      if (!w?.date) continue;
      const t = _workoutTonnage(w);
      if (w.date >= startThis) cur += t;
      else if (w.date >= startPrev && w.date < startThis) {
        prevTotal += t;
        if (w.date <= endPrevSameDay) ghost += t;
      }
    }
    return { cur, ghost, prevTotal };
  }, [workouts]);
  if (d.cur === 0 && d.prevTotal === 0) return null;
  const max = Math.max(d.cur, d.ghost, 1);
  const pctYou = Math.max(4, (d.cur / max) * 100);
  const pctGhost = Math.max(4, (d.ghost / max) * 100);
  const ahead = d.cur - d.ghost;
  const ghostMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleDateString("en", { month: "long" });
  const lane = (label, pct, color, glyph, value) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color, letterSpacing: 2 }}>{glyph} {label}</span>
        <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>{Math.round(wtVal(value)).toLocaleString()} {wtLabel()}</span>
      </div>
      <div style={{ position: "relative", height: 10, background: DARK1, borderRadius: 5, overflow: "hidden", border: `1px solid ${color}22` }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}22, ${color}88)`,
          transition: "width 1s cubic-bezier(.16,1,.3,1)" }} />
        <div style={{ position: "absolute", left: `calc(${pct}% - 5px)`, top: 1, width: 8, height: 8,
          borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}, 0 0 16px ${color}66` }} />
      </div>
    </div>
  );
  return (
    <div style={{ background: BG2, border: `1px solid #a855f722`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: "#a855f7", letterSpacing: 4 }}>
          [ SHADOW RACE — THIS MONTH ]
        </div>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ahead >= 0 ? GREEN : RED, letterSpacing: 1 }}>
          {ahead >= 0 ? "AHEAD" : "BEHIND"} {Math.round(wtVal(Math.abs(ahead))).toLocaleString()} {wtLabel()}
        </div>
      </div>
      {lane("YOU", pctYou, ACCENT, "⚡", d.cur)}
      {lane(`${ghostMonth.toUpperCase()} YOU`, pctGhost, "#a855f7", "👻", d.ghost)}
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, lineHeight: 1.4 }}>
        {ahead >= 0
          ? `Your shadow lifted ${Math.round(wtVal(d.prevTotal)).toLocaleString()} ${wtLabel()} total in ${ghostMonth}. Stay ahead of it.`
          : `Your ${ghostMonth} self is outpacing you. Close the gap.`}
      </div>
    </div>
  );
}

function VolumeChart({ workouts }) {
  const data = useMemo(() => _weeklyTonnage(workouts, 12), [workouts]);
  const peak = Math.max(...data, 1);
  const total = data.reduce((s, v) => s + v, 0);
  const active = data.filter(v => v > 0).length;
  const avg = active > 0 ? total / active : 0;
  const current = data[data.length - 1];
  const prev = data[data.length - 2] || 0;
  const trendUp = current > prev;
  const trendPct = prev > 0 ? Math.round(((current - prev) / prev) * 100) : null;

  // Empty state
  if (total === 0) {
    return (
      <div style={{ background: BG2, border: `1px solid ${ACCENT}22`, borderRadius: 10, padding: "14px 16px", marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4, marginBottom: 6 }}>
          [ VOLUME TREND ]
        </div>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>
          Log a strength workout to start tracking weekly tonnage.
        </div>
      </div>
    );
  }

  // SVG geometry — viewBox for crisp scaling
  const W = 280, H = 70;
  const stepX = W / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = H - (v / peak) * (H - 6) - 3;
    return [x, y];
  });
  const linePath = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const fillPath = `${linePath} L${W},${H} L0,${H} Z`;

  // Reveal-driven draw-in: bars and line animate when the chart scrolls into view
  const wrapRef = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ background: BG2, border: `1px solid ${ACCENT}22`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4 }}>
          [ VOLUME TREND — 12 WEEKS ]
        </div>
        {trendPct !== null && (
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: trendUp ? GREEN : RED, letterSpacing: 1 }}>
            {trendUp ? "▲" : "▼"} {Math.abs(trendPct)}%
          </div>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: 70, display: "block" }}>
        <defs>
          <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={ACCENT} stopOpacity="0.45" />
            <stop offset="100%" stopColor="#b455ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Background bars rising from zero */}
        {data.map((v, i) => {
          const bh = (v / peak) * (H - 6);
          return (
            <rect key={i} x={i * stepX - 3} y={H - bh - 3} width={6} height={bh}
              fill={ACCENT} opacity={0.22} rx={1}
              style={{ transformOrigin: `${i * stepX}px ${H}px`,
                animation: seen ? `barRise .55s cubic-bezier(.16,1,.3,1) ${i * 35}ms both` : "none",
                transform: seen ? undefined : "scaleY(0)" }} />
          );
        })}
        <path d={fillPath} fill="url(#volFill)"
          style={{ opacity: seen ? 1 : 0, transition: "opacity .6s ease-out .55s" }} />
        <path d={linePath} fill="none" stroke={ACCENT} strokeWidth="1.6" pathLength="1"
          style={{ filter: `drop-shadow(0 0 4px ${ACCENT})`,
            strokeDasharray: 1, strokeDashoffset: 1,
            animation: seen ? "lineDraw 1s cubic-bezier(.4,0,.2,1) .35s forwards" : "none" }} />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 3.4 : 1.6}
            fill={i === points.length - 1 ? GOLD : ACCENT}
            style={{ transformOrigin: `${x}px ${y}px`,
              animation: seen ? `dotIn .25s cubic-bezier(.16,1,.3,1) ${0.4 + i * 0.05}s both` : "none",
              transform: seen ? undefined : "scale(0)",
              filter: i === points.length - 1 ? `drop-shadow(0 0 6px ${GOLD})` : "none" }} />
        ))}
      </svg>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 10 }}>
        {[
          ["THIS WEEK", `${Math.round(wtVal(current)).toLocaleString()} ${wtLabel()}`],
          ["AVG / WK",  `${Math.round(wtVal(avg)).toLocaleString()} ${wtLabel()}`],
          ["PEAK",      `${Math.round(wtVal(peak)).toLocaleString()} ${wtLabel()}`],
        ].map(([label, val]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700, color: GOLD }}>{val}</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


function CharacterScreen({ store, onSwitchProfile, onCreateProfile, onDeleteProfile, onUpdateProfile, onSetPatronLift, toast }) {
  const st = store.profiles[store.activeId];
  const rank = getRank(st.overallLevel);
  const { current, needed } = getLevelFromXP(st.overallXP);
  const profiles = Object.values(store.profiles);

  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editName, setEditName] = useState(st.name);
  const [editAge, setEditAge] = useState(String(st.age || ""));
  const [editWeight, setEditWeight] = useState(String(st.weightLbs || 170));
  const [editHeightFt, setEditHeightFt] = useState(String(Math.floor((st.heightIn || 70) / 12)));
  const [editHeightIn, setEditHeightIn] = useState(String((st.heightIn || 70) % 12));
  const [editGender, setEditGender] = useState(st.gender || "male");

  const handleSaveEdit = () => {
    const totalIn = (parseInt(editHeightFt) || 5) * 12 + (parseInt(editHeightIn) || 10);
    onUpdateProfile(store.activeId, {
      name: editName.trim() || st.name,
      age: parseInt(editAge) || null,
      weightLbs: getWtUnit()==="kg" ? (parseFloat(editWeight)||st.weightLbs)/0.453592 : (parseFloat(editWeight)||st.weightLbs),
      heightIn: totalIn,
      gender: editGender,
    });
    setEditMode(false);
    toast("Profile updated", GREEN);
  };

  const specialStats = ["cardio", "calisthenics"];
  const [selectedMuscle, setSelectedMuscle]   = useState(null);
  const [prHistoryOpen, setPrHistoryOpen]     = useState(false);
  const [heatmapOpen, setHeatmapOpen]         = useState(false);
  const [patronPickerOpen, setPatronPickerOpen] = useState(false);
  const [relicVaultOpen, setRelicVaultOpen]     = useState(false);
  const [conditionOpen, setConditionOpen]       = useState(false);

  // 3-layer tree: super-group → muscle group → sub-muscles (SVG IDs)
  const STAT_TREE = [
    { key: "upper", label: "Upper Body", color: "#e85d4a", glyph: "UB", groups: [
      { key: "chest",     subs: ["upper-pectoralis","mid-lower-pectoralis"] },
      { key: "back",      subs: ["lats","lowerback","upper-trapezius","traps-middle","lower-trapezius"] },
      { key: "shoulders", subs: ["anterior-deltoid","lateral-deltoid","posterior-deltoid"] },
    ]},
    { key: "arms", label: "Arms", color: "#4a9eff", glyph: "AR", groups: [
      { key: "bicep",    subs: ["long-head-bicep","short-head-bicep"] },
      { key: "tricep",   subs: ["long-head-triceps","lateral-head-triceps","medial-head-triceps"] },
      { key: "forearms", subs: ["wrist-flexors","wrist-extensors"] },
    ]},
    { key: "lower", label: "Lower Body", color: "#a855f7", glyph: "LB", groups: [
      { key: "legs",   subs: ["outer-quadricep","rectus-femoris","inner-quadricep","inner-thigh","lateral-hamstrings","medial-hamstrings"] },
      { key: "glutes", subs: ["gluteus-maximus","gluteus-medius"] },
      { key: "calves", subs: ["gastrocnemius","soleus","tibialis"] },
    ]},
    { key: "core", label: "Core", color: "#22c55e", glyph: "CR", groups: [
      { key: "core", subs: ["upper-abdominals","lower-abdominals","obliques"] },
    ]},
  ];

  // Sum XP across a group's sub-muscle SVG IDs
  const getGroupXP = (groupKey, subs) => {
    const direct = st.stats[groupKey] || 0;
    const fromSubs = subs.reduce((sum, svgId) => sum + (st.subStats?.[svgId] || 0), 0);
    return direct + fromSubs || direct;
  };

  const getSuperXP = (superNode) =>
    superNode.groups.reduce((sum, g) => sum + getGroupXP(g.key, g.subs), 0);

  const subStats  = st.subStats  || {};
  const subLevels = st.subLevels || {};
  const subMuscleLevels = Object.fromEntries(
    Object.entries(subStats).map(([id, xp]) => [id, getMuscleLevel(xp)])
  );

  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: "transparent", padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
      {/* ── PROFILE SWITCHER ── */}
      <div style={{ background: `${BG2}ee`, borderBottom: `1px solid ${ACCENT2}44`, padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4 }}>[ HUNTERS ]</div>
          <button onClick={onCreateProfile} style={{
            background: `${ACCENT}22`, border: `1px solid ${ACCENT}55`, borderRadius: 6,
            padding: "4px 12px", cursor: "pointer",
            fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: ACCENT, fontWeight: 700, letterSpacing: 1
          }}>+ NEW</button>
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
          {profiles.map(p => {
            const isActive = p.id === store.activeId;
            const r = getRank(p.overallLevel);
            return (
              <button key={p.id} className="card-in" onClick={() => onSwitchProfile(p.id)} style={{
                background: isActive ? `${ACCENT}22` : BG3,
                border: `1px solid ${isActive ? ACCENT : ACCENT2 + "44"}`,
                borderRadius: 10, padding: "8px 14px", cursor: "pointer", flexShrink: 0,
                textAlign: "center", minWidth: 80, transition: "all .15s",
                animationDelay: `${profiles.indexOf(p) * 70}ms`
              }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900,
                  color: r.color, textShadow: isActive ? `0 0 10px ${r.color}66` : "none" }}>{r.rank}</div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: isActive ? ACCENT : MUTED,
                  letterSpacing: 1, marginTop: 2, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>LVL {p.overallLevel}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "16px 18px" }}>
        {/* ── RANK CARD — tilts toward touch, glare tracks the pointer ── */}
        <TiltCard>
        <div className="card-in" style={{ background: `${rank.color}11`, border: `1px solid ${rank.color}44`,
          borderRadius: 14, padding: "16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start",
          position: "relative", overflow: "hidden",
          ...(relicStyle(st.cosmetics?.equippedRelic) || {}) }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), #ffffff10, transparent 55%)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {/* Holographic Soul Core (three.js) */}
                <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ position: "absolute", inset: -8, borderRadius: "50%",
                    background: `radial-gradient(circle, ${rank.color}33 0%, transparent 60%)`,
                    filter: "blur(8px)" }} />
                  <Suspense fallback={null}><SoulCore color={rank.color} size={88} /></Suspense>
                  <div style={{ position: "absolute", fontFamily: "'Orbitron',sans-serif",
                    fontSize: 20, fontWeight: 900, color: rank.color, pointerEvents: "none",
                    textShadow: `0 0 14px ${rank.color}, 0 0 30px ${rank.color}88`,
                    animation: "emblemPulse 2.8s ease-in-out infinite" }}>{rank.rank}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 3 }}>OVERALL RANK</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: rank.color, letterSpacing: 2, fontWeight: 700 }}>{rank.label}</div>
                </div>
              </div>
              <button onClick={() => { setEditMode(!editMode); setEditName(st.name); setEditAge(String(st.age||"")); setEditWeight(String(st.weightLbs||170)); setEditHeightFt(String(Math.floor((st.heightIn||70)/12))); setEditHeightIn(String((st.heightIn||70)%12)); setEditGender(st.gender||"male"); }} style={{
                background: editMode ? `${GOLD}22` : BG3, border: `1px solid ${editMode ? GOLD : ACCENT2 + "44"}`,
                borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: editMode ? GOLD : MUTED,
                letterSpacing: 1, fontWeight: 700
              }}>{editMode ? "CANCEL" : "EDIT"}</button>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: ACCENT }}>LVL {st.overallLevel}</span>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}><CountUp value={current} locale duration={1200} /> / {needed.toLocaleString()} XP</span>
              </div>
              <div className="shimmer-bar">
                <XPBar current={current} needed={needed} color={rank.color} height={6} />
              </div>
            </div>
          </div>
        </div>
        </TiltCard>

        {/* ── EDIT FORM ── */}
        {editMode && (
          <div className="slide-up" style={{ background: BG2, border: `1px solid ${GOLD}33`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, letterSpacing: 4, marginBottom: 14 }}>[ EDIT PROFILE ]</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>NAME</div>
                <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} maxLength={20}/>
              </div>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>AGE</div>
                <input className="input-field" type="number" value={editAge} onChange={e => setEditAge(e.target.value)} placeholder="25" min="13" max="99"/>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>WEIGHT (LBS)</div>
                <input className="input-field" type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} placeholder="170"/>
              </div>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>HEIGHT FT</div>
                <input className="input-field" type="number" value={editHeightFt} onChange={e => setEditHeightFt(e.target.value)} placeholder="5" min="3" max="7"/>
              </div>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>HEIGHT IN</div>
                <input className="input-field" type="number" value={editHeightIn} onChange={e => setEditHeightIn(e.target.value)} placeholder="10" min="0" max="11"/>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 6 }}>GENDER</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[{id:"male",label:"WARRIOR (Male)"},{id:"female",label:"SHADOW (Female)"}].map(g => (
                  <button key={g.id} onClick={() => setEditGender(g.id)} style={{
                    background: editGender === g.id ? `${ACCENT}22` : BG3,
                    border: `1px solid ${editGender === g.id ? ACCENT : ACCENT2 + "33"}`,
                    borderRadius: 8, padding: "10px", cursor: "pointer",
                    fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700,
                    color: editGender === g.id ? ACCENT : MUTED
                  }}>{g.label}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={handleSaveEdit} className="btn-gold" style={{ padding: "11px", fontSize: 13, letterSpacing: 2 }}>SAVE CHANGES</button>
              {profiles.length > 1 && (
                <button onClick={() => setDeleteConfirm(store.activeId)} style={{
                  background: `${RED}11`, border: `1px solid ${RED}44`, borderRadius: 8, padding: "11px",
                  cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: RED, fontWeight: 700, letterSpacing: 1
                }}>DELETE PROFILE</button>
              )}
            </div>
          </div>
        )}

        {/* ── DELETE CONFIRM ── */}
        {deleteConfirm && (
          <div style={{ background: `${RED}11`, border: `1px solid ${RED}55`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, color: RED, marginBottom: 8 }}>DELETE PROFILE?</div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: TEXT, marginBottom: 14, lineHeight: 1.5 }}>
              This will permanently erase all XP, levels, and progress for <strong>{st.name}</strong>. This cannot be undone.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                background: BG3, border: `1px solid ${MUTED}33`, borderRadius: 8, padding: "10px",
                cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED
              }}>CANCEL</button>
              <button onClick={() => { onDeleteProfile(deleteConfirm); setDeleteConfirm(null); setEditMode(false); }} style={{
                background: RED, border: "none", borderRadius: 8, padding: "10px",
                cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
                color: "#fff", fontWeight: 700, letterSpacing: 1
              }}>CONFIRM DELETE</button>
            </div>
          </div>
        )}

        {/* ── BODY FIGURE — holographic scan frame ── */}
        <div className="card-in card-in-2" style={{ marginBottom: 16, padding: "0 8px" }}>
          <BodyFigure levels={st.levels} subLevels={subMuscleLevels} gender={st.gender} highlight={selectedMuscle} />
        </div>

        {/* ── ATROPHY WARNING ── */}
        {(() => {
          // EMG-aware: a bench press keeps front delts trained, so credit every
          // stat a workout actually touches — same mapping the rebuild uses.
          const lastByMuscle = {};
          const creditB = (m, d) => { if (m && d && (!lastByMuscle[m] || d > lastByMuscle[m])) lastByMuscle[m] = d; };
          for (const w of st.workouts || []) {
            const ex = w.exercise || {};
            const muscle = w.muscle || ex.primary || "chest";
            const emg = ex.emg || EXERCISE_EMG[ex.name];
            if (ex.type === "cardio") creditB("cardio", w.date);
            else if (emg) Object.keys(emg).forEach(svgId => creditB(SVG_TO_STAT[svgId] || muscle, w.date));
            else {
              const statKey = ex.type === "calisthenics" && !["chest","arms","core"].includes(muscle) ? "calisthenics" : muscle;
              creditB(statKey, w.date); if (statKey !== muscle) creditB(muscle, w.date);
            }
          }
          const decaying = Object.entries(lastByMuscle).filter(([m, d]) =>
            (Date.now() - d) / 86400000 > atrophyParams(m).grace);
          if (!decaying.length) return null;
          const worstDays = Math.floor((Date.now() - Math.min(...decaying.map(([, d]) => d))) / 86400000);
          return (
            <div style={{ background: `${RED}0d`, border: `1px solid ${RED}44`, borderLeft: `3px solid ${RED}`,
              borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: RED, letterSpacing: 2, marginBottom: 3 }}>
                ⚠ ATROPHY ACTIVE
              </div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT, lineHeight: 1.5 }}>
                {decaying.length} muscle group{decaying.length > 1 ? "s" : ""} detraining — longest untrained {worstDays} days.
                Condition fades fastest in the first weeks idle and levels off (never below 40%).
                Each session rebuilds ~a third of what's lost — muscle memory makes the road back short.
              </div>
            </div>
          );
        })()}

        {/* ── PATRON LIFT ── */}
        {(() => {
          const prs = st.prs || {};
          const prKeys = Object.keys(prs);
          const patronLift = st.patronLift || null;
          const patronE1RM = patronLift ? prs[patronLift] : null;
          const hasAnyPr = prKeys.length > 0;
          return (
            <div style={{ marginBottom: 8 }}>
              {patronLift ? (
                <div style={{ background: `${GOLD}0e`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 2 }}>SIGNATURE LIFT</div>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{patronLift}</div>
                    {patronE1RM && (
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: GOLD, marginTop: 2 }}>
                        est. 1RM · <span style={{ fontWeight: 700 }}>{Math.round(wtVal(patronE1RM))} {wtLabel()}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setPatronPickerOpen(true)} style={{
                    background: `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 7,
                    padding: "7px 12px", cursor: "pointer",
                    fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 1,
                    flexShrink: 0,
                  }}>CHANGE</button>
                </div>
              ) : (
                <button disabled={!hasAnyPr} onClick={() => hasAnyPr && setPatronPickerOpen(true)} style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: hasAnyPr ? `${GOLD}08` : BG3, border: `1px solid ${hasAnyPr ? GOLD + "33" : MUTED + "22"}`,
                  borderRadius: 8, padding: "12px 14px", cursor: hasAnyPr ? "pointer" : "default",
                  fontFamily: "'Rajdhani',sans-serif",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16, opacity: hasAnyPr ? 0.7 : 0.3 }}>🏆</span>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: hasAnyPr ? GOLD : MUTED, letterSpacing: 2, fontWeight: 700 }}>
                      {hasAnyPr ? "PIN SIGNATURE LIFT" : "EARN A PR TO PIN"}
                    </span>
                  </span>
                  {hasAnyPr && <span style={{ fontSize: 10, color: GOLD, opacity: 0.6 }}>SELECT →</span>}
                </button>
              )}
            </div>
          );
        })()}

        {/* Patron lift picker modal */}
        {patronPickerOpen && (() => {
          const prs = st.prs || {};
          const sorted = Object.entries(prs).sort((a, b) => b[1] - a[1]);
          return (
            createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150, background: "rgba(3,6,15,0.92)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
              onClick={() => setPatronPickerOpen(false)}>
              <div onClick={e => e.stopPropagation()} className="slide-up" style={{
                background: `linear-gradient(160deg, ${BG2}fc, ${BG}fa)`,
                border: `1px solid ${GOLD}33`, borderTop: `2px solid ${GOLD}`,
                width: "100%", maxWidth: 480, padding: "20px 18px 40px",
                maxHeight: "70dvh", overflowY: "auto",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: GOLD, letterSpacing: 3 }}>SELECT SIGNATURE LIFT</div>
                  <button onClick={() => setPatronPickerOpen(false)} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
                </div>
                {st.patronLift && (
                  <button onClick={() => { (onSetPatronLift || (n => onUpdateProfile(store.activeId, { patronLift: n })))(null); setPatronPickerOpen(false); }} style={{
                    width: "100%", padding: "10px 14px", marginBottom: 10, cursor: "pointer",
                    background: `${RED}11`, border: `1px solid ${RED}33`, borderRadius: 8,
                    fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: RED, fontWeight: 700, textAlign: "left",
                  }}>✕  REMOVE PIN</button>
                )}
                {sorted.map(([ex, e1rm]) => {
                  const isPinned = ex === st.patronLift;
                  return (
                    <button key={ex} onClick={() => { (onSetPatronLift || (n => onUpdateProfile(store.activeId, { patronLift: n })))(ex); setPatronPickerOpen(false); }} style={{
                      width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                      background: isPinned ? `${GOLD}18` : "none",
                      border: "none", borderBottom: `1px solid ${ACCENT}11`,
                      padding: "11px 4px", cursor: "pointer",
                    }}>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: isPinned ? GOLD : TEXT, fontWeight: isPinned ? 700 : 400 }}>
                        {isPinned && "★ "}{ex}
                      </span>
                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: GOLD, fontWeight: 700 }}>
                        {Math.round(wtVal(e1rm))} {wtLabel()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>, document.body)
          );
        })()}

        {/* Progression entry points */}
        <Reveal dir="left">
        <button onClick={() => setPrHistoryOpen(true)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `${GOLD}10`, border: `1px solid ${GOLD}55`, borderRadius: 8,
          padding: "12px 14px", marginBottom: 8, cursor: "pointer",
          fontFamily: "'Rajdhani',sans-serif",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 1l2.5 5.5 6 .8-4.4 4.2 1 6L10 14.7 4.9 17.5l1-6L1.5 7.3l6-.8z" stroke={GOLD} strokeWidth="1.4"/>
            </svg>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: GOLD, letterSpacing: 2, fontWeight: 700 }}>PR HISTORY</span>
          </span>
          <span style={{ fontSize: 10, color: GOLD, opacity: 0.6 }}>
            {Object.keys(st.prs || {}).length} TRACKED →
          </span>
        </button>
        </Reveal>

        <Reveal dir="left" delay={20}>
        <button onClick={() => setConditionOpen(true)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `${RED}10`, border: `1px solid ${RED}55`, borderRadius: 8,
          padding: "12px 14px", marginBottom: 8, cursor: "pointer",
          fontFamily: "'Rajdhani',sans-serif",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15 }}>📉</span>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: RED, letterSpacing: 2, fontWeight: 700 }}>CONDITION REPORT</span>
          </span>
          <span style={{ fontSize: 10, color: RED, opacity: 0.7 }}>
            {(() => {
              const c = st.condition || {};
              const n = Object.values(c).filter(v => v < 0.995).length;
              return n ? `${n} decaying →` : "all fresh →";
            })()}
          </span>
        </button>
        </Reveal>

        <Reveal dir="left" delay={40}>
        <button onClick={() => setRelicVaultOpen(true)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#a855f710", border: "1px solid #a855f755", borderRadius: 8,
          padding: "12px 14px", marginBottom: 8, cursor: "pointer",
          fontFamily: "'Rajdhani',sans-serif",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15 }}>💎</span>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: "#a855f7", letterSpacing: 2, fontWeight: 700 }}>RELIC VAULT</span>
          </span>
          <span style={{ fontSize: 10, color: "#a855f7", opacity: 0.6 }}>
            {(st.cosmetics?.relics || []).length}/{RELIC_POOL.length} →
          </span>
        </button>
        </Reveal>

        <Reveal dir="right" delay={80}>
        <button onClick={() => setHeatmapOpen(true)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `${ACCENT}10`, border: `1px solid ${ACCENT}55`, borderRadius: 8,
          padding: "12px 14px", marginBottom: 16, cursor: "pointer",
          fontFamily: "'Rajdhani',sans-serif",
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2"  width="4" height="4" fill={ACCENT} opacity="0.3"/>
              <rect x="8" y="2"  width="4" height="4" fill={ACCENT} opacity="0.7"/>
              <rect x="14" y="2" width="4" height="4" fill={ACCENT}/>
              <rect x="2" y="8"  width="4" height="4" fill={ACCENT} opacity="0.6"/>
              <rect x="8" y="8"  width="4" height="4" fill={ACCENT} opacity="0.4"/>
              <rect x="14" y="8" width="4" height="4" fill={ACCENT} opacity="0.85"/>
              <rect x="2" y="14" width="4" height="4" fill={ACCENT} opacity="0.5"/>
              <rect x="8" y="14" width="4" height="4" fill={ACCENT}/>
              <rect x="14" y="14" width="4" height="4" fill={ACCENT} opacity="0.25"/>
            </svg>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 2, fontWeight: 700 }}>TRAINING HEATMAP</span>
          </span>
          <span style={{ fontSize: 10, color: ACCENT, opacity: 0.6 }}>
            13 WEEKS →
          </span>
        </button>
        </Reveal>

        {/* ── STATS ── */}
        <Reveal dir="scale">
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4, marginBottom: 10 }}>[ SPECIAL ATTRIBUTES ]</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {specialStats.map(m => <StatBadge key={m} muscle={m} level={st.levels[m]||1} xp={st.stats[m]||0}/>)}
          </div>
        </Reveal>

        {/* ── MIND & SPIRIT ── */}
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: "#8b8cf6", letterSpacing: 4, marginBottom: 10 }}>[ MIND & SPIRIT ]</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {["intelligence", "faith"].map(s => {
            const xp = mindStatXP(st, s);
            return <StatBadge key={s} muscle={s} level={getMuscleLevel(xp)} xp={xp} />;
          })}
        </div>

        <Reveal><VolumeChart workouts={st.workouts || []} /></Reveal>

        <Reveal><ShadowRace workouts={st.workouts || []} /></Reveal>

        <Reveal><RecoveryGrid workouts={st.workouts || []} /></Reveal>

        {(() => {
          const imbalances = detectImbalances(st.stats || {}, st.subStats || {});
          if (imbalances.length === 0) return null;
          return (
            <div style={{ background: `${GOLD}08`, border: `1px solid ${GOLD}33`, borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, letterSpacing: 4, marginBottom: 10 }}>
                [ FOCUS RECOMMENDATIONS ]
              </div>
              {imbalances.map((imb, i) => {
                const suggestions = suggestExercisesFor(imb.target, 3);
                return (
                  <div key={i} style={{ marginBottom: i === imbalances.length - 1 ? 0 : 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 1 }}>
                        {imb.pair[0]} ▸ {imb.pair[1]}
                      </span>
                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED }}>
                        {imb.ratio === Infinity ? "∞" : `${imb.ratio.toFixed(1)}×`}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT, lineHeight: 1.4, marginBottom: suggestions.length ? 6 : 0 }}>
                      {imb.message}
                    </div>
                    {suggestions.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {suggestions.map(ex => (
                          <span key={ex.name} style={{
                            fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED,
                            background: BG3, border: `1px solid ${GOLD}22`, borderRadius: 4,
                            padding: "3px 8px",
                          }}>{ex.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        <Reveal>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4, marginBottom: 10 }}>[ MUSCLE LEVELS ]</div>
          <StatTree
            condition={st.condition || {}}
            lastTrained={st.lastTrained || {}}
            tree={STAT_TREE}
            getGroupXP={getGroupXP}
            getSuperXP={getSuperXP}
            subStats={subStats}
            subLevels={subLevels}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={(id) => setSelectedMuscle(prev => prev === id ? null : id)}
          />
        </Reveal>
      </div>

      {conditionOpen && <ConditionReportModal profile={st} onClose={() => setConditionOpen(false)} />}
      {relicVaultOpen && (
        createPortal(<div onClick={() => setRelicVaultOpen(false)} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150,
          background: "rgba(3,6,15,0.92)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{
            background: `linear-gradient(160deg, ${BG2}fc, ${BG}fa)`,
            border: "1px solid #a855f733", borderTop: "2px solid #a855f7",
            width: "100%", maxWidth: 480, padding: "20px 18px 40px",
            maxHeight: "70dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: "#a855f7", letterSpacing: 3 }}>RELIC VAULT</div>
              <button onClick={() => setRelicVaultOpen(false)} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginBottom: 14 }}>
              Card frames dropped by setting new PRs. Tap to equip.
            </div>
            {RELIC_POOL.map(r => {
              const owned = (st.cosmetics?.relics || []).some(x => x.id === r.id);
              const equipped = st.cosmetics?.equippedRelic === r.id;
              const rar = RELIC_RARITIES[r.rarity];
              const c = RELIC_FRAME_COLORS[r.id];
              return (
                <button key={r.id} disabled={!owned}
                  onClick={() => onUpdateProfile(store.activeId, { cosmetics: { ...(st.cosmetics || {}), equippedRelic: equipped ? null : r.id } })}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: equipped ? `${c}18` : (owned ? BG3 : "transparent"),
                    border: `1px solid ${equipped ? c : (owned ? c + "44" : MUTED + "22")}`,
                    borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                    cursor: owned ? "pointer" : "default", opacity: owned ? 1 : 0.45, textAlign: "left" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{r.rarity === "legendary" ? "👑" : r.rarity === "epic" ? "🔮" : r.rarity === "rare" ? "💠" : "🛡️"}</span>
                    <span>
                      <span style={{ display: "block", fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: owned ? c : MUTED, letterSpacing: 1 }}>{r.name}</span>
                      <span style={{ display: "block", fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: rar.color, letterSpacing: 1 }}>{rar.name.toUpperCase()}</span>
                    </span>
                  </span>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 1,
                    color: equipped ? c : MUTED }}>{equipped ? "EQUIPPED" : (owned ? "TAP TO EQUIP" : "🔒 SET A PR")}</span>
                </button>
              );
            })}
          </div>
        </div>, document.body)
      )}
      {prHistoryOpen && (
        <PRHistoryModal
          workouts={st.workouts}
          prs={st.prs}
          onClose={() => setPrHistoryOpen(false)}
        />
      )}
      {heatmapOpen && (
        <HeatmapModal
          workouts={st.workouts}
          onClose={() => setHeatmapOpen(false)}
        />
      )}
    </div>

  );
}


// ─── REALM HELPERS ────────────────────────────────────────────────────────────

function _rankColor(lbl) {
  if (lbl === "S") return "#FFD700";
  if (lbl === "A") return "#9B59B6";
  if (lbl === "B") return "#4a9eff";
  if (lbl === "C") return "#4ecb71";
  if (lbl === "D") return "#f59e0b";
  return "#e05555";
}

const AUDIT_ACTION_LABELS = {
  toggle_share_prs:    "Toggled PR sharing",
  suspend:             "Suspended",
  unsuspend:           "Unsuspended",
  grant_admin:         "Granted admin",
  revoke_admin:        "Revoked admin",
  wipe_stats:          "Wiped stats",
  send_password_reset: "Sent password reset",
  hide_friend:         "Hid from friends",
  reveal_friend:       "Revealed to friends",
};

function _auditLabel(a) {
  return AUDIT_ACTION_LABELS[a] || a.replace(/_/g, " ");
}

function _timeAgo(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function _activityColor(iso) {
  if (!iso) return MUTED;
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 24)  return GREEN;
  if (h < 168) return GOLD;   // < 7d
  return MUTED;
}

// ─── IMBALANCE DETECTOR ───────────────────────────────────────────────────────
// Walks pairs of antagonist muscle groups and returns flags where one side
// significantly outweighs the other. Each check has a minimum-XP gate so
// new accounts with mostly-zero stats don't get spammed with false alarms.

function detectImbalances(stats, subStats) {
  const get    = (k) => stats?.[k] || 0;
  const getSub = (k) => subStats?.[k] || 0;
  const sumSub = (...keys) => keys.reduce((s, k) => s + getSub(k), 0);

  const checks = [
    {
      label: ["Chest", "Back"],
      a: get("chest"), b: get("back"),
      minXp: 200, threshold: 1.5,
      tipForward: "Posterior chain is lagging. Add rows or pull-ups.",
      tipReverse: "Pressing volume is behind. Add bench or push-ups.",
      targetForward: "back", targetReverse: "chest",
    },
    {
      label: ["Triceps", "Biceps"],
      a: get("tricep"), b: get("bicep"),
      minXp: 100, threshold: 1.3,
      tipForward: "Biceps are pulling ahead — triceps make up 2/3 of your arm. Add dips, pushdowns, or skull crushers.",
      tipReverse: "Biceps lagging behind triceps. Add curls.",
      targetForward: "tricep", targetReverse: "bicep",
    },
    {
      label: ["Front Delts", "Rear Delts"],
      a: getSub("anterior-deltoid"), b: getSub("posterior-deltoid"),
      minXp: 100, threshold: 2.0,
      tipForward: "Rear delts neglected — common in pressing-heavy programs. Add face pulls or reverse flyes.",
      targetForward: "shoulders",
    },
    {
      label: ["Quads", "Hamstrings"],
      a: sumSub("outer-quadricep", "rectus-femoris", "inner-quadricep"),
      b: sumSub("lateral-hamstrings", "medial-hamstrings"),
      minXp: 200, threshold: 2.0,
      tipForward: "Hamstrings underdeveloped. Add Romanian deadlifts or hamstring curls.",
      targetForward: "legs",
    },
  ];

  const out = [];
  for (const c of checks) {
    if (Math.max(c.a, c.b) < c.minXp) continue;
    const aDom = c.b > 0 ? c.a / c.b : Infinity;  // a outweighs b
    const bDom = c.a > 0 ? c.b / c.a : Infinity;  // b outweighs a
    if (aDom >= c.threshold) {
      // a is dominant → suggest exercises that target b
      out.push({ pair: [c.label[0], c.label[1]], ratio: aDom, message: c.tipForward, target: c.targetForward });
    } else if (c.tipReverse && bDom >= c.threshold) {
      out.push({ pair: [c.label[1], c.label[0]], ratio: bDom, message: c.tipReverse, target: c.targetReverse });
    }
  }
  return out;
}

function suggestExercisesFor(target, n = 3) {
  const list = EXERCISE_DB?.[target];
  if (!Array.isArray(list) || list.length === 0) return [];
  const strengthFirst = [...list].sort((a, b) => (a.type === "strength" ? -1 : 1) - (b.type === "strength" ? -1 : 1));
  return strengthFirst.slice(0, n);
}

function ProfileViewerModal({ profile, isAdmin, viewHidden, onClose, onToggleHidden, onRefresh, toast }) {
  const [busy, setBusy] = useState(false);
  const [auditOpen,    setAuditOpen]    = useState(false);
  const [auditEntries, setAuditEntries] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  if (!profile) return null;
  const rc = _rankColor(profile.rank_label);

  const confirmPrompt = (msg) => typeof window !== "undefined" && window.confirm(msg);

  const loadAuditLog = useCallback(async () => {
    if (!isAdmin || !profile?.user_id) return;
    setAuditLoading(true);
    try {
      const rows = await adminService.fetchAuditLog(profile.user_id, 25);
      setAuditEntries(rows);
    } catch (e) {
      toast?.(`Audit log unavailable: ${e.message || e}`, RED);
    } finally {
      setAuditLoading(false);
    }
  }, [isAdmin, profile?.user_id, toast]);

  const toggleAuditOpen = () => {
    const next = !auditOpen;
    setAuditOpen(next);
    if (next) loadAuditLog();
  };

  const wrap = async (label, fn, successMsg, color = ACCENT, audit = null) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      if (audit) {
        await adminService.logAdminAction(profile.user_id, audit.action, audit.metadata || {});
        if (auditOpen) loadAuditLog();
      }
      toast?.(successMsg, color);
      onRefresh?.();
    } catch (e) { toast?.(`${label} failed: ${e.message || e}`, RED); }
    finally { setBusy(false); }
  };

  const togglePrs = () => wrap(
    "Toggle PRs",
    () => adminService.setSharePrs(profile.user_id, !profile.share_prs),
    `Share PRs ${!profile.share_prs ? "enabled" : "disabled"} for @${profile.username}`,
    ACCENT,
    { action: "toggle_share_prs", metadata: { value: !profile.share_prs } },
  );

  const toggleSuspend = () => {
    const nextVal = !profile.suspended;
    if (nextVal && !confirmPrompt(`Suspend @${profile.username}? They'll be hidden from leaderboards until you reverse this.`)) return;
    wrap(
      "Suspend",
      () => adminService.setSuspended(profile.user_id, nextVal),
      `@${profile.username} ${nextVal ? "suspended" : "unsuspended"}`,
      nextVal ? RED : GREEN,
      { action: nextVal ? "suspend" : "unsuspend" },
    );
  };

  const toggleAdmin = () => {
    const nextVal = !profile.is_admin;
    if (!confirmPrompt(`${nextVal ? "GRANT" : "REVOKE"} admin to @${profile.username}? Admin can moderate other accounts.`)) return;
    wrap(
      "Admin toggle",
      () => adminService.setIsAdmin(profile.user_id, nextVal),
      `@${profile.username} ${nextVal ? "promoted to admin" : "admin revoked"}`,
      nextVal ? GOLD : MUTED,
      { action: nextVal ? "grant_admin" : "revoke_admin" },
    );
  };

  const resetStats = () => {
    if (!confirmPrompt(`Reset all XP, level, and PRs for @${profile.username}? Their workout history stays on their device.`)) return;
    wrap(
      "Reset stats",
      () => adminService.resetUserStats(profile.user_id),
      `Stats reset for @${profile.username}`,
      RED,
      { action: "wipe_stats" },
    );
  };

  const sendPasswordReset = () => {
    if (!confirmPrompt(`Send password-reset email to @${profile.username}? They'll get a recovery link in their inbox.`)) return;
    wrap(
      "Password reset",
      () => adminService.sendPasswordResetForUser(profile.user_id),
      `Reset email sent to @${profile.username}`,
      GREEN,
      { action: "send_password_reset" },
    );
  };

  return (
    createPortal(<div style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150, background: "rgba(3,6,15,0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${BG}fa)`,
        border: `1px solid ${(profile.banner_color || ACCENT)}33`, borderTop: `2px solid ${profile.banner_color || ACCENT}`,
        width: "100%", maxWidth: 480, padding: "24px 20px 40px",
        maxHeight: "90vh", overflowY: "auto", position: "relative",
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${(profile.banner_color || ACCENT)}cc, transparent)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 8,
              background: `${rc}22`, border: `2px solid ${rc}88`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 900, color: rc,
            }}>{profile.rank_label || "E"}</div>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: ACCENT }}>@{profile.username}</div>
              {profile.equipped_title && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: GOLD, fontStyle: "italic", marginTop: 2 }}>
                  {profile.equipped_title}
                </div>
              )}
              {profile.equipped_aspect && (
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 2,
                  color: ASPECTS.find(a => a.name === profile.equipped_aspect)?.color || MUTED, marginTop: 2 }}>
                  ⟡ PATH OF THE {profile.equipped_aspect.toUpperCase()}
                </div>
              )}
              {profile.display_name && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, marginTop: 2 }}>{profile.display_name}</div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 2 }}>LVL {profile.overall_level}</span>
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>{(profile.overall_xp || 0).toLocaleString()} XP</span>
          </div>
          <div style={{ height: 4, background: `${ACCENT}22`, borderRadius: 2 }}>
            <div style={{ height: "100%", background: ACCENT, borderRadius: 2, width: `${Math.min(100, ((profile.overall_xp || 0) % 1000) / 10)}%` }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
          {[
            ["SESSIONS", profile.total_workouts],
            ["WEEKLY",   (profile.weekly_xp || 0).toLocaleString()],
            ["TOTAL XP", (profile.overall_xp || 0).toLocaleString()],
            ["FRIENDS",  (profile.friend_count ?? "—")],
          ].map(([label, val]) => (
            <div key={label} style={{ background: BG3, border: `1px solid ${ACCENT}22`, borderRadius: 8, padding: "10px 6px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700, color: GOLD }}>{val}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: _activityColor(profile.updated_at),
            boxShadow: `0 0 4px ${_activityColor(profile.updated_at)}`,
          }} />
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
            Last active {_timeAgo(profile.updated_at)}
          </span>
        </div>

        {profile.patron_lift && (
          <div style={{ background: `${GOLD}0e`, border: `1px solid ${GOLD}44`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 3 }}>SIGNATURE LIFT</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT }}>{profile.patron_lift}</span>
              {profile.prs?.[profile.patron_lift] && (
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: GOLD }}>
                  {Math.round(profile.prs[profile.patron_lift])} lbs est. 1RM
                </span>
              )}
            </div>
          </div>
        )}

        {profile.prs && Object.keys(profile.prs).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GOLD, letterSpacing: 3, marginBottom: 10 }}>{"// PERSONAL RECORDS"}</div>
            {Object.entries(profile.prs)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([ex, e1rm]) => (
                <div key={ex} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${ACCENT}11` }}>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT }}>{ex}</span>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, fontWeight: 700, color: GOLD }}>{Math.round(e1rm)} lbs</span>
                </div>
              ))}
          </div>
        )}

        {isAdmin && (
          <div style={{ background: `${RED}08`, border: `1px solid ${RED}33`, borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: RED, letterSpacing: 3, marginBottom: 10 }}>{"// ADMIN CONTROLS"}</div>

            {/* Toggleable rows */}
            {[
              ["Share PRs",  profile.share_prs, togglePrs,    profile.share_prs ? "ON"    : "OFF",    profile.share_prs ? GREEN : MUTED],
              ["Suspended",  profile.suspended, toggleSuspend, profile.suspended ? "YES"  : "NO",     profile.suspended ? RED   : MUTED],
              ["Admin",      profile.is_admin,  toggleAdmin,   profile.is_admin  ? "YES"  : "NO",     profile.is_admin  ? GOLD  : MUTED],
            ].map(([label, _val, onTap, valLabel, valColor]) => (
              <button key={label} disabled={busy} onClick={onTap} style={{
                width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "none", border: "none", padding: "8px 0", cursor: busy ? "default" : "pointer",
                borderBottom: `1px solid ${ACCENT}11`,
              }}>
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>{label}</span>
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: valColor, letterSpacing: 1 }}>
                  {valLabel} <span style={{ opacity: 0.5, fontSize: 8 }}>↻</span>
                </span>
              </button>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", marginBottom: 10 }}>
              <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED }}>Joined</span>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED }}>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span>
            </div>

            {/* Action buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              <button disabled={busy} onClick={sendPasswordReset} style={{
                padding: "9px", cursor: busy ? "default" : "pointer",
                background: `${GREEN}11`, border: `1px solid ${GREEN}55`, color: GREEN,
                fontFamily: "'Orbitron',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: 1,
              }}>RESET PW</button>
              <button disabled={busy} onClick={resetStats} style={{
                padding: "9px", cursor: busy ? "default" : "pointer",
                background: `${RED}11`, border: `1px solid ${RED}55`, color: RED,
                fontFamily: "'Orbitron',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: 1,
              }}>WIPE STATS</button>
            </div>

            <button disabled={busy} onClick={onToggleHidden} style={{
              width: "100%", padding: "10px", cursor: busy ? "default" : "pointer",
              background: viewHidden ? `${GREEN}22` : `${ACCENT}22`,
              border: `1px solid ${viewHidden ? GREEN : ACCENT}66`,
              fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: 1,
              color: viewHidden ? GREEN : ACCENT,
            }}>
              {viewHidden ? `REVEAL TO @${profile.username}` : `HIDE FROM @${profile.username}`}
            </button>

            {/* Audit log — collapsible */}
            <button onClick={toggleAuditOpen} style={{
              width: "100%", marginTop: 10, padding: "8px 10px", cursor: "pointer",
              background: "none", border: `1px solid ${MUTED}33`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 2,
            }}>
              <span>{auditOpen ? "▾ AUDIT LOG" : "▸ AUDIT LOG"}</span>
              <span style={{ opacity: 0.6 }}>{auditEntries.length > 0 ? `${auditEntries.length}` : ""}</span>
            </button>

            {auditOpen && (
              <div style={{ marginTop: 8, background: BG, border: `1px solid ${MUTED}22`, borderRadius: 6, padding: "8px 10px", maxHeight: 220, overflowY: "auto" }}>
                {auditLoading ? (
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, textAlign: "center", padding: "10px 0" }}>
                    Loading…
                  </div>
                ) : auditEntries.length === 0 ? (
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, textAlign: "center", padding: "10px 0" }}>
                    No actions recorded.
                  </div>
                ) : auditEntries.map(entry => (
                  <div key={entry.id} style={{ padding: "6px 0", borderBottom: `1px solid ${MUTED}11` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: TEXT, fontWeight: 600 }}>
                        {_auditLabel(entry.action)}
                      </span>
                      <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, whiteSpace: "nowrap" }}>
                        {_timeAgo(entry.created_at)}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, marginTop: 2 }}>
                      by @{entry.admin_username || "unknown"}
                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <span style={{ opacity: 0.7 }}> · {JSON.stringify(entry.metadata)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>, document.body)
  );
}

function _signInPrompt(title, body) {
  return (
    <div style={{ minHeight: "100dvh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 120px" }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 22, fontWeight: 900, color: ACCENT, letterSpacing: 4, marginBottom: 12 }}>{title}</div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 1.6 }}>{body}</div>
      <div style={{ marginTop: 20, fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 2 }}>
        SIGN IN VIA HOME → GEAR ICON → ACCOUNT
      </div>
    </div>
  );
}


// ─── SCREEN: LEADERBOARD ──────────────────────────────────────────────────────

function LeaderboardScreen({ account, toast }) {
  const isAdmin   = Boolean(account?.remoteProfile?.is_admin);
  const myUserId  = account?.session?.user?.id;

  const [sortBy, setSortBy]             = useState("weekly_xp");
  const [board, setBoard]               = useState([]);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [viewProfile, setViewProfile]   = useState(null);
  const [viewHidden, setViewHidden]     = useState(null);

  useEffect(() => {
    if (!myUserId) return;
    setLoadingBoard(true);
    friendsService.fetchLeaderboard(sortBy)
      .then(setBoard)
      .catch(e => toast(e.message, RED))
      .finally(() => setLoadingBoard(false));
  }, [myUserId, sortBy]);

  const openProfile = async (userId) => {
    const p = await friendsService.getFriendProfile(userId).catch(() => null);
    setViewProfile(p);
    if (isAdmin && p) {
      const hidden = await friendsService.getHiddenStatus(userId, myUserId).catch(() => true);
      setViewHidden(hidden);
    }
  };

  const handleToggleHidden = async () => {
    if (!viewProfile || !isAdmin) return;
    const newHidden = !viewHidden;
    try {
      await friendsService.setFriendHidden(viewProfile.user_id, myUserId, newHidden);
      adminService.logAdminAction(viewProfile.user_id, newHidden ? "hide_friend" : "reveal_friend");
      setViewHidden(newHidden);
      toast(newHidden ? "Hidden from their friends list" : `Revealed to @${viewProfile.username}`, ACCENT);
    } catch (e) { toast(e.message, RED); }
  };

  if (!account?.session) {
    return _signInPrompt("LEADERBOARD", <>Sign in to see how you rank<br/>against other Hunters.</>);
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, paddingBottom: "calc(120px + env(safe-area-inset-bottom,0px))" }}>

      <div style={{ background: `${BG2}ee`, borderBottom: `1px solid ${ACCENT2}44`, padding: "14px 18px" }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4 }}>
          {isAdmin ? "[ LEADERBOARD — ADMIN VIEW ]" : "[ LEADERBOARD ]"}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[["weekly_xp", "WEEKLY"], ["overall_xp", "TOTAL XP"], ["overall_level", "LEVEL"]].map(([key, lbl]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{
              flex: 1, padding: "7px 4px", border: "none", cursor: "pointer",
              fontFamily: "'Orbitron',sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: 1,
              background: sortBy === key ? `${ACCENT}22` : BG3,
              color: sortBy === key ? ACCENT : MUTED,
              borderBottom: `2px solid ${sortBy === key ? ACCENT : "transparent"}`,
            }}>{lbl}</button>
          ))}
        </div>

        {loadingBoard && (
          <div style={{ textAlign: "center", padding: 40, fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: MUTED }}>LOADING...</div>
        )}

        {!loadingBoard && board.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED }}>
            {isAdmin ? "No users have signed up yet." : "Add friends to see them on the leaderboard."}
          </div>
        )}

        {board.map((row, i) => {
          const rc = _rankColor(row.rank_label);
          const isMe = row.friend_id === myUserId;
          const banner = row.banner_color || ACCENT;
          return (
            <div key={row.friend_id} onClick={() => openProfile(row.friend_id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: isMe ? `${banner}11` : BG2,
                border: `1px solid ${isMe ? banner + "55" : banner + "1a"}`,
                borderLeft: `3px solid ${banner}`,
                borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
              }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: i < 3 ? GOLD : MUTED, fontWeight: 700, minWidth: 22, textAlign: "center" }}>
                {i === 0 ? "◆" : i === 1 ? "◇" : i === 2 ? "△" : `#${i + 1}`}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                background: `${rc}22`, border: `1.5px solid ${rc}88`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 900, color: rc,
              }}>{row.rank_label || "E"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div title={`Active ${_timeAgo(row.updated_at)}`} style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                    background: _activityColor(row.updated_at),
                    boxShadow: `0 0 4px ${_activityColor(row.updated_at)}`,
                  }} />
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <AuraName name={`@${row.username}${isMe ? " ◈" : ""}`}
                      level={row.overall_level} color={isMe ? ACCENT : (row.banner_color || TEXT)} />
                  </div>
                </div>
                {row.equipped_title && (
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, fontStyle: "italic", marginTop: 1 }}>
                    {row.equipped_title}
                  </div>
                )}
                {row.equipped_aspect && (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: 2,
                    color: ASPECTS.find(a => a.name === row.equipped_aspect)?.color || MUTED, marginTop: 1 }}>
                    ⟡ PATH OF THE {row.equipped_aspect.toUpperCase()}
                  </div>
                )}
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
                  LVL {row.overall_level} · {row.total_workouts} sessions · {_timeAgo(row.updated_at)}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, color: GOLD }}>
                  {sortBy === "overall_level"
                    ? `LVL ${row.overall_level}`
                    : sortBy === "overall_xp"
                      ? `${(row.overall_xp || 0).toLocaleString()}`
                      : `${(row.weekly_xp || 0).toLocaleString()}`}
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED }}>
                  {sortBy === "weekly_xp" ? "WEEKLY XP" : sortBy === "overall_xp" ? "TOTAL XP" : "XP"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ProfileViewerModal
        profile={viewProfile}
        isAdmin={isAdmin}
        viewHidden={viewHidden}
        onClose={() => setViewProfile(null)}
        onToggleHidden={handleToggleHidden}
        toast={toast}
        onRefresh={async () => {
          if (viewProfile) await openProfile(viewProfile.user_id);
          friendsService.fetchLeaderboard(sortBy).then(setBoard).catch(() => {});
        }}
      />
    </div>
  );
}


// ─── SCREEN: FRIENDS ──────────────────────────────────────────────────────────

function FriendsScreen({ account, toast }) {
  const isAdmin   = Boolean(account?.remoteProfile?.is_admin);
  const myUserId  = account?.session?.user?.id;

  const [searchQ, setSearchQ]               = useState("");
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [incoming, setIncoming]             = useState([]);
  const [outgoing, setOutgoing]             = useState([]);
  const [profileMap, setProfileMap]         = useState({});
  const [friendIds, setFriendIds]           = useState(new Set());
  const [opBusy, setOpBusy]                 = useState({});
  const [viewProfile, setViewProfile]       = useState(null);
  const [viewHidden, setViewHidden]         = useState(null);

  const setBusy = (id, val) => setOpBusy(p => ({ ...p, [id]: val }));

  const loadRequests = async () => {
    if (!myUserId) return;
    try {
      const r = await friendsService.fetchRequests(myUserId);
      setIncoming(r.incoming); setOutgoing(r.outgoing); setProfileMap(r.profileMap);
    } catch {}
  };

  const loadFriendIds = async () => {
    if (!myUserId) return;
    try {
      const rows = await friendsService.fetchLeaderboard("weekly_xp");
      setFriendIds(new Set(rows.map(r => r.friend_id)));
    } catch {}
  };

  useEffect(() => {
    if (myUserId) { loadRequests(); loadFriendIds(); }
  }, [myUserId]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults((await friendsService.searchUsers(searchQ)).filter(u => u.user_id !== myUserId)); }
      catch {}
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ, myUserId]);

  const openProfile = async (userId) => {
    const p = await friendsService.getFriendProfile(userId).catch(() => null);
    setViewProfile(p);
    if (isAdmin && p) {
      const hidden = await friendsService.getHiddenStatus(userId, myUserId).catch(() => true);
      setViewHidden(hidden);
    }
  };

  const handleToggleHidden = async () => {
    if (!viewProfile || !isAdmin) return;
    const newHidden = !viewHidden;
    try {
      await friendsService.setFriendHidden(viewProfile.user_id, myUserId, newHidden);
      adminService.logAdminAction(viewProfile.user_id, newHidden ? "hide_friend" : "reveal_friend");
      setViewHidden(newHidden);
      toast(newHidden ? "Hidden from their friends list" : `Revealed to @${viewProfile.username}`, ACCENT);
    } catch (e) { toast(e.message, RED); }
  };

  const handleSendRequest = async (toUserId) => {
    setBusy(toUserId, true);
    try {
      await friendsService.sendFriendRequest(toUserId);
      toast("Friend request sent", GREEN);
      setOutgoing(prev => [...prev, { id: Date.now(), from_user: myUserId, to_user: toUserId }]);
    } catch (e) { toast(e.message, RED); }
    finally { setBusy(toUserId, false); }
  };

  const handleAccept = async (reqId) => {
    setBusy(reqId, true);
    try {
      await friendsService.acceptRequest(reqId);
      toast("Friend request accepted", GREEN);
      setIncoming(prev => prev.filter(r => r.id !== reqId));
      loadFriendIds();
    } catch (e) { toast(e.message, RED); }
    finally { setBusy(reqId, false); }
  };

  const handleReject = async (reqId) => {
    setBusy(reqId, true);
    try {
      await friendsService.rejectRequest(reqId);
      setIncoming(prev => prev.filter(r => r.id !== reqId));
    } catch (e) { toast(e.message, RED); }
    finally { setBusy(reqId, false); }
  };

  const handleCancel = async (reqId) => {
    setBusy(reqId, true);
    try {
      await friendsService.cancelRequest(reqId);
      setOutgoing(prev => prev.filter(r => r.id !== reqId));
    } catch (e) { toast(e.message, RED); }
    finally { setBusy(reqId, false); }
  };

  const outgoingIds = new Set(outgoing.map(r => r.to_user));

  if (!account?.session) {
    return _signInPrompt("FRIENDS", <>Sign in to send friend requests<br/>and connect with other Hunters.</>);
  }

  return (
    <div style={{ minHeight: "100dvh", background: BG, paddingBottom: "calc(120px + env(safe-area-inset-bottom,0px))" }}>

      <div style={{ background: `${BG2}ee`, borderBottom: `1px solid ${ACCENT2}44`, padding: "14px 18px" }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4 }}>
          {isAdmin ? "[ FRIENDS — ADMIN VIEW ]" : "[ FRIENDS ]"}
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 3, marginBottom: 8 }}>{"// FIND HUNTER"}</div>
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="search by username..."
            autoCapitalize="none" autoCorrect="off" spellCheck="false"
            style={{
              width: "100%", background: BG3, border: `1px solid ${ACCENT}44`,
              color: TEXT, fontFamily: "'Rajdhani',sans-serif", fontSize: 14,
              padding: "10px 14px", borderRadius: 8, outline: "none", boxSizing: "border-box",
            }}
          />
          {searching && <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED, marginTop: 8 }}>SCANNING...</div>}
          {searchResults.map(u => {
            const isPending  = outgoingIds.has(u.user_id);
            const isFriend   = friendIds.has(u.user_id);
            const canView    = isFriend || isAdmin;
            const rc = _rankColor(u.rank_label || "E");
            return (
              <div key={u.user_id}
                onClick={canView ? () => openProfile(u.user_id) : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: BG2, border: `1px solid ${ACCENT}22`,
                  borderRadius: 8, padding: "10px 12px", marginTop: 8,
                  cursor: canView ? "pointer" : "default",
                  opacity: canView ? 1 : 0.85,
                }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 5, flexShrink: 0,
                  background: `${rc}22`, border: `1.5px solid ${rc}66`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 900, color: rc,
                }}>{u.rank_label || "E"}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: TEXT }}>@{u.username}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>
                    LVL {u.overall_level}{!canView ? " · profile locked" : ""}
                  </div>
                </div>
                {isFriend ? (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: GREEN, letterSpacing: 1 }}>FRIEND</div>
                ) : isPending ? (
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1 }}>PENDING</div>
                ) : (
                  <button disabled={opBusy[u.user_id]} onClick={(e) => { e.stopPropagation(); handleSendRequest(u.user_id); }} style={{
                    background: `${ACCENT}22`, border: `1px solid ${ACCENT}66`,
                    color: ACCENT, fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                    padding: "6px 10px", cursor: "pointer", letterSpacing: 1,
                  }}>ADD</button>
                )}
              </div>
            );
          })}
        </div>

        {incoming.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: GREEN, letterSpacing: 3, marginBottom: 8 }}>{"// INCOMING REQUESTS"}</div>
            {incoming.map(r => {
              const p = profileMap[r.from_user];
              return (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: `${GREEN}0a`, border: `1px solid ${GREEN}33`,
                  borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: TEXT }}>@{p?.username || "..."}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>LVL {p?.overall_level || "?"} · wants to be friends</div>
                  </div>
                  <button disabled={opBusy[r.id]} onClick={() => handleAccept(r.id)} style={{
                    background: `${GREEN}22`, border: `1px solid ${GREEN}66`,
                    color: GREEN, fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                    padding: "6px 10px", cursor: "pointer", marginRight: 4,
                  }}>ACCEPT</button>
                  <button disabled={opBusy[r.id]} onClick={() => handleReject(r.id)} style={{
                    background: `${RED}11`, border: `1px solid ${RED}44`,
                    color: RED, fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                    padding: "6px 10px", cursor: "pointer",
                  }}>REJECT</button>
                </div>
              );
            })}
          </div>
        )}

        {outgoing.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: MUTED, letterSpacing: 3, marginBottom: 8 }}>{"// SENT REQUESTS"}</div>
            {outgoing.map(r => {
              const p = profileMap[r.to_user];
              return (
                <div key={r.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: BG2, border: `1px solid ${ACCENT}1a`,
                  borderRadius: 8, padding: "10px 12px", marginBottom: 8,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, color: TEXT }}>@{p?.username || "..."}</div>
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>Request pending</div>
                  </div>
                  <button disabled={opBusy[r.id]} onClick={() => handleCancel(r.id)} style={{
                    background: "none", border: `1px solid ${MUTED}44`,
                    color: MUTED, fontFamily: "'Orbitron',sans-serif", fontSize: 8,
                    padding: "6px 10px", cursor: "pointer",
                  }}>CANCEL</button>
                </div>
              );
            })}
          </div>
        )}

        {incoming.length === 0 && outgoing.length === 0 && searchQ.length < 2 && (
          <div style={{ textAlign: "center", padding: "24px 0", fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED }}>
            Search for a username above to add friends.
          </div>
        )}
      </div>

      <ProfileViewerModal
        profile={viewProfile}
        isAdmin={isAdmin}
        viewHidden={viewHidden}
        onClose={() => setViewProfile(null)}
        onToggleHidden={handleToggleHidden}
        toast={toast}
        onRefresh={async () => {
          if (viewProfile) await openProfile(viewProfile.user_id);
          loadFriendIds();
        }}
      />
    </div>
  );
}


export default function IronRealm() {
  // v1.9: full-screen ceremony when overall level rises
  const [ceremonyLevel, setCeremonyLevel] = useState(null);
  // v1.10: relic drop reveal after a PR
  const [relicDrop, setRelicDrop] = useState(null);

  // v1.9: energy ripple + sparkle burst on every button press, at the touch point
  useEffect(() => {
    const onDown = e => {
      const btn = e.target.closest?.("button");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 1.2;
      const cs = getComputedStyle(btn);
      if (cs.position === "static") btn.style.position = "relative";
      if (cs.overflow !== "hidden") btn.style.overflow = "hidden";

      // Ripple
      const fx = document.createElement("span");
      fx.className = "ripple-fx";
      fx.style.width = fx.style.height = `${size}px`;
      fx.style.left = `${e.clientX - r.left - size / 2}px`;
      fx.style.top = `${e.clientY - r.top - size / 2}px`;
      btn.appendChild(fx);
      setTimeout(() => fx.remove(), 600);

      // Sparkles — 6 tiny particles flung outward
      const ox = e.clientX - r.left, oy = e.clientY - r.top;
      const palette = ["#00d4ff", "#e8c44a", "#b455ff", "#ffffff"];
      for (let i = 0; i < 6; i++) {
        const s = document.createElement("span");
        s.className = "spark-fx";
        const a = Math.random() * Math.PI * 2, d = 20 + Math.random() * 28;
        s.style.left = `${ox - 2}px`;
        s.style.top = `${oy - 2}px`;
        s.style.setProperty("--sx", `${Math.cos(a) * d}px`);
        s.style.setProperty("--sy", `${Math.sin(a) * d}px`);
        const c = palette[Math.floor(Math.random() * palette.length)];
        s.style.background = c;
        s.style.boxShadow = `0 0 6px ${c}, 0 0 12px ${c}66`;
        s.style.animationDelay = `${i * 18}ms`;
        btn.appendChild(s);
        setTimeout(() => s.remove(), 600);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const [store, setStore] = useState(() => {
    try {
      const s = localStorage.getItem("iron_realm_store_v1");
      if (!s) return INIT_STORE;
      const loaded = JSON.parse(s);
      // One-time repair: recompute stats from workout log to fix any drift
      // This runs once on load and self-corrects without losing any data
      const repairedProfiles = Object.fromEntries(
        Object.entries(loaded.profiles || {}).map(([id, p]) => {
          // Always recompute — even empty workouts should zero out stats
          // (mind/spirit XP still counts toward overall at half weight)
          if (!p.workouts?.length) {
            p = { ...p, mindLog: (p.mindLog || []).map(e =>
              e.activity === "quran_read" && e.xp > 54 * (e.qty || 1) * 1.5
                ? { ...e, xp: 54 * (e.qty || 1) } : e) };
            const mindXP = mindOverallBonus(p.mindLog);
            return [id, { ...p,
              stats: Object.fromEntries(Object.keys(p.stats || {}).map(k => [k, 0])),
              subStats: {},
              levels: Object.fromEntries(Object.keys(p.levels || {}).map(k => [k, 1])),
              overallXP: mindXP, overallLevel: getLevelFromXP(mindXP).level }];
          }
          const statEvents = {};
          const addEvt = (key, date, xp, share = 1) => { (statEvents[key] = statEvents[key] || []).push({ date, xp, share }); };
          let newOverallXP = 0;
          for (const w of p.workouts) {
            const xp = w.xp || 0;
            const ex = w.exercise || {};
            const muscle = w.muscle || ex.primary || "chest";
            const emg = ex.emg || EXERCISE_EMG[ex.name];
            if (ex.type === "cardio") {
              addEvt("cardio", w.date, xp);
            } else if (emg) {
              const total = Object.values(emg).reduce((s,v) => s+v, 0);
              // several svg heads can map to one stat — sum their shares
              const byStat = {};
              Object.entries(emg).forEach(([svgId, activation]) => {
                const stat = SVG_TO_STAT[svgId] || muscle;
                byStat[stat] = (byStat[stat] || 0) + activation;
              });
              Object.entries(byStat).forEach(([stat, act]) => {
                addEvt(stat, w.date, Math.round(xp * act / total), act / total);
              });
            } else {
              const statKey = ex.type === "calisthenics" &&
                !["chest","arms","core"].includes(muscle) ? "calisthenics" : muscle;
              addEvt(statKey, w.date, xp, 1);
              if (statKey !== muscle) addEvt(muscle, w.date, Math.round(xp * 0.4), 0.4);
            }
            newOverallXP += xp;
          }
          // Atrophy: fold each muscle's chronology through the condition model
          const newStats = Object.fromEntries(Object.keys(p.stats || {}).map(k => [k, 0]));
          const newCondition = {}, newLastTrained = {};
          const newEarned = {};
          Object.entries(statEvents).forEach(([k, evts]) => {
            const s = atrophyState(evts, atrophyParams(k));
            newStats[k] = s.xp;
            newCondition[k] = s.condition;
            newLastTrained[k] = s.last;
            newEarned[k] = s.earned;
          });
          const newLevels = Object.fromEntries(Object.keys(newStats).map(k => [k, getMuscleLevel(newStats[k] || 0)]));
          const subEvents = {};
          const addSub = (svgId, date, xp, share = 1) => { (subEvents[svgId] = subEvents[svgId] || []).push({ date, xp, share }); };
          for (const w of p.workouts) {
            const xp2 = w.xp || 0; const ex2 = w.exercise || {};
            const emg2 = ex2.emg || EXERCISE_EMG[ex2.name];
            if (emg2) {
              const total2 = Object.values(emg2).reduce((s,v)=>s+v,0);
              Object.entries(emg2).forEach(([svgId,act]) => addSub(svgId, w.date, Math.round(xp2*act/total2), act/total2));
            } else {
              (ex2.svgTargets||[]).forEach(svgId => addSub(svgId, w.date, Math.round(xp2/((ex2.svgTargets||[1]).length))));
            }
          }
          const newSubStats2 = {};
          Object.entries(subEvents).forEach(([k, evts]) => {
            newSubStats2[k] = atrophiedXP(evts, ATROPHY.muscular);
          });
          // Migrate v1.10.0 quran entries logged at undiluted hasanat rates
          const mindLogM = (p.mindLog || []).map(e =>
            e.activity === "quran_read" && e.xp > 54 * (e.qty || 1) * 1.5
              ? { ...e, xp: 54 * (e.qty || 1) } : e);
          p = { ...p, mindLog: mindLogM };
          newOverallXP += mindOverallBonus(p.mindLog);
          // Rebuild stored PRs from the workout log (they were never persisted before)
          const tl = getPRTimeline(p.workouts);
          const rebuiltPrs = Object.fromEntries(Object.entries(tl).map(([name, evts]) => [name, evts[evts.length - 1].e1rm]));
          return [id, { ...p, stats: newStats, subStats: newSubStats2, levels: newLevels, prs: rebuiltPrs,
            condition: newCondition, lastTrained: newLastTrained, earnedStats: newEarned,
            overallXP: newOverallXP, overallLevel: getLevelFromXP(newOverallXP).level }];
        })
      );
      return { ...loaded, profiles: repairedProfiles };
    } catch { return INIT_STORE; }
  });
  const [screen, setScreen] = useState("menu");
  const [toasts, setToasts] = useState([]);
  const [session, setSession]             = useState(null);
  const [remoteProfile, setRemoteProfile] = useState(null);
  const [authBusy, setAuthBusy]           = useState(false);
  const [pendingCount, setPendingCount]   = useState(0);
  const [authError, setAuthError]         = useState(null);
  // First-launch routing: "welcome" | "auth-signin" | "auth-signup" | "onboard"
  const [welcomeStage, setWelcomeStage]   = useState("welcome");
  const [awakeningPending, setAwakeningPending] = useState(false);

  const st = store.profiles[store.activeId];
  const settings = store.settings || INIT_STORE.settings;

  // Update module-level color vars — apply shadow monarch or custom + brightness
  const _brightness = settings.brightness || 1.0;
  const _monarch    = settings.monarchTheme ? MONARCHS.find(m => m.id === settings.monarchTheme) : null;
  ACCENT  = applyBrightness(_monarch ? _monarch.accentColor  : (settings.accentColor  || "#00d4ff"), _brightness);
  ACCENT2 = applyBrightness(_monarch ? _monarch.accent2Color : (settings.accent2Color || "#0044aa"), _brightness);

  // Map brightness setting to CSS filter brightness
  // 0.5=dim, 0.75=low, 1.0=normal, 1.15=bright, 1.3=vivid
  const _cssFilter = _brightness === 1.0 ? "none" : `brightness(${_brightness})`;

  const dynCSS = `
    :root {
      --accent: ${ACCENT};
      --accent2: ${ACCENT2};
    }
    #iron-realm-root {
      filter: ${_cssFilter};
    }
  `;

  const handleUpdateSettings = (updates) => {
    setStore(s => ({ ...s, settings: { ...(s.settings || INIT_STORE.settings), ...updates } }));
  };

  useEffect(() => {
    try { localStorage.setItem("iron_realm_store_v1", JSON.stringify(store)); } catch {}
  }, [store]);

  useEffect(() => {
    const BASE = "https://ammarmubarez.github.io/Iron-Realm";
    const check = async () => {
      try {
        const res = await fetch(`${BASE}/version.json?_=${Date.now()}`, { cache: "no-store" });
        const { version } = await res.json();
        if (version && version !== APP_VERSION) {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
          }
          // Navigate with a version query so the HTML itself bypasses the
          // browser HTTP cache (GitHub Pages serves index.html with
          // max-age=600 — a plain reload can restore the stale build).
          window.location.replace(`${BASE}/?v=${encodeURIComponent(version)}`);
        }
      } catch {}
    };
    check();
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const toast = useCallback((msg, color = ACCENT) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, color }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  // ── Auth: load session on mount, subscribe to changes ──
  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    (async () => {
      try {
        const s = await authService.getSession();
        if (cancelled) return;
        setSession(s);
        if (s?.user) {
          const row = await syncService.getProfileRow(s.user.id);
          if (!cancelled) setRemoteProfile(row);
        }
      } catch {
        // ignore — fall through to signed-out state
      }
    })();
    const unsubscribe = authService.onAuthChange((newSession) => {
      setSession(newSession);
      if (!newSession) setRemoteProfile(null);
    });
    return () => { cancelled = true; unsubscribe(); };
  }, []);

  // ── Awakening trigger: surface the aspect picker when crossing level threshold ──
  useEffect(() => {
    if (!st) return;
    if ((st.overallLevel || 1) >= AWAKENING_LEVEL && !st.cosmetics?.aspect && !awakeningPending) {
      setAwakeningPending(true);
    }
  }, [st?.overallLevel, st?.cosmetics?.aspect, awakeningPending]);

  // ── Auth: snapshot push (debounced) when local stats change ──
  const pushTimerRef = useRef(null);
  useEffect(() => {
    if (!supabaseConfigured || !session?.user || !remoteProfile) return;
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      const snapshot = syncService.buildSnapshotFromLocal(st, settings);
      syncService.pushSnapshot({ userId: session.user.id, snapshot }).catch(() => {});
    }, 1500);
    return () => { if (pushTimerRef.current) clearTimeout(pushTimerRef.current); };
  }, [st, settings, session, remoteProfile]);

  // ── Auth: full-state push (debounced, gzip'd) for cross-device restore ──
  // Slower debounce (10s) — this uploads the entire local store, so we batch
  // multiple edits together. Failures are silent; a snapshot push is the
  // user-visible sync path, this is best-effort backup.
  const fullStatePushTimerRef = useRef(null);
  useEffect(() => {
    if (!supabaseConfigured || !session?.user) return;
    if (fullStatePushTimerRef.current) clearTimeout(fullStatePushTimerRef.current);
    fullStatePushTimerRef.current = setTimeout(() => {
      cloudStateService.pushFullState(session.user.id, store).catch(() => {});
    }, 10000);
    return () => { if (fullStatePushTimerRef.current) clearTimeout(fullStatePushTimerRef.current); };
  }, [store, session]);

  // ── Auth handlers ──
  const handleSignUp = useCallback(async ({ email, password, username }) => {
    setAuthBusy(true); setAuthError(null);
    try {
      const cleanUsername = authService.validateUsername(username);
      const available = await syncService.isUsernameAvailable(cleanUsername);
      if (!available) throw new Error("That username is taken.");
      const { user, session: newSession } = await authService.signUp({ email, password });
      if (!user) throw new Error("Sign-up failed — no user returned.");
      const snapshot = syncService.buildSnapshotFromLocal(st, settings);
      const row = await syncService.upsertProfileRow({
        userId: user.id, username: cleanUsername, snapshot,
      });
      setSession(newSession || (await authService.getSession()));
      setRemoteProfile(row);
      toast(`Welcome, @${cleanUsername}`, GREEN);
      return true;
    } catch (e) {
      setAuthError(e.message || "Sign-up failed.");
      return false;
    } finally {
      setAuthBusy(false);
    }
  }, [st, settings, toast]);

  const handleSignIn = useCallback(async ({ email, password }) => {
    setAuthBusy(true); setAuthError(null);
    try {
      const { user, session: newSession } = await authService.signIn({ email, password });
      setSession(newSession);
      const row = user ? await syncService.getProfileRow(user.id) : null;
      setRemoteProfile(row);
      if (user) friendsService.countIncoming(user.id).then(setPendingCount).catch(() => {});

      // Cross-device restore: only auto-replace local state when this device
      // has nothing of its own yet (active profile not onboarded). For users
      // already mid-progress on this device, the debounced push keeps cloud
      // state up to date without overwriting their work.
      const activeProfile = store.profiles[store.activeId];
      if (user && activeProfile && !activeProfile.onboarded) {
        const restored = await cloudStateService.pullFullState(user.id).catch(() => null);
        if (restored && restored.profiles && restored.activeId) {
          setStore(restored);
          toast("Progress restored from cloud", GREEN);
        }
      }

      toast(row ? `Signed in as @${row.username}` : "Signed in", GREEN);
      return true;
    } catch (e) {
      setAuthError(e.message || "Sign-in failed.");
      return false;
    } finally {
      setAuthBusy(false);
    }
  }, [toast, store]);

  const handleSignOut = useCallback(async () => {
    setAuthBusy(true);
    try {
      await authService.signOut();
      setSession(null);
      setRemoteProfile(null);
      setPendingCount(0);
      toast("Signed out", MUTED);
    } finally {
      setAuthBusy(false);
    }
  }, [toast]);

  const handleToggleSharePrs = useCallback(async () => {
    if (!session?.user || !remoteProfile) return;
    const next = remoteProfile.share_prs === false ? true : false;
    try {
      await adminService.setSharePrs(session.user.id, next);
      setRemoteProfile(r => ({ ...r, share_prs: next }));
      toast(next ? "PRs now visible to friends" : "PRs hidden from friends", next ? GREEN : MUTED);
    } catch (e) {
      toast(e.message || "Failed to update privacy", RED);
    }
  }, [session, remoteProfile, toast]);

  const handleUpdateDisplayName = useCallback(async (rawName) => {
    if (!session?.user || !remoteProfile) return false;
    const next = (rawName || "").trim().slice(0, 30) || null;
    try {
      await adminService.updateProfileField(session.user.id, { display_name: next });
      setRemoteProfile(r => ({ ...r, display_name: next }));
      toast(next ? `Display name updated` : "Display name cleared", GREEN);
      return true;
    } catch (e) {
      toast(e.message || "Failed to update display name", RED);
      return false;
    }
  }, [session, remoteProfile, toast]);

  const handleUpdateBannerColor = useCallback(async (hex) => {
    if (!session?.user || !remoteProfile) return false;
    const next = hex && /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : null;
    try {
      await adminService.updateProfileField(session.user.id, { banner_color: next });
      setRemoteProfile(r => ({ ...r, banner_color: next }));
      toast(next ? "Banner color updated" : "Banner color cleared", next || ACCENT);
      return true;
    } catch (e) {
      toast(e.message || "Failed to update banner color", RED);
      return false;
    }
  }, [session, remoteProfile, toast]);

  const account = {
    session, remoteProfile, busy: authBusy, error: authError,
    supabaseConfigured,
  };

  const updateActive = (fn) => setStore(s => ({ ...s, profiles: { ...s.profiles, [s.activeId]: fn(s.profiles[s.activeId]) } }));

  const handleOnboard = ({ name, gender, goal, weightLbs, heightIn, age }) => {
    updateActive(p => ({ ...p, onboarded: true, name, gender, goal, weightLbs, heightIn, age: age || null }));
  };

  const handleSwitchProfile = (id) => {
    setStore(s => ({ ...s, activeId: id }));
    setScreen("menu");
  };

  const handleCreateProfile = () => {
    const id = "p" + Date.now();
    setStore(s => ({ ...s, activeId: id, profiles: { ...s.profiles, [id]: { ...newProfile(id), onboarded: false } } }));
    setScreen("menu");
  };

  const handleDeleteProfile = (id) => {
    setStore(s => {
      const remaining = Object.keys(s.profiles).filter(k => k !== id);
      const newActive = remaining[0];
      const newProfiles = { ...s.profiles };
      delete newProfiles[id];
      return { activeId: newActive, profiles: newProfiles };
    });
    setScreen("menu");
    toast("Profile deleted", RED);
  };

  const handleUpdateProfile = (id, updates) => {
    setStore(s => ({ ...s, profiles: { ...s.profiles, [id]: { ...s.profiles[id], ...updates } } }));
  };

  // Rebuild stats/subStats/XP from scratch using the workout log as source of truth
  const recomputeStats = (p) => {
    const statEvents = {}, subEvents = {};
    const addE = (m, key, date, xp, share = 1) => { (m[key] = m[key] || []).push({ date, xp, share }); };
    let newOverallXP  = 0;
    for (const w of (p.workouts || [])) {
      const xp    = w.xp || 0;
      const ex    = w.exercise || {};
      const muscle = w.muscle || ex.primary || "chest";
      const emg   = ex.emg || EXERCISE_EMG[ex.name];
      if (ex.type === "cardio") {
        addE(statEvents, "cardio", w.date, xp);
      } else if (emg) {
        const total = Object.values(emg).reduce((s,v) => s+v, 0);
        const byStat = {};
        Object.entries(emg).forEach(([svgId, activation]) => {
          const stat = SVG_TO_STAT[svgId] || muscle;
          byStat[stat] = (byStat[stat] || 0) + activation;
          addE(subEvents, svgId, w.date, Math.round(xp * activation / total), activation / total);
        });
        Object.entries(byStat).forEach(([stat, act]) => {
          addE(statEvents, stat, w.date, Math.round(xp * act / total), act / total);
        });
      } else {
        const targets = ex.svgTargets || [];
        if (targets.length > 0) {
          const share = Math.round(xp / targets.length);
          targets.forEach(svgId => addE(subEvents, svgId, w.date, share));
        }
        const statKey = ex.type === "calisthenics" &&
          !["chest","arms","core"].includes(muscle) ? "calisthenics" : muscle;
        addE(statEvents, statKey, w.date, xp, 1);
        if (statKey !== muscle) addE(statEvents, muscle, w.date, Math.round(xp * 0.4), 0.4);
      }
      newOverallXP += xp;
    }
    const newStats = Object.fromEntries(Object.keys(p.stats || {}).map(k => [k, 0]));
    Object.entries(statEvents).forEach(([k, evts]) => { newStats[k] = atrophiedXP(evts, atrophyParams(k)); });
    const newSubStats = {};
    Object.entries(subEvents).forEach(([k, evts]) => { newSubStats[k] = atrophiedXP(evts, ATROPHY.muscular); });
    newOverallXP += mindOverallBonus(p.mindLog);
    const newLevels = Object.fromEntries(Object.keys(newStats).map(k => [k, getMuscleLevel(newStats[k] || 0)]));
    const tl = getPRTimeline(p.workouts);
    const newPrs = Object.fromEntries(Object.entries(tl).map(([name, evts]) => [name, evts[evts.length - 1].e1rm]));
    return { newStats, newSubStats, newLevels, newPrs, newOverallXP, newOverallLevel: getLevelFromXP(newOverallXP).level };
  };

  const applyXP = (p, exercise, muscle, xp) => {
    const newStats    = { ...p.stats };
    const newSubStats = { ...(p.subStats || {}) };
    const newLevels   = { ...p.levels };
    if (exercise.type === "cardio") {
      newStats.cardio = (newStats.cardio || 0) + xp;
      Object.keys(newStats).forEach(k => { newLevels[k] = getMuscleLevel(newStats[k] || 0); });
      const newOverallXP = (p.overallXP || 0) + xp;
      return { newStats, newSubStats, newLevels, newOverallXP, newOverallLevel: getLevelFromXP(newOverallXP).level, statKey: "cardio" };
    }
    const emg = exercise.emg || EXERCISE_EMG[exercise.name];
    if (emg) {
      const total = Object.values(emg).reduce((s,v) => s+v, 0);
      let primaryStat = muscle, primaryXP = 0;
      Object.entries(emg).forEach(([svgId, activation]) => {
        const xpShare = Math.round(xp * activation / total);
        const stat = SVG_TO_STAT[svgId] || muscle;
        newStats[stat] = (newStats[stat] || 0) + xpShare;
        newSubStats[svgId] = (newSubStats[svgId] || 0) + xpShare;
        if (xpShare > primaryXP) { primaryXP = xpShare; primaryStat = stat; }
      });
      Object.keys(newStats).forEach(k => { newLevels[k] = getMuscleLevel(newStats[k] || 0); });
      const newOverallXP = (p.overallXP || 0) + xp;
      return { newStats, newSubStats, newLevels, newOverallXP, newOverallLevel: getLevelFromXP(newOverallXP).level, statKey: primaryStat };
    }
    // No EMG — distribute evenly across svgTargets if available
    const targets = exercise.svgTargets || [];
    if (targets.length > 0) {
      const share = Math.round(xp / targets.length);
      targets.forEach(svgId => {
        newSubStats[svgId] = (newSubStats[svgId] || 0) + share;
      });
    }
    const statKey = exercise.type === "calisthenics" && !["chest","arms","core"].includes(muscle) ? "calisthenics" : muscle;
    newStats[statKey] = (newStats[statKey] || 0) + xp;
    if (statKey !== muscle) newStats[muscle] = (newStats[muscle] || 0) + Math.round(xp * 0.4);
    Object.keys(newStats).forEach(k => { newLevels[k] = getMuscleLevel(newStats[k] || 0); });
    const newOverallXP = (p.overallXP || 0) + xp;
    return { newStats, newSubStats, newLevels, newOverallXP, newOverallLevel: getLevelFromXP(newOverallXP).level, statKey };
  };

  const handleLogExercise = (entry) => {
    updateActive(p => {
      // Apply net XP: workout XP reduced by any calorie surplus from today's food
      const todayFood = getTodayFood(p);
      const calsEaten = todayFood ? todayFood.calories : 0;
      const tdee = calcTDEE(p);
      const proteinEaten  = todayFood?.protein || 0;
      const proteinTarget = calcProteinTarget(p);
      const netXP = calcNetXP(entry.xp, calsEaten, tdee, proteinEaten, proteinTarget);
      const absorbed = entry.xp - netXP; // XP cancelled by food surplus
      const { newStats, newSubStats, newLevels, newOverallXP, newOverallLevel, statKey } = applyXP(p, entry.exercise, entry.muscle, netXP);
      if (newOverallLevel > p.overallLevel) { setTimeout(() => setCeremonyLevel(newOverallLevel), 350); }
      if (newLevels[statKey] > (p.levels[statKey] || 1)) setTimeout(() => toast(`${MUSCLE_META[statKey]?.name} LVL ${newLevels[statKey]}!`, MUSCLE_META[statKey]?.color), 700);
      if (absorbed > 0) setTimeout(() => toast(`-${absorbed} XP absorbed by food surplus`, RED), 200);
      // Persist PRs (fixes prs never being written) and roll a relic on a
      // genuine PR — a previously recorded e1RM that just got beaten.
      const exName = entry.exerciseName || entry.exercise?.name;
      let newPrs = p.prs || {};
      let newCosmetics = p.cosmetics || {};
      if (exName && Number.isFinite(entry.newE1RM) && entry.newE1RM > 0) {
        const prevPR = (p.prs || {})[exName] || 0;
        if (entry.newE1RM > prevPR) {
          newPrs = { ...(p.prs || {}), [exName]: Math.round(entry.newE1RM) };
          if (prevPR > 0) {
            const relic = rollRelic((p.cosmetics?.relics || []).map(r => r.id));
            if (relic) {
              newCosmetics = { ...(p.cosmetics || {}),
                relics: [...(p.cosmetics?.relics || []), { id: relic.id, date: Date.now(), source: exName }] };
              setTimeout(() => setRelicDrop(relic), 400);
            }
          }
        }
      }
      return { ...p, stats: newStats, subStats: newSubStats, levels: newLevels,
        overallXP: newOverallXP, overallLevel: newOverallLevel, prs: newPrs, cosmetics: newCosmetics,
        workouts: [...p.workouts, { ...entry, xp: netXP, rawXP: entry.xp, absorbed,
          date: entry.targetDate || entry.date || Date.now() }] };
    });
  };

  const handleUnlogExercise = (entry) => {
    updateActive(p => {
      // Remove the entry first, then recompute ALL stats from scratch
      // This guarantees stats always match the workout log — no drift possible
      const newWorkouts = (p.workouts || []).filter(w =>
        !(w.date === entry.date && w.exerciseName === entry.exerciseName));
      const rebuilt = recomputeStats({ ...p, workouts: newWorkouts });
      return { ...p, workouts: newWorkouts,
        stats: rebuilt.newStats, subStats: rebuilt.newSubStats,
        levels: rebuilt.newLevels, prs: rebuilt.newPrs, overallXP: rebuilt.newOverallXP,
        overallLevel: rebuilt.newOverallLevel };
    });
    toast(`${entry.exerciseName} removed`, MUTED);
  };

  const handleLogFood = (calories, protein = 0, targetDate = null) => {
    updateActive(p => {
      const dateStr     = targetDate ? new Date(targetDate).toDateString() : new Date().toDateString();
      const existingIdx = (p.foodLog || []).findIndex(f => new Date(f.date).toDateString() === dateStr);
      const newLog      = [...(p.foodLog || [])];
      const tdee        = calcTDEE(p);
      const protTarget  = calcProteinTarget(p);
      const surplus     = Math.max(0, calories - tdee);
      const entry       = { date: targetDate || Date.now(), calories, protein };
      if (existingIdx >= 0) newLog[existingIdx] = entry;
      else newLog.push(entry);
      if (surplus > 0) toast(`${surplus.toLocaleString()} CAL SURPLUS — XP REDUCED`, RED);
      if (protein > 0 && protein < protTarget * 0.75)
        toast(`Low protein — muscle XP at ${Math.round(calcProteinMultiplier(protein, protTarget)*100)}%`, GOLD);
      else toast(`Nutrition logged for ${dateStr}`, GREEN);
      return { ...p, foodLog: newLog };
    });
  };

  const handleSelectProgram = (programId) => {
    updateActive(p => ({ ...p, program: programId, customSchedule: null }));
  };

  const handleUpdateSchedule = (newSchedule) => {
    updateActive(p => ({ ...p, customSchedule: newSchedule }));
  };

  const handleUpdateWeight = (w) => {
    updateActive(p => ({ ...p, weightLbs: w, lastWeightUpdate: Date.now(),
      weightLog: [...(p.weightLog||[]), { date: Date.now(), weight: w }] }));
    toast(`Weight updated: ${wtVal(w).toFixed(1)} ${wtLabel()}`, GREEN);
  };

  const handleSaveCustomExercise = (exercise) => {
    updateActive(p => ({
      ...p,
      customExercises: [...(p.customExercises || []).filter(e => e.name !== exercise.name), exercise]
    }));
    toast(`${exercise.name} saved`, GREEN);
  };

  const handleToggleBookmark = (exerciseName) => {
    updateActive(p => {
      const list = p.bookmarkedExercises || [];
      const has = list.includes(exerciseName);
      return { ...p, bookmarkedExercises: has ? list.filter(n => n !== exerciseName) : [...list, exerciseName] };
    });
  };

  const handleToggleRitual = (ritualId) => {
    updateActive(p => {
      const today = _dateKey(new Date());
      const log   = { ...(p.dailyRituals?.completionLog || {}) };
      const todayList = new Set(log[today] || []);
      if (todayList.has(ritualId)) todayList.delete(ritualId);
      else todayList.add(ritualId);
      log[today] = [...todayList];

      // Compute streak with the updated log, then unlock any newly-earned titles
      const streak = _computeRitualStreak(log);
      const owned  = p.cosmetics?.unlockedTitles || [];
      const newlyEarned = _newlyEarnedTitles(streak, owned);
      if (newlyEarned.length > 0) {
        newlyEarned.forEach(t => setTimeout(() => toast(`Title unlocked: ${t.name}`, GOLD), 200));
      }

      return {
        ...p,
        dailyRituals: { ...(p.dailyRituals || {}), completionLog: log },
        cosmetics: {
          ...(p.cosmetics || {}),
          unlockedTitles: [...owned, ...newlyEarned.map(t => t.id)],
          equippedTitle: p.cosmetics?.equippedTitle || newlyEarned[0]?.id || null,
        },
      };
    });
  };

  const handleEquipTitle = (titleId) => {
    updateActive(p => ({
      ...p,
      cosmetics: { ...(p.cosmetics || {}), equippedTitle: titleId || null },
    }));
    // Push the resolved title name to cloud so friends see it on leaderboards
    if (session?.user) {
      const titleName = titleId ? (COSMETIC_TITLES.find(t => t.id === titleId)?.name || null) : null;
      adminService.updateProfileField(session.user.id, { equipped_title: titleName })
        .then(() => setRemoteProfile(r => r ? { ...r, equipped_title: titleName } : r))
        .catch(() => {});
    }
  };

  const handleAddMindTask = (task) => {
    updateActive(p => ({ ...p, mindTasks: [...(p.mindTasks || []), task] }));
    toast("Added to daily tasks", "#8b8cf6");
  };

  const handleRemoveMindTask = (taskId) => {
    updateActive(p => ({ ...p, mindTasks: (p.mindTasks || []).filter(t => t.id !== taskId) }));
  };

  // Check/uncheck a daily task. XP flows through the same mindLog ledger the
  // instant logger uses — a deterministic entry id (task + day) lets unchecking
  // remove exactly the XP that checking granted.
  const handleToggleMindTask = (taskId) => {
    updateActive(p => {
      const task = (p.mindTasks || []).find(t => t.id === taskId);
      if (!task) return p;
      const dayKey = _dateKey(new Date());
      const entryId = `task:${taskId}:${dayKey}`;
      const log = { ...(p.mindTasksLog || {}) };
      const todaySet = new Set(log[dayKey] || []);
      const meta = MUSCLE_META[task.stat];
      const bonus = Math.round(task.xp * MIND_OVERALL_WEIGHT);
      let mindLog, newOverallXP;
      if (todaySet.has(taskId)) {
        todaySet.delete(taskId);
        mindLog = (p.mindLog || []).filter(e => e.id !== entryId);
        newOverallXP = Math.max(0, (p.overallXP || 0) - bonus);
      } else {
        todaySet.add(taskId);
        mindLog = [...(p.mindLog || []), { id: entryId, date: Date.now(),
          stat: task.stat, activity: task.activity, label: task.label, qty: task.qty, xp: task.xp }];
        newOverallXP = (p.overallXP || 0) + bonus;
        const beforeLvl = getMuscleLevel(mindStatXP(p, task.stat));
        const afterLvl  = getMuscleLevel((p.mindLog || []).concat([{ stat: task.stat, xp: task.xp }])
          .reduce((s, e) => e.stat === task.stat ? s + (e.xp || 0) : s, 0));
        setTimeout(() => toast(`+${task.xp} ${meta.name} XP`, meta.color), 60);
        if (afterLvl > beforeLvl) setTimeout(() => toast(`${meta.name} LVL ${afterLvl}!`, meta.color), 420);
        const newOverallLevel = getLevelFromXP(newOverallXP).level;
        if (newOverallLevel > p.overallLevel) setTimeout(() => setCeremonyLevel(newOverallLevel), 600);
      }
      log[dayKey] = [...todaySet];
      return { ...p, mindTasksLog: log, mindLog,
        overallXP: newOverallXP, overallLevel: getLevelFromXP(newOverallXP).level };
    });
  };

  const handleLogMind = (entry) => {
    updateActive(p => {
      const stat = entry.stat;
      const beforeLvl = getMuscleLevel(mindStatXP(p, stat));
      const bonus = Math.round(entry.xp * MIND_OVERALL_WEIGHT);
      const newOverallXP = (p.overallXP || 0) + bonus;
      const newOverallLevel = getLevelFromXP(newOverallXP).level;
      const next = { ...p, mindLog: [...(p.mindLog || []), entry],
        overallXP: newOverallXP, overallLevel: newOverallLevel };
      const afterLvl = getMuscleLevel(mindStatXP(next, stat));
      const meta = MUSCLE_META[stat];
      setTimeout(() => toast(`+${entry.xp} ${meta.name} XP`, meta.color), 60);
      if (afterLvl > beforeLvl) {
        setTimeout(() => toast(`${meta.name} LVL ${afterLvl}!`, meta.color), 420);
      }
      if (newOverallLevel > p.overallLevel) setTimeout(() => setCeremonyLevel(newOverallLevel), 600);
      return next;
    });
  };

  const handleChooseAspect = (aspectId) => {
    const aspect = ASPECTS.find(a => a.id === aspectId);
    if (!aspect) return;
    updateActive(p => ({
      ...p,
      cosmetics: { ...(p.cosmetics || {}), aspect: aspectId },
    }));
    setAwakeningPending(false);
    toast(`Path of the ${aspect.name} chosen`, aspect.color);
    if (session?.user) {
      adminService.updateProfileField(session.user.id, { equipped_aspect: aspect.name })
        .then(() => setRemoteProfile(r => r ? { ...r, equipped_aspect: aspect.name } : r))
        .catch(() => {});
    }
  };

  const handleSetPatronLift = (exerciseName) => {
    updateActive(p => ({ ...p, patronLift: exerciseName || null }));
    if (session?.user) {
      adminService.updateProfileField(session.user.id, { patron_lift: exerciseName || null })
        .then(() => setRemoteProfile(r => r ? { ...r, patron_lift: exerciseName || null } : r))
        .catch(() => {});
    }
  };

  const handleSaveCustomProgram = (prog, deleteId = null) => {
    updateActive(p => {
      const existing = p.customPrograms || [];
      if (deleteId && !prog.name) return { ...p, customPrograms: existing.filter(cp => cp.id !== deleteId) };
      return { ...p, customPrograms: [...existing.filter(cp => cp.id !== deleteId), prog] };
    });
  };

  if (!st.onboarded) {
    let firstLaunchView;
    if (welcomeStage === "welcome") {
      firstLaunchView = (
        <WelcomeScreen
          supabaseConfigured={supabaseConfigured}
          onCreateAccount={() => setWelcomeStage("auth-signup")}
          onSignIn={() => setWelcomeStage("auth-signin")}
          onGuest={() => setWelcomeStage("onboard")}
        />
      );
    } else if (welcomeStage === "auth-signin" || welcomeStage === "auth-signup") {
      firstLaunchView = (
        <AuthPanel
          initialMode={welcomeStage === "auth-signup" ? "signup" : "signin"}
          onClose={() => setWelcomeStage("welcome")}
          onSignIn={async (creds) => {
            const ok = await handleSignIn(creds);
            if (ok) setWelcomeStage("onboard"); // restored stores will already flip onboarded=true and skip the OnboardScreen below
          }}
          onSignUp={async (creds) => {
            const ok = await handleSignUp(creds);
            if (ok) setWelcomeStage("onboard");
          }}
          busy={authBusy}
          error={authError}
        />
      );
    } else {
      firstLaunchView = <OnboardScreen onComplete={handleOnboard} />;
    }

    return (
      <>
        <style>{CSS}</style>
        <style>{dynCSS}</style>
        {firstLaunchView}
        <Toasts toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <style>{dynCSS}</style>
      <div id="iron-realm-root" style={{ minHeight: "100dvh" }}>
      <div className="aurora-bg" />
      <Suspense fallback={null}><SystemParticles accent={settings?.accentColor || "#00d4ff"} /></Suspense>
      <Toasts toasts={toasts} />
      {awakeningPending && <AwakeningModal onChoose={handleChooseAspect} />}
      {ceremonyLevel && <LevelUpCeremony level={ceremonyLevel} settings={settings} onDone={() => setCeremonyLevel(null)} />}
      {relicDrop && !ceremonyLevel && <RelicDropModal relic={relicDrop}
        onEquip={() => { const id = relicDrop.id; updateActive(p => ({ ...p, cosmetics: { ...(p.cosmetics || {}), equippedRelic: id } })); toast(`${relicDrop.name} equipped`, RELIC_FRAME_COLORS[id]); setRelicDrop(null); }}
        onClose={() => setRelicDrop(null)} />}
      <div key={screen} className="screen-wipe">
      {screen === "menu"      && <MenuScreen st={st} setScreen={setScreen} onLogFood={handleLogFood} onUpdateWeight={handleUpdateWeight} settings={settings} onUpdateSettings={handleUpdateSettings} toast={toast} account={account} onSignIn={handleSignIn} onSignUp={handleSignUp} onSignOut={handleSignOut} onToggleSharePrs={handleToggleSharePrs} onUpdateDisplayName={handleUpdateDisplayName} onUpdateBannerColor={handleUpdateBannerColor} onToggleRitual={handleToggleRitual} onEquipTitle={handleEquipTitle} onLogMind={handleLogMind} onAddMindTask={handleAddMindTask} onRemoveMindTask={handleRemoveMindTask} onToggleMindTask={handleToggleMindTask} pendingCount={pendingCount} />}
      {screen === "schedule"  && <ScheduleScreen st={st} onLogExercise={handleLogExercise} onUnlogExercise={handleUnlogExercise} onUpdateSchedule={handleUpdateSchedule} onLogFood={handleLogFood} settings={settings} toast={toast} />}
      {screen === "workout"   && <FreeWorkoutScreen st={st} onLogExercise={handleLogExercise} onUnlogExercise={handleUnlogExercise} settings={settings} toast={toast} />}
      {screen === "database"  && <DatabaseScreen st={st} onLogExercise={handleLogExercise} onSaveCustomExercise={handleSaveCustomExercise} onToggleBookmark={handleToggleBookmark} settings={settings} toast={toast} />}
      {screen === "character" && <CharacterScreen store={store} onSwitchProfile={handleSwitchProfile} onCreateProfile={handleCreateProfile} onDeleteProfile={handleDeleteProfile} onUpdateProfile={handleUpdateProfile} onSetPatronLift={handleSetPatronLift} toast={toast} />}
      {screen === "program"     && <ProgramScreen st={st} onSelectProgram={handleSelectProgram} onSaveCustomProgram={handleSaveCustomProgram} setScreen={setScreen} toast={toast} />}
      {screen === "leaderboard" && <LeaderboardScreen account={account} toast={toast} />}
      {screen === "friends"     && <FriendsScreen account={account} toast={toast} />}
      </div>
      </div>
      <NavBar screen={screen} setScreen={setScreen} overallLevel={st.overallLevel} settings={settings} pendingCount={pendingCount} />
    </>
  );
}
