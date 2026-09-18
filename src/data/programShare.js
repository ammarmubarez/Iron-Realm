// Custom programs: shape, validation, and the share envelope used for file
// export/import and friend-to-friend sharing. Pure — no runtime dependencies
// beyond the exercise database it validates against.
//
// A program is the same shape as a built-in one (data/programs.js):
//   { id, name, icon, color, athlete, era, desc, days: [{ label, rest, exercises: [...] }] }
//   exercise: { muscle, name, diff, type, sets, repsLabel }
// plus, for custom ones: { custom: true, createdAt, author }
//
// SECURITY: an imported program is UNTRUSTED INPUT — a file the hunter was
// sent, or a row another account wrote. `normalizeProgram` is the only way a
// program enters the store: it rebuilds the object field by field, clamps
// every string and number, drops anything it does not recognise, and re-derives
// `diff`/`type` from the local exercise database so a share cannot smuggle a
// bogus difficulty into the XP engine. It never trusts a value it can compute.

export const PROGRAM_LIMITS = {
  name: 40, desc: 140, author: 24, icon: 3, label: 28, repsLabel: 20,
  days: 7, exercisesPerDay: 16, setsMax: 20, bytes: 64 * 1024,
};

export const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

// Palette a custom program's accent must come from — an imported program
// cannot inject an arbitrary colour string into the UI.
export const PROGRAM_COLORS = [
  "#e8c44a", "#00d4ff", "#4ecb71", "#e05555", "#8b5cf6",
  "#ec4899", "#f59e0b", "#10b981", "#4a9eff", "#e8eef8",
];

// Strip control characters (a shared name must not carry newlines or escape
// sequences into the UI) without writing them literally into a regex.
const isPrintable = (ch) => { const c = ch.charCodeAt(0); return c > 31 && c !== 127; };
const str = (v, max) => (typeof v === "string"
  ? [...v].filter(isPrintable).join("").trim().slice(0, max) : "");
const int = (v, lo, hi, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt;
};

export function newProgramId() {
  return `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Build a blank 7-day week.
export function blankProgram(name = "My Program") {
  return {
    id: newProgramId(), custom: true, name, icon: "★", color: PROGRAM_COLORS[0],
    athlete: "Custom", era: "Your program", desc: "",
    createdAt: Date.now(), author: null,
    days: DAY_NAMES.map((d, i) => ({ label: i < 5 ? `Day ${i + 1}` : "Rest", rest: i >= 5, exercises: [] })),
  };
}

// Rebuild a program from untrusted input. `db` is EXERCISE_DB; `knownNames` is
// a Set of every exercise name that exists locally (built-ins + the hunter's
// own custom exercises). Returns null if the input cannot be a program.
export function normalizeProgram(raw, { db = {}, knownNames = null, keepId = false } = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const name = str(raw.name, PROGRAM_LIMITS.name);
  if (!name) return null;
  if (!Array.isArray(raw.days) || raw.days.length === 0) return null;

  // Exercise metadata is re-derived locally, never taken from the payload.
  const metaFor = (muscle, exName) => {
    const pool = db[muscle] || [];
    const hit = pool.find(e => e.name === exName);
    if (hit) return { diff: hit.diff, type: hit.type, iso: !!hit.iso };
    for (const [, list] of Object.entries(db)) {
      const any = list.find(e => e.name === exName);
      if (any) return { diff: any.diff, type: any.type, iso: !!any.iso };
    }
    return null;
  };

  const days = raw.days.slice(0, PROGRAM_LIMITS.days).map((d, i) => {
    const day = d && typeof d === "object" ? d : {};
    const rest = !!day.rest;
    const exercises = (Array.isArray(day.exercises) ? day.exercises : [])
      .slice(0, PROGRAM_LIMITS.exercisesPerDay)
      .map(e => {
        if (!e || typeof e !== "object") return null;
        const exName = str(e.name, 60);
        const muscle = str(e.muscle, 20);
        if (!exName || !muscle) return null;
        if (knownNames && !knownNames.has(exName)) return null;   // not in this hunter's database
        const meta = metaFor(muscle, exName);
        return {
          muscle, name: exName,
          diff: meta?.diff || "intermediate",
          type: meta?.type || "strength",
          ...(meta?.iso ? { iso: true } : {}),
          sets: int(e.sets, 1, PROGRAM_LIMITS.setsMax, 3),
          repsLabel: str(e.repsLabel, PROGRAM_LIMITS.repsLabel) || "8-12 reps",
        };
      })
      .filter(Boolean);
    return { label: str(day.label, PROGRAM_LIMITS.label) || (rest ? "Rest" : `Day ${i + 1}`), rest, exercises };
  });
  while (days.length < PROGRAM_LIMITS.days) days.push({ label: "Rest", rest: true, exercises: [] });

  const color = PROGRAM_COLORS.includes(raw.color) ? raw.color : PROGRAM_COLORS[0];
  return {
    id: keepId && typeof raw.id === "string" && /^cp_[a-z0-9_]{1,40}$/i.test(raw.id) ? raw.id : newProgramId(),
    custom: true,
    name,
    icon: str(raw.icon, PROGRAM_LIMITS.icon) || "★",
    color,
    athlete: str(raw.athlete, PROGRAM_LIMITS.author) || "Custom",
    era: str(raw.era, PROGRAM_LIMITS.author) || "Your program",
    desc: str(raw.desc, PROGRAM_LIMITS.desc),
    author: str(raw.author, PROGRAM_LIMITS.author) || null,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    days,
  };
}

// ─── SHARE ENVELOPE ──────────────────────────────────────────────────────────
// Compact on purpose: a share code is pasted into a chat, so every byte shows.
// Short keys, and only the fields that cannot be re-derived on import.

export const SHARE_MAGIC = "IRPROG";
export const SHARE_VERSION = 1;

export function encodeProgram(program, author = null) {
  const payload = {
    m: SHARE_MAGIC, v: SHARE_VERSION,
    n: program.name, i: program.icon, c: program.color, d: program.desc || "",
    a: author || program.author || null,
    t: Date.now(),
    y: program.days.map(day => day.rest
      ? { l: day.label, r: 1 }
      : { l: day.label, e: day.exercises.map(x => [x.muscle, x.name, x.sets, x.repsLabel]) }),
  };
  return JSON.stringify(payload);
}

// A share code: base64url of the compact JSON, so it survives being pasted
// into any chat app. Chunked with no padding.
export function toShareCode(program, author = null) {
  const json = encodeProgram(program, author);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `IR1:${b64}`;
}

export function fromShareCode(code) {
  const raw = String(code || "").trim().replace(/\s+/g, "");
  const body = raw.startsWith("IR1:") ? raw.slice(4) : raw;
  if (!body || body.length > PROGRAM_LIMITS.bytes) return null;
  if (!/^[A-Za-z0-9\-_]+$/.test(body)) return null;
  try {
    const b64 = body.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
    return decodeProgram(JSON.parse(new TextDecoder().decode(bytes)));
  } catch { return null; }
}

// Compact payload (or a full program object, as written to a .json file) back
// into the program shape. Still passes through normalizeProgram afterwards.
export function decodeProgram(payload) {
  if (!payload || typeof payload !== "object") return null;
  // A file export holds the full program under `program`.
  if (payload.program && typeof payload.program === "object") return payload.program;
  if (payload.m !== SHARE_MAGIC) return null;
  if (!Array.isArray(payload.y)) return null;
  return {
    name: payload.n, icon: payload.i, color: payload.c, desc: payload.d,
    author: payload.a, athlete: payload.a ? `@${String(payload.a).slice(0, 20)}` : "Shared",
    era: "Shared program",
    days: payload.y.map(day => ({
      label: day?.l, rest: !!day?.r,
      exercises: Array.isArray(day?.e) ? day.e.map(t => Array.isArray(t)
        ? { muscle: t[0], name: t[1], sets: t[2], repsLabel: t[3] } : null).filter(Boolean) : [],
    })),
  };
}

// File envelope — readable, versioned, and self-describing so a hunter can see
// what they were sent before importing it.
export function toShareFile(program, author = null) {
  return JSON.stringify({
    app: "iron-realm", kind: "program", version: SHARE_VERSION,
    exportedAt: new Date().toISOString(),
    author: author || program.author || null,
    program: { ...program, id: undefined },
  }, null, 2);
}

// Summary line for a program card: "5 days · 27 exercises · 84 sets".
export function programSummary(program) {
  const days = (program?.days || []).filter(d => !d.rest && d.exercises.length);
  const exercises = days.reduce((n, d) => n + d.exercises.length, 0);
  const sets = days.reduce((n, d) => n + d.exercises.reduce((s, e) => s + (e.sets || 0), 0), 0);
  return `${days.length} training day${days.length === 1 ? "" : "s"} · ${exercises} exercise${exercises === 1 ? "" : "s"} · ${sets} sets`;
}

// Weekly credited sets per muscle group for a program — lets the builder warn
// when a group is under the 10/wk minimum or past the ~20/wk plateau.
export function weeklyVolumeByGroup(program, creditsFor) {
  const totals = {};
  for (const day of program?.days || []) {
    if (day.rest) continue;
    for (const ex of day.exercises || []) {
      const credits = creditsFor(ex) || {};
      for (const [group, credit] of Object.entries(credits)) {
        totals[group] = (totals[group] || 0) + (ex.sets || 0) * credit;
      }
    }
  }
  return totals;
}
