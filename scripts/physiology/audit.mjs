// Physiology audit — prints what the XP engine awards for a 5'6", 220 lb hunter.
//
//   node scripts/physiology/audit.mjs
//
// Loads src/data/*.js straight from source (they are dependency-free ES
// modules) and mirrors calcSetXP / calcSetStim from iron-realm.jsx, so the
// tables below are the numbers the app produces. Re-run after touching
// data/progression.js or data/exercises.js; the sections are:
//   A. routing coverage (every non-cardio lift has a muscle-share profile)
//   B. muscle XP + kcal per set for representative sets, with RPE and load
//   C. body-mass independence of muscle XP (150 lb vs 220 lb hunter)
//   D. weekly-volume discount   E. level timeline   F. detraining curve
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const load = async (f) => import("data:text/javascript;base64," + Buffer.from(readFileSync(join(here, "../../src/data", f), "utf8")).toString("base64"));
const { EXERCISE_DB, SVG_TO_STAT, emgFor, bodyweightFraction } = await load("exercises.js");
const { MET_VALUES, MUSCLE_THRESHOLDS, ATROPHY, STIM, effortFactor, loadFactor, repFactor, volumeFactor, WORK_KCAL_PER_KG_REP, ageDetrainingFactor } = await load("progression.js");
const epley=(w,r)=>(r<1||r>12)?null:w*(1+r/30);
function effCali(bw,w,ex){ const f=ex?bodyweightFraction(ex):1; return Math.max(bw*.1, bw*(f||1)+(w||0)); }
function kcal(ex,reps,w,bw){ const bk=bw*.453592; if(ex.iso){const t=ex.type==="strength"?MET_VALUES.strength:MET_VALUES.calisthenics; return Math.round((t[ex.diff]||5.5)*bk*reps/3600);} if(ex.type==="calisthenics"){ return Math.round((MET_VALUES.calisthenics[ex.diff]||5.5)*bk*reps*4/3600 + effCali(bw,w,ex)*.453592*reps*WORK_KCAL_PER_KG_REP);} return Math.round((MET_VALUES.strength[ex.diff]||5)*bk*reps*6/3600 + Math.max(0,w)*.453592*reps*WORK_KCAL_PER_KG_REP); }
function rir(ex,reps,w,e1,rpe){ if(rpe) return Math.max(0,10-rpe); if(ex.type!=="calisthenics"&&e1>0&&w>0){ return Math.max(0,Math.min(10,(e1/w-1)*30-reps)); } return STIM.DEFAULT_RIR; }
function stim(ex,set,bw,e1){ const reps=set.reps, w=set.weight||0; if(reps<=0) return 0; const eff=effortFactor(rir(ex,reps,w,e1,set.rpe)); if(ex.iso){ if(reps<STIM.ISO_MIN_SECONDS) return 0; return STIM.SET*Math.min(STIM.ISO_MAX_SETS,reps/STIM.ISO_SECONDS_PER_SET)*eff; } let pct=null; if(ex.type==="calisthenics"){ if(w<0){ pct=effCali(bw,w,ex)/(bw*(bodyweightFraction(ex)||1)); } } else if(e1>0&&w>0) pct=w/e1; let s=STIM.SET*loadFactor(pct)*repFactor(reps)*eff; if(ex.type!=="calisthenics"&&e1>0){ const e=epley(w,reps); if(e&&e>e1) s*=STIM.PR_BONUS;} return s; }
function shares(ex,muscle){ const emg=emgFor(ex); const by={}; const t=Object.values(emg).reduce((a,b)=>a+b,0); for(const [id,a] of Object.entries(emg)){ const st=SVG_TO_STAT[id]||muscle; by[st]=(by[st]||0)+a/t;} return by; }
const all=[]; for (const [grp,list] of Object.entries(EXERCISE_DB)) for (const ex of list) all.push({grp,...ex});
const BW=220; const find=n=>all.find(e=>e.name===n);
const fmt=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${Math.round(v*100)}%`).join(", ");

console.log("== A. Routing coverage ==");
console.log("  exercises:",all.length," with a profile now:",all.filter(e=>e.type!=="cardio"&&emgFor(e)).length," (non-cardio total",all.filter(e=>e.type!=="cardio").length+")");
for (const n of ["Bench Press","Dumbbell Bench Press","Barbell Back Squat","Bodyweight Squat","Wide-Grip Pull-ups","Tricep Dips","Hanging Leg Raises","Hip Thrust","Deadlift"]) console.log(`  ${n.padEnd(22)} ${fmt(shares(find(n),find(n).primary))}`);

console.log("\n== B. Muscle XP per set — 220 lb hunter (no RPE logged, prior best on file) ==");
const rows=[
 ["Bench Press",{reps:10,weight:135},175],["Bench Press",{reps:10,weight:45},175],["Bench Press",{reps:10,weight:135},null],["Bench Press",{reps:10,weight:135,rpe:10},175],["Bench Press",{reps:10,weight:135,rpe:6},175],["Bench Press",{reps:3,weight:165},175],["Bench Press",{reps:10,weight:30},175],
 ["Push-ups",{reps:10,weight:0},null],["Push-ups",{reps:10,weight:0,rpe:9},null],["Pull-ups",{reps:5,weight:-90},null],["Pull-ups",{reps:5,weight:-190},null],["Plank",{reps:60,weight:0},null],["Plank",{reps:8,weight:0},null],["L-Sit",{reps:20,weight:0},null],
 ["Barbell Back Squat",{reps:8,weight:185},230],["Bodyweight Squat",{reps:20,weight:0},null],["Lateral Raises",{reps:15,weight:15},22],
];
for (const [n,set,e1] of rows){ const ex=find(n); const s=stim(ex,set,BW,e1); const sh=shares(ex,ex.primary); const prim=Object.entries(sh).sort((a,b)=>b[1]-a[1])[0]; console.log(`  ${n.padEnd(19)} ${String(set.reps).padStart(3)}${ex.iso?"s":"r"} @ ${String(set.weight).padStart(4)} lb${set.rpe?` RPE${set.rpe}`:"     "}${e1?` (PR ${e1})`:"         "} → ${s.toFixed(1).padStart(5)} stim · ${prim[0]} gets ${(s*prim[1]).toFixed(1)} · kcal ${kcal(ex,set.reps,set.weight,BW)}`); }

console.log("\n== C. Same set, 150 lb vs 220 lb hunter ==");
for (const [n,set] of [["Bench Press",{reps:10,weight:135}],["Push-ups",{reps:10,weight:0}],["Bodyweight Squat",{reps:15,weight:0}]]) { const ex=find(n); console.log(`  ${n.padEnd(17)} stim 150: ${stim(ex,set,150,null).toFixed(1)}  220: ${stim(ex,set,220,null).toFixed(1)}   kcal 150: ${kcal(ex,set.reps,set.weight,150)}  220: ${kcal(ex,set.reps,set.weight,220)}`); }
console.log("  cardio stim 30 min walk 3.5 MET:", Math.round(30*3.5/7), "| 30 min run 10 MET:", Math.round(30*10/7), "| kcal walk 220 lb:", Math.round(3.5*99.8*.5));

console.log("\n== D. Weekly volume discount ==", [0,9,10,19,20,29,30].map(s=>`${s} sets→×${volumeFactor(s)}`).join(" "));

console.log("\n== E. Level timeline at 12 hard sets/wk to a muscle (avg share .7 → 84 XP/wk) ==");
let cum=0; const out=[]; for(let l=1;l<=40;l++){ cum+=MUSCLE_THRESHOLDS[l-1]; if([2,3,4,5,7,10,12,20,30,40].includes(l+1)) out.push(`L${l+1}: ${cum} XP ≈ ${(cum/84).toFixed(0)} wk (${(cum/84/52).toFixed(1)} y)`);} console.log("  "+out.join("\n  "));
console.log("  threshold L1→2:", MUSCLE_THRESHOLDS[0], " L9→10:", MUSCLE_THRESHOLDS[8], " L29→30:", MUSCLE_THRESHOLDS[28]);

console.log("\n== F. Detraining: % of muscle XP lost after N idle days ==");
function decay(c,gap,p){ const d=Math.max(0,gap-p.grace); return d<=0?c:p.floor+(c-p.floor)*Math.exp(-Math.LN2*d/p.halfLife); }
for (const [k,p] of Object.entries({muscular:ATROPHY.muscular,cardio:ATROPHY.cardio})) console.log(`  ${k.padEnd(9)}`, [14,21,28,56,84,182,365,730].map(d=>`${d}d ${Math.round((1-decay(1,d,p))*100)}%`).join(" | "));
const p65={...ATROPHY.muscular, halfLife: ATROPHY.muscular.halfLife*ageDetrainingFactor(65)}; console.log("  muscular@65", [28,84,182,365].map(d=>`${d}d ${Math.round((1-decay(1,d,p65))*100)}%`).join(" | "));
console.log("  regain: one full-share session after 6 months idle →", (()=>{const c=decay(1,182,ATROPHY.muscular); return `${Math.round(c*100)}% → ${Math.round((c+ATROPHY.REGAIN*(1-c))*100)}%`;})());
