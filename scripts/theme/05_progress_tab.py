import re, sys
P = "src/iron-realm.jsx"; src = open(P).read()
def rep(old, new, label, count=1):
    global src
    c = src.count(old)
    if c != count: print(f"ANCHOR FAILED [{label}]: {c} matches"); sys.exit(1)
    src = src.replace(old, new)
def cut(pattern, label, flags=0):
    global src
    m = re.search(pattern, src, flags)
    if not m: print(f"ANCHOR FAILED [{label}]"); sys.exit(1)
    src = src[:m.start()] + src[m.end():]

# ── 1. ProgressScreen (new nav destination) — replaces the Progress sheet ──
cut(r"// Progress sheet — the volume trend and the shadow race used to sit as two\n[\s\S]*?\nfunction ProgressModal\([\s\S]*?\n\}\n\n", "ProgressModal removal")
PROGRESS = r'''// Progress screen — its own nav tab. The volume trend and shadow race sit
// inline; records and condition open as sheets.
function ProgressScreen({ st }) {
  const [prHistoryOpen, setPrHistoryOpen] = useState(false);
  const [heatmapOpen, setHeatmapOpen]     = useState(false);
  const [conditionOpen, setConditionOpen] = useState(false);
  const condEntries = Object.entries(st.condition || {});
  const decaying = condEntries.filter(([, v]) => v < 0.995).length;
  const prCount = Object.keys(st.prs || {}).length;
  return (
    <div style={{ height: "100dvh", overflowY: "auto", background: BG, padding: "0 0 calc(120px + env(safe-area-inset-bottom, 0px))" }}>
      <div style={{ padding: "22px 18px 0" }}>
        <div className="card-in" style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: TEXT, marginBottom: 16 }}>Progress</div>
        <div className="card-in card-in-1"><VolumeChart workouts={st.workouts || []} /></div>
        <div className="card-in card-in-2"><ShadowRace workouts={st.workouts || []} /></div>
        <ListGroup title="Records & condition">
          <ListRow icon="★" label="PR history" value={`${prCount} tracked`} onClick={() => setPrHistoryOpen(true)} />
          <ListRow icon="▦" label="Training heatmap" value="13 weeks" onClick={() => setHeatmapOpen(true)} />
          <ListRow icon="◑" label="Condition report" sub="Detraining, recovery and what to train"
            value={decaying ? `${decaying} decaying` : "All fresh"} tone={decaying ? RED : GREEN}
            onClick={() => setConditionOpen(true)} last />
        </ListGroup>
      </div>
      {conditionOpen && <ConditionReportModal profile={st} onClose={() => setConditionOpen(false)} />}
      {prHistoryOpen && <PRHistoryModal workouts={st.workouts} prs={st.prs} onClose={() => setPrHistoryOpen(false)} />}
      {heatmapOpen && <HeatmapModal workouts={st.workouts} onClose={() => setHeatmapOpen(false)} />}
    </div>
  );
}

'''
rep("function CharacterScreen({ store, onSwitchProfile, onCreateProfile, onDeleteProfile, onUpdateProfile, onSetPatronLift, toast }) {",
    PROGRESS + "function CharacterScreen({ store, onSwitchProfile, onCreateProfile, onDeleteProfile, onUpdateProfile, onSetPatronLift, toast,\n                          settings, onUpdateSettings, onLogMind, onAddMindTask, onRemoveMindTask, onToggleMindTask }) {", "progress screen + char signature")

# ── 2. CharacterScreen: drop the progress state/rows/sheets; add levels sheet + mind & spirit ──
rep("""  const [prHistoryOpen, setPrHistoryOpen]     = useState(false);
  const [heatmapOpen, setHeatmapOpen]         = useState(false);
  const [patronPickerOpen, setPatronPickerOpen] = useState(false);
  const [relicVaultOpen, setRelicVaultOpen]     = useState(false);
  const [conditionOpen, setConditionOpen]       = useState(false);
  const [progressOpen, setProgressOpen]         = useState(false);""",
    """  const [patronPickerOpen, setPatronPickerOpen] = useState(false);
  const [relicVaultOpen, setRelicVaultOpen]     = useState(false);
  const [levelsOpen, setLevelsOpen]             = useState(false);""", "char state")
cut(r"        \{/\* ── PROGRESS ── \*/\}\n[\s\S]*?(?=        \{/\* ── IDENTITY ── \*/\})", "char progress group")
rep("""      {progressOpen && <ProgressModal workouts={st.workouts || []} onClose={() => setProgressOpen(false)} />}
      {conditionOpen && <ConditionReportModal profile={st} onClose={() => setConditionOpen(false)} />}
      {prHistoryOpen && <PRHistoryModal workouts={st.workouts} prs={st.prs} onClose={() => setPrHistoryOpen(false)} />}
      {heatmapOpen && <HeatmapModal workouts={st.workouts} onClose={() => setHeatmapOpen(false)} />}
""", """      {levelsOpen && createPortal(
        <div onClick={() => setLevelsOpen(false)} style={{ position: "fixed", inset: 0, overflowY: "auto", overscrollBehavior: "contain", zIndex: 1150,
          background: "rgba(0,0,0,.72)", backdropFilter: "blur(12px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} className="slide-up" style={{ background: BG2, borderRadius: "20px 20px 0 0",
            width: "100%", maxWidth: 480, padding: "18px 16px 40px", maxHeight: "85dvh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: TEXT }}>Muscle levels</div>
              <button onClick={() => setLevelsOpen(false)} style={{ background: "none", border: "none", color: MUTED, fontSize: 22, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, color: MUTED, marginBottom: 12 }}>
              Level {st.overallLevel} · {rank.label} · {current.toLocaleString()} / {needed.toLocaleString()} XP to next
            </div>
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
          </div>
        </div>, document.body)}
""", "char sheets")
cut(r"        \{/\* ── MUSCLE LEVELS ── \*/\}\n[\s\S]*?</Reveal>\n", "char muscle levels block")
rep("""          <StatTile label="Level" value={st.overallLevel} color={rank.color}
            sub={`${current.toLocaleString()} / ${needed.toLocaleString()} XP`} progress={needed ? current / needed : 0} />
          <StatTile label="Fresh muscles" value={condTotal ? `${freshCount}/${condTotal}` : "—"} color={condColor}
            sub={condTotal === 0 ? "Log a workout to start tracking"
                : decaying === 0 ? "Everything is in condition"
                : `${decaying} detraining · ${Math.round(avgCond * 100)}% avg condition`}
            progress={condTotal ? avgCond : 0} />""",
    """          <StatTile label="Level" value={st.overallLevel} color={rank.color} onClick={() => setLevelsOpen(true)}
            sub={`${current.toLocaleString()} / ${needed.toLocaleString()} XP · tap for muscle levels`} progress={needed ? current / needed : 0} />
          <StatTile label="Condition" value={condTotal ? `${freshCount}/${condTotal}` : "—"} color={condColor}
            sub={condTotal === 0 ? "Log a workout to start tracking"
                : decaying === 0 ? "All muscle groups at full strength"
                : `${decaying} detraining · ${Math.round(avgCond * 100)}% avg condition`}
            progress={condTotal ? avgCond : 0} />""", "char tiles")
rep("""        {/* ── IDENTITY ── */}""",
    """        {/* ── MIND & SPIRIT (moved here from Home in v2.1) ── */}
        <div className="card-in card-in-3" style={{ marginBottom: 18 }}>
          <MindSpiritCard profile={st} settings={settings} onUpdateSettings={onUpdateSettings}
            onLogMind={onLogMind} onAddTask={onAddMindTask}
            onRemoveTask={onRemoveMindTask} onToggleTask={onToggleMindTask} />
        </div>

        {/* ── IDENTITY ── */}""", "char mind&spirit")

# ── 3. Home: Mind & Spirit leaves ──
rep("""        <MindSpiritCard profile={st} settings={settings} onUpdateSettings={onUpdateSettings}
          onLogMind={onLogMind} onAddTask={onAddMindTask}
          onRemoveTask={onRemoveMindTask} onToggleTask={onToggleMindTask} />
""", "", "home mind&spirit")

# ── 4. App: render sites ──
rep("""      {screen === "character" && <CharacterScreen store={store} onSwitchProfile={handleSwitchProfile} onCreateProfile={handleCreateProfile} onDeleteProfile={handleDeleteProfile} onUpdateProfile={handleUpdateProfile} onSetPatronLift={handleSetPatronLift} toast={toast} />}""",
    """      {screen === "character" && <CharacterScreen store={store} onSwitchProfile={handleSwitchProfile} onCreateProfile={handleCreateProfile} onDeleteProfile={handleDeleteProfile} onUpdateProfile={handleUpdateProfile} onSetPatronLift={handleSetPatronLift} toast={toast}
        settings={settings} onUpdateSettings={handleUpdateSettings} onLogMind={handleLogMind} onAddMindTask={handleAddMindTask} onRemoveMindTask={handleRemoveMindTask} onToggleMindTask={handleToggleMindTask} />}
      {screen === "progress"  && <ProgressScreen st={st} />}""", "render sites")

# ── 5. NavBar: tab + icon ──
m = re.search(r'    \{ id: "character",[^\n]*\n', src)
if not m: print("ANCHOR FAILED [nav character tab]"); sys.exit(1)
src = src[:m.end()] + '    { id: "progress",  label: themeLabel(settings, "progress", "Progress") },\n' + src[m.end():]
rep("""    program: (c) => (""", """    progress: (c) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <polyline points="2.5,15 7,10 10.5,13 17.5,5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="13,5 17.5,5 17.5,9.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    program: (c) => (""", "nav icon")

src = src.replace('const APP_VERSION = "2.0.1";', 'const APP_VERSION = "2.1.0";')
# sanity
s = src.index("function CharacterScreen("); e = src.index("\nfunction ", s + 1)
dangling = [n for n in ["progressOpen","prHistoryOpen","heatmapOpen","conditionOpen","ProgressModal"] if re.search(r"\b"+n+r"\b", src[s:e])]
if dangling: print("DANGLING in CharacterScreen:", dangling); sys.exit(1)
if "ProgressModal" in src: print("ProgressModal still referenced"); sys.exit(1)
open(P, "w").write(src); open("public/version.json", "w").write('{"version":"2.1.0"}\n')

# ── 6. themed labels for the new tab ──
C = "src/data/cosmetics.js"; cs = open(C).read()
names = {"SOVEREIGN": "CONQUESTS", "DESTROYER": "TEMPERING", "HUNTER": "PROGRESS", "ENTITY": "TELEMETRY"}
def add(m):
    return m.group(0) + f'      progress:    "{names.get(m.group(1), "PROGRESS")}",\n'
cs, n = re.subn(r'      hunter:\s+"([^"]+)",\n', add, cs)
print(f"  themed progress labels added: {n}")
open(C, "w").write(cs)

# ── 7. StatTile: clickable ──
T = "src/ui/StatTile.jsx"; ts = open(T).read()
ts = ts.replace("export default function StatTile({ label, value, sub, progress, color = TEXT, style }) {",
                "export default function StatTile({ label, value, sub, progress, color = TEXT, style, onClick }) {")
ts = ts.replace('    <div style={{ background: BG2, borderRadius: 16, padding: "16px 16px 14px", minWidth: 0, ...style }}>',
                '    <div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}\n      style={{ background: BG2, borderRadius: 16, padding: "16px 16px 14px", minWidth: 0, cursor: onClick ? "pointer" : "default", ...style }}>')
ts = ts.replace("""        {label}
      </div>""", """        {label}{onClick && <span aria-hidden="true" style={{ marginLeft: 6, opacity: .6 }}>›</span>}
      </div>""")
open(T, "w").write(ts)

# ── 8. tests ──
def patch(path, pairs):
    t = open(path).read()
    for old, new in pairs:
        if t.count(old) != 1: print(f"TEST ANCHOR FAILED [{path}]: {old[:70]!r} ({t.count(old)})"); sys.exit(1)
        t = t.replace(old, new)
    open(path, "w").write(t)
patch("qa/qa-suite.mjs", [
 ("await t('home: mind & spirit card present', async () => ok(await has(/MIND & SPIRIT/)));",
  "await nav('Hunter');\nawait t('char: mind & spirit card present', async () => ok(await has(/MIND & SPIRIT/)));"),
 ("await t('home: mind badges show levels',", "await t('char: mind badges show levels',"),
 ("await t('home: daily tasks checklist rendered',", "await t('char: daily tasks checklist rendered',"),
 ("await t('home: check task grants XP',", "await t('char: check task grants XP',"),
 ("await t('home: uncheck task removes XP',", "await t('char: uncheck task removes XP',"),
 ("await t('home: daily rituals card', async () => ok(await has(/DAILY RITUALS/)));",
  "await nav('Home');\nawait t('home: daily rituals card', async () => ok(await has(/DAILY RITUALS/)));"),
 ("await t('modal: opens via + LOG', async () => {\n", "await t('modal: opens via + LOG', async () => {\n  await nav('Hunter');\n"),
 ("await t('char: navigates', async () => { await nav('Hunter'); ok(await has(/FRESH MUSCLES/)); });",
  "await t('char: navigates', async () => { await nav('Hunter'); ok(await has(/BODY MATRIX/)); });"),
 ("await t('char: hero tiles render (level + condition)', async () => ok(await has(/LEVEL/) && await has(/FRESH MUSCLES/)));",
  "await t('char: hero tiles render (level + condition)', async () => ok(await has(/LEVEL/) && await has(/CONDITION/)));"),
 ("await t('char: PR history opens with data', async () => {\n", "await t('progress: PR history opens with data', async () => {\n  await nav('Progress');\n"),
 ("await t('char: progress group rows', async () => ok(await has(/Volume & pace/) && await has(/PR history/) && await has(/Training heatmap/)));",
  "await t('progress: chart + rows on the Progress tab', async () => ok(await has(/VOLUME TREND/i) && await has(/PR history/) && await has(/Training heatmap/)));"),
 ("await t('char: identity group rows', async () => ok(await has(/Signature lift/) && await has(/Relic vault/)));",
  "await t('char: identity group rows', async () => { await nav('Hunter'); ok(await has(/Signature lift/) && await has(/Relic vault/)); });"),
 ("""await t('char: progress sheet — volume trend', async () => {
  await page.getByText('Volume & pace').first().click(); await page.waitForTimeout(700);
  ok(await has(/VOLUME TREND/i), 'volume chart not in progress sheet');
});""", """await t('progress: volume trend inline', async () => {
  await nav('Progress');
  ok(await has(/VOLUME TREND/i), 'volume chart not on Progress tab');
});"""),
 ("""await t('char: progress sheet — shadow race tab', async () => {
  await page.getByRole('tab', { name: 'Shadow race' }).click(); await page.waitForTimeout(600);
  ok(await has(/SHADOW RACE/) && await has(/AHEAD|BEHIND/));
  await page.locator('button').filter({ hasText: '×' }).last().click(); await page.waitForTimeout(400);
});""", """await t('progress: shadow race inline with verdict', async () => ok(await has(/SHADOW RACE/) && await has(/AHEAD|BEHIND/)));"""),
 ("await t('char: condition sheet — recovery grid inside', async () => {", "await t('progress: condition sheet — recovery grid inside', async () => {"),
 ("await t('char: muscle levels tree', async () => ok(await has(/MUSCLE LEVELS/)));",
  """await t('char: level tile opens the muscle levels sheet', async () => {
  await nav('Hunter');
  await page.getByText('LEVEL', { exact: true }).first().click(); await page.waitForTimeout(700);
  ok(await has(/Muscle levels/), 'levels sheet did not open');
});"""),
 ("""  await page.getByText('UPPER BODY').first().click();
  await page.waitForTimeout(500);
  ok(await has(/Chest|CHEST/));
});""", """  await page.getByText('UPPER BODY').first().click();
  await page.waitForTimeout(500);
  ok(await has(/Chest|CHEST/));
  await page.locator('button').filter({ hasText: '×' }).last().click(); await page.waitForTimeout(400);
});"""),
])
patch("qa/qa-suite2.mjs", [
 ("  { tab: 'Hunter', marker: /FRESH MUSCLES/ },", "  { tab: 'Hunter', marker: /BODY MATRIX/ },\n  { tab: 'Progress', marker: /VOLUME TREND/i },"),
 ("await nav('Home');\nawait modalChecks('mind-log', async () => {", "await nav('Hunter');\nawait modalChecks('mind-log', async () => {"),
 ("await modalChecks('settings', async () => {", "await nav('Home');\nawait modalChecks('settings', async () => {"),
 ("await nav('Hunter');\nawait modalChecks('pr-history', async () => {", "await nav('Progress');\nawait modalChecks('pr-history', async () => {"),
 ("await modalChecks('relic-vault', async () => {", "await nav('Hunter');\nawait modalChecks('relic-vault', async () => {"),
 ("""await t('[scroll] stat tree expansion content reachable', async () => {
  await nav('Hunter');
  await wheelToBottom();
  await page.getByText('UPPER BODY').first().click();
  await page.waitForTimeout(500);
  const r = await wheelToBottom();
  ok(r.reached, 'expanded tree bottom unreachable');
});""", """await t('[scroll] levels sheet: tree expands and stays reachable', async () => {
  await nav('Hunter');
  await page.getByText('LEVEL', { exact: true }).first().click(); await page.waitForTimeout(700);
  await page.getByText('UPPER BODY').first().click(); await page.waitForTimeout(500);
  const r = await modalInnerReach();
  ok(r.fits || r.reached, 'expanded tree bottom unreachable inside the sheet');
  await closeTopModal();
});"""),
 ("""await t('[leak-std] mind-log backdrop leak-free after deep scroll', async () => {
  await wheelToBottom(); await page.waitForTimeout(200);""", """await t('[leak-std] mind-log backdrop leak-free after deep scroll', async () => {
  await nav('Hunter');
  await wheelToBottom(); await page.waitForTimeout(200);"""),
])
print("patched: src, cosmetics, StatTile, tests")
