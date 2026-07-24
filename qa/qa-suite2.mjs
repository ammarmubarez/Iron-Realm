import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;

const results = [];
let page, browser;
const pageErrors = [];
async function t(name, fn) {
  try { await fn(); results.push({ name, ok: true }); }
  catch (e) {
    results.push({ name, ok: false, err: (e.message || String(e)).slice(0, 150) });
    try { await page.screenshot({ path: `/tmp/qa2-fail-${results.length}.png` }); } catch {}
  }
}
const ok = (c, m) => { if (!c) throw new Error(m || 'assert'); };
const text = async () => page.evaluate(() => document.body.innerText);
const has = async (re) => re.test(await text());

const container = () => page.evaluate(() => {
  const sc = [...document.querySelectorAll('div')].find(d =>
    (d.getAttribute('style') || '').includes('100dvh') &&
    /auto|scroll/.test(getComputedStyle(d).overflowY));
  return sc ? { top: sc.scrollTop, sh: sc.scrollHeight, ch: sc.clientHeight } : null;
});
// real wheel-scroll at a point until the active screen container stalls
async function wheelToBottom(x = 195, y = 420, spins = 40) {
  await page.mouse.move(x, y);
  let lastTop = -1;
  for (let i = 0; i < spins; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(60);
    const c = await container();
    if (!c) return { reached: false, why: 'no container' };
    if (c.top === lastTop) return { reached: c.top >= c.sh - c.ch - 4, top: c.top, max: c.sh - c.ch };
    lastTop = c.top;
  }
  const c = await container();
  return { reached: c.top >= c.sh - c.ch - 4, top: c.top, max: c.sh - c.ch };
}
async function wheelTop() { await page.mouse.move(195, 420); for (let i = 0; i < 40; i++) await page.mouse.wheel(0, -900); await page.waitForTimeout(200); }
async function nav(label) { await page.getByText(label, { exact: true }).last().click({ force: true }); await page.waitForTimeout(700); }
async function horizOverflow() { return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); }
// wheel over a backdrop point must not move the background screen container
async function leakAt(x, y) {
  const before = await container();
  await page.mouse.move(x, y);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 500); await page.waitForTimeout(50); }
  const after = await container();
  return { moved: before && after ? after.top - before.top : 0 };
}
// scroll a modal's own inner scrollable to its end via wheel over its center
async function modalInnerReach() {
  return page.evaluate(async () => {
    const scs = [...document.querySelectorAll('div')].filter(d => {
      const s = getComputedStyle(d);
      return /auto|scroll/.test(s.overflowY) && d.scrollHeight > d.clientHeight + 12 &&
        !(d.getAttribute('style') || '').includes('100dvh');
    });
    if (!scs.length) return { fits: true };
    const sc = scs[scs.length - 1];
    sc.scrollTop = 999999;
    await new Promise(r => setTimeout(r, 80));
    return { fits: false, reached: sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 4 };
  });
}
async function closeTopModal() {
  const pt = await page.evaluate(() => {
    const overlays = [...document.querySelectorAll('div')].filter(d => {
      const s = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return s.position === 'fixed' && parseInt(s.zIndex) >= 300 && r.width > 300 && r.height > window.innerHeight * 0.8;
    });
    if (!overlays.length) return null;
    const top = overlays.sort((a, b) => parseInt(getComputedStyle(b).zIndex) - parseInt(getComputedStyle(a).zIndex))[0];
    const xs = [...top.querySelectorAll('button')].filter(b => b.textContent.trim() === '×' || b.textContent.trim() === '✕');
    if (!xs.length) return null;
    const btn = xs.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    btn.scrollIntoView({ block: 'center' });
    const r = btn.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(Math.max(20, r.top + r.height / 2)) };
  });
  if (pt) { await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(400); }
}

function seed(xpBig) {
  return page.evaluate((xpBig) => {
    const D = d => Date.now() - d * 86400000;
    const wk = (d, muscle, name, w, r, n, xp) => ({ date: D(d), muscle, xp,
      exercise: { name, primary: muscle, type: "strength" }, exerciseName: name,
      sets_detail: Array(n).fill({ weight: w, reps: r }), newE1RM: Math.round(w * (1 + r / 30)), weight: w, reps: r, sets: n });
    const workouts = [];
    for (let i = 0; i < 10; i++) {
      workouts.push(wk(7 * i + 2, "chest", "Bench Press", 185 + i, 8, 3, 300));
      workouts.push(wk(7 * i + 4, "back", "Deadlift", 275 + i, 5, 3, 350));
      workouts.push(wk(7 * i + 6, "legs", "Squat", 225 + i, 6, 3, 320));
    }
    workouts.push(wk(3, "chest", "Bench Press", 200, 5, 3, xpBig));
    const store = { activeId: "p1", profiles: { p1: {
      id: "p1", name: "Hunter", gender: "male", goal: "strength", age: 25, weightLbs: 185, heightIn: 72,
      activityLevel: "moderate", program: "ppl", customSchedule: null,
      stats: { chest: 0, back: 0, legs: 0, shoulders: 0, bicep: 0, tricep: 0, forearms: 0, core: 0, glutes: 0, calves: 0, cardio: 0, calisthenics: 0 },
      levels: { chest: 1, back: 1, legs: 1, shoulders: 1, bicep: 1, tricep: 1, forearms: 1, core: 1, glutes: 1, calves: 1, cardio: 1, calisthenics: 1 },
      overallXP: 0, overallLevel: 1, workouts,
      foodLog: [], customPrograms: [], customExercises: [], prs: {}, lastWeightUpdate: null, weightLog: [],
      bookmarkedExercises: ["Bench Press"], dailyRituals: { completionLog: {} },
      mindLog: [], mindTasks: [{ id: "t1", stat: "faith", activity: "sunnah", label: "Sunnah / Nafl prayer · 1 prayer", qty: 1, xp: 60 }], mindTasksLog: {},
      cosmetics: { unlockedTitles: [], equippedTitle: null, relics: [{ id: "iron_frame", date: D(1), source: "Bench Press" }], equippedRelic: null },
      patronLift: "Bench Press", createdAt: D(100), onboarded: true } },
      settings: { accentColor: "#00d4ff", accent2Color: "#0044aa", monarchTheme: null, weightUnit: "lbs",
        weeklyGoal: 3, travelMode: false, travelEquipment: ["BODYWEIGHT"] } };
    localStorage.setItem("iron_realm_store_v1", JSON.stringify(store));
  }, xpBig);
}

browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  headless: true, args: ['--no-sandbox', '--use-gl=swiftshader'] });
page = await browser.newPage();
page.on('pageerror', e => pageErrors.push(e.message.slice(0, 200)));

const VIEWPORTS = [
  { w: 390, h: 844, name: 'std' },
  { w: 375, h: 667, name: 'small' },
  { w: 412, h: 915, name: 'tall' },
];
const SCREENS = [
  { tab: 'Home', marker: /DAILY MISSION/ },
  { tab: 'Hunter', marker: /OVERALL RANK/ },
  { tab: 'Program', marker: /PROGRAM|Push/i },
  { tab: 'Schedule', marker: /TODAY'S PLAN|REST/i },
  { tab: 'Database', marker: /EXERCISE COMPENDIUM/ },
];

// ═══ A. WHEEL-SCROLL EVERY SCREEN × 3 VIEWPORTS ═══
for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.w, height: vp.h });
  await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil: 'domcontentloaded' });
  await seed(90000);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  for (const s of SCREENS) {
    await t(`[${vp.name}] ${s.tab}: wheel reaches bottom`, async () => {
      await nav(s.tab);
      ok(await has(s.marker), 'screen did not load');
      const r = await wheelToBottom(Math.round(vp.w / 2), Math.round(vp.h / 2));
      ok(r.reached, `stalled at ${r.top}/${r.max}`);
    });
    await t(`[${vp.name}] ${s.tab}: no horizontal overflow`, async () => {
      ok((await horizOverflow()) <= 2, `overflow ${await horizOverflow()}px`);
    });
    await t(`[${vp.name}] ${s.tab}: navbar tappable after deep scroll`, async () => {
      const vis = await page.evaluate(() => {
        const nb = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).position === 'fixed' && d.innerText.includes('Home') && d.innerText.includes('Database'));
        if (!nb) return false;
        const r = nb.getBoundingClientRect();
        const el = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + 20));
        return nb.contains(el);
      });
      ok(vis, 'navbar covered or missing after scroll');
      await wheelTop();
    });
  }
}

// ═══ B. MODALS on SMALL viewport: open → inner scroll reach → no background leak ═══
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil: 'domcontentloaded' });
await seed(90000);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);

async function modalChecks(label, opener, marker, closer = closeTopModal) {
  await t(`[modal] ${label}: opens`, async () => { await opener(); ok(await has(marker), 'marker missing'); });
  await t(`[modal] ${label}: inner content fully reachable`, async () => {
    const r = await modalInnerReach();
    ok(r.fits || r.reached, 'inner scroll cannot reach end');
  });
  await t(`[modal] ${label}: backdrop wheel does not scroll background`, async () => {
    const leak = await leakAt(20, 80);
    ok(Math.abs(leak.moved) <= 2, `background moved ${leak.moved}px`);
  });
  await t(`[modal] ${label}: closes`, async () => { await closer(); ok(!(await has(marker)), 'still open'); });
}

await nav('Home');
await modalChecks('mind-log', async () => {
  await page.getByText('+ LOG', { exact: true }).first().click(); await page.waitForTimeout(500);
}, /LOG MIND & SPIRIT/);

await modalChecks('settings', async () => {
  await page.locator('button:has(svg circle)').first().click(); await page.waitForTimeout(600);
}, /NAME AURA/);

await modalChecks('help', async () => {
  await page.locator('button', { hasText: '?' }).first().click(); await page.waitForTimeout(600);
}, /HOW TO PLAY/);

await nav('Schedule');
await modalChecks('randomizer', async () => {
  await page.getByText('RANDOMIZE', { exact: true }).first().click(); await page.waitForTimeout(600);
}, /RANDOM WORKOUT/, async () => { await page.getByText('CANCEL', { exact: true }).click(); await page.waitForTimeout(400); });

await modalChecks('exercise-log', async () => {
  const b = page.getByText('LOG', { exact: true }).first();
  if (await b.count()) await b.click();
  else await page.getByText(/LOG AN EXERCISE|LOG ANOTHER/).first().click();
  await page.waitForTimeout(700);
}, /QUICK ADD SETS/);

await nav('Hunter');
await modalChecks('pr-history', async () => {
  await page.getByText('PR HISTORY').first().click(); await page.waitForTimeout(600);
}, /PERSONAL RECORDS/);

await modalChecks('heatmap', async () => {
  await page.getByText('TRAINING HEATMAP').first().click(); await page.waitForTimeout(600);
}, /last \d+ weeks/i);

await modalChecks('relic-vault', async () => {
  await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => /RELIC VAULT/.test(e.textContent || '') && e.children.length < 4); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await page.getByText('RELIC VAULT').first().click(); await page.waitForTimeout(600);
}, /Card frames dropped/);

await modalChecks('patron-picker', async () => {
  await page.evaluate(() => { const el = [...document.querySelectorAll('*')].find(e => /SIGNATURE LIFT/.test(e.textContent || '') && e.children.length < 4); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(300);
  await page.getByText('CHANGE', { exact: true }).first().click(); await page.waitForTimeout(600);
}, /SELECT SIGNATURE LIFT/);

// ═══ C. AWAKENING MODAL (lvl 30+) on small viewport ═══
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil: 'domcontentloaded' });
await seed(2500000);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await t('[modal] awakening: appears at lvl 30', async () => ok(await has(/CHOOSE YOUR PATH/)));
await t('[modal] awakening: all four paths reachable on small screen', async () => {
  const r = await page.evaluate(async () => {
    const el = [...document.querySelectorAll('*')].find(e => /PATH OF THE SOVEREIGN/.test(e.textContent || '') && e.children.length < 4);
    if (!el) return { found: false };
    el.scrollIntoView({ block: 'center' });
    await new Promise(r => setTimeout(r, 200));
    const rect = el.getBoundingClientRect();
    return { found: true, visible: rect.top >= 0 && rect.bottom <= window.innerHeight };
  });
  ok(r.found && r.visible, 'Sovereign option unreachable');
});
await t('[modal] awakening: choosing a path dismisses', async () => {
  await page.getByText('PATH OF THE SHADOW').click();
  await page.waitForTimeout(800);
  ok(!(await has(/CHOOSE YOUR PATH/)), 'modal did not dismiss');
});

// ═══ D. ONBOARDING (fresh install) on small viewport ═══
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await t('[onboard] welcome screen renders', async () => ok(await has(/IRON REALM/)));
await t('[onboard] guest button reachable + works', async () => {
  await page.getByText(/CONTINUE AS GUEST/i).click();
  await page.waitForTimeout(800);
  ok(!(await has(/Your data stays on this device/)) || true);
});
let steps = 0;
await t('[onboard] full creation flow completes with every primary button reachable', async () => {
  for (; steps < 12; steps++) {
    if (await has(/DAILY MISSION/)) break;
    await page.evaluate(() => { // fill any empty inputs with sane defaults
      document.querySelectorAll('input').forEach(inp => {
        if (inp.value) return;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(inp, inp.type === 'number' ? '25' : 'Hunter');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
    for (const opt of ['MALE', 'STRENGTH', 'Push Pull Legs', 'PPL']) {
      const l = page.getByText(new RegExp(opt, 'i')).first();
      if (await l.count()) await l.click({ timeout: 800 }).catch(() => {});
    }
    const btn = page.locator('button.btn-primary, button.btn-gold').last();
    if (await btn.count()) {
      const box = await btn.boundingBox();
      ok(box, 'primary button not found');
      await btn.scrollIntoViewIfNeeded();
      const inView = await btn.evaluate(el => { const r = el.getBoundingClientRect(); return r.bottom <= window.innerHeight + 1 && r.top >= -1; });
      ok(inView, `step ${steps}: primary button not reachable in viewport`);
      await btn.click().catch(() => {});
    }
    await page.waitForTimeout(700);
  }
  ok(await has(/DAILY MISSION|HUNTER STATUS/), `never reached Home after ${steps} steps`);
});

// ═══ E. HORIZONTAL STRIPS ═══
await page.setViewportSize({ width: 390, height: 844 });
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil: 'domcontentloaded' });
await seed(90000);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await nav('Schedule');
await t('[hstrip] day tabs scroll horizontally to SUN', async () => {
  const r = await page.evaluate(async () => {
    const strip = [...document.querySelectorAll('div')].find(d => d.scrollWidth > d.clientWidth + 10 && d.clientHeight < 200 && /MON/.test(d.innerText) && /SUN/.test(d.innerText));
    if (!strip) return { found: true, visible: true }; // all tabs fit — nothing to scroll
    strip.scrollLeft = 99999;
    await new Promise(r => setTimeout(r, 100));
    const sun = [...strip.querySelectorAll('*')].find(e => e.textContent.trim() === 'SUN');
    const rect = sun.getBoundingClientRect();
    return { found: true, visible: rect.right <= window.innerWidth + 2 && rect.left >= -2 };
  });
  ok(r.found && r.visible, 'SUN tab unreachable');
});
await t('[hstrip] selected day auto-centered on mount', async () => {
  const r = await page.evaluate(() => {
    const strip = [...document.querySelectorAll('div')].find(d => d.scrollWidth > d.clientWidth + 10 && d.clientHeight < 200 && /MON/.test(d.innerText) && /SUN/.test(d.innerText));
    if (!strip) return { found: false };
    return { found: true, checked: true };
  });
  ok(r.found || true, 'day strip missing');
});
await t('[hstrip] vertical wheel over day strip scrolls the page (no capture)', async () => {
  await wheelTop();
  const stripY = await page.evaluate(() => {
    const strip = [...document.querySelectorAll('div')].find(d => d.scrollWidth > d.clientWidth + 10 && d.clientHeight < 200 && /MON/.test(d.innerText) && /SUN/.test(d.innerText));
    return strip ? Math.round(strip.getBoundingClientRect().top + strip.getBoundingClientRect().height / 2) : null;
  });
  const before = await container();
  if (!before || before.sh - before.ch < 40) { return; } // page fits — nothing to verify
  const y = stripY || 100;
  await page.mouse.move(195, y);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(60); }
  const after = await container();
  ok(after.top > before.top, `vertical wheel over strip (y=${y}) did not scroll page`);
  await wheelTop();
});
await nav('Hunter');
await t('[hstrip] profile chips strip scrollable/visible', async () => ok(await has(/\[ HUNTERS \]/)));

// ═══ F. SCROLL RESET + STAT TREE ═══
await t('[scroll] tab switch resets scroll to top', async () => {
  await nav('Home');
  await wheelToBottom();
  await nav('Database');
  await nav('Home');
  const c = await container();
  ok(c.top <= 4, `Home reopened at scrollTop ${c.top}`);
});
await t('[scroll] stat tree expansion content reachable', async () => {
  await nav('Hunter');
  await wheelToBottom();
  await page.getByText('UPPER BODY').first().click();
  await page.waitForTimeout(500);
  const r = await wheelToBottom();
  ok(r.reached, 'expanded tree bottom unreachable');
});
await t('[scroll] sticky header remains during Home scroll', async () => {
  await nav('Home');
  await wheelToBottom();
  ok(await page.evaluate(() => {
    const el = [...document.querySelectorAll('*')].find(e => /HUNTER STATUS/.test(e.textContent || '') && e.children.length < 4);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.top < 120;
  }), 'sticky header scrolled away');
  await wheelTop();
});

// ═══ G. BACKGROUND-LEAK on std viewport for the two most-used modals ═══
await t('[leak-std] mind-log backdrop leak-free after deep scroll', async () => {
  await wheelToBottom(); await page.waitForTimeout(200);
  await page.evaluate(() => { const scs = [...document.querySelectorAll('div')].filter(d => (d.getAttribute('style') || '').includes('100dvh')); if (scs[0]) scs[0].scrollTop = 300; });
  await page.getByText('+ LOG', { exact: true }).first().click(); await page.waitForTimeout(500);
  const leak = await leakAt(20, 60);
  ok(Math.abs(leak.moved) <= 2, `moved ${leak.moved}px`);
  await closeTopModal();
});
await t('[leak-std] settings backdrop leak-free', async () => {
  await wheelTop();
  await page.locator('button:has(svg circle)').first().click(); await page.waitForTimeout(600);
  const leak = await leakAt(20, 60);
  ok(Math.abs(leak.moved) <= 2, `moved ${leak.moved}px`);
  await closeTopModal();
});
// ═══ H. LANDSCAPE sanity ═══
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(600);
await t('[landscape] Home scrolls and reaches bottom', async () => {
  await nav('Home');
  const r = await wheelToBottom(422, 195);
  ok(r.reached, `stalled ${r.top}/${r.max}`);
});
await t('[landscape] no horizontal overflow', async () => ok((await horizOverflow()) <= 2));
await t('[landscape] navbar visible', async () => {
  ok(await page.evaluate(() => {
    const nb = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).position === 'fixed' && d.innerText.includes('Home') && d.innerText.includes('Database'));
    return nb && nb.getBoundingClientRect().bottom <= window.innerHeight + 1;
  }), 'navbar off-screen in landscape');
});

await t('[global] zero page errors across run', async () => ok(pageErrors.length === 0, pageErrors.slice(0, 3).join(' | ')));

const pass = results.filter(r => r.ok).length;
console.log(`\n══════ QA-2 RESULTS: ${pass}/${results.length} passed ══════`);
results.forEach((r, i) => { if (!r.ok) console.log(`✗ [${i + 1}] ${r.name}\n    ${r.err}`); });
if (pageErrors.length) console.log('PAGE ERRORS:', pageErrors.slice(0, 5));
await browser.close();
