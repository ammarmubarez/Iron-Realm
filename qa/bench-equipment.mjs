import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewportSize({ width:390, height:844 });
const errs=[]; page.on('pageerror', e=>errs.push(e.message.slice(0,130)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil:'domcontentloaded' });
async function seed(equip){ await page.evaluate((equip)=>{
  const now=Date.now();
  const store={activeId:"p1",profiles:{p1:{id:"p1",name:"H",gender:"male",goal:"strength",age:25,weightLbs:185,heightIn:72,activityLevel:"moderate",program:"ppl",customSchedule:null,stats:{chest:0},levels:{chest:1},overallXP:0,overallLevel:9,workouts:[],foodLog:[],customPrograms:[],customExercises:[],prs:{},lastWeightUpdate:null,weightLog:[],bookmarkedExercises:[],dailyRituals:{completionLog:{}},mindLog:[],mindTasks:[],mindTasksLog:{},cosmetics:{unlockedTitles:[],equippedTitle:null},patronLift:null,createdAt:now,onboarded:true}},settings:{accentColor:"#00d4ff",accent2Color:"#0044aa",monarchTheme:null,weightUnit:"lbs",weeklyGoal:3,travelMode:true,travelEquipment:equip}};
  localStorage.setItem("iron_realm_store_v1",JSON.stringify(store)); }, equip);
  await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1600); }
async function clickText(re,t=8000){const t0=Date.now();while(Date.now()-t0<t){const d=await page.evaluate(s=>{const re=new RegExp(s);const c=[...document.querySelectorAll('button,div,span')].filter(x=>re.test((x.innerText||'').trim())&&x.clientHeight>0&&x.clientHeight<140);const b=c[c.length-1];if(b){b.click();return true}return false},re.source);if(d)return true;await page.waitForTimeout(200);}throw new Error('nf '+re);}
async function dbList(muscle){
  await page.evaluate(()=>{ const b=[...document.querySelectorAll('.nav-tab')].find(x=>/Database/.test(x.innerText)); b.click(); });
  await page.waitForTimeout(900);
  await page.evaluate((m)=>{ const p=[...document.querySelectorAll('button,div,span')].filter(x=>x.clientHeight>0&&x.clientHeight<60&&(x.innerText||'').trim()===m); const b=p[p.length-1]; if(b) b.click(); }, muscle);
  await page.waitForTimeout(900);
  return page.evaluate(()=>document.body.innerText);
}
// A: settings shows the new toggle
await seed(["BODYWEIGHT","DUMBBELL"]);
await page.locator('button:has(svg circle)').first().click(); await page.waitForTimeout(700);
await page.evaluate(()=>{ const el=[...document.querySelectorAll('*')].find(e=>/EQUIPMENT AVAILABLE/.test(e.textContent||'')&&e.children.length<4); if(el) el.scrollIntoView({block:'center'}); });
await page.waitForTimeout(400);
let t = await page.evaluate(()=>document.body.innerText);
console.log('A. Bench toggle in settings:', /Bench \/ chair \/ step/.test(t) ? '✓':'✗');
console.log('B. bodyweight relabelled:', /Bodyweight \(floor & wall only\)/.test(t) ? '✓':'✗');
await page.screenshot({ path:'/tmp/bench-settings.png' });
await page.locator('button').filter({ hasText:'×' }).last().click().catch(()=>{}); await page.waitForTimeout(400);

// C: dumbbells but NO bench -> bench work filtered out
const noBench = await dbList('Chest');
const BENCHY = ['Dumbbell Bench Press','Incline Dumbbell Press','Dumbbell Flyes','Decline Push-ups','Incline Push-ups'];
const leaked = BENCHY.filter(n => new RegExp(n).test(noBench));
console.log('C. dumbbells, NO bench — bench exercises hidden:', leaked.length? leaked : 'ALL HIDDEN ✓');
console.log('D. floor alternatives still offered:', /Floor Press|Push-ups/.test(noBench) ? '✓':'✗');

// E: add bench -> they return
await seed(["BODYWEIGHT","BENCH","DUMBBELL"]);
const withBench = await dbList('Chest');
console.log('E. with bench — they return:', /Dumbbell Bench Press/.test(withBench)&&/Dumbbell Flyes/.test(withBench) ? '✓':'✗');

// F: floor exercise must NOT be gated by bench (false-positive guard)
await seed(["BODYWEIGHT"]);
const core = await dbList('Core');
console.log('F. Lying Leg Raise (floor) still available without bench:', /Lying Leg Raise/.test(core) ? '✓':'✗');
console.log('G. Decline Sit-up (needs bench) hidden:', !/Decline Sit-up/.test(core) ? '✓':'✗');

// H: machines exempt — gym profile without BENCH keeps machine work
await seed(["MACHINE","CABLE"]);
const mach = await dbList('Chest');
console.log('H. machines exempt from bench gate:', /Chest Press Machine|Incline Chest Press Machine/.test(mach) ? '✓':'✗');
console.log('I. page errors:', errs.length?errs:'none ✓');
await browser.close();
