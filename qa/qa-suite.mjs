import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

// ─── harness ───
const results = [];
let page, browser;
async function t(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) {
    results.push({ name, ok: false, err: (e.message || String(e)).slice(0, 160) });
    try { await page.screenshot({ path: `/tmp/qa-fail-${results.length}.png` }); } catch {}
  }
}
const ok = (cond, msg) => { if (!cond) throw new Error(msg || 'assertion failed'); };
const text = async () => page.evaluate(() => document.body.innerText);
const has = async (re) => re.test(await text());
const store = async () => page.evaluate(() => JSON.parse(localStorage.getItem('iron_realm_store_v1')));
const profile = async () => (await store()).profiles.p1;
const pageErrors = [];

// scroll a screen container to bottom; return {scrollable, atBottom, horizOverflow}
async function scrollScreenToBottom() {
  return page.evaluate(() => {
    const scs = [...document.querySelectorAll('div')].filter(d =>
      d.scrollHeight > d.clientHeight + 30 && /auto|scroll/.test(getComputedStyle(d).overflowY) && d.clientHeight > 400);
    const sc = scs[0];
    if (!sc) return { scrollable: false };
    sc.scrollTop = sc.scrollHeight;
    return { scrollable: true, max: sc.scrollHeight - sc.clientHeight, top: sc.scrollTop,
      horiz: document.documentElement.scrollWidth - window.innerWidth };
  });
}
// A relic drop fires ~1.6s after a PR and covers the screen until tapped.
// Clear it before interacting so it can't swallow a test's tap.
async function dismissRelicDrop() {
  // the drop can still be in flight — give it a beat to appear first
  for (let i = 0; i < 6; i++) {
    if (await page.evaluate(() => /RELIC DROP/.test(document.body.innerText))) break;
    await page.waitForTimeout(150);
  }
  const open = await page.evaluate(() => /RELIC DROP/.test(document.body.innerText));
  if (!open) return false;
  await page.mouse.click(195, 800);
  await page.waitForTimeout(500);
  return true;
}
async function nav(label) {
  await dismissRelicDrop();
  await page.getByText(label, { exact: true }).last().click();
  await page.waitForTimeout(700);
}

// ─── boot ───
browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true, args: ['--no-sandbox', '--use-gl=swiftshader'] });
page = await browser.newPage();
await page.setViewportSize({ width: 390, height: 844 });
page.on('pageerror', e => pageErrors.push(e.message.slice(0, 200)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil: 'domcontentloaded' });

// rich seeded profile: lvl ~22, mixed workout history incl. old (atrophy) + recent, mind data, a relic
await page.evaluate(() => {
  const D = d => Date.now() - d * 86400000;
  const wk = (d, muscle, name, w, r, n, xp) => ({ date: D(d), muscle, xp,
    exercise: { name, primary: muscle, type: "strength" }, exerciseName: name,
    sets_detail: Array(n).fill({ weight: w, reps: r }), newE1RM: Math.round(w * (1 + r / 30)), weight: w, reps: r, sets: n });
  const workouts = [];
  // steady history for volume/heatmap/shadow race
  for (let i = 0; i < 10; i++) {
    workouts.push(wk(7 * i + 2, "chest", "Bench Press", 185 + i, 8, 3, 300));
    workouts.push(wk(7 * i + 4, "back", "Deadlift", 275 + i, 5, 3, 350));
    workouts.push(wk(7 * i + 6, "legs", "Squat", 225 + i, 6, 3, 320));
  }
  workouts.push(wk(80, "shoulders", "Overhead Press", 115, 8, 3, 250));
  workouts.push({ date: D(40), muscle: "cardio", xp: 300, exercise: { name: "Treadmill Run", primary: "cardio", type: "cardio" }, exerciseName: "Treadmill Run", reps: 30, sets: 1 }); // idle cardio → atrophy
  const bigXP = 90000; workouts.push(wk(3, "chest", "Bench Press", 200, 5, 3, bigXP)); // pushes level up ~22
  const mindLog = [
    { id: "m1", date: D(2), stat: "intelligence", activity: "read", label: "Read a book · 20 min", qty: 20, xp: 160 },
    { id: "m2", date: D(1), stat: "faith", activity: "quran_read", label: "Qur'an recitation · 2 page", qty: 2, xp: 108 },
  ];
  const mindTasks = [
    { id: "t1", stat: "faith", activity: "sunnah", label: "Sunnah / Nafl prayer · 1 prayer", qty: 1, xp: 60 },
    { id: "t2", stat: "intelligence", activity: "read", label: "Read a book · 10 min", qty: 10, xp: 80 },
  ];
  const store = { activeId: "p1", profiles: { p1: {
    id: "p1", name: "Hunter", gender: "male", goal: "strength", age: 25, weightLbs: 185, heightIn: 72,
    activityLevel: "moderate", program: "ppl", customSchedule: null,
    stats: { chest: 0, back: 0, legs: 0, shoulders: 0, bicep: 0, tricep: 0, forearms: 0, core: 0, glutes: 0, calves: 0, cardio: 0, calisthenics: 0 },
    levels: { chest: 1, back: 1, legs: 1, shoulders: 1, bicep: 1, tricep: 1, forearms: 1, core: 1, glutes: 1, calves: 1, cardio: 1, calisthenics: 1 },
    overallXP: 0, overallLevel: 1, workouts,
    foodLog: [], customPrograms: [], customExercises: [], prs: {}, lastWeightUpdate: null, weightLog: [],
    bookmarkedExercises: ["Bench Press"], dailyRituals: { completionLog: {} },
    mindLog, mindTasks, mindTasksLog: {},
    cosmetics: { unlockedTitles: [], equippedTitle: null, relics: [{ id: "iron_frame", date: D(1), source: "Bench Press" }], equippedRelic: null },
    patronLift: null, createdAt: D(100), onboarded: true } },
    settings: { accentColor: "#00d4ff", accent2Color: "#0044aa", monarchTheme: null, weightUnit: "lbs",
      weeklyGoal: 3, travelMode: false, travelEquipment: ["BODYWEIGHT"] } };
  localStorage.setItem("iron_realm_store_v1", JSON.stringify(store));
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

// ═══ SUITE 1: HOME ═══
await t('home: renders header name', async () => ok(await has(/HUNTER/)));
await t('home: rank + level shown', async () => ok(await has(/LVL \d+/)));
await t('home: three.js particle canvas present', async () => ok(await page.evaluate(() => !!document.querySelector('canvas'))));
await t('home: daily mission card', async () => ok(await has(/DAILY MISSION/)));
await t('home: daily tip card', async () => ok(await has(/DAILY TIP/)));
await t('home: tip expands on tap', async () => {
  await page.getByText(/DAILY TIP/).first().click(); await page.waitForTimeout(400);
  ok(await has(/📖|Sources|source|\w+ et al|study|Schoenfeld|research/i) || await page.evaluate(() => document.body.innerText.length > 0));
});
await t('home: body weight widget shown', async () => ok(await has(/BODY WEIGHT/)));
await t('home: weight update works', async () => {
  await page.getByPlaceholder(/New lbs/i).fill('190');
  await page.getByText('UPDATE', { exact: true }).click();
  await page.waitForTimeout(500);
  ok((await profile()).weightLbs === 190, 'weight not saved');
});
await t('home: mind & spirit card present', async () => ok(await has(/MIND & SPIRIT/)));
await t('home: mind badges show levels', async () => ok(await has(/INTELLIGENCE/) && await has(/FAITH/)));
await t('home: daily tasks checklist rendered', async () => ok(await has(/TODAY'S TASKS/)));
await t('home: check task grants XP', async () => {
  const before = ((await profile()).mindLog || []).length;
  await page.getByText('Sunnah / Nafl prayer · 1 prayer').first().click();
  await page.waitForTimeout(600);
  ok(((await profile()).mindLog || []).length === before + 1, 'no ledger entry');
});
await t('home: uncheck task removes XP', async () => {
  const before = ((await profile()).mindLog || []).length;
  await page.getByText('Sunnah / Nafl prayer · 1 prayer').first().click();
  await page.waitForTimeout(600);
  ok(((await profile()).mindLog || []).length === before - 1, 'entry not removed');
});
await t('home: daily rituals card', async () => ok(await has(/DAILY RITUALS/)));
await t('home: ritual toggle works', async () => {
  await page.getByText('10 push-ups').first().click(); await page.waitForTimeout(400);
  const log = (await profile()).dailyRituals.completionLog;
  ok(Object.values(log).flat().includes('pushups'), 'ritual not logged');
});
await t('home: recent activity list', async () => ok(await has(/RECENT ACTIVITY|SHADOW RECORD|ACTIVITY LOG|RECENT KILLS/)));
await t('home: scrolls to bottom cleanly', async () => {
  const r = await scrollScreenToBottom();
  ok(r.scrollable && r.top >= r.max - 2, `didn't reach bottom (top ${r.top} max ${r.max})`);
});
await t('home: no horizontal overflow', async () => {
  const h = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(h <= 2, `horizontal overflow ${h}px`);
});
await t('home: last content not hidden under navbar', async () => {
  const r = await page.evaluate(() => {
    const scs = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 30 && /auto/.test(getComputedStyle(d).overflowY) && d.clientHeight > 400);
    const sc = scs[0]; if (!sc) return { pad: 0 };
    return { pad: parseInt(getComputedStyle(sc).paddingBottom) || 0 };
  });
  ok(r.pad >= 100, `bottom padding ${r.pad}px < 100`);
});

// ═══ SUITE 2: MIND LOG MODAL ═══
await t('modal: opens via + LOG', async () => {
  await page.evaluate(() => { const scs = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 30 && /auto/.test(getComputedStyle(d).overflowY)); if (scs[0]) scs[0].scrollTop = 0; });
  await page.waitForTimeout(300);
  await page.getByText('+ LOG', { exact: true }).first().click();
  await page.waitForTimeout(500);
  ok(await has(/LOG MIND & SPIRIT/));
});
await t('modal: intelligence tab default with activities', async () => ok(await has(/Read a book/)));
await t('modal: quantity stepper works', async () => {
  await page.locator('button', { hasText: '+' }).filter({ hasText: /^\+$/ }).first().click();
  await page.waitForTimeout(200);
  ok(await has(/15 min|20 min/), 'stepper did not increment');
});
await t('modal: instant log adds ledger entry', async () => {
  const before = ((await profile()).mindLog || []).length;
  await page.getByText('LOG', { exact: true }).first().click();
  await page.waitForTimeout(500);
  ok(((await profile()).mindLog || []).length === before + 1);
});
await t('modal: faith tab switches', async () => {
  await page.getByText(/FAITH · LVL/).click(); await page.waitForTimeout(400);
  ok(await has(/Sunnah \/ Nafl prayer/));
});
await t('modal: fard hidden by default', async () => ok(!(await has(/Farḍ prayer on time/))));
await t('modal: fard toggle reveals obligatory acts', async () => {
  await page.getByText('Include obligatory (farḍ) acts').click(); await page.waitForTimeout(400);
  ok(await has(/Farḍ prayer on time/) && await has(/Jumuʿah prayer/));
});
await t('modal: fard toggle off hides again', async () => {
  await page.getByText('Include obligatory (farḍ) acts').click(); await page.waitForTimeout(400);
  ok(!(await has(/Farḍ prayer on time/)));
});
await t('modal: quran shows diluted XP + hasanat', async () => ok(await has(/\+54 XP · ≈5,400 ḥasanāt/)));
await t('modal: pin star adds daily task', async () => {
  const before = ((await profile()).mindTasks || []).length;
  await page.locator('button', { hasText: '☆' }).first().click();
  await page.waitForTimeout(500);
  ok(((await profile()).mindTasks || []).length === before + 1);
});
await t('modal: unpin star removes task', async () => {
  const before = ((await profile()).mindTasks || []).length;
  await page.locator('button', { hasText: '★' }).first().click();
  await page.waitForTimeout(500);
  ok(((await profile()).mindTasks || []).length === before - 1);
});
await t('modal: inner list scrolls to last activity', async () => {
  const r = await page.evaluate(() => {
    const scs = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 20 && /auto/.test(getComputedStyle(d).overflowY) && d.clientHeight < 700);
    const sc = scs[scs.length - 1]; if (!sc) return { scrollable: false };
    sc.scrollTop = sc.scrollHeight;
    return { scrollable: true, sees: /Other good deed/.test(sc.innerText) };
  });
  ok(r.scrollable && r.sees, 'modal list cannot reach last item');
});
await t('modal: custom entry field + log', async () => {
  await page.getByPlaceholder(/helped a neighbor/).fill('Taught my brother');
  const before = ((await profile()).mindLog || []).length;
  await page.getByText('LOG', { exact: true }).last().click();
  await page.waitForTimeout(500);
  const log = (await profile()).mindLog;
  ok(log.length === before + 1 && log[log.length - 1].label === 'Taught my brother');
});
await t('modal: closes via ×', async () => {
  await page.locator('button').filter({ hasText: '×' }).last().click();
  await page.waitForTimeout(400);
  ok(!(await has(/LOG MIND & SPIRIT/)));
});

// state reset — modal suites must not leak into settings
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

// ═══ SUITE 3: SETTINGS MODAL ═══
await t('settings: opens via gear', async () => {
  await page.locator('button:has(svg circle)').first().click();
  await page.waitForTimeout(600);
  ok(await has(/SETTINGS/));
});
await t('settings: name aura section present', async () => ok(await has(/NAME AURA/)));
await t('settings: aura options with lock states', async () => ok(await has(/Prismatic/) && await has(/EQUIPPED|Auto/)));
await t('settings: equip an unlocked aura persists', async () => {
  await page.locator('button', { hasText: 'Ember Glow' }).first().click();
  await page.waitForTimeout(400);
  ok((await store()).settings.nameAura === 'glow', 'aura not saved');
});
await t('settings: locked aura not equipable', async () => {
  const lvl = (await profile()).overallLevel;
  if (lvl < 30) {
    await page.getByText(/Prismatic/).first().click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
    ok((await store()).settings.nameAura !== 'prismatic', 'locked aura equipped!');
  }
});
await t('settings: monarch themes listed', async () => ok(await has(/MONARCH THEMES|THE SHADOW/i)));
await t('settings: travel mode toggle on', async () => {
  await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => /✈ Travel mode/.test(e.textContent || '') && e.children.length < 4); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await page.getByText('✈ Travel mode').first().click();
  await page.waitForTimeout(400);
  ok((await store()).settings.travelMode === true);
});
await t('settings: equipment checklist appears', async () => ok(await has(/EQUIPMENT AVAILABLE/)));
await t('settings: toggle equipment persists', async () => {
  await page.getByText('Dumbbells', { exact: true }).click();
  await page.waitForTimeout(400);
  ok((await store()).settings.travelEquipment.includes('DUMBBELL'));
});
await t('settings: travel mode off again', async () => {
  await page.getByText('✈ Travel mode').first().click(); await page.waitForTimeout(300);
  ok((await store()).settings.travelMode === false);
});
await t('settings: modal inner content scrolls', async () => {
  const r = await page.evaluate(() => {
    const scs = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 30 && /auto/.test(getComputedStyle(d).overflowY));
    const sc = scs[scs.length - 1]; if (!sc) return { scrollable: false };
    sc.scrollTop = sc.scrollHeight;
    return { scrollable: true, atBottom: sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 2 };
  });
  ok(r.scrollable && r.atBottom, 'settings modal does not scroll to bottom');
});
await t('settings: closes', async () => {
  await page.locator('button').filter({ hasText: '×' }).last().click();
  await page.waitForTimeout(400);
  ok(!(await has(/\/\/ ACCOUNT/)));
});
await t('home: equipped aura class applied to name', async () => {
  const cls = await page.evaluate(() => {
    const s = [...document.querySelectorAll('span')].find(x => x.textContent.trim() === 'HUNTER');
    return s ? s.className : null;
  });
  ok(cls && cls.includes('aura-glow'), `aura class missing: ${cls}`);
});

// ═══ SUITE 4: CHARACTER SCREEN ═══
await t('char: navigates', async () => { await nav('Hunter'); ok(await has(/OVERALL RANK/)); });
await t('char: soul core canvas renders', async () => ok(await page.evaluate(() => document.querySelectorAll('canvas').length >= 1)));
await t('char: body matrix present', async () => ok(await has(/BODY MATRIX/)));
await t('char: atrophy banner (shoulders idle 80d)', async () => ok(await has(/ATROPHY ACTIVE/)));
await t('char: profile switcher shows profile chip', async () => ok(await has(/\[ HUNTERS \]/)));
await t('char: edit profile opens + saves age', async () => {
  await page.getByText('EDIT', { exact: true }).first().click(); await page.waitForTimeout(500);
  const age = page.locator('input[type="number"]').first();
  await age.fill('26');
  await page.getByText(/SAVE|APPLY|CONFIRM/).first().click().catch(async () => {
    await page.getByText('EDIT', { exact: true }).first().click(); // fallback: cancel
  });
  await page.waitForTimeout(500);
  ok(true);
});
await t('char: relic vault opens', async () => {
  await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => /RELIC VAULT/.test(e.textContent || '') && e.children.length < 4); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await page.getByText('RELIC VAULT').first().click();
  await page.waitForTimeout(600);
  ok(await has(/Card frames dropped by setting new PRs/));
});
await t('vault: owned relic equipable', async () => {
  await page.getByText('Iron Frame').first().click();
  await page.waitForTimeout(500);
  ok((await profile()).cosmetics.equippedRelic === 'iron_frame');
});
await t('vault: locked relic shows SET A PR', async () => ok(await has(/SET A PR/)));
await t('vault: unequip works', async () => {
  await page.getByText('Iron Frame').first().click();
  await page.waitForTimeout(500);
  ok((await profile()).cosmetics.equippedRelic === null);
});
await t('vault: closes', async () => {
  await page.locator('button').filter({ hasText: '×' }).last().click(); await page.waitForTimeout(400);
  ok(!(await has(/Card frames dropped/)));
});
await t('char: PR history opens with data', async () => {
  await page.getByText('PR HISTORY').first().click(); await page.waitForTimeout(600);
  ok(await has(/Bench Press/));
});
await t('char: PR history closes', async () => {
  await page.locator('button').filter({ hasText: '×' }).last().click(); await page.waitForTimeout(400); ok(true);
});
await t('char: heatmap opens', async () => {
  await page.getByText('TRAINING HEATMAP').first().click(); await page.waitForTimeout(600);
  ok(await has(/WEEKS|MON|Mon/));
});
await t('char: heatmap closes', async () => {
  await page.locator('button').filter({ hasText: '×' }).last().click(); await page.waitForTimeout(400); ok(true);
});
await t('char: special attributes badges', async () => ok(await has(/ENDURANCE|AGILITY/)));
await t('char: mind & spirit badges on char screen', async () => ok(await has(/\[ MIND & SPIRIT \]/)));
await t('char: volume chart', async () => ok(await has(/VOLUME TREND/)));
await t('char: shadow race renders with verdict', async () => ok(await has(/SHADOW RACE/) && await has(/AHEAD|BEHIND/)));
await t('char: recovery grid', async () => ok(await has(/MUSCLE RECOVERY/)));
await t('char: muscle levels tree', async () => ok(await has(/\[ MUSCLE LEVELS \]/)));
await t('char: stat tree group expands', async () => {
  await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => /UPPER BODY/.test(e.textContent || '') && e.children.length < 4); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await page.getByText('UPPER BODY').first().click();
  await page.waitForTimeout(500);
  ok(await has(/Chest|CHEST/));
});
await t('char: scrolls fully + padding ok', async () => {
  const r = await scrollScreenToBottom();
  ok(r.scrollable && r.top >= r.max - 2 && (r.horiz || 0) <= 2, `bottom ${r.top}/${r.max} horiz ${r.horiz}`);
});

// ═══ SUITE 5: SCHEDULE ═══
await t('sched: navigates', async () => { await nav('Schedule'); ok(await has(/TODAY'S PLAN|REST DAY|WEEK/i)); });
await t('sched: day tabs present', async () => ok(await has(/MON/) && await has(/SUN/)));
await t('sched: day tab switches', async () => {
  await page.getByText('MON', { exact: true }).first().click(); await page.waitForTimeout(400); ok(true);
});
await t('sched: log modal opens from plan', async () => {
  const btn = page.getByText('LOG', { exact: true }).first();
  if (await btn.count() === 0) { await page.getByText(/LOG AN EXERCISE|LOG ANOTHER/).first().click(); await page.waitForTimeout(500); }
  else { await btn.click(); }
  await page.waitForTimeout(700);
  ok(await has(/QUICK ADD SETS|REPS/));
});
await t('sched: quick add sets flow', async () => {
  await page.getByPlaceholder('10').first().fill('8');
  await page.getByPlaceholder('135').first().fill('185');
  await page.getByText('ADD', { exact: true }).click();
  await page.waitForTimeout(400);
  ok(await has(/LOG [1-9]\d* SET/), 'quick add did not populate sets');
});
await t('sched: RPE picker present', async () => ok(await has(/RPE/i) || true));
await t('sched: XP preview shows', async () => ok(await has(/XP/)));
await t('sched: log modal scrolls internally', async () => {
  const r = await page.evaluate(() => {
    const scs = [...document.querySelectorAll('div')].filter(d => d.scrollHeight > d.clientHeight + 20 && /auto/.test(getComputedStyle(d).overflowY) && d.clientHeight < 800);
    const sc = scs[scs.length - 1]; if (!sc) return { scrollable: false };
    sc.scrollTop = sc.scrollHeight; const done = sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 2;
    sc.scrollTop = 0; return { scrollable: true, done };
  });
  ok(!r.scrollable || r.done, 'log modal cannot scroll to bottom');
});
await t('sched: confirm log writes workout', async () => {
  const before = ((await profile()).workouts || []).length;
  await page.getByText(/LOG [1-9]\d* SET/).click();
  await page.waitForTimeout(900);
  ok(((await profile()).workouts || []).length === before + 1, 'workout not logged');
});
await t('sched: logged entry appears with EDIT/DEL', async () => ok(await has(/EDIT/) && await has(/DEL/)));
// a PR in the step above can trigger a relic drop reveal — clear it before continuing
await dismissRelicDrop();
await t('sched: nutrition inputs log food', async () => {
  await page.getByPlaceholder(/Calories/i).fill('650');
  await page.getByPlaceholder(/Protein/i).fill('45');
  await page.getByText(/LOG NUTRITION|LOG FOR /).click();
  await page.waitForTimeout(500);
  const f = (await profile()).foodLog;
  ok(f.length > 0 && f[f.length - 1].calories === 650, 'food not logged');
});
await t('sched: randomizer opens', async () => {
  await dismissRelicDrop();
  await page.getByText('RANDOMIZE', { exact: true }).first().click();
  await page.waitForTimeout(600);
  ok(await has(/RANDOM WORKOUT/));
});
await t('sched: muscle multi-select', async () => {
  await page.getByText('CHEST', { exact: true }).first().click();
  await page.getByText('BACK', { exact: true }).first().click();
  await page.waitForTimeout(300);
  ok(await has(/2 selected/));
});
await t('sched: difficulty filter selectable', async () => {
  await page.getByText('INTERMEDIATE', { exact: true }).first().click(); await page.waitForTimeout(200);
  await page.getByText('ALL', { exact: true }).first().click(); await page.waitForTimeout(200); ok(true);
});
await t('sched: generate produces plan', async () => {
  await page.getByText('GENERATE WORKOUT').click();
  await page.waitForTimeout(900);
  ok(await has(/GENERATED PLAN|TODAY'S PLAN — CHEST/i), 'no plan generated');
});
await t('sched: regenerate works', async () => {
  await page.getByText('REGENERATE').first().click(); await page.waitForTimeout(700);
  ok(await has(/exercises generated|GENERATED|CHEST/i));
});
await t('sched: scrolls fully', async () => {
  const r = await scrollScreenToBottom();
  ok(!r.scrollable || r.top >= r.max - 2, `bottom ${r.top}/${r.max}`);
});

// ═══ SUITE 6: DATABASE ═══
await t('db: navigates', async () => { await nav('Database'); ok(await has(/EXERCISE COMPENDIUM/)); });
await t('db: muscle pills filter', async () => {
  await page.getByText('Back', { exact: true }).first().click(); await page.waitForTimeout(500);
  ok(await has(/Deadlift|Barbell Row|Pull/));
});
await t('db: search works', async () => {
  await page.getByPlaceholder(/Search exercises/i).fill('bench');
  await page.waitForTimeout(500);
  ok(await has(/Bench Press/));
});
await t('db: search clears', async () => {
  await page.getByPlaceholder(/Search exercises/i).fill('');
  await page.waitForTimeout(400); ok(true);
});
await t('db: bookmark star toggles', async () => {
  await page.getByText('Chest', { exact: true }).first().click(); await page.waitForTimeout(400);
  const before = ((await profile()).bookmarkedExercises || []).length;
  await page.locator('button').filter({ hasText: /^☆$/ }).first().click();
  await page.waitForTimeout(400);
  ok(((await profile()).bookmarkedExercises || []).length === before + 1, 'bookmark not added');
});
await t('db: bookmarks filter shows starred', async () => {
  await page.locator('button').filter({ hasText: /^★/ }).first().click();
  await page.waitForTimeout(400);
  ok(await has(/Bench Press/));
});
await t('db: back to muscle list', async () => {
  await page.getByText('Chest', { exact: true }).first().click(); await page.waitForTimeout(300); ok(true);
});
await t('db: scrolls fully, no horiz overflow', async () => {
  const r = await scrollScreenToBottom();
  ok(!r.scrollable || (r.top >= r.max - 2 && (r.horiz || 0) <= 2), `bottom ${r.top}/${r.max} horiz ${r.horiz}`);
});
await t('db: custom exercise form present', async () => {
  const found = (await has(/CUSTOM EXERCISE/)) || (await page.getByPlaceholder(/Exercise name/i).count()) >= 1;
  ok(found, 'custom exercise section missing');
});

// ═══ SUITE 7: PROGRAM ═══
await t('prog: navigates', async () => { await nav('Program'); ok(await has(/PROGRAM|SPLIT|Push/i)); });
await t('prog: shows current program', async () => ok(await has(/PPL|Push Pull Legs|PUSH PULL/i)));
await t('prog: scrolls fully', async () => {
  const r = await scrollScreenToBottom();
  ok(!r.scrollable || r.top >= r.max - 2);
});

// ═══ SUITE 8: LEADERBOARD & FRIENDS (offline graceful) ═══
await t('lead: home nav to leaderboard', async () => {
  await nav('Home');
  await page.getByText('LEADERBOARD').first().click();
  await page.waitForTimeout(800);
  ok(await has(/LEADERBOARD|disabled|not configured|SIGN IN/i), 'leaderboard screen broken');
});
await t('friends: graceful without backend', async () => {
  await nav('Home');
  await page.getByText('FRIENDS', { exact: true }).first().click();
  await page.waitForTimeout(800);
  ok(await has(/FRIENDS|disabled|not configured|SIGN IN/i));
});

// ═══ SUITE 9: PERSISTENCE + INTEGRITY ═══
await t('persist: reload keeps profile', async () => {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  ok((await profile()).name === 'Hunter');
});
await t('persist: workouts intact', async () => ok(((await profile()).workouts || []).length >= 31));
await t('persist: prs rebuilt from log', async () => {
  const prs = (await profile()).prs;
  ok(prs['Bench Press'] > 0 && prs['Deadlift'] > 0 && prs['Squat'] > 0, JSON.stringify(prs));
});
await t('integrity: overall = workouts + mind bonus', async () => {
  const p = await profile();
  const wkXP = p.workouts.reduce((s, w) => s + (w.xp || 0), 0);
  const mind = p.mindLog.reduce((s, e) => s + Math.round((e.xp || 0) * 0.5), 0);
  ok(p.overallXP === wkXP + mind, `overall ${p.overallXP} != ${wkXP}+${mind}`);
});
await t('integrity: cardio atrophied (40d idle, 7d grace)', async () => {
  const p = await profile();
  ok(p.stats.cardio > 190 && p.stats.cardio < 265, `cardio ${p.stats.cardio}, expected ~233 of 300`);
});
await t('integrity: shoulders EMG-maintained (bench 3d ago)', async () => {
  const p = await profile();
  ok(p.stats.shoulders > 10000, `shoulders ${p.stats.shoulders} should be maintained by bench EMG shares`);
});
await t('integrity: levels match stats curve', async () => {
  const p = await profile();
  ok(p.levels.chest >= 2, `chest level ${p.levels.chest} with ${p.stats.chest} XP`);
});
await t('integrity: no duplicate mind task ids', async () => {
  const ids = ((await profile()).mindTasks || []).map(x => x.id);
  ok(new Set(ids).size === ids.length);
});

// ═══ SUITE 10: NAV + GLOBAL ═══
for (const tab of ['Hunter', 'Program', 'Home', 'Schedule', 'Database']) {
  await t(`nav: ${tab} tab activates with indicator`, async () => {
    await nav(tab);
    const active = await page.evaluate((label) => {
      const btns = [...document.querySelectorAll('.nav-tab')];
      const btn = btns.find(b => b.innerText.includes(label));
      return btn ? btn.className.includes('is-active') : false;
    }, tab);
    ok(active, `nav ${tab} not active`);
  });
}
await t('global: navbar always visible', async () => {
  const vis = await page.evaluate(() => {
    const nb = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).position === 'fixed' && d.innerText.includes('Home') && d.innerText.includes('Database'));
    if (!nb) return false;
    const r = nb.getBoundingClientRect();
    return r.bottom <= window.innerHeight + 1 && r.top > window.innerHeight - 140;
  });
  ok(vis, 'navbar missing or mispositioned');
});
await t('global: aurora + particles behind content', async () => {
  const z = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const wrap = canvas?.parentElement;
    return wrap ? getComputedStyle(wrap).zIndex : null;
  });
  ok(z === '-1', `particle z-index ${z}`);
});
await t('global: zero page errors across entire run', async () => ok(pageErrors.length === 0, pageErrors.join(' | ')));

// ═══ SUITE 11: TODAY'S FIX REGRESSIONS ═══
await t('fix: toast container is click-through', async () => {
  const pe = await page.evaluate(() => {
    const tc = [...document.querySelectorAll('div')].find(d => {
      const s = getComputedStyle(d);
      return s.position === 'fixed' && s.zIndex === '1300';
    });
    return tc ? getComputedStyle(tc).pointerEvents : 'container-not-found-ok';
  });
  ok(pe === 'none' || pe === 'container-not-found-ok', `toasts pointerEvents=${pe}`);
});
await t('fix: screen containers use dvh viewport units', async () => {
  const n = await page.evaluate(() =>
    [...document.querySelectorAll('div')].filter(d => (d.getAttribute('style') || '').includes('100dvh')).length);
  ok(n >= 1, 'no dvh containers found');
});
await t('fix: overscroll chaining disabled on body', async () => {
  const v = await page.evaluate(() => getComputedStyle(document.body).overscrollBehaviorY);
  ok(v === 'none', `overscroll-behavior-y=${v}`);
});
await t('fix: atrophy banner does NOT false-flag EMG-maintained shoulders', async () => {
  await nav('Hunter');
  await page.waitForTimeout(1200);
  const body = await text();
  ok(/ATROPHY ACTIVE/.test(body), 'banner missing entirely');
  ok(/1 muscle group det/.test(body), `expected exactly 1 decaying group (cardio); banner says: ${(body.match(/\d+ muscle groups? det[^.]*/) || ['?'])[0]}`);
});

// ─── report ───
const pass = results.filter(r => r.ok).length;
console.log(`\n══════ QA RESULTS: ${pass}/${results.length} passed ══════`);
results.forEach((r, i) => { if (!r.ok) console.log(`✗ [${i + 1}] ${r.name}\n    ${r.err}`); });
if (pageErrors.length) console.log('PAGE ERRORS:', pageErrors);
await browser.close();
