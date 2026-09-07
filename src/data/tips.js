// Daily evidence-based training tips shown on the Home screen.
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.

// ─── DAILY TIPS ──────────────────────────────────────────────────────────────
// All tips sourced from peer-reviewed research and evidence-based guidelines
export const DAILY_TIPS = [
  // ── TRAINING SCIENCE ─────────────────────────────────────────────────────
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Train each muscle group 2x per week for maximum hypertrophy.",
    source: "Schoenfeld et al. (2016) — J Strength Cond Res",
    detail: "Studies show twice-weekly frequency produces significantly more muscle growth than once weekly at equal total volume.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Rest 2–3 minutes between heavy compound sets for full strength recovery.",
    source: "Schoenfeld et al. (2016) — J Strength Cond Res",
    detail: "Longer rest periods (3 min) produce greater strength and hypertrophy gains than short rests (1 min) for compound movements.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Aim for 10–20 working sets per muscle group per week.",
    source: "Krieger (2010) — J Strength Cond Res",
    detail: "Meta-analysis showed 2+ sets per exercise produces 46% more growth than 1 set. 10–20 weekly sets is the optimal hypertrophy range.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Train to within 1–3 reps of failure for optimal muscle stimulus.",
    source: "Schoenfeld & Grgic (2019) — Strength & Cond J",
    detail: "Proximity to failure is a key driver of hypertrophy. Leaving more than 3 reps in reserve significantly reduces growth stimulus.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Progressive overload — add weight or reps every 1–2 weeks to keep growing.",
    source: "NSCA Position Statement (2009)",
    detail: "Muscles adapt to a given stimulus within weeks. Systematic progression is the single most important factor in long-term strength and size gains.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Compound lifts first, isolation exercises last.",
    source: "Kraemer & Ratamess (2004) — Sports Med",
    detail: "Performing multi-joint exercises when CNS is fresh maximises load and neural drive. Isolation work is more effective after compounds.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Eccentric (lowering) phase should be controlled — 2–3 seconds down.",
    source: "Schoenfeld (2010) — J Strength Cond Res",
    detail: "Eccentric muscle actions produce greater mechanical tension and muscle damage, both key drivers of hypertrophy.",
  },
  {
    category: "TRAINING",
    icon: "⚔",
    tip: "Full range of motion produces more muscle growth than partial reps.",
    source: "McMahon et al. (2014) — J Strength Cond Res",
    detail: "Full ROM training leads to greater increases in muscle length and size compared to partial ROM at the same load.",
  },
  // ── RECOVERY ─────────────────────────────────────────────────────────────
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "7–9 hours of sleep is essential — growth hormone peaks during deep sleep.",
    source: "Dattilo et al. (2011) — Med Hypotheses",
    detail: "Sleep deprivation reduces anabolic hormone levels and impairs muscle protein synthesis. Prioritising sleep is as important as training.",
  },
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "Muscles need 48–72 hours to recover before training the same group again.",
    source: "NSCA Guidelines (2009)",
    detail: "Muscle protein synthesis peaks at 24–48 hours post-training. Training a muscle before it recovers limits adaptation and increases injury risk.",
  },
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "Cold water immersion reduces DOMS but may blunt long-term hypertrophy.",
    source: "Roberts et al. (2015) — J Physiology",
    detail: "Ice baths suppress inflammation needed for muscle adaptation. Best used during competition phases, not during hypertrophy training blocks.",
  },
  {
    category: "RECOVERY",
    icon: "◈",
    tip: "Active recovery (light walking, stretching) outperforms complete rest for DOMS.",
    source: "Dupuy et al. (2018) — Front Physiology",
    detail: "Meta-analysis of 99 studies found active recovery most effective for reducing muscle soreness compared to passive rest.",
  },
  // ── NUTRITION ────────────────────────────────────────────────────────────
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Consume 1.6–2.2g of protein per kg of bodyweight daily for muscle growth.",
    source: "Morton et al. (2018) — Br J Sports Med",
    detail: "Meta-analysis of 49 studies found protein beyond 1.62g/kg/day provides no additional hypertrophy benefit.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Spread protein across 3–5 meals — each meal should have 0.4g/kg bodyweight.",
    source: "Moore et al. (2009) — Am J Clin Nutr",
    detail: "Muscle protein synthesis is maximised per meal at ~20–40g protein. More frequent feedings sustain anabolic signalling throughout the day.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Eat within 2 hours post-workout to maximise muscle protein synthesis.",
    source: "Aragon & Schoenfeld (2013) — JISSN",
    detail: "The post-exercise anabolic window is real but wider than thought — prioritise total daily protein over exact timing.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Creatine monohydrate is the most evidence-backed legal supplement for strength.",
    source: "Lanhers et al. (2017) — Eur J Sport Sci",
    detail: "5g/day of creatine monohydrate consistently increases strength output and lean mass. No loading phase required.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "A slight calorie surplus (200–300 kcal) is optimal for muscle gain with minimal fat.",
    source: "Barakat et al. (2020) — Strength & Cond J",
    detail: "Aggressive bulking above maintenance increases fat gain without proportional muscle gain. A modest surplus maximises lean mass accretion.",
  },
  {
    category: "NUTRITION",
    icon: "◉",
    tip: "Caffeine (3–6mg/kg) 30–60 min pre-workout improves performance.",
    source: "Grgic et al. (2018) — Br J Sports Med",
    detail: "Meta-analysis of 21 studies confirmed caffeine significantly increases strength, endurance, and power output.",
  },
  // ── APP TIPS ─────────────────────────────────────────────────────────────
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Use the RANDOMIZE button on the Schedule screen to get a science-built workout.",
    source: "Iron Realm",
    detail: "The randomizer uses NSCA recovery guidelines and EMG data to pick exercises covering all muscle angles, avoiding muscles you trained in the last 48 hours.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Log your nutrition on the Schedule screen — you can log for any past day.",
    source: "Iron Realm",
    detail: "Tap any day tab on the Schedule screen and enter your calories and protein. The XP system adjusts your workout XP based on your nutrition for that day.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Check the Hunter screen to see which sub-muscles need more attention.",
    source: "Iron Realm",
    detail: "Expand any muscle group in the Hunter tab to see individual sub-muscle XP levels. Low levels indicate undertrained muscle regions.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "The difficulty filter in the randomizer selects exercises at your level.",
    source: "Iron Realm",
    detail: "Use Beginner when learning movements, Intermediate for your main training block, and Advanced/Elite when you want maximum stimulus.",
  },
  {
    category: "APP TIP",
    icon: "⬡",
    tip: "Log workouts for missed days by tapping that day's tab in Schedule.",
    source: "Iron Realm",
    detail: "Missed yesterday? Tap Tuesday's tab, hit Log Exercise, and your workout is saved on the correct day with correct XP calculations.",
  },
];
