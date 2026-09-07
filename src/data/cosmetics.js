// Cosmetics: monarch themes, name auras, aspects, titles and relics.
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.

// Shadow theme — dark purple void aesthetic
// Deep void black backgrounds, electric blue-purple power aura, blood red accents
// Iron Realm themes
export const MONARCHS = [
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

// ─── NAME AURAS ───────────────────────────────────────────────────────────────
// Animated username effects unlocked by OVERALL level, aligned to rank tiers.
// Each higher rank unlocks a flashier aura; the top "Prismatic" rainbow is
// S-rank exclusive (level 30+). Effects are cosmetic and purely client-side.
export const NAME_AURAS = [
  { id: "static",    label: "Static",    minLevel: 1,  className: "",              rank: "E", desc: "Plain nameplate" },
  { id: "glow",      label: "Ember Glow", minLevel: 4,  className: "aura-glow",     rank: "D", desc: "Soft pulsing glow" },
  { id: "pulse",     label: "Pulse",     minLevel: 7,  className: "aura-pulse",    rank: "C", desc: "Breathing halo" },
  { id: "shimmer",   label: "Shimmer",   minLevel: 12, className: "aura-shimmer",  rank: "B", desc: "Light sweep across your name" },
  { id: "chroma",    label: "Chroma",    minLevel: 20, className: "aura-chroma",   rank: "A", desc: "Cyan-violet color shift" },
  { id: "prismatic", label: "Prismatic", minLevel: 30, className: "aura-prismatic", rank: "S", desc: "Full-spectrum rainbow — S-rank only" },
];

// ─── RELICS ───────────────────────────────────────────────────────────────────
// Cosmetic card frames that drop when you set a genuine PR (beat a previously
// recorded e1RM). Rarity is rolled per drop; duplicates are avoided by rolling
// within unowned relics, escalating rarity when a tier is complete.
export const RELIC_RARITIES = {
  common:    { name: "Common",    color: "#9aa7b8", weight: 60 },
  rare:      { name: "Rare",      color: "#00d4ff", weight: 30 },
  epic:      { name: "Epic",      color: "#a855f7", weight: 9 },
  legendary: { name: "Legendary", color: "#ffd700", weight: 1 },
};

export const RELIC_POOL = [
  { id: "iron_frame",    name: "Iron Frame",      rarity: "common" },
  { id: "bronze_edge",   name: "Bronze Edge",     rarity: "common" },
  { id: "steel_plating", name: "Steel Plating",   rarity: "common" },
  { id: "azure_circuit", name: "Azure Circuit",   rarity: "rare" },
  { id: "gilded_trim",   name: "Gilded Trim",     rarity: "rare" },
  { id: "frost_sigil",   name: "Frost Sigil",     rarity: "rare" },
  { id: "violet_storm",  name: "Violet Storm",    rarity: "epic" },
  { id: "ember_crown",   name: "Ember Crown",     rarity: "epic" },
  { id: "monarch_sigil", name: "Monarch's Sigil", rarity: "legendary" },
];

export const RELIC_FRAME_COLORS = {
  iron_frame: "#9aa7b8", bronze_edge: "#cd7f32", steel_plating: "#c0c8d4",
  azure_circuit: "#00d4ff", gilded_trim: "#e8c44a", frost_sigil: "#9ad9ff",
  violet_storm: "#a855f7", ember_crown: "#ff6b35", monarch_sigil: "#ffd700",
};

export const COSMETIC_TITLES = [
  { id: "ritual_7",   name: "Daily Hunter",   criteria: "7-day ritual streak",   threshold: 7 },
  { id: "ritual_30",  name: "Iron Apostle",   criteria: "30-day ritual streak",  threshold: 30 },
  { id: "ritual_100", name: "Sovereign",      criteria: "100-day ritual streak", threshold: 100 },
];

// Aspects: permanent specialization unlocked at level 30. Cosmetic-only —
// no XP modification. The chosen aspect's color tints leaderboard cards.
export const ASPECTS = [
  { id: "beast",     name: "Beast",     color: "#e85d4a", glyph: "⚔",
    description: "The path of raw force. Every rep is a hunt." },
  { id: "shadow",    name: "Shadow",    color: "#a855f7", glyph: "✺",
    description: "The path of relentless persistence. The work compounds in silence." },
  { id: "architect", name: "Architect", color: "#00d4ff", glyph: "◆",
    description: "The path of structured discipline. Plan, execute, repeat." },
  { id: "sovereign", name: "Sovereign", color: "#ffd700", glyph: "♛",
    description: "The path of mastery. Lead by your record, not your words." },
];
