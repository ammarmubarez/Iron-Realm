import re, sys
P = "src/iron-realm.jsx"; src = open(P).read()
def rep(old, new, label):
    global src
    c = src.count(old)
    if c != 1: print(f"ANCHOR FAILED [{label}]: {c} matches"); sys.exit(1)
    src = src.replace(old, new)

# ── A. CharacterScreen: remove the account state, handlers and UI FIRST (anchors are unique now) ──
rep("""  const profiles = Object.values(store.profiles);

  const [editMode, setEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editName, setEditName] = useState(st.name);
  const [editAge, setEditAge] = useState(String(st.age || ""));
  const [editWeight, setEditWeight] = useState(String(st.weightLbs || 170));
  const [editHeightFt, setEditHeightFt] = useState(String(Math.floor((st.heightIn || 70) / 12)));
  const [editHeightIn, setEditHeightIn] = useState(String((st.heightIn || 70) % 12));
  const [editGender, setEditGender] = useState(st.gender || "male");

  const handleSaveEdit = () => {
    const totalIn = (parseInt(editHeightFt) || 5) * 12 + (parseInt(editHeightIn) || 10);
    onUpdateProfile(store.activeId, {
      name: editName.trim() || st.name,
      age: parseInt(editAge) || null,
      weightLbs: getWtUnit()==="kg" ? (parseFloat(editWeight)||st.weightLbs)/0.453592 : (parseFloat(editWeight)||st.weightLbs),
      heightIn: totalIn,
      gender: editGender,
    });
    setEditMode(false);
    toast("Profile updated", GREEN);
  };

""", "\n", "char: state+handler")
rep("""  const [progressOpen, setProgressOpen]         = useState(false);
  const [switcherOpen, setSwitcherOpen]         = useState(false);""",
    """  const [progressOpen, setProgressOpen]         = useState(false);""", "char: switcher state")
rep("""  const openEdit = () => {
    setEditName(st.name); setEditAge(String(st.age || "")); setEditWeight(String(st.weightLbs || 170));
    setEditHeightFt(String(Math.floor((st.heightIn || 70) / 12))); setEditHeightIn(String((st.heightIn || 70) % 12));
    setEditGender(st.gender || "male"); setEditMode(v => !v);
  };
""", "", "char: openEdit")
rep("""          <button type="button" onClick={openEdit} aria-label="Edit profile" style={{
            width: 40, height: 40, borderRadius: "50%", border: "none", cursor: "pointer",
            background: editMode ? `${GOLD}22` : BG2, color: editMode ? GOLD : MUTED, fontSize: 16 }}>✎</button>
""", "", "char: pencil")
for label, pat in [("char: edit/delete blocks", r"        \{/\* ── EDIT FORM \(from the header pencil or Account → Edit profile\) ── \*/\}\n[\s\S]*?(?=        \{/\* ── BODY MATRIX ── \*/\})"),
                   ("char: account block",      r"        \{/\* ── ACCOUNT ── \*/\}\n[\s\S]*?(?=        \{/\* ── MUSCLE LEVELS ── \*/\})")]:
    m = re.search(pat, src)
    if not m: print(f"ANCHOR FAILED [{label}]"); sys.exit(1)
    src = src[:m.start()] + src[m.end():]

# ── B. the lifted panel, inserted before CharacterScreen ──
PANEL = open("/tmp/claude-0/-home-user-Iron-Realm/c91056c3-6845-5590-9397-03123f6dd0b7/scratchpad/panel.jsx.txt").read()
rep("function CharacterScreen({ store, onSwitchProfile, onCreateProfile, onDeleteProfile, onUpdateProfile, onSetPatronLift, toast }) {",
    PANEL + "function CharacterScreen({ store, onSwitchProfile, onCreateProfile, onDeleteProfile, onUpdateProfile, onSetPatronLift, toast }) {", "panel insert")

# ── C. MenuScreen props + Settings mount ──
rep("""                     onAddMindTask, onRemoveMindTask, onToggleMindTask, pendingCount = 0 }) {""",
    """                     onAddMindTask, onRemoveMindTask, onToggleMindTask, pendingCount = 0,
                     store, onSwitchProfile, onCreateProfile, onDeleteProfile, onUpdateProfile }) {""", "menu signature")
rep("""onToggleMindTask={handleToggleMindTask} pendingCount={pendingCount} />}""",
    """onToggleMindTask={handleToggleMindTask} pendingCount={pendingCount} store={store} onSwitchProfile={handleSwitchProfile} onCreateProfile={handleCreateProfile} onDeleteProfile={handleDeleteProfile} onUpdateProfile={handleUpdateProfile} />}""", "menu render")
rep("""                letterSpacing: TRACK, marginBottom: 10 }}>{"ACCOUNT"}</div>
              {!account.supabaseConfigured ? (""",
    """                letterSpacing: TRACK, marginBottom: 10 }}>{"ACCOUNT"}</div>
              {store && (
                <HunterAccountPanel store={store} onSwitchProfile={onSwitchProfile} onCreateProfile={onCreateProfile}
                  onDeleteProfile={onDeleteProfile} onUpdateProfile={onUpdateProfile} toast={toast} />
              )}
              {!account.supabaseConfigured ? (""", "settings mount")

src = src.replace('const APP_VERSION = "2.0.0";', 'const APP_VERSION = "2.0.1";')
s = src.index("function CharacterScreen("); e = src.index("\nfunction ", s + 1)
dangling = [n for n in ["editMode","deleteConfirm","switcherOpen","openEdit","handleSaveEdit","editName"] if re.search(r"\b"+n+r"\b", src[s:e])]
if dangling: print("DANGLING in CharacterScreen:", dangling); sys.exit(1)
open(P, "w").write(src); open("public/version.json", "w").write('{"version":"2.0.1"}\n')

L = "src/ui/ListGroup.jsx"; ls = open(L).read()
ls = ls.replace('export default function ListGroup({ title, children, style }) {', 'export default function ListGroup({ title, children, style, cardStyle }) {')
ls = ls.replace('<div style={{ background: BG2, borderRadius: 14, overflow: "hidden" }}>', '<div style={{ background: BG2, borderRadius: 14, overflow: "hidden", ...cardStyle }}>')
open(L, "w").write(ls)

def patch(path, pairs):
    t = open(path).read()
    for old, new in pairs:
        if t.count(old) != 1: print(f"TEST ANCHOR FAILED [{path}]: {old[:60]!r}"); sys.exit(1)
        t = t.replace(old, new)
    open(path, "w").write(t)
patch("qa/qa-suite.mjs", [
 ("""  await page.getByText('Edit profile').first().click(); await page.waitForTimeout(500);
  ok(await has(/Save changes/), 'edit form did not open');
  const age = page.locator('input[type="number"]').first();
  await age.fill('26');
  await page.getByText('Save changes').first().click();
  await page.waitForTimeout(500);
  ok((await profile()).age === 26, 'age not saved');""",
  """  // account management moved to Settings → Account (v2.0.1)
  await nav('Home');
  await page.locator('button:has(svg circle)').first().click(); await page.waitForTimeout(700);
  await page.getByText('Edit profile').first().click(); await page.waitForTimeout(500);
  ok(await has(/Save changes/), 'edit form did not open in settings');
  await page.getByPlaceholder('25').first().fill('26');
  await page.getByText('Save changes').first().click();
  await page.waitForTimeout(500);
  ok((await profile()).age === 26, 'age not saved');
  await page.locator('button').filter({ hasText: '×' }).last().click(); await page.waitForTimeout(400);
  await nav('Hunter');"""),
 ("await t('char: account group present', async () => ok(await has(/Switch hunter/) && await has(/New hunter/)));",
  "await t('char: account rows no longer on the Hunter screen', async () => ok(!(await has(/Switch hunter/)) && !(await has(/New hunter/))));"),
])
patch("qa/qa-suite2.mjs", [
 ("await t('[hstrip] hunter switcher reachable from Account group', async () => ok(await has(/Switch hunter/)));",
  """await t('[settings] hunter account rows live in Settings → Account', async () => {
  await nav('Home');
  await page.locator('button:has(svg circle)').first().click(); await page.waitForTimeout(700);
  ok(await has(/Switch hunter/) && await has(/New hunter/) && await has(/Edit profile/));
  await closeTopModal();
  await nav('Hunter');
});"""),
])
print("patched: src, ListGroup, tests")
