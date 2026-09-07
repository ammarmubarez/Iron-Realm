// Button — modeled on Oura's button system (references pulled from Mobbin).
//
// Oura uses one pill shape at three intensities, and the intensity carries the
// meaning:
//   primary  solid cream pill, dark label   — THE action on a screen ("Start", "Continue")
//   glass    frosted translucent pill       — secondary CTA sitting on imagery ("Learn more")
//   outline  1px hairline, transparent      — chips, filters, metadata ("3 minutes")
//
// Shared traits: fully-rounded radius, generous horizontal padding, a calm
// grotesk label (no letter-spaced caps), and restrained motion. Press feedback
// comes from the app's global `button:active { transform: scale(.96) }`.
//
// Usage:
//   <Button>Start</Button>
//   <Button variant="glass" size="md">Learn more</Button>
//   <Button variant="outline" size="sm" icon="◎" selected>Wave motion</Button>
//   <Button variant="glass" block accent={GOLD}>Equip now</Button>

const CREAM = "#f3efe9";
const INK   = "#111417";

// Colocated styles: imported once into the app's global <style> so the
// variants get real :hover / :disabled states instead of inline hacks.
export const buttonCSS = `
  .ir-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    border-radius: 999px; border: 1px solid transparent;
    cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;
    font-family: 'Rajdhani', sans-serif; font-weight: 600; letter-spacing: .2px; line-height: 1;
    transition: background .18s ease, color .18s ease, border-color .18s ease, opacity .18s ease;
  }
  .ir-btn:disabled { opacity: .45; cursor: not-allowed; }
  .ir-btn__icon { display: inline-flex; font-size: 1.05em; line-height: 1; }

  /* sizes — Oura's primary is a tall 56px pill; chips sit around 36px */
  .ir-btn--sm { height: 36px; padding: 0 14px; font-size: 14px; }
  .ir-btn--md { height: 48px; padding: 0 28px; font-size: 16px; }
  .ir-btn--lg { height: 56px; padding: 0 36px; font-size: 17px; }
  .ir-btn--block { width: 100%; }

  /* primary — solid cream */
  .ir-btn--primary { background: ${CREAM}; color: ${INK}; }
  .ir-btn--primary:hover { background: #ffffff; }

  /* glass — frosted dark translucency over imagery */
  .ir-btn--glass {
    background: rgba(20, 26, 34, .55); color: ${CREAM};
    border-color: rgba(255, 255, 255, .08);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
  }
  .ir-btn--glass:hover { background: rgba(30, 38, 48, .70); }

  /* outline — hairline chip; the "selected" prop inverts it to solid */
  .ir-btn--outline { background: transparent; color: ${CREAM}; border-color: rgba(255, 255, 255, .70); }
  .ir-btn--outline:hover { background: rgba(255, 255, 255, .08); }
  .ir-btn--outline.is-selected { background: ${CREAM}; color: ${INK}; border-color: ${CREAM}; }
`;

export default function Button({
  variant = "primary",   // "primary" | "glass" | "outline"
  size = "md",           // "sm" | "md" | "lg"
  block = false,         // stretch to the container width
  selected = false,      // outline only: render as the chosen chip
  icon = null,           // optional leading glyph / element
  accent = null,         // optional tint for label + border (glass / outline)
  className = "",
  style,
  children,
  ...rest
}) {
  const cls = [
    "ir-btn",
    `ir-btn--${variant}`,
    `ir-btn--${size}`,
    block && "ir-btn--block",
    selected && "is-selected",
    className,
  ].filter(Boolean).join(" ");

  // An accent lets a glass/outline button pick up a contextual colour
  // (a relic's rarity, a muscle's hue) without a new variant per colour.
  const tint = accent && !selected ? { color: accent, borderColor: `${accent}66` } : null;

  return (
    <button type="button" className={cls} style={{ ...tint, ...style }} {...rest}>
      {icon && <span className="ir-btn__icon" aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
