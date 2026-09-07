"""Calm theme pass (Opal via Mobbin) + Hunter screen restructure.

Run from the repo root:  python3 calm.py
Deterministic and self-verifying; re-running on an already-transformed file
fails loudly at the first missing anchor rather than double-applying.
"""
import re, sys

PATH = "src/iron-realm.jsx"
src = open(PATH).read()
orig_len = len(src)

# ───────────────────────── string/comment-aware scanners ─────────────────────────
def skip_str(s, j):
    q = s[j]; j += 1
    while j < len(s):
        if s[j] == "\\": j += 2; continue
        if s[j] == q: return j + 1
        if q == "`" and s[j] == "$" and s[j+1] == "{": j = match(s, j+1) + 1; continue
        j += 1
    return j

def match(s, i):
    pairs = {"(": ")", "[": "]", "{": "}"}; stack = [pairs[s[i]]]; j = i + 1
    while j < len(s) and stack:
        c = s[j]
        if c in "\"'`": j = skip_str(s, j); continue
        if c == "/" and s[j+1] == "/": j = s.index("\n", j); continue
        if c == "/" and s[j+1] == "*": j = s.index("*/", j) + 2; continue
        if c in pairs: stack.append(pairs[c])
        elif c == stack[-1]: stack.pop()
        j += 1
    return j - 1

def func_span(name):
    """[start, end) of a top-level function. Anchored on the NEXT top-level
    declaration rather than brace-matching: JSX text like "what's lost" has
    unpaired apostrophes that derail a string-aware scanner."""
    m = re.search(r"^function " + name + r"\(", src, re.M)
    nxt = re.compile(r"^(?:function |const |let |export |// ─── )", re.M).search(src, m.end())
    end_limit = nxt.start() if nxt else len(src)
    e = src.rfind("\n}\n", m.start(), end_limit)
    must(e > 0, f"{name}: closing brace not found before next declaration")
    return m.start(), e + 3

def must(cond, msg):
    if not cond: print("ANCHOR FAILED:", msg); sys.exit(1)

def replace_once(old, new, label):
    global src
    must(src.count(old) == 1, f"{label}: expected exactly one match, found {src.count(old)}")
    src = src.replace(old, new, 1)

# ═══════════════════════════ A. STRUCTURE ═══════════════════════════

# A1. imports
replace_once('import Button, { buttonCSS } from "./ui/Button";',
'''import Button, { buttonCSS } from "./ui/Button";
import ListGroup, { ListRow } from "./ui/ListGroup";
import StatTile from "./ui/StatTile";
import Segmented from "./ui/Segmented";
// ACCENT / ACCENT2 stay local `let`s — they are re-tinted at runtime by the
// brightness and monarch-theme settings, so they cannot be read-only imports.
import { BG, BG2, BG3, DARK1, TEXT, MUTED, GOLD, GOLD2, RED, GREEN,
         FONT_DISPLAY, TRACK, TRACK_CAPS } from "./ui/tokens";''', "imports")

# A2. palette consts now live in ui/tokens.js
before = src
src = re.sub(r'^const (BG|BG2|BG3|DARK1|ACCENT|ACCENT2|GOLD|GOLD2|RED|GREEN|MUTED|TEXT)\s*=\s*"#[0-9a-fA-F]{3,8}";[^\n]*\n', "", src, flags=re.M)
removed_palette = before.count("\n") - src.count("\n")
print(f"  palette consts moved to tokens: {removed_palette}")

# A3. extra Hunter-screen state
replace_once("  const [conditionOpen, setConditionOpen]       = useState(false);",
"""  const [conditionOpen, setConditionOpen]       = useState(false);
  const [progressOpen, setProgressOpen]         = useState(false);
  const [switcherOpen, setSwitcherOpen]         = useState(false);""", "hunter state")

# A4. Hunter screen: replace everything from its top-level `return (` to the end of the function
s, e = func_span("CharacterScreen")
body = src[s:e]
ret = body.index("\n  return (\n    <div style={{ height: \"100dvh\"")
NEW_RETURN = r'''
  // ── Hero tile inputs ──
  const condEntries = Object.entries(st.condition || {});
  const freshCount  = condEntries.filter(([, v]) => v >= 0.995).length;
  const condTotal   = condEntries.length;
  const decaying    = condTotal - freshCount;
  const avgCond     = condTotal ? condEntries.reduce((a, [, v]) => a + v, 0) / condTotal : 1;
  const condColor   = decaying === 0 ? GREEN : avgCond >= 0.85 ? GOLD : RED;
  const prCount     = Object.keys(st.prs || {}).length;
  const relicsOwned = (st.cosmetics?.relics || []).length;
  const openEdit = () => {
    setEditName(st.name); setEditAge(String(st.age || "")); setEditWeight(String(st.weightLbs || 170));
    setEditHeightFt(String(Math.floor((st.heightIn || 70) / 12))); setEditHeightIn(String((st.heightIn || 70) % 12));
    setEditGender(st.gender || "male"); setEditMode(v => !v);
  };
  const sectionHead = (t) => (
    <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: TRACK_CAPS,
      textTransform: "uppercase", padding: "0 4px", marginBottom: 8 }}>{t}</div>
  );

  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: BG, padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ padding: "22px 18px 0" }}>

        {/* ── HEADER — avatar, name, rank pill ── */}
        <div className="card-in" style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: BG2, border: `2px solid ${rank.color}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700, color: rank.color }}>
            {(st.name || "?").trim().charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: TEXT, lineHeight: 1.1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{st.name}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6, padding: "3px 10px",
              borderRadius: 999, background: `${rank.color}1a`, border: `1px solid ${rank.color}55` }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: 700, color: rank.color }}>{rank.rank}</span>
              <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: TEXT }}>{rank.label}</span>
            </div>
          </div>
          <button type="button" onClick={openEdit} aria-label="Edit profile" style={{
            width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
            background: editMode ? `${GOLD}22` : BG2, color: editMode ? GOLD : MUTED, fontSize: 16 }}>✎</button>
        </div>

        {/* ── HERO TILES ── */}
        <div className="card-in card-in-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
          <StatTile label="Level" value={st.overallLevel} color={rank.color}
            sub={`${current.toLocaleString()} / ${needed.toLocaleString()} XP`} progress={needed ? current / needed : 0} />
          <StatTile label="Fresh muscles" value={condTotal ? `${freshCount}/${condTotal}` : "—"} color={condColor}
            sub={condTotal === 0 ? "Log a workout to start tracking"
                : decaying === 0 ? "Everything is in condition"
                : `${decaying} detraining · ${Math.round(avgCond * 100)}% avg condition`}
            progress={condTotal ? avgCond : 0} />
        </div>

        {/* ── EDIT FORM (from the header pencil or Account → Edit profile) ── */}
        {editMode && (
          <div className="slide-up" style={{ background: BG2, borderRadius: 16, padding: 16, marginBottom: 18 }}>
            {sectionHead("Edit profile")}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 4 }}>Name</div>
                <input className="input-field" value={editName} onChange={e => setEditName(e.target.value)} maxLength={20}/>
              </div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 4 }}>Age</div>
                <input className="input-field" type="number" value={editAge} onChange={e => setEditAge(e.target.value)} placeholder="25" min="13" max="99"/>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 4 }}>Weight ({wtLabel()})</div>
                <input className="input-field" type="number" value={editWeight} onChange={e => setEditWeight(e.target.value)} placeholder="170"/>
              </div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 4 }}>Height ft</div>
                <input className="input-field" type="number" value={editHeightFt} onChange={e => setEditHeightFt(e.target.value)} placeholder="5" min="3" max="7"/>
              </div>
              <div>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 4 }}>Height in</div>
                <input className="input-field" type="number" value={editHeightIn} onChange={e => setEditHeightIn(e.target.value)} placeholder="10" min="0" max="11"/>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 6 }}>Gender</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ id: "male", label: "Male" }, { id: "female", label: "Female" }].map(g => (
                  <Button key={g.id} variant="outline" size="sm" selected={editGender === g.id} onClick={() => setEditGender(g.id)}>{g.label}</Button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: profiles.length > 1 ? "1fr 1fr" : "1fr", gap: 8 }}>
              <Button variant="primary" size="md" block onClick={handleSaveEdit}>Save changes</Button>
              {profiles.length > 1 && (
                <Button variant="glass" size="md" block accent={RED} onClick={() => setDeleteConfirm(store.activeId)}>Delete hunter</Button>
              )}
            </div>
          </div>
        )}

        {/* ── DELETE CONFIRM ── */}
        {deleteConfirm && (
          <div style={{ background: BG2, border: `1px solid ${RED}55`, borderRadius: 16, padding: 16, marginBottom: 18 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 700, color: RED, marginBottom: 6 }}>Delete this hunter?</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, color: TEXT, marginBottom: 14, lineHeight: 1.5 }}>
              This permanently erases all XP, levels and progress for <strong>{st.name}</strong>. It cannot be undone.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Button variant="glass" size="md" block onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="primary" size="md" block style={{ background: RED, color: "#fff" }}
                onClick={() => { onDeleteProfile(deleteConfirm); setDeleteConfirm(null); setEditMode(false); }}>Confirm delete</Button>
            </div>
          </div>
        )}

        {/* ── BODY MATRIX ── */}
        <div className="card-in card-in-2" style={{ background: BG2, borderRadius: 16, padding: "14px 8px 6px", marginBottom: 18 }}>
          <div style={{ padding: "0 8px" }}>{sectionHead("Body matrix")}</div>
          <BodyFigure levels={st.levels} subLevels={subMuscleLevels} gender={st.gender} highlight={selectedMuscle} />
        </div>

        {/* ── PROGRESS ── */}
        <ListGroup title="Progress">
          <ListRow icon="◔" label="Volume & pace" sub="Weekly tonnage and this month vs last" value="12 weeks" onClick={() => setProgressOpen(true)} />
          <ListRow icon="★" label="PR history" value={`${prCount} tracked`} onClick={() => setPrHistoryOpen(true)} />
          <ListRow icon="▦" label="Training heatmap" value="13 weeks" onClick={() => setHeatmapOpen(true)} />
          <ListRow icon="◑" label="Condition report" sub="Detraining, recovery and what to train"
            value={decaying ? `${decaying} decaying` : "All fresh"} tone={decaying ? RED : GREEN}
            onClick={() => setConditionOpen(true)} last />
        </ListGroup>

        {/* ── IDENTITY ── */}
        <ListGroup title="Identity">
          <ListRow icon="◆" label="Signature lift"
            sub={st.patronLift && st.prs?.[st.patronLift] ? `est. 1RM ${Math.round(wtVal(st.prs[st.patronLift]))} ${wtLabel()}` : null}
            value={st.patronLift || (prCount ? "Not set" : "Earn a PR first")}
            disabled={!prCount} onClick={() => setPatronPickerOpen(true)} />
          <ListRow icon="◇" label="Relic vault" value={`${relicsOwned}/${RELIC_POOL.length}`} onClick={() => setRelicVaultOpen(true)} last />
        </ListGroup>

        {/* ── ACCOUNT ── */}
        <ListGroup title="Account">
          <ListRow icon="✎" label="Edit profile" value={`${st.age ? st.age + " · " : ""}${Math.round(wtVal(st.weightLbs || 0))} ${wtLabel()}`} onClick={openEdit} />
          <ListRow icon="⇄" label="Switch hunter" value={profiles.length > 1 ? `${profiles.length} hunters` : "Only one"} onClick={() => setSwitcherOpen(v => !v)} />
          <ListRow icon="+" label="New hunter" onClick={onCreateProfile} last />
        </ListGroup>
        {switcherOpen && (
          <div className="slide-up" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 2px 6px", marginTop: -8, marginBottom: 18 }}>
            {profiles.map(p => {
              const isActive = p.id === store.activeId; const r = getRank(p.overallLevel);
              return (
                <Button key={p.id} variant="outline" size="sm" selected={isActive} onClick={() => onSwitchProfile(p.id)}
                  icon={<span style={{ color: isActive ? undefined : r.color, fontWeight: 700 }}>{r.rank}</span>}>
                  {p.name} · L{p.overallLevel}
                </Button>
              );
            })}
          </div>
        )}

        {/* ── MUSCLE LEVELS ── */}
        <Reveal>
          {sectionHead("Muscle levels")}
          <StatTree
            condition={st.condition || {}}
            lastTrained={st.lastTrained || {}}
            tree={STAT_TREE}
            getGroupXP={getGroupXP}
            getSuperXP={getSuperXP}
            subStats={subStats}
            subLevels={subLevels}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={(id) => setSelectedMuscle(prev => prev === id ? null : id)}
          />
        </Reveal>
      </div>

      {/* ── SHEETS ── */}
      {progressOpen && <ProgressModal workouts={st.workouts || []} onClose={() => setProgressOpen(false)} />}
      {conditionOpen && <ConditionReportModal profile={st} onClose={() => setConditionOpen(false)} />}
      {prHistoryOpen && <PRHistoryModal workouts={st.workouts} prs={st.prs} onClose={() => setPrHistoryOpen(false)} />}
      {heatmapOpen && <HeatmapModal workouts={st.workouts} onClose={() => setHeatmapOpen(false)} />}

      {patronPickerOpen && (() => {
        const sorted = Object.entries(st.prs || {}).sort((a, b) => b[1] - a[1]);
        const pick = (n) => { (onSetPatronLift || (v => onUpdateProfile(store.activeId, { patronLift: v })))(n); setPatronPickerOpen(false); };
        return createPortal(
          <div onClick={() => setPatronPickerOpen(false)} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150,
            background: "rgba(0,0,0,.72)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: BG2, borderRadius: "20px 20px 0 0",
              width: "100%", maxWidth: 480, padding: "18px 16px 40px", maxHeight: "70dvh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: TEXT }}>Signature lift</div>
                <button onClick={() => setPatronPickerOpen(false)} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
              </div>
              <ListGroup>
                {st.patronLift && <ListRow icon="✕" label="Remove pin" tone={RED} onClick={() => pick(null)} />}
                {sorted.map(([ex, e1rm], i) => (
                  <ListRow key={ex} icon={ex === st.patronLift ? "★" : "☆"} label={ex}
                    value={`${Math.round(wtVal(e1rm))} ${wtLabel()}`} tone={ex === st.patronLift ? GOLD : undefined}
                    onClick={() => pick(ex)} last={i === sorted.length - 1} />
                ))}
              </ListGroup>
            </div>
          </div>, document.body);
      })()}

      {relicVaultOpen && createPortal(
        <div onClick={() => setRelicVaultOpen(false)} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150,
          background: "rgba(0,0,0,.72)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: BG2, borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 480, padding: "18px 16px 40px", maxHeight: "70dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: TEXT }}>Relic vault</div>
              <button onClick={() => setRelicVaultOpen(false)} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 12 }}>Card frames dropped by setting new PRs. Tap to equip.</div>
            <ListGroup>
              {RELIC_POOL.map((r, i) => {
                const owned = (st.cosmetics?.relics || []).some(x => x.id === r.id);
                const equipped = st.cosmetics?.equippedRelic === r.id;
                const c = RELIC_FRAME_COLORS[r.id];
                return (
                  <ListRow key={r.id} icon={r.rarity === "legendary" ? "👑" : r.rarity === "epic" ? "🔮" : r.rarity === "rare" ? "💠" : "🛡️"}
                    label={r.name} sub={RELIC_RARITIES[r.rarity].name}
                    value={equipped ? "Equipped" : owned ? "Tap to equip" : "Set a PR"} tone={equipped ? c : undefined}
                    disabled={!owned} last={i === RELIC_POOL.length - 1}
                    onClick={() => onUpdateProfile(store.activeId, { cosmetics: { ...(st.cosmetics || {}), equippedRelic: equipped ? null : r.id } })} />
                );
              })}
            </ListGroup>
          </div>
        </div>, document.body)}
    </div>
  );
}
'''
src = src[:s] + body[:ret] + NEW_RETURN + src[e:]
print("  Hunter screen restructured")

# A5. ProgressModal (Volume trend + Shadow race behind a segmented control)
replace_once("function PRHistoryModal({ workouts, prs, onClose }) {",
r'''// Progress sheet — the volume trend and the shadow race used to sit as two
// full cards on the Hunter screen; now one row opens them behind a switch.
function ProgressModal({ workouts, onClose }) {
  const [tab, setTab] = useState("trend");
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150,
      background: "rgba(0,0,0,.72)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: BG2, borderRadius: "20px 20px 0 0",
        width: "100%", maxWidth: 480, padding: "18px 16px 40px", maxHeight: "85dvh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: TEXT }}>Progress</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>
        <Segmented value={tab} onChange={setTab} style={{ marginBottom: 14 }}
          options={[{ id: "trend", label: "Volume trend" }, { id: "race", label: "Shadow race" }]} />
        {tab === "trend" ? <VolumeChart workouts={workouts} /> : <ShadowRace workouts={workouts} />}
      </div>
    </div>, document.body);
}

function PRHistoryModal({ workouts, prs, onClose }) {''', "ProgressModal insert")

# A6. Condition report gains Recovery + Focus (they left the Hunter screen)
note = src.index("Condition decays only after a grace window")
div_open = src.rfind("<div", 0, note)
line_start = src.rfind("\n", 0, div_open) + 1
src = src[:line_start] + r'''            <div style={{ marginTop: 18 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: TRACK_CAPS, textTransform: "uppercase", marginBottom: 8 }}>Recovery</div>
              <RecoveryGrid workouts={profile?.workouts || []} />
            </div>
            {(() => {
              const imbalances = detectImbalances(profile?.stats || {}, profile?.subStats || {});
              if (!imbalances.length) return null;
              return (
                <div style={{ marginTop: 6, marginBottom: 12 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: 600, color: MUTED, letterSpacing: TRACK_CAPS, textTransform: "uppercase", marginBottom: 8 }}>Focus</div>
                  <div style={{ background: BG3, borderRadius: 12, padding: "12px 14px" }}>
                    {imbalances.map((imb, i) => {
                      const suggestions = suggestExercisesFor(imb.target, 3);
                      return (
                        <div key={i} style={{ marginBottom: i === imbalances.length - 1 ? 0 : 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: 700, color: TEXT }}>{imb.pair[0]} ▸ {imb.pair[1]}</span>
                            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED }}>{imb.ratio === Infinity ? "∞" : `${imb.ratio.toFixed(1)}×`}</span>
                          </div>
                          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, color: MUTED, lineHeight: 1.4, marginBottom: suggestions.length ? 6 : 0 }}>{imb.message}</div>
                          {suggestions.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {suggestions.map(ex => <Button key={ex.name} variant="outline" size="sm" style={{ height: 30, fontSize: 12, padding: "0 10px" }}>{ex.name}</Button>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
''' + src[line_start:]
print("  Condition report: recovery + focus sections added")

# ═══════════════════════════ B. CALM PASS (whole app) ═══════════════════════════

# B1. one display font; retire Orbitron
n_orb = len(re.findall(r'fontFamily:\s*"\'Orbitron\',\s*sans-serif"', src))
src = re.sub(r'fontFamily:\s*"\'Orbitron\',\s*sans-serif"', "fontFamily: FONT_DISPLAY", src)
src = re.sub(r"font-family:\s*'Orbitron',\s*sans-serif", "font-family: 'Rajdhani', sans-serif", src)
src = src.replace("&family=Orbitron:wght@400;700;900", "")
print(f"  Orbitron → FONT_DISPLAY: {n_orb}")

# B2. letter-spacing: one token
n_ls = len(re.findall(r"letterSpacing:\s*\d+(?:\.\d+)?(?=\s*[,}])", src))
src = re.sub(r"letterSpacing:\s*\d+(?:\.\d+)?(?=\s*[,}])", "letterSpacing: TRACK", src)
print(f"  letterSpacing → TRACK: {n_ls}")

# B3. strip inline glows and angular clip-paths from style objects
def strip_prop(name, pred):
    global src
    removed = 0; pos = 0
    pat = re.compile(r"(?<![\w$])" + name + r"\s*:")
    while True:
        m = pat.search(src, pos)
        if not m: break
        # only inside a JS object literal: previous significant char is { or ,
        k = m.start() - 1
        while k >= 0 and src[k] in " \t\n": k -= 1
        if k < 0 or src[k] not in "{,": pos = m.end(); continue
        j = m.end()
        while src[j] in " \t": j += 1
        v0 = j
        while True:                       # value ends at top-level , or }
            c = src[j]
            if c in "\"'`": j = skip_str(src, j); continue
            if c in "([{": j = match(src, j) + 1; continue
            if c in ",}": break
            j += 1
        value = src[v0:j]
        if not pred(value): pos = j; continue
        # remove `name: value` and one adjacent comma
        a = m.start(); b = j
        if src[b] == ",":
            b += 1
            while b < len(src) and src[b] in " \t": b += 1
            if src[b] == "\n" and src[a-1:a] == "\n": pass
        else:
            # last property: eat the preceding comma instead
            k2 = a - 1
            while src[k2] in " \t\n": k2 -= 1
            if src[k2] == ",": a = k2
        src = src[:a] + src[b:]
        removed += 1; pos = a
    return removed

print(f"  textShadow removed: {strip_prop('textShadow', lambda v: True)}")
print(f"  glow boxShadow removed: {strip_prop('boxShadow', lambda v: '0 0 ' in v)}")
print(f"  clipPath removed: {strip_prop('clipPath', lambda v: True)}")

# B4. delete neon keyframes and ambient classes from the global CSS
for kf in ["sysGlow", "borderPulse", "breatheGlow", "emblemPulse", "hexPulse", "cornerBlink", "shimmerSweep",
           "auraSpin", "ringSpinRev", "scanLine", "runeFloat", "sysBoot", "auroraDrift", "relicGlowPulse"]:
    src, n = re.subn(r"^\s*@keyframes " + kf + r" \{[^\n]*\}\n", "", src, flags=re.M)
    if not n: print(f"  (keyframe {kf} not found — ok if already gone)")
src, n = re.subn(r"^\s*@keyframes glitchIn \{[\s\S]*?\n  \}\n", "", src, flags=re.M); must(n == 1, "glitchIn keyframes")
for rule in [r"\.glitch-in \{[^\n]*\}\n", r"\.breathe\s+\{[^\n]*\}\n", r"\.card-in\.breathe \{[^\n]*\}\n",
             r"\.shimmer-bar::after \{[\s\S]*?\n  \}\n", r"\.emblem-ring\s+\{[^\n]*\}\n", r"\.emblem-ring2 \{[^\n]*\}\n",
             r"\.aurora-bg \{[\s\S]*?\}\n"]:
    src, n = re.subn(r"^\s*" + rule, "", src, flags=re.M)
    if not n: print(f"  (css rule {rule[:20]}… not found)")
src = re.sub(r"@keyframes cardIn \{[^\n]*\}", "@keyframes cardIn { from{transform:translateY(10px);opacity:0} to{transform:none;opacity:1} }", src)

# B5. legacy button classes become pills (12 call sites keep working)
src, n = re.subn(r"  /\* ── BUTTONS ── \*/\n  \.btn-primary \{[\s\S]*?\.btn-gold:hover \{[\s\S]*?\n  \}\n", r"""  /* ── BUTTONS (legacy classes, now pill-shaped like ui/Button) ── */
  .btn-primary, .btn-gold {
    border-radius: 999px; border: 1px solid transparent; cursor: pointer;
    font-family: 'Rajdhani', sans-serif; font-weight: 600; letter-spacing: .2px;
    transition: background .18s ease, color .18s ease;
  }
  .btn-primary { background: #f3efe9; color: #111417; }
  .btn-primary:hover { background: #ffffff; }
  .btn-gold { background: ${GOLD}22; color: ${GOLD2}; border-color: ${GOLD}55; }
  .btn-gold:hover { background: ${GOLD}33; }
""", src); must(n == 1, "button css block")

# B6. remove ambient effects from the tree
replace_once('      <div className="aurora-bg" />\n', "", "aurora element")
replace_once('      <Suspense fallback={null}><SystemParticles accent={settings?.accentColor || "#00d4ff"} /></Suspense>\n', "", "particles element")
replace_once('            <Suspense fallback={null}><CompanionOrb color={rank.color} size={36} /></Suspense>\n', "", "companion orb element")
src, n = re.subn(r"\n// Visual FX use three\.js[^\n]*\n(?:// [^\n]*\n)*(?:const (?:SystemParticles|SoulCore|CompanionOrb)\s*=\s*lazy\([^\n]*\n)+", "\n", src)
must(n == 1, "lazy fx declarations")
s, e = func_span("TiltCard")
src = src[:s] + "// Tilt-to-pointer card effect retired in the calm theme; kept as a plain wrapper so call sites are untouched.\nfunction TiltCard({ children, style }) { return <div style={style}>{children}</div>; }\n" + src[e:]

# B7. section labels: drop the "[ … ]" brackets and "// " prefixes
n1 = len(re.findall(r">\[ ([A-Z0-9][A-Z0-9 &'/\-·]+?) \]<", src)); src = re.sub(r">\[ ([A-Z0-9][A-Z0-9 &'/\-·]+?) \]<", r">\1<", src)
n2 = len(re.findall(r"\{`// ", src)); src = src.replace("{`// ", "{`")
n3 = len(re.findall(r">// ", src)); src = src.replace(">// ", ">")
print(f"  labels cleaned: brackets {n1}, template // {n2}, literal // {n3}")

# B8. version
src = re.sub(r'const APP_VERSION = "[\d.]+";', 'const APP_VERSION = "2.0.0";', src)

# ═══════════════════════════ C. VERIFY ═══════════════════════════
left = {
  "Orbitron": src.count("Orbitron"),
  "numeric letterSpacing": len(re.findall(r"letterSpacing:\s*\d", src)),
  "textShadow": src.count("textShadow:"),
  "glow boxShadow": len(re.findall(r"boxShadow:\s*`0 0 ", src)),
  "clipPath": src.count("clipPath:"),
  "SoulCore/Particles/Orb refs": len(re.findall(r"\b(SystemParticles|SoulCore|CompanionOrb)\b", src)),
}
print("  remaining:", left)
must(all(v == 0 for v in left.values()), "calm pass left residue")
open(PATH, "w").write(src)
open("public/version.json", "w").write('{"version":"2.0.0"}\n')
print(f"\nmain file: {orig_len:,} -> {len(src):,} bytes, {src.count(chr(10))+1:,} lines")
