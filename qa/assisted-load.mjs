import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewportSize({ width:390, height:844 });
const errs=[]; page.on('pageerror', e=>errs.push(e.message.slice(0,130)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil:'domcontentloaded' });
await page.evaluate(()=>{ const now=Date.now();
  const store={activeId:"p1",profiles:{p1:{id:"p1",name:"H",gender:"male",goal:"strength",age:25,weightLbs:185,heightIn:72,activityLevel:"moderate",program:"ppl",customSchedule:null,stats:{back:0},levels:{back:1},overallXP:0,overallLevel:9,workouts:[],foodLog:[],customPrograms:[],customExercises:[],prs:{},lastWeightUpdate:null,weightLog:[],bookmarkedExercises:[],dailyRituals:{completionLog:{}},mindLog:[],mindTasks:[],mindTasksLog:{},cosmetics:{unlockedTitles:[],equippedTitle:null},patronLift:null,createdAt:now,onboarded:true}},settings:{accentColor:"#00d4ff",accent2Color:"#0044aa",monarchTheme:null,weightUnit:"lbs",weeklyGoal:3,travelMode:false,travelEquipment:["BODYWEIGHT","PULLUP_BAR"]}};
  localStorage.setItem("iron_realm_store_v1",JSON.stringify(store)); });
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1700);
async function clickText(re,t=8000){const t0=Date.now();while(Date.now()-t0<t){const d=await page.evaluate(s=>{const re=new RegExp(s);const c=[...document.querySelectorAll('button,div,span')].filter(x=>re.test((x.innerText||'').trim())&&x.clientHeight>0&&x.clientHeight<140);const b=c[c.length-1];if(b){b.click();return true}return false},re.source);if(d)return true;await page.waitForTimeout(200);}throw new Error('nf '+re);}
await page.evaluate(()=>{ const b=[...document.querySelectorAll('.nav-tab')].find(x=>/Schedule/.test(x.innerText)); b.click(); });
await page.waitForTimeout(1000);
await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim().startsWith('MON')); b.click(); });
await page.waitForTimeout(900);
await clickText(/LOG EXERCISE/); await page.waitForTimeout(700);
await clickText(/^Back$/); await page.waitForTimeout(800);
await page.evaluate(()=>{ const els=[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&e.textContent.trim()==='Pull-ups'); const t=els[els.length-1]; t.scrollIntoView({block:'center'}); (t.closest('button')||t.parentElement).click(); });
await page.waitForTimeout(1000);
let t = await page.evaluate(()=>document.body.innerText);
console.log('A. column header teaches sign:', /ADDED \/ −ASSIST/.test(t) ? '✓':'✗');
console.log('B. explainer line present:', /machine\s+assistance as a negative/.test(t.replace(/\s+/g,' ')) ? '✓':'✗');
// enter 8 reps with -60 assist
const boxes = await page.locator('input[type=number]:visible').all();
const modal = boxes.slice(-2*3); // 3 set rows x (reps,weight) at the end
await modal[0].fill('8'); await modal[1].fill('-60');
await page.waitForTimeout(600);
t = await page.evaluate(()=>document.body.innerText);
console.log('C. effective-load readout:', (t.match(/assisted — lifting [^\n]*/)||['MISSING'])[0]);
const xp1 = (t.match(/LOG \d+ SETS?[\s\S]{0,60}?([\d,]+) XP/)||[])[1] || (t.match(/([\d,]+) XP/)||[])[1];
console.log('D. XP with assist:', xp1);
// over-assist guard
await modal[1].fill('-400'); await page.waitForTimeout(600);
t = await page.evaluate(()=>document.body.innerText);
console.log('E. over-assist clamps (no negative):', (t.match(/assisted — lifting [^\n]*/)||['MISSING'])[0]);
// log it and confirm positive XP stored, same exercise name
await modal[1].fill('-60'); await page.waitForTimeout(400);
await clickText(/LOG [1-9]\d* SETS?/); await page.waitForTimeout(1300);
const p = await page.evaluate(()=>JSON.parse(localStorage.getItem('iron_realm_store_v1')).profiles.p1);
const last = p.workouts[p.workouts.length-1];
console.log('F. logged as:', JSON.stringify({name:last?.exerciseName, sets:last?.sets_detail?.length, w:last?.sets_detail?.[0]?.weight, xp:last?.xp}));
console.log('G. same exercise (not a new one):', last?.exerciseName === 'Pull-ups' ? '✓':'✗');
console.log('H. XP positive:', last?.xp > 0 ? '✓':'✗');
console.log('I. back stat positive:', p.stats.back > 0 ? `✓ ${p.stats.back}`:'✗');
await page.screenshot({ path:'/tmp/assist-modal.png' });
console.log('J. page errors:', errs.length?errs:'none ✓');
await browser.close();
