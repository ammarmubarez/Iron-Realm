import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewportSize({ width:390, height:844 });
const errs=[]; page.on('pageerror', e=>errs.push(e.message.slice(0,120)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil:'domcontentloaded' });
async function seed(equip, travel){ await page.evaluate(({equip,travel})=>{
  const now=Date.now();
  const store={activeId:"p1",profiles:{p1:{id:"p1",name:"H",gender:"male",goal:"strength",age:25,weightLbs:185,heightIn:72,activityLevel:"moderate",program:"ppl",customSchedule:null,stats:{tricep:0},levels:{tricep:1},overallXP:0,overallLevel:9,workouts:[],foodLog:[],customPrograms:[],customExercises:[],prs:{},lastWeightUpdate:null,weightLog:[],bookmarkedExercises:[],dailyRituals:{completionLog:{}},mindLog:[],mindTasks:[],mindTasksLog:{},cosmetics:{unlockedTitles:[],equippedTitle:null},patronLift:null,createdAt:now,onboarded:true}},settings:{accentColor:"#00d4ff",accent2Color:"#0044aa",monarchTheme:null,weightUnit:"lbs",weeklyGoal:3,travelMode:travel,travelEquipment:equip}};
  localStorage.setItem("iron_realm_store_v1",JSON.stringify(store)); },{equip,travel});
  await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1700); }
const BAR=/^(Dips|Tricep Dips|Ring Dips|Ring Push-ups|Pull-ups|Wide-Grip Pull-ups|Neutral-Grip Pull-ups|Chin-ups|Muscle-up|Hanging Leg Raises|Hanging Knee Raise|Toes to Bar|Inverted Row)$/;
async function scanWeek(label){
  await page.evaluate(()=>{ const b=[...document.querySelectorAll('.nav-tab')].find(x=>/Schedule/.test(x.innerText)); b.click(); });
  await page.waitForTimeout(1000);
  let bad=[], swaps=[];
  for (const d of ['MON','TUE','WED','THU','FRI','SAT','SUN']) {
    await page.evaluate((dd)=>{ const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim().startsWith(dd)); if(b) b.click(); }, d);
    await page.waitForTimeout(650);
    const t=await page.evaluate(()=>document.body.innerText);
    const plan=(t.match(/\/\/ TODAY'S PLAN[\s\S]*?(?=\/\/ NUTRITION)/i)||[''])[0];
    plan.split('\n').map(x=>x.trim()).forEach(l=>{ if(BAR.test(l)) bad.push(d+':'+l); });
    const m=plan.match(/⇄ travel swap for ([^\n]+)/g); if(m) swaps.push(d+'('+m.length+')');
  }
  console.log(`${label} bar exercises in plan:`, bad.length?[...new Set(bad)]:'NONE ✓');
  console.log(`${label} days with swaps:`, swaps.length?swaps.join(' '):'none');
}
await seed(["BODYWEIGHT"], true);
await scanWeek('A. travel bodyweight-only —');
await page.screenshot({ path:'/tmp/travel-swap.png' });
await seed(["BODYWEIGHT","PULLUP_BAR"], true);
await scanWeek('B. travel + bar/rings —');
await seed(["BODYWEIGHT"], false);
await scanWeek('C. travel OFF (plan untouched) —');
console.log('D. page errors:', errs.length?errs:'none ✓');
await browser.close();
