// Strength standards and lift families — used to suggest a working weight for
// a lift the hunter has never logged. Pure data + pure helpers.
//
// ANCHORS are estimated 1RM as a fraction of body weight for five training
// tiers, taken from population strength-standard tables (Strength Level /
// ExRx style data, ~100 kg male). Heavier bodies have lower ratios, lighter
// bodies higher; `bodyweightScale` bends the ratio around 82 kg to follow that
// (an allometric-style correction, exponent 0.33). Female standards run ~65 %
// of male for upper-body pressing/pulling and ~75 % for hip/leg lifts. Past
// 40, maximal strength falls ~1 % per year (Keller & Engelhardt 2013).
//
// The TIER comes from the muscle group's level in the app — which already
// includes detraining — so an atrophied chest is prescribed a lighter bench:
//   level < 4 beginner · < 12 novice · < 20 intermediate · < 30 advanced · 30+ elite
//
// FAMILIES map a lift to an anchor and a ratio (the load you can use on the
// lift relative to the anchor lift's 1RM). Dumbbell entries are PER HAND.
// If the hunter has a stored 1RM on any lift in the same family, the anchor
// is derived from it instead of the table — a real bench PR sets the incline
// and machine press loads too.

export const STRENGTH_ANCHORS = {
  //            beginner novice intermediate advanced elite
  bench:     [0.60, 0.85, 1.20, 1.55, 1.95],
  squat:     [0.80, 1.10, 1.50, 2.00, 2.50],
  deadlift:  [0.95, 1.30, 1.75, 2.30, 2.90],
  ohp:       [0.40, 0.55, 0.75, 1.00, 1.25],
  row:       [0.45, 0.65, 0.90, 1.20, 1.50],
  curl:      [0.20, 0.32, 0.48, 0.65, 0.85],
  hipthrust: [0.80, 1.20, 1.70, 2.30, 3.00],
  rdl:       [0.70, 1.00, 1.40, 1.80, 2.30],
};
export const FEMALE_FACTOR = { bench: 0.6, ohp: 0.6, row: 0.65, curl: 0.6, squat: 0.75, deadlift: 0.75, hipthrust: 0.85, rdl: 0.75 };

export function tierFromLevel(level) {
  const l = level || 1;
  return l < 4 ? 0 : l < 12 ? 1 : l < 20 ? 2 : l < 30 ? 3 : 4;
}
export function bodyweightScale(kg) {
  return Math.pow(82 / Math.max(45, kg || 82), 0.33);
}
export function ageFactor(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a <= 40) return 1;
  return Math.max(0.7, 1 - 0.01 * (a - 40));
}

// [pattern, anchor, ratio]. First match wins — keep specific patterns first.
export const LIFT_FAMILIES = [
  // chest
  [/close-grip bench|jm press|california press/i, "bench", 0.85],
  [/incline.*(bench|press)/i, "bench", 0.80],
  [/decline.*(bench|press)/i, "bench", 1.05],
  [/dumbbell bench|db bench/i, "bench", 0.38],
  [/incline dumbbell press/i, "bench", 0.32],
  [/(bench press|chest press|floor press|smith machine bench)/i, "bench", 1.00],
  [/hex press|squeeze press/i, "bench", 0.30],
  [/svend press/i, "bench", 0.12],
  [/(pec deck|fly machine)/i, "bench", 0.55],
  [/dumbbell flyes/i, "bench", 0.18],
  [/(cable (crossover|fly)|low cable fly|high cable fly|single arm cable fly|band fly)/i, "bench", 0.15],
  [/landmine press/i, "bench", 0.45],
  [/pullover/i, "bench", 0.30],
  // shoulders
  [/(overhead press|military press|smith machine ohp|push press|behind-the-neck|z press|bradford)/i, "ohp", 1.00],
  [/machine shoulder press/i, "ohp", 1.10],
  [/(dumbbell shoulder press|seated dumbbell press)/i, "ohp", 0.40],
  [/arnold press/i, "ohp", 0.35],
  [/(lateral raise|scaption|6-ways|y raise)/i, "ohp", 0.15],
  [/front raise/i, "ohp", 0.15],
  [/(rear delt|reverse fly|w raise|pull-apart)/i, "ohp", 0.12],
  [/face pull/i, "ohp", 0.50],
  [/upright row/i, "ohp", 0.60],
  [/shrug/i, "deadlift", 0.70],
  // back
  [/(lat pulldown|straight.arm|straight arm)/i, "row", 1.00],
  [/(seated cable row|machine row|iso-lateral row|chest supported row|seal row)/i, "row", 1.10],
  [/(pendlay|barbell row|t-bar row|meadows)/i, "row", 0.95],
  [/(dumbbell row|kroc row|cable row \(single arm\))/i, "row", 0.45],
  [/(rack pull)/i, "deadlift", 1.15],
  [/(trap bar deadlift)/i, "deadlift", 1.05],
  [/(sumo deadlift|deadlift)/i, "deadlift", 1.00],
  [/(romanian deadlift|stiff-leg)/i, "rdl", 1.00],
  [/dumbbell romanian/i, "rdl", 0.35],
  [/(good morning|jefferson)/i, "rdl", 0.50],
  [/(back extension|hyperextension)/i, "rdl", 0.25],
  // legs
  [/(leg press|hack squat|pendulum|v-squat)/i, "squat", 1.80],
  [/single leg press/i, "squat", 0.90],
  [/(front squat|zercher)/i, "squat", 0.80],
  [/overhead squat/i, "squat", 0.55],
  [/(barbell back squat|smith machine squat|^squat$)/i, "squat", 1.00],
  [/(goblet|dumbbell squat|landmine squat)/i, "squat", 0.35],
  [/(bulgarian|lunge|step-up)/i, "squat", 0.25],
  [/leg extension/i, "squat", 0.45],
  [/(leg curl|nordic|glute ham)/i, "rdl", 0.35],
  [/(adductor|abductor)/i, "squat", 0.45],
  [/(hip thrust)/i, "hipthrust", 1.00],
  [/glute bridge/i, "hipthrust", 0.80],
  [/(pull-through|kickback machine)/i, "hipthrust", 0.35],
  [/cable kickback|standing cable abduction/i, "hipthrust", 0.12],
  [/(calf raise|calf press)/i, "squat", 1.00],
  [/seated calf/i, "squat", 0.50],
  [/tibialis/i, "squat", 0.15],
  // arms
  [/(preacher curl|spider curl)/i, "curl", 0.80],
  [/(concentration|incline dumbbell curl|bayesian|waiter|cross body)/i, "curl", 0.40],
  [/(hammer curl|zottman|reverse curl|reverse barbell)/i, "curl", 0.50],
  [/(dumbbell curl|alternating dumbbell curl)/i, "curl", 0.45],
  [/(cable curl|low cable curl|high cable curl|machine curl|bicep curl machine|band curl|drag curl)/i, "curl", 0.90],
  [/(barbell curl|21s|wide-grip barbell curl)/i, "curl", 1.00],
  [/(pushdown|tricep machine|tricep bar)/i, "curl", 1.20],
  [/(skull crusher|rolling tricep|tate press)/i, "curl", 0.90],
  [/(overhead.*tricep|tricep.*overhead)/i, "curl", 0.85],
  [/tricep kickback/i, "curl", 0.30],
  [/(wrist curl|reverse wrist)/i, "curl", 0.60],
  [/(farmer|suitcase)/i, "deadlift", 0.35],
  [/plate pinch/i, "curl", 0.40],
  // core (loaded)
  [/(cable crunch|machine crunch|weighted decline crunch)/i, "row", 0.60],
  [/(weighted sit-up|weighted russian|weighted plank)/i, "curl", 0.60],
  [/(woodchop|pallof|landmine rotation)/i, "row", 0.35],
];

export function liftFamily(name) {
  for (const [re, anchor, ratio] of LIFT_FAMILIES) if (re.test(name || "")) return { anchor, ratio };
  return null;
}

// Estimated 1RM (lbs) for a lift from body weight, sex, age and the muscle
// group's tier. `weightLbs` in lbs; returns lbs.
export function standard1RM(name, { weightLbs, gender, age, tier }) {
  const fam = liftFamily(name);
  if (!fam) return null;
  const kg = (weightLbs || 170) * 0.453592;
  const frac = STRENGTH_ANCHORS[fam.anchor][Math.max(0, Math.min(4, tier || 0))];
  const sex = gender === "female" ? FEMALE_FACTOR[fam.anchor] : 1;
  const anchor = frac * (weightLbs || 170) * bodyweightScale(kg) * sex * ageFactor(age);
  return anchor * fam.ratio;
}

// 1RM derived from a stored PR on ANY lift in the same family.
export function familyPR1RM(name, prs) {
  const fam = liftFamily(name);
  if (!fam || !prs) return null;
  let best = null;
  for (const [n, e1] of Object.entries(prs)) {
    if (!(e1 > 0)) continue;
    const f = liftFamily(n);
    if (!f || f.anchor !== fam.anchor) continue;
    const anchorEst = e1 / f.ratio;
    if (best == null || anchorEst > best) best = anchorEst;
  }
  return best == null ? null : best * fam.ratio;
}
