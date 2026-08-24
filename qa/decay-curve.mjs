import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewportSize({ width:390, height:844 });
const errs=[]; page.on('pageerror', e=>errs.push(e.message.slice(0,120)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil:'domcontentloaded' });
// ONLY glute work, N days ago, nothing since. No deadlifts, no legs, nothing.
async function run(daysAgo, earnedXP) {
  await page.evaluate(({daysAgo, earnedXP}) => {
    const D = d => Date.now() - d*86400000;
    const workouts = [{ date: D(daysAgo), muscle:"glutes", xp: earnedXP,
      exercise:{ name:"Hip Thrust", primary:"glutes", type:"strength" }, exerciseName:"Hip Thrust",
      weight:225, reps:10, sets:3 }];
    const store={activeId:"p1",profiles:{p1:{id:"p1",name:"H",gender:"male",goal:"strength",age:25,weightLbs:185,heightIn:72,activityLevel:"moderate",program:"ppl",customSchedule:null,stats:{glutes:0},levels:{glutes:1},overallXP:0,overallLevel:1,workouts,foodLog:[],customPrograms:[],customExercises:[],prs:{},lastWeightUpdate:null,weightLog:[],bookmarkedExercises:[],dailyRituals:{completionLog:{}},mindLog:[],mindTasks:[],mindTasksLog:{},cosmetics:{unlockedTitles:[],equippedTitle:null},patronLift:null,createdAt:D(200),onboarded:true}},settings:{accentColor:"#00d4ff",accent2Color:"#0044aa",monarchTheme:null,weightUnit:"lbs",weeklyGoal:3,travelMode:false,travelEquipment:["BODYWEIGHT"]}};
    localStorage.setItem("iron_realm_store_v1",JSON.stringify(store));
  }, {daysAgo, earnedXP});
  await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1500);
  return page.evaluate(()=>{ const p=JSON.parse(localStorage.getItem('iron_realm_store_v1')).profiles.p1;
    return { xp:p.stats.glutes, lvl:p.levels.glutes }; });
}
// Hip Thrust EMG: glute-max 100 + glute-med 55 of total 195 -> glutes get 79.5%
const EARNED = 1000;
const base = Math.round(EARNED*(100+55)/195);
console.log(`One Hip Thrust session worth ${EARNED} XP -> ${base} XP credited to glutes (79.5% EMG share)\n`);
console.log('days idle | glutes XP | retained | level');
for (const d of [7, 14, 21, 28, 42, 60, 90, 120]) {
  const r = await run(d, EARNED);
  console.log(`   ${String(d).padStart(3)}    |   ${String(r.xp).padStart(4)}    |   ${String(Math.round(r.xp/base*100)).padStart(3)}%   |   ${r.lvl}`);
}
console.log('\nerrors:', errs.length?errs:'none');
await browser.close();
