import pkg from '/opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pkg;
const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless:true, args:['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewportSize({ width:390, height:844 });
const errs=[]; page.on('pageerror', e=>errs.push(e.message.slice(0,140)));
await page.goto('http://localhost:3000/Iron-Realm/', { waitUntil:'domcontentloaded' });
await page.evaluate(()=>{
  const D=d=>Date.now()-d*86400000;
  const w=(d,muscle,name,xp)=>({date:D(d),muscle,xp,exercise:{name,primary:muscle,type:"strength"},exerciseName:name,weight:225,reps:10,sets:3});
  const workouts=[
    w(2,"chest","Bench Press",1200),      // fresh
    w(10,"back","Barbell Row",1000),      // inside grace
    w(35,"glutes","Hip Thrust",1000),     // slipping
    w(70,"bicep","Barbell Curl",900),     // fading
    w(900,"calves","Calf Raise",800),     // detrained / floor
    {date:D(45),muscle:"cardio",xp:600,exercise:{name:"Treadmill Run",primary:"cardio",type:"cardio"},exerciseName:"Treadmill Run",reps:30,sets:1},
  ];
  const store={activeId:"p1",profiles:{p1:{id:"p1",name:"H",gender:"male",goal:"strength",age:25,weightLbs:185,heightIn:72,activityLevel:"moderate",program:"ppl",customSchedule:null,stats:{chest:0,back:0,glutes:0,bicep:0,calves:0,cardio:0},levels:{chest:1,back:1,glutes:1,bicep:1,calves:1,cardio:1},overallXP:0,overallLevel:1,workouts,foodLog:[],customPrograms:[],customExercises:[],prs:{},lastWeightUpdate:null,weightLog:[],bookmarkedExercises:[],dailyRituals:{completionLog:{}},mindLog:[],mindTasks:[],mindTasksLog:{},cosmetics:{unlockedTitles:[],equippedTitle:null},patronLift:null,createdAt:D(250),onboarded:true}},settings:{accentColor:"#00d4ff",accent2Color:"#0044aa",monarchTheme:null,weightUnit:"lbs",weeklyGoal:3,travelMode:false,travelEquipment:["BODYWEIGHT"]}};
  localStorage.setItem("iron_realm_store_v1",JSON.stringify(store));
});
await page.reload({ waitUntil:'networkidle' }); await page.waitForTimeout(1800);
await page.evaluate(()=>{ const b=[...document.querySelectorAll('.nav-tab')].find(x=>/Hunter/.test(x.innerText)); b.click(); });
await page.waitForTimeout(1400);
let t = await page.evaluate(()=>document.body.innerText);
console.log('A. entry button on Character screen:', /CONDITION REPORT/.test(t) ? '✓':'✗');
console.log('B. shows decaying count:', /\d+ decaying →|all fresh →/.test(t) ? '✓':'✗');
await page.evaluate(()=>{ const el=[...document.querySelectorAll('*')].find(e=>/CONDITION REPORT/.test(e.textContent||'')&&e.children.length<4); if(el) el.scrollIntoView({block:'center'}); });
await page.waitForTimeout(400);
await page.evaluate(()=>{ const b=[...document.querySelectorAll('button')].find(x=>/CONDITION REPORT/.test(x.innerText)); b.click(); });
await page.waitForTimeout(900);
t = await page.evaluate(()=>document.body.innerText);
console.log('C. modal opens:', /XP FADED/.test(t) ? '✓':'✗');
for (const s of ['FRESH','HOLDING','SLIPPING','FADING','DETRAINED']) {
  console.log(`   status ${s.padEnd(10)}:`, new RegExp(s).test(t) ? '✓ present' : '– not in this profile');
}
console.log('D. per-muscle condition %:', (t.match(/\d+% condition/g)||[]).length, 'rows');
console.log('E. projection text:', /Another 30 days idle →/.test(t) ? '✓':'✗');
console.log('F. grace explanation:', /grace window — nothing lost yet/.test(t) ? '✓':'✗');
console.log('G. floor note:', /floor — muscle memory holds it here/.test(t) ? '✓':'✗');
console.log('H. XP faded per muscle:', /▼ [\d,]+ XP faded/.test(t) ? '✓':'✗');
// scroll to end of modal
const reach = await page.evaluate(async ()=>{
  const scs=[...document.querySelectorAll('div')].filter(d=>/CONDITION REPORT/.test(d.innerText)&&/auto/.test(getComputedStyle(d).overflowY)&&d.clientHeight<window.innerHeight);
  const sc=scs[scs.length-1]; if(!sc) return 'no scroller';
  sc.scrollTop=999999; await new Promise(r=>setTimeout(r,200));
  return sc.scrollTop >= sc.scrollHeight - sc.clientHeight - 4 ? 'reaches end ✓' : 'cannot reach end ✗';
});
console.log('I. modal scroll:', reach);
await page.evaluate(()=>{ const scs=[...document.querySelectorAll('div')].filter(d=>/CONDITION REPORT/.test(d.innerText)&&/auto/.test(getComputedStyle(d).overflowY)&&d.clientHeight<window.innerHeight); const sc=scs[scs.length-1]; if(sc) sc.scrollTop=0; });
await page.waitForTimeout(400);
await page.screenshot({ path:'/tmp/condition-report.png' });
console.log('J. page errors:', errs.length?errs:'none ✓');
await browser.close();
