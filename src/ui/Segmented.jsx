// Segmented — Opal's pill tab switch (via Mobbin): a dark track with one
// cream-filled selected segment. Used to switch views inside a card or sheet
// ("Week / Month / Lifetime", "Trend / Shadow race").
//
//   <Segmented value={tab} onChange={setTab}
//     options={[{ id: "trend", label: "Trend" }, { id: "race", label: "Shadow race" }]} />

import { BG3, MUTED, FONT_DISPLAY } from "./tokens";

const CREAM = "#f3efe9";
const INK   = "#111417";

export default function Segmented({ options, value, onChange, style }) {
  return (
    <div role="tablist" style={{ display: "inline-flex", gap: 4, padding: 4, background: BG3,
      borderRadius: 999, ...style }}>
      {options.map(o => {
        const on = o.id === value;
        return (
          <button key={o.id} type="button" role="tab" aria-selected={on}
            onClick={() => onChange?.(o.id)} style={{
              fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 600, lineHeight: 1,
              padding: "9px 16px", borderRadius: 999, border: "none", cursor: "pointer",
              background: on ? CREAM : "transparent", color: on ? INK : MUTED,
              transition: "background .18s ease, color .18s ease",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
