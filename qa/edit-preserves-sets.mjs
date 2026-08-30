import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewportSize({ width:390, height:844 });
const errs=[]; page.on('pageerror', e=>errs.push(e.message.slice(0,130)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil:'domcontentloaded' });
// seed a logged entry on MON: 1 set, 12 reps @ 130 (the user's exact example)
await page.evaluate(()=>{
  const now=new Date(); const day=(now.getDay()+6)%7; const monday=new Date(now); monday.setDate(now.getDate()-day); monday.setHours(12,0,0,0);
  const entry={ date:monday.getTime(), muscle:"chest", xp:120, exercise:{name:"Bench Press",primary:"chest",type:"strength"},
    exerciseName:"Bench Press", sets:1, reps:12, weight:130, sets_detail:[{weight:130,reps:12}], newE1RM:182 };
  const store={activeId:"p1",profiles:{p1:{id:"p1",name:"H",gender:"male",goal:"strength",age:25,weightLbs:185,heightIn:72,activityLevel:"moderate",program:"ppl",customSchedule:null,stats:{chest:0},levels:{chest:1},overallXP:0,overallLevel:5,workouts:[entry],foodLog:[],customPrograms:[],customExercises:[],prs:{},lastWeightUpdate:null,weightLog:[],bookmarkedExercises:[],dailyRituals:{completionLog:{}},mindLog:[],mindTasks:[],mindTasksLog:{},cosmetics:{unlockedTitles:[],equippedTitle:null},patronLift:null,createdAt:Date.now()-9e9,onboarded:true}},settings:{accentColor:"#00d4ff",accent2Color:"#0044aa",monarchTheme:null,weightUnit:"lbs",weeklyGoal:3,travelMode:false,travelEquipment:["BODYWEIGHT"]}};
  localStorage.setItem("iron_realm_store_v1",JSON.stringify(store));
});
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1700);
await page.evaluate(()=>{ const b=[...document.querySelectorAll('.nav-tab')].find(x=>/Schedule/.test(x.innerText)); b.click(); });
await page.waitForTimeout(1000);
await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim().startsWith('MON')); b.click(); });
await page.waitForTimeout(900);
const before = await page.evaluate(()=>JSON.parse(localStorage.getItem('iron_realm_store_v1')).profiles.p1.workouts.length);
console.log('A. entries before edit:', before);
// tap EDIT
await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>x.innerText.trim()==='EDIT'); b.scrollIntoView({block:'center'}); b.click(); });
await page.waitForTimeout(1000);
const prefill = await page.evaluate(()=>{
  const ins=[...document.querySelectorAll('input[type=number]')].filter(i=>i.clientHeight>0);
  return ins.map(i=>i.value);
});
console.log('B. modal inputs prefilled:', JSON.stringify(prefill));
console.log('C. shows 12 reps @ 130:', prefill.includes('12')&&prefill.includes('130') ? '✓':'✗ ORIGINAL SETS LOST');
await page.screenshot({ path:'/tmp/edit-modal.png' });
// confirm the edit unchanged -> entry must survive intact
const btn = await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>/LOG \d+ SETS?/.test(x.innerText)); return b? b.innerText.trim():'NONE'; });
console.log('D. confirm button:', btn);
await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>/LOG \d+ SETS?/.test(x.innerText)); if(b) b.click(); });
await page.waitForTimeout(1400);
const after = await page.evaluate(()=>{ const p=JSON.parse(localStorage.getItem('iron_realm_store_v1')).profiles.p1;
  const w=p.workouts[p.workouts.length-1]; return { n:p.workouts.length, sets:w?.sets_detail, xp:w?.xp }; });
console.log('E. after confirming edit:', JSON.stringify(after));
console.log('F. set preserved (12 @ 130):', after.sets?.[0]?.reps==12 && after.sets?.[0]?.weight==130 ? '✓':'✗');
console.log('G. no duplicate entry:', after.n===before ? '✓':`✗ ${after.n} vs ${before}`);
console.log('H. page errors:', errs.length?errs:'none ✓');
await browser.close();
