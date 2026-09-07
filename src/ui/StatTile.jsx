// StatTile — Opal's hero stat tile (via Mobbin): one big number, a small
// uppercase label, an optional sub-line and a thin progress bar. Two of these
// side by side replace a screen's worth of competing widgets.
//
//   <StatTile label="Level" value={10} sub="3,168 / 19,905 XP" progress={0.16} color={rank.color} />

import { BG2, TEXT, MUTED, FONT_DISPLAY, TRACK_CAPS } from "./tokens";

export default function StatTile({ label, value, sub, progress, color = TEXT, style }) {
  const pct = progress == null ? null : Math.max(0, Math.min(1, progress));
  return (
    <div style={{ background: BG2, borderRadius: 16, padding: "16px 16px 14px", minWidth: 0, ...style }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 700, lineHeight: 1, color,
        letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 600, color: MUTED,
        letterSpacing: TRACK_CAPS, textTransform: "uppercase", marginTop: 6 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.3 }}>
          {sub}
        </div>
      )}
      {pct != null && (
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.08)", marginTop: 10, overflow: "hidden" }}>
          <div style={{ width: `${Math.round(pct * 100)}%`, height: "100%", borderRadius: 2, background: color,
            transition: "width .6s cubic-bezier(.16,1,.3,1)" }} />
        </div>
      )}
    </div>
  );
}
