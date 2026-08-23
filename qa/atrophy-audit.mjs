import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewportSize({ width:390, height:844 });
const errs=[]; page.on('pageerror', e=>errs.push(e.message.slice(0,120)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil:'domcontentloaded' });

// Scenario A: NOTHING since May (100 days), no recent session at all
// Scenario B: same history + ONE back day 3 days ago (deadlift + rows)
async function run(withRecentBackDay) {
  await page.evaluate((withBack) => {
    const D = d => Date.now() - d*86400000;
    const wk = (d,muscle,name,xp) => ({ date: D(d), muscle, xp,
      exercise: { name, primary: muscle, type: "strength" }, exerciseName: name,
      weight: 185, reps: 8, sets: 3 });
    // May-era training: legs/glutes + arms, ~100-115 days ago
    const workouts = [
      wk(115,"glutes","Hip Thrust",600), wk(110,"legs","Squat",700), wk(105,"glutes","Hip Thrust",600),
      wk(112,"bicep","Barbell Curl",500), wk(104,"bicep","Barbell Curl",500),
      wk(108,"back","Barbell Row",600),
    ];
    if (withBack === 'back') { workouts.push(wk(3,"back","Deadlift",800)); workouts.push(wk(3,"back","Barbell Row",600)); }
    if (withBack === 'direct') { workouts.push(wk(3,"glutes","Hip Thrust",600)); workouts.push(wk(3,"bicep","Barbell Curl",500)); }
    const store={activeId:"p1",profiles:{p1:{id:"p1",name:"H",gender:"male",goal:"strength",age:25,weightLbs:185,heightIn:72,activityLevel:"moderate",program:"ppl",customSchedule:null,stats:{glutes:0,bicep:0,legs:0,back:0},levels:{glutes:1,bicep:1,legs:1,back:1},overallXP:0,overallLevel:1,workouts,foodLog:[],customPrograms:[],customExercises:[],prs:{},lastWeightUpdate:null,weightLog:[],bookmarkedExercises:[],dailyRituals:{completionLog:{}},mindLog:[],mindTasks:[],mindTasksLog:{},cosmetics:{unlockedTitles:[],equippedTitle:null},patronLift:null,createdAt:D(200),onboarded:true}},settings:{accentColor:"#00d4ff",accent2Color:"#0044aa",monarchTheme:null,weightUnit:"lbs",weeklyGoal:3,travelMode:false,travelEquipment:["BODYWEIGHT"]}};
    localStorage.setItem("iron_realm_store_v1",JSON.stringify(store));
  }, withRecentBackDay);
  await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1800);
  return page.evaluate(()=>{ const p=JSON.parse(localStorage.getItem('iron_realm_store_v1')).profiles.p1;
    return { stats:p.stats, levels:p.levels }; });
}
const A = await run(null);
console.log('A. NOTHING since May (no recent session at all):');
for (const k of ['glutes','bicep','legs','back']) console.log(`   ${k.padEnd(7)} xp=${String(A.stats[k]??0).padStart(5)}  lvl=${A.levels[k]}`);
const B = await run('back');
console.log('B. same history + ONE back day (deadlift+rows) 3 days ago:');
for (const k of ['glutes','bicep','legs','back']) console.log(`   ${k.padEnd(7)} xp=${String(B.stats[k]??0).padStart(5)}  lvl=${B.levels[k]}  (delta ${(B.stats[k]??0)-(A.stats[k]??0) >= 0 ? '+' : ''}${(B.stats[k]??0)-(A.stats[k]??0)})`);
const C = await run('direct');
console.log('C. same history + DIRECT work (hip thrust + curls) 3 days ago:');
for (const k of ['glutes','bicep']) console.log(`   ${k.padEnd(7)} xp=${String(C.stats[k]??0).padStart(5)}  lvl=${C.levels[k]}  (delta ${(C.stats[k]??0)-(A.stats[k]??0) >= 0 ? '+' : ''}${(C.stats[k]??0)-(A.stats[k]??0)})`);
console.log('errors:', errs.length?errs:'none');
await browser.close();
