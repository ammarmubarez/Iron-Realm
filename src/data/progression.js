// XP curves, level milestones, MET tables and the atrophy model constants.
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.

// ─── XP / CALORIE CONSTANTS ───────────────────────────────────────────────────
// XP = calories burned (exact MET calculation)
// 1 lb of fat  = 3,500 cal  → overall level threshold per level
// 1 lb of muscle = 2,500 cal → per-muscle level threshold per level
// ── XP LEVEL THRESHOLDS ──────────────────────────────────────────────────────
// Scaling curve: 500 × n^1.6 (overall), 120 × n^1.5 (muscle)
// LVL 2 in ~4 days · LVL 5 in ~7 weeks · LVL 10 in ~5 months · LVL 30+ = years
// Sources: Schoenfeld (2010), NSCA (2016), Kraemer et al. (2002)
export const OVERALL_THRESHOLDS = [500, 1516, 2900, 4595, 6566, 8790, 11249, 13929, 16817, 19905, 23185, 26648, 30289, 34102, 38082, 42224, 46525, 50981, 55587, 60342, 65241, 70282, 75463, 80781, 86233, 91818, 97533, 103377, 109347, 115442, 121660, 128000, 134460, 141038, 147733, 154545, 161470, 168509, 175660, 182922, 190294, 197774, 205362, 213056, 220856, 228761, 236770, 244882, 253095, 261410, 269825, 278340, 286953, 295665, 304474, 313380, 322381, 331478, 340669, 349955, 359334, 368805, 378368, 388023, 397769, 407606, 417532, 427547, 437652, 447844, 458124, 468492, 478946, 489487, 500113, 510825, 521621, 532502, 543467, 554516, 565648, 576862, 588159, 599538, 610999, 622540, 634163, 645866, 657649, 669511, 681454, 693475, 705574, 717752, 730008, 742342, 754753, 767241, 779806, 792447];

export const MUSCLE_THRESHOLDS  = [120, 339, 624, 960, 1342, 1764, 2222, 2715, 3240, 3795, 4378, 4988, 5625, 6286, 6971, 7680, 8411, 9164, 9938, 10733, 11548, 12383, 13236, 14109, 15000, 15909, 16836, 17779, 18740, 19718, 20712, 21722, 22748, 23790, 24848, 25920, 27007, 28110, 29227, 30358, 31503, 32663, 33836, 35024, 36224, 37438, 38666, 39906, 41160, 42426, 43706, 44997, 46301, 47618, 48947, 50288, 51641, 53006, 54383, 55771, 57171, 58583, 60006, 61440, 62886, 64342, 65810, 67289, 68779, 70279, 71791, 73313, 74845, 76389, 77942, 79506, 81081, 82665, 84260, 85865, 87480, 89105, 90740, 92385, 94039, 95704, 97378, 99062, 100755, 102458, 104170, 105892, 107623, 109364, 111113, 112872, 114641, 116418, 118205, 120000];

// ── LEVEL MILESTONE NAMES ─────────────────────────────────────────────────────
// Overall: maps training age / work capacity to real physiological stages
// Sources: NSCA (2016), Kraemer et al (2002), Moritani & deVries (1979)
export const OVERALL_MILESTONE_NAMES = [
  // E-rank (lvl 1–3)
  "Awakened","Initiate","Recruit",
  // D-rank (lvl 4–6)
  "Apprentice","Trainee","Novice",
  // C-rank (lvl 7–11)
  "Iron Disciple","Iron Wielder","Iron Veteran","Iron Champion","Iron Adept",
  // B-rank (lvl 12–19)
  "Iron Knight","Iron Form","Iron Will","Iron Soul","Iron Sovereign",
  "Steel Lord","Steel Sovereign","Void Knight",
  // A-rank (lvl 20–29)
  "Void Walker","Void Lord","Abyss Knight","Abyss Lord","Abyss Sovereign",
  "Arch-Sovereign","Obsidian King","Obsidian Sovereign","Eternal Walker","Transcendent",
  // S-rank (lvl 30+)
  "S-Rank Hunter",
];

export const OVERALL_MILESTONE_DESC = [
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
export const MUSCLE_MILESTONE_NAMES = [
  "Dormant","Activated","Stimulated","Growing","Defined",
  "Developed","Sculpted","Elite","Stage-Ready","Mastered",
];

export const MUSCLE_MILESTONE_DESC = [
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// MET (Metabolic Equivalent of Task) values by exercise type + difficulty
export const MET_VALUES = {
  strength:     { beginner: 3.5, intermediate: 5.0, advanced: 6.0, elite: 8.0 },
  calisthenics: { beginner: 4.0, intermediate: 5.5, advanced: 7.0, elite: 9.0 },
  cardio:       { beginner: 5.0, intermediate: 7.0, advanced: 9.0, elite: 11.0 },
};

// ─── ATROPHY ──────────────────────────────────────────────────────────────────
// Detraining modeled on the physiology literature rather than a game curve:
//
//  · Each muscle carries a CONDITION factor c ∈ [floor, 1].
//  · Between sessions, c decays EXPONENTIALLY toward the floor — losses are
//    fastest early and decelerate, matching detraining studies (Mujika &
//    Padilla 2000). Strength/muscle: ~2-week grace, then the decayable
//    portion halves every ~70 days (≈30% total loss by 12 weeks idle).
//    Endurance detrains faster: ~1-week grace, halving every ~60 days
//    (VO₂max declines measurably within 2–4 weeks).
//  · Floors (muscle 40%, endurance 30%) reflect long-lived neural
//    adaptations and retained myonuclei — you never return to zero.
//  · MUSCLE MEMORY: a session on a detrained muscle recovers up to ~35% of
//    the remaining deficit — several sessions over 2–3 weeks to fully
//    restore, roughly 3–4× faster than the loss (Staron 1991), not an
//    instant snap-back. The recovery is scaled by how much of the session
//    actually loaded THIS muscle: a hip thrust (79% of its work is glutes)
//    nearly fully reawakens them, a deadlift (17%) barely does, and a
//    barbell row (13% biceps) maintains rather than rebuilds. Without this,
//    any compound lift fully reset every muscle it brushed.
//
// Effective XP = earned XP × condition, computed chronologically from the
// workout ledger — deterministic, self-correcting, nothing destroyed.
// Overall Hunter XP and Mind & Spirit do not decay; atrophy is a body
// mechanic.
export const ATROPHY = {
  muscular: { grace: 14, halfLife: 70, floor: 0.40 },
  cardio:   { grace: 7,  halfLife: 60, floor: 0.30 },
  REGAIN: 0.35,
};
