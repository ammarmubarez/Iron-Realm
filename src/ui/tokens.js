// Design tokens — the single source of truth for colour and type.
//
// Calm theme (Sept 2026), modelled on Opal via Mobbin: near-black ground,
// neutral cards, cream text, one accent used sparingly for data and state.
// Every screen reads these names; change a value here and the whole app
// follows. Alpha is appended as two hex digits at call sites (`${ACCENT}22`),
// so values must stay 6-digit hex.

export const BG      = "#000000";   // ground — true black, like Opal
export const BG2     = "#141518";   // card
export const BG3     = "#1d1f24";   // inner panel / row hover
export const DARK1   = "#0a0b0e";   // deepest recess (sheet gradients)

export const TEXT    = "#f3efe9";   // cream, not pure white — softer on OLED
export const MUTED   = "#8b9099";   // secondary text, section headers

export const ACCENT  = "#00d4ff";   // data / progress / selection
export const ACCENT2 = "#2a3340";   // slate — quiet borders and dividers
export const GOLD    = "#e8c44a";   // rank, PRs, streaks
export const GOLD2   = "#f6dd8a";   // lighter gold for text on gold fills
export const RED     = "#ff5c5c";   // warnings, decay, destructive
export const GREEN   = "#37d67a";   // success, fresh, completed

// One display face for the whole app. Orbitron (wide, letter-spaced caps) is
// retired — it was the main source of visual noise. Rajdhani carries both
// labels and numerals; weight and size do the hierarchy work now.
export const FONT_DISPLAY = "'Rajdhani', sans-serif";
export const TRACK = 0.3;           // default letter-spacing, px
export const TRACK_CAPS = 0.8;      // small uppercase section headers only
