// Measured metabolism — your real maintenance calories, worked backwards from
// what you ate and what the scale did. Pure functions, no runtime dependencies.
//
// WHY
//   Mifflin-St Jeor predicts resting burn from height, weight, age and sex, and
//   an activity multiplier turns that into maintenance. Both are population
//   averages: individual maintenance scatters roughly ±10–15 % around them, and
//   it drifts down during a diet as the body adapts and moves less. The
//   3,500 kcal-per-pound planning rule compounds the error over weeks. So the
//   formula is a fine starting guess and a poor long-run answer.
//
// THE ARITHMETIC
//   Energy balance over a window:  intake − expenditure = stored energy.
//   Rearranged, with weight change expressed as energy:
//
//       maintenance = mean daily intake − (pounds gained per day × 3,500)
//
//   Losing weight makes the second term negative, so measured maintenance comes
//   out above intake — which is the point: if you ate 2,000 and lost half a
//   pound a week, you were burning about 2,250.
//
// WHY A REGRESSION AND NOT FIRST-MINUS-LAST
//   Day-to-day scale weight swings by pounds on water, glycogen, sodium and gut
//   contents. Two endpoints can disagree with the real trend by an entire
//   pound per week. A least-squares slope over every weigh-in in the window uses
//   all of them and is far less sensitive to which day you happened to step on
//   the scale.
//
// WHEN NOT TO TRUST IT
//   The estimate is only as good as the food log. Unlogged days are the killer:
//   averaging the days you logged silently assumes the days you didn't looked
//   the same, and they usually didn't. So this requires a real span of days AND
//   real logging coverage, returns a confidence, and blends toward the formula
//   rather than replacing it outright. A result that lands absurdly far from the
//   formula is treated as bad data, not as a remarkable metabolism.

export const KCAL_PER_LB = 3500;

export const TDEE_WINDOW_DAYS = 42;   // six weeks: long enough to average out water shifts
export const MIN_SPAN_DAYS    = 14;   // below this, scale noise dominates
export const MIN_WEIGH_INS    = 4;    // a slope needs more than two points
export const MIN_COVERAGE     = 0.6;  // ≥60 % of days in the window must have food logged
// Full trust at five weeks of weigh-ins — must be reachable INSIDE the window,
// or confidence silently caps below 1 and the measured value is never used
// outright no matter how good the data is.
export const FULL_TRUST_DAYS  = 35;
export const FULL_TRUST_COVER = 0.9;
// Beyond this distance from the formula, assume mis-logged food or a scale
// change rather than a genuinely extraordinary metabolism.
export const SANITY_LOW  = 0.55;
export const SANITY_HIGH = 1.60;

const DAY = 86400000;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const dayKey = (ts) => new Date(ts).toDateString();

// Least-squares slope of weight against time, in pounds per day.
function weightSlopePerDay(points) {
  const n = points.length;
  if (n < 2) return null;
  const meanX = points.reduce((s, p) => s + p.t, 0) / n;
  const meanY = points.reduce((s, p) => s + p.w, 0) / n;
  let num = 0, den = 0;
  for (const p of points) { num += (p.t - meanX) * (p.w - meanY); den += (p.t - meanX) ** 2; }
  if (den === 0) return null;
  return (num / den) * DAY;         // slope is per-ms; scale to per-day
}

// Everything the UI needs to explain the number, not just the number.
//   { method, maintenance, formula, measured, confidence, spanDays, weighIns,
//     loggedDays, coverage, meanIntake, trendLbsPerWeek, reason }
export function estimateMaintenance({ weightLog = [], foodLog = [], formulaMaintenance, now = Date.now(), windowDays = TDEE_WINDOW_DAYS }) {
  const base = {
    method: "formula", maintenance: formulaMaintenance, formula: formulaMaintenance,
    measured: null, confidence: 0, spanDays: 0, weighIns: 0, loggedDays: 0,
    coverage: 0, meanIntake: null, trendLbsPerWeek: null, reason: null,
  };
  if (!(formulaMaintenance > 0)) return { ...base, reason: "No body stats yet." };

  const cutoff = now - windowDays * DAY;
  const weighs = (weightLog || [])
    .filter(w => w && w.date >= cutoff && w.weight > 0)
    .map(w => ({ t: w.date, w: w.weight }))
    .sort((a, b) => a.t - b.t);
  // One entry per calendar day; a day logged twice must not count twice.
  const foods = new Map();
  for (const f of foodLog || []) {
    if (!f || f.date < cutoff || !(f.calories > 0)) continue;
    foods.set(dayKey(f.date), f.calories);
  }

  base.weighIns = weighs.length;
  base.loggedDays = foods.size;
  base.spanDays = weighs.length >= 2 ? Math.round((weighs[weighs.length - 1].t - weighs[0].t) / DAY) : 0;
  base.coverage = clamp01(base.loggedDays / windowDays);

  if (weighs.length < MIN_WEIGH_INS)
    return { ...base, reason: `Needs ${MIN_WEIGH_INS} weigh-ins in the last ${windowDays} days — you have ${weighs.length}.` };
  if (base.spanDays < MIN_SPAN_DAYS)
    return { ...base, reason: `Weigh-ins only span ${base.spanDays} days; ${MIN_SPAN_DAYS} are needed to see past water weight.` };
  if (base.coverage < MIN_COVERAGE)
    return { ...base, reason: `Only ${base.loggedDays} of the last ${windowDays} days have food logged. Averaging those assumes the rest matched, so the estimate would be a guess.` };

  const slope = weightSlopePerDay(weighs);
  if (slope == null) return { ...base, reason: "Weigh-ins carry no usable trend." };

  const meanIntake = [...foods.values()].reduce((s, c) => s + c, 0) / foods.size;
  const measured = Math.round(meanIntake - slope * KCAL_PER_LB);

  base.meanIntake = Math.round(meanIntake);
  base.measured = measured;
  base.trendLbsPerWeek = +(slope * 7).toFixed(2);

  const ratio = measured / formulaMaintenance;
  if (ratio < SANITY_LOW || ratio > SANITY_HIGH) {
    return { ...base, reason: `The numbers imply ${measured.toLocaleString()} kcal, too far from the ${formulaMaintenance.toLocaleString()} estimate to be believable — usually a mis-logged week or a scale change.` };
  }

  // Trust grows with both how long the window is and how completely it is
  // logged; the weaker of the two governs, so a perfectly logged fortnight is
  // still only partly trusted.
  const spanTrust  = clamp01((base.spanDays - MIN_SPAN_DAYS) / (FULL_TRUST_DAYS - MIN_SPAN_DAYS));
  const coverTrust = clamp01((base.coverage - MIN_COVERAGE) / (FULL_TRUST_COVER - MIN_COVERAGE));
  const confidence = clamp01(Math.min(spanTrust, coverTrust) * 0.5 + (spanTrust * coverTrust) * 0.5);

  return {
    ...base,
    method: confidence >= 0.85 ? "measured" : "blended",
    maintenance: Math.round(formulaMaintenance + (measured - formulaMaintenance) * confidence),
    confidence: +confidence.toFixed(2),
  };
}

// One line for the calorie card.
export function describeMaintenance(est) {
  if (!est) return "";
  if (est.method === "formula") return "Estimated from your body stats";
  const pct = Math.round(est.confidence * 100);
  const drift = est.measured - est.formula;
  const dir = drift === 0 ? "matches" : drift > 0 ? `${Math.abs(drift)} kcal above` : `${Math.abs(drift)} kcal below`;
  return `Measured from ${est.loggedDays} logged days and ${est.weighIns} weigh-ins · ${dir} the formula · ${pct}% confidence`;
}
