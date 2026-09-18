// Profile options: goals, activity levels, equipment, accent presets, daily rituals.
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.

export const _ACCENT_PRESETS = [
  { name: "Cyan",    value: "#00d4ff", accent2: "#0044aa" },
  { name: "Purple",  value: "#aa44ff", accent2: "#5500cc" },
  { name: "Orange",  value: "#ff7c2a", accent2: "#aa3300" },
  { name: "Green",   value: "#00ff88", accent2: "#007744" },
  { name: "Red",     value: "#ff3a3a", accent2: "#880000" },
  { name: "Pink",    value: "#ff44aa", accent2: "#880055" },
  { name: "Gold",    value: "#e8c44a", accent2: "#886600" },
  { name: "White",   value: "#e8eef8", accent2: "#6688aa" },
];

export const FITNESS_GOALS = [
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
export const GOAL_CONFIG = {
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

// ─── CALORIE PLAN ─────────────────────────────────────────────────────────────
// A goal's calorie offset is no longer a fixed number baked into GOAL_CONFIG —
// it is derived from how fast the hunter wants to change weight. One pound of
// body fat stores ~3,500 kcal, so ±1 lb/week ≈ ±500 kcal/day (Wishnofsky 1958;
// the rule overstates long-run loss because the body adapts, but it is the
// standard planning figure and the app re-checks against real weigh-ins).
//
// The profile stores ONE field, `calorieOffset` (signed kcal/day). A rate
// preset writes it, a manual entry writes it, and the displayed rate is always
// derived back from it — so the two controls can never disagree. When it is
// null the goal's historical default (GOAL_CONFIG.tdeeOffset) is used, which
// keeps every profile created before v2.11 working unchanged.
export const KCAL_PER_LB = 3500;
export const offsetFromRate = (lbsPerWeek) => Math.round((lbsPerWeek * KCAL_PER_LB) / 7);
export const rateFromOffset = (kcalPerDay) => (kcalPerDay * 7) / KCAL_PER_LB;

// Which way a goal moves the scale. Used to pick the right presets and wording.
export const GOAL_DIRECTION = {
  cut: -1, cardio: -1, toning: -1,
  maintain: 0,
  bulk: +1, bodybuild: +1, powerlifting: +1, calisthenics: +1,
};

// Weekly rates offered per direction, in lb/week.
export const RATE_PRESETS = {
  "-1": [0.5, 1, 1.5, 2],
  "1":  [0.25, 0.5, 0.75, 1],
  "0":  [0],
};

// How aggressive a rate is for this body weight, and why it matters.
//   Loss: 0.5–1 %/week is the band where fat comes off with little lean loss;
//         past ~1 %/week lean mass and strength drop measurably (Garthe 2011).
//   Gain: ~0.25–0.5 %/week is the lean-gain band; faster mostly adds fat
//         (Garthe 2013, Slater 2019).
export function rateSafety(lbsPerWeek, weightLbs, direction) {
  const pct = weightLbs > 0 ? (Math.abs(lbsPerWeek) / weightLbs) * 100 : 0;
  const pctLabel = `${pct.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}% of body weight`;
  if (direction < 0) {
    if (pct <= 0.55) return { level: "easy", pct, pctLabel, note: "Gentle — easiest to sustain, keeps the most muscle" };
    if (pct <= 1.05) return { level: "ok",   pct, pctLabel, note: "Standard fat-loss rate with little muscle loss" };
    return { level: "hard", pct, pctLabel, note: "Past 1%/week — expect strength and muscle to go too" };
  }
  if (direction > 0) {
    if (pct <= 0.3)  return { level: "easy", pct, pctLabel, note: "Lean gain — most of this should be muscle" };
    if (pct <= 0.55) return { level: "ok",   pct, pctLabel, note: "Solid bulk rate; some fat comes with it" };
    return { level: "hard", pct, pctLabel, note: "Fast bulk — a large share of this will be fat" };
  }
  return { level: "ok", pct: 0, pctLabel: "holding steady", note: "Eating at maintenance" };
}

// The lowest daily intake the app will plan for: never under BMR, and never
// under the conventional clinical floors. Below this the target is clamped and
// the UI says so rather than silently prescribing a starvation diet.
export function intakeFloor(bmr, isFemale) {
  return Math.max(Math.round(bmr || 0), isFemale ? 1200 : 1500);
}

export const EQUIPMENT_CATEGORIES = [
  { id: "BODYWEIGHT", name: "Bodyweight (floor & wall only)" },
  { id: "BENCH",      name: "Bench / chair / step" },
  { id: "PULLUP_BAR", name: "Pull-up bar / rings / dip station" },
  { id: "DUMBBELL",   name: "Dumbbells" },
  { id: "KETTLEBELL", name: "Kettlebells" },
  { id: "CARDIO",     name: "Cardio (treadmill, bike, etc.)" },
  { id: "BARBELL",    name: "Barbell" },
  { id: "MACHINE",    name: "Machines (leg press, pec deck, etc.)" },
  { id: "CABLE",      name: "Cables" },
];

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary",         sub: "Desk job, little/no exercise",      multiplier: 1.2  },
  { id: "light",     label: "Lightly Active",    sub: "Walking, 1-2 workouts/week",        multiplier: 1.35 },
  { id: "moderate",  label: "Moderately Active", sub: "Gym 3-4x/week, mostly sitting job", multiplier: 1.5  },
  { id: "active",    label: "Very Active",       sub: "Intense training 5-6x/week",        multiplier: 1.65 },
  { id: "extra",     label: "Athlete",           sub: "2x/day training or physical job",   multiplier: 1.8  },
];

export const DAILY_RITUALS = [
  { id: "pushups", label: "10 push-ups" },
  { id: "stretch", label: "5 min stretch" },
  { id: "water",   label: "8 glasses of water" },
];
