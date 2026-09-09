// XP curves, level milestones, MET tables, the muscle-stimulus model and the
// atrophy model constants. Pure data + pure helpers — no runtime dependencies.
// Edit here, not in iron-realm.jsx.
//
// ─── TWO CURRENCIES (v2.2 physiology pass) ───────────────────────────────────
//
//  · HUNTER XP  = kilocalories. Energy cost of the session (MET × body mass ×
//    time, plus the mechanical work of moving the load). It feeds the OVERALL
//    level and is netted against a calorie surplus. A 220 lb hunter burns more
//    than a 150 lb one doing the same set — that is real, and it stays here.
//
//  · MUSCLE XP  = hypertrophy stimulus. Per-muscle levels are earned from HARD
//    SETS, not calories: a set counts fully when it is taken close to failure
//    with a load in the 30–85 % 1RM band for 6–30 reps, and is discounted for
//    reps in reserve, very light loads, very low/high rep counts and junk
//    weekly volume. Body mass does NOT scale it — muscle does not grow faster
//    because the person is heavier; bodyweight only enters through the load a
//    bodyweight movement actually places on the muscle (see BW_FRACTION).
//
//  Sources: Schoenfeld et al. 2017 (J Sports Sci, dose-response of weekly
//  sets); Schoenfeld et al. 2017 (JSCR, low- vs high-load meta-analysis);
//  Lasevicius et al. 2018 (Eur J Sport Sci, 20 % 1RM inferior); Refalo et al.
//  2023 & Robinson et al. 2024 (proximity-to-failure meta-regressions);
//  Baz-Valle et al. 2022 (>20 sets/wk plateau); Ebben et al. 2011 (push-up
//  load fractions).

// ─── XP / CALORIE CONSTANTS ───────────────────────────────────────────────────
// Overall level thresholds: 500 × n^1.6 cumulative kcal per level (fat-burn
// framing: 3,500 kcal ≈ 1 lb of fat).
export const OVERALL_THRESHOLDS = [500, 1516, 2900, 4595, 6566, 8790, 11249, 13929, 16817, 19905, 23185, 26648, 30289, 34102, 38082, 42224, 46525, 50981, 55587, 60342, 65241, 70282, 75463, 80781, 86233, 91818, 97533, 103377, 109347, 115442, 121660, 128000, 134460, 141038, 147733, 154545, 161470, 168509, 175660, 182922, 190294, 197774, 205362, 213056, 220856, 228761, 236770, 244882, 253095, 261410, 269825, 278340, 286953, 295665, 304474, 313380, 322381, 331478, 340669, 349955, 359334, 368805, 378368, 388023, 397769, 407606, 417532, 427547, 437652, 447844, 458124, 468492, 478946, 489487, 500113, 510825, 521621, 532502, 543467, 554516, 565648, 576862, 588159, 599538, 610999, 622540, 634163, 645866, 657649, 669511, 681454, 693475, 705574, 717752, 730008, 742342, 754753, 767241, 779806, 792447];

// ─── MUSCLE LEVEL CURVE ───────────────────────────────────────────────────────
// XP needed to go from level n to n+1. Anchored on the natural-hypertrophy
// timeline (McDonald / Aragon models: ~50 % of lifetime potential in year 1,
// 25 % in year 2, halving thereafter) at a reference dose of ~12 hard sets per
// week for the muscle (≈ 84 muscle XP/wk once compound sharing is included):
//
//   LVL 2  ≈ 1 week      LVL 4  ≈ 7 weeks     LVL 7  ≈ 7 months (C-rank)
//   LVL 12 ≈ 2 years (B) LVL 20 ≈ 5 years (A) LVL 30 ≈ 8+ years (S)
//
// The tanh shape rises steeply through the novice window and settles to a
// near-constant ~1,600 XP per level: past the intermediate stage each level is
// a similar slab of work, and the calendar time per level grows because the
// weekly dose is what limits you, not the curve.
export const muscleLevelIncrement = (n) => Math.round(1600 * Math.pow(Math.tanh(n / 8), 1.5));
export const MUSCLE_THRESHOLDS = Array.from({ length: 100 }, (_, i) => muscleLevelIncrement(i + 1));

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

// Muscle: hypertrophy timeline at ~12 hard sets/week (levels 1–10; higher
// levels keep the last name and are distinguished by rank letter).
// Sources: Schoenfeld (2010), Moritani & deVries (1979), Damas et al. (2016)
export const MUSCLE_MILESTONE_NAMES = [
  "Dormant","Activated","Stimulated","Growing","Defined",
  "Developed","Sculpted","Forged","Hardened","Veteran",
];

export const MUSCLE_MILESTONE_DESC = [
  "Untrained — no specific adaptation yet",
  "First week — neural drive improving, no size change yet",
  "~3 weeks — satellite cells recruited, hypertrophy signalling on",
  "~7 weeks — first measurable hypertrophy",
  "~3 months — visible size, holds a pump",
  "~5 months — clear separation between muscle groups",
  "~7 months — developed at rest, not just pumped",
  "~10 months — beyond most recreational lifters",
  "~1 year — a dedicated year of work on this muscle",
  "~16 months — advanced for a natural lifter; each level is now a slab",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
// MET (Metabolic Equivalent of Task) values by exercise type + difficulty.
// Compendium of Physical Activities: resistance training 3.5 (light) – 6.0
// (vigorous); calisthenics 3.8 (light) – 8.0 (vigorous).
export const MET_VALUES = {
  strength:     { beginner: 3.5, intermediate: 5.0, advanced: 6.0, elite: 8.0 },
  calisthenics: { beginner: 4.0, intermediate: 5.5, advanced: 7.0, elite: 9.0 },
  cardio:       { beginner: 5.0, intermediate: 7.0, advanced: 9.0, elite: 11.0 },
};

// Mechanical work of lifting a load: kcal per kg of load per rep.
//   9.81 m/s² × 0.45 m mean range of motion ÷ 4184 J/kcal ÷ 0.20 net efficiency
export const WORK_KCAL_PER_KG_REP = 9.81 * 0.45 / 4184 / 0.20;

// ─── MUSCLE STIMULUS ─────────────────────────────────────────────────────────
export const STIM = {
  SET: 10,                  // one hard set at full muscle share
  ISO_SECONDS_PER_SET: 45,  // 45 s of a hold ≈ one hard set (a hold caps at 1.5 sets)
  ISO_MAX_SETS: 1.5,        // isometrics build less than dynamic reps past ~1 min
  ISO_MIN_SECONDS: 10,      // shorter holds are not a training stimulus
  DEFAULT_RIR: 2,           // no RPE logged and no prior 1RM to estimate from
  CARDIO_MET_REF: 7,        // endurance stim = minutes × MET ÷ 7 (30 min at 7 MET = 30)
  AGILITY_SIDE_CREDIT: 0.25,// bodyweight skill work also feeds the Agility stat
  PR_BONUS: 1.10,           // progressive overload: a new e1RM on the lift
};

// Proximity to failure. Hypertrophy per set rises roughly linearly as RIR
// falls (Refalo 2023; Robinson 2024) and sets left far from failure add little.
export function effortFactor(rir) {
  const r = rir == null ? STIM.DEFAULT_RIR : Math.max(0, rir);
  if (r <= 0) return 1.00;
  if (r <= 1) return 0.97;
  if (r <= 2) return 0.92;
  if (r <= 3) return 0.85;
  if (r <= 4) return 0.77;
  if (r <= 5) return 0.68;
  if (r <= 7) return 0.50;
  return 0.30;
}

// Load relative to 1RM. Equivalent hypertrophy from ~30 % to ~85 % when taken
// near failure (Schoenfeld 2017); 20 % 1RM is inferior (Lasevicius 2018);
// >90 % gives few effective reps per set. Unknown (bodyweight) → 1.
export function loadFactor(pct1RM) {
  if (pct1RM == null || !Number.isFinite(pct1RM)) return 1.0;
  if (pct1RM < 0.20) return 0.40;
  if (pct1RM < 0.30) return 0.70;
  if (pct1RM <= 0.90) return 1.00;
  return 0.90;
}

// Rep count. 1–3 reps is strength-biased with little time under tension; past
// ~30 reps the set drifts toward endurance.
export function repFactor(reps) {
  const r = reps || 0;
  if (r <= 0) return 0;
  if (r <= 3) return 0.70;
  if (r <= 5) return 0.90;
  if (r <= 30) return 1.00;
  if (r <= 50) return 0.80;
  return 0.60;
}

// Weekly dose already banked for the muscle before this session. Gains rise
// with sets up to ~10–20/wk, plateau around 20 and turn into junk volume past
// ~30 (Schoenfeld 2017; Baz-Valle 2022).
export function volumeFactor(weeklySets) {
  const s = weeklySets || 0;
  if (s < 10) return 1.00;
  if (s < 20) return 0.80;
  if (s < 30) return 0.50;
  return 0.25;
}

// ─── ATROPHY ──────────────────────────────────────────────────────────────────
// Detraining modeled on the physiology literature rather than a game curve:
//
//  · Each muscle carries a CONDITION factor c ∈ [floor, 1].
//  · Between sessions, c decays EXPONENTIALLY toward the floor — losses are
//    fastest early and decelerate.
//  · STRENGTH / MUSCLE: no meaningful loss for ~3 weeks (Bosquet 2013 meta-
//    analysis; McMaster 2013), then the decayable portion halves every ~150
//    days. That gives ≈ −12 % at 12 weeks, ≈ −25 % at 6 months, ≈ −40 % at a
//    year — in line with the 5–15 % strength / CSA losses reported over 8–12
//    weeks of full detraining.
//  · ENDURANCE detrains faster: ~1-week grace, halving every ~100 days
//    (VO₂max −4…−14 % by 4 weeks, −6…−20 % longer term; Mujika & Padilla
//    2000; Coyle 1984).
//  · FLOORS (muscle 45 %, endurance 40 %) reflect retained myonuclei, the
//    epigenetic "muscle memory" (Seaborne 2018) and long-lived neural
//    adaptations — you never return to zero.
//  · AGE: past 40 the decayable portion halves faster, reaching ~30 % faster
//    by 65 (age-related loss of type II fibres compounds disuse).
//  · MUSCLE MEMORY: a session on a detrained muscle recovers up to ~35 % of
//    the remaining deficit — several sessions over 2–3 weeks to fully
//    restore, roughly 3–4× faster than the loss (Staron 1991), not an
//    instant snap-back. The recovery is scaled by how much of the session
//    actually loaded THIS muscle: a hip thrust (79 % glutes) nearly fully
//    reawakens them, a deadlift (17 %) barely does, and a barbell row (13 %
//    biceps) maintains rather than rebuilds.
//
// Effective XP = earned XP × condition, computed chronologically from the
// workout ledger — deterministic, self-correcting, nothing destroyed.
// Overall Hunter XP and Mind & Spirit do not decay; atrophy is a body
// mechanic.
export const ATROPHY = {
  muscular: { grace: 21, halfLife: 150, floor: 0.45 },
  cardio:   { grace: 7,  halfLife: 100, floor: 0.40 },
  REGAIN: 0.35,
};

// Half-life multiplier by age: 1.0 up to 40, sliding to 0.7 at 65+.
export function ageDetrainingFactor(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a <= 40) return 1.0;
  if (a >= 65) return 0.7;
  return 1.0 - 0.3 * (a - 40) / 25;
}
