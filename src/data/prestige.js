// Prestige — the hunter's long game. Pure data + pure helpers, no runtime deps.
//
// WHAT IT IS
//   At Hunter level 55 a hunter may prestige: the Hunter level returns to 1 and
//   they wear a mark that says how many times they have done it. The mark is
//   the reward — nothing else changes.
//
// WHAT IT IS NOT
//   Muscle levels do NOT reset. They are a biological state, not a score: the
//   load prescriptions (`tierFromLevel`), the randomizer's per-session dose and
//   the atrophy model all read them. A number on a screen resetting does not
//   make a chest smaller. Hunter XP, by contrast, is kilocalories burned — a
//   game currency — so spending it on a mark costs nothing real.
//
// THE GATE — why not "every muscle to 55"
//   Muscle level 55 is ~102,000 stimulus XP per muscle ≈ 10,200 hard sets
//   ≈ 13 years at 15 sets/week — per muscle, before atrophy, and forearms and
//   calves mostly earn fractional credit as helpers. All twelve to 55 is never.
//   So the balance check uses a FLOOR: every muscle group and endurance at
//   level 10 (~a year of honest work each, per the muscle milestone timeline).
//   You cannot prestige on bench and curls. Levels are post-atrophy, so a group
//   that has been left to detrain can drop back under the floor — balance
//   means balanced now, not once.
//
//   The Hunter gate is a plain constant. OVERALL_THRESHOLDS are PER-LEVEL
//   increments (500 × n^1.6), not cumulative, so the cost of a level climbs
//   fast: at ~1,800 kcal of logged training a week —
//       level 10 ≈    67k kcal ≈ 0.7 yr      level 20 ≈  434k ≈ 4.6 yr
//       level 30 ≈ 1.27M       ≈ 13.6 yr     level 55 ≈ 6.29M ≈ 67 yr
//   Set `hunterLevel` for the horizon you actually want a prestige to sit at.
//
// HOW THE XP IS SPENT
//   The workout ledger is the single source of truth and `rebuildProfileStats`
//   re-derives Hunter XP from it on every change. So a prestige cannot "set XP
//   to 0" — the next rebuild would put it straight back. Instead each prestige
//   records how much XP it consumed, and the rebuild subtracts the running
//   total. The ledger stays whole, muscle levels are untouched, the audit trail
//   still adds up, and deleting workouts after the fact cannot mint XP: the
//   displayed total just clamps at zero.

export const PRESTIGE = {
  hunterLevel: 55,        // Hunter level required
  muscleFloor: 10,        // every group below must be at least this level
  groups: ["chest", "back", "legs", "shoulders", "bicep", "tricep", "forearms", "core", "glutes", "calves", "cardio"],
  maxCount: 10,           // one tier per mark; past the last it stays Eternal
};

// One tier per prestige. `mark` is the inner glyph drawn inside the shared
// hexagonal frame (24×24 viewBox); each tier's is distinct so a mark can be read
// at a glance without the numeral.
export const PRESTIGE_TIERS = [
  { n: 1,  name: "Reforged",  color: "#cd7f32",
    mark: "M7 14 L12 9 L17 14" },
  { n: 2,  name: "Tempered",  color: "#9fb3c8",
    mark: "M7 12 L12 7 L17 12 M7 17 L12 12 L17 17" },
  { n: 3,  name: "Ascendant", color: "#d8dee9",
    mark: "M7 10 L12 5.5 L17 10 M7 14 L12 9.5 L17 14 M7 18 L12 13.5 L17 18" },
  { n: 4,  name: "Vanguard",  color: "#e8c44a",
    mark: "M12 5 L13.6 10.4 L19 12 L13.6 13.6 L12 19 L10.4 13.6 L5 12 L10.4 10.4 Z" },
  { n: 5,  name: "Warden",    color: "#34d399",
    mark: "M12 5.5 L17.5 8.5 V13.5 L12 18.5 L6.5 13.5 V8.5 Z M12 9 L14.5 10.5 V13 L12 15 L9.5 13 V10.5 Z" },
  { n: 6,  name: "Paragon",   color: "#4a9eff",
    mark: "M12 4.5 L13.9 10.2 L19.9 10.2 L15 13.7 L16.9 19.4 L12 15.9 L7.1 19.4 L9 13.7 L4.1 10.2 L10.1 10.2 Z" },
  { n: 7,  name: "Exalted",   color: "#a855f7",
    mark: "M6 17 L6 9 L9.5 12.5 L12 7 L14.5 12.5 L18 9 L18 17 Z" },
  { n: 8,  name: "Eclipse",   color: "#ef4444",
    mark: "M12 5 A7 7 0 1 0 12 19 A5.2 7 0 1 1 12 5 Z" },
  { n: 9,  name: "Voidborn",  color: "#f3efe9",
    mark: "M12 4.5 L18.5 15.5 H5.5 Z M12 19.5 L5.5 8.5 H18.5 Z" },
  { n: 10, name: "Eternal",   color: "#7dd3fc",
    mark: "M12 4.5 A7.5 7.5 0 1 0 12 19.5 A7.5 7.5 0 1 0 12 4.5 Z M12 9 A3 3 0 1 0 12 15 A3 3 0 1 0 12 9 Z" },
];

export const tierFor = (count) =>
  count > 0 ? PRESTIGE_TIERS[Math.min(count, PRESTIGE_TIERS.length) - 1] : null;

// Roman numerals read better on an emblem than "P7".
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
export const romanFor = (count) => ROMAN[Math.max(0, Math.min(10, count))] || String(count);

export const emptyPrestige = () => ({ count: 0, consumedXP: 0, history: [] });

// Hunter XP already spent on marks. Read by rebuildProfileStats.
export const prestigeConsumedXP = (profile) => Math.max(0, profile?.prestige?.consumedXP || 0);

// Everything the card needs to say what is missing, not just yes/no.
//   { ready, count, hunterLevel, hunterOk, groups: [{ key, level, ok }], short: [...] }
export function prestigeEligibility(profile) {
  const hunterLevel = profile?.overallLevel || 1;
  const levels = profile?.levels || {};
  const groups = PRESTIGE.groups.map(key => {
    const level = levels[key] || 1;
    return { key, level, ok: level >= PRESTIGE.muscleFloor };
  });
  const hunterOk = hunterLevel >= PRESTIGE.hunterLevel;
  const short = groups.filter(g => !g.ok);
  return { ready: hunterOk && short.length === 0, count: profile?.prestige?.count || 0,
    hunterLevel, hunterOk, groups, short };
}

// The new `prestige` block after spending `xp` at `level`. Pure: the caller
// rebuilds stats so the subtraction takes effect through the one rebuild path.
export function recordPrestige(prestige, { level, xp, now = Date.now() }) {
  const prev = prestige || emptyPrestige();
  const count = (prev.count || 0) + 1;
  const entry = { id: `pr_${now.toString(36)}_${count}`, date: now, count, level, xp: Math.round(xp) };
  return { count, consumedXP: (prev.consumedXP || 0) + entry.xp, history: [...(prev.history || []), entry] };
}
