/* eslint-disable */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as authService from "./services/auth";
import * as syncService from "./services/sync";
import * as friendsService from "./services/friends";
import * as adminService from "./services/admin";
import { isConfigured as supabaseConfigured } from "./services/supabaseClient";

const APP_VERSION = "1.7.0-dev";

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

const _ACCENT_PRESETS = [
  { name: "Cyan",    value: "#00d4ff", accent2: "#0044aa" },
  { name: "Purple",  value: "#aa44ff", accent2: "#5500cc" },
  { name: "Orange",  value: "#ff7c2a", accent2: "#aa3300" },
  { name: "Green",   value: "#00ff88", accent2: "#007744" },
  { name: "Red",     value: "#ff3a3a", accent2: "#880000" },
  { name: "Pink",    value: "#ff44aa", accent2: "#880055" },
  { name: "Gold",    value: "#e8c44a", accent2: "#886600" },
  { name: "White",   value: "#e8eef8", accent2: "#6688aa" },
];

// Shadow theme — dark purple void aesthetic
// Deep void black backgrounds, electric blue-purple power aura, blood red accents
// Iron Realm themes
const MONARCHS = [
  {
    id: "shadow",
    name: "The Shadow",
    title: "The Shadow",
    quote: "ARISE",
    desc: "Born from darkness. Commands the shadows.",
    glyph: "⬡",
    accentColor:  "#6e44ff",
    accent2Color: "#1a0050",
    gradient: "linear-gradient(160deg, #0a0418, #04020e)",
    glow: "#6e44ff",
    swatches: [["#6e44ff","Shadow Purple"],["#1a0050","Void"],["#c8b8f0","Soul"]],
    // Easter eggs — rename UI elements to shadow army language
    labels: {
      logIt:       "ARISE",
      hunter:      "SOVEREIGN",
      database:    "SHADOW ARCHIVE",
      schedule:    "CAMPAIGNS",
      workout:     "BATTLE LOG",
      levelUp: "A NEW SHADOW AWAKENS",
      muscleLevel: "SHADOW EVOLVES",
      pr:          "SHADOW STRENGTHENS",
      rankNames:   ["Shadow Initiate","Shadow Knight","Shadow General","Shadow Marshal","Shadow Commander","Shadow Sovereign","Ruler's Will","Ruler's Authority","SHADOW"],
    },
  },
  {
    id: "beast",
    name: "The Dragon",
    title: "The Dragon",
    quote: "DESTRUCTION INCARNATE",
    desc: "The apex predator. Forged in dragon fire.",
    glyph: "◈",
    accentColor:  "#ff3300",
    accent2Color: "#6b0f00",
    gradient: "linear-gradient(160deg, #1a0500, #0d0200)",
    glow: "#ff3300",
    swatches: [["#ff3300","Crimson Fire"],["#6b0f00","Blood"],["#ff9966","Ember"]],
    labels: {
      logIt:       "DEVOUR",
      hunter:      "DESTROYER",
      database:    "BESTIARY",
      schedule:    "HUNT",
      workout:     "RAMPAGE",
      levelUp:     "YOUR POWER GROWS",
      muscleLevel: "MUSCLE DEVOURED",
      pr:          "DOMINANCE ASSERTED",
      rankNames:   ["Fledgling Beast","Pack Hunter","Alpha","Apex Predator","Dragon Kin","Dragon Knight","Dragon Lord","Dragon King","THE DRAGON"],
    },
  },
  {
    id: "hunter",
    name: "The Hunter",
    title: "The Hunter",
    quote: "THE HUNT BEGINS",
    desc: "The original iron realm. Built for hunters.",
    glyph: "◎",
    accentColor:  "#00d4ff",
    accent2Color: "#0044aa",
    gradient: "linear-gradient(160deg, #020a14, #030d1a)",
    glow: "#00d4ff",
    swatches: [["#00d4ff","System Cyan"],["#0044aa","Deep Blue"],["#d0e8ff","Ice White"]],
    labels: {
      logIt:       "LOG IT",
      hunter:      "HUNTER",
      database:    "DATABASE",
      schedule:    "SCHEDULE",
      workout:     "WORKOUT",
      levelUp:     "LEVEL UP!",
      muscleLevel: "MUSCLE LEVELED",
      pr:          "NEW PR!",
      rankNames:   ["E-Rank","D-Rank","C-Rank","B-Rank","A-Rank","S-Rank","National Level","Special Authority","THE HUNTER"],
    },
  },
  {
    id: "architect",
    name: "The System",
    title: "The System",
    quote: "SYSTEM ONLINE",
    desc: "The System observes all. You are a variable.",
    glyph: "[ ]",
    accentColor:  "#e8eef8",
    accent2Color: "#4a6688",
    gradient: "linear-gradient(160deg, #060810, #020308)",
    glow: "#aabbdd",
    swatches: [["#e8eef8","System White"],["#4a6688","Terminal"],["#8899bb","Parameter"]],
    labels: {
      logIt:       "EXECUTE",
      hunter:      "ENTITY",
      database:    "SKILL REGISTRY",
      schedule:    "PROTOCOL",
      workout:     "SYSTEM LOG",
      levelUp:     "[ PARAMETER UPDATED ]",
      muscleLevel: "[ ATTRIBUTE REINFORCED ]",
      pr:          "[ NEW RECORD WRITTEN ]",
      rankNames:   ["Unregistered","E-Class Entity","D-Class Entity","C-Class Entity","B-Class Entity","A-Class Entity","S-Class Entity","National-Level Entity","[ ADMINISTRATOR ]"],
    },
  },
];

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

// ─── DAILY TIPS ──────────────────────────────────────────────────────────────
// All tips sourced from peer-reviewed research and evidence-based guidelines
const DAILY_TIPS = [
  // ── TRAINING SCIENCE ─────────────────────────────────────────────────────
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Train each muscle group 2x per week for maximum hypertrophy.",
    source: "Schoenfeld et al. (2016) — J Strength Cond Res",
    detail: "Studies show twice-weekly frequency produces significantly more muscle growth than once weekly at equal total volume.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Rest 2–3 minutes between heavy compound sets for full strength recovery.",
    source: "Schoenfeld et al. (2016) — J Strength Cond Res",
    detail: "Longer rest periods (3 min) produce greater strength and hypertrophy gains than short rests (1 min) for compound movements.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Aim for 10–20 working sets per muscle group per week.",
    source: "Krieger (2010) — J Strength Cond Res",
    detail: "Meta-analysis showed 2+ sets per exercise produces 46% more growth than 1 set. 10–20 weekly sets is the optimal hypertrophy range.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Train to within 1–3 reps of failure for optimal muscle stimulus.",
    source: "Schoenfeld & Grgic (2019) — Strength & Cond J",
    detail: "Proximity to failure is a key driver of hypertrophy. Leaving more than 3 reps in reserve significantly reduces growth stimulus.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Progressive overload — add weight or reps every 1–2 weeks to keep growing.",
    source: "NSCA Position Statement (2009)",
    detail: "Muscles adapt to a given stimulus within weeks. Systematic progression is the single most important factor in long-term strength and size gains.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Compound lifts first, isolation exercises last.",
    source: "Kraemer & Ratamess (2004) — Sports Med",
    detail: "Performing multi-joint exercises when CNS is fresh maximises load and neural drive. Isolation work is more effective after compounds.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Eccentric (lowering) phase should be controlled — 2–3 seconds down.",
    source: "Schoenfeld (2010) — J Strength Cond Res",
    detail: "Eccentric muscle actions produce greater mechanical tension and muscle damage, both key drivers of hypertrophy.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Full range of motion produces more muscle growth than partial reps.",
    source: "McMahon et al. (2014) — J Strength Cond Res",
    detail: "Full ROM training leads to greater increases in muscle length and size compared to partial ROM at the same load.",
  },
  // ── RECOVERY ─────────────────────────────────────────────────────────────
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "7–9 hours of sleep is essential — growth hormone peaks during deep sleep.",
    source: "Dattilo et al. (2011) — Med Hypotheses",
    detail: "Sleep deprivation reduces anabolic hormone levels and impairs muscle protein synthesis. Prioritising sleep is as important as training.",
  },
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "Muscles need 48–72 hours to recover before training the same group again.",
    source: "NSCA Guidelines (2009)",
    detail: "Muscle protein synthesis peaks at 24–48 hours post-training. Training a muscle before it recovers limits adaptation and increases injury risk.",
  },
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "Cold water immersion reduces DOMS but may blunt long-term hypertrophy.",
    source: "Roberts et al. (2015) — J Physiology",
    detail: "Ice baths suppress inflammation needed for muscle adaptation. Best used during competition phases, not during hypertrophy training blocks.",
  },
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "Active recovery (light walking, stretching) outperforms complete rest for DOMS.",
    source: "Dupuy et al. (2018) — Front Physiology",
    detail: "Meta-analysis of 99 studies found active recovery most effective for reducing muscle soreness compared to passive rest.",
  },
  // ── NUTRITION ────────────────────────────────────────────────────────────
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Consume 1.6–2.2g of protein per kg of bodyweight daily for muscle growth.",
    source: "Morton et al. (2018) — Br J Sports Med",
    detail: "Meta-analysis of 49 studies found protein beyond 1.62g/kg/day provides no additional hypertrophy benefit.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Spread protein across 3–5 meals — each meal should have 0.4g/kg bodyweight.",
    source: "Moore et al. (2009) — Am J Clin Nutr",
    detail: "Muscle protein synthesis is maximised per meal at ~20–40g protein. More frequent feedings sustain anabolic signalling throughout the day.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Eat within 2 hours post-workout to maximise muscle protein synthesis.",
    source: "Aragon & Schoenfeld (2013) — JISSN",
    detail: "The post-exercise anabolic window is real but wider than thought — prioritise total daily protein over exact timing.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Creatine monohydrate is the most evidence-backed legal supplement for strength.",
    source: "Lanhers et al. (2017) — Eur J Sport Sci",
    detail: "5g/day of creatine monohydrate consistently increases strength output and lean mass. No loading phase required.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "A slight calorie surplus (200–300 kcal) is optimal for muscle gain with minimal fat.",
    source: "Barakat et al. (2020) — Strength & Cond J",
    detail: "Aggressive bulking above maintenance increases fat gain without proportional muscle gain. A modest surplus maximises lean mass accretion.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Caffeine (3–6mg/kg) 30–60 min pre-workout improves performance.",
    source: "Grgic et al. (2018) — Br J Sports Med",
    detail: "Meta-analysis of 21 studies confirmed caffeine significantly increases strength, endurance, and power output.",
  },
  // ── APP TIPS ─────────────────────────────────────────────────────────────
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Use the RANDOMIZE button on the Schedule screen to get a science-built workout.",
    source: "Iron Realm",
    detail: "The randomizer uses NSCA recovery guidelines and EMG data to pick exercises covering all muscle angles, avoiding muscles you trained in the last 48 hours.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Log your nutrition on the Schedule screen — you can log for any past day.",
    source: "Iron Realm",
    detail: "Tap any day tab on the Schedule screen and enter your calories and protein. The XP system adjusts your workout XP based on your nutrition for that day.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Check the Hunter screen to see which sub-muscles need more attention.",
    source: "Iron Realm",
    detail: "Expand any muscle group in the Hunter tab to see individual sub-muscle XP levels. Low levels indicate undertrained muscle regions.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "The difficulty filter in the randomizer selects exercises at your level.",
    source: "Iron Realm",
    detail: "Use Beginner when learning movements, Intermediate for your main training block, and Advanced/Elite when you want maximum stimulus.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Log workouts for missed days by tapping that day's tab in Schedule.",
    source: "Iron Realm",
    detail: "Missed yesterday? Tap Tuesday's tab, hit Log Exercise, and your workout is saved on the correct day with correct XP calculations.",
  },
];

// Get today's tip — rotates daily based on day of year
const getTodayTip = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
};

// ─── XP / CALORIE CONSTANTS ───────────────────────────────────────────────────
// XP = calories burned (exact MET calculation)
// 1 lb of fat  = 3,500 cal  → overall level threshold per level
// 1 lb of muscle = 2,500 cal → per-muscle level threshold per level
// ── XP LEVEL THRESHOLDS ──────────────────────────────────────────────────────
// Scaling curve: 500 × n^1.6 (overall), 120 × n^1.5 (muscle)
// LVL 2 in ~4 days · LVL 5 in ~7 weeks · LVL 10 in ~5 months · LVL 30+ = years
// Sources: Schoenfeld (2010), NSCA (2016), Kraemer et al. (2002)
const OVERALL_THRESHOLDS = [500, 1516, 2900, 4595, 6566, 8790, 11249, 13929, 16817, 19905, 23185, 26648, 30289, 34102, 38082, 42224, 46525, 50981, 55587, 60342, 65241, 70282, 75463, 80781, 86233, 91818, 97533, 103377, 109347, 115442, 121660, 128000, 134460, 141038, 147733, 154545, 161470, 168509, 175660, 182922, 190294, 197774, 205362, 213056, 220856, 228761, 236770, 244882, 253095, 261410, 269825, 278340, 286953, 295665, 304474, 313380, 322381, 331478, 340669, 349955, 359334, 368805, 378368, 388023, 397769, 407606, 417532, 427547, 437652, 447844, 458124, 468492, 478946, 489487, 500113, 510825, 521621, 532502, 543467, 554516, 565648, 576862, 588159, 599538, 610999, 622540, 634163, 645866, 657649, 669511, 681454, 693475, 705574, 717752, 730008, 742342, 754753, 767241, 779806, 792447];
const MUSCLE_THRESHOLDS  = [120, 339, 624, 960, 1342, 1764, 2222, 2715, 3240, 3795, 4378, 4988, 5625, 6286, 6971, 7680, 8411, 9164, 9938, 10733, 11548, 12383, 13236, 14109, 15000, 15909, 16836, 17779, 18740, 19718, 20712, 21722, 22748, 23790, 24848, 25920, 27007, 28110, 29227, 30358, 31503, 32663, 33836, 35024, 36224, 37438, 38666, 39906, 41160, 42426, 43706, 44997, 46301, 47618, 48947, 50288, 51641, 53006, 54383, 55771, 57171, 58583, 60006, 61440, 62886, 64342, 65810, 67289, 68779, 70279, 71791, 73313, 74845, 76389, 77942, 79506, 81081, 82665, 84260, 85865, 87480, 89105, 90740, 92385, 94039, 95704, 97378, 99062, 100755, 102458, 104170, 105892, 107623, 109364, 111113, 112872, 114641, 116418, 118205, 120000];
const XP_FOR_OVERALL_LEVEL = (lvl) => OVERALL_THRESHOLDS[Math.min(lvl - 1, 99)];
const XP_FOR_MUSCLE_LEVEL  = (lvl) => MUSCLE_THRESHOLDS[Math.min(lvl - 1, 99)];

// ── LEVEL MILESTONE NAMES ─────────────────────────────────────────────────────
// Overall: maps training age / work capacity to real physiological stages
// Sources: NSCA (2016), Kraemer et al (2002), Moritani & deVries (1979)
const OVERALL_MILESTONE_NAMES = [
  "Awakened","Initiate","Recruit","Beginner","Novice",
  "Iron Disciple","Trained","Iron Veteran","Advanced","S-Rank Hunter",
  "Iron Blood","Iron Will","Iron Form","Iron Soul","Iron Sovereign",
  "Iron Disciple","Iron Knight","Iron Lord","Iron Sovereign","Sovereign",
  "Void Knight","Void Walker","Abyss Knight","Abyss Lord","Arch-Sovereign",
  "Abyss Sovereign","Abyss Emperor","Obsidian King","Obsidian Sovereign","Transcendent",
];
const OVERALL_MILESTONE_DESC = [
  "Your body begins responding to training stimulus",
  "Neural pathways forming — movement patterns improving",
  "First measurable strength gains appear",
  "One month of consistent training achieved",
  "Visible fitness improvement — others may notice",
  "Body composition is actively changing",
  "Intermediate fitness — real athletic capacity",
  "6 months of hard training — significant transformation",
  "Top 20% of gym-goers — elite recreational athlete",
  "1 year of dedicated training — serious physique",
  "Strength and muscle beyond most lifters",
  "Unwavering commitment — iron forged",
  "Your form and physique reflect years of work",
  "Training is no longer a habit — it is identity",
  "Multi-year athlete — rare level of development",
  "Shadow-tier strength — most cannot follow",
  "Elite amateur athlete — competitive physique",
  "Years of mastery showing in every movement",
  "Top 1% of lifters worldwide",
  "Elite amateur — competitive-level physique",
  "Beyond recreational — approaching professional",
  "Years of consistent elite-level training",
  "Professional athlete territory",
  "Extraordinary lifetime dedication",
  "Arch-level development — legendary",
  "Fewer than 0.01% ever reach this stage",
  "Transcendent physical development",
  "Generational talent + years of work",
  "Living legacy of the iron path",
  "Absolute pinnacle — professional/competitive",
];

// Muscle: maps hypertrophy science stages
// Sources: Schoenfeld (2010), Moritani & deVries (1979)
const MUSCLE_MILESTONE_NAMES = [
  "Dormant","Activated","Stimulated","Growing","Defined",
  "Developed","Sculpted","Elite","Stage-Ready","Mastered",
];
const MUSCLE_MILESTONE_DESC = [
  "Untrained — no specific adaptation yet",
  "Neural adaptation begins — strength before size",
  "Satellite cells recruited — hypertrophy signalling starts",
  "Measurable hypertrophy — ~6 weeks of focused training",
  "Visible pump and size — ~3 months of dedicated work",
  "Clear muscle definition and separation",
  "Well-developed — visible at rest, not just pumped",
  "Competitive bodybuilder level of development",
  "Advanced — years of dedicated work on this muscle",
  "Peak natural development for this muscle group",
];

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

// ─── EXERCISE DB ──────────────────────────────────────────────────────────────
const EXERCISE_EMG = {
  "Bench Press": {"mid-lower-pectoralis": 100, "upper-pectoralis": 70, "anterior-deltoid": 50, "lateral-head-triceps": 55, "medial-head-triceps": 40},
  "Incline Bench Press": {"upper-pectoralis": 100, "mid-lower-pectoralis": 55, "anterior-deltoid": 75, "lateral-head-triceps": 50},
  "Decline Bench Press": {"mid-lower-pectoralis": 100, "upper-pectoralis": 40, "lateral-head-triceps": 50, "medial-head-triceps": 35},
  "Dumbbell Flyes": {"mid-lower-pectoralis": 100, "upper-pectoralis": 80, "anterior-deltoid": 25},
  "Cable Crossover": {"mid-lower-pectoralis": 100, "upper-pectoralis": 75, "anterior-deltoid": 20},
  "Pec Deck Machine": {"mid-lower-pectoralis": 100, "upper-pectoralis": 80},
  "Dips": {"mid-lower-pectoralis": 100, "upper-pectoralis": 40, "lateral-head-triceps": 80, "medial-head-triceps": 60, "long-head-triceps": 50, "anterior-deltoid": 45},
  "Push-ups": {"mid-lower-pectoralis": 100, "upper-pectoralis": 70, "anterior-deltoid": 55, "lateral-head-triceps": 50, "medial-head-triceps": 35},
  "Deadlift": {"lats": 70, "lowerback": 100, "upper-trapezius": 60, "traps-middle": 65, "gluteus-maximus": 85, "outer-quadricep": 55, "medial-hamstrings": 70},
  "Barbell Row": {"lats": 100, "traps-middle": 80, "lower-trapezius": 70, "posterior-deltoid": 65, "long-head-bicep": 55, "lowerback": 50},
  "Pull-ups": {"lats": 100, "lower-trapezius": 70, "short-head-bicep": 65, "long-head-bicep": 60, "traps-middle": 45},
  "Lat Pulldown": {"lats": 100, "lower-trapezius": 65, "long-head-bicep": 60, "traps-middle": 40},
  "Seated Cable Row": {"lats": 100, "traps-middle": 75, "lower-trapezius": 65, "posterior-deltoid": 60, "long-head-bicep": 45},
  "T-Bar Row": {"lats": 100, "traps-middle": 80, "lower-trapezius": 65, "long-head-bicep": 50, "lowerback": 45},
  "Dumbbell Row": {"lats": 100, "lower-trapezius": 65, "posterior-deltoid": 55, "long-head-bicep": 50},
  "Face Pulls": {"posterior-deltoid": 100, "traps-middle": 80, "upper-trapezius": 60, "lateral-deltoid": 30},
  "Shrugs": {"upper-trapezius": 100, "traps-middle": 70},
  "Back Extension": {"lowerback": 100, "gluteus-maximus": 65, "medial-hamstrings": 55},
  "Squat": {"outer-quadricep": 100, "rectus-femoris": 95, "inner-quadricep": 85, "gluteus-maximus": 80, "medial-hamstrings": 30, "lowerback": 25},
  "Romanian Deadlift": {"lateral-hamstrings": 100, "medial-hamstrings": 95, "gluteus-maximus": 85, "lowerback": 50},
  "Leg Press": {"outer-quadricep": 100, "rectus-femoris": 90, "inner-quadricep": 80, "gluteus-maximus": 55},
  "Hack Squat": {"outer-quadricep": 100, "rectus-femoris": 95, "inner-quadricep": 75, "gluteus-maximus": 40},
  "Leg Extension": {"rectus-femoris": 100, "outer-quadricep": 90, "inner-quadricep": 80},
  "Leg Curl": {"medial-hamstrings": 100, "lateral-hamstrings": 90},
  "Walking Lunges": {"outer-quadricep": 100, "rectus-femoris": 90, "gluteus-maximus": 75, "lateral-hamstrings": 45, "inner-quadricep": 70},
  "Calf Raises": {"gastrocnemius": 100, "soleus": 65},
  "Seated Calf Raises": {"soleus": 100, "gastrocnemius": 30},
  "Sumo Squat": {"inner-quadricep": 100, "inner-thigh": 90, "gluteus-maximus": 80, "gluteus-medius": 65, "outer-quadricep": 55},
  "Nordic Curl": {"medial-hamstrings": 100, "lateral-hamstrings": 85},
  "Pistol Squat": {"rectus-femoris": 100, "outer-quadricep": 95, "inner-quadricep": 85, "gluteus-maximus": 70},
  "Overhead Press": {"anterior-deltoid": 100, "lateral-deltoid": 75, "upper-trapezius": 55, "medial-head-triceps": 60, "long-head-triceps": 45},
  "Arnold Press": {"anterior-deltoid": 100, "lateral-deltoid": 80, "posterior-deltoid": 50, "medial-head-triceps": 40},
  "Lateral Raises": {"lateral-deltoid": 100, "anterior-deltoid": 25, "upper-trapezius": 30},
  "Front Raises": {"anterior-deltoid": 100, "lateral-deltoid": 30},
  "Rear Delt Flyes": {"posterior-deltoid": 100, "traps-middle": 60, "lateral-deltoid": 35},
  "Upright Row": {"lateral-deltoid": 100, "anterior-deltoid": 75, "upper-trapezius": 80, "short-head-bicep": 45},
  "Cable Lateral Raise": {"lateral-deltoid": 100, "anterior-deltoid": 30},
  "Pike Push-ups": {"anterior-deltoid": 100, "lateral-deltoid": 65, "medial-head-triceps": 55, "upper-trapezius": 40},
  "Barbell Curl": {"short-head-bicep": 100, "long-head-bicep": 85, "wrist-flexors": 30},
  "Hammer Curl": {"long-head-bicep": 100, "short-head-bicep": 70, "wrist-flexors": 40},
  "Concentration Curl": {"short-head-bicep": 100, "long-head-bicep": 50},
  "Incline Curl": {"long-head-bicep": 100, "short-head-bicep": 60},
  "Preacher Curl": {"short-head-bicep": 100, "long-head-bicep": 75},
  "Cable Curl": {"short-head-bicep": 100, "long-head-bicep": 80},
  "Skull Crushers": {"long-head-triceps": 100, "medial-head-triceps": 70, "lateral-head-triceps": 55},
  "Tricep Pushdown": {"lateral-head-triceps": 100, "medial-head-triceps": 85, "long-head-triceps": 40},
  "Overhead Tricep Ext": {"long-head-triceps": 100, "medial-head-triceps": 60},
  "Close-Grip Bench": {"medial-head-triceps": 100, "lateral-head-triceps": 90, "long-head-triceps": 70, "mid-lower-pectoralis": 45},
  "Wrist Curls": {"wrist-flexors": 100},
  "Reverse Wrist Curls": {"wrist-extensors": 100},
  "Chin-ups": {"short-head-bicep": 100, "long-head-bicep": 90, "lats": 70, "lower-trapezius": 40},
  "Diamond Push-ups": {"medial-head-triceps": 100, "lateral-head-triceps": 85, "long-head-triceps": 70, "mid-lower-pectoralis": 40},
  "Plank": {"upper-abdominals": 100, "lower-abdominals": 80, "obliques": 65},
  "Crunch": {"upper-abdominals": 100, "lower-abdominals": 50},
  "Hanging Leg Raises": {"lower-abdominals": 100, "upper-abdominals": 70, "obliques": 40},
  "Ab Wheel Rollout": {"upper-abdominals": 100, "lower-abdominals": 90, "obliques": 50},
  "Cable Crunch": {"upper-abdominals": 100, "lower-abdominals": 75},
  "Russian Twists": {"obliques": 100, "upper-abdominals": 55},
  "Side Plank": {"obliques": 100, "upper-abdominals": 40},
  "Dragon Flag": {"upper-abdominals": 100, "lower-abdominals": 95, "obliques": 70},
  "L-Sit": {"lower-abdominals": 100, "upper-abdominals": 80},
  "Bicycle Crunch": {"obliques": 100, "upper-abdominals": 80, "lower-abdominals": 60},
  "Hip Thrust": {"gluteus-maximus": 100, "gluteus-medius": 55, "lateral-hamstrings": 40},
  "Glute Bridge": {"gluteus-maximus": 100, "gluteus-medius": 50},
  "Cable Kickbacks": {"gluteus-maximus": 100, "lateral-hamstrings": 30},
  "Bulgarian Split Squat": {"gluteus-maximus": 100, "outer-quadricep": 85, "rectus-femoris": 75, "lateral-hamstrings": 40},
  "Sumo Deadlift": {"gluteus-maximus": 100, "gluteus-medius": 70, "inner-thigh": 75, "lowerback": 55, "medial-hamstrings": 60},
  "Abductor Machine": {"gluteus-medius": 100, "inner-thigh": 60},
  "Donkey Kicks": {"gluteus-maximus": 100, "lateral-hamstrings": 30},
  "Fire Hydrants": {"gluteus-medius": 100, "gluteus-maximus": 40},
};

// SVG muscle ID → parent stat group (for XP routing)
const SVG_TO_STAT = {
  "upper-pectoralis":"chest","mid-lower-pectoralis":"chest",
  "lats":"back","lowerback":"back","upper-trapezius":"back","traps-middle":"back","lower-trapezius":"back",
  "anterior-deltoid":"shoulders","lateral-deltoid":"shoulders","posterior-deltoid":"shoulders",
  "short-head-bicep":"bicep","long-head-bicep":"bicep",
  "medial-head-triceps":"tricep","long-head-triceps":"tricep","lateral-head-triceps":"tricep","later-head-triceps":"tricep",
  "wrist-flexors":"forearms","wrist-extensors":"forearms",
  "upper-abdominals":"core","lower-abdominals":"core","obliques":"core",
  "gluteus-maximus":"glutes","gluteus-medius":"glutes",
  "outer-quadricep":"legs","rectus-femoris":"legs","inner-quadricep":"legs","inner-thigh":"legs",
  "lateral-hamstrings":"legs","medial-hamstrings":"legs","gastrocnemius":"calves","soleus":"calves","tibialis":"calves",
};

const EXERCISE_DB = {
  // svgTargets use exact SVG IDs from the anatomy figures
  // EMG activation ratios sourced from Schoenfeld (2010), ACE muscle activation studies,
  // Bret Contreras EMG research, and NSCA Exercise Technique Manual

  chest: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Bench Press", angle: "Flat (0°)",                  diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Incline Bench Press", angle: "30–45°",          diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Decline Bench Press", angle: "15–30°",          diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","anterior-deltoid"] },
    { name: "Close-Grip Bench Press",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","medial-head-triceps","lateral-head-triceps","long-head-triceps","anterior-deltoid"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Bench Press", angle: "Flat (0°)",         diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Incline Dumbbell Press", angle: "30–45°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Decline Dumbbell Press", angle: "15–30°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps"] },
    { name: "Dumbbell Flyes", angle: "Flat (0°)",               diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Incline Dumbbell Flyes", angle: "30–45°",       diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid"] },
    { name: "Decline Dumbbell Flyes", angle: "15–30°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis"] },
    { name: "Dumbbell Pullover",            diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lats","long-head-triceps"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Pec Deck Machine",             diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
    { name: "Chest Press Machine",          diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Incline Chest Press Machine", angle: "30–45°",  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Decline Chest Press Machine", angle: "15–30°",  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps"] },
    { name: "Cable Crossover",              diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Low Cable Fly", angle: "Cable set at bottom",                diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid"] },
    { name: "High Cable Fly", angle: "Cable set at top",               diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","anterior-deltoid"] },
    { name: "Smith Machine Bench Press",    diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Converging Chest Press Machine", diff: "beginner",  type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Fly Machine",                  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Landmine Press",               diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Push-ups",                     diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Wide Push-ups",                diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Diamond Push-ups",             diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","mid-lower-pectoralis"] },
    { name: "Decline Push-ups",             diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Incline Push-ups",             diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Dips",                         diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","medial-head-triceps","anterior-deltoid"] },
    { name: "Archer Push-ups",              diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Clap Push-ups",                diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Ring Push-ups",                diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Svend Press",                  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
    { name: "Cable Fly",                    diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Hex Press",                    diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","medial-head-triceps"] },
    { name: "Floor Press", angle: "Flat on floor",                  diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","medial-head-triceps"] },
    { name: "Squeeze Press",                diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
    { name: "Single Arm Cable Fly",         diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Pseudo Planche Push-up",       diff: "elite",        type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","anterior-deltoid","medial-head-triceps"] },
    { name: "Resistance Band Fly",          diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
  ],

  back: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Deadlift",                     diff: "elite",        type: "strength",     primary: "back",      svgTargets: ["lats","lowerback","upper-trapezius","traps-middle","gluteus-maximus","outer-quadricep","medial-hamstrings"] },
    { name: "Barbell Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep","short-head-bicep"] },
    { name: "Pendlay Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Sumo Deadlift",                diff: "elite",        type: "strength",     primary: "back",      svgTargets: ["lats","lowerback","gluteus-maximus","gluteus-medius","inner-thigh","medial-hamstrings"] },
    { name: "Rack Pull",                    diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","lowerback","upper-trapezius","traps-middle","gluteus-maximus"] },
    { name: "Good Mornings",                diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lowerback","medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Row",                 diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Dumbbell Pullover",            diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","mid-lower-pectoralis","long-head-triceps"] },
    { name: "Chest Supported Row", angle: "30–45° prone",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Shrugs",                       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["upper-trapezius","traps-middle"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Lat Pulldown",                 diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","long-head-bicep","short-head-bicep"] },
    { name: "Wide-Grip Lat Pulldown",       diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid"] },
    { name: "Reverse-Grip Lat Pulldown",    diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","short-head-bicep","long-head-bicep"] },
    { name: "Seated Cable Row",             diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Wide-Grip Cable Row",          diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","posterior-deltoid","lats"] },
    { name: "T-Bar Row",                    diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","long-head-bicep"] },
    { name: "Machine Row",                  diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","lats","posterior-deltoid"] },
    { name: "Cable Straight-Arm Pulldown",  diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-triceps"] },
    { name: "Face Pulls",                   diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["posterior-deltoid","traps-middle","upper-trapezius"] },
    { name: "Back Extension Machine", angle: "45° or 90°",       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings"] },
    { name: "Back Extension (45°)", angle: "45°",         diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lowerback","gluteus-maximus","lateral-hamstrings"] },
    { name: "Smith Machine Shrug",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["upper-trapezius","traps-middle"] },
    { name: "Chest Supported Row Machine",  diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Iso-Lateral Row Machine",      diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","posterior-deltoid","long-head-bicep"] },
    { name: "Lever Pullover Machine",       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","mid-lower-pectoralis","long-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Pull-ups",                     diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","lower-trapezius","short-head-bicep","long-head-bicep","posterior-deltoid"] },
    { name: "Wide-Grip Pull-ups",           diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid"] },
    { name: "Chin-ups",                     diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","short-head-bicep","long-head-bicep","lower-trapezius"] },
    { name: "Neutral-Grip Pull-ups",        diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","long-head-bicep","short-head-bicep","lower-trapezius"] },
    { name: "Inverted Row",                 diff: "intermediate", type: "calisthenics", primary: "back",      svgTargets: ["traps-middle","lower-trapezius","lats","posterior-deltoid","short-head-bicep"] },
    { name: "Scapular Pull-ups",            diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lower-trapezius","lats"] },
    { name: "Superman",                     diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lowerback","gluteus-maximus","traps-middle"] },
    { name: "Meadows Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Kroc Row",                     diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","long-head-bicep"] },
    { name: "Seal Row", angle: "Flat bench, prone",                     diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","lats","posterior-deltoid"] },
    { name: "Cable Row (Single Arm)",       diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Banded Pull-apart",            diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Resistance Band Row",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","long-head-bicep"] },
    { name: "Straight Arm Cable Pulldown",  diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-triceps"] },
    { name: "Neutral Grip Lat Pulldown",    diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","long-head-bicep","short-head-bicep"] },
    { name: "Jefferson Curl",               diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lowerback","lateral-hamstrings","medial-hamstrings"] },
    { name: "Hyperextension",               diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings"] },
  ],

  shoulders: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Overhead Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps"] },
    { name: "Push Press",                   diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","outer-quadricep"] },
    { name: "Behind-the-Neck Press",        diff: "elite",        type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Upright Row",                  diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","anterior-deltoid","upper-trapezius","short-head-bicep"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Shoulder Press",      diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Arnold Press", angle: "90° upright",                 diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","posterior-deltoid","medial-head-triceps"] },
    { name: "Lateral Raises",               diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Front Raises",                 diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid"] },
    { name: "Bent-Over Rear Delt Raise",    diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Scaption",                     diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Machine Shoulder Press", angle: "90° upright",       diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps"] },
    { name: "Cable Lateral Raise",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Cable Front Raise",            diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid"] },
    { name: "Cable Rear Delt Fly",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle"] },
    { name: "Pec Deck Reverse Fly",         diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Machine Lateral Raise",        diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Deltoid Fly",                  diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","upper-trapezius"] },
    { name: "Machine Rear Delt Fly",        diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Machine Front Raise",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid"] },
    { name: "Smith Machine OHP",            diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Landmine Lateral Raise",       diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Landmine Press (Single)",      diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","upper-pectoralis","lateral-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Pike Push-ups",                diff: "intermediate", type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps"] },
    { name: "Handstand Push-ups",           diff: "elite",        type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps"] },
    { name: "Wall Handstand Push-ups",      diff: "advanced",     type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Shoulder Tap Push-ups",        diff: "intermediate", type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-abdominals","obliques"] },
    // Additional shoulder exercises
    { name: "Military Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps"] },
    { name: "Seated Dumbbell Press", angle: "90° upright",        diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Z Press", angle: "Seated on floor, 90°",                      diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","upper-abdominals","medial-head-triceps"] },
    { name: "Bradford Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Barbell Upright Row",          diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","anterior-deltoid","upper-trapezius","short-head-bicep"] },
    { name: "Cable Upright Row",            diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","short-head-bicep"] },
    { name: "Dumbbell Y Raise",             diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","lower-trapezius"] },
    { name: "Dumbbell W Raise",             diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Cable Y Raise",                diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","lower-trapezius"] },
    { name: "Seated Cable Rear Delt Row",   diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Dumbbell 6-Ways",              diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","posterior-deltoid"] },
  ],

  legs: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Barbell Back Squat",           diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","gluteus-medius","medial-hamstrings","lowerback"] },
    { name: "Front Squat",                  diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","upper-abdominals"] },
    { name: "Romanian Deadlift",            diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["lateral-hamstrings","medial-hamstrings","gluteus-maximus","lowerback"] },
    { name: "Stiff-Leg Deadlift",           diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["lateral-hamstrings","medial-hamstrings","gluteus-maximus","lowerback"] },
    { name: "Barbell Lunge",                diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings","gluteus-medius"] },
    { name: "Barbell Step-ups",             diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Barbell Hip Thrust",           diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings","medial-hamstrings"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Squat",               diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Goblet Squat",                 diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","upper-abdominals"] },
    { name: "Dumbbell Romanian Deadlift",   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["lateral-hamstrings","medial-hamstrings","gluteus-maximus","lowerback"] },
    { name: "Walking Lunges",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings","gluteus-medius"] },
    { name: "Reverse Lunges",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Bulgarian Split Squat",        diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings","gluteus-medius"] },
    { name: "Sumo Squat",                   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["inner-quadricep","inner-thigh","gluteus-maximus","gluteus-medius"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Leg Press", angle: "45°",                    diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","medial-hamstrings"] },
    { name: "Hack Squat", angle: "45°",                   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Leg Extension",                diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Seated Leg Curl",              diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings"] },
    { name: "Lying Leg Curl",               diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings"] },
    { name: "Standing Leg Curl",            diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    { name: "Smith Machine Squat",          diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Smith Machine Lunge",          diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Adductor Machine",             diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep"] },
    { name: "Abductor Machine",             diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gluteus-medius","inner-thigh"] },
    { name: "Pendulum Squat",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Horizontal Leg Press",         diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","medial-hamstrings"] },
    { name: "V-Squat Machine",              diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Seated Calf Raise Machine",    diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gastrocnemius"] },
    { name: "Standing Calf Raise Machine",  diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gastrocnemius"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Bodyweight Squat",             diff: "beginner",     type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Jump Squats",                  diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","gastrocnemius"] },
    { name: "Pistol Squat",                 diff: "elite",        type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep","gluteus-maximus"] },
    { name: "Nordic Curl",                  diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    { name: "Wall Sit",                     diff: "beginner",     type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Step-ups",                     diff: "beginner",     type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Box Jumps",                    diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","gastrocnemius"] },
    { name: "Broad Jumps",                  diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","gastrocnemius","lateral-hamstrings"] },
    { name: "Single-Leg Hip Thrust",        diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings"] },
    { name: "Landmine Squat",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus"] },
    { name: "Sissy Squat",                  diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Spanish Squat",                diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Lateral Lunge",                diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep","gluteus-medius","outer-quadricep"] },
    { name: "Curtsy Lunge",                 diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["gluteus-medius","outer-quadricep","inner-thigh"] },
    { name: "Single Leg Press", angle: "45°",             diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus"] },
    { name: "Trap Bar Deadlift",            diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lowerback","medial-hamstrings"] },
    { name: "Glute Ham Raise",              diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus","gastrocnemius"] },
    { name: "Leg Press (High Foot)", angle: "45°",        diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","medial-hamstrings","outer-quadricep"] },
    { name: "Leg Press (Low Foot)", angle: "45°",         diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep"] },
    { name: "Resistance Band Squat",        diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus"] },
    { name: "Zercher Squat",                diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","upper-abdominals"] },
    { name: "Overhead Squat",               diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","anterior-deltoid","upper-abdominals"] },
    { name: "Cossack Squat",                diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep","gluteus-medius","outer-quadricep"] },
  ],

  glutes: [
    { name: "Hip Thrust",                   diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings","medial-hamstrings"] },
    { name: "Barbell Hip Thrust",           diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings","medial-hamstrings"] },
    { name: "Glute Bridge",                 diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","medial-hamstrings"] },
    { name: "Single-Leg Glute Bridge",      diff: "intermediate", type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings"] },
    { name: "Sumo Deadlift",                diff: "advanced",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","inner-thigh","lowerback","medial-hamstrings"] },
    { name: "Bulgarian Split Squat",        diff: "advanced",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","outer-quadricep","rectus-femoris","lateral-hamstrings"] },
    { name: "Cable Kickbacks",              diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","lateral-hamstrings"] },
    { name: "Cable Pull-Through",           diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lowerback"] },
    { name: "Abductor Machine",             diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-medius","inner-thigh"] },
    { name: "Lateral Band Walk",            diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Donkey Kicks",                 diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","lateral-hamstrings"] },
    { name: "Fire Hydrants",                diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Glute Kickback Machine",       diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus"] },
    { name: "Smith Machine Hip Thrust",     diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings"] },
    { name: "Banded Hip Thrust",            diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius"] },
    { name: "Frog Pump",                    diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","inner-thigh"] },
    { name: "45° Back Extension (Glute)", angle: "45°",   diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lowerback"] },
    { name: "Reverse Hyperextension", angle: "Flat or slight decline",       diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","lateral-hamstrings","lowerback"] },
    { name: "Clamshell",                    diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","inner-thigh"] },
    { name: "Standing Cable Abduction",     diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
  ],

  bicep: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Barbell Curl",                 diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","wrist-flexors"] },
    { name: "Wide-Grip Barbell Curl",       diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Reverse Barbell Curl",         diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-extensors"] },
    { name: "21s",                          diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Curl",                diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","wrist-flexors"] },
    { name: "Alternating Dumbbell Curl",    diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","wrist-flexors"] },
    { name: "Hammer Curl",                  diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-flexors","wrist-extensors"] },
    { name: "Concentration Curl", angle: "Seated, 90°",           diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Incline Dumbbell Curl", angle: "45–60°",        diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep"] },
    { name: "Spider Curl", angle: "45° prone on incline",                  diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Zottman Curl",                 diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep","wrist-extensors","wrist-flexors"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Preacher Curl",                diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Machine Preacher Curl",        diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Cable Curl",                   diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "High Cable Curl",              diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep"] },
    { name: "Cable Hammer Curl",            diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-flexors"] },
    { name: "Bicep Curl Machine",           diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Low Cable Curl",               diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Chin-ups",                     diff: "advanced",     type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","lats","lower-trapezius"] },
    { name: "Inverted Row (Supinated)",     diff: "intermediate", type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","lats","traps-middle"] },
    { name: "Bayesian Curl", angle: "Cable behind body",                diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep"] },
    { name: "Cross Body Hammer Curl",       diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-flexors"] },
    { name: "Waiter Curl",                  diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Drag Curl",                    diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep"] },
    { name: "Resistance Band Curl",         diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "TRX Curl",                     diff: "intermediate", type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","lats"] },
  ],

  tricep: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Close-Grip Bench Press",       diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","mid-lower-pectoralis","anterior-deltoid"] },
    { name: "Skull Crushers", angle: "Flat (0°)",               diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Skull Crushers", angle: "Flat (0°)",      diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Overhead Tricep Extension", angle: "Seated, 90°",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Tricep Kickback",              diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Tate Press",                   diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Tricep Rope Pushdown",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Tricep Bar Pushdown",          diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Reverse Tricep Pushdown",      diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps"] },
    { name: "Overhead Cable Tricep Ext",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Tricep Machine Press",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Assisted Dip Machine",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid"] },
    { name: "Cable Overhead Tricep Ext",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Tricep Dips",                  diff: "intermediate", type: "calisthenics", primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid"] },
    { name: "Bench Dips",                   diff: "beginner",     type: "calisthenics", primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Diamond Push-ups",             diff: "intermediate", type: "calisthenics", primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","mid-lower-pectoralis"] },
    { name: "Pike Push-up Hold",            diff: "intermediate", type: "calisthenics", primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","anterior-deltoid"] },
    { name: "JM Press",                     diff: "advanced",     type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps"] },
    { name: "California Press", angle: "Flat (0°)",             diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    { name: "Rolling Tricep Extension",     diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Single Arm Pushdown",          diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Resistance Band Pushdown",     diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Ring Dips",                    diff: "elite",        type: "calisthenics", primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid","mid-lower-pectoralis"] },
  ],

  forearms: [
    { name: "Wrist Curls",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors"] },
    { name: "Reverse Wrist Curls",          diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors"] },
    { name: "Farmer's Walk",                diff: "intermediate", type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors"] },
    { name: "Plate Pinch",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors"] },
    { name: "Dead Hang",                    diff: "beginner",     type: "calisthenics", primary: "forearms",  svgTargets: ["wrist-flexors","long-head-bicep","lats"] },
    { name: "Towel Pull-ups",               diff: "advanced",     type: "calisthenics", primary: "forearms",  svgTargets: ["wrist-flexors","long-head-bicep","lats"] },
    { name: "Hammer Curl",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["long-head-bicep","wrist-flexors","wrist-extensors"] },
    { name: "Reverse Curl",                 diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors","long-head-bicep"] },
    { name: "Cable Wrist Curl",             diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors"] },
    { name: "Cable Reverse Wrist Curl",     diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors"] },
    { name: "Rice Bucket",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors"] },
  ],

  core: [
    // ── ABS ──────────────────────────────────────────────────────────────────
    { name: "Crunch",                       diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals"] },
    { name: "Cable Crunch",                 diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Machine Crunch",               diff: "beginner",     type: "strength",     primary: "core",      svgTargets: ["upper-abdominals"] },
    { name: "Decline Sit-up", angle: "15–30°",               diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Weighted Sit-up",              diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Hanging Knee Raise",           diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals"] },
    { name: "Hanging Leg Raises",           diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","obliques"] },
    { name: "Lying Leg Raise",              diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals"] },
    { name: "Reverse Crunch",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals"] },
    { name: "Ab Wheel Rollout",             diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lats","long-head-triceps"] },
    { name: "V-ups",                        diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Toes to Bar",                  diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","lats"] },
    { name: "Dragon Flag",                  diff: "elite",        type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lats"] },
    { name: "L-Sit",                        diff: "elite",        type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","outer-quadricep"] },
    // ── OBLIQUES ─────────────────────────────────────────────────────────────
    { name: "Russian Twists",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Weighted Russian Twists",      diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Side Plank",                   diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Side Plank with Rotation",     diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    { name: "Woodchop",                     diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Pallof Press",                 diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    { name: "Bicycle Crunch",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    // ── PLANK VARIATIONS ─────────────────────────────────────────────────────
    { name: "Plank",                        diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lowerback"] },
    { name: "Long-Lever Plank",             diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Weighted Plank",               diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lowerback"] },
    { name: "Plank Reach",                  diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Dead Bug",                     diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","lowerback"] },
    { name: "Bird Dog",                     diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lowerback","gluteus-maximus"] },
    { name: "Ab Wheel (Kneeling)",          diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lats","long-head-triceps"] },
    { name: "Cable Woodchop (High)",        diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Cable Woodchop (Low)",         diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","lower-abdominals"] },
    { name: "Landmine Rotation",            diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Copenhagen Plank",             diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["inner-thigh","obliques","upper-abdominals"] },
    { name: "Stir the Pot",                 diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Cable Crunch (Kneeling)",      diff: "beginner",     type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Weighted Decline Crunch", angle: "15–30°",      diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Hollow Body Hold",             diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lats"] },
    { name: "Hollow Body Rock",             diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "GHD Sit-up", angle: "GHD at 0° (parallel)",                   diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","rectus-femoris"] },
    { name: "Suitcase Carry",               diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","wrist-flexors"] },
  ],

  calves: [
    { name: "Standing Calf Raises",         diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Seated Calf Raises",           diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["soleus"] },
    { name: "Leg Press Calf Raise",         diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Donkey Calf Raises",           diff: "intermediate", type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius"] },
    { name: "Single-Leg Calf Raise",        diff: "intermediate", type: "calisthenics", primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Calf Raise Machine",           diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Smith Machine Calf Raise",     diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Tibialis Raise",               diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["tibialis"] },
    { name: "Calf Press on Leg Press",      diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Jump Rope",                    diff: "intermediate", type: "cardio",       primary: "calves",    cardioMode: "timed", met: 11.0, svgTargets: ["gastrocnemius","soleus"] },
    { name: "Plyometric Calf Jumps",        diff: "intermediate", type: "calisthenics", primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
  ],

  cardio: [
    { name: "Walking",                      diff: "beginner",     type: "cardio",       cardioMode: "speed",  defaultSpeed: 3.0 },
    { name: "Incline Walking",              diff: "intermediate", type: "cardio",       cardioMode: "speed",  defaultSpeed: 3.5 },
    { name: "Running",                      diff: "intermediate", type: "cardio",       cardioMode: "speed",  defaultSpeed: 6.0 },
    { name: "Treadmill",                    diff: "beginner",     type: "cardio",       cardioMode: "speed",  defaultSpeed: 3.5 },
    { name: "Stairmaster",                  diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 9.0 },
    { name: "Elliptical",                   diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 5.0 },
    { name: "Cycling",                      diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 7.5 },
    { name: "Stationary Bike",              diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 6.0 },
    { name: "Rowing Machine",               diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 8.5 },
    { name: "Jump Rope",                    diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 11.0 },
    { name: "Swimming",                     diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Battle Ropes",                 diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 10.0 },
    { name: "HIIT / Sprints",               diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 12.0 },
    { name: "Assault Bike",                 diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 12.5 },
    { name: "SkiErg",                       diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 9.5 },
    { name: "Sled Push",                    diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 10.5 },
    { name: "Sled Pull",                    diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 10.0 },
    { name: "Jacob's Ladder",               diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 11.5 },
    { name: "Versaclimber",                 diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 11.0 },
    { name: "Spin Class",                   diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.5 },
    { name: "Hiking",                       diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 6.5 },
    { name: "Burpees",                      diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Mountain Climbers",            diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Jumping Jacks",                diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 7.0 },
    { name: "High Knees",                   diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Stair Climbing",               diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Box Step-ups (Cardio)",        diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 6.0 },
    { name: "Sled Sprint",                  diff: "elite",        type: "cardio",       cardioMode: "timed",  met: 13.0 },
    { name: "Farmer's Walk (Cardio)",       diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 7.0 },
    { name: "Kettlebell Swing",             diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 9.0 },
    { name: "Tire Flip",                    diff: "elite",        type: "cardio",       cardioMode: "timed",  met: 10.0 },
    { name: "Shadow Boxing",                diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 7.5 },
    { name: "Dance / Zumba",               diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 6.5 },
    { name: "Rock Climbing",                diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 8.5 },
  ],

  calisthenics: [
    { name: "Muscle-up",                    diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["lats","short-head-bicep","long-head-bicep","medial-head-triceps","lateral-head-triceps","upper-pectoralis","anterior-deltoid"] },
    { name: "Handstand",                    diff: "elite",        type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","upper-abdominals","obliques"] },
    { name: "Front Lever",                  diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["lats","lower-trapezius","upper-abdominals","lower-abdominals","long-head-bicep"] },
    { name: "Back Lever",                   diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["lats","mid-lower-pectoralis","long-head-triceps","posterior-deltoid"] },
    { name: "Planche",                      diff: "elite",        type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","medial-head-triceps","upper-abdominals"] },
    { name: "Human Flag",                   diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["lats","obliques","upper-abdominals","lateral-deltoid","short-head-bicep"] },
    { name: "Burpees",                      diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","outer-quadricep","gluteus-maximus","anterior-deltoid","mid-lower-pectoralis"] },
  ],
};


// ─── PROGRAM SCHEDULE BUILDER ─────────────────────────────────────────────────
// Each day has: label, rest flag, and exercises [{muscle, name, diff, type, sets, repsLabel}]
const MALE_PROGRAMS = [
  {
    id: "arnold", name: "Arnold Split", icon: "AS", color: "#FFD700",
    athlete: "Arnold Schwarzenegger", era: "7x Mr. Olympia",
    desc: "6-day push/pull split for maximum volume and mass.",
    days: [
      { label: "Chest & Back", rest: false, exercises: [
        { muscle:"chest", name:"Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"8-10 reps" },
        { muscle:"chest", name:"Incline Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"8-10 reps" },
        { muscle:"chest", name:"Dumbbell Flyes", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"back", name:"Barbell Row", diff:"advanced", type:"strength", sets:4, repsLabel:"8-10 reps" },
        { muscle:"back", name:"Pull-ups", diff:"advanced", type:"calisthenics", sets:4, repsLabel:"failure" },
        { muscle:"back", name:"Seated Cable Row", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Shoulders & Arms", rest: false, exercises: [
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:4, repsLabel:"8-10 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"bicep", name:"Barbell Curl", diff:"beginner", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"tricep", name:"Skull Crushers", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"bicep", name:"Hammer Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"tricep", name:"Tricep Pushdown", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Legs", rest: false, exercises: [
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:5, repsLabel:"6-8 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"legs", name:"Romanian Deadlift", diff:"advanced", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"calves", name:"Calf Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"20 reps" },
      ]},
      { label: "Chest & Back", rest: false, exercises: [
        { muscle:"chest", name:"Incline Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"8-10 reps" },
        { muscle:"chest", name:"Cable Crossover", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"chest", name:"Pec Deck Machine", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"back", name:"Deadlift", diff:"elite", type:"strength", sets:4, repsLabel:"5 reps" },
        { muscle:"back", name:"T-Bar Row", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Shoulders & Arms", rest: false, exercises: [
        { muscle:"shoulders", name:"Arnold Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"shoulders", name:"Rear Delt Flyes", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"bicep", name:"Preacher Curl", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"tricep", name:"Close-Grip Bench", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"bicep", name:"Chin-ups", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"failure" },
      ]},
      { label: "Legs", rest: false, exercises: [
        { muscle:"legs", name:"Hack Squat", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"legs", name:"Walking Lunges", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 each" },
        { muscle:"legs", name:"Leg Extension", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"calves", name:"Calf Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"20 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "cbum", name: "CBum Routine", icon: "CQ", color: "#4a9eff",
    athlete: "Chris Bumstead", era: "5x Classic Olympia",
    desc: "High frequency PPL with aesthetic focus.",
    days: [
      { label: "Back", rest: false, exercises: [
        { muscle:"back", name:"Deadlift", diff:"elite", type:"strength", sets:4, repsLabel:"5 reps" },
        { muscle:"back", name:"Barbell Row", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"back", name:"Seated Cable Row", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"back", name:"Face Pulls", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
      ]},
      { label: "Chest & Shoulders", rest: false, exercises: [
        { muscle:"chest", name:"Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"8-10 reps" },
        { muscle:"chest", name:"Incline Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"chest", name:"Cable Crossover", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
      ]},
      { label: "Legs", rest: false, exercises: [
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:5, repsLabel:"6-8 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"legs", name:"Romanian Deadlift", diff:"advanced", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Back (Volume)", rest: false, exercises: [
        { muscle:"back", name:"Pull-ups", diff:"advanced", type:"calisthenics", sets:4, repsLabel:"failure" },
        { muscle:"back", name:"T-Bar Row", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"back", name:"Dumbbell Row", diff:"beginner", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"bicep", name:"Hammer Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Chest & Shoulders (Volume)", rest: false, exercises: [
        { muscle:"chest", name:"Dumbbell Flyes", diff:"beginner", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"shoulders", name:"Arnold Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"shoulders", name:"Rear Delt Flyes", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"tricep", name:"Tricep Pushdown", diff:"beginner", type:"strength", sets:4, repsLabel:"12 reps" },
      ]},
      { label: "Legs (Volume)", rest: false, exercises: [
        { muscle:"legs", name:"Hack Squat", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"legs", name:"Walking Lunges", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 each" },
        { muscle:"legs", name:"Leg Extension", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"calves", name:"Calf Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"20 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "ronnie", name: "Ronnie Coleman", icon: "RC", color: "#e05555",
    athlete: "Ronnie Coleman", era: "8x Mr. Olympia",
    desc: "Brutally heavy 5-day split. Lightweight baby!",
    days: [
      { label: "Chest", rest: false, exercises: [
        { muscle:"chest", name:"Bench Press", diff:"intermediate", type:"strength", sets:5, repsLabel:"5 reps" },
        { muscle:"chest", name:"Incline Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"chest", name:"Decline Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"chest", name:"Dips", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"failure" },
      ]},
      { label: "Back", rest: false, exercises: [
        { muscle:"back", name:"Deadlift", diff:"elite", type:"strength", sets:5, repsLabel:"5 reps" },
        { muscle:"back", name:"Barbell Row", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"back", name:"T-Bar Row", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"back", name:"Pull-ups", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"failure" },
      ]},
      { label: "Shoulders & Arms", rest: false, exercises: [
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:5, repsLabel:"5 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"bicep", name:"Barbell Curl", diff:"beginner", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"tricep", name:"Skull Crushers", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
      ]},
      { label: "Legs", rest: false, exercises: [
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:5, repsLabel:"5 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"legs", name:"Romanian Deadlift", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Full Body", rest: false, exercises: [
        { muscle:"chest", name:"Bench Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"8 reps" },
        { muscle:"back", name:"Barbell Row", diff:"advanced", type:"strength", sets:3, repsLabel:"8 reps" },
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:3, repsLabel:"8 reps" },
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:3, repsLabel:"8 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "ppl", name: "Push Pull Legs", icon: "PP", color: "#8b5cf6",
    athlete: "Classic Program", era: "Universal Standard",
    desc: "The gold standard 6-day PPL for intermediate lifters.",
    days: [
      { label: "Push", rest: false, exercises: [
        { muscle:"chest", name:"Bench Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"8-10 reps" },
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"chest", name:"Incline Bench Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"tricep", name:"Tricep Pushdown", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"tricep", name:"Skull Crushers", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
      ]},
      { label: "Pull", rest: false, exercises: [
        { muscle:"back", name:"Deadlift", diff:"elite", type:"strength", sets:4, repsLabel:"5 reps" },
        { muscle:"back", name:"Barbell Row", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"back", name:"Pull-ups", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"failure" },
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"bicep", name:"Barbell Curl", diff:"beginner", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"bicep", name:"Hammer Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Legs", rest: false, exercises: [
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:5, repsLabel:"5 reps" },
        { muscle:"legs", name:"Romanian Deadlift", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"legs", name:"Leg Extension", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"calves", name:"Calf Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"20 reps" },
      ]},
      { label: "Push (Volume)", rest: false, exercises: [
        { muscle:"chest", name:"Dumbbell Flyes", diff:"beginner", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"chest", name:"Cable Crossover", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"shoulders", name:"Arnold Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"tricep", name:"Diamond Push-ups", diff:"intermediate", type:"calisthenics", sets:3, repsLabel:"failure" },
      ]},
      { label: "Pull (Volume)", rest: false, exercises: [
        { muscle:"back", name:"Seated Cable Row", diff:"intermediate", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"back", name:"Face Pulls", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"back", name:"Dumbbell Row", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"bicep", name:"Preacher Curl", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
      ]},
      { label: "Legs (Volume)", rest: false, exercises: [
        { muscle:"legs", name:"Hack Squat", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"legs", name:"Walking Lunges", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 each" },
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"calves", name:"Calf Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"20 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "531", name: "5/3/1 Method", icon: "53", color: "#4ecb71",
    athlete: "Jim Wendler", era: "Powerlifting Legend",
    desc: "Strength-focused 4-day linear progression.",
    days: [
      { label: "Squat Day", rest: false, exercises: [
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:3, repsLabel:"5/3/1 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:5, repsLabel:"10 reps" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:5, repsLabel:"10 reps" },
        { muscle:"core", name:"Plank", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"60 sec" },
      ]},
      { label: "Bench Day", rest: false, exercises: [
        { muscle:"chest", name:"Bench Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"5/3/1 reps" },
        { muscle:"chest", name:"Dumbbell Flyes", diff:"beginner", type:"strength", sets:5, repsLabel:"10 reps" },
        { muscle:"tricep", name:"Tricep Pushdown", diff:"beginner", type:"strength", sets:5, repsLabel:"10 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
      ]},
      { label: "Deadlift Day", rest: false, exercises: [
        { muscle:"back", name:"Deadlift", diff:"elite", type:"strength", sets:3, repsLabel:"5/3/1 reps" },
        { muscle:"back", name:"Barbell Row", diff:"advanced", type:"strength", sets:5, repsLabel:"10 reps" },
        { muscle:"back", name:"Pull-ups", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"failure" },
        { muscle:"core", name:"Hanging Leg Raises", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"10 reps" },
      ]},
      { label: "OHP Day", rest: false, exercises: [
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:3, repsLabel:"5/3/1 reps" },
        { muscle:"shoulders", name:"Arnold Press", diff:"intermediate", type:"strength", sets:5, repsLabel:"10 reps" },
        { muscle:"bicep", name:"Barbell Curl", diff:"beginner", type:"strength", sets:5, repsLabel:"10 reps" },
        { muscle:"back", name:"Face Pulls", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
];

const FEMALE_PROGRAMS = [
  {
    id: "glute_focus", name: "Glute Goddess", icon: "GG", color: "#ff6b9d",
    athlete: "Bret Contreras", era: "The Glute Guy",
    desc: "3-day lower-body dominant program for glute development.",
    days: [
      { label: "Lower Power", rest: false, exercises: [
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:5, repsLabel:"5 reps" },
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:4, repsLabel:"6 reps" },
        { muscle:"legs", name:"Romanian Deadlift", diff:"advanced", type:"strength", sets:3, repsLabel:"8 reps" },
        { muscle:"glutes", name:"Bulgarian Split Squat", diff:"advanced", type:"strength", sets:3, repsLabel:"8 each" },
      ]},
      { label: "Upper Hypertrophy", rest: false, exercises: [
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"back", name:"Seated Cable Row", diff:"intermediate", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"bicep", name:"Hammer Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Lower Hypertrophy", rest: false, exercises: [
        { muscle:"glutes", name:"Glute Bridge", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Cable Kickbacks", diff:"beginner", type:"strength", sets:3, repsLabel:"15 each" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Donkey Kicks", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"20 each" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Full Body", rest: false, exercises: [
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"legs", name:"Walking Lunges", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 each" },
        { muscle:"shoulders", name:"Arnold Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"core", name:"Plank", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"45 sec" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "hourglass", name: "Hourglass Build", icon: "HB", color: "#c9a84c",
    athlete: "Stephanie Buttermore", era: "PhD Physique",
    desc: "4-day program to build shoulder-to-waist ratio.",
    days: [
      { label: "Shoulders & Arms", rest: false, exercises: [
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:5, repsLabel:"15 reps" },
        { muscle:"shoulders", name:"Arnold Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"bicep", name:"Barbell Curl", diff:"beginner", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"tricep", name:"Skull Crushers", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Lower Body", rest: false, exercises: [
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"legs", name:"Romanian Deadlift", diff:"advanced", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Cable Kickbacks", diff:"beginner", type:"strength", sets:3, repsLabel:"15 each" },
      ]},
      { label: "Back & Core", rest: false, exercises: [
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"back", name:"Seated Cable Row", diff:"intermediate", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"back", name:"Face Pulls", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"core", name:"Hanging Leg Raises", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"10 reps" },
        { muscle:"core", name:"Russian Twists", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"20 reps" },
      ]},
      { label: "Glutes & Legs", rest: false, exercises: [
        { muscle:"glutes", name:"Bulgarian Split Squat", diff:"advanced", type:"strength", sets:4, repsLabel:"10 each" },
        { muscle:"glutes", name:"Sumo Deadlift", diff:"advanced", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"legs", name:"Leg Extension", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Donkey Kicks", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"20 each" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "strong_curves", name: "Strong Curves", icon: "SC", color: "#8b5cf6",
    athlete: "Bret Contreras", era: "Evidence Based",
    desc: "12-week booty-building program with full body strength.",
    days: [
      { label: "Glutes A", rest: false, exercises: [
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:3, repsLabel:"8 reps" },
        { muscle:"glutes", name:"Cable Kickbacks", diff:"beginner", type:"strength", sets:3, repsLabel:"15 each" },
        { muscle:"legs", name:"Walking Lunges", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 each" },
        { muscle:"core", name:"Plank", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"45 sec" },
      ]},
      { label: "Total Body A", rest: false, exercises: [
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"chest", name:"Dumbbell Flyes", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"shoulders", name:"Lateral Raises", diff:"beginner", type:"strength", sets:3, repsLabel:"15 reps" },
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"bicep", name:"Hammer Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Glutes B", rest: false, exercises: [
        { muscle:"glutes", name:"Glute Bridge", diff:"beginner", type:"strength", sets:5, repsLabel:"15 reps" },
        { muscle:"glutes", name:"Bulgarian Split Squat", diff:"advanced", type:"strength", sets:3, repsLabel:"10 each" },
        { muscle:"glutes", name:"Sumo Deadlift", diff:"advanced", type:"strength", sets:3, repsLabel:"8 reps" },
        { muscle:"glutes", name:"Donkey Kicks", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"20 each" },
        { muscle:"core", name:"Russian Twists", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"20 reps" },
      ]},
      { label: "Total Body B", rest: false, exercises: [
        { muscle:"back", name:"Seated Cable Row", diff:"intermediate", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"shoulders", name:"Arnold Press", diff:"intermediate", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"legs", name:"Leg Curl", diff:"beginner", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"chest", name:"Push-ups", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"failure" },
        { muscle:"tricep", name:"Tricep Pushdown", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "lean_muscle", name: "Lean Muscle", icon: "LM", color: "#4ecb71",
    athlete: "Katie Crewe", era: "Modern Fitness",
    desc: "3-day full body for lean, toned physique.",
    days: [
      { label: "Full Body A", rest: false, exercises: [
        { muscle:"legs", name:"Squat", diff:"elite", type:"strength", sets:4, repsLabel:"8 reps" },
        { muscle:"back", name:"Lat Pulldown", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"chest", name:"Dumbbell Flyes", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Hip Thrust", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"core", name:"Plank", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"45 sec" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Full Body B", rest: false, exercises: [
        { muscle:"legs", name:"Romanian Deadlift", diff:"advanced", type:"strength", sets:4, repsLabel:"10 reps" },
        { muscle:"shoulders", name:"Overhead Press", diff:"advanced", type:"strength", sets:3, repsLabel:"10 reps" },
        { muscle:"back", name:"Seated Cable Row", diff:"intermediate", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Bulgarian Split Squat", diff:"advanced", type:"strength", sets:3, repsLabel:"10 each" },
        { muscle:"bicep", name:"Hammer Curl", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Full Body C", rest: false, exercises: [
        { muscle:"legs", name:"Leg Press", diff:"intermediate", type:"strength", sets:4, repsLabel:"12 reps" },
        { muscle:"chest", name:"Push-ups", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"failure" },
        { muscle:"back", name:"Dumbbell Row", diff:"beginner", type:"strength", sets:3, repsLabel:"12 reps" },
        { muscle:"glutes", name:"Glute Bridge", diff:"beginner", type:"strength", sets:4, repsLabel:"15 reps" },
        { muscle:"core", name:"Russian Twists", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"20 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
  {
    id: "cali_girl", name: "Cali Queen", icon: "CB", color: "#4a9eff",
    athlete: "Emi Wong", era: "Bodyweight Pro",
    desc: "Calisthenics-based program for lean strength.",
    days: [
      { label: "Upper Body", rest: false, exercises: [
        { muscle:"chest", name:"Push-ups", diff:"beginner", type:"calisthenics", sets:4, repsLabel:"failure" },
        { muscle:"back", name:"Pull-ups", diff:"advanced", type:"calisthenics", sets:4, repsLabel:"failure" },
        { muscle:"tricep", name:"Diamond Push-ups", diff:"intermediate", type:"calisthenics", sets:3, repsLabel:"failure" },
        { muscle:"shoulders", name:"Pike Push-ups", diff:"intermediate", type:"calisthenics", sets:3, repsLabel:"10 reps" },
        { muscle:"bicep", name:"Chin-ups", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"failure" },
      ]},
      { label: "Lower Body", rest: false, exercises: [
        { muscle:"legs", name:"Pistol Squat", diff:"elite", type:"calisthenics", sets:4, repsLabel:"5 each" },
        { muscle:"glutes", name:"Donkey Kicks", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"20 each" },
        { muscle:"legs", name:"Walking Lunges", diff:"intermediate", type:"strength", sets:3, repsLabel:"15 each" },
        { muscle:"calves", name:"Calf Raises", diff:"beginner", type:"strength", sets:4, repsLabel:"25 reps" },
      ]},
      { label: "Core & Cardio", rest: false, exercises: [
        { muscle:"core", name:"Plank", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"60 sec" },
        { muscle:"core", name:"L-Sit", diff:"elite", type:"calisthenics", sets:3, repsLabel:"10 sec" },
        { muscle:"core", name:"Hanging Leg Raises", diff:"advanced", type:"calisthenics", sets:3, repsLabel:"10 reps" },
        { muscle:"cardio", name:"Burpees", diff:"intermediate", type:"calisthenics", sets:4, repsLabel:"15 reps" },
        { muscle:"cardio", name:"Jump Rope", diff:"intermediate", type:"cardio", sets:3, repsLabel:"3 min" },
      ]},
      { label: "Full Body", rest: false, exercises: [
        { muscle:"calisthenics", name:"Muscle-up", diff:"elite", type:"calisthenics", sets:3, repsLabel:"failure" },
        { muscle:"chest", name:"Push-ups", diff:"beginner", type:"calisthenics", sets:3, repsLabel:"failure" },
        { muscle:"core", name:"Dragon Flag", diff:"elite", type:"calisthenics", sets:3, repsLabel:"5 reps" },
        { muscle:"legs", name:"Box Jumps", diff:"intermediate", type:"calisthenics", sets:3, repsLabel:"10 reps" },
        { muscle:"calisthenics", name:"Burpees", diff:"intermediate", type:"calisthenics", sets:3, repsLabel:"15 reps" },
      ]},
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
      { label: "Rest", rest: true, exercises: [] },
    ],
  },
];

const FITNESS_GOALS = [
  { id: "bulk",         label: "Bulk",         glyph: "BLK", color: "#f59e0b", desc: "Build mass & strength" },
  { id: "cut",          label: "Cut",          glyph: "CUT", color: "#ef4444", desc: "Lose fat, stay lean" },
  { id: "maintain",     label: "Maintain",     glyph: "MNT", color: "#4a9eff", desc: "Stay balanced" },
  { id: "bodybuild",    label: "Bodybuilding", glyph: "BBD", color: "#c9a84c", desc: "Sculpt & define" },
  { id: "calisthenics", label: "Calisthenics", glyph: "CAL", color: "#8b5cf6", desc: "Bodyweight mastery" },
  { id: "powerlifting", label: "Powerlifting", glyph: "PWR", color: "#e05555", desc: "Max strength" },
  { id: "cardio",       label: "Cardio",       glyph: "CDO", color: "#4ecb71", desc: "Stamina & health" },
  { id: "toning",       label: "Toning",       glyph: "TNE", color: "#ec4899", desc: "Lean & defined" },
];

// ─── GOAL CONFIGURATION ──────────────────────────────────────────────────────
// Each goal affects: calorie target offset, randomizer exercise bias, home tip
const GOAL_CONFIG = {
  bulk:         { tdeeOffset:+300, tdeeLabel:"SURPLUS TARGET",      compoundBias:2.0, isoBias:0.7,  calistBias:0.5, cardioBias:0.3,
                  tip:"Aim for 0.5–1 lb/week weight gain. Add weight to your lifts every week.", focus:"Heavy compounds, progressive overload, high protein" },
  cut:          { tdeeOffset:-400, tdeeLabel:"DEFICIT TARGET",      compoundBias:1.5, isoBias:1.2,  calistBias:1.0, cardioBias:1.5,
                  tip:"Keep protein at 1g/lb bodyweight to preserve muscle while cutting.", focus:"Maintain strength, add cardio, stay in deficit" },
  maintain:     { tdeeOffset:0,    tdeeLabel:"MAINTENANCE",         compoundBias:1.2, isoBias:1.0,  calistBias:1.0, cardioBias:1.0,
                  tip:"Consistency beats intensity. Hit your workouts and hit your calories.", focus:"Balanced training, eat at maintenance" },
  bodybuild:    { tdeeOffset:+200, tdeeLabel:"LEAN SURPLUS",        compoundBias:1.2, isoBias:1.8,  calistBias:0.6, cardioBias:0.4,
                  tip:"Slow eccentrics (3-4 sec lowering) maximise time under tension.", focus:"Mind-muscle connection, isolation volume, full ROM" },
  powerlifting: { tdeeOffset:+250, tdeeLabel:"STRENGTH SURPLUS",    compoundBias:2.5, isoBias:0.3,  calistBias:0.4, cardioBias:0.2,
                  tip:"Train in the 1-5 rep range for maximal neural strength adaptations.", focus:"Squat, Bench, Deadlift — everything else is accessory" },
  calisthenics: { tdeeOffset:+100, tdeeLabel:"PERFORMANCE SURPLUS", compoundBias:1.0, isoBias:0.6,  calistBias:2.5, cardioBias:0.8,
                  tip:"Master the basics before advanced skills. Pull-ups, dips, push-ups first.", focus:"Bodyweight progressions, relative strength, skill work" },
  cardio:       { tdeeOffset:-200, tdeeLabel:"ACTIVE DEFICIT",      compoundBias:0.8, isoBias:0.6,  calistBias:0.8, cardioBias:2.5,
                  tip:"80% of cardio should be low-intensity — you should be able to hold a conversation.", focus:"Zone 2 base, HIIT 1-2x/week, maintain muscle" },
  toning:       { tdeeOffset:-200, tdeeLabel:"LIGHT DEFICIT",       compoundBias:1.3, isoBias:1.5,  calistBias:1.0, cardioBias:1.3,
                  tip:"'Toning' = muscle + fat loss together. Both require consistent resistance training.", focus:"Higher reps (12-20), moderate weight, cardio mix" },
};

// ─── MUSCLE META ──────────────────────────────────────────────────────────────
const MUSCLE_META = {
  // ── Primary groups (leveling + SVG coloring) ──
  chest:       { name: "Chest",        color: "#e05555", glyph: "CH" },
  back:        { name: "Back",         color: "#4a9eff", glyph: "BK" },
  legs:        { name: "Legs",         color: "#4ecb71", glyph: "LG" },
  shoulders:   { name: "Shoulders",    color: "#8b5cf6", glyph: "SH" },
  bicep:       { name: "Bicep",        color: "#f59e0b", glyph: "BI" },
  tricep:      { name: "Tricep",       color: "#e07b00", glyph: "TR" },
  forearms:    { name: "Forearms",     color: "#c46000", glyph: "FA" },
  core:        { name: "Core",         color: "#06b6d4", glyph: "CR" },
  glutes:      { name: "Glutes",       color: "#ec4899", glyph: "GL" },
  calves:      { name: "Calves",       color: "#10b981", glyph: "CV" },
  cardio:      { name: "Endurance",    color: "#ef4444", glyph: "EN" },
  calisthenics:{ name: "Agility",      color: "#f59e0b", glyph: "AG" },
  // ── Sub-muscles (match SVG IDs exactly — for exercise tagging) ──
  "upper-pectoralis":    { name: "Upper Chest",         color: "#e05555", parent: "chest"     },
  "mid-lower-pectoralis":{ name: "Mid/Lower Chest",     color: "#c03030", parent: "chest"     },
  "lats":                { name: "Lats",                color: "#4a9eff", parent: "back"      },
  "lowerback":           { name: "Lower Back",          color: "#2266cc", parent: "back"      },
  "upper-trapezius":     { name: "Upper Traps",         color: "#5577dd", parent: "back"      },
  "traps-middle":        { name: "Mid Traps",           color: "#4466cc", parent: "back"      },
  "lower-trapezius":     { name: "Lower Traps",         color: "#3355bb", parent: "back"      },
  "anterior-deltoid":    { name: "Front Delt",          color: "#9b6eff", parent: "shoulders" },
  "lateral-deltoid":     { name: "Side Delt",           color: "#8b5cf6", parent: "shoulders" },
  "posterior-deltoid":   { name: "Rear Delt",           color: "#7a4be0", parent: "shoulders" },
  "short-head-bicep":    { name: "Bicep Short Head",    color: "#f59e0b", parent: "bicep"    },
  "long-head-bicep":     { name: "Bicep Long Head",     color: "#e08800", parent: "bicep"    },
  "medial-head-triceps": { name: "Tricep Medial Head",  color: "#d97706", parent: "tricep"   },
  "long-head-triceps":   { name: "Tricep Long Head",    color: "#c96600", parent: "tricep"   },
  "lateral-head-triceps":{ name: "Tricep Lateral Head", color: "#b85500", parent: "tricep"   },
  "wrist-flexors":       { name: "Forearm Flexors",     color: "#a0522d", parent: "forearms" },
  "wrist-extensors":     { name: "Forearm Extensors",   color: "#8b4513", parent: "forearms" },
  "upper-abdominals":    { name: "Upper Abs",           color: "#06b6d4", parent: "core"      },
  "lower-abdominals":    { name: "Lower Abs",           color: "#0891b2", parent: "core"      },
  "obliques":            { name: "Obliques",            color: "#0e7490", parent: "core"      },
  "gluteus-maximus":     { name: "Glute Max",           color: "#ec4899", parent: "glutes"    },
  "gluteus-medius":      { name: "Glute Med",           color: "#db2777", parent: "glutes"    },
  "outer-quadricep":     { name: "Outer Quad",          color: "#4ecb71", parent: "legs"      },
  "rectus-femoris":      { name: "Rectus Femoris",      color: "#39b55c", parent: "legs"      },
  "inner-quadricep":     { name: "Inner Quad",          color: "#27a349", parent: "legs"      },
  "inner-thigh":         { name: "Inner Thigh",         color: "#1e9140", parent: "legs"      },
  "lateral-hamstrings":  { name: "Outer Hamstring",     color: "#158038", parent: "legs"      },
  "medial-hamstrings":   { name: "Inner Hamstring",     color: "#0d6e30", parent: "legs"      },
  "gastrocnemius":       { name: "Gastrocnemius",       color: "#059669", parent: "calves"    },
  "soleus":              { name: "Soleus",              color: "#047857", parent: "calves"    },
  "tibialis":            { name: "Tibialis",            color: "#065f46", parent: "calves"    },
};

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
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// MET (Metabolic Equivalent of Task) values by exercise type + difficulty
const MET_VALUES = {
  strength:     { beginner: 3.5, intermediate: 5.0, advanced: 6.0, elite: 8.0 },
  calisthenics: { beginner: 4.0, intermediate: 5.5, advanced: 7.0, elite: 9.0 },
  cardio:       { beginner: 5.0, intermediate: 7.0, advanced: 9.0, elite: 11.0 },
};

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
function calcSetXP(exercise, reps, setWeightLbs, bodyWeightLbs, storedE1RM) {
  const weightKg = bodyWeightLbs * 0.453592;
  const met = MET_VALUES.strength[exercise.diff] || 5.0;
  const durationHours = (reps * 3 + 90) / 3600; // 1 set
  const baseXP = met * weightKg * durationHours;

  // Calisthenics: no stored 1RM needed, use bodyweight
  if (exercise.type === "calisthenics") {
    const caliMet = MET_VALUES.calisthenics[exercise.diff] || 5.5;
    const caliDur = (reps * 4 + 90) / 3600;
    return Math.round(caliMet * weightKg * caliDur);
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

const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary",         sub: "Desk job, little/no exercise",      multiplier: 1.2  },
  { id: "light",     label: "Lightly Active",    sub: "Walking, 1-2 workouts/week",        multiplier: 1.35 },
  { id: "moderate",  label: "Moderately Active", sub: "Gym 3-4x/week, mostly sitting job", multiplier: 1.5  },
  { id: "active",    label: "Very Active",       sub: "Intense training 5-6x/week",        multiplier: 1.65 },
  { id: "extra",     label: "Athlete",           sub: "2x/day training or physical job",   multiplier: 1.8  },
];

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
    color: #fff;
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

// ─── SVG BODY FIGURE ──────────────────────────────────────────────────────────
const _MUSCLE_PATHS = {
  "maleFront": {
    "upper-trapezius": [
      {"type":"path","d":"M296.36,171.74v25.93c0,11.06-6.09,15.13-18.09,19.15-1.39-.55-19.58-7.61-39.54-7.09-.04-.02-.09-.02-.13,0h-.02c-2.34.05-4.72.23-7.07.52,2.04-.54,3.64-1.02,4.22-1.27.61-.27,1.96-1.34,3.88-2.84,3.29-2.57,7.79-6.09,11-7.58,2.04-.93,6.47-2.79,11.61-4.95,7.59-3.18,16.2-6.79,19.33-8.34,5.16-2.59,14.56-11.81,14.65-11.9.04-.04.05-.09.07-.14.04-.43.07-.91.11-1.48Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M444.91,210.23c-2.38-.3-4.77-.46-7.11-.52-19.99-.52-38.19,6.56-39.58,7.11-12-4.02-18.09-8.09-18.09-19.15v-25.86c.04.54.07,1,.11,1.41,0,.05.04.11.07.14.09.09,9.47,9.31,14.65,11.9,3.11,1.55,11.66,5.15,19.22,8.31,5.2,2.18,9.68,4.06,11.72,4.99,3.21,1.46,7.7,4.98,10.98,7.56,1.91,1.5,3.3,2.57,3.89,2.86.57.27,2.16.71,4.14,1.25Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "upper-pectoralis": [
      {"type":"path","d":"M491.08,295.44c-46.21-9.08-69.82-28.45-92.64-47.19-13.9-11.4-27.06-22.17-44.83-30.66,3.59-1.48,8.09-2.64,13.7-3.16,16.07-1.54,25.17,1.16,30.04,2.61.25.07.5.14.73.21.02,0,.05.02.07.02.05.02.09.04.14.05.23.07.48.16.73.23,2.77.93,11.63,4.07,18.88,8.68,10.95,6.97,15.4,12.85,22.13,21.78,3.05,4.04,6.52,8.63,11.25,14.21l.05.05c5.02,5.9,15.49,18.17,28.83,27.21,2.59,1.77,6.23,3.41,10.88,4.9.02.36.04.71.04,1.05Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M322.87,217.59c-17.77,8.51-30.92,19.28-44.81,30.66-22.81,18.74-46.44,38.11-92.63,47.19,0-.34.02-.7.04-1.05,4.63-1.48,8.27-3.13,10.86-4.9,13.34-9.04,23.81-21.32,28.83-27.21l.05-.05c4.73-5.58,8.2-10.17,11.25-14.21,6.72-8.93,11.16-14.81,22.13-21.78,7.25-4.61,16.11-7.75,18.88-8.68.25-.07.5-.16.73-.23.05-.02.09-.04.14-.05.02,0,.05-.02.07-.02.23-.07.48-.14.73-.21,4.88-1.45,13.97-4.15,30.04-2.61,5.61.52,10.11,1.68,13.68,3.16Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "mid-lower-pectoralis": [
      {"type":"path","d":"M337.83,236.19v49.92c0,10.31-3.55,20.17-10.02,27.77-7.02,8.24-15.52,14.62-25.29,18.92-.05.02-.11.04-.16.05l-.02.02c-1.61.59-3.27,1.23-4.93,1.93-.07.02-.14.05-.2.07-25.11,8.58-53.56,1.55-72.55-17.87-.09-.07-.16-.16-.25-.25-.2-.21-.39-.45-.59-.66-.02-.02-.04-.04-.07-.04,0,0,0-.02-.02-.02-1.07-1.14-2.13-2.32-3.14-3.56-7.09-8.61-15.31-17.03-30.56-17.03-.04,0-.05,0-.09.02h-.02c-.75-.02-1.55-.02-2.34-.02,44.94-9.27,68.23-28.38,90.75-46.85,13.99-11.47,27.18-22.3,45.1-30.79,5.64,2.45,8.97,5.7,10.93,8.51,3.43,4.93,3.47,9.61,3.47,9.86Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M488.9,295.46c-.79,0-1.59,0-2.34.02h-.02s-.05-.02-.09-.02c-15.25,0-23.47,8.42-30.56,17.03-1.02,1.23-2.07,2.41-3.14,3.56-.02,0-.02.02-.02.02-.04,0-.05.02-.07.04-.2.21-.39.45-.59.66-.09.09-.16.18-.25.25-18.99,19.42-47.44,26.45-72.55,17.87-.05-.02-.13-.05-.2-.07-1.66-.7-3.32-1.34-4.93-1.93l-.02-.02c-.05-.02-.11-.04-.16-.05-9.77-4.31-18.27-10.69-25.29-18.92-6.47-7.59-10.02-17.46-10.02-27.77v-49.94s-.04-4.81,3.47-9.85c1.95-2.81,5.29-6.06,10.93-8.51,17.91,8.49,31.11,19.32,45.1,30.79,22.52,18.48,45.81,37.58,90.75,46.85Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "anterior-deltoid": [
      {"type":"path","d":"M277.59,217.03c-.09.04-.16.05-.25.09-.29.07-.55.16-.84.23-.05.02-.09.04-.11.09h-.02c-3.52,1.23-11.43,4.22-18.02,8.42-11.04,7-15.5,12.92-22.25,21.89-3.05,4.04-6.52,8.61-11.25,14.19l-.04.05c-5.02,5.88-15.43,18.12-28.74,27.14-2.54,1.72-6.09,3.32-10.59,4.77.77-21.76,8.81-61.27,53.23-83.73,18.52-.5,35.53,5.57,38.88,6.86Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M491.03,293.92c-4.52-1.47-8.07-3.07-10.61-4.79-13.31-9.02-23.74-21.26-28.74-27.14l-.05-.05c-4.72-5.57-8.18-10.15-11.23-14.19-6.75-8.97-11.22-14.88-22.25-21.89-6.59-4.2-14.5-7.18-18.02-8.42h-.02c-.02-.05-.05-.07-.11-.09-.29-.07-.55-.16-.84-.23-.09-.04-.18-.05-.27-.09,3.32-1.27,20.34-7.36,38.9-6.86h.02c44.44,22.48,52.44,61.99,53.23,83.75Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lateral-deltoid": [
      {"type":"path","d":"M237.69,210.19c-19.45,10.02-33.83,24.43-42.72,42.8-7.57,15.63-9.59,30.93-9.95,41.06-1.96.64-4.09,1.23-6.39,1.8-.02,0-.05.02-.07.02-.05,0-.11,0-.16.02-2.75.32-6.34.93-10.43,2.13h-.04c-.05,0-.09.02-.12.04-2.7.79-5.61,1.82-8.63,3.16-3.11,1.39-6.09,3.02-8.91,4.86.64-.95,1.09-1.93,1.48-3.14,5.7-21.69,8.89-29.55,11.02-34.77,1.02-2.5,1.82-4.48,2.57-7.15,5.73-18.71,19.72-42.17,53.82-47.71.71-.11,1.21-.2,1.5-.27l.13-.04c1.36-.34,3.68-.93,6.13-1.55h.02s.07-.02.07-.02h.05s.07-.02.11-.04c3.5-.68,7.04-1.05,10.54-1.2Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M526.25,306.07c-2.82-1.84-5.8-3.47-8.93-4.86-3.05-1.36-5.97-2.39-8.68-3.18-.04,0-.07-.02-.11-.02-4.09-1.2-7.68-1.8-10.43-2.13-.05-.02-.11-.02-.14-.02t-.04-.02c-2.32-.57-4.47-1.16-6.43-1.79-.36-10.13-2.39-25.43-9.97-41.08-8.89-18.37-23.27-32.77-42.72-42.8,3.57.14,7.18.54,10.75,1.25h.04c1.07.27,2.11.54,3.07.79,1.29.32,2.41.61,3.16.8.29.07.79.16,1.5.27,34.1,5.5,48.1,28.98,53.83,47.71.75,2.66,1.55,4.66,2.59,7.18,2.11,5.22,5.32,13.1,11,34.75.41,1.3.89,2.27,1.5,3.13Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "long-head-bicep": [
      {"type":"path","d":"M549.38,414.73c-1.61.8-3.43,1.38-5.43,1.68,2.79-1,4.63-2.64,5.48-4.91,2.11-5.63-2.5-13.31-4.16-15.8-.3-.46-.52-.73-.55-.8l-.02-.02c-6.18-9.99-12.9-19.57-19.4-28.8-9.18-13.04-17.77-25.23-23.25-36.51.02-.02,0-.02,0-.04-.04-.05-.05-.11-.09-.16-5.84-12.08-8.09-23.1-3.72-33.02,2.71.32,6.2.93,10.13,2.05.04.04.11.05.16.05h.04c2.68.8,5.57,1.82,8.57,3.16,3.47,1.57,6.82,3.41,9.91,5.52l.02.02h.02c.46.55,1,1.13,1.61,1.77,2.93,3.09,7.93,8.33,16.66,24.8,0,.02,0,.04.02.05v.04c26.63,58.98,13.93,76.01,4,80.91Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M174.53,329.37c-.04.05-.05.11-.09.16,0,.02-.02.02,0,.04-5.48,11.28-14.07,23.46-23.25,36.51-6.5,9.26-13.23,18.83-19.41,28.82-.04.05-.2.29-.46.64-.04.04-.05.09-.09.14v.04s-.02,0-.02.02c-1.68,2.52-6.25,10.15-4.14,15.76.86,2.27,2.7,3.91,5.48,4.91-2-.3-3.82-.89-5.43-1.68-9.93-4.9-22.63-21.92,4-80.91,0-.02,0-.04.02-.05v-.02c8.68-16.44,13.68-21.71,16.68-24.85.63-.64,1.16-1.22,1.64-1.77,3.09-2.09,6.43-3.93,9.89-5.5,3.02-1.34,5.91-2.38,8.61-3.16.05,0,.13-.02.16-.05,3.93-1.13,7.41-1.73,10.13-2.05,4.38,9.92,2.13,20.94-3.72,33.02Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "short-head-bicep": [
      {"type":"path","d":"M549,411.35c-.98,2.64-3.45,4.41-7.31,5.27-9.31.43-21.79-4.88-34.94-20.92,0,0-.02,0-.04-.02-.02-.02-.04-.04-.05-.05-9.93-13.22-19.5-25.55-21.68-27.59-.5-.46-1.07-.96-1.68-1.52-4.72-4.24-11.84-10.65-16.07-21.01-.04-.09-.14-.16-.23-.14s-.16.07-.18.16c-1.07-3.22-1.89-6.54-2.43-9.86-1.16-7.22-4.27-26.39,6.48-35.17.64-.54,1.32-1,2.02-1.41.82.41,17.18,8.86,28.76,30.66,0,0,0,.02.02.02,5.5,11.31,14.07,23.51,23.27,36.58,6.5,9.24,13.22,18.8,19.41,28.82,0,.02.2.27.5.71,1.55,2.38,6.18,10.06,4.14,15.47Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M212.09,335.66c-.54,3.34-1.36,6.65-2.43,9.88-.02-.11-.09-.16-.18-.18-.11-.02-.2.05-.25.14-4.2,10.33-11.32,16.74-16.04,20.98-.61.57-1.2,1.09-1.7,1.55-2.77,2.57-16.15,20.19-21.77,27.66-13.15,16.05-25.63,21.37-34.94,20.92-3.86-.86-6.32-2.63-7.31-5.27-2.3-6.11,3.88-15.08,4.59-16.1.04-.05.07-.09.07-.09,0-.02.02-.02.02-.04,6.16-10.01,12.88-19.55,19.38-28.79,9.2-13.06,17.77-25.27,23.27-36.58.02,0,.02-.02.02-.02,11.57-21.75,27.86-30.22,28.77-30.66.7.43,1.36.89,2,1.41,10.75,8.77,7.64,27.95,6.48,35.17Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-flexors": [
      {"type":"path","d":"M634.52,538.16c-4.43,1.57-9.97,1.14-15.52-1.23-2.73-5.13-6.81-10.49-6.89-10.58-8.13-8.51-14.68-13.51-21.02-18.35-8.89-6.79-17.29-13.22-29.56-28.54-13.34-16.67-17.18-24.75-21.25-33.31-2.46-5.18-5-10.52-9.72-18.12-3.59-5.16-11.73-16.24-20.18-27.52,11.31,12.13,21.95,16.58,30.29,16.58.38,0,.71-.04,1.07-.05h.07s.05-.02.09-.02c2.89-.14,5.48-.8,7.68-1.89,2.36-1.16,4.38-2.72,6.05-4.68,28.7,39.06,58.46,81.11,78.89,127.71Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M166.07,400.58c-8.36,11.13-16.57,22.37-20.15,27.46-4.7,7.59-7.23,12.94-9.7,18.1-4.05,8.58-7.89,16.65-21.25,33.32-12.25,15.31-20.65,21.73-29.54,28.52-6.34,4.84-12.9,9.85-21.06,18.39-1.11,1.43-4.5,6.09-6.86,10.56-5.55,2.38-11.11,2.81-15.54,1.23,20.43-46.6,50.19-88.64,78.89-127.71,1.68,1.97,3.7,3.52,6.05,4.68,2.2,1.09,4.8,1.75,7.68,1.89.04,0,.05.02.09.02h.07c.36.02.7.05,1.05.05,8.34,0,18.97-4.43,30.26-16.53Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-extensors": [
      {"type":"path","d":"M646.58,521.08c-1.14,7.49-5.13,13.76-10.41,16.4-.39.2-.8.38-1.23.52-20.47-46.71-50.26-88.79-79.02-127.9,3.59-4.32,5.55-10.42,5.82-18.03.43-12.95-3.95-30.34-13.02-51.75,3.98,7.99,8.61,18.07,14.04,30.86,2.45,5.9,5.64,9.26,11.48,15.35,4.25,4.45,10.07,10.54,18.16,20.28,13.61,16.37,27.45,50.69,38.58,78.28,4.59,11.38,8.93,22.14,12.66,30.22,1.09,1.97,2.05,3.9,2.93,5.77Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M114.75,392.07c.27,7.61,2.23,13.7,5.82,18.03-28.76,39.11-58.55,81.19-79.02,127.9-.43-.14-.84-.32-1.23-.52-5.27-2.63-9.27-8.9-10.43-16.39v-.05c.91-1.95,1.89-3.84,2.95-5.75,3.75-8.06,8.09-18.83,12.68-30.23,11.13-27.57,24.95-61.88,38.56-78.25,8.07-9.74,13.9-15.81,18.16-20.26,5.82-6.09,9.04-9.47,11.48-15.35,5.05-11.94,9.72-22.23,13.97-30.72-9.02,21.33-13.38,38.67-12.95,51.59Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "upper-abdominals": [
      {"type":"path","d":"M396.58,348.38c-2.57-5.79-10.04-9.99-17.49-13.12-.07-.02-.14-.05-.2-.07-1.59-.55-3.16-1.16-4.73-1.84-.05-.04-.13-.05-.18-.07l-.02-.02c-5.43-2-23.67-8.09-31.63-2.54-2.45,1.7-3.68,4.4-3.68,8.01,0,.13-.11.21-.23.21-.09,0-.14-.04-.18-.11-.04.07-.09.11-.18.11-.13,0-.23-.09-.23-.21,0-3.61-1.23-6.31-3.68-8.01-7.97-5.56-26.2.54-31.63,2.54l-.02.02c-.07.04-.16.05-.23.09-1.61.71-3.25,1.32-4.88,1.89-.02.02-.04.02-.05.02-7.43,3.14-14.88,7.33-17.43,13.1-1.73,3.91-.75,7.13.77,11.99,1.21,3.93,2.82,9.08,3.55,16.62,0,.04.02.09.02.13.11.88.2,1.79.21,2.75.02.13.02.23.02.34.04.5.07,1.02.09,1.54.11,2.54.05,3.75-.04,5.41-.09,1.84-.21,4.38-.16,10.06.04,4.06.34,12.87.82,24.02,5.72.46,10.9.59,10.95.59l1.48.02c15.22.25,29.61.48,37.08-3.73,2.32-1.32,3.11-3.91,3.3-7.33-.09-1.61-.05-3.38,0-5.29,0-.46-.02-.93-.04-1.41-.07-1.75-.14-3.56-.14-5.45,0-.12.11-.23.23-.23.07,0,.14.04.18.11.04-.07.11-.11.18-.11.13,0,.23.11.23.23,0,1.89-.07,3.7-.14,5.45-.02.48-.04.95-.04,1.41.05,1.91.09,3.68,0,5.29.2,3.41.98,6,3.3,7.33,7.47,4.22,21.86,3.98,37.08,3.73l1.48-.02c.05,0,5.23-.13,10.95-.59.48-11.15.79-19.96.82-24.02.05-5.7-.07-8.22-.16-10.06-.09-1.66-.14-2.88-.04-5.41.02-.52.05-1.04.09-1.54,0-.11,0-.21.02-.34.02-.96.11-1.88.21-2.75,0-.04.02-.09.02-.13.73-7.54,2.34-12.69,3.55-16.62,1.5-4.86,2.5-8.08.77-11.99ZM370.66,377.9c-.39-.09-.8-.2-1.25-.32-5.39-1.43-14.45-3.82-21.93-2.54-8.16,1.38-8.82,6.65-8.82,12.38,0,.13-.11.23-.23.23-.07,0-.14-.04-.18-.11-.04.07-.11.11-.18.11-.13,0-.23-.11-.23-.23,0-5.74-.66-11.01-8.82-12.38-7.48-1.29-16.54,1.11-21.93,2.54-.45.12-.86.23-1.25.32-.13.04-.23-.04-.27-.16-.04-.11.04-.23.16-.27.38-.09.8-.21,1.23-.32,5.45-1.45,14.56-3.84,22.13-2.56,7.72,1.3,9,6.11,9.16,11.24.16-5.13,1.45-9.93,9.16-11.24,7.57-1.29,16.68,1.11,22.13,2.56.43.11.86.23,1.23.32.13.04.2.16.16.27-.04.13-.16.2-.27.16ZM383.15,375.87h-.07c-14.38-4.2-24.15-6.7-38.45-6.43-5.22-.02-6.18-6.15-6.38-13.72-.2,7.58-1.16,13.7-6.38,13.72-14.29-.3-24.08,2.23-38.45,6.43h-.07c-.09,0-.18-.05-.21-.16s.04-.23.16-.27c14.41-4.2,24.22-6.72,38.58-6.45,5.97-.02,5.97-9.1,5.97-18.69,0-.13.11-.23.23-.23.07,0,.14.04.18.11.04-.07.11-.11.18-.11.13,0,.23.11.23.23,0,9.6,0,18.67,5.97,18.69,14.36-.29,24.15,2.25,38.58,6.45.13.04.2.16.16.27-.04.11-.13.16-.21.16Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lower-abdominals": [
      {"type":"path","d":"M380.34,422.27l-1.48.02c-3.55.07-7.06.12-10.45.12-11.18,0-21.04-.63-26.84-3.93-1.98-1.13-2.91-3.06-3.32-5.57-.41,2.52-1.34,4.45-3.32,5.57-5.8,3.31-15.66,3.93-26.84,3.93-3.39,0-6.89-.05-10.45-.12l-1.48-.02c-.05,0-5.22-.13-10.93-.59.86,20.28,2.27,48.08,3.61,69.13,1.98,31.06,13.79,55.12,20.67,66.7,9.86,16.64,21.34,27.8,28.58,27.8.07,0,.14.04.18.11.04-.07.11-.11.18-.11,7.23,0,18.72-11.17,28.58-27.8,6.86-11.58,18.68-35.65,20.67-66.7,1.34-21.05,2.75-48.87,3.61-69.13-5.72.46-10.88.59-10.93.59ZM305.76,426.97c5.64-.64,15.09-1.73,23.47-1.63,7.36.09,8.77,4.56,9.02,11.19.25-6.63,1.66-11.1,9.02-11.19,8.38-.11,17.83.98,23.47,1.63.13.02.21.13.2.25-.02.13-.13.21-.25.2-5.63-.64-15.06-1.75-23.42-1.63-8.02.11-8.61,5.5-8.61,13.7,0,.13-.11.21-.23.21-.09,0-.14-.04-.18-.11-.04.07-.09.11-.18.11-.13,0-.23-.09-.23-.21,0-8.2-.59-13.6-8.63-13.7-8.36-.11-17.77.98-23.42,1.63-.11.02-.23-.07-.23-.2-.02-.12.07-.23.2-.25ZM338.66,571.15c0,.12-.11.21-.23.21-.02,0-.04-.02-.04-.02-.02.02-.02,0-.02,0-.02.02-.05.02-.07.02s-.04,0-.05-.02c-.02.02-.04.02-.05.02s-.05,0-.07-.02h-.02s-.02.02-.04.02c-.13,0-.23-.09-.23-.21v-67.56c0-.13.11-.21.23-.21.02,0,.04.02.04.02h.02s.05-.02.07-.02.04,0,.05.02c.02-.02.04-.02.05-.02s.05,0,.07.02c0,0,0-.02.02,0,0,0,.02-.02.04-.02.13,0,.23.09.23.21v67.56ZM370.72,476.5h-.64c-6.41,0-21.29,1.45-26.54,2.66-4,.91-4.88,4.74-5.07,9.13.07,1.29.07,2.61.07,3.88v.79c0,.13-.11.21-.23.21-.02,0-.04,0-.05-.02-.02.02-.04.02-.05.02-.13,0-.23-.09-.23-.21v-.79c0-1.27,0-2.59.07-3.88-.2-4.4-1.07-8.22-5.07-9.13-5.43-1.25-21.2-2.79-27.18-2.66-.13,0-.21-.09-.21-.21-.02-.13.09-.21.21-.23,6.13-.12,21.7,1.39,27.29,2.66,3.41.79,4.7,3.57,5.18,6.95.48-3.38,1.77-6.16,5.18-6.95,5.59-1.27,21.13-2.81,27.29-2.66.13.02.23.11.21.23,0,.13-.09.21-.21.21ZM378.83,470.23c-5.64.2-9.57.48-13.06.71-4.27.3-7.86.55-13.09.55-1.7,0-3.55-.02-5.68-.07-6.79-.52-8.48-2.97-8.75-15.4-.27,12.44-1.96,14.88-8.75,15.4-2.11.05-3.98.07-5.68.07-5.23,0-8.82-.25-13.11-.55-3.47-.23-7.39-.52-13.04-.71-.13-.02-.21-.11-.21-.23.02-.13.11-.21.23-.21,2.82.11,5.22.21,7.34.34,2.13.12,3.98.27,5.72.38,5.66.41,10.13.71,18.74.48,7.11-.54,8.36-3.4,8.36-19.14,0-.13.11-.23.23-.23.07,0,.14.04.18.11.04-.07.11-.11.18-.11.13,0,.23.11.23.23,0,15.74,1.25,18.6,8.38,19.14,8.59.23,13.06-.07,18.72-.48,3.47-.23,7.41-.52,13.06-.71.13,0,.21.09.23.21,0,.13-.11.21-.21.23Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "obliques": [
      {"type":"path","d":"M280.91,405.06c-2.79,15.51-5.95,33.09-3.55,49.32,5.04,34.38-6.98,50.16-12.4,55.36-6.95,6.65-18.88,9.72-29.24,7.52-.14-.04-.29-.05-.41-.09,1.46-11.63,2.55-21.55,3.18-28.71.43-5.06,1.11-10.1,1.82-15.44,2.61-19.32,5.3-39.27-4.34-58.43-20.42-39.36-25.34-63.49-26.15-68.1,1.21-3.5,2.11-7.11,2.71-10.76,1.18-7.29,4.3-26.64-6.66-35.58-.57-.46-1.2-.91-1.82-1.3,6.84,3.18,11.73,8.51,16.2,13.92,1.21,1.48,2.5,2.91,3.8,4.27.09.11.18.2.29.29,10.27,11.38,22.27,21.73,32.92,30.89,14.31,12.33,25.59,22.05,26.52,28.82,0,.04.02.09.02.13.09.88.16,1.79.21,2.73.02.11.02.23.02.34.16,6.52-1.38,15.12-3.13,24.82Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M472.43,298.85c-.63.39-1.25.84-1.82,1.3-10.97,8.93-7.84,28.29-6.66,35.58.61,3.61,1.5,7.24,2.71,10.72v.02c-.88,4.88-5.91,29.13-26.17,68.11-9.63,19.15-6.93,39.11-4.34,58.41.73,5.34,1.41,10.4,1.84,15.46.64,7.43,1.79,17.76,3.14,28.71-.13.04-.25.07-.38.09-10.36,2.18-22.31-.88-29.24-7.52-5.41-5.2-17.43-20.98-12.4-55.36,2.39-16.22-.77-33.81-3.55-49.32-1.75-9.7-3.29-18.28-3.13-24.8v-.16c.07-1.11.16-2.18.27-3.2,1.07-6.77,12.31-16.44,26.51-28.68,10.65-9.17,22.65-19.51,32.92-30.89.11-.09.2-.18.29-.29,1.3-1.36,2.59-2.79,3.8-4.27,4.47-5.41,9.36-10.74,16.2-13.92Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "outer-quadricep": [
      {"type":"path","d":"M464.99,783.48c-.02.05-.02.11-.04.16v.04c-.84,3.84-1.63,7.81-2.38,11.61-3.16,16.13-6.14,31.38-14.22,35.38-2.93,1.47-6.41,1.39-10.56-.21t-.04-.02s-.04-.05-.07-.07c-10.7-4.36-15.88-13.63-16.81-30.09-.88-15.31,1.96-35.34,5.54-60.7,7.27-51.37,17.2-121.72,3.16-207.11v-.02c3.41-5.13,7.38-9.18,12-11.85,2.71,21.41,6.16,44.3,8.2,52.34.13.54.34,1.32.59,2.3,9.64,36.51,28.06,122.65,14.61,208.24Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M255.6,800.28c-.93,16.46-6.11,25.73-16.81,30.09-.02.02-.04.02-.05.05-4.16,1.64-7.66,1.73-10.63.25-8.06-4-11.06-19.24-14.2-35.38-.77-3.84-1.54-7.84-2.41-11.72,0-.02,0-.05-.02-.07v-.02c-9.75-61.72-4.57-135.66,14.63-208.26.25-.98.45-1.75.59-2.29,2.13-8.43,5.75-32.99,8.2-52.35,4.63,2.68,8.59,6.74,12,11.86v.02c-14.04,85.41-4.11,155.76,3.16,207.11,3.57,25.36,6.41,45.39,5.54,60.7Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "rectus-femoris": [
      {"type":"path","d":"M291.32,839.78c-4.93,11.2-12.23,21.08-22.65,21.08h-.27c-13.63-.23-16.29-11.9-18.43-21.28-1.14-5.02-2.14-9.35-4.68-10.56-.68-.32-1.45-.41-2.3-.27,8.18-5.02,12.25-14.01,13.06-28.45.88-15.37-1.96-35.42-5.55-60.79-7.23-51.25-17.15-121.4-3.21-206.52,14.25,22,18.77,62.97,22.86,99.99,1.75,15.71,3.38,30.56,5.64,42.9v.02s-.05.09-.04.14c10.13,53.84,9.11,92.72,8.43,118.43-.63,23.57-1,37.85,7.14,45.3Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M433.5,828.76c-.86-.14-1.63-.05-2.3.27-2.54,1.22-3.54,5.54-4.68,10.56-2.14,9.38-4.8,21.05-18.43,21.28h-.27c-10.41,0-17.72-9.88-22.65-21.08,8.14-7.45,7.77-21.73,7.14-45.3-.68-25.71-1.7-64.59,8.43-118.43.02-.05,0-.11-.04-.14v-.02c2.27-12.35,3.89-27.2,5.64-42.9,4.09-37.02,8.61-78.01,22.88-100.01,13.91,85.14,4,155.29-3.23,206.54-3.59,25.37-6.43,45.42-5.55,60.79.8,14.44,4.88,23.43,13.06,28.45Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "inner-quadricep": [
      {"type":"path","d":"M304.22,784.73v.02l-.05.3c-.02.07-.04.12-.04.2-.5,2.32-.98,4.84-1.46,7.49,0,.04-.02.09-.02.13-.05.27-.11.55-.16.82v.02c-.93,5.09-1.68,9.9-2.32,14.62v.02l-.02.02s-.02.11-.04.29c0,.04-.02.07-.02.11-.41,2.63-2.88,17.44-8.57,30.61-7.89-7.34-7.52-21.5-6.89-44.85.63-23.57,1.52-58.13-6.09-105.14,7.72,34.61,16.09,44.78,21.84,51.75,6.55,7.97,9.56,11.6,3.84,43.62Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M391.86,794.51c.63,23.35,1,37.51-6.89,44.85-6.23-14.37-8.59-30.72-8.63-31,0-.02-.02-.04-.04-.05v-.02c-.66-4.86-1.43-9.72-2.32-14.58.02-.02.02-.05.02-.07-.09-.41-.16-.82-.25-1.21l-.05-.32c-.41-2.27-.86-4.54-1.32-6.81-.02-.05-.02-.13-.04-.18-.02-.12-.05-.25-.07-.38-5.72-32.02-2.71-35.65,3.84-43.62,5.75-6.97,14.13-17.14,21.84-51.75-7.61,47.01-6.72,81.57-6.09,105.14Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "inner-thigh": [
      {"type":"path","d":"M337.23,644.25c-1.13,1.36-1.23,6.16-1.43,15.6-.05,2.84-.13,6.09-.23,9.72-1.41,22.8-11.56,50.78-18.25,69.29-2.16,5.91-4,11.02-5.13,14.72-2.34,7.74-4.38,15.3-6.14,22.89,3.77-24.62.71-28.32-5.32-35.65-6.39-7.76-16.07-19.48-24.47-64.86-2.29-12.35-3.93-27.25-5.66-43.03-5.13-46.31-10.9-98.79-35.63-112.84.11-.82.21-1.66.3-2.48.13.02.23.04.36.07,12.59,2.75,51.62,15.15,66.3,64.86,12.73,43.1,19.61,61.11,35.31,61.7Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M441.52,520.12c-24.72,14.04-30.52,66.52-35.61,112.82-1.73,15.78-3.38,30.68-5.66,43.03-8.39,45.39-18.08,57.11-24.47,64.86-6.04,7.33-9.11,11.04-5.32,35.74-1.79-7.68-3.82-15.35-6.14-22.98-1.11-3.7-2.96-8.79-5.11-14.69-6.72-18.53-16.86-46.51-18.25-69.33-.13-3.63-.18-6.86-.25-9.7-.2-9.43-.3-14.26-1.43-15.62,15.7-.59,22.58-18.6,35.31-61.7,14.68-49.71,53.71-62.11,66.3-64.86.11-.02.21-.05.32-.07.11.82.21,1.66.32,2.5Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "gastrocnemius": [
      {"type":"path","d":"M443.73,1098.11c-7.2-1.3-13.4-5.09-17.06-10.38,0-.02-.02-.04-.04-.04.66-15.24-1.46-36.15-18.81-91.61-1.07-3.61-2.59-5.75-4.07-7.81-4.34-6.09-8.84-12.4-2.64-57.66,3.88-34.4,3.57-34.91-.18-41.2-.45-.75-.93-1.55-1.45-2.52,6.25,8.93,13.91,14.9,21.68,17.01.7,4.97,16.99,120.56,22.56,194.21Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M272.71,988.27c-1.46,2.05-2.98,4.18-4.05,7.79-17.34,55.46-19.47,76.37-18.81,91.63-.02,0-.04.02-.04.04-3.64,5.29-9.86,9.08-17.04,10.38,5.55-73.64,21.84-189.24,22.54-194.21,7.79-2.11,15.45-8.09,21.72-17.06-.54.98-1.04,1.8-1.48,2.57-3.75,6.27-4.05,6.79-.18,41.2,6.2,45.26,1.7,51.55-2.66,57.66Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "soleus": [
      {"type":"path","d":"M472.2,1015.98c-.71,7.99-1.71,16.26-2.66,24.25-2.48,20.75-4.8,40.35-2.52,52.93-2.84,2.02-6.07,3.5-9.47,4.41-.93-95.76-2.89-123.6-8.77-206.09l-.16-2.22v-.02c4.07-6.91,7.18-9.86,13.34-11.36.27,1.11.88,2.77,1.66,5,5.86,16.44,21.38,60.14,8.57,133.1Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M227.86,889.24v.02l-.16,2.22c-5.88,82.5-7.84,110.34-8.75,206.09-3.41-.91-6.63-2.39-9.48-4.41,2.29-12.58-.04-32.2-2.52-52.94-.96-7.99-1.95-16.26-2.68-24.25-12.79-72.97,2.75-116.66,8.59-133.12.8-2.23,1.39-3.9,1.66-4.97,6.18,1.5,9.27,4.45,13.34,11.36Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "tibialis": [
      {"type":"path","d":"M457.11,1097.68c-4.16,1.04-8.59,1.23-12.95.5-5.48-72.94-21.52-187.06-22.52-194.16,1.91.48,3.82.73,5.72.73h.34c8-.12,14.82-4.57,19.22-12.53.46-.82.89-1.61,1.32-2.34l.11,1.61c5.88,82.52,7.84,110.36,8.77,206.18Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M254.85,904.02c-1,7.11-17.04,121.24-22.52,194.16-4.36.73-8.77.54-12.93-.5.91-95.83,2.88-123.65,8.75-206.17l.11-1.63c.43.73.86,1.52,1.32,2.34,4.39,7.95,11.22,12.4,19.22,12.53h.34c1.89,0,3.8-.25,5.72-.73Z","fill":"#EBEBEB","sw":"1"} 
    ]
  },
  "maleBack": {
    "upper-trapezius": [
      {"type":"path","d":"M440.46,208.63c-18.49,1.28-29.07,11.49-34.73,17.53-.38.38-.72.77-1.05,1.12l-.6.63c-7.35,7.89-13.18,6.86-25.96,4.62-9.17-1.61-21.75-3.81-40.85-3.81s-31.67,2.2-40.84,3.81c-12.73,2.24-18.56,3.27-25.91-4.53-.02-.04-.04-.05-.07-.09l-.58-.63c-.33-.35-.67-.73-1.05-1.12-5.67-6.03-16.21-16.28-34.73-17.53.72-.37,1.99-1.14,3.61-2.12,3.3-1.98,7.83-4.7,11.08-6.14,2.04-.91,6.55-2.75,11.77-4.86,5.2-2.12,10.87-4.43,14.95-6.16.05,0,.09,0,.14-.02,20.22-5.35,41.7-4.3,53.24-3.74,1.21.05,2.33.11,3.3.16,3.38.12,6.79.12,10.16,0,.97-.05,2.09-.11,3.3-.16,11.54-.56,33-1.61,53.22,3.74.05,0,.09.02.13.02h.02c4.1,1.73,9.75,4.04,14.95,6.16,5.24,2.12,9.73,3.95,11.79,4.86,3.23,1.43,7.78,4.16,11.08,6.14,1.64.98,2.91,1.75,3.61,2.12Z","fill":"#EBEBEB","sw":"0"} 
    ],
    "traps-middle": [
      {"type":"path","d":"M402.56,230.62c-15.58,28.26-26.52,51.96-34.52,71.11-9.51-1.1-20.44-1.68-31.57-1.68-10.49,0-20.87.51-30.04,1.5-7.98-19.12-18.92-42.76-34.45-70.92,3.77,3.25,7.4,4.37,11.82,4.37,3.56,0,7.65-.72,12.76-1.63,9.15-1.59,21.68-3.8,40.69-3.8s31.56,2.2,40.69,3.8c5.13.91,9.21,1.63,12.78,1.63,4.44,0,8.05-1.12,11.82-4.39Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lower-trapezius": [
      {"type":"path","d":"M367.7,302.55c-2.35,5.65-4.44,10.91-6.34,15.76-.04.09-.05.16-.09.23-1.01,2.45-1.91,4.83-2.71,7.15-.04.05-.05.12-.07.18-1.7,4.55-3.2,8.68-4.55,12.38-7.13,19.62-10.4,28.56-16.68,28.56s-9.53-8.94-16.68-28.56c-1.28-3.5-2.69-7.38-4.28-11.65-.02-.07-.05-.16-.09-.23-.96-2.85-2.08-5.79-3.34-8.8v-.02c-1.82-4.69-3.85-9.74-6.1-15.16,9.08-.96,19.35-1.47,29.7-1.47,11.01,0,21.81.56,31.23,1.63Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lats": [
      {"type":"path","d":"M472,307.83c-2.55,11.75-4.93,22.91-1.37,28.75v.02c-.61,2.69-8.86,38.64-21.28,57.75-11.81,18.21-11.93,44.95-11.99,59.33-.02,1.61-.02,3.1-.04,4.43-.22,13.07,3.72,56.44,9.41,79.14.76,3.04,1.28,5.51,1.61,7.59-6.25-15.71-29.7-29.82-44.74-35.59-.14-.05-.27-.11-.42-.18-.04-.04-.09-.05-.14-.05-.34-.17-.7-.31-1.07-.45-.04-.04-.07-.05-.13-.05-13.59-6.21-13.07-18.33-12.42-33.6.54-12.26,1.14-26.15-6.03-39.39-27.87-51.56-35.71-74.65-24.64-107.7.02-.05.04-.09.05-.14,1.14-3.06,2.36-6.31,3.7-9.76v-.02c8.47-21.83,21.23-51.61,42.26-89.41l.02-.02.56-.63c.23-.24.47-.51.72-.77,9.82,9.15,19.93,16.72,30.62,24.77,6.68,5,13.59,10.2,20.69,15.97,4.26,3.46,8.85,6.12,13.47,8.19l.02.02c7.06,4.29,4.04,18.28,1.14,31.81Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M291.16,435.53c-7.17,13.24-6.57,27.13-6.05,39.39.67,15.27,1.19,27.44-12.46,33.62t-.04.02c-.51.19-.99.4-1.48.63-.07.02-.13.04-.18.07-15.04,5.77-38.49,19.89-44.74,35.59.33-2.08.85-4.55,1.61-7.59,5.69-22.7,9.6-66.08,9.41-79.14-.02-1.33-.04-2.82-.04-4.43-.07-14.38-.18-41.12-11.99-59.33-12.4-19.08-20.65-54.94-21.28-57.74v-.02c3.56-5.84,1.17-17-1.37-28.77-2.91-13.54-5.92-27.53,1.14-31.81l.02-.02c4.62-2.06,9.21-4.72,13.47-8.19,7.09-5.77,14.01-10.97,20.67-15.99,10.71-8.03,20.83-15.62,30.64-24.77.23.28.49.54.72.79l.56.63.02.02c16.27,29.26,27.6,53.73,35.82,73.42-.02.05-.02.11-.02.16.02.14.09.26.22.32,2.33,5.54,4.39,10.72,6.25,15.51,1.35,3.52,2.6,6.82,3.76,9.92,0,.04.02.09.04.12,11.01,33,3.18,56.09-24.68,107.58Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lowerback": [
      {"type":"path","d":"M397.22,506.89c-.29-.09-.58-.18-.87-.26-3.41-1-7.22-1.73-11.23-2.1-.04-.02-.05-.02-.09-.02-10.54-1-22.42.58-31.74,7.29-9.15,6.59-14.53,17.11-16.03,31.31-1.5-14.2-6.88-24.71-16.01-31.31-9.32-6.72-21.19-8.29-31.74-7.29-.04,0-.07,0-.11.02-4.01.37-7.82,1.12-11.21,2.1-.29.09-.58.17-.87.26,9.77-6.98,9.26-18.71,8.68-32.01-.52-12.16-1.12-25.92,5.94-38.95,24.68-45.6,33.78-69.73,27.51-98.14.09.24.18.51.27.75,7.29,20.01,10.62,29.14,17.53,29.14s10.25-9.13,17.53-29.14c.11-.28.2-.54.31-.82-6.3,28.44,2.8,52.56,27.49,98.21,7.04,13.03,6.44,26.79,5.92,38.95-.58,13.29-1.08,25.03,8.7,32.01Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "posterior-deltoid": [
      {"type":"path","d":"M497,281.76c-7.37-.79-16.61-2.47-25.65-6.49-.04-.02-.07-.04-.13-.05-4.57-2.05-9.08-4.67-13.27-8.08-7.11-5.77-14.03-10.97-20.71-15.99-10.69-8.01-20.78-15.6-30.58-24.71,4.19-4.42,10.92-10.93,21.41-14.48,36.95,19.87,53.92,46.37,67.54,67.65l1.39,2.15Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M267.87,226.44c-9.78,9.13-19.89,16.69-30.56,24.71-6.68,5.02-13.59,10.21-20.71,15.99-4.22,3.43-8.79,6.09-13.4,8.13-9.04,4.02-18.29,5.7-25.65,6.49l1.37-2.15c13.63-21.29,30.58-47.77,67.54-67.63h.02c10.47,3.55,17.22,10.04,21.39,14.46Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lateral-deltoid": [
      {"type":"path","d":"M524.84,289.03c-2.4-1.78-8.95-6.16-15.74-6.51-.58-.02-1.23-.05-1.95-.09-2.33-.09-5.42-.23-9.01-.56l-1.75-2.73c-13.61-21.25-30.51-47.64-67.19-67.56,4.84-1.5,10.47-2.4,16.97-2.17h.11c1.52.16,17.53,1.87,34.72,12.02,16.41,9.71,37.28,29.28,43.85,67.6Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M245.32,211.59c-36.67,19.92-53.56,46.31-67.16,67.56l-1.75,2.73c-3.59.33-6.68.47-9.01.56-.74.04-1.39.07-1.95.09-6.81.35-13.38,4.76-15.74,6.52,6.57-38.32,27.42-57.91,43.83-67.62,17.66-10.41,34.05-11.95,34.81-12.02h.02c6.48-.21,12.11.66,16.95,2.17Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "medial-head-triceps": [
      {"type":"path","d":"M572.15,385.23c-1.79,1.82-5.7.7-9.84-.49-4.4-1.26-8.97-2.57-12.04-.72-2.89,1.75-3.21,7.01-3.54,12.58-.36,6.19-.74,12.59-4.64,14.15-4.53,1.8-13.36-3.13-27.01-15.04-.02-.02-.04-.05-.07-.07-.97-1.1-2-2.15-3.09-3.29,13.85-45.26,7.02-56.41-14.08-85.61,10.33,11.04,18.23,13.94,25.51,16.6,8.59,3.15,16.72,6.12,27.48,21.78,3.21,4.65,5.61,8.31,7.76,11.54,4.68,7.08,7.78,11.77,14.06,19.27,1.03,4.86.87,7.92-.51,9.3Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M162.62,392.35c-1.1,1.14-2.11,2.19-3.09,3.29-.04.02-.05.05-.07.07-13.65,11.91-22.48,16.84-27.03,15.04-3.88-1.56-4.26-7.96-4.62-14.15-.33-5.56-.65-10.83-3.54-12.58-3.09-1.85-7.64-.54-12.04.72-4.13,1.19-8.05,2.31-9.86.49-1.37-1.38-1.53-4.46-.49-9.3,6.23-7.45,9.32-12.12,13.99-19.15,2.15-3.25,4.59-6.94,7.84-11.67,10.74-15.65,18.87-18.63,27.48-21.78,7.29-2.68,15.2-5.58,25.55-16.65-21.14,29.26-27.98,40.38-14.12,85.67Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "long-head-triceps": [
      {"type":"path","d":"M511.21,391.63c-.51-.51-1.03-1.03-1.57-1.57-8.38-8.31-29.64-40.75-37.66-52.98l-.49-.77c-3.52-5.49-1.03-17.09,1.39-28.3,2.65-12.35,5.4-25.06.54-30.92,1.41.58,2.83,1.08,4.22,1.56h.02c4.04,6.79,7.8,12.45,11.28,17.21v.02c.02.05.05.09.07.12,2.22,3.13,4.33,6.05,6.34,8.82,22.21,30.7,29.75,41.14,15.85,86.82Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M203.06,336.31l-.51.77c-8,12.23-29.28,44.67-37.64,52.98-.54.54-1.07,1.07-1.57,1.57-13.9-45.68-6.35-56.13,15.85-86.82,1.99-2.76,4.12-5.68,6.34-8.82.04-.05.07-.1.07-.17,0,0,.02,0,.02-.02,3.47-4.76,7.2-10.39,11.25-17.16,1.41-.45,2.83-.98,4.26-1.56-4.86,5.86-2.11,18.57.54,30.92,2.42,11.21,4.91,22.81,1.39,28.3Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lateral-head-triceps": [
      {"type":"path","d":"M572.19,373.95c-5.49-6.66-8.48-11.16-12.84-17.77-2.15-3.24-4.57-6.89-7.76-11.56-10.92-15.88-19.17-18.91-27.91-22.11-11.19-4.09-23.85-8.73-44.74-43.46,6.84,2.12,13.43,3.13,18.9,3.66,3.7.37,6.88.51,9.26.61.72.04,1.37.07,1.95.09,8.03.42,16.05,6.96,16.12,7.01.23.19,22.78,19.38,30.73,46.28.05.14,6.54,13.92,10.92,21.36,1.61,2.71,2.35,5.63,3.12,8.71.6,2.36,1.21,4.76,2.22,7.15t.02.04Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M195.58,279.06c-20.87,34.72-33.54,39.35-44.72,43.45-8.74,3.2-17.01,6.23-27.91,22.11-3.25,4.72-5.69,8.43-7.85,11.68-4.33,6.56-7.29,11.05-12.75,17.67,0-.05.02-.11.04-.16l.02-.02c.97-2.36,1.57-4.72,2.17-7.03.02-.07.04-.12.05-.19s.04-.16.05-.23c.76-2.92,1.5-5.7,3.03-8.29,4.39-7.43,10.87-21.22,10.94-21.41,7.82-26.48,29.9-45.53,30.69-46.23h.02l.02-.02c.56-.44,8.32-6.59,16.1-7,.58-.02,1.23-.05,1.95-.09,5.92-.26,16.68-.72,28.14-4.25Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-flexors": [
      {"type":"path","d":"M648.19,548.01c-.81.56-1.68,1-2.55,1.33-5,1.85-12.01.58-18.76-3.46-4.13-8.82-14.17-23.35-37.53-46.61-14.3-14.1-23.96-30.4-33.27-46.16-5.85-9.88-11.37-19.2-17.91-27.91l-.43-.58c-9.55-12.72-14.59-19.43-18.78-24.45,9.69,7.98,16.54,11.81,21.09,11.81.88,0,1.68-.14,2.38-.42,4.42-1.75,4.82-8.43,5.2-14.9.31-5.19.6-10.14,2.92-11.75,6.81,10.55,14.3,21.57,22.24,33.21,26.01,38.25,55.5,81.57,75.39,129.9Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M155.58,400.17c-4.19,5.02-9.23,11.74-18.78,24.45l-.43.58c-6.54,8.71-12.06,18.03-17.91,27.91-9.33,15.76-18.97,32.06-33.27,46.16-23.36,23.26-33.4,37.8-37.53,46.61-6.75,4.04-13.77,5.33-18.76,3.46-.87-.33-1.73-.77-2.55-1.33,19.89-48.33,49.38-91.65,75.39-129.9,7.94-11.65,15.44-22.67,22.24-33.21,2.33,1.61,2.6,6.56,2.92,11.75.38,6.47.78,13.15,5.18,14.9.72.28,1.52.42,2.38.42,4.57,0,11.41-3.83,21.1-11.81Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-extensors": [
      {"type":"path","d":"M657.27,533.95c-1.61,5.89-4.64,10.76-8.32,13.52-19.95-48.31-49.39-91.61-75.41-129.85-7.91-11.61-15.38-22.61-22.19-33.14,2.74-1.19,6.79-.02,10.71,1.1,4.4,1.26,8.58,2.45,10.74.24,1.43-1.43,1.77-4.2,1.03-8.52.07.09.14.19.23.28,0,.02.02.02.02.04,1.17,1.87,2.71,3.74,4.77,5.6,7.82,7.05,34.52,32.97,49.36,70.47,9.75,24.63,17.87,49.18,22.71,63.84,2.4,7.22,3.97,12,4.71,13.69.49,1.12,1.07,1.96,1.64,2.73Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M123.17,384.46c-6.77,10.53-14.26,21.53-22.19,33.16-26,38.23-55.44,81.54-75.39,129.85-3.68-2.76-6.72-7.64-8.32-13.54.58-.77,1.16-1.61,1.64-2.71.74-1.7,2.31-6.47,4.71-13.69,4.84-14.66,12.96-39.21,22.71-63.84,14.84-37.5,41.52-63.42,49.36-70.47,2-1.8,3.5-3.64,4.64-5.46.02-.02.04-.02.04-.04.02-.02.04-.04.05-.05l.27-.33c-.74,4.28-.4,7.05,1.03,8.48,2.18,2.2,6.35,1.01,10.76-.24,3.9-1.12,7.93-2.27,10.69-1.12Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "gluteus-maximus": [
      {"type":"path","d":"M438.24,593.8v.02c0,11.05-2.71,20.41-8.09,28.05-11.86,16.77-33.27,19.78-41.94,20.29-1.03.07-2.04.12-3.05.19h-.04c-.67.04-1.32.09-1.97.12-.38.02-.76.05-1.14.07-.31.02-.63.04-.96.05-1.32.05-2.69.12-4.06.24-.16.02-.32.04-.49.04-12.42.68-23.7.38-30.82-6.05-5.36-4.86-7.98-12.86-7.98-24.47v-60.53c0-18.38,5.43-31.6,16.12-39.32,8.95-6.45,20.35-8.06,30.55-7.19-11.59,26.13,1.25,34.26,17.48,44.55,14.23,9.01,30.31,19.2,36.38,43.94Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M336.81,551.82v60.53c0,11.61-2.6,19.61-7.96,24.47-7,6.35-18.07,6.7-30.29,6.1-.18-.02-.34-.04-.51-.04-1.53-.16-3.09-.23-4.59-.3-1.43-.07-2.78-.12-4.04-.25h-.04c-1.01-.07-2.04-.12-3.05-.19-8.67-.51-30.08-3.52-41.94-20.29-5.4-7.63-8.09-17.02-8.09-28.05,6.07-24.77,22.15-34.95,36.36-43.95,16.25-10.28,29.08-18.42,17.48-44.55,10.2-.87,21.61.73,30.56,7.19,10.69,7.71,16.1,20.94,16.1,39.32Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "gluteus-medius": [
      {"type":"path","d":"M438.13,590c-6.84-22.55-22.8-32.65-35.76-40.87-15.94-10.07-28.52-18.07-17.04-43.73,3.85.39,7.51,1.12,10.78,2.06,1.97.58,3.79,1.19,5.47,1.89.02,0,.04.02.04.02.45.18.9.37,1.34.56.11.04.22.09.31.12,16.32,7.33,20,20.43,24.9,37.8,1.3,4.6,2.64,9.36,4.31,14.46,3.34,10.09,5.24,19.31,5.67,27.69Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M272.18,549.13c-12.96,8.22-28.92,18.33-35.76,40.87.45-8.36,2.35-17.6,5.67-27.69,1.68-5.11,3.01-9.86,4.31-14.46,4.89-17.37,8.58-30.47,24.9-37.8.54-.25,1.12-.49,1.72-.72,1.68-.68,3.48-1.31,5.43-1.87,3.27-.94,6.93-1.68,10.78-2.06,11.48,25.66-1.1,33.65-17.04,43.73Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "medial-hamstrings": [
      {"type":"path","d":"M411.28,859.44l-.02.02c-2.17,2.29-4.96,3.69-8.56,3.69-13.18,0-21.34-19.76-29.05-70.52-.04-.23-.27-.4-.52-.37-.02,0-.04,0-.05.02-3.59-16.76-7.71-30.99-11.97-45.68-1.39-4.77-2.8-9.58-4.19-14.59,0-.02-.02-.05-.02-.09-7.13-29.93-2.53-38.43,2.35-47.43,3.68-6.8,7.49-13.83,6.19-30.47-.23-3.01.36-5.26,1.84-6.89,2.11-2.31,5.83-3.06,9.71-3.39.05-.02.13-.02.2-.02,1.3-.07,2.6-.16,3.92-.24.34-.02.69-.04,1.01-.05.38-.02.74-.04,1.1-.07.65-.04,1.32-.09,1.99-.12,1.01-.07,2.04-.12,3.05-.19,3.74-.23,9.8-.89,16.48-2.92.92,20.13,2.47,41.14,4.53,61.78v.05c1.28,20.29,2.64,38.46,3.83,54.5,4.24,57.28,6.61,89.15-1.82,103Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M317.7,731.69s-.02.09-.04.12c0,.04-.02.07-.02.11-.02.04-.02.07-.02.1-1.41,4.98-2.82,9.81-4.19,14.57-4.26,14.71-8.38,28.93-11.95,45.7-.02-.02-.05-.04-.09-.04-.23-.04-.47.14-.51.37-7.73,50.76-15.87,70.52-29.05,70.52-3.61,0-6.39-1.38-8.56-3.69-8.45-13.83-6.08-45.72-1.84-103.02,1.19-16.04,2.55-34.21,3.83-54.5,0-.04,0-.07-.02-.11,2.06-20.62,3.61-41.63,4.53-61.74,6.68,2.03,12.76,2.71,16.5,2.94,1.01.07,2.04.12,3.05.19.67.04,1.32.09,1.99.12.36.04.74.05,1.12.07.07.02.14.02.22.02,1.59.1,3.14.19,4.69.28.07,0,.14,0,.22.02,3.86.33,7.58,1.08,9.68,3.39,1.5,1.63,2.09,3.88,1.86,6.89-1.32,16.63,2.49,23.66,6.17,30.47,4.86,8.99,9.48,17.46,2.42,47.21Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lateral-hamstrings": [
      {"type":"path","d":"M462.79,809.31c-.49,2.13-.7,4.35-.74,6.73v.02c-3.72,15.06-9.39,31.33-16.59,32.16-.49.05-.97.04-1.46-.05-17.58-11.07-34.3-118.65-38.34-208.34,8.81-2.8,18.52-7.96,25.24-17.47,5.36-7.61,8.12-16.91,8.23-27.83.07-.07.13-.19.13-.3v-.12c-.04-.14-.07-.28-.11-.42v-.02c-.02-9.37-1.97-19.96-5.81-31.64-1.68-5.07-3.01-9.83-4.31-14.41-4.15-14.76-7.47-26.5-18.25-34.28,16.88,8.13,36.59,22.95,38.13,37.32v.04c.04,1.5-.05,2.73-.13,3.88-.29,4.13-.52,7.71,4.01,20.48,9.17,25.92,34.05,145.48,10.02,234.25Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M268.88,639.82c-.9,20.22-2.46,41.35-4.51,62.07-7.09,71.22-20.2,137.7-33.81,146.29-.49.11-.97.11-1.46.05-7.2-.84-12.85-17.05-16.59-32.09v-.02c-.04-2.41-.25-4.67-.74-6.82-24.03-88.74.85-208.31,10.02-234.23,4.53-12.77,4.28-16.35,4.01-20.48-.09-1.17-.16-2.41-.13-3.95t0-.04c1.59-14.36,21.28-29.12,38.13-37.27-10.8,7.8-14.1,19.54-18.25,34.3-1.3,4.58-2.64,9.34-4.31,14.41-3.86,11.68-5.79,22.25-5.81,31.64v.02c-.04.14-.07.28-.11.42,0,.04-.02.09-.02.12,0,.12.05.25.14.33.11,10.9,2.85,20.18,8.23,27.79,6.72,9.5,16.41,14.67,25.22,17.46Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "inner-thigh": [
      {"type":"path","d":"M366.62,646.55c-1.66,1.82-2.33,4.29-2.08,7.54,1.28,16.39-2.46,23.3-6.08,30-4.15,7.68-8.14,15.01-5.02,35.1-.78-2.99-1.55-6.05-2.31-9.2-7.17-29.61-8.41-43.95-9.87-60.55-.56-6.54-1.16-13.22-2.13-21.25,1.35,3.83,3.34,6.91,5.96,9.27,5.78,5.23,14.08,6.56,23.49,6.56.76,0,1.52,0,2.27-.04-1.66.56-3.12,1.38-4.22,2.57Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M335.39,628.29c-.96,7.99-1.53,14.64-2.11,21.15-1.44,16.6-2.71,30.94-9.88,60.55-.76,3.15-1.53,6.21-2.29,9.2,3.12-20.1-.87-27.42-5.02-35.1-3.63-6.7-7.38-13.61-6.08-30,.25-3.25-.43-5.72-2.08-7.54-1.1-1.19-2.55-2.01-4.22-2.57.76.04,1.52.04,2.27.04,9.39,0,17.71-1.33,23.49-6.56,2.6-2.33,4.57-5.39,5.92-9.16Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "gastrocnemius": [
      {"type":"path","d":"M437.08,993.71v.02c-.45,1.98-.7,4.48-.99,7.21-.97,9.23-2.18,20.73-11.43,22.6-3.54.72-14.3,2.9-24.06-21.92t-.02-.04c-3.14-9.9-3.45-23.56,1.23-66.8v-.02s.02-.04.02-.05c0-.12.02-.25.02-.35,0-.04,0-.07.02-.11.11-1.05.23-2.12.36-3.2,0-.04,0-.07.02-.11v-.09c1.23-6.98,4.84-12.24,10.25-14.73,5.85-2.69,13.07-1.75,18.88,2.43.49.35.97.63,1.46.84,8.07,6.96,7.11,46.03,4.24,74.3Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M273.97,1001.58s-.02.02-.02.04c-9.77,24.82-20.53,22.65-24.06,21.92-9.26-1.87-10.45-13.36-11.43-22.6-.29-2.73-.54-5.23-.99-7.21v-.04c-2.87-28.25-3.83-67.27,4.21-74.26.51-.21,1.01-.51,1.5-.86,5.8-4.18,13.03-5.12,18.88-2.43,5.49,2.52,9.13,7.91,10.29,15.04v.02c.16.91.27,1.85.32,2.83,0,.05.02.09.02.14v.05c0,.05.02.12.02.18,0,.1.02.21.02.31,0,.05.02.12.04.17,4.66,43.17,4.35,56.81,1.21,66.69Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "soleus": [
      {"type":"path","d":"M486.85,965.01v.02c-1.55,28.28-4.96,54.55-19.32,55.39-.18,0-.34.02-.51.02-5.11,0-9.26-4.48-12.78-10.09.04-.11.02-.21-.04-.3-10.24-16.93-21.77-77.59-5.51-96.42.04-.05.07-.11.07-.16,1.91-1.66,3.85-3.48,5.76-5.28,6.03-5.7,11.73-11.07,15.92-9.95,1.81.47,3.27,2.13,4.42,5.05.31.89.6,1.8.92,2.73.02.05.04.09.05.14,5,15.06,10.54,33.11,10.99,58.85Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M220.34,1010.05c-.05.09-.07.19-.04.28-3.65,5.81-7.96,10.41-13.29,10.09-14.35-.84-17.76-27.11-19.32-55.39v-.02c.45-25.75,5.99-43.8,10.99-58.85.02-.05.04-.09.05-.14.32-.93.61-1.84.92-2.73,1.16-2.92,2.62-4.58,4.42-5.05,4.17-1.12,9.89,4.25,15.92,9.95,1.91,1.8,3.83,3.6,5.74,5.26.02.07.04.12.07.18,16.28,18.84,4.73,79.49-5.49,96.42Z","fill":"#EBEBEB","sw":"1"} 
    ]
  },
  "femaleFront": {
    "upper-trapzeius": [
      {"type":"path","d":"M430.05,221.72c-4.47.56-10.63,1.36-19.08,2.46-1.17.14-2.11.83-2.41,1.74-.07.25-.11.49-.07.74-4.46-3.01-9.37-4.65-20.71-4.98h-.07c-1.95-.07-3.85-.12-5.71-.12-3.15-.51-5.26-4.82-6.3-32.98,1.65,3.73,5.28,8.68,7.6,11.86.67.9,1.22,1.64,1.59,2.18,2.06,2.99,36.01,16.67,45.17,19.09Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M300.92,188.55c-1.06,28.19-3.17,32.5-6.32,33.01-1.87,0-3.8.05-5.76.12-11.36.33-16.27,1.97-20.73,4.98.04-.25.02-.49-.07-.74-.3-.92-1.24-1.6-2.39-1.74-8.45-1.11-14.6-1.9-19.08-2.46,9.15-2.43,43.09-16.1,45.17-19.09.37-.55.93-1.3,1.57-2.2,2.33-3.17,5.98-8.15,7.61-11.88Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "upper-pectoralis": [
      {"type":"path","d":"M470.97,287.52c-.28-.07-.54-.14-.8-.21-.35-.11-.72-.21-1.06-.32-.56-.18-1.06-.3-1.54-.42-.13-.02-.24-.05-.37-.09-40.81-11.6-56.28-23.72-71.27-35.46-10.6-8.31-21.56-16.88-41.35-25.15,6.13-2.04,14.84-3.5,27.21-3.45.33.05.69.07,1.06.07,1.19,0,2.32,0,3.39.04h.15c.43,0,.85.02,1.28.04h.06c14.3.44,18.14,2.94,24.03,7.67.02.02.06.04.07.05,11.23,9.8,31.88,28.72,59.13,57.23Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M321.99,225.89c-19.79,8.27-30.72,16.84-41.31,25.13-14.99,11.74-30.46,23.86-71.27,35.46-.11.03-.24.05-.35.09-.69.16-1.45.37-2.28.63-.11.04-.22.07-.33.11-.26.07-.52.14-.8.21,27.23-28.49,47.91-47.41,59.14-57.23,5.93-4.77,9.73-7.29,24.12-7.73h.04c.39-.02.76-.04,1.13-.04,1.17-.02,2.39-.04,3.69-.04.37,0,.72-.02,1.07-.07,12.34-.04,21.03,1.41,27.16,3.47Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "mid-lower-pectoralis": [
      {"type":"path","d":"M461.15,285.62c-5.26-.35-11.23.92-17.4,7.2-4.91,5-8.43,10.19-11.54,14.76-2.52,3.71-4.85,7.15-7.58,10.05-.06.04-.07.07-.15.14l-.02.02c-2.76,2.87-5.93,5.21-10.1,6.65-9.73,3.38-44.11-.12-62.69-12.42-8.36-5.54-12.6-12.14-12.6-19.59v-50.07c0-4.05,1.74-7.76,5.02-10.75,1.96-1.8,4.89-3.7,9.24-5.3,20.23,8.34,31.31,17,42,25.39,14.32,11.23,29.09,22.79,65.8,33.91Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M337.53,242.36v50.07c0,7.44-4.24,14.04-12.6,19.59-18.58,12.3-52.98,15.82-62.69,12.42-4.21-1.46-7.37-3.8-10.17-6.71,0-.02-.06-.09-.07-.11-.02,0-.02-.02-.04-.02-2.72-2.9-5.04-6.32-7.56-10.03-3.11-4.58-6.63-9.77-11.54-14.76-6.15-6.27-12.26-7.51-17.51-7.16,36.79-11.14,51.58-22.72,65.9-33.95,10.71-8.39,21.79-17.05,42.02-25.39,4.34,1.6,7.26,3.5,9.24,5.3,3.28,2.99,5.02,6.71,5.02,10.75Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "anterior-deltoid": [
      {"type":"path","d":"M475.01,289.19c-.7-.32-1.37-.6-2-.84-27.96-29.35-49.17-48.75-60.58-58.73-.91-.81-1.78-1.55-2.56-2.24-.43-.37-.56-.77-.43-1.2.19-.58.85-1.04,1.65-1.14,9.93-1.3,16.67-2.16,21.27-2.73,36.81,23.04,39.26,41.39,42.33,64.6l.32,2.27Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M267.17,226.19c.13.42-.02.83-.43,1.2-.78.67-1.63,1.41-2.56,2.24-11.41,9.96-32.62,29.39-60.6,58.73l-.02.02c-.63.25-1.28.53-1.96.83l.3-2.27c3.09-23.21,5.54-41.57,42.35-64.6,4.58.56,11.34,1.43,21.27,2.73.8.11,1.45.56,1.65,1.14Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lateral-deltoid": [
      {"type":"path","d":"M516.43,326.32c-14.58-19.32-27.27-29.42-36.63-34.7-.04-.11-.13-.19-.24-.25-.09-.04-.19-.04-.28-.02-1.15-.65-2.26-1.21-3.3-1.71l-.37-2.83c-3.09-23.27-5.54-41.67-41.87-64.67,3.98-.48,6.06-.7,7.11-.83.07,0,.13-.02.2-.02.22-.02.46-.04.7-.05.07,0,.13,0,.2-.02,8.48-.51,20.25.58,30.05,11.84,11.45,13.53,17.53,33.44,22.42,49.42,1.76,5.72,3.41,11.14,5.06,15.36,2.39,6.07,4.91,9.71,8.08,14.34,1.83,2.66,3.91,5.67,6.26,9.61.93,1.57,1.78,3.04,2.59,4.52Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M242.86,222.14c-36.33,23-38.78,41.41-41.87,64.67l-.39,2.85c-1.04.49-2.13,1.04-3.28,1.69-.09-.02-.19-.02-.28.02-.13.05-.22.16-.24.26-9.36,5.26-22.05,15.36-36.63,34.69.82-1.48,1.67-2.96,2.59-4.52,2.35-3.94,4.43-6.95,6.26-9.61,3.17-4.63,5.69-8.27,8.06-14.34,1.67-4.24,3.32-9.64,5.08-15.36,4.89-16,10.97-35.88,22.42-49.42,9.78-11.28,21.56-12.34,30.05-11.84.07,0,.15.02.22.02.07.02.13.02.2.02.17.02.33.04.48.04.07,0,.13.02.2.02,1.06.12,3.13.35,7.11.83Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "short-head-bicep": [
      {"type":"path","d":"M526.92,392.93c-.52,1.94-1.87,3.43-4.04,4.47-6.67-1.81-14.64-6.71-21.99-13.87-7.43-11.1-18.19-26.31-30.7-40.19-18.95-21.07-24.01-33.31-24.31-34.05v-.05s0-.02-.02-.02c-1.7-8.64-.7-14.92,2.95-18.62.87-.88,1.85-1.57,2.91-2.11,9.89.39,16.97,12.3,28.55,31.8,1.19,1.99,2.41,4.06,3.71,6.21.43.72.85,1.44,1.3,2.18,4.71,7.6,10.84,15.63,17.51,24.34,6.74,8.78,13.71,17.86,20.38,28.02.02.05.04.12.07.16,0,0,.07.09.19.25.09.16.24.35.41.62.07.09.13.19.2.3,1.35,2.11,3.87,6.74,2.89,10.58Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M230.74,309.22s-.02.02-.02.04c-.06.12-4.84,12.46-24.31,34.09-12.47,13.87-23.21,29.02-30.64,40.12-7.36,7.2-15.36,12.11-22.05,13.94-2.17-1.04-3.54-2.53-4.04-4.47-1-3.84,1.54-8.46,2.89-10.58.07-.11.13-.21.2-.3.13-.21.28-.42.41-.62.11-.16.19-.25.19-.25.04-.04.06-.11.07-.16,6.67-10.15,13.64-19.24,20.36-28.03,6.67-8.69,12.82-16.72,17.51-24.32.44-.74.89-1.46,1.32-2.18,1.28-2.15,2.52-4.22,3.71-6.21,11.58-19.5,18.66-31.41,28.55-31.8,1.06.55,2.04,1.23,2.91,2.11,3.63,3.7,4.63,9.93,2.95,18.62Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "long-head-bicep": [
      {"type":"path","d":"M534.5,396.35c-2.48,1.92-6.1,2.32-10.32,1.39,1.91-1.14,3.13-2.67,3.63-4.59,1.07-4.17-1.54-9.01-2.98-11.23v-.02c-.2-.3-.39-.6-.61-.9-6.76-10.33-13.84-19.57-20.67-28.51-6.65-8.68-12.78-16.68-17.45-24.25-.44-.72-.87-1.46-1.3-2.16-7-11.95-10.02-22.83-5.22-33.56,1,.56,2.06,1.2,3.13,1.88,9.13,5.84,20.92,16.12,34.31,34.23,1.48,2.04,2.91,4.12,4.26,6.23.02.05.06.09.07.14,1.22,2.06,2.54,4.28,4.11,6.74.02.02.02.04.02.04.02.02.04.05.04.07.02.04.04.07.07.11.15.26.3.51.44.77,20.62,36.45,14.17,49.24,8.47,53.62Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M191.82,326.08c-.43.7-.85,1.44-1.3,2.16-4.67,7.57-10.8,15.57-17.45,24.25-6.76,8.83-13.76,17.99-20.45,28.19l-.22.32c-.09.11-.15.19-.22.3-.13.19-.26.4-.39.6-1.45,2.22-4.08,7.06-3,11.25.5,1.92,1.72,3.47,3.65,4.59-4.22.92-7.84.53-10.34-1.39-5.69-4.38-12.15-17.18,8.48-53.62.17-.28.32-.58.5-.86.02-.04.04-.05.06-.09,0,0,0-.02.02-.04,1.63-2.55,2.98-4.84,4.22-6.95,0-.02.02-.02.02-.03,1.33-2.08,2.74-4.12,4.19-6.12.04-.02.06-.05.07-.07,14.93-20.22,27.9-30.66,37.39-36.04,4.8,10.73,1.78,21.61-5.22,33.56Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-flexors": [
      {"type":"path","d":"M624.81,492.73c-4.46,4.28-11.1,4.45-16.27,3.73-3.08-2.57-6.69-5.4-10.73-8.5-1.46-1.11-2.98-2.27-4.61-3.48-12.23-9.22-28.96-21.84-55.32-48.85-3.91-4.01-5.43-5.7-7.19-7.66-1.04-1.16-2.17-2.41-3.93-4.29-3.98-4.28-6.08-7.15-8-10.12-.83-1.3-1.65-3.01-2.59-4.98-1.5-3.08-3.35-6.9-6.15-11.1-.63-.92-1.46-2.22-2.52-3.84-1.26-1.95-2.78-4.31-4.54-6.97,8.89,7.83,18.38,12.37,25.4,12.37,2.65,0,4.95-.65,6.72-2.01.98-.76,1.96-1.72,2.87-3.03,6.69,7.36,13.41,14.31,20.53,21.65,18.42,19.01,39.29,40.55,66.32,77.08Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M173.68,386.63c-1.78,2.69-3.32,5.05-4.59,7.02-1.04,1.62-1.89,2.9-2.5,3.82-2.82,4.21-4.67,8.04-6.15,11.12-.94,1.95-1.78,3.66-2.61,4.96-1.91,2.99-4,5.84-7.98,10.12-1.76,1.88-2.89,3.15-3.93,4.29-1.78,1.95-3.3,3.66-7.19,7.66-26.38,27.03-43.11,39.65-55.34,48.85-1.61,1.21-3.15,2.38-4.59,3.48-4.02,3.08-7.65,5.93-10.71,8.48l-.02.02c-5.11.72-11.78.56-16.27-3.73,27.03-36.53,47.91-58.07,66.32-77.08,7.11-7.34,13.84-14.29,20.53-21.65.91,1.3,1.89,2.27,2.87,3.03,1.78,1.36,4.08,2.01,6.72,2.01,7.04,0,16.54-4.54,25.44-12.41Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-extensors": [
      {"type":"path","d":"M138.15,393.22c-6.74,7.44-13.52,14.45-20.71,21.86-18.4,18.99-39.26,40.51-66.27,77.01-3.96-4.31-4.63-10.31-4.45-14.68,0-.23-.17-.4-.39-.44,6.74-11.98,20.43-36.06,35.29-57.74,9.3-13.57,17.3-20.2,25.77-27.24,9.32-7.73,19.86-16.49,34.03-36.04,1.52-2.09,2.89-4.03,4.15-5.84-12.41,24.5-11.19,36.9-7.43,43.12Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M629.89,477.41c.17,4.36-.48,10.37-4.45,14.68-27.01-36.5-47.87-58.02-66.29-77.03-7.17-7.41-13.95-14.4-20.69-21.84,3.76-6.23,4.98-18.6-7.39-43.05,1.24,1.78,2.63,3.71,4.11,5.77,14.15,19.55,24.71,28.32,34.03,36.04,8.47,7.04,16.47,13.67,25.75,27.24,14.88,21.68,28.57,45.76,35.29,57.74-.22.04-.39.21-.37.44Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "upper-abdominals": [
      {"type":"path","d":"M389.27,353.09c1.33-4.75,2.2-7.9.7-11.7-2.78-6.95-12.06-11.53-19.84-14.75-4.5-1.85-19.71-7.55-26.99-3.03-2.56,1.6-3.85,4.35-3.85,8.2,0,.23-.17.4-.41.42-.02.02-.06.02-.07.02-.04.02-.07.02-.11.02h-.78s-.07,0-.11-.02c-.02,0-.06,0-.07-.02-.22,0-.43-.19-.43-.42,0-3.85-1.28-6.6-3.84-8.2-7.28-4.52-22.51,1.18-26.99,3.03-7.78,3.22-17.08,7.8-19.84,14.75-1.5,3.8-.63,6.95.69,11.7,1.3,4.63,3.08,11,3.45,21.08.09,2.52.04,3.71-.02,5.35-.09,1.81-.19,4.29-.15,9.89.02,3.91.28,12.25.67,22.84,2.74.95,9.04,1.16,9.47,1.18h.02l1.32.02c13.41.25,26.07.48,32.59-3.64,3.15-1.99,2.98-7.13,2.76-13.62-.06-1.72-.11-3.52-.11-5.39,0-.23.22-.44.46-.44.26,0,.46.21.46.44,0,1.28.02,2.52.07,3.73.04-1.21.06-2.45.06-3.73,0-.23.22-.44.46-.44.26,0,.46.21.46.44,0,1.87-.06,3.66-.11,5.39-.2,6.49-.37,11.63,2.78,13.62,6.52,4.12,19.19,3.89,32.59,3.64l1.32-.02h.02c.43-.02,6.69-.23,9.45-1.18.39-10.59.67-18.94.69-22.84.04-5.6-.07-8.08-.15-9.89-.07-1.65-.11-2.83-.04-5.35.39-10.08,2.15-16.45,3.45-21.08ZM337.77,380.23c-.24,0-.46-.19-.46-.44,0-5.56-.57-10.66-7.58-12-6.54-1.23-14.49,1.11-19.23,2.5l-1.11.33c-.24.07-.52-.07-.59-.3-.07-.23.07-.48.32-.55l1.11-.33c4.84-1.43,12.91-3.8,19.67-2.52,7.71,1.46,8.34,7.16,8.34,12.86,0,.25-.2.44-.46.44ZM332.3,362.28c-12.62-.28-21.21,2.2-33.88,6.32-.06.02-.11.04-.15.04-.2,0-.39-.12-.44-.3-.09-.23.04-.49.28-.56,12.78-4.15,21.45-6.65,34.2-6.37,5-.02,5-8.85,5-18.2,0-.25.22-.44.46-.44.26,0,.46.19.46.44,0,9.8,0,19.06-5.93,19.08ZM367.23,370.62l-1.11-.33c-4.74-1.39-12.69-3.73-19.23-2.5-7,1.34-7.6,6.44-7.6,12,0,.25-.2.44-.46.44-.24,0-.46-.19-.46-.44,0-5.7.65-11.4,8.34-12.86,6.78-1.28,14.86,1.09,19.69,2.52l1.11.33c.24.07.37.32.3.55-.07.23-.33.37-.57.3ZM378.34,368.63s-.09-.02-.15-.04c-12.67-4.12-21.3-6.6-33.87-6.32-5.97-.02-5.97-9.27-5.97-19.08,0-.25.22-.44.46-.44.26,0,.46.19.46.44,0,9.34,0,18.18,5.02,18.2,12.73-.28,21.4,2.22,34.18,6.37.24.07.37.33.3.56-.07.18-.24.3-.44.3Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lower-abdominals": [
      {"type":"path","d":"M375.88,414.32l-1.32.02c-3.15.07-6.24.12-9.23.12-9.93,0-18.69-.63-23.9-3.91-2.04-1.3-2.85-3.61-3.13-6.6-.3,3.01-1.11,5.3-3.15,6.6-5.19,3.27-13.95,3.91-23.88,3.91-2.98,0-6.1-.05-9.23-.12l-1.32-.02h-.02c-.26-.02-6.3-.19-9.41-1.13.78,19.99,2.04,47.57,3.22,68.4,2.85,49.89,30.75,92.87,43.24,92.87.02,0,.06,0,.07.02.02-.02.06-.02.07-.02h.78s.06,0,.07.02c.02-.02.04-.02.06-.02,12.51,0,40.41-42.98,43.26-92.87,1.19-20.82,2.43-48.4,3.2-68.39-3.13.93-9.13,1.09-9.41,1.11ZM346.64,416.9c6.82-.11,14.01.74,20.79,1.62.24.02.43.25.39.49-.04.23-.26.4-.52.37-6.74-.86-13.88-1.69-20.64-1.6-6.3.09-7.37,4.17-7.37,13.27,0,.25-.2.44-.46.44-.24,0-.46-.19-.46-.44,0-8.22.59-14.03,8.28-14.15ZM309.18,418.52c6.78-.88,13.99-1.71,20.79-1.62,7.67.12,8.26,5.93,8.26,14.15,0,.25-.2.44-.46.44-.24,0-.46-.19-.46-.44,0-9.1-1.06-13.18-7.35-13.27-6.78-.11-13.91.74-20.64,1.6-.26.04-.5-.14-.52-.37-.04-.25.13-.48.39-.49ZM301.63,461.09c.02-.25.22-.42.46-.42h.02c5,.19,8.48.48,11.56.7,4.98.4,8.91.7,16.51.48,6.08-.51,7.13-3.29,7.13-18.64,0-.23.22-.44.46-.44.26,0,.46.21.46.44,0,15.05-.93,18.92-8,19.5-1.89.07-3.54.09-5.06.09-4.63,0-7.8-.25-11.6-.55-3.06-.25-6.52-.51-11.5-.7-.26-.02-.44-.21-.44-.46ZM339.08,560.72c0,.25-.2.44-.46.44-.13,0-.22-.04-.31-.11-.09.07-.19.11-.32.11-.26,0-.46-.19-.46-.44v-66.52c0-.25.2-.44.46-.44.13,0,.22.04.32.11.09-.07.18-.11.31-.11.26,0,.46.19.46.44v66.52ZM367.36,467.73c-5.26-.14-19.16,1.39-23.94,2.6-4.35,1.11-4.35,6.95-4.34,12.6v.77c0,.25-.2.44-.46.44-.13,0-.22-.04-.31-.12h-.02c-.07.09-.19.12-.3.12-.26,0-.46-.19-.46-.44v-.77c0-5.65.02-11.49-4.34-12.6-4.8-1.21-18.64-2.73-23.94-2.6-.28.02-.46-.18-.48-.42,0-.25.2-.44.46-.46,5.43-.12,19.25,1.37,24.19,2.64,3.45.86,4.52,4.15,4.87,7.97.35-3.82,1.45-7.11,4.87-7.97,4.95-1.27,18.79-2.76,24.2-2.64.26.02.46.21.44.46,0,.25-.19.44-.46.42ZM374.54,461.55c-4.98.19-8.45.46-11.52.7-3.78.3-6.97.55-11.6.55-1.5,0-3.15-.02-5.02-.07-7.1-.6-8.04-4.47-8.04-19.52,0-.23.22-.44.46-.44.26,0,.46.21.46.44,0,15.35,1.07,18.13,7.17,18.64,7.58.23,11.5-.07,16.49-.48,3.08-.23,6.56-.51,11.54-.7.31.02.48.18.5.42,0,.25-.2.44-.44.46Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "obliques": [
      {"type":"path","d":"M444.98,309.36v.05c-.52,1.41-4.15,12.34-4.93,15.49-.07.35-.24,1.02-.44,1.95-5.26,22.68-9.06,36.78-11.32,41.88-2.95,6.63-5.91,20.8-7.5,28.4-.48,2.24-.82,3.85-.96,4.35-.69,2.29-2.06,21.08-.17,30.64,1,5.07,5.54,16.65,10.36,28.9,4.56,11.63,9.28,23.67,11.97,32.47.35,1,.76,1.92,1.19,2.92-.61.28-1.24.55-1.91.76-.04.02-.09.04-.13.04-.94.28-1.93.55-2.93.83-.09.02-.17.04-.26.05-3.35.74-7.3,1-11.8.79-28.96-1.34-31.92-26.2-32.46-51.58-.54-24.5-2.59-42.5-4.09-55.65-2.83-24.81-4-35.09,8.89-47.04,15.19-14.08,22.69-21.45,26.71-26.24,0,0,.02-.04.04-.05s.04-.05.04-.05c.06-.05.07-.09.11-.16,2.76-2.9,5.09-6.35,7.61-10.03,3.08-4.56,6.6-9.71,11.43-14.66,1.06-1.07,2.11-2.01,3.17-2.8-3.43,3.98-4.3,10.29-2.61,18.74Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M287.03,391.65c-1.5,13.15-3.56,31.15-4.09,55.65-.56,25.38-3.5,50.24-32.46,51.58-4.43.21-8.34-.04-11.67-.76-.09-.02-.17-.04-.26-.07-1.13-.3-2.24-.6-3.32-.92h-.02c-.63-.21-1.2-.46-1.78-.72.44-1,.83-1.92,1.2-2.94,2.67-8.78,7.39-20.82,11.97-32.45,4.82-12.25,9.36-23.83,10.36-28.9,1.89-9.57.52-28.35-.17-30.64-.15-.49-.48-2.11-.96-4.35-1.59-7.6-4.56-21.77-7.5-28.4-2.26-5.09-6.06-19.16-11.3-41.81-.22-.97-.39-1.65-.46-2.02-.76-3.17-4.46-14.17-4.91-15.5,1.67-8.48.8-14.78-2.63-18.76,1.04.79,2.09,1.71,3.15,2.78,4.85,4.95,8.36,10.1,11.45,14.64,2.54,3.71,4.87,7.18,7.65,10.1,0,.02.04.03.04.03,0,.05.04.09.07.12,4.06,4.84,11.56,12.21,26.75,26.29,12.89,11.95,11.73,22.21,8.89,47.04Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "outer-quadricep": [
      {"type":"path","d":"M463.26,770.49c-.26,3.08-.52,6.12-.76,9.06v.03c-1.93,19.45-5.95,39.61-12.17,42.45-1.3.58-2.61.39-4.08-.6-.07-.05-.17-.11-.24-.16,0-.12-.07-.23-.19-.3-21.95-13.74-17.58-48.54-10.99-101.19,6.52-52,15.47-123.19,1.26-206.38,0,0,0-.03-.02-.11-.02-.09-.02-.19-.04-.28l-.02-.02v-.05c-.07-.42-.19-1.04-.3-1.51,2.95-3.64,6.28-6.6,10.06-8.69,1.26,3.4,2.76,8.17,4.63,15.57.18.53,18.6,52.74,20.73,89.19,1.89,32.24-3.33,107.23-7.89,162.98Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M230.76,820.98c-.11.07-.19.19-.19.32-.07.04-.15.09-.22.14-1.46.99-2.8,1.18-4.08.6-6.19-2.8-10.19-22.63-12.13-41.92,0-.11-.02-.21-.02-.32,0-.04,0-.09-.02-.12,0-.04,0-.07-.02-.11,0-.05,0-.12-.02-.18,0-.11-.02-.19-.02-.3-.22-2.8-.44-5.65-.7-8.61-4.56-55.75-9.78-130.74-7.89-162.98,2.13-36.45,20.55-88.66,20.73-89.22,1.87-7.39,3.39-12.14,4.63-15.54,3.78,2.09,7.11,5.05,10.06,8.69-.11.48-.22,1.09-.3,1.51v.05l-.02.02c-.02.09-.02.19-.04.28-.02.07-.02.11-.02.11-14.21,83.19-5.26,154.39,1.24,206.38,6.61,52.65,10.99,87.45-10.99,101.19Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "rectus-femoris": [
      {"type":"path","d":"M280.49,828.3c.19.49.61,1.58.87,2.08-4.84,14.36-11.36,27.75-18.73,26.78-8.74-1.18-11.04-11.63-13.26-21.75-1.72-7.83-3.33-15.22-8.1-17-1.7-.63-3.71-.51-6.04.39,17.91-15.63,13.67-49.49,7.45-99.11-6.5-51.93-15.43-123.06-1.26-206.13,0,0,.09-.56.2-1.16,15.95,20.77,20.64,62.44,24.84,99.96,1.78,15.86,3.46,30.85,5.87,43.24,1.45,7.43,2.83,13.87,4.19,19.46-.15.09-.22.26-.19.44,10.06,44.22,5.76,70.43,1.95,93.53-3.22,19.62-6,36.55,2.11,59.02,0,0,.02.04.04.11.02.04.04.09.06.14Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M441.4,818.81c-2.35-.92-4.35-1.04-6.06-.4-4.76,1.78-6.37,9.17-8.1,17-2.22,10.12-4.52,20.57-13.28,21.75-.26.04-.52.05-.76.05-7.06,0-13.32-12.95-17.97-26.8.28-.49.74-1.69.91-2.16.02-.04.04-.07.04-.09.02-.07.04-.11.04-.11,8.1-22.47,5.34-39.4,2.09-59.02-3.8-23.11-8.1-49.31,1.96-93.53.04-.16-.04-.33-.19-.42,1.33-5.6,2.74-12.05,4.19-19.48,2.41-12.39,4.09-27.36,5.87-43.24,4.21-37.52,8.89-79.19,24.84-99.96.04.26.09.51.13.7.04.26.07.46.07.46,14.17,83.06,5.24,154.2-1.26,206.13-6.22,49.64-10.49,83.5,7.47,99.13Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "inner-quadricep": [
      {"type":"path","d":"M296.46,753.56s0,.04-.02.05c-2.61,14.73-4.85,30.53-6.47,43.68,0,.07-.02.16-.04.23-.41,2.02-3.41,17.09-8.15,31.59-.2-.51-.41-1.07-.52-1.36,0-.02-.02-.04-.04-.05-7.98-22.24-5.22-39.05-2.02-58.53,3.3-20.04,7.32-44.52.44-82.15,5.45,18.92,9.86,24.29,12.84,27.91,4.15,5.05,5.72,6.99,3.96,38.63Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M395.39,827.7s-.04.04-.04.05c-.11.28-.32.84-.52,1.37-4.63-14.1-7.6-28.77-8.13-31.41-.02-.04-.02-.05-.02-.09-.02-.09-.02-.18-.04-.26,0-.02,0-.05-.02-.07-1.57-13.13-3.83-28.93-6.45-43.63-.02-.02-.02-.05-.02-.07-1.78-31.68-.2-33.61,3.96-38.66,2.98-3.64,7.39-9.01,12.86-28.03-6.91,37.7-2.87,62.21.43,82.27,3.19,19.48,5.97,36.29-2.02,58.53Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "inner-thigh": [
      {"type":"path","d":"M445.46,501.9c-25.42,13.97-31.16,65.15-36.24,110.36-1.78,15.84-3.45,30.8-5.87,43.17-8.84,45.37-15.8,53.89-19.97,58.95-3.96,4.84-5.67,6.92-4.5,32.29-1.69-8.83-3.52-17.04-5.41-23.72-8.47-29.85-17.21-75.11-19.27-91.93-2.07-16.88-11.89-21.22-15.1-21.65.17-5.98,4.41-10.07,11.38-16.68,10.13-9.66,27.09-25.83,46.17-63.02,11.65-22.72,27.71-27.03,40.61-30.48.33-.09.65-.18.96-.26.04,0,.07-.02.11-.04.83-.16,1.63-.37,2.39-.63.22-.07.43-.12.65-.19.76-.21,1.5-.44,2.24-.67.54,1.25,1.17,2.66,1.85,4.51Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M337.51,609.37c-3.22.42-13.02,4.77-15.1,21.65-2.06,16.82-10.8,62.09-19.27,91.93-1.89,6.69-3.72,14.89-5.41,23.72,1.17-25.38-.54-27.45-4.5-32.29-4.17-5.07-11.15-13.59-19.99-58.95-2.41-12.37-4.08-27.33-5.85-43.17-5.08-45.19-10.82-96.37-36.24-110.36.69-1.85,1.3-3.26,1.85-4.51.74.23,1.48.46,2.24.67.22.07.43.12.65.19.78.21,1.57.42,2.39.63.04.02.07.04.11.04.32.09.63.18.96.26,12.89,3.45,28.94,7.76,40.61,30.48,19.06,37.18,36.03,53.36,46.17,63.02,6.97,6.62,11.21,10.7,11.38,16.68Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "gastrocnemius": [
      {"type":"path","d":"M447.33,1108.8c-3.37-.97-6.76-2.75-9.99-5.51-.04-.04-.07-.05-.11-.07.69-12.79-3.24-36.29-7.37-60.91-2.67-16-5.45-32.54-7.13-47.16-.65-2.55-1.67-5.21-2.85-8.29-5.04-13.15-13.43-35-7.84-89.33,3.54,8.18,10.45,12.27,20.99,12.42.8,8.92,1.57,17.26,2.32,25.45,3.96,43.17,7.41,82.24,11.99,173.4Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M256.74,986.86c-1.19,3.08-2.2,5.74-2.87,8.34-1.69,14.57-4.45,31.13-7.13,47.13-4.11,24.62-8.04,48.1-7.36,60.89-.04,0-.09.04-.13.07-3.21,2.76-6.6,4.54-9.97,5.51,4.58-91.16,8.02-130.23,11.99-173.4.74-8.18,1.52-16.52,2.32-25.45,10.52-.16,17.43-4.26,20.99-12.42,5.59,54.33-2.8,76.18-7.84,89.33Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "soleus": [
      {"type":"path","d":"M475.1,1016.42c-.44,2.75-9.58,58.95-6.04,88.04-2.04,1.57-4.39,2.87-6.91,3.78-.33-34.53.11-61.89.5-84.56.69-39.12,1.22-70.02-2.74-123.01,0-.05-.02-.11-.04-.16,1.98-3.04,3.39-7.16,3.84-12.81.57-7.48,5-10.59,8.47-12.78,7.65,23.92,15.56,59.06,2.93,141.49Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M216.7,900.68c-3.96,52.99-3.43,83.89-2.76,123.03.41,22.65.85,50.01.52,84.54-2.54-.92-4.89-2.22-6.93-3.8,3.56-29.07-5.58-85.28-6.02-88.03-12.63-82.43-4.72-117.57,2.93-141.49,3.46,2.18,7.87,5.3,8.47,12.78.44,5.67,1.85,9.78,3.83,12.83-.02.03-.04.09-.04.14Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "tibialis": [
      {"type":"path","d":"M461.73,1023.67c-.39,22.72-.83,50.19-.48,84.88-4.02,1.27-8.47,1.58-12.97.49-4.59-91.39-8.04-130.49-12-173.71-.76-8.17-1.54-16.49-2.32-25.36,1.72-.02,3.5-.12,5.41-.32l1.24-.14c5.78-.6,13.52-1.41,18.45-7.83,3.89,52.37,3.35,83.12,2.67,121.99Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M242.66,909.97c-.8,8.87-1.57,17.19-2.32,25.36-3.96,43.22-7.41,82.33-12,173.71-4.5,1.09-8.95.79-12.97-.49.35-34.69-.09-62.14-.5-84.86-.67-38.87-1.2-69.62,2.69-121.99,4.93,6.41,12.67,7.22,18.43,7.81l1.26.14c1.89.19,3.69.3,5.41.32Z","fill":"#EBEBEB","sw":"1"} 
    ]
  },
  "femaleBack": {
    "upper-trapezius": [
      {"type":"path","d":"M434.28,199.45c-.36.02-.72.04-1.07.05-4.54.26-8.5.49-11.86,1.4-.11-.02-.24.02-.31.09-2.01.57-3.8,1.38-5.39,2.62-1.01.78-1.61,1.45-2.26,2.16-.74.81-1.52,1.64-2.98,2.79-1.59,1.22-3.05,2.07-4.39,2.69h-.02c-.11-.02-.27-.05-.51-.07-5.4-.8-42.75-6.18-64.8-6.68-1.07-.02-2.1-.04-3.09-.04-20.14,0-59.45,6.29-65.2,7.24-.22.02-.38.05-.49.07-.45-.18-.89-.35-1.34-.49h-.02c-1.34-.62-2.84-1.48-4.45-2.72-1.48-1.15-2.24-1.98-2.98-2.79-.65-.71-1.25-1.38-2.26-2.14-1.59-1.24-3.4-2.07-5.4-2.63-.02,0-.02-.02-.02-.02-.07-.05-.16-.09-.25-.07-3.38-.9-7.34-1.13-11.88-1.4-.34-.02-.71-.04-1.07-.05,7.88-2.76,36.88-15.36,50.4-21.79.04,0,.05-.02.09-.02.13-.05,7.57-3.34,18.26-6.13,8.3-1.48,20.14-3,33.91-3.62,20.52,1.68,38.67,9.67,38.88,9.75.02,0,.05.02.09.02,13.52,6.45,42.53,19.03,50.4,21.79Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "traps-middle": [
      {"type":"path","d":"M404.29,211.89c-.18.07-.34.14-.52.23-.76.26-1.45.44-2.04.6-1.65.44-2.84.76-3.25,1.87-.07.23-.13.44-.13.67v.02c-11.46,8.2-20.07,24.47-22.79,34.99-2.98,11.56-7.32,25.94-11.59,39.97-9.15-1.08-15-1.68-26.34-1.68s-16.45.58-25.09,1.54c-4.25-13.98-8.59-28.33-11.55-39.83-2.73-10.5-11.33-26.79-22.79-34.99,0-.23-.04-.46-.13-.69-.42-1.11-1.61-1.43-3.25-1.87-.34-.09-.72-.19-1.14-.32,9.07-1.29,49.38-6.98,63.94-7.07,1.14,0,2.35.02,3.6.05,17.39.6,54.59,5.39,63.09,6.5Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lower-trapezius": [
      {"type":"path","d":"M363.71,291.09c-.04.11-.07.23-.11.34-2.42,7.97-4.75,15.67-6.83,22.78-.04.11-.05.19-.07.3-.02.04-.02.09-.04.12-1.1,3.76-2.13,7.35-3.05,10.74-.85,3.16-4.34,13.5-12.87,13.5h-4.94c-8.53,0-12.02-10.34-12.87-13.5-.94-3.5-2.01-7.21-3.16-11.11-2.08-7.12-4.41-14.84-6.83-22.85-.04-.14-.09-.3-.14-.44,8.5-.94,13.85-1.52,24.84-1.52s16.79.57,26.08,1.64Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lats": [
      {"type":"path","d":"M446.75,286.87c-.18,0-.29.05-.38.19-.24.32-5.44,8.27-8.15,28.63-.89,6.66-3.69,14.49-6.94,23.55-6.71,18.7-15.89,44.28-15.56,80.12.42,12.88,5.71,23.08,13.03,37.2,1.74,3.34,3.62,6.91,5.55,10.85-4.83-2.1-10.65-3.62-17.75-4.66-5.8-.85-13.59-1.55-22.02-1.15-5.19-.87-6.02-8.27-7.14-18.41-.96-8.68-2.17-19.47-6.71-29.39-2.86-6.22-7.79-11.79-13.01-17.69-8.66-9.79-17.61-19.9-17.39-33.77.14-9.86,2.71-29.46,7.36-47.87,2.06-7.1,4.41-14.81,6.83-22.79.07-.25.14-.49.22-.74.02-.05.04-.11.05-.16v-.04c4.28-14.1,8.69-28.63,11.7-40.24,2.66-10.28,11.03-26.19,22.13-34.3,1.03,2.56,6.06,5.81,13.5,10.64,8.01,5.19,17.99,11.64,27.69,20.25,3.87,3.41,7.52,7.03,11.14,10.99-4.25,1.61-5.6,11.03-4.14,28.79Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M326.25,362.34c.22,13.87-8.75,24-17.39,33.77-5.22,5.9-10.16,11.47-13.01,17.69-4.56,9.91-5.75,20.71-6.71,29.39-1.14,10.14-1.95,17.55-7.14,18.41-8.42-.41-16.21.3-22.02,1.15-7.1,1.04-12.92,2.56-17.75,4.66,1.93-3.94,3.8-7.51,5.53-10.85,7.34-14.12,12.64-24.31,13.05-37.21.31-35.82-8.86-61.4-15.56-80.1-3.25-9.06-6.06-16.89-6.94-23.55-2.71-20.36-7.92-28.31-8.15-28.63-.07-.14-.2-.19-.38-.19,1.46-17.79.09-27.21-4.16-28.79,3.63-3.98,7.28-7.58,11.15-10.99,9.71-8.61,19.69-15.06,27.69-20.25,7.45-4.82,12.47-8.08,13.5-10.64,11.12,8.13,19.47,24.01,22.13,34.3,3,11.57,7.38,26.01,11.64,40.09.02.07.04.12.05.19.09.3.18.58.27.88,2.42,7.99,4.75,15.69,6.83,22.79,4.65,18.43,7.21,38.03,7.36,47.87Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lowerback": [
      {"type":"path","d":"M392.27,461.71c-12.13.88-25.27,4.21-35.5,12.83-12.11,10.21-18.26,26.22-18.28,47.6,0,0-.02,0,0,.02-.02.02-.02.05-.02.07v69.16h-.42v-69.16s0-.05-.02-.07c.02-.02,0-.02,0-.02-.02-21.38-6.16-37.39-18.28-47.6-10.23-8.62-23.37-11.95-35.48-12.83,3.96-2.35,4.74-9.33,5.77-18.45.96-8.61,2.13-19.33,6.63-29.1,2.8-6.11,7.68-11.63,12.85-17.48,8.77-9.91,17.84-20.16,17.62-34.37-.11-7.42-1.59-20.36-4.3-34.16,1.66,4.45,5.5,11.59,12.94,11.59h4.94c7.43,0,11.24-7.07,12.91-11.54-2.68,13.78-4.16,26.68-4.27,34.1-.22,14.21,8.86,24.46,17.61,34.37,5.19,5.85,10.07,11.36,12.87,17.48,4.5,9.77,5.68,20.5,6.63,29.1,1.03,9.12,1.81,16.1,5.78,18.45Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "posterior-deltoid": [
      {"type":"path","d":"M474.24,262.89c-3.72.32-7.65.57-13.58-1.43-2.69-.9-4.39-1.82-5.64-2.47-1.27-.69-2.15-1.15-3.11-1.11-3.74-4.14-7.54-7.9-11.55-11.45-9.76-8.62-20.19-15.37-27.82-20.32-6.98-4.51-12.65-8.18-13.25-10.44,1.59-1.1,3.24-2.03,4.92-2.76.61-.21,1.27-.46,1.97-.78.02,0,.04,0,.05-.02h.02c.05-.02.09-.04.11-.07h.02c1.39-.64,2.93-1.52,4.59-2.79,1.54-1.18,2.37-2.09,3.09-2.9.65-.71,1.21-1.31,2.15-2.03,1.5-1.17,3.2-1.94,5.13-2.47,29.56,12.97,41.99,27.3,52.89,61.05Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M277.19,215.65c-.61,2.28-6.27,5.96-13.23,10.44-7.61,4.95-18.04,11.7-27.8,20.32-4.01,3.55-7.79,7.32-11.55,11.45-.96-.04-1.84.42-3.11,1.1-1.25.67-2.95,1.59-5.64,2.49-5.91,2-9.85,1.75-13.58,1.43,10.92-33.77,23.34-48.1,52.89-61.05,1.93.53,3.63,1.31,5.13,2.47.94.72,1.5,1.33,2.15,2.03.72.81,1.55,1.71,3.09,2.9,1.64,1.27,3.18,2.14,4.56,2.77.04.04.11.07.18.09.02,0,.04.02.05.02.4.19.81.35,1.19.49.02,0,.05.02.07.04h.02s.05.04.09.04c.22.09.43.16.63.21,1.66.74,3.29,1.66,4.84,2.76Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lateral-deltoid": [
      {"type":"path","d":"M497.73,273.07c-3.11-4.15-6.69-7-11.12-8.85-4.56-1.93-7.94-1.71-11.44-1.4-10.88-33.79-23.26-48.35-52.44-61.33,3.04-.67,6.56-.87,10.54-1.1,2.1-.12,4.27-.25,6.6-.46h.02c7.43-.09,23.99.87,34.53,17.49,10.92,17.23,20.17,45.91,23.21,55.33.04.11.07.21.11.32Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M253.8,201.48c-29.18,12.99-41.56,27.55-52.44,61.33-3.51-.32-6.89-.51-11.44,1.4-4.45,1.86-8.04,4.74-11.15,8.92.04-.11.09-.25.13-.37,3.06-9.42,12.31-38.12,23.23-55.34,10.54-16.63,27.1-17.58,34.54-17.49h.09c2.3.21,4.45.34,6.51.46,3.98.23,7.5.42,10.54,1.1Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "medial-head-triceps": [
      {"type":"path","d":"M547.76,363.75c-1.12.95-3.43.04-5.89-.95-2.98-1.2-6.36-2.54-8.75-.95-.09,0-.18.02-.25.07-.11.07-.18.16-.2.26-1.86,1.77-2.1,6.18-2.31,10.85-.29,5.6-.58,11.4-3.63,12.49-3.27,1.18-9.82-3.25-19.38-13.2,0-.02-.02-.02-.02-.04-.61-.81-1.27-1.68-1.92-2.54,4.48-27.55-7.36-44.99-31.06-78.49,7.77,7.97,13.41,9.77,19.54,11.72,7.21,2.3,14.66,4.66,26.95,17.81l5.84,6.24c9.78,10.44,13.83,14.75,19.2,20.34.04.04.07.05.11.09,2.78,9.59,3.34,14.91,1.77,16.31Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M171.12,369.74c-.63.85-1.27,1.7-1.86,2.49-.02.02-.02.04-.04.05-.02.02-.04.02-.04.04-9.56,9.95-16.07,14.38-19.38,13.2-3.05-1.1-3.34-6.89-3.63-12.49-.22-4.65-.45-9.06-2.31-10.83-.02-.12-.09-.21-.2-.28-.09-.05-.18-.07-.27-.07-2.37-1.59-5.75-.25-8.73.95-2.46.99-4.77,1.91-5.89.95-1.59-1.4-1.01-6.71,1.77-16.31.04-.04.07-.05.11-.09,5.42-5.64,9.54-10.04,19.5-20.69l5.53-5.88c12.29-13.15,19.74-15.51,26.95-17.81,6.13-1.94,11.77-3.75,19.54-11.72-23.68,33.5-35.54,50.93-31.06,78.49Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "long-head-triceps": [
      {"type":"path","d":"M504.65,368.73c-1.68-2.21-3.47-4.56-5.33-7-17.71-23.25-41.81-54.9-51.54-73.42v-.02c-1.63-18.22-.43-28.11,3.54-29.42.02,0,.04-.02.05-.02,6.71,11.34,12.26,19.54,17.03,25.55l.11.16,3.6,5.09c24.29,34.32,36.64,51.77,32.54,79.07Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M228.76,288.26c-9.69,18.52-33.82,50.2-51.55,73.47-1.86,2.46-3.65,4.81-5.33,7.02-4.12-27.3,8.24-44.78,32.52-79.09l3.6-5.09.13-.16c4.79-6.01,10.32-14.21,17.03-25.55.02,0,.04.02.05.02,3.96,1.31,5.17,11.17,3.56,29.39Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "later-head-triceps": [
      {"type":"path","d":"M545.48,345.64c-4.88-5.07-9-9.49-18.13-19.23l-5.84-6.24c-12.45-13.31-20.03-15.73-27.33-18.04-7.38-2.35-14.05-4.47-24.73-17.81l-.02-.02-.27-.39s-.04-.05-.07-.07c-4.68-5.9-10.12-13.94-16.72-25.06.6.09,1.25.44,2.22.95,1.27.69,3.02,1.63,5.77,2.54,6.36,2.16,10.65,1.77,14.43,1.43,3.72-.32,6.92-.62,11.48,1.31,5.17,2.17,9.16,5.76,12.58,11.33l.04.04.02.02c2.39,3.59,5.1,6.82,7.97,10.25,4.48,5.34,9.56,11.4,14.79,20.44,6.31,10.96,15.51,26.01,23.82,38.54Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M224.16,258.79c-6.6,11.11-12.04,19.15-16.72,25.06-.04.02-.05.04-.07.07l-.27.37-.02.04c-10.68,13.34-17.35,15.46-24.73,17.81-7.3,2.31-14.88,4.74-27.33,18.04l-5.53,5.88c-9.33,9.98-13.52,14.47-18.47,19.65,8.32-12.55,17.53-27.64,23.86-38.61,5.22-9.05,10.3-15.11,14.79-20.44,2.87-3.43,5.59-6.66,7.97-10.25.02,0,.04-.04.05-.05,3.42-5.57,7.41-9.15,12.58-11.33,4.56-1.93,7.75-1.63,11.48-1.31,3.78.34,8.06.72,14.43-1.43,2.75-.92,4.5-1.86,5.77-2.54.98-.51,1.63-.87,2.22-.95Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-flexors": [
      {"type":"path","d":"M631.76,498.27c-.67.99-1.43,1.84-2.3,2.51-1.84,1.43-5.39,2.92-9.31,2.39-2.26-.32-3.87-1.24-4.97-2.3-.69-1.08-1.52-2.24-2.49-3.5,0-.02-.02-.04-.02-.04-.04-.09-.07-.14-.11-.19s-.07-.09-.13-.11t-.04-.04c-5.3-6.86-14.43-16.19-27.33-27.94-23.39-21.29-59.72-59.37-63.94-77.01-.6-1.8-4.25-7.02-9.87-14.56,6.45,6.15,11.1,9.1,14.3,9.1.52,0,1.01-.09,1.46-.25,3.63-1.31,3.92-7.39,4.23-13.29.2-4.1.42-8.3,1.83-10,12.51,19.54,26.25,36.45,40.76,54.32,19.16,23.63,38.99,48.05,57.92,80.89Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M165.35,377.39c-5.68,7.62-9.38,12.86-9.98,14.7-4.19,17.6-40.53,55.68-63.92,76.97-12.73,11.57-21.78,20.8-27.1,27.64-.04.02-.05.05-.07.07-.04.02-.07.05-.09.09-.02.04-.05.09-.07.14-.04.02-.05.05-.05.07-1.07,1.34-1.93,2.49-2.6,3.64v.02s-.02.02-.02.02c-.02,0-.02.02-.02.02-.02,0-.02.02-.02.02-.02,0-.02.02-.02.02-1.16,1.1-2.78,2.05-5.03,2.37-3.92.53-7.47-.95-9.31-2.39-.87-.67-1.63-1.52-2.3-2.51,18.93-32.85,38.76-57.29,57.92-80.89,14.52-17.86,28.24-34.78,40.76-54.32,1.41,1.7,1.63,5.9,1.83,10,.29,5.88.6,11.98,4.23,13.29.45.16.94.25,1.46.25,3.2,0,7.9-2.99,14.39-9.21Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "wrist-extensors": [
      {"type":"path","d":"M632.29,497.43c-18.85-32.71-38.63-57.06-57.74-80.59-14.53-17.88-28.27-34.81-40.78-54.34,1.99-1.18,4.92-.02,7.75,1.11,2.73,1.1,5.31,2.14,6.83.8,1.27-1.11,2.26-3.98-1.25-16.31,5.86,8.71,11.13,15.9,14.41,19.12l1.45,1.41c12.44,12.09,27.75,26.98,66.05,101.02.8,1.56,1.61,3.15,2.44,4.75,0,.02.02.04.04.07,4.03,9.22,3.74,17.74.8,22.95Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M142.76,362.5c-12.53,19.53-26.25,36.45-40.78,54.34-19.11,23.54-38.86,47.87-57.74,80.58-2.95-5.21-3.24-13.73.8-22.94.04-.07.07-.16.11-.23.8-1.56,1.59-3.07,2.37-4.58v-.02c38.3-74.04,53.62-88.93,66.03-101.02l1.46-1.41c3.29-3.22,8.55-10.41,14.41-19.12-3.51,12.33-2.51,15.2-1.25,16.31,1.52,1.34,4.1.3,6.83-.8,2.82-1.13,5.77-2.3,7.75-1.11Z","fill":"#EBEBEB","sw":"0"} 
    ],
    "gluteus-maximus": [
      {"type":"path","d":"M432.83,600.64c-8.06,9.61-19.74,15.09-33.75,15.83-.45.02-.92.04-1.37.05h-.36c-.38,0-.78,0-1.19.04-.11-.02-.2,0-.31,0-17.88,0-37.45-7.56-49.76-19.35-1.74-2.9-3.29-4.35-4.45-5.07-.99-.62-1.77-.78-2.26-.78v-69.04s.02-.05.02-.09c0-21.15,6.04-36.97,17.97-47.02,6.09-5.16,13.25-8.36,20.63-10.32h.07c.05.02.13.02.18,0,.85-.19,1.7-.35,2.53-.49-11.88,26.77,7.09,38.01,27.17,49.92,15.93,9.42,32.32,19.15,34.42,37.34.04.23.05.46.07.67.11,1.08.16,2.19.16,3.32,0,.12.05.25.16.34,2.02,26.12-3.96,37.55-9.92,44.65Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M337.15,522.32v69.04c-.47,0-1.27.18-2.26.78-1.17.72-2.71,2.17-4.45,5.05,0,0,0,.02-.02.02-12.35,11.86-32.09,19.42-49.96,19.35-.04-.02-.07-.02-.11,0-.42-.04-.81-.04-1.17-.04h-.34c-.47-.02-.94-.04-1.39-.05-14.01-.74-25.69-6.22-33.75-15.83-5.97-7.1-11.95-18.54-9.92-44.65.11-.09.16-.21.16-.34,0-1.13.05-2.24.16-3.32.02-.21.04-.44.07-.67,2.1-18.18,18.49-27.92,34.42-37.34,20.08-11.91,39.03-23.15,27.17-49.92.83.14,1.68.3,2.53.49.05.02.13.02.18,0h.07c7.38,1.96,14.53,5.16,20.63,10.32,11.93,10.05,17.97,25.87,17.97,47.02,0,.04,0,.05.02.09Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "gluteus-medius": [
      {"type":"path","d":"M441.34,543.7c-5.22-13.71-19.25-22.03-32.94-30.15-19.78-11.73-38.47-22.81-26.72-49.04.04-.09.04-.21.02-.3,12.58-2.17,23.19-.49,31.51,5.04,17.84,11.8,22.11,38.26,24.93,55.75.45,2.83.89,5.48,1.32,7.7.76,3.89,1.37,7.55,1.88,10.99Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M268.12,513.56c-13.68,8.11-27.71,16.43-32.94,30.15.51-3.45,1.12-7.1,1.88-10.99.43-2.23.87-4.88,1.32-7.7,2.82-17.49,7.09-43.95,24.93-55.75,8.31-5.53,18.91-7.21,31.51-5.04-.02.11-.02.21.02.3,11.75,26.22-6.94,37.3-26.72,49.04Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "medial-hamstrings": [
      {"type":"path","d":"M418.5,823.57c-.02.12.02.23.09.32-1.74,8.71-4.28,16.84-8.15,22.11-2.35,3.2-4.7,4.65-6.96,4.28-4.32-.67-8.57-7.44-12.67-20.11v-.02s-.02-.05-.02-.07c-1.97-9.17-3.16-19.38-2.96-30.76.45-26.56-4.93-48.13-11.91-75.05,0-.04-.02-.07-.02-.11-6.22-25.48-4.79-34.69-2.98-46.31,1.34-8.57,2.84-18.29,1.97-36.51-.38-7.92,1.54-14.01,5.73-18.08,4.65-4.52,11.03-5.64,15.26-5.81.72-.05,1.37-.05,1.93-.02.38,0,.72,0,1.03.02.11,0,.2-.04.27-.09h.02c4.95-.26,9.63-1.11,13.95-2.53.71,16.31,1.77,33.17,3.18,49.9v.04c.02.25.04.48.05.72,5.77,91.76,7.21,120.05,2.19,158.08Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M300.64,724.15s-.02.07-.02.11c-6.98,26.91-12.36,48.49-11.91,75.05.2,11.4-.99,21.63-2.96,30.8-.02.02-.02.05-.02.09-4.12,12.65-8.35,19.4-12.67,20.07-2.28.37-4.61-1.08-6.96-4.28-3.87-5.27-6.44-13.39-8.15-22.11.07-.09.11-.19.09-.32-5.04-38.15-3.6-66.48,2.24-158.8v-.05c1.39-16.73,2.46-33.57,3.18-49.88,4.32,1.41,9,2.26,13.95,2.53h.02c.07.05.16.09.27.09.29-.02.63-.02.99-.02.04-.02.09-.02.13,0,.61,0,1.23.02,1.84.02h.25c4.23.23,10.47,1.4,15,5.81,4.19,4.06,6.11,10.16,5.73,18.08-.87,18.22.63,27.94,1.97,36.51,1.81,11.63,3.24,20.83-2.98,46.31Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "lateral-hamstrings": [
      {"type":"path","d":"M468.17,638.77c-.51,6.77-1.05,13.78-1.34,21.7-.36,10.39-.63,24.28-.9,38.96-.72,38.72-1.61,86.9-5.3,96.71-1.23,4.82.07,16.29,2.3,27.65,0,.02.02.05.02.07.47,3.22-.07,5.32-1.57,5.87-2.12.78-5.87-1.27-10.23-5.9-16.34-19.6-28.09-88.42-33.98-159.12-1.41-16.8-2.48-33.73-3.2-50.11,0-.02,0-.04-.02-.05,7.77-2.67,14.41-7.17,19.59-13.34,6.33-7.55,12.69-19.84,9.82-48.72-.05-.46-.09-.94-.14-1.41,0-.04-.02-.07-.02-.11-.6-5.53-1.52-11.64-2.84-18.41-.43-2.21-.87-4.88-1.32-7.67-2.84-17.65-7.14-44.33-25.31-56.37-5.37-3.57-11.66-5.57-18.78-6.01.04,0,.07-.02.09-.04t.04-.02c8.15-.35,15.69.34,21.33,1.17,7.54,1.08,13.59,2.74,18.53,5.04,7.52,15.3,16.2,35.61,23.41,65.61,13.5,56.21,11.8,78.58,9.83,104.5Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M233.18,552.49c-2.87,28.87,3.49,41.17,9.82,48.72,5.19,6.17,11.82,10.67,19.59,13.34-.02.02-.02.04-.02.05-.72,16.38-1.81,33.31-3.2,50.11-5.89,70.65-17.62,139.4-33.95,159.07-4.37,4.65-8.15,6.73-10.27,5.96-1.48-.55-2.04-2.63-1.57-5.8.02-.05.02-.12.04-.18v-.04c.02-.07.02-.14.04-.19.07-.39.14-.76.2-1.13,0-.04.02-.07.02-.11,2.04-10.89,3.2-21.56,2.01-26.19-3.67-9.77-4.56-57.96-5.28-96.66-.27-14.7-.54-28.59-.9-38.98-.29-7.92-.83-14.93-1.34-21.7-1.97-25.92-3.67-48.29,9.83-104.5,7.21-30,15.89-50.31,23.41-65.61,4.93-2.3,10.99-3.96,18.51-5.04,5.64-.83,13.18-1.52,21.35-1.17.04.04.07.05.13.05-7.12.44-13.41,2.44-18.8,6.01-18.15,12.03-22.45,38.72-25.29,56.37-.47,2.81-.89,5.46-1.32,7.67-1.32,6.77-2.24,12.88-2.84,18.41,0,.04-.02.07-.02.11-.05.48-.09.95-.14,1.41Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "inner-thigh": [
      {"type":"path","d":"M379.97,622.62c-4.37,4.26-6.4,10.58-6,18.77.87,18.11-.63,27.78-1.95,36.31-1.34,8.64-2.48,15.94-.49,29.42-5.12-20.37-10.77-45.06-15.49-76.94-2.75-15.64-5.86-24.99-8.64-30.55,11.24,9.81,27.55,16.36,43.18,17.6-3.56.76-7.47,2.33-10.61,5.39Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M329.14,599.6c-2.78,5.57-5.91,14.91-8.66,30.61-4.72,31.86-10.36,56.55-15.49,76.92,1.99-13.48.85-20.78-.49-29.42-1.32-8.53-2.82-18.2-1.95-36.31.4-8.18-1.63-14.51-6-18.77-3.15-3.06-7.05-4.63-10.61-5.39,15.64-1.24,31.96-7.81,43.2-17.64Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "gastrocnemius": [
      {"type":"path","d":"M443.77,1003.67c-.04.11-.02.23.04.32-2.73,7.28-5.73,11.11-8.78,11.17h-.05c-4.56,0-8.88-8.18-11.21-15.21-.11-.27-.18-.53-.25-.78-.09-.28-.18-.57-.27-.83-.63-2.12-1.28-4.14-1.93-6.13-4.93-15.27-9.63-29.81-8.75-73.56.02-.05.02-.12.02-.19.16-1.87,1.7-15.92,11.08-22.18,1.25-.83,2.58-1.48,3.99-1.98.02,0,.04-.02.05-.02,2.39-.55,4.56.16,6.6,2.14,14.24,13.73,15.74,87.03,9.47,107.26Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M255.23,992.2c-.65,2-1.3,4.01-1.93,6.13-.13.35-.24.72-.34,1.1-.05.16-.11.34-.18.51-2.33,7.03-6.65,15.21-11.21,15.21h-.05c-3.05-.05-6.06-3.89-8.79-11.17.05-.11.07-.21.04-.32-6.27-20.23-4.77-93.53,9.47-107.26,2.04-2,4.25-2.69,6.65-2.1,1.41.48,2.73,1.13,3.98,1.96,10.01,6.68,11.1,22.28,11.1,22.42,0,.02,0,.05.02.07v.02c.89,43.65-3.81,58.17-8.75,73.42Z","fill":"#EBEBEB","sw":"1"} 
    ],
    "soleus": [
      {"type":"path","d":"M486.59,970.69v.02c-6.63,33.49-13.52,39.72-18.17,39.05-3.15-.46-5.5-2.97-7.5-6.13-.02,0-.02-.02-.02-.02-.02-.04-.04-.07-.05-.11-10.65-20.52-21.24-83.99-4.32-115.94v-.02c2.21-3.25,4.21-7.1,6.15-10.8,3.31-6.36,6.42-12.4,9.16-12.09,1.81.18,3.6,3.2,5.35,8.99v.02c5.71,23.86,11.98,61.33,9.4,97.01Z","fill":"#EBEBEB","sw":"1"} ,
      {"type":"path","d":"M215.68,1003.51s-.04.07-.05.11c-2.01,3.16-4.37,5.69-7.52,6.15-4.61.67-11.53-5.57-18.17-39.05v-.02c-2.6-35.64,3.65-73.08,9.38-96.96t.02-.04c.02-.05.02-.11.04-.16,1.72-5.71,3.53-8.69,5.3-8.87.07-.02.13-.02.2-.02,2.68,0,5.75,5.88,8.98,12.1,1.93,3.69,3.94,7.56,6.15,10.81,16.92,31.95,6.33,95.42-4.32,115.94Z","fill":"#EBEBEB","sw":"1"} 
    ]
  }
};
const _BODY_PATHS = {
  "maleFront": [
    {"type":"line","x1":"338.42","y1":"502.51","x2":"338.42","y2":"570.06","sw":"3.49"} ,
    {"type":"line","x1":"338.19","y1":"502.51","x2":"338.19","y2":"570.06","sw":"3.49"} ,
    {"type":"line","x1":"338.07","y1":"502.51","x2":"338.07","y2":"570.06","sw":"3.49"} ,
    {"type":"path","d":"M29.68,519.95v.02c1.16,7.69,5.18,13.96,10.54,16.64,4.85,2.42,11.23,2.09,17.44-.58","sw":"3.49"} ,
    {"type":"path","d":"M149.27,305.89c2.83-1.91,6.16-3.84,9.99-5.56,11.63-5.2,21.48-5.56,23.47-5.62,8.64-.25,16.87-.47,23.01,4.54,10.86,8.84,7.76,28.02,6.57,35.37-.63,3.84-1.57,7.42-2.72,10.77","sw":"3.49"} ,
    {"type":"path","d":"M169.9,394.75c-18.87,23.05-35.11,22.94-42.89,19.1-13.03-6.43-20.36-27.51,3.9-81.22,0-.02,0-.05.02-.07","sw":"3.49"} ,
    {"type":"path","d":"M167.92,297.16h.04","sw":"3.49"} ,
    {"type":"path","d":"M178.4,295.03h.04c7.81-1.91,13.95-4.21,17.77-6.81,13.36-9.06,23.94-21.5,28.82-27.23,15.18-17.85,17.46-25.88,33.45-36.04,8.79-5.58,19.79-8.98,19.79-8.98,0,0-26.43-10.86-51.41-5.84h-.02","sw":"3.49"} ,
    {"type":"path","d":"M277.69,216.14c4.52-1.27,13.75-4.72,31.53-3.03,29.16,2.77,28.85,21.99,28.85,21.99v49.94c0,10.2-3.48,20.15-10.08,27.92-5.64,6.63-13.92,13.96-25.55,19.04-28.62,12.51-62.13,3.66-82-20.44-7.46-9.05-15.67-16.95-30.4-16.95","sw":"3.49"} ,
    {"type":"path","d":"M296.59,159.41v37.17c0,11.72-7.21,15.68-18.32,19.39-.55.19-1.13.36-1.71.52","sw":"3.49"} ,
    {"type":"path","d":"M338.07,337.65c0-16.65-25.52-9.4-35.63-5.66-10.99,4.07-19.82,8.66-22.72,15.22-3.49,7.88,3.78,12.76,4.64,33.46.22,5.39-.28,4.7-.19,15.47.1,11.23,2.35,60.66,4.45,93.61,3.3,51.86,35.41,94.71,49.47,94.71","sw":"3.49"} ,
    {"type":"path","d":"M293.35,374.57c14.43-4.2,24.23-6.73,38.52-6.45,6.2-.02,6.2-9.11,6.2-18.92","sw":"3.49"} ,
    {"type":"path","d":"M296.15,420.96c16.04.26,30.91.65,38.67-3.75,4.79-2.72,3.25-10.48,3.25-19.67","sw":"3.49"} ,
    {"type":"path","d":"M297.68,468.92c14.84.53,17.89,1.59,31.8,1.19,7.42-.55,8.58-3.71,8.58-19.35","sw":"3.49"} ,
    {"type":"path","d":"M305.78,376.61c5.01-1.3,15.11-4.27,23.27-2.88,8.16,1.39,9.02,6.59,9.02,12.62","sw":"3.49"} ,
    {"type":"path","d":"M305.78,426.12c6.59-.76,15.39-1.74,23.44-1.63,8.05.11,8.85,5.44,8.85,13.93","sw":"3.49"} ,
    {"type":"line","x1":"338.3","y1":"502.51","x2":"338.3","y2":"570.06","sw":"3.49"} ,
    {"type":"path","d":"M305.78,475.2c6.03-.13,21.69,1.39,27.24,2.65,5.55,1.26,5.29,8.08,5.29,14.02","sw":"3.49"} ,
    {"type":"path","d":"M223.66,315.17c24.07,27.01,58.69,48.66,60.36,60.76,2.21,16.01-10.59,49.09-6.44,77.33,4.14,28.24-3.11,46.57-12.46,55.54-7.13,6.84-19.5,9.89-30.03,7.46","sw":"3.49"} ,
    {"type":"path","d":"M235.09,516.27c19.68,4.09,53.76,20.18,67.05,65.13,13.28,44.95,20.14,61.58,35.93,61.58","sw":"3.49"} ,
    {"type":"path","d":"M302.7,792.59c.65-3.13,1.22-6.11,1.73-8.9,11.29-63.16-11.29-16.3-28.4-108.76-8.98-48.57-8.13-137.16-41.31-155.78","sw":"3.49"} ,
    {"type":"path","d":"M211.28,782.45c5.99,27.06,7.77,56.91,29.66,46.16,13.42-6.61,2.89,30.99,27.46,31.4,24.57.41,31.98-52.71,31.98-52.71","sw":"3.49"} ,
    {"type":"path","d":"M280.02,880.6c-.16.29-.32.56-.47.83-15.5,26.19-39.33,28.55-49.78,9.6-4.97-8.99-8.1-12.79-15.41-14.5","sw":"3.49"} ,
    {"type":"line","x1":"338.07","y1":"502.51","x2":"338.07","y2":"570.06","sw":"3.49"} ,
    {"type":"line","x1":"338.3","y1":"502.51","x2":"338.3","y2":"570.06","sw":"3.49"} ,
    {"type":"line","x1":"338.42","y1":"502.51","x2":"338.42","y2":"570.06","sw":"3.49"} ,
    {"type":"path","d":"M646.81,519.95v.02c-1.16,7.69-5.18,13.96-10.54,16.64-4.85,2.42-11.23,2.09-17.44-.58","sw":"3.49"} ,
    {"type":"path","d":"M527.22,305.89c-2.83-1.91-6.16-3.84-9.99-5.56-11.63-5.2-21.48-5.56-23.47-5.62-8.64-.25-16.87-.47-23.01,4.54-10.86,8.84-7.76,28.02-6.57,35.37.63,3.84,1.57,7.42,2.72,10.77","sw":"3.49"} ,
    {"type":"path","d":"M506.59,394.75c18.87,23.05,35.11,22.94,42.89,19.1,13.03-6.43,20.36-27.51-3.9-81.22,0-.02,0-.05-.02-.07","sw":"3.49"} ,
    {"type":"path","d":"M508.57,297.16h-.04","sw":"3.49"} ,
    {"type":"path","d":"M498.09,295.03h-.04c-7.81-1.91-13.95-4.21-17.77-6.81-13.36-9.06-23.94-21.5-28.82-27.23-15.18-17.85-17.46-25.88-33.45-36.04-8.79-5.58-19.79-8.98-19.79-8.98,0,0,26.43-10.86,51.41-5.84h.02","sw":"3.49"} ,
    {"type":"path","d":"M398.8,216.14c-4.52-1.27-13.75-4.72-31.53-3.03-29.16,2.77-28.85,21.99-28.85,21.99v49.94c0,10.2,3.48,20.15,10.08,27.92,5.64,6.63,13.92,13.96,25.55,19.04,28.62,12.51,62.13,3.66,82-20.44,7.46-9.05,15.67-16.95,30.4-16.95","sw":"3.49"} ,
    {"type":"path","d":"M379.9,159.41v37.17c0,11.72,7.21,15.68,18.32,19.39.55.19,1.13.36,1.71.52","sw":"3.49"} ,
    {"type":"path","d":"M338.42,337.65c0-16.65,25.52-9.4,35.63-5.66,10.99,4.07,19.82,8.66,22.72,15.22,3.49,7.88-3.78,12.76-4.64,33.46-.22,5.39.28,4.7.19,15.47-.1,11.23-2.35,60.66-4.45,93.61-3.3,51.86-35.41,94.71-49.47,94.71","sw":"3.49"} ,
    {"type":"path","d":"M383.14,374.57c-14.43-4.2-24.23-6.73-38.52-6.45-6.2-.02-6.2-9.11-6.2-18.92","sw":"3.49"} ,
    {"type":"path","d":"M380.34,420.96c-16.04.26-30.91.65-38.67-3.75-4.79-2.72-3.25-10.48-3.25-19.67","sw":"3.49"} ,
    {"type":"path","d":"M378.81,468.92c-14.84.53-17.89,1.59-31.8,1.19-7.42-.55-8.58-3.71-8.58-19.35","sw":"3.49"} ,
    {"type":"path","d":"M370.71,376.61c-5.01-1.3-15.11-4.27-23.27-2.88-8.16,1.39-9.02,6.59-9.02,12.62","sw":"3.49"} ,
    {"type":"path","d":"M370.71,426.12c-6.59-.76-15.39-1.74-23.44-1.63-8.05.11-8.85,5.44-8.85,13.93","sw":"3.49"} ,
    {"type":"line","x1":"338.19","y1":"502.51","x2":"338.19","y2":"570.06","sw":"3.49"} ,
    {"type":"path","d":"M370.71,475.2c-6.03-.13-21.69,1.39-27.24,2.65-5.55,1.26-5.29,8.08-5.29,14.02","sw":"3.49"} ,
    {"type":"path","d":"M452.83,315.17c-24.07,27.01-58.69,48.66-60.36,60.76-2.21,16.01,10.59,49.09,6.44,77.33-4.14,28.24,3.11,46.57,12.46,55.54,7.13,6.84,19.5,9.89,30.03,7.46","sw":"3.49"} ,
    {"type":"path","d":"M441.4,516.27c-19.68,4.09-53.76,20.18-67.05,65.13-13.28,44.95-20.14,61.58-35.93,61.58","sw":"3.49"} ,
    {"type":"path","d":"M373.79,792.59c-.65-3.13-1.22-6.11-1.73-8.9-11.29-63.16,11.29-16.3,28.4-108.76,8.98-48.57,8.13-137.16,41.31-155.78","sw":"3.49"} ,
    {"type":"path","d":"M465.21,782.45c-5.99,27.06-7.77,56.91-29.66,46.16-13.42-6.61-2.89,30.99-27.46,31.4-24.57.41-31.98-52.71-31.98-52.71","sw":"3.49"} ,
    {"type":"path","d":"M396.47,880.6c.16.29.32.56.47.83,15.5,26.19,39.33,28.55,49.78,9.6,4.97-8.99,8.1-12.79,15.41-14.5","sw":"3.49"} ,
    {"type":"path","d":"M338.07,642.98c-2.18,0-1.77,8.33-2.29,25.52-1.86,30.11-18.75,68.78-23.38,84.07-2.36,7.75-5.3,18.3-7.97,31.13l-.05.32c-.52,2.47-1.02,5.04-1.5,7.68-.91,4.93-1.77,10.13-2.5,15.6-.04.2-.05.39-.09.59-.82,6.04-1.5,12.38-2.02,19.01-1.25,16.24-4.68,27.37-8.54,35.9","sw":"3.49"} ,
    {"type":"path","d":"M289.74,862.84c-3.27,7.25-6.86,12.63-9.72,17.76-.21.36-.41.73-.63,1.09-.36.68-.7,1.34-1.04,2.02-6.02,12.08-7.39,4.57-2.77,45.8,8.32,60.68-2.55,51.43-6.72,65.54-21.08,67.4-19.65,83.93-18.13,101.01,1.52,17.08-3.29,19.33-3.29,19.33,0,0-1.36,7.54-.48,14.51,3.93,22.71-.39,25.68-7.13,29.52-6.73,3.84-11.56,6.34-11.4,11.06,1.21,14.69-14.75,19.17-14.75,19.17-12.34,21.59-25.97,7.7-25.97,7.7-6.32,5.61-11.38-1.52-11.38-1.52-6.09,1.68-7.7-4.82-7.7-4.82-4.48.16-4.41-4.48-4.41-4.48-4.09-.07-6.97-3.52-3.68-11.47,4.88-10.83,14.41-17.31,21.56-23.09,7.13-5.79,5.3-6.09,8.29-11.1,2.96-4.99,14.43-22.3,16.13-27.95.18-5.61.88-10.01,2.7-20.8,3.21-17.44-2.59-48.76-5.18-77.19-14.74-84.02,8.38-130.15,10.31-138.41.02-.05.02-.13.04-.18,1.61-7.75.64-12.6,1.93-19.71,1.3-7.09,3.55-6.77,3.88-33.91-3.88-13.29-6.79-26.77-8.91-40.2-.02-.02-.02-.04-.02-.07-15.95-100.81,12.48-199.86,15.22-210.65,2-7.9,5.48-30.95,8.23-52.64.13-.96.25-1.93.36-2.89,1.36-10.88,2.52-21.23,3.18-28.91,2.02-23.55,9.75-49.42-2.48-73.74-20.43-39.38-25.36-63.47-26.18-68.22-.11-.59-.14-.88-.14-.88-4.79,11.78-13.47,18.58-17.81,22.62-2.2,2.04-11.77,14.4-21.74,27.62-9.68,12.85-19.74,26.52-23.79,32.32-12.7,20.46-9.75,24.94-30.97,51.44-21.22,26.5-31.31,26.71-50.6,46.9-1.18,1.52-4.55,6.2-6.88,10.6h-.02c-1.79,3.39-2.96,6.61-1.98,8.08,5.54,7.63,2.45,16.05-.3,19.42-2.75,3.36-4.11,8.06-5.22,16.71-1.29,14.56.79,26.78-9.38,26.59-10.16-.2-7.41-26.89-7.41-26.89,0,0-3.89.93-6.36,5.99-3.64,12.28-7.73,10.76-9.57,18.49-2.07,14.22-4.18,10.79-1.63,24.94.38,2.09.45,3.86.3,5.34-.84,8.54-9.02,7.79-9.02,7.79,0,0-4.93-17.17-5.14-20.51s-.66-8.97,1.36-25.69c2.02-16.72-1.2-10.33,6.45-25.3,11.81-22.3,12.63-35.31,19.93-51,0,0-.02,0,0-.02.88-1.89,1.86-3.84,2.96-5.84,12.82-27.66,32.04-85.39,51.26-108.53,19.22-23.12,25.43-25.44,29.61-35.56,7.06-16.64,12.75-28.66,17.41-37.45,10.45-19.82,15.52-23.35,18.34-26.68.98-1.16,1.68-2.31,2.25-4.11,8.38-31.95,11.27-33.68,13.59-41.92,13.72-44.81,52.15-47.26,55.48-48.14,1.34-.34,3.75-.95,6.27-1.59.05-.02.09-.02.13-.02,3.75-.96,7.7-2,8.64-2.43,1.59-.73,9.82-8.09,14.88-10.42,5.05-2.31,25.72-10.7,30.92-13.29,5.2-2.61,14.59-11.86,14.59-11.86.23-2.43.43-7.2.57-12.6v-.11c.3-11.86.45-26.75.45-26.75-2.89-5.79-3.47-15.62-3.47-15.62-7.23,1.45-12.43-1.88-13.88-21.1s9.86-15.58,9.86-15.58","sw":"3.49"} ,
    {"type":"path","d":"M16.1,634.69s8.65,1.08,7.27-7.42c-1.38-8.5.37-10.44.19-18.81-.17-8.37,6.3-8.35,4.63-24.47","sw":"3.49"} ,
    {"type":"path","d":"M338.42,642.98c2.17,0,1.77,8.32,2.28,25.51,1.86,30.11,18.75,68.79,23.38,84.07,4.63,15.29,11.58,41.46,14.12,74.35s13.89,44.7,19.91,56.79c6.02,12.09,7.41,4.58,2.78,45.81-8.33,60.68,2.55,51.41,6.71,65.54,21.06,67.4,19.65,83.92,18.12,101.01s3.29,19.33,3.29,19.33c0,0,1.36,7.54.48,14.52-3.92,22.69.4,25.66,7.14,29.51,6.73,3.85,11.54,6.34,11.38,11.07-1.2,14.68,14.75,19.16,14.75,19.16,12.34,21.58,25.98,7.7,25.98,7.7,6.33,5.61,11.38-1.52,11.38-1.52,6.09,1.68,7.7-4.82,7.7-4.82,4.49.17,4.41-4.48,4.41-4.48,4.09-.09,6.97-3.53,3.69-11.47-4.89-10.83-14.43-17.33-21.57-23.1-7.13-5.78-5.31-6.09-8.28-11.09-2.96-4.99-14.43-22.3-16.14-27.96-.17-5.61-.87-10-2.69-20.79-3.23-17.44,2.58-48.77,5.17-77.2,14.85-84.63-8.72-130.83-10.34-138.58-1.61-7.75-.65-12.6-1.94-19.7-1.29-7.11-3.55-6.78-3.87-33.92,32.94-113.06-3.19-238.69-6.29-250.93-3.1-12.24-9.76-60.89-11.77-84.44-2.01-23.55-9.76-49.43,2.48-73.75,22.92-44.16,26.33-69.11,26.33-69.11,4.79,11.78,13.47,18.59,17.81,22.62,4.33,4.03,37.32,48.19,45.53,59.96,12.7,20.45,9.76,24.94,30.98,51.44,21.22,26.49,31.31,26.72,50.61,46.89,2.08,2.73,11.1,15.34,8.87,18.68-5.54,7.62-2.45,16.05.31,19.41,2.75,3.37,4.11,8.08,5.2,16.72,1.29,14.56-.78,26.79,9.39,26.58,10.17-.2,7.4-26.88,7.4-26.88,0,0,3.91.93,6.37,5.99,3.64,12.27,7.73,10.74,9.56,18.48,2.08,14.23,4.18,10.79,1.63,24.95-2.55,14.16,8.72,13.13,8.72,13.13,0,0,4.93-17.16,5.15-20.51.21-3.34.64-8.97-1.37-25.69-2.01-16.73,1.2-10.33-6.44-25.31-13.24-25.01-12.67-38.33-22.9-56.86-12.82-27.65-32.04-85.39-51.26-108.52-19.21-23.13-25.43-25.44-29.62-35.56-28.46-67.22-35.11-58.97-38-68.23-8.38-31.94-11.27-33.68-13.58-41.92-13.72-44.81-52.16-47.27-55.48-48.14-3.33-.87-13.44-3.32-15.03-4.05-1.59-.72-9.83-8.1-14.88-10.4-5.06-2.32-25.73-10.7-30.92-13.31-5.2-2.6-14.59-11.85-14.59-11.85-.72-7.81-1.01-39.47-1.01-39.47,2.89-5.78,3.46-15.61,3.46-15.61,7.23,1.45,12.43-1.88,13.88-21.1.92-12.29-3.37-15.24-6.57-15.76-1.12-.17-2.12-.06-2.71.04","sw":"3.49"} ,
    {"type":"path","d":"M660.39,634.69s-8.65,1.08-7.27-7.42c1.38-8.5-.37-10.44-.19-18.81.17-8.37-6.3-8.35-4.63-24.47","sw":"3.49"} ,
    {"type":"path","d":"M379.63,132.66s-10.77,20.48-41.02,25.91","sw":"3.49"} ,
    {"type":"path","d":"M297.22,132.66s10.77,20.48,41.02,25.91","sw":"3.49"} ,
    {"type":"path","d":"M634.84,537.24c-20.99-47.94-51.6-90.68-79.18-128.17","sw":"3.49"} ,
    {"type":"path","d":"M545.07,394.7s-.04-.07-.05-.09c-.09-.11-.16-.21-.23-.32-.16-.21-.25-.34-.25-.34-24.45-39.6-58.04-73.01-46.45-98.91","sw":"3.49"} ,
    {"type":"path","d":"M353.06,216.49c48.01,22.71,63.97,63.62,138.24,78.14","sw":"3.49"} ,
    {"type":"path","d":"M400.53,674.93c-19.23,102.22,1.65,148.14-15.61,163.71","sw":"3.49"} ,
    {"type":"path","d":"M437.61,829.49c-46.43-18.95,19.49-129.39-8.24-298.08","sw":"3.49"} ,
    {"type":"path","d":"M467.33,1092.12c-13.12,9.44-32.57,6.6-40.84-5.35","sw":"3.49"} ,
    {"type":"path","d":"M448.41,888.19c6.04,85.05,7.99,111.76,8.91,208.56","sw":"3.49"} ,
    {"type":"path","d":"M421.37,902.63c.07.5,16.9,119.02,22.59,194.64","sw":"3.49"} ,
    {"type":"path","d":"M544.53,393.95s13.41,18.22-2.78,21.81","sw":"3.49"} ,
    {"type":"path","d":"M472.95,297.78s16.89,8.19,28.9,30.77","sw":"3.49"} ,
    {"type":"path","d":"M491.3,294.63c0-.5-.02-1-.04-1.52-.68-20.23-7.98-61.32-53.46-84.27","sw":"3.49"} ,
    {"type":"path","d":"M185.2,294.63c0-.5.02-1,.04-1.52.68-20.23,7.98-61.32,53.46-84.27","sw":"3.49"} ,
    {"type":"path","d":"M41.65,537.24c20.99-47.94,51.6-90.68,79.18-128.17","sw":"3.49"} ,
    {"type":"path","d":"M131.42,394.7s.04-.07.05-.09c.09-.11.16-.21.23-.32.16-.21.25-.34.25-.34,24.45-39.6,58.04-73.01,46.45-98.91","sw":"3.49"} ,
    {"type":"path","d":"M323.43,216.49c-48.01,22.71-63.97,63.62-138.24,78.14","sw":"3.49"} ,
    {"type":"path","d":"M275.96,674.93c19.23,102.22-1.65,148.14,15.61,163.71","sw":"3.49"} ,
    {"type":"path","d":"M238.89,829.49c46.43-18.95-19.49-129.39,8.24-298.08","sw":"3.49"} ,
    {"type":"path","d":"M209.17,1092.12c13.12,9.44,32.57,6.6,40.84-5.35","sw":"3.49"} ,
    {"type":"path","d":"M228.08,888.19c-6.04,85.05-7.99,111.76-8.91,208.56","sw":"3.49"} ,
    {"type":"path","d":"M255.12,902.63c-.07.5-16.9,119.02-22.59,194.64","sw":"3.49"} ,
    {"type":"path","d":"M131.96,393.95s-13.41,18.22,2.78,21.81","sw":"3.49"} ,
    {"type":"path","d":"M203.54,297.78s-16.89,8.19-28.9,30.77","sw":"3.49"} ,
    {"type":"path","d":"M292.23,83.57s.55-14.9,0-24.54c-.55-9.63,6.63-27.77,17.17-22.43,11.1,5.63,32.89,10.76,59.43,0,7.49-2.26,14.53,10.09,15.81,24.09,1.28,14,2.74,21.23,4.38,22.88","sw":"3.49"} ,
    {"type":"path","d":"M292.1,83.68c-5.47-3.86-3.68-20.07-6.17-37.39-2.61-18.19,16.57-32.16,25.36-34.59,5.97-1.65-18.63,1.29,6.51-6.76,26.07-8.35,34,2.13,38.38,3.41,3.81-.45-10.12-8.43,12.1-1.12,20.74,6.82,24.22,22.8,22.48,39.35-2.24,21.32,2.19,29.08-1.79,37.1","sw":"3.49"} 
  ],
  "maleBack": [
    {"type":"path","d":"M26.59,548.25c26.03-63.42,68.84-118.62,98.03-163.9","sw":"3.55"} ,
    {"type":"path","d":"M177.51,282.27c13.88-21.6,30.82-49.9,69.67-70.75","sw":"3.55"} ,
    {"type":"path","d":"M96.08,382.9c1.79-2.01,3.38-3.83,4.82-5.51.47-.56.94-1.1,1.39-1.64,9.12-10.9,11.46-15.76,21.86-30.89,25.27-36.76,35.94-4.01,73.24-66.57","sw":"3.55"} ,
    {"type":"path","d":"M163.92,392.38c-15.51-50.62-4.87-58.82,22.06-96.63","sw":"3.55"} ,
    {"type":"path","d":"M306.84,302.04c8.92-.98,19.33-1.56,30.46-1.56s22.53.63,31.72,1.7","sw":"3.55"} ,
    {"type":"path","d":"M290.32,504.94c22.06,48.8-40.73,34.58-53.76,89.27v.02","sw":"3.55"} ,
    {"type":"path","d":"M231.61,848.54c17.26-10.88,34.41-116.24,38.56-208.94","sw":"3.55"} ,
    {"type":"path","d":"M265.64,701.92c-5.95,93.37-12.97,140.8-1.61,158.28","sw":"3.55"} ,
    {"type":"path","d":"M227,913.34c16.59,19.21,4.49,80.46-5.46,96.94","sw":"3.55"} ,
    {"type":"path","d":"M243.59,918.23c-12.1,4.99-7.42,65.66-4.19,88.62","sw":"3.55"} ,
    {"type":"path","d":"M649.59,548.25c-26.03-63.42-68.84-118.62-98.03-163.9","sw":"3.55"} ,
    {"type":"path","d":"M498.67,282.27c-13.88-21.6-30.82-49.9-69.67-70.75","sw":"3.55"} ,
    {"type":"path","d":"M580.12,382.9c-1.81-2.01-3.39-3.83-4.82-5.51-.49-.58-.96-1.14-1.41-1.68-9.13-10.88-11.48-15.74-21.86-30.85-25.27-36.76-35.94-4.01-73.24-66.57","sw":"3.55"} ,
    {"type":"path","d":"M512.26,392.38c15.51-50.62,4.87-58.82-22.06-96.63","sw":"3.55"} ,
    {"type":"path","d":"M385.86,504.94c-22.06,48.8,40.73,34.58,53.76,89.27v.02","sw":"3.55"} ,
    {"type":"path","d":"M444.57,848.54c-17.26-10.88-34.41-116.24-38.56-208.94","sw":"3.55"} ,
    {"type":"path","d":"M410.54,701.92c5.95,93.37,12.97,140.8,1.61,158.28","sw":"3.55"} ,
    {"type":"path","d":"M449.18,913.34c-16.59,19.21-4.49,80.46,5.46,96.94","sw":"3.55"} ,
    {"type":"path","d":"M432.59,918.23c12.1,4.99,7.42,65.66,4.19,88.62","sw":"3.55"} ,
    {"type":"path","d":"M273.99,934.7c-.92-19.9-18.2-25.19-30.27-16.48-14.45,10.43-36.98-39.64-44.59-12.32","sw":"3.55"} ,
    {"type":"path","d":"M17.61,533.86c2.14,8.02,6.71,13.92,11.94,15.88,5.11,1.91,12.28.66,19.29-3.57","sw":"3.55"} ,
    {"type":"path","d":"M105.05,366.35c-12.2,35.11,11.03,12.77,19.81,18.05,8.94,5.38-8.42,50.24,35.79,11.56","sw":"3.55"} ,
    {"type":"path","d":"M229.16,208.99c24.04-.79,36.24,13.28,41.78,19.21,12.87,13.78,21.21.95,67.15.95","sw":"3.55"} ,
    {"type":"path","d":"M270.94,228.2c53.75,96.64,53,139.06,67.15,139.06","sw":"3.55"} ,
    {"type":"path","d":"M149.88,290.09s8.11-6.69,16.4-7.12c8.29-.43,32.88-.43,51.41-15.49,18.53-15.06,35.54-26,51.62-41.02","sw":"3.55"} ,
    {"type":"path","d":"M313.28,317.74c16.48,39.57,8.78,63.12-20.91,117.99-16.18,29.9,7.54,63.17-20.43,73.92-17.9,6.88-44.1,23.98-45.92,40.97","sw":"3.55"} ,
    {"type":"path","d":"M204.26,336.55c7.93-12.42-13.44-52.74,0-60.9","sw":"3.55"} ,
    {"type":"path","d":"M338.09,612.35c0,35.92-24.96,31.78-50.96,30.25-27.81-1.64-64.82-19.36-44.66-80.42,9.06-27.43,8.74-47.03,36.67-55.13,19.76-5.73,58.95-4.58,58.95,44.78","sw":"3.55"} ,
    {"type":"path","d":"M207.8,790.45s13.75,96.64,36.56,40.97c22.81-55.66-1.33,32.17,28.29,32.17,13.41,0,21.67-19.44,29.5-70.89","sw":"3.55"} ,
    {"type":"path","d":"M290.2,642.79c8.39.78,21.12-.79,20.17,11.26-3.02,38.28,21.13,25.05,8.53,77.97","sw":"3.55"} ,
    {"type":"path","d":"M188.06,965.04c1.75,31.94,5.93,55.01,19.74,55.81,14.26.82,21.34-31.88,27.01-31.4,7.09.59-.19,31.27,15.81,34.52,4.91,1,15.19,1.65,24.57-22.19","sw":"3.55"} ,
    {"type":"path","d":"M402.19,934.7c.92-19.9,18.2-25.19,30.27-16.48,14.45,10.43,36.98-39.64,44.59-12.32","sw":"3.55"} ,
    {"type":"path","d":"M658.57,533.86c-2.14,8.02-6.71,13.92-11.94,15.88-5.11,1.91-12.28.66-19.29-3.57","sw":"3.55"} ,
    {"type":"path","d":"M571.13,366.35c12.2,35.11-11.03,12.77-19.81,18.05-8.94,5.38,8.42,50.24-35.79,11.56","sw":"3.55"} ,
    {"type":"path","d":"M399.82,188.91c-22.44-5.93-46.46-4.02-56.67-3.6-3.38.14-6.74.14-10.13,0-10.22-.42-34.23-2.33-56.67,3.6","sw":"3.55"} ,
    {"type":"path","d":"M447.02,208.99c-24.04-.79-36.24,13.28-41.78,19.21-12.87,13.78-21.21.95-67.15.95","sw":"3.55"} ,
    {"type":"path","d":"M405.24,228.2c-53.75,96.64-53,139.06-67.15,139.06","sw":"3.55"} ,
    {"type":"path","d":"M526.3,290.09s-8.11-6.69-16.4-7.12c-8.29-.43-32.88-.43-51.41-15.49-18.53-15.06-35.54-26-51.62-41.02","sw":"3.55"} ,
    {"type":"path","d":"M362.9,317.74c-16.48,39.57-8.78,63.12,20.91,117.99,16.18,29.9-7.54,63.17,20.43,73.92,17.9,6.88,44.1,23.98,45.92,40.97","sw":"3.55"} ,
    {"type":"path","d":"M471.92,336.55c-7.93-12.42,13.44-52.74,0-60.9","sw":"3.55"} ,
    {"type":"path","d":"M338.09,612.35c0,35.92,24.96,31.78,50.96,30.25,27.81-1.64,64.82-19.36,44.66-80.42-9.06-27.43-8.74-47.03-36.67-55.13-19.76-5.73-58.95-4.58-58.95,44.78","sw":"3.55"} ,
    {"type":"path","d":"M468.38,790.45s-13.75,96.64-36.56,40.97c-22.81-55.66,1.33,32.17-28.29,32.17-13.41,0-21.67-19.44-29.5-70.89","sw":"3.55"} ,
    {"type":"path","d":"M385.98,642.79c-8.39.78-21.12-.79-20.17,11.26,3.02,38.28-21.13,25.05-8.53,77.97","sw":"3.55"} ,
    {"type":"path","d":"M488.12,965.04c-1.75,31.94-5.93,55.01-19.74,55.81-14.26.82-21.34-31.88-27.01-31.4-7.09.59.19,31.27-15.81,34.52-4.91,1-15.19,1.65-24.57-22.19","sw":"3.55"} ,
    {"type":"line","x1":"338.09","y1":"551.83","x2":"338.09","y2":"612.35","sw":"3.55"} ,
    {"type":"path","d":"M338.09,617.53c-5.38,37.37-2.34,46.75-13.43,92.56-10.14,41.91-21.92,67.81-28.49,122.02-6.57,54.21-25.82,43.45-26.29,67.21,13.66,111.93,7.04,93.71-4.26,125.43-11.3,31.72-21.86,73.13-24.15,91.15-2.43,19.1,1.56,17.67-.48,27.37-2.04,9.69-1.79,24.17-.68,32.96,1.11,8.8.31,25.55-21.55,25.55s-31.31-13.28-31.31-13.28c-9.26-2.69-19.27-5.92-25.75-7-16.86-4.49-5.26-14.18-5.26-14.18,4.27-5.71,10.51-5.16,10.51-5.16,3.83-5,8.27-4.53,8.27-4.53,9.45-5.74,20-19.82,20-19.82,1.68-8.98,3.37-15.78,4.49-27.75,1.12-11.97-4.49-56.05-10.67-121.07-6.18-65.02,17.83-88.61,18.44-118.17.61-29.56,7.68-47.76,4.65-61.4-24.43-90.25,1.74-211.05,10.04-234.47,8.3-23.43.48-15.64,6.03-37.78,5.55-22.14,9.61-65.59,9.4-79.04-.21-13.45,1.07-43.45-11.96-63.52-13.03-20.07-21.38-58.05-21.38-58.05-8.01,12.22-29.64,45.31-38.21,53.82-8.57,8.51-11.36,12.25-28.5,35.09-17.14,22.84-28.07,51.28-51.22,74.12-47.58,47.34-39.57,58.32-39.57,58.32,12.72,15.33,4.44,22.35,6.06,31.95,4.14,19.2,3.25,23.64,3.25,23.64-16.86,11.32-15.97-20.35-15.97-20.35-16.27,12.75-14.94,4.01-16.4,11.7-1.59,15.73-6.53,18.3-4.06,21.2,2.47,2.91,6,10.09,6,10.09,10.06,9.06,1.59,15.9,1.59,15.9-8.47-9.58-17.83-10.77-19.42-20.18-1.59-9.4-6.04-21.03-6.04-29.16,1.11-10.56,11.63-35.51,11.69-44.84-.63-23.11,3.58-21.6,5.85-26.81,2.26-5.21,13.01-41.09,27.43-77.53,14.42-36.44,39.96-62.06,49.46-70.63,9.51-8.57,7.52-17.56,11.94-25.06,4.42-7.5,10.91-21.32,10.91-21.32,8.04-27.27,30.83-46.43,30.83-46.43,12.4-75.97,79.27-81.1,79.27-81.1","sw":"3.55"} ,
    {"type":"path","d":"M30.42,643.57s8.51-5.17,2.94-13.1c-4.65-6.6-5.41-6.16-2.94-15.33,1.91-7.11.72-12.42,3.44-17.55","sw":"3.55"} ,
    {"type":"path","d":"M338.09,617.53c5.38,37.37,2.34,46.75,13.43,92.56,10.14,41.91,21.92,67.81,28.49,122.02,6.57,54.21,25.82,43.45,26.29,67.21-13.66,111.93-7.04,93.71,4.26,125.43,11.3,31.72,21.86,73.13,24.15,91.15,2.43,19.1-1.56,17.67.48,27.37,2.04,9.69,1.79,24.17.68,32.96-1.11,8.8-.31,25.55,21.55,25.55s31.31-13.28,31.31-13.28c9.26-2.69,19.27-5.92,25.75-7,16.86-4.49,5.26-14.18,5.26-14.18-4.27-5.71-10.51-5.16-10.51-5.16-3.83-5-8.27-4.53-8.27-4.53-9.45-5.74-20-19.82-20-19.82-1.68-8.98-3.37-15.78-4.49-27.75-1.12-11.97,4.49-56.05,10.67-121.07,6.18-65.02-17.83-88.61-18.44-118.17-.61-29.56-7.68-47.76-4.65-61.4,24.43-90.25-1.74-211.05-10.04-234.47-8.3-23.43-.48-15.64-6.03-37.78-5.55-22.14-9.61-65.59-9.4-79.04.21-13.45-1.07-43.45,11.96-63.52,13.03-20.07,21.38-58.05,21.38-58.05,8.01,12.22,29.64,45.31,38.21,53.82,8.57,8.51,11.36,12.25,28.5,35.09,17.14,22.84,28.07,51.28,51.22,74.12,47.58,47.34,39.57,58.32,39.57,58.32-12.72,15.33-4.44,22.35-6.06,31.95-4.14,19.2-3.25,23.64-3.25,23.64,16.86,11.32,15.97-20.35,15.97-20.35,16.27,12.75,14.94,4.01,16.4,11.7,1.59,15.73,6.53,18.3,4.06,21.2-2.47,2.91-6,10.09-6,10.09-10.06,9.06-1.59,15.9-1.59,15.9,8.47-9.58,17.83-10.77,19.42-20.18,1.59-9.4,6.04-21.03,6.04-29.16-1.11-10.56-11.63-35.51-11.69-44.84.63-23.11-3.58-21.6-5.85-26.81-2.26-5.21-13.01-41.09-27.43-77.53-14.42-36.44-39.96-62.06-49.46-70.63-9.51-8.57-7.52-17.56-11.94-25.06-4.42-7.5-10.91-21.32-10.91-21.32-8.04-27.27-30.83-46.43-30.83-46.43-12.4-75.97-79.27-81.1-79.27-81.1","sw":"3.55"} ,
    {"type":"path","d":"M645.76,643.57s-8.51-5.17-2.94-13.1c4.65-6.6,5.41-6.16,2.94-15.33-1.91-7.11-.72-12.42-3.44-17.55","sw":"3.55"} ,
    {"type":"path","d":"M283.93,83.8c-3.09.99-6.5,4.5-5.66,15.44,1.49,19.17,6.83,22.48,14.26,21.04,0,0,.59,9.81,3.56,15.57l.35,26.59s-.29,5.27-1.02,12.91c0,0-9.49,9.06-14.75,11.6-5.26,2.55-26.14,10.75-31.26,13.02-5.11,2.26-13.44,7.73-15.04,8.44","sw":"3.55"} ,
    {"type":"path","d":"M390.62,83.8c3.08,1,6.49,4.51,5.65,15.44-1.49,19.17-6.84,22.48-14.26,21.04,0,0-.59,9.81-3.57,15.57l1.29,26.59s.29,5.27,1.02,12.91c0,0,9.49,9.06,14.75,11.6s26.14,10.75,31.26,13.02c5.11,2.26,13.44,7.73,15.04,8.44","sw":"3.55"} ,
    {"type":"path","d":"M337.28,131.31c16.08,0,25.6,12.03,30.04,9.51,4.43-2.51,8.22-13.01,16.73-23.77,8.5-10.76-.37-12.56,9.25-42.7,9.61-30.14-14.79-56.46-21.08-60.41-6.29-3.95,17.74,10.04,4.81-3.23-12.94-13.27-39.19-4.3-47.32-2.15s27.72-9.69,0-6.1c-22.53,2.92-40.67,14.6-47.67,34.66","sw":"3.55"} ,
    {"type":"path","d":"M337.28,131.31c-16.09,0-25.61,12.03-30.04,9.51-4.44-2.51-8.23-13.01-16.73-23.77-8.5-10.76.37-12.56-9.24-42.7-1.51-4.74-2.18-17.9-2.22-22.01v-.04c-.04-5.66,1.13-10.73,2.98-15.18","sw":"3.55"} 
  ],
  "femaleFront": [
    {"type":"path","d":"M153,380.94s-9.37,12.22.58,16.9","sw":"3.61"} ,
    {"type":"path","d":"M201.05,289.83c3.36-24.83,4.4-43.92,43.42-68.18","sw":"3.61"} ,
    {"type":"path","d":"M51.09,492.94c37.67-50.99,63.12-72.6,87.45-99.49","sw":"3.61"} ,
    {"type":"path","d":"M152.18,382.13c25.36-39,57.07-64.84,45.04-90.35","sw":"3.61"} ,
    {"type":"path","d":"M323.13,225.89c-49.55,20.4-43.12,41.85-117.67,62.14","sw":"3.61"} ,
    {"type":"path","d":"M276.79,675.4c18.95,83.25-13.29,104.71,4.08,152.63","sw":"3.61"} ,
    {"type":"path","d":"M231.03,821.34c44.64-27.93-18.43-142.58,9.99-308.24","sw":"3.61"} ,
    {"type":"path","d":"M206.7,1104.37c8.85,7.19,22.06,8.51,32.86-.77","sw":"3.61"} ,
    {"type":"path","d":"M217.16,900.71c-6.26,83.76-1.3,111.53-2.26,206.87","sw":"3.61"} ,
    {"type":"path","d":"M243.15,909.54c-4.94,55.57-8.88,88.7-14.39,198.54","sw":"3.61"} ,
    {"type":"path","d":"M225.39,288.03c-11.82,0-19.51,15.62-34.46,40.43","sw":"3.61"} ,
    {"type":"path","d":"M523.6,380.94s9.37,12.22-.58,16.9","sw":"3.61"} ,
    {"type":"path","d":"M475.55,289.83c-3.36-24.83-4.4-43.92-43.42-68.18","sw":"3.61"} ,
    {"type":"path","d":"M625.52,492.94c-37.67-50.99-63.12-72.6-87.45-99.49","sw":"3.61"} ,
    {"type":"path","d":"M524.42,382.13c-25.36-39-57.07-64.84-45.04-90.35","sw":"3.61"} ,
    {"type":"path","d":"M353.48,225.89c49.55,20.4,43.12,41.85,117.67,62.14","sw":"3.61"} ,
    {"type":"path","d":"M399.82,675.4c-18.95,83.25,13.29,104.71-4.08,152.63","sw":"3.61"} ,
    {"type":"path","d":"M445.58,821.34c-44.64-27.93,18.43-142.58-9.99-308.24","sw":"3.61"} ,
    {"type":"path","d":"M469.9,1104.37c-8.85,7.19-22.06,8.51-32.86-.77","sw":"3.61"} ,
    {"type":"path","d":"M459.44,900.71c6.26,83.76,1.3,111.53,2.26,206.87","sw":"3.61"} ,
    {"type":"path","d":"M433.46,909.54c4.94,55.57,8.88,88.7,14.39,198.54","sw":"3.61"} ,
    {"type":"path","d":"M451.22,288.03c11.82,0,19.51,15.62,34.46,40.43","sw":"3.61"} ,
    {"type":"path","d":"M296.86,754.47c3.73-65.24-6.33-7.89-24.07-98.95-9.32-47.84-7.8-135.08-42.21-153.42","sw":"3.61"} ,
    {"type":"path","d":"M176.13,383.75c-12.26,11.97-27.2,18.41-34.31,12.93-5.3-4.07-12.99-16.45,8.36-54.17.19-.33.37-.65.56-.99,1.22-2.15,2.56-4.33,3.96-6.51,1.41-2.22,2.93-4.43,4.54-6.67,0-.02.02-.02.04-.04,24.99-33.79,45.19-40.99,53-41.88,7.84-.9,23.51-.28,18.9,22.98,0,0,0,.02-.02.04","sw":"3.61"} ,
    {"type":"path","d":"M46.26,477.39c-.19,4.9.65,11.2,5.11,15.56,4.94,4.84,12.41,4.7,17.64,3.82h.02","sw":"3.61"} ,
    {"type":"path","d":"M234.64,220.79s1.86,0,30.95,3.82c1.8.24,2.81,1.93,1.47,3.09-9.62,8.31-32.39,28.69-63.23,61.05","sw":"3.61"} ,
    {"type":"path","d":"M301.73,160.86c.02.37.04.77.04,1.18.11,2.62.13,5.75.06,9.4v.37c-.06,2.53-.11,4.93-.15,7.2-.02.12-.02.23-.02.33-1.02,40.41-3.56,42.71-7.91,42.71-18.29,0-22.49,2.45-29.27,7.9","sw":"3.61"} ,
    {"type":"path","d":"M205.74,288.03c6.53-1.6,16.45-5.42,26.78,5.09,12.82,13.06,15.79,26.92,29.56,31.73s75.91-3.56,75.91-32.42v-50.07c0-10.45-11.17-21.74-49.12-20.24","sw":"3.61"} ,
    {"type":"path","d":"M251.66,317.95s.06.07.09.11c4.21,5.02,12.13,12.74,26.7,26.24,20.1,18.62,6.47,33.12,4.95,103.02-.5,23.16-2.74,50.61-32.9,52-8.08.37-13.73-.77-17.66-2.69","sw":"3.61"} ,
    {"type":"path","d":"M232.76,496.85c14.04,4.51,33.77,5.65,47.61,32.63,32.31,62.97,57.62,64.71,57.62,80.3","sw":"3.61"} ,
    {"type":"path","d":"M290.43,797.36s-11.73,62.39-27.86,60.23c-19.98-2.68-7.57-52.27-31.96-35.79-11.9,8.04-16.61-34.64-17.73-51.28","sw":"3.61"} ,
    {"type":"path","d":"M204.16,874.23c3.8,2.38,8.58,5.49,9.21,13.45,1.59,20.19,15.71,20.63,23.94,21.54,15.32,1.69,23.99-3.11,27.66-13.96","sw":"3.61"} ,
    {"type":"path","d":"M337.78,331.82c0-16.4-22.55-9.26-31.49-5.57-9.71,4.01-17.51,8.53-20.08,14.99-3.09,7.76,3.34,12.56,4.1,32.95.2,5.31-.25,4.63-.17,15.24.08,11.06,2.08,59.74,3.93,92.2,2.92,51.08,31.29,93.28,43.71,93.28","sw":"3.61"} ,
    {"type":"path","d":"M298.26,368.18c12.75-4.14,21.41-6.62,34.04-6.35,5.48-.02,5.48-8.97,5.48-18.63","sw":"3.61"} ,
    {"type":"path","d":"M300.74,413.87c14.17.25,27.31.64,34.17-3.7,4.23-2.68,2.87-10.32,2.87-19.37","sw":"3.61"} ,
    {"type":"path","d":"M302.09,461.1c13.11.52,15.81,1.57,28.1,1.18,6.56-.54,7.59-3.66,7.59-19.06","sw":"3.61"} ,
    {"type":"path","d":"M309.24,370.19c4.42-1.28,13.36-4.2,20.57-2.83,7.21,1.37,7.97,6.49,7.97,12.43","sw":"3.61"} ,
    {"type":"path","d":"M309.24,418.95c5.82-.75,13.6-1.71,20.72-1.61,7.11.11,7.82,5.36,7.82,13.72","sw":"3.61"} ,
    {"type":"line","x1":"337.99","y1":"494.19","x2":"337.99","y2":"560.72","sw":"3.61"} ,
    {"type":"path","d":"M309.24,467.29c5.33-.12,19.16,1.37,24.07,2.61,4.91,1.24,4.67,7.96,4.67,13.81","sw":"3.61"} ,
    {"type":"path","d":"M24.59,558.72s-3.59,7.17-4.45,9.48c-.86,2.31-3.14,8.34-3.15,10.92,0,2.58,10.26,19.7-.7,20.32","sw":"3.61"} ,
    {"type":"path","d":"M379.75,754.47c-3.73-65.24,6.33-7.89,24.07-98.95,9.32-47.84,7.8-135.08,42.21-153.42","sw":"3.61"} ,
    {"type":"path","d":"M500.45,383.71c12.26,12,27.23,18.44,34.35,12.97,5.28-4.07,12.99-16.45-8.36-54.17-.09-.18-.2-.37-.3-.55-.04-.09-.09-.18-.15-.25-1.32-2.31-2.72-4.65-4.26-6.99-1.35-2.13-2.82-4.26-4.35-6.39,0-.02-.02-.02-.04-.04-24.99-33.79-45.19-40.99-53-41.88-7.84-.9-23.53-.28-18.9,22.98,0,0,0,.02.02.04","sw":"3.61"} ,
    {"type":"path","d":"M630.35,477.39c.19,4.9-.65,11.2-5.11,15.56-4.94,4.84-12.41,4.7-17.64,3.82h-.02","sw":"3.61"} ,
    {"type":"path","d":"M441.97,220.79s-1.86,0-30.95,3.82c-1.8.24-2.81,1.93-1.47,3.09,9.62,8.31,32.39,28.69,63.23,61.05","sw":"3.61"} ,
    {"type":"path","d":"M374.87,160.86c-.02.37-.04.77-.04,1.18-.11,2.62-.13,5.75-.06,9.4v.37c.06,2.53.11,4.93.15,7.2.02.12.02.23.02.33,1.02,40.41,3.56,42.71,7.91,42.71,18.29,0,22.49,2.45,29.27,7.9","sw":"3.61"} ,
    {"type":"path","d":"M470.87,288.03c-6.53-1.6-16.45-5.42-26.78,5.09-12.82,13.06-15.79,26.92-29.56,31.73-13.47,4.71-75.91-3.56-75.91-32.42v-50.07c0-10.45,11.17-21.74,49.12-20.24","sw":"3.61"} ,
    {"type":"path","d":"M424.95,317.95s-.06.07-.09.11c-4.21,5.02-12.13,12.74-26.7,26.24-20.1,18.62-6.47,33.12-4.95,103.02.5,23.16,2.74,50.61,32.9,52,8.08.37,13.73-.77,17.66-2.69","sw":"3.61"} ,
    {"type":"path","d":"M443.84,496.85c-14.04,4.51-33.77,5.65-47.61,32.63-32.31,62.97-57.62,64.71-57.62,80.3","sw":"3.61"} ,
    {"type":"path","d":"M386.17,797.36s11.73,62.39,27.86,60.23c19.98-2.68,7.57-52.27,31.96-35.79,11.9,8.04,16.61-34.64,17.73-51.28","sw":"3.61"} ,
    {"type":"path","d":"M472.45,874.23c-3.8,2.38-8.58,5.49-9.21,13.45-1.59,20.19-15.71,20.63-23.94,21.54-15.32,1.69-23.99-3.11-27.66-13.96","sw":"3.61"} ,
    {"type":"path","d":"M338.83,331.82c0-16.4,22.55-9.26,31.49-5.57,9.71,4.01,17.51,8.53,20.08,14.99,3.09,7.76-3.34,12.56-4.1,32.95-.2,5.31.25,4.63.17,15.24-.08,11.06-2.08,59.74-3.93,92.2-2.92,51.08-31.29,93.28-43.71,93.28","sw":"3.61"} ,
    {"type":"path","d":"M378.34,368.18c-12.75-4.14-21.41-6.62-34.04-6.35-5.48-.02-5.48-8.97-5.48-18.63","sw":"3.61"} ,
    {"type":"path","d":"M375.87,413.87c-14.17.25-27.31.64-34.17-3.7-4.23-2.68-2.87-10.32-2.87-19.37","sw":"3.61"} ,
    {"type":"path","d":"M374.52,461.1c-13.11.52-15.81,1.57-28.1,1.18-6.56-.54-7.59-3.66-7.59-19.06","sw":"3.61"} ,
    {"type":"path","d":"M367.36,370.19c-4.42-1.28-13.36-4.2-20.57-2.83-7.21,1.37-7.97,6.49-7.97,12.43","sw":"3.61"} ,
    {"type":"path","d":"M367.36,418.95c-5.82-.75-13.6-1.71-20.72-1.61-7.11.11-7.82,5.36-7.82,13.72","sw":"3.61"} ,
    {"type":"line","x1":"338.62","y1":"494.19","x2":"338.62","y2":"560.72","sw":"3.61"} ,
    {"type":"path","d":"M367.36,467.29c-5.33-.12-19.16,1.37-24.07,2.61-4.91,1.24-4.67,7.96-4.67,13.81","sw":"3.61"} ,
    {"type":"path","d":"M652.02,558.72s3.59,7.17,4.45,9.48c.86,2.31,3.14,8.34,3.15,10.92,0,2.58-10.26,19.7.7,20.32","sw":"3.61"} ,
    {"type":"path","d":"M375.71,149.5c-1.02,1.84-1.37,28.88-.23,37.1,1.14,4.54,7.86,12.98,9.79,15.79,1.94,2.81,41.22,18.82,46.57,19.25,5.35.43,25.28-6.38,40.54,11.14,15.71,18.61,21.4,49.2,27.56,64.9,3.77,9.61,7.94,13.23,14.29,23.9,5.76,9.68,8.62,16.57,21.33,34.1,27,37.26,40.22,34.73,59.8,63.3,19.58,28.57,36.98,61,39.56,65.25,0,0,4.82,5.84,7.35,9.91,2.54,4.06,4.35,10.14,5.67,12.33,1.32,2.19,16.7,27.69,23.06,47.7,0,0,1.99,13.02,3.57,22.56,0,0,1.9,12.71-5.14,22.99,0,0-1.74,3.41-2.46,5.53-.72,2.12-9.42,1.93-6.04-8.16,3.38-10.09,2.31-13.29,2.69-20.52,0,0-1.91-6.39-4.67-10.15,0,0-5.53-7.33-12.12-12.13-2.09-1.7-5.36-3.24-5.36-3.24,0,0-.22,6.01-.18,7.95.04,1.94,3.5,9.91,1.46,15.76-2.04,5.85-7.91,4.84-10.96,3-3.05-1.84-3.3-6.54-3.93-18.6-1.49-6.17-6.3-9.7-7.71-15.25-1.41-5.56-.74-6.25-2.98-12.55-2.24-6.3,1.79-16.57,1.8-22.59-.61-3.8-9.18-11.08-21.44-20.47-12.26-9.39-30.04-21.7-59.97-52.39-6.16-6.31-6.35-6.82-11.12-11.94-3.91-4.19-6.07-7.1-8.05-10.19-2.16-3.37-4.15-9.21-8.76-16.07-4.32-6.44-20.03-32.14-39.79-54.09-19.76-21.95-24.38-34.22-24.38-34.22,0,0-4.14,12.26-4.94,15.59-.8,3.33-7.97,35.28-11.79,43.9-3.83,8.63-7.81,30.58-8.45,32.7-.64,2.12-2.07,20.74-.16,30.43,1.91,9.69,16.73,43,22.31,61.32,1.74,4.82,4.15,7.81,8.45,24.83,0,0,18.59,52.38,20.75,89.3,2.16,36.92-5.04,133.66-11.88,209.21-.72,11.16,3.78,26.12,4.81,31.29,6.15,30.83,28.82,52.36,11.01,168.51,0,0-12.73,77.35-3.41,99.1,9.32,21.75,19.43,33.88,21.3,36.66,1.86,2.78,15.17,17.45,17.3,20.48,2.13,3.03,8.23,10.31,2.46,15.94,0,0-1.97,5.43-7.67,4.24,0,0-.14,3.5-7.45,3.11,0,0-2.58,4.63-10.65,1.98,0,0-12.18,10.25-21.93-2.91,0,0-19.57-2.17-17.05-20.69.11-4.03-10.78-2.4-12.27-14.49-.23-5.45,2.64-10.78,1.49-17.43-1.15-6.64-1.38-13.62-1.26-16.56.11-2.94-5.39-1.52-.57-16.67,4.82-15.14-8.78-72.54-13.56-114.02-3.51-13.63-17.85-31.19-10.52-99.62,0,0-5.97-18.09-7.42-20.65-1.45-2.56-15.56-23.45-15.56-50.63-.41-12.22-7.26-71.32-15.76-101.27-8.5-29.95-17.21-75.06-19.29-92.01-2.07-16.94-12.19-21.28-15.12-21.28","sw":"3.61"} ,
    {"type":"path","d":"M337.99,609.79c-2.93,0-13.04,4.33-15.12,21.28-2.07,16.94-10.79,62.06-19.29,92.01-8.5,29.95-15.35,89.05-15.76,101.27,0,27.19-14.1,48.07-15.56,50.63-1.45,2.56-7.42,20.65-7.42,20.65,7.33,68.43-7.01,85.99-10.52,99.62-4.78,41.48-18.38,98.88-13.56,114.02,4.82,15.14-.69,13.72-.57,16.67.11,2.94-.11,9.91-1.26,16.56-1.15,6.64,1.72,11.98,1.49,17.43-1.49,12.09-12.38,10.46-12.27,14.49,2.52,18.52-17.05,20.69-17.05,20.69-9.75,13.16-21.93,2.91-21.93,2.91-8.08,2.65-10.65-1.98-10.65-1.98-7.31.4-7.45-3.11-7.45-3.11-5.71,1.19-7.67-4.24-7.67-4.24-5.77-5.62.34-12.91,2.46-15.94,2.13-3.03,15.44-17.7,17.3-20.48,1.86-2.78,11.98-14.92,21.3-36.66,9.32-21.75-3.41-99.1-3.41-99.1-17.81-116.15,4.86-137.68,11.01-168.51,1.03-5.18,5.53-20.14,4.81-31.29-6.84-75.55-14.03-172.29-11.88-209.21,2.16-36.92,20.75-89.3,20.75-89.3,4.29-17.02,6.71-20.01,8.45-24.83,5.58-18.32,20.4-51.63,22.31-61.32,1.91-9.69.48-28.31-.16-30.43s-4.62-24.07-8.45-32.7c-3.83-8.63-11-40.57-11.79-43.9-.8-3.33-4.94-15.59-4.94-15.59,0,0-4.62,12.26-24.38,34.22-19.76,21.95-35.47,47.65-39.79,54.09-4.6,6.86-6.59,12.7-8.76,16.07-1.98,3.09-4.14,6-8.05,10.19-4.77,5.12-4.96,5.63-11.12,11.94-29.93,30.69-47.71,43-59.97,52.39-12.26,9.39-20.83,16.68-21.44,20.47,0,6.02,4.04,16.29,1.8,22.59-2.24,6.3-1.57,6.99-2.98,12.55-1.41,5.56-6.22,9.08-7.71,15.25-.63,12.06-.89,16.76-3.93,18.6-3.05,1.84-8.92,2.85-10.96-3-2.04-5.85,1.43-13.82,1.46-15.76.04-1.94-.18-7.95-.18-7.95,0,0-3.27,1.54-5.36,3.24-6.59,4.81-12.12,12.13-12.12,12.13-2.76,3.76-4.67,10.15-4.67,10.15.37,7.23-.69,10.43,2.69,20.52,3.38,10.09-5.31,10.28-6.04,8.16-.72-2.12-2.46-5.53-2.46-5.53-7.04-10.28-5.14-22.99-5.14-22.99,1.58-9.54,3.57-22.56,3.57-22.56,6.35-20,21.74-45.51,23.06-47.7s3.13-8.27,5.67-12.33c2.54-4.06,7.35-9.91,7.35-9.91,2.58-4.25,19.98-36.68,39.56-65.25,19.58-28.57,32.8-26.03,59.8-63.3,12.71-17.53,15.56-24.42,21.33-34.1,6.35-10.67,10.53-14.29,14.29-23.9,6.15-15.7,11.84-46.3,27.56-64.9,15.26-17.52,35.19-10.71,40.54-11.14,5.35-.43,44.64-16.44,46.57-19.25,1.94-2.81,8.65-11.25,9.79-15.79,1.14-8.22.8-35.26-.23-37.1","sw":"3.61"} ,
    {"type":"path","d":"M301.93,160.23c.02.37.04.77.04,1.18.11,2.61.13,5.74.06,9.37v.37c-.06,2.53-.11,4.91-.15,7.18-.02.12-.02.23-.02.33","sw":"3.61"} ,
    {"type":"path","d":"M374.67,160.23c-.02.37-.04.77-.04,1.18-.11,2.61-.13,5.74-.06,9.37v.37c.06,2.53.11,4.91.15,7.18.02.12.02.23.02.33","sw":"3.61"} ,
    {"type":"path","d":"M375.28,185.89c-.27-1.9-.45-4.8-.56-8.17v-.04c-.06-1.98-.11-4.14-.14-6.33,0-.2,0-.4,0-.6-.02-3.14,0-6.35.06-9.32,0-.29,0-.57.02-.84.1-4.59.3-8.49.57-10.44","sw":"3.61"} ,
    {"type":"path","d":"M388.55,97.51s10.97-3.73,9.95,12.13c-1.03,15.86-9.97,22.98-15.86,19.84","sw":"3.61"} ,
    {"type":"path","d":"M288.06,97.51s-10.97-3.73-9.95,12.13c1.03,15.86,9.97,22.98,15.86,19.84","sw":"3.61"} ,
    {"type":"path","d":"M301.38,150.15c.28,1.95.47,5.85.57,10.44,0,.27,0,.55.02.84.06,3.17.08,6.63.05,9.97v.32c-.02,2.07-.06,4.08-.13,5.96v.04c-.11,3.37-.3,6.27-.56,8.17","sw":"3.61"} ,
    {"type":"path","d":"M375.71,148.86s-5.71,19.56-37.09,24.9","sw":"3.61"} ,
    {"type":"path","d":"M300.9,148.86s5.71,19.56,37.09,24.9","sw":"3.61"} ,
    {"type":"path","d":"M319.73,61.63c-.09.07-.18.14-.29.21-16.25,11.66-27.24,12.16-31.39,35.67-1.53,8.66-.31,21.22,5.91,31.97,13.25,22.93,7.31,53.96.34,44.28-14.44-20.05-22.9-47.13-24.54-61.95-4.06-36.65-.69-83.3,31.14-97.05,1.35-.58,2.8-.99,4.26-1.38","sw":"3.61"} ,
    {"type":"path","d":"M303.93,17.68c-.18-16.15,44.52-19.07,63.23-12.86,36.56,12.13,49.78,58.14,47.13,92.31-2.06,26.62-8.83,47.61-29.67,78.95-7.58,11.4-16.12-25.33-1.99-46.6,6.77-10.19,5.91-19.25,5.91-31.97,0-28.69-51.63-23.34-74.05-39.44","sw":"3.61"} ,
    {"type":"path","d":"M336.52,45.76c8.25,12.55,17.36,19.28,29.73,25.8,21.22,11.19,23.49,13.06,22.32,35.19","sw":"3.61"} ,
    {"type":"path","d":"M373.08,56.57c3.89,9.98,17.69,23.18,15.49,45.67","sw":"3.61"} ,
    {"type":"path","d":"M302.32,62.96c-9.63,8.74-15.18,21.31-14.77,42.29","sw":"3.61"} 
  ],
  "femaleBack": [
    {"type":"path","d":"M312.21,290.58c8.93-.99,14.31-1.57,25.44-1.57s17.45.64,26.65,1.71","sw":"3.58"} ,
    {"type":"path","d":"M44.34,498.15c33.36-57.97,69.88-90.12,99.11-135.87","sw":"3.58"} ,
    {"type":"path","d":"M201.71,263.26c11.02-34.36,23.28-48.71,53.53-61.93","sw":"3.58"} ,
    {"type":"path","d":"M130.35,347.05c6.33-6.59,10.96-11.57,25.02-26.58,30.82-32.92,32.27,1.06,69.62-62.15","sw":"3.58"} ,
    {"type":"path","d":"M171.64,370.04c-4.94-29.56,9.15-47.67,36.12-85.88","sw":"3.58"} ,
    {"type":"path","d":"M295.28,464.35c22.09,49.3-61.78,45.65-61.78,91.31","sw":"3.58"} ,
    {"type":"path","d":"M223.42,826.56c20.69-18.42,35.48-118.29,39.63-211.94","sw":"3.58"} ,
    {"type":"path","d":"M259.85,664.74c-5.96,94.34-7.23,121.12-2.23,158.9","sw":"3.58"} ,
    {"type":"path","d":"M218.43,883.93c20.28,31.55,8.47,100.79-2.97,120.98","sw":"3.58"} ,
    {"type":"path","d":"M249.59,894.02c-22.15-6.9-24.23,87.22-17.24,109.78","sw":"3.58"} ,
    {"type":"path","d":"M632.23,498.15c-33.36-57.97-69.88-90.12-99.11-135.87","sw":"3.58"} ,
    {"type":"path","d":"M474.87,263.26c-11.02-34.36-23.28-48.71-53.53-61.93","sw":"3.58"} ,
    {"type":"path","d":"M546.23,347.05c-6.33-6.59-10.96-11.57-25.02-26.58-30.82-32.92-32.27,1.06-69.62-62.15","sw":"3.58"} ,
    {"type":"path","d":"M504.93,370.04c4.94-29.56-9.15-47.67-36.12-85.88","sw":"3.58"} ,
    {"type":"path","d":"M381.3,464.35c-22.09,49.3,61.78,45.65,61.78,91.31","sw":"3.58"} ,
    {"type":"path","d":"M453.16,826.56c-20.69-18.42-35.48-118.29-39.63-211.94","sw":"3.58"} ,
    {"type":"path","d":"M416.73,664.74c5.96,94.34,7.23,121.12,2.23,158.9","sw":"3.58"} ,
    {"type":"path","d":"M458.15,883.93c-20.28,31.55-8.47,100.79,2.97,120.98","sw":"3.58"} ,
    {"type":"path","d":"M426.99,894.02c22.15-6.9,24.23,87.22,17.24,109.78","sw":"3.58"} ,
    {"type":"path","d":"M264.45,918.67s-2.08-33.72-32.16-24.2c-16.39,5.19-24.26-53.98-33.84-19.29","sw":"3.58"} ,
    {"type":"path","d":"M130.2,347.05c-9,30.89,6.63,10.59,13.11,15.23,6.6,4.73-6.21,44.2,26.4,10.16","sw":"3.58"} ,
    {"type":"path","d":"M47.15,469.43c-7.98,13.41-6.85,26.61-.35,31.7,1.67,1.31,5.32,3.08,9.64,2.48,5.76-.8,7.59-5.69,8.14-6.51","sw":"3.58"} ,
    {"type":"path","d":"M177.32,276.12c2.95-4.8,6.82-9,12.8-11.5,9.49-4,13.64,1.41,25.92-2.74,6.11-2.08,7.21-4.14,9.34-3.42,3.21,1.06,5.85,7.37,3.85,29.97v.02","sw":"3.58"} ,
    {"type":"path","d":"M236.74,199.49c10.6.92,18.48.3,23.88,4.47,2.09,1.6,2.42,2.76,5.24,4.94,6.46,4.99,11.03,3.78,11.79,5.84,1.71,4.72-20.73,13.95-41.17,32.02-4.62,4.09-8.48,8.06-11.65,11.56","sw":"3.58"} ,
    {"type":"path","d":"M281.69,462.09c10.83-1.12,4.68-26.51,14.59-48.11,7.6-16.57,30.78-29.28,30.45-51.66-.15-10.44-2.96-30.43-7.38-47.96","sw":"3.58"} ,
    {"type":"path","d":"M241.3,468.31c5.47-2.55,11.83-4.11,18.78-5.13,24.03-3.5,77.54-4.22,77.54,59.06","sw":"3.58"} ,
    {"type":"path","d":"M330.78,597.53c-20.66,19.81-65.06,30.01-87.41,3.39-8.73-10.4-14.67-27.39-6.72-68.28,4.25-21.84,7.28-80.25,61.77-68.17","sw":"3.58"} ,
    {"type":"path","d":"M277.69,617c6.52-.33,25.56.98,24.43,24.36-2.1,43.65,9.65,39.11-1.03,82.9","sw":"3.58"} ,
    {"type":"path","d":"M213.44,822.3c-3.05,13.8,9.82,9.87,22.33-12.22,12.52-22.1,15.14-28.86,17.23-28.49,1.37.25.1,47.41,12.76,64.66,3.57,4.86,11.49,11.92,20.52-16.31","sw":"3.58"} ,
    {"type":"path","d":"M253.7,998.58c-.12.44-.28.94-.47,1.5-2.93,8.82-13.21,30.6-22.65-1.19-1.57-5.3-2.18-8.86-4.42-9.38-5.59-1.28-8.12,19.24-17.96,20.69-7.14,1.04-13.4-12.77-18.68-39.42","sw":"3.58"} ,
    {"type":"path","d":"M292.58,177.24s22.69-10.11,46.37-10.11","sw":"3.58"} ,
    {"type":"line","x1":"337.62","y1":"590.03","x2":"337.62","y2":"522.24","sw":"3.58"} ,
    {"type":"path","d":"M412.13,918.61s2.08-33.66,32.16-24.14c16.39,5.19,24.24-53.98,33.82-19.29","sw":"3.58"} ,
    {"type":"path","d":"M546.38,347.05c9,30.89-6.63,10.59-13.11,15.23-6.6,4.73,6.21,44.2-26.4,10.16","sw":"3.58"} ,
    {"type":"path","d":"M629.42,469.43c7.98,13.41,6.85,26.61.35,31.7-1.67,1.31-5.32,3.08-9.64,2.48-5.76-.8-7.36-5.39-7.91-6.21","sw":"3.58"} ,
    {"type":"path","d":"M499.26,276.12c-2.95-4.8-6.82-9-12.8-11.5-9.49-4-13.64,1.41-25.92-2.74-6.11-2.08-7.21-4.14-9.34-3.42-3.21,1.06-5.85,7.37-3.85,29.97v.02","sw":"3.58"} ,
    {"type":"path","d":"M439.84,199.49c-10.6.92-18.48.3-23.88,4.47-2.09,1.6-2.42,2.76-5.24,4.94-6.46,4.99-11.03,3.78-11.79,5.84-1.71,4.72,20.73,13.95,41.17,32.02,4.62,4.09,8.48,8.06,11.65,11.56","sw":"3.58"} ,
    {"type":"path","d":"M394.88,462.09c-10.83-1.12-4.68-26.51-14.59-48.11-7.6-16.57-30.78-29.28-30.45-51.66.15-10.44,2.96-30.43,7.38-47.96","sw":"3.58"} ,
    {"type":"path","d":"M435.28,468.31c-5.47-2.55-11.83-4.11-18.78-5.13-24.03-3.5-77.54-4.22-77.54,59.06","sw":"3.58"} ,
    {"type":"path","d":"M345.8,597.53c20.66,19.81,65.06,30.01,87.41,3.39,8.73-10.4,14.67-27.39,6.72-68.28-4.25-21.84-7.28-80.25-61.77-68.17","sw":"3.58"} ,
    {"type":"path","d":"M398.88,617c-6.52-.33-25.56.98-24.43,24.36,2.1,43.65-9.65,39.11,1.03,82.9","sw":"3.58"} ,
    {"type":"path","d":"M463.13,822.3c3.05,13.8-9.82,9.87-22.33-12.22-12.52-22.1-15.14-28.86-17.23-28.49-1.37.25-.1,47.41-12.76,64.66-3.57,4.86-11.49,11.92-20.52-16.31","sw":"3.58"} ,
    {"type":"path","d":"M422.88,998.58c.12.44.28.94.47,1.5,2.93,8.82,13.21,30.6,22.65-1.19,1.57-5.3,2.18-8.86,4.42-9.38,5.59-1.28,8.12,19.24,17.96,20.69,7.14,1.04,13.4-12.77,18.68-39.42","sw":"3.58"} ,
    {"type":"path","d":"M271.79,212.24s49.27-7.24,65.83-7.34c17.21-.1,68.49,6.79,68.49,6.79-14.35,4.8-26.54,24.93-30.1,38.7-5.64,21.78-16.03,53.38-21.94,75.09-.75,2.76-4.24,13.84-13.31,13.84h-4.94c-9.07,0-12.56-11.08-13.31-13.84-5.91-21.71-16.31-53.31-21.94-75.09-3.56-13.77-15.76-33.9-30.1-38.7","sw":"3.58"} ,
    {"type":"path","d":"M384,177.24s-22.69-10.11-46.37-10.11","sw":"3.58"} ,
    {"type":"line","x1":"338.95","y1":"590.03","x2":"338.95","y2":"522.24","sw":"3.58"} ,
    {"type":"path","d":"M337.63,591.82s-9.46-2.55-16.67,38.44c-13.08,88.21-32.65,119.17-31.77,169.05.88,49.88-24.49,76.09-25.66,95.48,4.38,82.07-6.09,85.36-13.04,115.68-6.95,30.31-14.97,110.1-13.19,122.3,1.79,12.19-.18,8.71-.88,14.98-.71,6.27-1.75,17.68-.87,24.09.66,4.8,3.02,5.51,1.42,17.36-2.39,13.54-18.97,13.4-32.67,11.93-10.24-1.11-20.64-11.21-28.84-17.31-8.2-6.1-5.2-8.82.34-11.06,6.41-2.58,12.96-3.81,16.47-8.86,3.41-4.93,5.6-5.78,6.15-8.14,2.27-9.61-.15-16.55,1.1-19.86,1.25-3.31,1.53-5.11,2.65-20.01,1.11-14.89-5.58-81.36-11.89-136.94-6.32-55.58,10.93-118.76,15.76-129.34,4.84-10.58,11.75-44.35,9.44-53.36-5.07-13.51-4.84-97.49-6.22-135.77-1.38-38.28-8.52-55.39,8.52-126.31,17.05-70.92,41.69-86.68,42.61-114.83.46-53.14-19.77-83.11-22.51-103.6-2.73-20.5-8.06-28.45-8.06-28.45-10.37,20.45-39.71,58.2-58.2,82.58-8.71,11.49-15.02,20.01-15.77,22.31-4.23,17.78-41.35,56.53-64.05,77.21-22.71,20.67-32.08,32.31-32.7,37.69-.68,7.23,2.05,19.48-5.22,40.26-7.27,20.78-.14,31.4-4.75,33.14-16.3,5.06-10.26-29.69-10.26-29.69-5.71,1.4-5.3-.38-6.89,1.67-11.3,6.73-13.45,9.64-15.58,14.12-2.14,4.49-1.51,22.74.08,32.4,1.58,9.66-4.35,8.27-4.35,8.27,0,0-1.74-3.64-3.64-7.03-1.9-3.41-3.09-7.19-4.9-15.34-3.7-15.2-.74-19.25.74-27.65,1.04-14.19,3.45-12.69,7.4-21.14,5.94-12.66,16-26.79,19.26-35.62,3.26-8.83,9.38-17.77,9.38-17.77,44.93-88.76,60.61-102.4,74.35-115.82,8.55-8.36,29.68-42.46,39.79-60.02,8.58-14.88,16.7-21.58,22.82-30.76.57-.85,11.17-37.99,24.43-58.92,10.71-16.91,27.4-17.82,34.98-17.7,1.81.02,3.1.11,3.67.04,2.46-.27,37.08-15.1,52.18-22.3.09-.04.17-.08.26-.12","sw":"3.58"} ,
    {"type":"path","d":"M25.37,556.68s-2,11.78-3.31,18.27c-.54,2.66.18,11.46,1.15,14.33.98,2.86,6.21,8.32,2.93,11.1-3.28,2.77-6.94,1.95-10.34-8.08","sw":"3.58"} ,
    {"type":"path","d":"M338.95,591.82s9.46-2.55,16.67,38.44c13.08,88.21,32.64,119.17,31.77,169.05-.88,49.88,24.49,76.09,25.65,95.48-4.37,82.07,6.09,85.36,13.05,115.68,6.94,30.31,14.97,110.1,13.18,122.3-1.78,12.19.18,8.71.89,14.98s1.74,17.68.86,24.09c-.66,4.8-3.02,5.51-1.42,17.36,2.39,13.54,18.98,13.4,32.68,11.93,10.23-1.11,20.63-11.21,28.83-17.31,8.2-6.1,5.2-8.82-.34-11.06-6.41-2.58-12.96-3.81-16.46-8.86-3.42-4.93-5.6-5.78-6.16-8.14-2.26-9.61.15-16.55-1.09-19.86s-1.54-5.11-2.65-20.01c-1.12-14.89,5.57-81.36,11.89-136.94,6.31-55.58-10.93-118.76-15.77-129.34-4.83-10.58-11.75-44.35-9.44-53.36,5.07-13.51,4.84-97.49,6.22-135.77s8.52-55.39-8.52-126.31c-17.04-70.92-41.69-86.68-42.61-114.83-.46-53.14,19.78-83.11,22.51-103.6,2.73-20.5,8.07-28.45,8.07-28.45,10.36,20.45,39.7,58.2,58.19,82.58,8.71,11.49,15.02,20.01,15.77,22.31,4.24,17.78,41.35,56.53,64.05,77.21,22.71,20.67,32.09,32.31,32.7,37.69.68,7.23-2.04,19.48,5.22,40.26,7.27,20.78.14,31.4,4.76,33.14,16.3,5.06,10.26-29.69,10.26-29.69,5.7,1.4,5.29-.38,6.89,1.67,11.3,6.73,13.44,9.64,15.58,14.12,2.13,4.49,1.5,22.74-.08,32.4s4.35,8.27,4.35,8.27c0,0,1.73-3.64,3.64-7.03,1.9-3.41,3.08-7.19,4.89-15.34,3.71-15.2.74-19.25-.74-27.65-1.03-14.19-3.44-12.69-7.4-21.14-5.93-12.66-15.99-26.79-19.25-35.62s-9.38-17.77-9.38-17.77c-44.94-88.76-60.62-102.4-74.36-115.82-8.55-8.36-29.67-42.46-39.79-60.02-8.58-14.88-16.7-21.58-22.81-30.76-.57-.85-11.18-37.99-24.44-58.92-10.71-16.91-27.4-17.82-34.98-17.7-1.81.02-3.1.11-3.67.04-2.46-.27-37.09-15.1-52.18-22.3-.08-.04-.17-.08-.26-.12","sw":"3.58"} ,
    {"type":"path","d":"M651.21,556.68s2,11.78,3.31,18.27c.54,2.66-.18,11.46-1.15,14.33-.98,2.86-6.21,8.32-2.93,11.1,3.28,2.77,6.94,1.95,10.34-8.08","sw":"3.58"} ,
    {"type":"path","d":"M271.79,212.24s43.97-7.34,65.83-7.34c23.19,0,68.49,6.79,68.49,6.79","sw":"3.58"} 
  ]
};
const _ID_TO_MUSCLE = {"mid-lower-pectoralis":"chest","upper-pectoralis":"chest","lats":"back","lowerback":"back","traps-middle":"back","lower-trapezius":"back","upper-trapezius":"back","upper-trapzeius":"back","anterior-deltoid":"shoulders","lateral-deltoid":"shoulders","posterior-deltoid":"shoulders","short-head-bicep":"bicep","long-head-bicep":"bicep","medial-head-triceps":"tricep","long-head-triceps":"tricep","lateral-head-triceps":"tricep","later-head-triceps":"tricep","wrist-flexors":"forearms","wrist-extensors":"forearms","upper-abdominals":"core","lower-abdominals":"core","obliques":"core","gluteus-maximus":"glutes","gluteus-medius":"glutes","outer-quadricep":"legs","rectus-femoris":"legs","inner-quadricep":"legs","inner-thigh":"legs","lateral-hamstrings":"legs","medial-hamstrings":"legs","gastrocnemius":"calves","soleus":"calves","tibialis":"calves"};

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
    <svg viewBox="0 0 676.49 1203.49" fill="none"
      style={{ width: "100%", maxHeight: 380 }}>
      {Object.entries(muscleGroups).map(([gid, paths]) => {
        const color  = getColor(gid);
        const glow   = getGlow(gid);
        return (
          <g key={gid} id={gid} style={glow ? { filter: glow } : undefined}>
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
          ? <line key={i} x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} strokeWidth={p.sw}/>
          : <path key={i} d={p.d} strokeWidth={p.sw}/>
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
    <div style={{ display: "flex", gap: 2, width: "100%", justifyContent: "center" }}>
      <SvgFigure svgKey={isFemale ? "femaleFront" : "maleFront"} levels={levels} subLevels={subLevels} showCardio highlight={highlight} />
      <SvgFigure svgKey={isFemale ? "femaleBack"  : "maleBack"}  levels={levels} subLevels={subLevels} highlight={highlight} />
    </div>
  );
}

function XPBar({ current, needed, color = ACCENT, height = 6 }) {
  const pct = Math.min(100, (current / needed) * 100);
  return (
    <div style={{
      background: DARK1, border: `1px solid ${color}33`,
      borderRadius: 0, height: height + 2, overflow: "hidden", position: "relative"
    }}>
      <div style={{
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


function StatTree({ tree, getGroupXP, getSuperXP, subStats, subLevels, selectedMuscle, onSelectMuscle }) {
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
                            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700,
                              color: meta.color, letterSpacing: 1.5,
                              textShadow: `0 0 6px ${meta.color}` }}>
                              {meta.name.toUpperCase()}
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



// ─── WORKOUT RANDOMIZER ───────────────────────────────────────────────────────
const ANGLE_GROUPS = {
  chest:     { upper:["Incline Bench Press"], mid_lower:["Bench Press","Decline Bench Press","Dumbbell Flyes","Cable Crossover","Pec Deck Machine"], compound:["Dips","Push-ups"] },
  back:      { vertical:["Pull-ups","Lat Pulldown","Chin-ups"], horizontal:["Barbell Row","Seated Cable Row","T-Bar Row","Dumbbell Row"], accessory:["Face Pulls","Shrugs","Back Extension"] },
  shoulders: { press:["Overhead Press","Arnold Press","Pike Push-ups"], lateral:["Lateral Raises","Upright Row","Cable Lateral Raise"], rear:["Rear Delt Flyes"] },
  bicep:     { short_head:["Concentration Curl","Preacher Curl","Barbell Curl","Cable Curl"], long_head:["Incline Curl","Hammer Curl"] },
  tricep:    { long_head:["Skull Crushers","Overhead Tricep Ext"], lateral:["Tricep Pushdown","Diamond Push-ups","Tricep Dips"], compound:["Close-Grip Bench"] },
  legs:      { quad_dom:["Squat","Leg Press","Hack Squat","Leg Extension","Pistol Squat"], ham_dom:["Romanian Deadlift","Leg Curl","Nordic Curl"], compound:["Walking Lunges","Sumo Squat"] },
  glutes:    { max:["Hip Thrust","Glute Bridge","Cable Kickbacks","Donkey Kicks"], med:["Abductor Machine","Fire Hydrants"], compound:["Bulgarian Split Squat","Sumo Deadlift"] },
  core:      { upper_abs:["Crunch","Cable Crunch","Ab Wheel Rollout"], lower_abs:["Hanging Leg Raises","L-Sit"], obliques:["Russian Twists","Side Plank","Bicycle Crunch"], full:["Plank","Dragon Flag"] },
  calves:    { gastro:["Standing Calf Raises","Donkey Calf Raises","Leg Press Calf Raise"], soleus:["Seated Calf Raises"], tibialis:["Tibialis Raise"] },
  forearms:  { flexors:["Wrist Curls"], extensors:["Reverse Wrist Curls","Farmer's Walk"] },
};

const SELECTION_RULES = {
  // Schoenfeld et al. 2017 — 3 exercises/muscle = ~10-15 working sets/session, optimal hypertrophy range
  chest:     { slots:[["upper",1],["mid_lower",1],["compound",1]], total:3 },
  // Ratamess 2009 — vertical + horizontal pull covers all back regions in 3 exercises
  back:      { slots:[["vertical",1],["horizontal",1],["accessory",1]], total:3 },
  // Coburn & Malek 2012 — all 3 deltoid heads in 3 exercises
  shoulders: { slots:[["press",1],["lateral",1],["rear",1]], total:3 },
  // Schoenfeld 2012 — bicep is a small synergist; 2 exercises sufficient per session
  bicep:     { slots:[["short_head",1],["long_head",1]], total:2 },
  // Tricep already loaded by pressing; 2 exercises cover long + lateral heads
  tricep:    { slots:[["long_head",1],["lateral",1]], total:2 },
  // ACSM 2009 — quad dominant + hamstring dominant + 1 isolation covers full leg session
  legs:      { slots:[["quad_dom",1],["ham_dom",1],["compound",1]], total:3 },
  // Contreras 2013 — glute max + glute med covers all functional glute work in 2 exercises
  glutes:    { slots:[["max",1],["med",1]], total:2 },
  // McGill 2010 — flexion, rotation, and anti-extension in 3 exercises = complete core stimulus
  core:      { slots:[["upper_abs",1],["lower_abs",1],["obliques",1]], total:3 },
  // Calves: gastro (straight leg = more gastrocnemius) + soleus (bent knee = more soleus)
  calves:    { slots:[["gastro",1],["soleus",1]], total:2 },
  // Forearms: flexors + extensors = balanced forearm development
  forearms:  { slots:[["flexors",1],["extensors",1]], total:2 },
};

const _ANGLE_GROUP_LABELS = {
  chest:     { upper:"Upper (Incline)", mid_lower:"Mid/Lower (Flat/Decline)", compound:"Compound (Dips/Push)" },
  back:      { vertical:"Vertical Pull", horizontal:"Horizontal Row", accessory:"Accessory" },
  shoulders: { press:"Press", lateral:"Lateral", rear:"Rear Delt" },
  bicep:     { short_head:"Short Head", long_head:"Long Head" },
  tricep:    { long_head:"Long Head", lateral:"Lateral Head", compound:"Compound" },
  legs:      { quad_dom:"Quad Dominant", ham_dom:"Hamstring Dominant", compound:"Compound" },
  glutes:    { max:"Glute Max", med:"Glute Med", compound:"Compound" },
  core:      { upper_abs:"Upper Abs", lower_abs:"Lower Abs", obliques:"Obliques", full:"Full Core" },
  calves:    { gastro:"Gastrocnemius", soleus:"Soleus", tibialis:"Tibialis" },
  forearms:  { flexors:"Flexors", extensors:"Extensors" },
};

function generateWorkout(muscle, workouts, customExercises, overallLevel, goal, diffFilter = null) {
  let allDB = [...(EXERCISE_DB[muscle] || []), ...(customExercises||[]).filter(e=>e.primary===muscle)];
  if (!allDB.length) return [];
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


// Sub-muscle options per muscle group (for custom exercise builder)
const _CUSTOM_SUB_OPTIONS = {
  chest:     [["upper-pectoralis","Upper Chest"],["mid-lower-pectoralis","Mid/Lower Chest"]],
  back:      [["lats","Lats"],["lowerback","Lower Back"],["upper-trapezius","Upper Traps"],["traps-middle","Mid Traps"],["lower-trapezius","Lower Traps"]],
  shoulders: [["anterior-deltoid","Front Delt"],["lateral-deltoid","Side Delt"],["posterior-deltoid","Rear Delt"]],
  bicep:     [["short-head-bicep","Short Head"],["long-head-bicep","Long Head"]],
  tricep:    [["lateral-head-triceps","Lateral Head"],["medial-head-triceps","Medial Head"],["long-head-triceps","Long Head"]],
  forearms:  [["wrist-flexors","Flexors"],["wrist-extensors","Extensors"]],
  core:      [["upper-abdominals","Upper Abs"],["lower-abdominals","Lower Abs"],["obliques","Obliques"]],
  glutes:    [["gluteus-maximus","Glute Max"],["gluteus-medius","Glute Med"]],
  legs:      [["outer-quadricep","Outer Quad"],["rectus-femoris","Rectus Femoris"],["inner-quadricep","Inner Quad"],["inner-thigh","Inner Thigh"],["lateral-hamstrings","Outer Hamstring"],["medial-hamstrings","Inner Hamstring"]],
  calves:    [["gastrocnemius","Gastrocnemius"],["soleus","Soleus"],["tibialis","Tibialis"]],
};


// ─── QUICK ADD BAR ────────────────────────────────────────────────────────────
function QuickAddBar({ onAdd }) {
  const [qCount, setQCount] = useState("2");
  const [qReps, setQReps] = useState("");
  const [qWeight, setQWeight] = useState("");
  const valid = parseInt(qCount) > 0 && parseFloat(qReps) > 0 && parseFloat(qWeight) > 0;
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
            placeholder="10" style={{ textAlign: "center", color: ACCENT, padding: "9px 4px" }} />
          <div style={{ position: "absolute", bottom: -12, left: 0, right: 0, fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, textAlign: "center" }}>reps</div>
        </div>
        <div style={{ position: "relative" }}>
          <input className="input-field" type="number" value={qWeight} onChange={e => setQWeight(e.target.value)}
            placeholder="135" style={{ textAlign: "center", color: GOLD, padding: "9px 6px" }} />
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
          → {qCount}× {qReps} reps @ {wtVal(qWeight)} {wtLabel()}
        </div>
      )}
    </div>
  );
}


// ─── EXERCISE LOG MODAL ───────────────────────────────────────────────────────
function ExerciseLogModal({ exercise, muscle, weightLbs, profile, onConfirm, onClose }) {
  const isCardio = exercise.type === "cardio";
  const isCali   = exercise.type === "calisthenics";
  const isSpeed  = isCardio && exercise.cardioMode === "speed";

  const defaultSet = { reps: "", weight: isCali ? String(wtVal(Math.round(weightLbs||170))) : "" };
  const [setRows, setSetRows] = useState([{ ...defaultSet }, { ...defaultSet }, { ...defaultSet }]);
  const updateSet = (i, field, val) => setSetRows(s => s.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const addSet    = () => setSetRows(s => [...s, { ...defaultSet }]);
  const removeSet = (i) => setSetRows(s => s.filter((_, idx) => idx !== i));

  const [cardioMinutes, setCardioMinutes] = useState("");
  const [speedMph, setSpeedMph] = useState(String(exercise.defaultSpeed || 3.5));

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
  const validSets   = setRows.filter(r => parseFloat(r.reps) > 0);

  const totalXP = isCardio
    ? (parsedMins > 0 ? calcXP(exercise, 1, parsedMins, weightLbs, isSpeed ? { speedMph: parsedSpeed } : {}) : 0)
    : validSets.reduce((sum, r) => {
        const reps = parseFloat(r.reps) || 0;
        const w    = parseFloat(r.weight) || (isCali ? weightLbs : 0);
        if (reps <= 0) return sum;
        return sum + calcSetXP(exercise, reps, w || weightLbs, weightLbs, storedE1RM);
      }, 0);

  const sessionBestE1RM = isCali || isCardio ? null : validSets.reduce((best, r) => {
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
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(7,11,20,0.92)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`,
        border: `1px solid ${meta.color}66`, borderTop: `2px solid ${meta.color}`,
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
        padding: "24px 20px 32px", width: "100%", maxWidth: 480,
        boxShadow: `0 -8px 40px ${meta.color}22`, position: "relative",
        maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />

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
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: TEXT, fontWeight: 700 }}>{s.reps}<span style={{ color: MUTED, fontSize: 7 }}> reps</span></div>
                  {parseFloat(s.weight) > 0 && !isCali && (
                    <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT }}>{wtVal(s.weight)} {wtLabel()}</div>
                  )}
                </div>
              ))}
            </div>
            {lastBest && !isCali && (
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: GOLD, marginTop: 5 }}>
                BEST SET — {lastBest.reps} reps @ {wtVal(lastBest.weight)} {wtLabel()}
              </div>
            )}
          </div>
        )}

        {/* Inputs */}
        {isCardio ? (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: isSpeed ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2, marginBottom: 4 }}>TIME (MIN)</div>
                <input className="input-field" type="number" value={cardioMinutes}
                  onChange={e => setCardioMinutes(e.target.value)} placeholder="30"
                  style={{ color: ACCENT, fontWeight: 700, fontSize: 16, textAlign: "center" }} />
              </div>
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
            {parsedMins > 0 && (
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, padding: "7px 10px", background: `${ACCENT}08`, border: `1px solid ${ACCENT}22`, borderRadius: 4 }}>
                {isSpeed ? `MET(${parsedSpeed} mph) × ${(weightLbs * 0.453592).toFixed(0)} kg × ${(parsedMins / 60).toFixed(2)} h` : `MET ${exercise.met} × ${(weightLbs * 0.453592).toFixed(0)} kg × ${(parsedMins / 60).toFixed(2)} h`}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            {!isCali && <QuickAddBar onAdd={(count, reps, weight) => {
              const newRows = Array.from({ length: count }, () => ({ reps: String(reps), weight: String(weight) }));
              setSetRows(s => [...s, ...newRows]);
            }} />}
            {setRows.length > 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: isCali ? "28px 1fr 24px" : "28px 80px 1fr 24px", gap: 6, marginBottom: 4, marginTop: 16 }}>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1, textAlign: "center" }}>#</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1 }}>REPS</div>
                  {!isCali && <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 8, color: MUTED, letterSpacing: 1 }}>WEIGHT ({wtLabel().toUpperCase()})</div>}
                  <div />
                </div>
                {setRows.map((row, i) => {
                  const lastRow = lastSession?.sets_detail?.[i];
                  const prReps   = lastRow && parseFloat(row.reps)   > parseFloat(lastRow.reps);
                  const prWeight = lastRow && parseFloat(row.weight) > parseFloat(lastRow.weight);
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: isCali ? "28px 1fr 24px" : "28px 80px 1fr 24px", gap: 6, marginBottom: 5, alignItems: "center" }}>
                      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, fontWeight: 700, color: parseFloat(row.reps) > 0 ? meta.color : MUTED, textAlign: "center" }}>{i + 1}</div>
                      <input className="input-field" type="number" value={row.reps}
                        onChange={e => updateSet(i, "reps", e.target.value)}
                        placeholder={lastRow ? lastRow.reps + " last" : "10"}
                        style={{ textAlign: "center", color: ACCENT, padding: "7px 6px", borderColor: prReps ? GREEN + "88" : undefined }} />
                      {!isCali && (
                        <input className="input-field" type="number" value={row.weight}
                          onChange={e => updateSet(i, "weight", e.target.value)}
                          placeholder={lastRow ? lastRow.weight + " last" : "135"}
                          style={{ textAlign: "center", color: GOLD, padding: "7px 6px", borderColor: prWeight ? GREEN + "88" : undefined }} />
                      )}
                      <button onClick={() => removeSet(i)} style={{ background: "none", border: "none", color: MUTED, fontSize: 15, cursor: "pointer", lineHeight: 1 }}>×</button>
                    </div>
                  );
                })}
              </>
            )}
            <button onClick={addSet} style={{
              width: "100%", marginTop: 6, background: `${ACCENT}06`, border: `1px dashed ${ACCENT}28`,
              borderRadius: 6, padding: "7px", cursor: "pointer",
              fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 2
            }}>+ BLANK SET</button>
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

        <button className="btn-gold" onClick={() => {
          if (!canLog) return;
          if (isCardio) {
            onConfirm({ sets: 1, reps: parsedMins, weight: weightLbs, xp: totalXP, cals: totalXP,
              cardioData: { minutes: parsedMins, speedMph: isSpeed ? parsedSpeed : null, met: exercise.met } });
          } else {
            const setsDetail = validSets.map(r => ({
              reps: parseFloat(r.reps) || 0,
              // Always store in lbs internally; convert from kg if needed
              weight: wtValBack(parseFloat(r.weight) || (isCali ? wtVal(weightLbs) : 0)),
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
      </div>
    </div>
  );
}


// ─── SCREEN: FREE WORKOUT ─────────────────────────────────────────────────────
function FreeWorkoutScreen({ st, onLogExercise, onUnlogExercise, settings, toast }) {
  const MUSCLE_CATEGORIES = ["chest","back","legs","shoulders","bicep","tricep","forearms","core","glutes","calves","cardio"];
  const [selMuscle, setSelMuscle] = useState("chest");
  const [browseSearch, setBrowseSearch] = useState("");
  const [logModal, setLogModal] = useState(null);
  const [sessionLog, setSessionLog] = useState([]);
  const [editModal, setEditModal] = useState(null);
  const [selDay, setSelDay] = useState(0); // 0=today
  const allBrowseExercises = [
    ...(EXERCISE_DB[selMuscle] || []),
    ...(st.customExercises||[]).filter(e => e.primary === selMuscle)
  ].slice().sort((a, b) => a.name.localeCompare(b.name));
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
    <div style={{ height: "100vh", overflowY: "auto", background: BG, padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${BG2}f8, ${DARK1}ee)`,
        borderBottom: `1px solid ${ACCENT}33`, padding: "18px 20px 0" }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700,
          color: GOLD, letterSpacing: 2, marginBottom: 12 }}>{themeLabel(settings,"workout","WORKOUT")}</div>

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
                <button key={d} onClick={() => setSelDay(i)} style={{
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
                return (
                  <div key={i} style={{
                    background: BG2, border: `1px solid ${muscleMeta.color}33`,
                    borderLeft: `3px solid ${muscleMeta.color}`,
                    borderRadius: 10, padding: "12px 14px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div>
                        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 14,
                          fontWeight: 700, color: TEXT }}>{w.exerciseName}</div>
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
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9,
                color: GOLD, letterSpacing: 3, marginBottom: 8 }}>{"// THIS SESSION"}</div>
              {sessionLog.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between",
                  fontFamily: "'Rajdhani',sans-serif", fontSize: 12,
                  color: TEXT, paddingBottom: 4, marginBottom: 4,
                  borderBottom: `1px solid ${ACCENT2}22` }}>
                  <span>{l.name}</span>
                  <span style={{ color: GOLD }}>+{l.xp} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BROWSE + LOG TAB ── */}
      {tab === "browse" && (
        <div style={{ padding: "14px 16px 0" }}>
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



      {/* Log / Edit modal */}
      {(logModal || editModal) && (
        <ExerciseLogModal
          exercise={(logModal || editModal).exercise}
          muscle={(logModal || editModal).muscle}
          weightLbs={st.weightLbs || 170}
          profile={st}
          onConfirm={data => {
            const modal = logModal || editModal;
            const entry = { exerciseName: modal.exercise.name, muscle: modal.muscle,
              exercise: modal.exercise, sets: data.sets, reps: data.reps,
              weight: data.weight, sets_detail: data.sets_detail,
              newE1RM: data.newE1RM, isPR: data.isPR, xp: data.xp, cals: data.cals, date: Date.now() };
            if (modal.originalEntry) onUnlogExercise(modal.originalEntry);
            onLogExercise(entry);
            setSessionLog(s => [...s, { name: modal.exercise.name, xp: data.xp }]);
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

function DatabaseScreen({ st, onLogExercise, onSaveCustomExercise, settings, toast }) {
  const [selMuscle, setSelMuscle] = useState("chest");
  const [searchQ, setSearchQ] = useState("");
  const [customMode, setCustomMode] = useState(false);

  const [randoMode, setRandoMode] = useState(false);
  const [randoMuscles, setRandoMuscles] = useState([]);
  const [randoPlan, setRandoPlan] = useState(null);
  const [randoDiff, setRandoDiff] = useState("all");


  const toggleRandoMuscle = (m) =>
    setRandoMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const runRandomizer = () => {
    if (randoMuscles.length === 0) return;
    const plans = randoMuscles.map(m => generateWorkout(m, st.workouts, st.customExercises, st.overallLevel, st.goal, randoDiff));
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
  const allExercises = isSearching
    ? [...Object.entries(EXERCISE_DB).flatMap(([, exs]) => exs), ...allCustom]
    : getExercisesForMuscle(selMuscle);
  const filtered = (isSearching
    ? allExercises.filter(e => e.name.toLowerCase().includes(searchQ.toLowerCase()))
    : allExercises
  ).slice().sort((a, b) => a.name.localeCompare(b.name));

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
    <div style={{ height: "100vh", overflowY: "auto", background: BG, padding: "20px 20px calc(120px + env(safe-area-inset-bottom, 0px))", paddingTop: "20px" }}>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 700, color: GOLD, letterSpacing: 2, marginBottom: 4 }}>{themeLabel(settings,"database","DATABASE")}</div>
      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: MUTED, letterSpacing: 2, marginBottom: 18 }}>EXERCISE COMPENDIUM</div>

      {/* Search */}
      <input className="input-field" value={searchQ} onChange={e => setSearchQ(e.target.value)}
        placeholder="Search exercises..." style={{ marginBottom: 14 }} />

      {/* Muscle filter — major groups only, pill style */}
      {!isSearching && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
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
            const sel = selMuscle === key;
            return (
              <button key={key} onClick={() => { setSelMuscle(key); setSearchQ(""); }} style={{
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
          return (
            <div key={i} style={{ background: BG2, border: `1px solid ${meta.color}22`, borderLeft: `3px solid ${meta.color}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, fontWeight: 700, color: TEXT }}>{ex.name}</div>
                <div style={{ display: "flex", gap: 5 }}>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: diffColor, background: `${diffColor}22`, padding: "2px 7px", borderRadius: 8, letterSpacing: 1 }}>{ex.diff?.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: typeColor, background: `${typeColor}22`, padding: "2px 7px", borderRadius: 8, letterSpacing: 1 }}>{ex.type?.toUpperCase()}</span>
                </div>
              </div>
              {subs.length > 0 && (
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED, marginBottom: 6 }}>
                  {subs.join(" · ")}
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
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(7,11,20,0.93)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setRandoMode(false)}>
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
        </div>
      )}
    </div>
  );
}


function ScheduleScreen({ st, onLogExercise, onUnlogExercise, onUpdateSchedule, onLogFood, settings, toast }) {
  const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const [selDay, setSelDay] = useState(todayIdx);
  const [logModal, setLogModal] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [randoMode, setRandoMode] = useState(false);
  const [randoMuscles, setRandoMuscles] = useState([]);
  const [randoPlan, setRandoPlan] = useState(null);
  const [randoDiff, setRandoDiff] = useState("all");

  const [nutInput, setNutInput] = useState({ cal: "", protein: "" });

  const toggleRandoMuscle = (m) =>
    setRandoMuscles(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const runRandomizer = () => {
    if (!randoMuscles.length) return;
    const plans = randoMuscles.map(m =>
      generateWorkout(m, st.workouts, st.customExercises, st.overallLevel, st.goal, randoDiff));
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
    <div style={{ height: "100vh", overflowY: "auto", background: BG, padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
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
              letterSpacing: 3, marginBottom: 8 }}>{"// TODAY'S PLAN · {todayPlan.label}"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todayPlan.exercises.map((ex, i) => {
                const mm = MUSCLE_META[ex.muscle] || MUSCLE_META.chest;
                const alreadyLogged = byDay[selDay].some(w => w.exerciseName === ex.name);
                return (
                  <div key={i} style={{ background: BG2,
                    border: `1px solid ${alreadyLogged ? GREEN+"44" : mm.color+"22"}`,
                    borderLeft: `3px solid ${alreadyLogged ? GREEN : mm.color}`,
                    borderRadius: 8, padding: "10px 12px",
                    display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13,
                        fontWeight: 700, color: alreadyLogged ? GREEN : TEXT }}>{ex.name}</div>
                      <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10,
                        color: mm.color }}>{mm.name}</div>
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
            <div style={{ position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(7,11,20,0.93)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center" }}
              onClick={() => { setLogModal(null); setEditEntry(null); }}>
              <div onClick={e => e.stopPropagation()} className="slide-up" style={{
                background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`,
                border: `1px solid ${ACCENT}55`, borderTop: `2px solid ${ACCENT}`,
                width: "100%", maxWidth: 480, padding: "20px 20px 36px",
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
            </div>
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
            <div style={{ position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(7,11,20,0.93)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "flex-end", justifyContent: "center" }}
              onClick={() => { setLogModal(null); setEditEntry(null); }}>
              <div onClick={e => e.stopPropagation()} className="slide-up" style={{
                background: `linear-gradient(160deg, ${BG2}f8, ${DARK1}f5)`,
                border: `1px solid ${mm.color}55`, borderTop: `2px solid ${mm.color}`,
                width: "100%", maxWidth: 480, padding: "20px 20px 36px", maxHeight: "75vh",
                overflowY: "auto", display: "flex", flexDirection: "column",
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
                <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
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
            </div>
          );
        }
        return (
          <ExerciseLogModal
            exercise={modal.exercise}
            muscle={modal.muscle}
            weightLbs={st.weightLbs || 170}
            profile={st}
            onConfirm={data => {
              // Use the selected day's date, not today
              const entryDate = modal.targetDate || getDayDate(selDay);
              onLogExercise({ exerciseName: modal.exercise.name, muscle: modal.muscle,
                exercise: modal.exercise, sets: data.sets, reps: data.reps,
                weight: data.weight, sets_detail: data.sets_detail,
                newE1RM: data.newE1RM, isPR: data.isPR, xp: data.xp, cals: data.cals,
                date: entryDate });
              // If editing, unlog the original entry first
              if (modal.originalEntry) onUnlogExercise(modal.originalEntry);
              setLogModal(null); setEditEntry(null);
              const dayLabel2 = selDay === todayIdx ? "today" : DAYS[selDay];
              toast(`${modal.exercise.name} logged for ${dayLabel2}! +${data.xp} XP`, GOLD);
            }}
            onClose={() => { setLogModal(null); setEditEntry(null); }}
          />
        );
      })()}

      {/* Randomizer muscle picker */}
      {randoMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(7,11,20,0.93)",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
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
        </div>
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
    <div style={{ height: "100vh", overflowY: "auto", background: BG, padding: "20px 20px calc(120px + env(safe-area-inset-bottom, 0px))", paddingTop: "20px" }}>
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

// ─── TOAST ────────────────────────────────────────────────────────────────────

function Toasts({ toasts }) {
  return (
    <div style={{ position: "fixed", top: 16, right: 16, zIndex: 999, display: "flex", flexDirection: "column", gap: 8, maxWidth: 300 }}>
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
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: `linear-gradient(180deg, ${DARK1}ee, ${BG2}ff)`,
      backdropFilter: "blur(16px)",
      borderTop: `1px solid ${ACCENT}44`,
      boxShadow: `0 -4px 24px ${ACCENT}18`,
      display: "flex", alignItems: "stretch",
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
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
            style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 4,
              padding: "10px 0 12px",
              position: "relative",
              background: isHome && active
                ? `linear-gradient(180deg, ${ACCENT}18, transparent)`
                : "none",
              border: "none",
              borderTop: isHome
                ? `2px solid ${active ? ACCENT : ACCENT + "44"}`
                : `2px solid transparent`,
              cursor: "pointer",
              transition: "all .2s",
              filter: active ? `drop-shadow(0 0 6px ${ACCENT})` : "none",
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
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column",
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

function AuthPanel({ onClose, onSignIn, onSignUp, busy, error }) {
  const [mode, setMode]         = useState("signin"); // "signin" | "signup"
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
    <div style={{ position: "fixed", inset: 0, zIndex: 310, background: "rgba(3,6,15,0.95)",
      backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
        border: `1px solid ${ACCENT}44`, borderTop: `2px solid ${ACCENT}`,
        width: "100%", maxWidth: 480, padding: "24px 20px 40px",
        maxHeight: "85vh", overflowY: "auto",
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
    </div>
  );
}


// ─── SCREEN: MENU (HOME) ──────────────────────────────────────────────────────

function MenuScreen({ st, setScreen, onLogFood, onUpdateWeight, settings, onUpdateSettings, toast,
                     account, onSignIn, onSignUp, onSignOut, onToggleSharePrs, pendingCount = 0 }) {
  const rank = getRank(st.overallLevel);
  const { current, needed } = getLevelFromXP(st.overallXP);
  const [settingsOpen, setSettingsOpen] = useState(null); // null | "settings" | "help" | "account"
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
    <div style={{ height: "100vh", overflowY: "auto", background: BG, padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))", position: "relative" }}>
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
      {["⬡", "◈", "⟁"].map((r, i) => (
        <div key={i} style={{ position: "absolute", fontSize: 16, color: ACCENT, top: `${20 + i * 25}%`,
          left: i % 2 === 0 ? `${3 + i}%` : `${88 - i * 2}%`,
          animation: `runeFloat ${3 + i}s ease-in-out ${i * 0.7}s infinite`, opacity: 0.12, pointerEvents: "none" }}>{r}</div>
      ))}

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: ACCENT, letterSpacing: 4, opacity: 0.7, marginBottom: 2 }}>{`// ${themeLabel(settings,"hunter","HUNTER")} STATUS`}</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 16, fontWeight: 900, color: GOLD,
              letterSpacing: 3, textShadow: `0 0 14px ${GOLD}88` }}>{st.name.toUpperCase()}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
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
            <div style={{ textAlign: "right" }}>
              <div style={{
                fontFamily: "'Orbitron',sans-serif", fontSize: 28, fontWeight: 900, color: rank.color,
                textShadow: `0 0 20px ${rank.color}, 0 0 40px ${rank.color}66`,
                lineHeight: 1
              }}>{rank.rank}</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, color: rank.color, letterSpacing: 3, opacity: 0.8 }}>{rank.label.toUpperCase()}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, color: ACCENT, letterSpacing: 2, textShadow: `0 0 6px ${ACCENT}` }}>LVL {st.overallLevel}</span>
          <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED }}>{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
        </div>
        <XPBar current={current} needed={needed} color={GOLD} height={4} />
      </div>

      <div style={{ padding: "20px" }}>
        {/* Today's mission */}
        <div style={{
          background: `linear-gradient(135deg, ${BG2}f0, ${DARK1}e8)`,
          border: `1px solid ${ACCENT}44`, borderTop: `1px solid ${ACCENT}99`,
          clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
          padding: "16px", marginBottom: 16, position: "relative"
        }}>
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

                {/* ── DAILY TIP ── */}
        {(() => {
          const tip = dailyTip;
          const catColors = { TRAINING: ACCENT, RECOVERY: "#00ff88", NUTRITION: GOLD, "APP TIP": "#cc44ff" };
          const col = catColors[tip.category] || ACCENT;
          return (
            <div onClick={() => setTipExpanded(e => !e)} style={{
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
        <div style={{
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
                {wtVal(st.weightLbs || 0).toFixed(1)}
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

        {/* Quick actions */}}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <button className="btn-primary" onClick={() => setScreen("schedule")}
            style={{ padding: "16px", fontSize: 14, letterSpacing: 2 }}>
            <span style={{ fontSize: 11 }}>{_isShadow ? "BEGIN THE HUNT" : _isBeast ? "UNLEASH" : _isArchitect ? "INITIATE PROTOCOL" : "START TRAINING"}</span>
          </button>
          <button onClick={() => setScreen("character")} style={{
            background: `${GOLD}11`, border: `1px solid ${GOLD}44`, borderRadius: 8,
            padding: "16px", cursor: "pointer", transition: "all .2s",
            fontFamily: "'Rajdhani',sans-serif", fontSize: 14, color: GOLD, fontWeight: 700, letterSpacing: 2
          }}>
            <span style={{ fontSize: 11 }}>MY STATS</span>
          </button>
        </div>

        {/* Social actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
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

        {/* Recent workouts */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 4, marginBottom: 10 }}>{_isBeast ? "[ RECENT KILLS ]" : _isShadow ? "[ SHADOW RECORD ]" : _isArchitect ? "[ ACTIVITY LOG ]" : "[ RECENT ACTIVITY ]"}</div>
          {st.workouts.length === 0 ? (
            <div className="card" style={{ padding: 16, textAlign: "center" }}>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, color: MUTED }}>No battles recorded yet.<br />Begin your first training session.</div>
            </div>
          ) : (
            st.workouts.slice(-3).reverse().map((w, i) => (
              <div key={i} className="card" style={{ padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 13, fontWeight: 700, color: TEXT }}>{w.muscle ? MUSCLE_META[w.muscle]?.name : "Training"}</div>
                  <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>{new Date(w.date).toLocaleDateString()}</div>
                </div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 14, fontWeight: 700, color: GOLD }}>+{w.xp} XP</div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* ── SETTINGS MODAL ── */}
      {settingsOpen === "settings" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(3,6,15,0.95)",
          backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setSettingsOpen(null)}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{
            background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
            border: `1px solid ${ACCENT}44`, borderTop: `2px solid ${ACCENT}`,
            width: "100%", maxWidth: 480, padding: "24px 20px 40px",
            maxHeight: "85vh", overflowY: "auto",
            clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${ACCENT}cc, transparent)` }} />
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
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
          </div>
        </div>
      )}

      {/* ── HELP MODAL ── */}
      {settingsOpen === "help" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(3,6,15,0.95)",
          backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setSettingsOpen(null)}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{
            background: `linear-gradient(160deg, ${BG2}fc, ${DARK1}fa)`,
            border: `1px solid ${GOLD}44`, borderTop: `2px solid ${GOLD}`,
            width: "100%", maxWidth: 480, padding: "24px 20px 40px",
            maxHeight: "85vh", overflowY: "auto",
            clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)"
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${GOLD}cc, transparent)` }} />
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
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(3,6,15,0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
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
    </div>
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
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(3,6,15,0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
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
    </div>
  );
}


function CharacterScreen({ store, onSwitchProfile, onCreateProfile, onDeleteProfile, onUpdateProfile, toast }) {
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
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [prHistoryOpen, setPrHistoryOpen]   = useState(false);
  const [heatmapOpen, setHeatmapOpen]       = useState(false);

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
    <div style={{ height: "100vh", overflowY: "auto", background: BG, padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
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
              <button key={p.id} onClick={() => onSwitchProfile(p.id)} style={{
                background: isActive ? `${ACCENT}22` : BG3,
                border: `1px solid ${isActive ? ACCENT : ACCENT2 + "44"}`,
                borderRadius: 10, padding: "8px 14px", cursor: "pointer", flexShrink: 0,
                textAlign: "center", minWidth: 80, transition: "all .15s"
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
        {/* ── RANK CARD ── */}
        <div style={{ background: `${rank.color}11`, border: `1px solid ${rank.color}44`,
          borderRadius: 14, padding: "16px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: MUTED, letterSpacing: 3 }}>OVERALL RANK</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 38, fontWeight: 900,
                  color: rank.color, textShadow: `0 0 24px ${rank.color}66`, lineHeight: 1 }}>{rank.rank}</div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 12, color: rank.color, letterSpacing: 2 }}>{rank.label}</div>
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
                <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
              </div>
              <XPBar current={current} needed={needed} color={rank.color} height={6} />
            </div>
          </div>
        </div>

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

        {/* ── BODY FIGURE ── */}
        <div style={{ marginBottom: 16, padding: "0 8px" }}>
          <BodyFigure levels={st.levels} subLevels={subMuscleLevels} gender={st.gender} highlight={selectedMuscle} />
        </div>

        {/* Progression entry points */}
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

        {/* ── STATS ── */}
        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4, marginBottom: 10 }}>[ SPECIAL ATTRIBUTES ]</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {specialStats.map(m => <StatBadge key={m} muscle={m} level={st.levels[m]||1} xp={st.stats[m]||0}/>)}
        </div>

        <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: ACCENT, letterSpacing: 4, marginBottom: 10 }}>[ MUSCLE LEVELS ]</div>
        <StatTree
          tree={STAT_TREE}
          getGroupXP={getGroupXP}
          getSuperXP={getSuperXP}
          subStats={subStats}
          subLevels={subLevels}
          selectedMuscle={selectedMuscle}
          onSelectMuscle={(id) => setSelectedMuscle(prev => prev === id ? null : id)}
        />
      </div>

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

function ProfileViewerModal({ profile, isAdmin, viewHidden, onClose, onToggleHidden, onRefresh, toast }) {
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  const rc = _rankColor(profile.rank_label);

  const confirmPrompt = (msg) => typeof window !== "undefined" && window.confirm(msg);

  const wrap = async (label, fn, successMsg, color = ACCENT) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast?.(successMsg, color);
      onRefresh?.();
    } catch (e) { toast?.(`${label} failed: ${e.message || e}`, RED); }
    finally { setBusy(false); }
  };

  const togglePrs = () => wrap(
    "Toggle PRs",
    () => adminService.setSharePrs(profile.user_id, !profile.share_prs),
    `Share PRs ${!profile.share_prs ? "enabled" : "disabled"} for @${profile.username}`,
  );

  const toggleSuspend = () => {
    const nextVal = !profile.suspended;
    if (nextVal && !confirmPrompt(`Suspend @${profile.username}? They'll be hidden from leaderboards until you reverse this.`)) return;
    wrap(
      "Suspend",
      () => adminService.setSuspended(profile.user_id, nextVal),
      `@${profile.username} ${nextVal ? "suspended" : "unsuspended"}`,
      nextVal ? RED : GREEN,
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
    );
  };

  const resetStats = () => {
    if (!confirmPrompt(`Reset all XP, level, and PRs for @${profile.username}? Their workout history stays on their device.`)) return;
    wrap(
      "Reset stats",
      () => adminService.resetUserStats(profile.user_id),
      `Stats reset for @${profile.username}`,
      RED,
    );
  };

  const sendPasswordReset = () => {
    if (!confirmPrompt(`Send password-reset email to @${profile.username}? They'll get a recovery link in their inbox.`)) return;
    wrap(
      "Password reset",
      () => adminService.sendPasswordResetForUser(profile.user_id),
      `Reset email sent to @${profile.username}`,
      GREEN,
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(3,6,15,0.95)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: `linear-gradient(160deg, ${BG2}fc, ${BG}fa)`,
        border: `1px solid ${ACCENT}33`, borderTop: `2px solid ${ACCENT}`,
        width: "100%", maxWidth: 480, padding: "24px 20px 40px",
        maxHeight: "90vh", overflowY: "auto", position: "relative",
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${ACCENT}cc, transparent)` }} />

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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            ["SESSIONS", profile.total_workouts],
            ["WEEKLY XP", (profile.weekly_xp || 0).toLocaleString()],
            ["TOTAL XP", (profile.overall_xp || 0).toLocaleString()],
          ].map(([label, val]) => (
            <div key={label} style={{ background: BG3, border: `1px solid ${ACCENT}22`, borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700, color: GOLD }}>{val}</div>
              <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 9, color: MUTED, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

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
          </div>
        )}
      </div>
    </div>
  );
}

function _signInPrompt(title, body) {
  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 120px" }}>
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
      setViewHidden(newHidden);
      toast(newHidden ? "Hidden from their friends list" : `Revealed to @${viewProfile.username}`, ACCENT);
    } catch (e) { toast(e.message, RED); }
  };

  if (!account?.session) {
    return _signInPrompt("LEADERBOARD", <>Sign in to see how you rank<br/>against other Hunters.</>);
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, paddingBottom: "calc(120px + env(safe-area-inset-bottom,0px))" }}>

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
          return (
            <div key={row.friend_id} onClick={() => openProfile(row.friend_id)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                background: isMe ? `${ACCENT}11` : BG2,
                border: `1px solid ${isMe ? ACCENT + "55" : ACCENT + "1a"}`,
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
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, color: isMe ? ACCENT : TEXT, fontWeight: 700, letterSpacing: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  @{row.username}{isMe ? " ◈" : ""}
                </div>
                <div style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 11, color: MUTED }}>
                  LVL {row.overall_level} · {row.total_workouts} sessions
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
    <div style={{ minHeight: "100vh", background: BG, paddingBottom: "calc(120px + env(safe-area-inset-bottom,0px))" }}>

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
          if (!p.workouts?.length) return [id, { ...p,
            stats: Object.fromEntries(Object.keys(p.stats || {}).map(k => [k, 0])),
            subStats: {},
            levels: Object.fromEntries(Object.keys(p.levels || {}).map(k => [k, 1])),
            overallXP: 0, overallLevel: 1 }];
          const newStats = Object.fromEntries(Object.keys(p.stats || {}).map(k => [k, 0]));
          let newOverallXP = 0;
          for (const w of p.workouts) {
            const xp = w.xp || 0;
            const ex = w.exercise || {};
            const muscle = w.muscle || ex.primary || "chest";
            const emg = ex.emg || EXERCISE_EMG[ex.name];
            if (ex.type === "cardio") {
              newStats.cardio = (newStats.cardio || 0) + xp;
            } else if (emg) {
              const total = Object.values(emg).reduce((s,v) => s+v, 0);
              Object.entries(emg).forEach(([svgId, activation]) => {
                const xpShare = Math.round(xp * activation / total);
                const stat = SVG_TO_STAT[svgId] || muscle;
                newStats[stat] = (newStats[stat] || 0) + xpShare;
              });
            } else {
              const statKey = ex.type === "calisthenics" &&
                !["chest","arms","core"].includes(muscle) ? "calisthenics" : muscle;
              newStats[statKey] = (newStats[statKey] || 0) + xp;
              if (statKey !== muscle) newStats[muscle] = (newStats[muscle] || 0) + Math.round(xp * 0.4);
            }
            newOverallXP += xp;
          }
          const newLevels = Object.fromEntries(Object.keys(newStats).map(k => [k, getMuscleLevel(newStats[k] || 0)]));
          const newSubStats2 = {};
          for (const w of p.workouts) {
            const xp2 = w.xp || 0; const ex2 = w.exercise || {};
            const emg2 = ex2.emg || EXERCISE_EMG[ex2.name];
            if (emg2) {
              const total2 = Object.values(emg2).reduce((s,v)=>s+v,0);
              Object.entries(emg2).forEach(([svgId,act]) => {
                newSubStats2[svgId] = (newSubStats2[svgId]||0) + Math.round(xp2*act/total2);
              });
            } else {
              (ex2.svgTargets||[]).forEach(svgId => {
                newSubStats2[svgId] = (newSubStats2[svgId]||0) + Math.round(xp2/((ex2.svgTargets||[1]).length));
              });
            }
          }
          return [id, { ...p, stats: newStats, subStats: newSubStats2, levels: newLevels,
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
      toast(row ? `Signed in as @${row.username}` : "Signed in", GREEN);
      return true;
    } catch (e) {
      setAuthError(e.message || "Sign-in failed.");
      return false;
    } finally {
      setAuthBusy(false);
    }
  }, [toast]);

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
    const newStats    = Object.fromEntries(Object.keys(p.stats || {}).map(k => [k, 0]));
    const newSubStats = {};
    let newOverallXP  = 0;
    for (const w of (p.workouts || [])) {
      const xp    = w.xp || 0;
      const ex    = w.exercise || {};
      const muscle = w.muscle || ex.primary || "chest";
      const emg   = ex.emg || EXERCISE_EMG[ex.name];
      if (ex.type === "cardio") {
        newStats.cardio = (newStats.cardio || 0) + xp;
      } else if (emg) {
        const total = Object.values(emg).reduce((s,v) => s+v, 0);
        Object.entries(emg).forEach(([svgId, activation]) => {
          const xpShare = Math.round(xp * activation / total);
          const stat = SVG_TO_STAT[svgId] || muscle;
          newStats[stat]    = (newStats[stat]    || 0) + xpShare;
          newSubStats[svgId] = (newSubStats[svgId] || 0) + xpShare;
        });
      } else {
        const targets = ex.svgTargets || [];
        if (targets.length > 0) {
          const share = Math.round(xp / targets.length);
          targets.forEach(svgId => { newSubStats[svgId] = (newSubStats[svgId] || 0) + share; });
        }
        const statKey = ex.type === "calisthenics" &&
          !["chest","arms","core"].includes(muscle) ? "calisthenics" : muscle;
        newStats[statKey] = (newStats[statKey] || 0) + xp;
        if (statKey !== muscle) newStats[muscle] = (newStats[muscle] || 0) + Math.round(xp * 0.4);
      }
      newOverallXP += xp;
    }
    const newLevels = Object.fromEntries(Object.keys(newStats).map(k => [k, getMuscleLevel(newStats[k] || 0)]));
    return { newStats, newSubStats, newLevels, newOverallXP, newOverallLevel: getLevelFromXP(newOverallXP).level };
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
      if (newOverallLevel > p.overallLevel) { const lvlMsg = themeLabel(store.settings,'levelUp','LEVEL UP!'); setTimeout(() => toast(`${lvlMsg} LVL ${newOverallLevel}`, GOLD), 400); }
      if (newLevels[statKey] > (p.levels[statKey] || 1)) setTimeout(() => toast(`${MUSCLE_META[statKey]?.name} LVL ${newLevels[statKey]}!`, MUSCLE_META[statKey]?.color), 700);
      if (absorbed > 0) setTimeout(() => toast(`-${absorbed} XP absorbed by food surplus`, RED), 200);
      return { ...p, stats: newStats, subStats: newSubStats, levels: newLevels,
        overallXP: newOverallXP, overallLevel: newOverallLevel,
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
        levels: rebuilt.newLevels, overallXP: rebuilt.newOverallXP,
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

  const handleSaveCustomProgram = (prog, deleteId = null) => {
    updateActive(p => {
      const existing = p.customPrograms || [];
      if (deleteId && !prog.name) return { ...p, customPrograms: existing.filter(cp => cp.id !== deleteId) };
      return { ...p, customPrograms: [...existing.filter(cp => cp.id !== deleteId), prog] };
    });
  };

  if (!st.onboarded) {
    return (
      <>
        <style>{CSS}</style>
        <style>{dynCSS}</style>
        <OnboardScreen onComplete={handleOnboard} />
        <Toasts toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <style>{dynCSS}</style>
      <div id="iron-realm-root" style={{ minHeight: "100vh" }}>
      <Toasts toasts={toasts} />
      {screen === "menu"      && <MenuScreen st={st} setScreen={setScreen} onLogFood={handleLogFood} onUpdateWeight={handleUpdateWeight} settings={settings} onUpdateSettings={handleUpdateSettings} toast={toast} account={account} onSignIn={handleSignIn} onSignUp={handleSignUp} onSignOut={handleSignOut} onToggleSharePrs={handleToggleSharePrs} pendingCount={pendingCount} />}
      {screen === "schedule"  && <ScheduleScreen st={st} onLogExercise={handleLogExercise} onUnlogExercise={handleUnlogExercise} onUpdateSchedule={handleUpdateSchedule} onLogFood={handleLogFood} settings={settings} toast={toast} />}
      {screen === "workout"   && <FreeWorkoutScreen st={st} onLogExercise={handleLogExercise} onUnlogExercise={handleUnlogExercise} settings={settings} toast={toast} />}
      {screen === "database"  && <DatabaseScreen st={st} onLogExercise={handleLogExercise} onSaveCustomExercise={handleSaveCustomExercise} settings={settings} toast={toast} />}
      {screen === "character" && <CharacterScreen store={store} onSwitchProfile={handleSwitchProfile} onCreateProfile={handleCreateProfile} onDeleteProfile={handleDeleteProfile} onUpdateProfile={handleUpdateProfile} toast={toast} />}
      {screen === "program"     && <ProgramScreen st={st} onSelectProgram={handleSelectProgram} onSaveCustomProgram={handleSaveCustomProgram} setScreen={setScreen} toast={toast} />}
      {screen === "leaderboard" && <LeaderboardScreen account={account} toast={toast} />}
      {screen === "friends"     && <FriendsScreen account={account} toast={toast} />}
      <NavBar screen={screen} setScreen={setScreen} overallLevel={st.overallLevel} settings={settings} pendingCount={pendingCount} />
      </div>
    </>
  );
}
