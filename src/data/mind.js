// Mind & Spirit activity ladders.
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.

// ─── MIND & SPIRIT ────────────────────────────────────────────────────────────
// Two life attributes leveled outside the body-XP system. XP is derived by
// summing a per-profile `mindLog` ledger, so it survives the workout-stat
// recompute on load (which only rebuilds muscle stats). Faith XP is framed as
// engagement points weighted by time/effort — a consistency nudge, not a
// ranking of spiritual worth.
//
// Each activity: xpPer × qty (unit-based) or a flat xp (single act). `custom`
// lets the user name their own entry (Intelligence is open-ended by design).
export const MIND_ACTIVITIES = {
  intelligence: [
    { id: "read",     label: "Read a book",         unit: "min",  xpPer: 8,  defaultQty: 10 },
    { id: "chapter",  label: "Finished a chapter",  flat: 120 },
    { id: "study",    label: "Study / course",      unit: "min",  xpPer: 8,  defaultQty: 15 },
    { id: "skill",    label: "Learned a new skill", flat: 200 },
    { id: "article",  label: "Article / podcast",   flat: 60 },
    { id: "custom",   label: "Something else",      flat: 80, custom: true },
  ],
  faith: [
    // Daily pillars — farḍ-tagged acts are obligations, not extra credit.
    // They're hidden unless settings.faithScope === "all" (opt-in), so the
    // default XP economy rewards voluntary devotion only.
    { id: "fard",           label: "Farḍ prayer on time", unit: "prayer",xpPer: 50,  defaultQty: 1, fard: true },
    { id: "jamaah",         label: "Prayed in congregation", unit: "prayer", xpPer: 75, defaultQty: 1, fard: true },
    { id: "sunnah",         label: "Sunnah / Nafl prayer",unit: "prayer",xpPer: 60,  defaultQty: 1 },
    { id: "tahajjud",       label: "Tahajjud",            flat: 150 },
    { id: "adhkar",         label: "Morning / evening adhkār", flat: 60 },
    { id: "dhikr",          label: "Dhikr / Istighfār",   flat: 50 },
    { id: "salawat",        label: "Ṣalawāt on the Prophet ﷺ", flat: 40 },
    { id: "dua",            label: "Heartfelt duʿā",      flat: 30 },
    // Qur'an & knowledge — recitation XP tracks the ḥasanāt of the hadith
    // (1 ḥasanah/letter ×10, Tirmidhī 2910; ≈540 letters/page ≈ 5,400
    // ḥasanāt), diluted ÷100 so it stays balanced against other acts.
    { id: "quran_read",     label: "Qur'an recitation",   unit: "page",  xpPer: 54, defaultQty: 1,
      hasanatPer: 5400, note: "≈5,400 ḥasanāt per page (Tirmidhī) · XP = ḥasanāt ÷100" },
    { id: "quran_memorize", label: "Qur'an memorization", unit: "āyah",  xpPer: 120, defaultQty: 1 },
    { id: "kahf",           label: "Sūrah al-Kahf (Friday)", flat: 100 },
    { id: "hadith",         label: "Hadith study",        flat: 80 },
    { id: "lecture",        label: "Islamic lecture / ḥalaqah", flat: 90 },
    { id: "teach",          label: "Taught / shared knowledge", flat: 120 },
    // Weekly & seasonal
    { id: "jumuah",         label: "Jumuʿah prayer",      flat: 150, fard: true },
    { id: "fasting",        label: "Voluntary fasting",   unit: "day",   xpPer: 300, defaultQty: 1 },
    // Character & community
    { id: "sadaqah",        label: "Ṣadaqah (charity)",   flat: 100 },
    { id: "parents",        label: "Kindness to parents / kinship", flat: 90 },
    { id: "sick",           label: "Visited the sick",    flat: 120 },
    { id: "custom",         label: "Other good deed",     flat: 60, custom: true },
  ],
};
