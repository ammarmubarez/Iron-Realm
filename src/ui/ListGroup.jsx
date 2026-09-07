// ListGroup / ListRow — Opal's grouped settings list (via Mobbin).
//
// A quiet uppercase header, then a rounded card of rows separated by hairlines.
// Each row: leading glyph, label (+ optional sub-line), trailing value, chevron.
// This replaces the stack of individually-coloured "entry point" buttons that
// used to compete for attention on the Hunter screen.
//
//   <ListGroup title="PROGRESS">
//     <ListRow icon="◔" label="Volume & pace" value="12 weeks" onClick={...} />
//     <ListRow icon="★" label="PR history"    value="4 tracked" onClick={...} />
//   </ListGroup>

import { BG2, TEXT, MUTED, FONT_DISPLAY, TRACK_CAPS } from "./tokens";

export default function ListGroup({ title, children, style }) {
  return (
    <section style={{ marginBottom: 18, ...style }}>
      {title && (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 600, color: MUTED,
          letterSpacing: TRACK_CAPS, textTransform: "uppercase", padding: "0 4px", marginBottom: 8 }}>
          {title}
        </div>
      )}
      <div style={{ background: BG2, borderRadius: 14, overflow: "hidden" }}>
        {children}
      </div>
    </section>
  );
}

export function ListRow({ icon, label, sub, value, onClick, disabled = false, tone, last = false, style }) {
  const clickable = !!onClick && !disabled;
  return (
    <button type="button" onClick={clickable ? onClick : undefined} disabled={disabled} style={{
      width: "100%", display: "flex", alignItems: "center", gap: 12,
      minHeight: 54, padding: "11px 14px", textAlign: "left",
      background: "transparent", border: "none",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,.06)",
      cursor: clickable ? "pointer" : "default", opacity: disabled ? .5 : 1,
      fontFamily: FONT_DISPLAY, color: TEXT, ...style,
    }}>
      {icon != null && (
        <span aria-hidden="true" style={{ width: 26, display: "inline-flex", justifyContent: "center",
          fontSize: 17, color: tone || MUTED, flexShrink: 0 }}>{icon}</span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 16, fontWeight: 600, lineHeight: 1.2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        {sub && <span style={{ display: "block", fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 1.35 }}>{sub}</span>}
      </span>
      {value != null && (
        <span style={{ fontSize: 14, color: tone || MUTED, flexShrink: 0, maxWidth: "45%",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
      )}
      {clickable && <span aria-hidden="true" style={{ color: MUTED, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>›</span>}
    </button>
  );
}
