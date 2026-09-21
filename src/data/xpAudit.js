// XP audit ledger — an append-only record of every change to the workout log
// and therefore to XP. Pure data + pure helpers.
//
// WHY IT EXISTS
//   Stats are derived: `rebuildProfileStats` recomputes levels, per-muscle XP
//   and condition from `profile.workouts` every time it changes. That makes the
//   numbers self-correcting but it also means a bad write is invisible after
//   the fact — the ledger is the only place a mistake leaves a trace. v2.12
//   shipped after an edit on the Schedule screen silently deleted the entry it
//   was meant to change; with this ledger that shows up as an `edit` event whose
//   delta is the full value of the exercise, and it can be undone.
//
// WHAT AN EVENT HOLDS
//   Enough to explain the change and to reverse it exactly:
//     added   — the id of the entry this event appended (delete it to undo)
//     removed — the WHOLE entry this event took out (re-append it to undo)
//   A revert is therefore cheap and lossless, and reverting is itself an event.

export const XP_LOG_MAX = 250;          // keep the tail; older events age out
export const XP_EVENT_TYPES = ["log", "edit", "delete", "revert", "import", "repair", "prestige"];

export const newWorkoutId = () =>
  `wk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
export const newEventId = () =>
  `xe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// A flag on an event that a human should look at. Deliberately conservative —
// it points at things worth a glance, it does not accuse anyone of cheating.
//   · a single session worth more than a day of hard training
//   · an edit or delete that moved XP the wrong way for what it claims to be
//   · XP appearing with no workout attached
export const ANOMALY_SINGLE_GAIN = 1500;   // kcal in one entry
export function anomalyFor(event) {
  if (!event) return null;
  const d = event.delta || 0;
  if (event.type === "log" && d > ANOMALY_SINGLE_GAIN) return "unusually large single gain";
  if (event.type === "log" && d < 0) return "a log that reduced XP";
  if (event.type === "edit" && Math.abs(d) > ANOMALY_SINGLE_GAIN) return "edit moved a large amount";
  if (event.type === "delete" && d > 0) return "a delete that increased XP";
  if (event.type !== "revert" && event.overallAfter < 0) return "negative total";
  return null;
}

// Human sentence for one event.
export function describeEvent(e) {
  if (!e) return "";
  const name = e.exerciseName || "an exercise";
  const amount = `${e.delta > 0 ? "+" : ""}${e.delta} XP`;
  switch (e.type) {
    case "log":    return `Logged ${name} · ${amount}`;
    case "edit":   return `Edited ${name} · ${amount}`;
    case "delete": return `Deleted ${name} · ${amount}`;
    case "revert": return `Reverted "${e.revertedType || "a change"}" on ${name} · ${amount}`;
    case "import": return `Imported data · ${amount}`;
    case "repair": return `Recalculated from the workout log · ${amount}`;
    case "prestige": return `Prestige ${e.prestigeCount || ""} · Hunter level ${e.prestigeLevel || "?"} → 1 · ${amount}`;
    default:       return `${e.type} · ${amount}`;
  }
}

// Build an event. `removed` is stored whole because undoing a removal needs the
// entry back; `added` only needs its id because undoing an addition is a delete.
export function buildEvent({ type, add = null, remove = null, overallBefore, overallAfter, source = null, extra = null }) {
  return {
    id: newEventId(),
    ts: Date.now(),
    type,
    exerciseName: (add || remove)?.exerciseName || (add || remove)?.exercise?.name || null,
    overallBefore: Math.round(overallBefore || 0),
    overallAfter: Math.round(overallAfter || 0),
    delta: Math.round((overallAfter || 0) - (overallBefore || 0)),
    addedId: add?.id || null,
    removed: remove || null,
    source,
    ...(extra || {}),
  };
}

export const appendEvent = (log, event) => [...(log || []), event].slice(-XP_LOG_MAX);

// The compact row synced for founder review: no set-by-set detail, no body
// metrics — just what a change was and how much XP it moved.
export function toAuditRow(event) {
  return {
    event_id: event.id,
    ts: new Date(event.ts).toISOString(),
    type: event.type,
    exercise: event.exerciseName,
    delta: event.delta,
    overall_after: event.overallAfter,
    anomaly: anomalyFor(event),
  };
}
