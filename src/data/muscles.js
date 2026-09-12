// Muscle metadata, SVG-region mapping, angle groups and selection rules.
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.

// ─── MUSCLE META ──────────────────────────────────────────────────────────────
export const MUSCLE_META = {
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
  // ── Life attributes (leveled from the mind/spirit log, not workouts) ──
  intelligence:{ name: "Intelligence", color: "#8b8cf6", glyph: "IN" },
  faith:       { name: "Faith",        color: "#2ecc9b", glyph: "FA" },
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
  // ── v2.5 additions (see data/emg.js anatomy notes) ──
  "serratus-anterior":   { name: "Serratus Anterior",   color: "#f07070", parent: "chest"     },
  "infraspinatus":       { name: "Rotator Cuff",        color: "#6a3fd0", parent: "shoulders" },
  "brachialis":          { name: "Brachialis",          color: "#d08a2a", parent: "bicep"     },
  "brachioradialis":     { name: "Brachioradialis",     color: "#b06a30", parent: "forearms"  },
  "hip-flexors":         { name: "Hip Flexors",         color: "#0aa3c2", parent: "core"      },
};

export const _ID_TO_MUSCLE = {"mid-lower-pectoralis":"chest","upper-pectoralis":"chest","lats":"back","lowerback":"back","traps-middle":"back","lower-trapezius":"back","upper-trapezius":"back","upper-trapzeius":"back","anterior-deltoid":"shoulders","lateral-deltoid":"shoulders","posterior-deltoid":"shoulders","short-head-bicep":"bicep","long-head-bicep":"bicep","medial-head-triceps":"tricep","long-head-triceps":"tricep","lateral-head-triceps":"tricep","later-head-triceps":"tricep","wrist-flexors":"forearms","wrist-extensors":"forearms","upper-abdominals":"core","lower-abdominals":"core","obliques":"core","gluteus-maximus":"glutes","gluteus-medius":"glutes","outer-quadricep":"legs","rectus-femoris":"legs","inner-quadricep":"legs","inner-thigh":"legs","lateral-hamstrings":"legs","medial-hamstrings":"legs","gastrocnemius":"calves","soleus":"calves","tibialis":"calves","serratus-anterior":"chest","infraspinatus":"shoulders","brachialis":"bicep","brachioradialis":"forearms","hip-flexors":"core"};

// ─── WORKOUT RANDOMIZER ───────────────────────────────────────────────────────
export const ANGLE_GROUPS = {
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

export const SELECTION_RULES = {
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

export const _ANGLE_GROUP_LABELS = {
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

// Sub-muscle options per muscle group (for custom exercise builder)
export const _CUSTOM_SUB_OPTIONS = {
  chest:     [["upper-pectoralis","Upper Chest"],["mid-lower-pectoralis","Mid/Lower Chest"],["serratus-anterior","Serratus"]],
  back:      [["lats","Lats"],["lowerback","Lower Back"],["upper-trapezius","Upper Traps"],["traps-middle","Mid Traps"],["lower-trapezius","Lower Traps"]],
  shoulders: [["anterior-deltoid","Front Delt"],["lateral-deltoid","Side Delt"],["posterior-deltoid","Rear Delt"],["infraspinatus","Rotator Cuff"]],
  bicep:     [["short-head-bicep","Short Head"],["long-head-bicep","Long Head"],["brachialis","Brachialis"]],
  tricep:    [["lateral-head-triceps","Lateral Head"],["medial-head-triceps","Medial Head"],["long-head-triceps","Long Head"]],
  forearms:  [["wrist-flexors","Flexors"],["wrist-extensors","Extensors"],["brachioradialis","Brachioradialis"]],
  core:      [["upper-abdominals","Upper Abs"],["lower-abdominals","Lower Abs"],["obliques","Obliques"],["hip-flexors","Hip Flexors"]],
  glutes:    [["gluteus-maximus","Glute Max"],["gluteus-medius","Glute Med"]],
  legs:      [["outer-quadricep","Outer Quad"],["rectus-femoris","Rectus Femoris"],["inner-quadricep","Inner Quad"],["inner-thigh","Inner Thigh"],["lateral-hamstrings","Outer Hamstring"],["medial-hamstrings","Inner Hamstring"]],
  calves:    [["gastrocnemius","Gastrocnemius"],["soleus","Soleus"],["tibialis","Tibialis"]],
};
