/* eslint-disable */
import { useState, useEffect, useCallback } from "react";

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
  return MUSCLE_MILESTONE_NAMES[