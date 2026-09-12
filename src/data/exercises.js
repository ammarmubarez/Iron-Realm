// The exercise database and equipment classification. Activation profiles
// are in ./emg.js. Pure data — imports only sibling data modules.

// ─── EXERCISE DB ──────────────────────────────────────────────────────────────
// Activation profiles live in ./emg.js (one per exercise, literature-based).
import { EXERCISE_EMG } from "./emg";
export { EXERCISE_EMG };

// SVG muscle ID → parent stat group (for XP routing)
export const SVG_TO_STAT = {
  "upper-pectoralis":"chest","mid-lower-pectoralis":"chest",
  "lats":"back","lowerback":"back","upper-trapezius":"back","traps-middle":"back","lower-trapezius":"back",
  "anterior-deltoid":"shoulders","lateral-deltoid":"shoulders","posterior-deltoid":"shoulders",
  "short-head-bicep":"bicep","long-head-bicep":"bicep",
  "medial-head-triceps":"tricep","long-head-triceps":"tricep","lateral-head-triceps":"tricep","later-head-triceps":"tricep",
  "wrist-flexors":"forearms","wrist-extensors":"forearms",
  "upper-abdominals":"core","lower-abdominals":"core","obliques":"core",
  "gluteus-maximus":"glutes","gluteus-medius":"glutes",
  "outer-quadricep":"legs","rectus-femoris":"legs","inner-quadricep":"legs","inner-thigh":"legs",
  "lateral-hamstrings":"legs","medial-hamstrings":"legs","gastrocnemius":"calves","soleus":"calves","tibialis":"calves",
  "serratus-anterior":"chest","infraspinatus":"shoulders","brachialis":"bicep","brachioradialis":"forearms","hip-flexors":"core",
};

export const EXERCISE_DB = {
  // svgTargets use exact SVG IDs from the anatomy figures
  // EMG activation ratios sourced from Schoenfeld (2010), ACE muscle activation studies,
  // Bret Contreras EMG research, and NSCA Exercise Technique Manual

  chest: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Bench Press", angle: "Flat (0°)",                  diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps","long-head-triceps","serratus-anterior"] },
    { name: "Incline Bench Press", angle: "30–45°",          diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","mid-lower-pectoralis","lateral-head-triceps","medial-head-triceps","serratus-anterior","long-head-triceps"] },
    { name: "Decline Bench Press", angle: "15–30°",          diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","upper-pectoralis","medial-head-triceps","anterior-deltoid","long-head-triceps"] },
    { name: "Close-Grip Bench Press",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["lateral-head-triceps","medial-head-triceps","mid-lower-pectoralis","long-head-triceps","anterior-deltoid","upper-pectoralis"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Bench Press", angle: "Flat (0°)",         diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps","serratus-anterior","long-head-triceps"] },
    { name: "Incline Dumbbell Press", angle: "30–45°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","mid-lower-pectoralis","lateral-head-triceps","serratus-anterior","medial-head-triceps","long-head-triceps"] },
    { name: "Decline Dumbbell Press", angle: "15–30°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","anterior-deltoid","medial-head-triceps","long-head-triceps"] },
    { name: "Dumbbell Flyes", angle: "Flat (0°)",               diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Incline Dumbbell Flyes", angle: "30–45°",       diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","mid-lower-pectoralis","anterior-deltoid","serratus-anterior"] },
    { name: "Decline Dumbbell Flyes", angle: "15–30°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Dumbbell Pullover",            diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lats","long-head-triceps","upper-pectoralis","serratus-anterior"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Pec Deck Machine",             diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Chest Press Machine",          diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Incline Chest Press Machine", angle: "30–45°",  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","mid-lower-pectoralis","lateral-head-triceps","medial-head-triceps","serratus-anterior","long-head-triceps"] },
    { name: "Decline Chest Press Machine", angle: "15–30°",  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","medial-head-triceps","anterior-deltoid","long-head-triceps"] },
    { name: "Cable Crossover",              diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","serratus-anterior"] },
    { name: "Low Cable Fly", angle: "Cable set at bottom",                diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","mid-lower-pectoralis","anterior-deltoid","serratus-anterior"] },
    { name: "High Cable Fly", angle: "Cable set at top",               diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Smith Machine Bench Press",    diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","anterior-deltoid","medial-head-triceps","long-head-triceps"] },
    { name: "Converging Chest Press Machine", diff: "beginner",  type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps","long-head-triceps","serratus-anterior"] },
    { name: "Fly Machine",                  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Landmine Press",               diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","mid-lower-pectoralis","lateral-head-triceps","serratus-anterior","medial-head-triceps","long-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Push-ups",                     diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","anterior-deltoid","medial-head-triceps","serratus-anterior","long-head-triceps"] },
    { name: "Wide Push-ups",                diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps","serratus-anterior","long-head-triceps"] },
    { name: "Diamond Push-ups",             diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["lateral-head-triceps","medial-head-triceps","mid-lower-pectoralis","long-head-triceps","upper-pectoralis","anterior-deltoid","serratus-anterior"] },
    { name: "Decline Push-ups",             diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["upper-pectoralis","mid-lower-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps","serratus-anterior","long-head-triceps","upper-abdominals"] },
    { name: "Shoulder Tap Push-ups",        diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","obliques","medial-head-triceps","serratus-anterior","upper-abdominals","lower-abdominals","long-head-triceps"] },
    { name: "Incline Push-ups",             diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","anterior-deltoid","medial-head-triceps","serratus-anterior","long-head-triceps"] },
    { name: "Dips",                         diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","anterior-deltoid","medial-head-triceps","long-head-triceps","upper-pectoralis","serratus-anterior"] },
    { name: "Archer Push-ups",              diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","upper-pectoralis","medial-head-triceps","anterior-deltoid","long-head-triceps","serratus-anterior","obliques","upper-abdominals"] },
    { name: "Clap Push-ups",                diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","upper-pectoralis","anterior-deltoid","medial-head-triceps","serratus-anterior","long-head-triceps","upper-abdominals","lower-abdominals"] },
    { name: "Ring Push-ups",                diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps","serratus-anterior","long-head-triceps","upper-abdominals","lower-abdominals","obliques"] },
    { name: "Svend Press",                  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","serratus-anterior"] },
    { name: "Cable Fly",                    diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","serratus-anterior"] },
    { name: "Hex Press",                    diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","medial-head-triceps","anterior-deltoid","long-head-triceps"] },
    { name: "Floor Press", angle: "Flat on floor",                  diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["lateral-head-triceps","mid-lower-pectoralis","medial-head-triceps","long-head-triceps","upper-pectoralis","anterior-deltoid"] },
    { name: "Squeeze Press",                diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","medial-head-triceps","anterior-deltoid","long-head-triceps"] },
    { name: "Single Arm Cable Fly",         diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","serratus-anterior","obliques"] },
    { name: "Pseudo Planche Push-up",       diff: "elite",        type: "calisthenics", primary: "chest",     svgTargets: ["anterior-deltoid","mid-lower-pectoralis","upper-pectoralis","lateral-head-triceps","medial-head-triceps","serratus-anterior","long-head-triceps","upper-abdominals","lower-abdominals","obliques","wrist-flexors"] },
    { name: "Resistance Band Fly",          diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","serratus-anterior"] },
  ],

  back: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Deadlift",                     diff: "elite",        type: "strength",     primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings","lateral-hamstrings","outer-quadricep","upper-trapezius","inner-quadricep","traps-middle","lats","wrist-flexors","rectus-femoris","obliques"] },
    { name: "Barbell Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","posterior-deltoid","lower-trapezius","lowerback","long-head-bicep","short-head-bicep","brachialis","upper-trapezius","infraspinatus","brachioradialis","wrist-flexors"] },
    { name: "Pendlay Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","posterior-deltoid","lower-trapezius","long-head-bicep","lowerback","short-head-bicep","infraspinatus","brachialis","upper-trapezius","brachioradialis","wrist-flexors"] },
    { name: "Sumo Deadlift",                diff: "elite",        type: "strength",     primary: "back",      svgTargets: ["gluteus-maximus","inner-thigh","inner-quadricep","outer-quadricep","lowerback","gluteus-medius","medial-hamstrings","upper-trapezius","lateral-hamstrings","traps-middle","wrist-flexors"] },
    { name: "Rack Pull",                    diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lowerback","upper-trapezius","gluteus-maximus","traps-middle","medial-hamstrings","lats","lateral-hamstrings","wrist-flexors"] },
    { name: "Good Mornings",                diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lowerback","medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Row",                 diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","posterior-deltoid","lower-trapezius","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis","wrist-flexors","obliques","lowerback"] },
    { name: "Dumbbell Pullover",            diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["mid-lower-pectoralis","lats","long-head-triceps","upper-pectoralis","serratus-anterior"] },
    { name: "Chest Supported Row", angle: "30–45° prone",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lats","lower-trapezius","posterior-deltoid","long-head-bicep","infraspinatus","short-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Shrugs",                       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["upper-trapezius","traps-middle","wrist-flexors"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Lat Pulldown",                 diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-bicep","lower-trapezius","short-head-bicep","brachialis","traps-middle","posterior-deltoid","infraspinatus","brachioradialis","wrist-flexors"] },
    { name: "Wide-Grip Lat Pulldown",       diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","traps-middle","posterior-deltoid","long-head-bicep","infraspinatus","short-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Reverse-Grip Lat Pulldown",    diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","short-head-bicep","long-head-bicep","brachialis","lower-trapezius","traps-middle","infraspinatus","brachioradialis","posterior-deltoid","wrist-flexors"] },
    { name: "Seated Cable Row",             diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis","wrist-flexors","lowerback"] },
    { name: "Wide-Grip Cable Row",          diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["traps-middle","posterior-deltoid","lower-trapezius","lats","infraspinatus","long-head-bicep","brachialis","short-head-bicep","brachioradialis"] },
    { name: "T-Bar Row",                    diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","lowerback","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis","wrist-flexors"] },
    { name: "Machine Row",                  diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lats","lower-trapezius","posterior-deltoid","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis"] },
    { name: "Cable Straight-Arm Pulldown",  diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-triceps","mid-lower-pectoralis","posterior-deltoid","serratus-anterior","lower-trapezius","infraspinatus"] },
    { name: "Face Pulls",                   diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["posterior-deltoid","traps-middle","infraspinatus","lower-trapezius","upper-trapezius","lateral-deltoid"] },
    { name: "Back Extension Machine", angle: "45° or 90°",       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings","lateral-hamstrings"] },
    { name: "Back Extension (45°)", angle: "45°",         diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings","lateral-hamstrings"] },
    { name: "Smith Machine Shrug",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["upper-trapezius","traps-middle","wrist-flexors"] },
    { name: "Chest Supported Row Machine",  diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lats","lower-trapezius","posterior-deltoid","long-head-bicep","infraspinatus","short-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Iso-Lateral Row Machine",      diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis"] },
    { name: "Lever Pullover Machine",       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","mid-lower-pectoralis","long-head-triceps","upper-pectoralis","serratus-anterior","posterior-deltoid","lower-trapezius"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Pull-ups",                     diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","long-head-bicep","lower-trapezius","infraspinatus","short-head-bicep","brachialis","brachioradialis","traps-middle","posterior-deltoid","wrist-flexors","mid-lower-pectoralis"] },
    { name: "Wide-Grip Pull-ups",           diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","lower-trapezius","traps-middle","posterior-deltoid","infraspinatus","long-head-bicep","brachioradialis","short-head-bicep","brachialis","wrist-flexors","mid-lower-pectoralis"] },
    { name: "Chin-ups",                     diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","short-head-bicep","long-head-bicep","brachialis","lower-trapezius","infraspinatus","brachioradialis","traps-middle","mid-lower-pectoralis","wrist-flexors","posterior-deltoid"] },
    { name: "Neutral-Grip Pull-ups",        diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","long-head-bicep","brachialis","short-head-bicep","brachioradialis","lower-trapezius","infraspinatus","traps-middle","wrist-flexors","posterior-deltoid","mid-lower-pectoralis"] },
    { name: "Inverted Row",                 diff: "intermediate", type: "calisthenics", primary: "back",      svgTargets: ["traps-middle","lats","posterior-deltoid","lower-trapezius","short-head-bicep","long-head-bicep","brachialis","infraspinatus","brachioradialis","wrist-flexors"] },
    { name: "Scapular Pull-ups",            diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lower-trapezius","lats","traps-middle","wrist-flexors","serratus-anterior","brachioradialis"] },
    { name: "Superman",                     diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lowerback","gluteus-maximus","traps-middle","lower-trapezius","posterior-deltoid","medial-hamstrings","lateral-hamstrings"] },
    { name: "Meadows Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","posterior-deltoid","lower-trapezius","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis","wrist-flexors","obliques"] },
    { name: "Kroc Row",                     diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","posterior-deltoid","lower-trapezius","long-head-bicep","wrist-flexors","short-head-bicep","brachialis","brachioradialis","infraspinatus","upper-trapezius","obliques"] },
    { name: "Seal Row", angle: "Flat bench, prone",                     diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["traps-middle","lats","lower-trapezius","posterior-deltoid","long-head-bicep","infraspinatus","short-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Cable Row (Single Arm)",       diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis","obliques","wrist-flexors"] },
    { name: "Banded Pull-apart",            diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["posterior-deltoid","traps-middle","infraspinatus","lower-trapezius","lateral-deltoid"] },
    { name: "Resistance Band Row",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep","short-head-bicep","brachialis","infraspinatus","brachioradialis"] },
    { name: "Straight Arm Cable Pulldown",  diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-triceps","mid-lower-pectoralis","posterior-deltoid","serratus-anterior","lower-trapezius","infraspinatus"] },
    { name: "Neutral Grip Lat Pulldown",    diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-bicep","brachialis","short-head-bicep","lower-trapezius","traps-middle","brachioradialis","infraspinatus","posterior-deltoid","wrist-flexors"] },
    { name: "Jefferson Curl",               diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lowerback","medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    { name: "Hyperextension",               diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings","lateral-hamstrings"] },
  ],

  shoulders: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Overhead Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps","long-head-triceps","serratus-anterior","upper-pectoralis","lowerback"] },
    { name: "Push Press",                   diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","upper-trapezius","lateral-deltoid","medial-head-triceps","outer-quadricep","lateral-head-triceps","long-head-triceps","rectus-femoris","inner-quadricep","serratus-anterior","gluteus-maximus","gastrocnemius","lowerback"] },
    { name: "Behind-the-Neck Press",        diff: "elite",        type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","anterior-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps","posterior-deltoid","long-head-triceps","infraspinatus","serratus-anterior"] },
    { name: "Upright Row",                  diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","anterior-deltoid","posterior-deltoid","short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Shoulder Press",      diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","lateral-head-triceps","serratus-anterior","long-head-triceps","upper-pectoralis"] },
    { name: "Arnold Press", angle: "90° upright",                 diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","serratus-anterior","lateral-head-triceps","posterior-deltoid","long-head-triceps","infraspinatus","upper-pectoralis"] },
    { name: "Lateral Raises",               diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","anterior-deltoid","infraspinatus","posterior-deltoid"] },
    { name: "Front Raises",                 diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-pectoralis","serratus-anterior","upper-trapezius"] },
    { name: "Bent-Over Rear Delt Raise",    diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","infraspinatus","lower-trapezius","lateral-deltoid"] },
    { name: "Scaption",                     diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","serratus-anterior","infraspinatus"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Machine Shoulder Press", angle: "90° upright",       diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","lateral-head-triceps","upper-trapezius","long-head-triceps","serratus-anterior"] },
    { name: "Cable Lateral Raise",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","anterior-deltoid","infraspinatus","posterior-deltoid"] },
    { name: "Cable Front Raise",            diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-pectoralis","serratus-anterior","upper-trapezius"] },
    { name: "Cable Rear Delt Fly",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","infraspinatus","lower-trapezius","lateral-deltoid"] },
    { name: "Pec Deck Reverse Fly",         diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","infraspinatus","lower-trapezius","lateral-deltoid"] },
    { name: "Machine Lateral Raise",        diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","anterior-deltoid","infraspinatus"] },
    { name: "Deltoid Fly",                  diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","infraspinatus","upper-trapezius","anterior-deltoid"] },
    { name: "Machine Rear Delt Fly",        diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","infraspinatus","lower-trapezius","lateral-deltoid"] },
    { name: "Machine Front Raise",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-pectoralis","upper-trapezius"] },
    { name: "Smith Machine OHP",            diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","lateral-head-triceps","long-head-triceps","serratus-anterior","upper-pectoralis"] },
    { name: "Landmine Lateral Raise",       diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","anterior-deltoid","upper-trapezius","infraspinatus","serratus-anterior"] },
    { name: "Landmine Press (Single)",      diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","upper-pectoralis","mid-lower-pectoralis","lateral-head-triceps","serratus-anterior","medial-head-triceps","long-head-triceps","obliques"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Pike Push-ups",                diff: "intermediate", type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","lateral-head-triceps","serratus-anterior","upper-trapezius","long-head-triceps","upper-pectoralis"] },
    { name: "Handstand Push-ups",           diff: "elite",        type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","lateral-head-triceps","serratus-anterior","long-head-triceps","upper-pectoralis","upper-abdominals","wrist-flexors","obliques"] },
    { name: "Wall Handstand Push-ups",      diff: "advanced",     type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","lateral-head-triceps","serratus-anterior","long-head-triceps","upper-pectoralis","upper-abdominals"] },
    // Additional shoulder exercises
    { name: "Military Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","lateral-head-triceps","long-head-triceps","serratus-anterior","upper-pectoralis"] },
    { name: "Seated Dumbbell Press", angle: "90° upright",        diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","lateral-head-triceps","serratus-anterior","long-head-triceps","upper-pectoralis"] },
    { name: "Z Press", angle: "Seated on floor, 90°",                      diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps","upper-trapezius","upper-abdominals","lateral-head-triceps","serratus-anterior","long-head-triceps","lowerback","lower-abdominals","obliques"] },
    { name: "Bradford Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","posterior-deltoid","serratus-anterior","medial-head-triceps","lateral-head-triceps","infraspinatus","long-head-triceps"] },
    { name: "Barbell Upright Row",          diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","anterior-deltoid","posterior-deltoid","short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Cable Upright Row",            diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","anterior-deltoid","posterior-deltoid","short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Dumbbell Y Raise",             diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lower-trapezius","posterior-deltoid","lateral-deltoid","infraspinatus","serratus-anterior","anterior-deltoid","upper-trapezius"] },
    { name: "Dumbbell W Raise",             diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","infraspinatus","lower-trapezius","lateral-deltoid"] },
    { name: "Cable Y Raise",                diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lower-trapezius","posterior-deltoid","lateral-deltoid","infraspinatus","serratus-anterior","anterior-deltoid","upper-trapezius"] },
    { name: "Seated Cable Rear Delt Row",   diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius","infraspinatus","long-head-bicep"] },
    { name: "Dumbbell 6-Ways",              diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","posterior-deltoid","upper-trapezius","infraspinatus","serratus-anterior","lower-trapezius"] },
  ],

  legs: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Barbell Back Squat",           diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","gluteus-maximus","rectus-femoris","inner-thigh","lowerback","gluteus-medius","medial-hamstrings","soleus"] },
    { name: "Front Squat",                  diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","lowerback","inner-thigh","upper-abdominals","upper-trapezius"] },
    { name: "Romanian Deadlift",            diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus","lowerback","wrist-flexors","traps-middle"] },
    { name: "Stiff-Leg Deadlift",           diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus","lowerback","wrist-flexors"] },
    { name: "Barbell Lunge",                diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","gluteus-maximus","rectus-femoris","inner-quadricep","gluteus-medius","lateral-hamstrings","inner-thigh","lowerback","medial-hamstrings","hip-flexors"] },
    { name: "Barbell Step-ups",             diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","gluteus-maximus","inner-quadricep","rectus-femoris","gluteus-medius","lateral-hamstrings","medial-hamstrings","gastrocnemius","inner-thigh","lowerback","hip-flexors","soleus"] },
    { name: "Barbell Hip Thrust",           diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","gluteus-medius","inner-thigh","medial-hamstrings","lateral-hamstrings","outer-quadricep","inner-quadricep","lowerback"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Squat",               diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh","lowerback","wrist-flexors"] },
    { name: "Goblet Squat",                 diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh","lowerback","upper-abdominals"] },
    { name: "Dumbbell Romanian Deadlift",   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus","lowerback","wrist-flexors","traps-middle"] },
    { name: "Walking Lunges",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","gluteus-maximus","rectus-femoris","inner-quadricep","gluteus-medius","lateral-hamstrings","inner-thigh","medial-hamstrings","gastrocnemius","soleus","lowerback","hip-flexors"] },
    { name: "Reverse Lunges",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","outer-quadricep","inner-quadricep","rectus-femoris","gluteus-medius","lateral-hamstrings","medial-hamstrings","inner-thigh","hip-flexors"] },
    { name: "Bulgarian Split Squat",        diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","outer-quadricep","inner-quadricep","rectus-femoris","gluteus-medius","inner-thigh","lateral-hamstrings","medial-hamstrings","lowerback","hip-flexors"] },
    { name: "Sumo Squat",                   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep","gluteus-maximus","outer-quadricep","rectus-femoris","gluteus-medius","lowerback","medial-hamstrings"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Leg Press", angle: "45°",                    diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh"] },
    { name: "Hack Squat", angle: "45°",                   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh"] },
    { name: "Leg Extension",                diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Seated Leg Curl",              diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gastrocnemius"] },
    { name: "Lying Leg Curl",               diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gastrocnemius"] },
    { name: "Standing Leg Curl",            diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gastrocnemius","gluteus-maximus"] },
    { name: "Smith Machine Squat",          diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh","lowerback"] },
    { name: "Smith Machine Lunge",          diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","gluteus-maximus","rectus-femoris","gluteus-medius","lateral-hamstrings","inner-thigh","medial-hamstrings"] },
    { name: "Adductor Machine",             diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["inner-thigh"] },
    { name: "Abductor Machine",             diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Pendulum Squat",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh"] },
    { name: "Horizontal Leg Press",         diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh"] },
    { name: "V-Squat Machine",              diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh"] },
    { name: "Seated Calf Raise Machine",    diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["soleus","gastrocnemius"] },
    { name: "Standing Calf Raise Machine",  diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gastrocnemius","soleus"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Bodyweight Squat",             diff: "beginner",     type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh","lowerback","gluteus-medius"] },
    { name: "Jump Squats",                  diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","gastrocnemius","soleus","lateral-hamstrings","medial-hamstrings","lowerback","inner-thigh","tibialis"] },
    { name: "Pistol Squat",                 diff: "elite",        type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","gluteus-medius","soleus","hip-flexors","inner-thigh","gastrocnemius","tibialis","lowerback","medial-hamstrings","upper-abdominals","obliques"] },
    { name: "Nordic Curl",                  diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["lateral-hamstrings","medial-hamstrings","gastrocnemius","gluteus-maximus","lowerback"] },
    { name: "Wall Sit",                     diff: "beginner",     type: "calisthenics", iso: true, primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh"] },
    { name: "Step-ups",                     diff: "beginner",     type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","gluteus-maximus","inner-quadricep","rectus-femoris","gluteus-medius","lateral-hamstrings","medial-hamstrings","gastrocnemius","inner-thigh","hip-flexors","soleus"] },
    { name: "Box Jumps",                    diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","gastrocnemius","soleus","lateral-hamstrings","medial-hamstrings","tibialis","lowerback"] },
    { name: "Broad Jumps",                  diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["gluteus-maximus","outer-quadricep","rectus-femoris","inner-quadricep","gastrocnemius","lateral-hamstrings","soleus","medial-hamstrings","lowerback","upper-abdominals"] },
    { name: "Single-Leg Hip Thrust",        diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["gluteus-maximus","gluteus-medius","medial-hamstrings","lateral-hamstrings"] },
    { name: "Landmine Squat",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh","lowerback","anterior-deltoid","upper-abdominals"] },
    { name: "Sissy Squat",                  diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep","hip-flexors","tibialis"] },
    { name: "Spanish Squat",                diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep","gluteus-maximus"] },
    { name: "Lateral Lunge",                diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep","outer-quadricep","gluteus-maximus","rectus-femoris","gluteus-medius","medial-hamstrings","lateral-hamstrings"] },
    { name: "Curtsy Lunge",                 diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["gluteus-medius","gluteus-maximus","outer-quadricep","inner-quadricep","inner-thigh","rectus-femoris","medial-hamstrings","lateral-hamstrings"] },
    { name: "Single Leg Press", angle: "45°",             diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","gluteus-maximus","rectus-femoris","gluteus-medius","inner-thigh"] },
    { name: "Trap Bar Deadlift",            diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","gluteus-maximus","rectus-femoris","lowerback","medial-hamstrings","upper-trapezius","lateral-hamstrings","traps-middle","wrist-flexors"] },
    { name: "Glute Ham Raise",              diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus","gastrocnemius","lowerback"] },
    { name: "Leg Press (High Foot)", angle: "45°",        diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","outer-quadricep","inner-quadricep","medial-hamstrings","lateral-hamstrings","rectus-femoris","inner-thigh"] },
    { name: "Leg Press (Low Foot)", angle: "45°",         diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","rectus-femoris","gluteus-maximus","inner-thigh"] },
    { name: "Resistance Band Squat",        diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","gluteus-maximus","rectus-femoris","gluteus-medius","inner-thigh","lowerback"] },
    { name: "Zercher Squat",                diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","gluteus-maximus","rectus-femoris","lowerback","inner-thigh","upper-abdominals","obliques","short-head-bicep","long-head-bicep","upper-trapezius"] },
    { name: "Overhead Squat",               diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","inner-quadricep","gluteus-maximus","lowerback","rectus-femoris","anterior-deltoid","upper-trapezius","inner-thigh","lateral-deltoid","upper-abdominals","obliques","lower-trapezius","medial-head-triceps"] },
    { name: "Cossack Squat",                diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep","outer-quadricep","gluteus-medius","rectus-femoris","gluteus-maximus","medial-hamstrings","lateral-hamstrings"] },
  ],

  glutes: [
    { name: "Hip Thrust",                   diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","inner-thigh","medial-hamstrings","lateral-hamstrings","outer-quadricep","inner-quadricep","lowerback"] },
    { name: "Barbell Hip Thrust",           diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","inner-thigh","medial-hamstrings","lateral-hamstrings","outer-quadricep","inner-quadricep","lowerback"] },
    { name: "Glute Bridge",                 diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","medial-hamstrings","lateral-hamstrings","inner-thigh"] },
    { name: "Single-Leg Glute Bridge",      diff: "intermediate", type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","medial-hamstrings","lateral-hamstrings"] },
    { name: "Sumo Deadlift",                diff: "advanced",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","inner-thigh","inner-quadricep","outer-quadricep","lowerback","gluteus-medius","medial-hamstrings","upper-trapezius","lateral-hamstrings","traps-middle","wrist-flexors"] },
    { name: "Bulgarian Split Squat",        diff: "advanced",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","outer-quadricep","inner-quadricep","rectus-femoris","gluteus-medius","inner-thigh","lateral-hamstrings","medial-hamstrings","lowerback","hip-flexors"] },
    { name: "Cable Kickbacks",              diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lateral-hamstrings","gluteus-medius"] },
    { name: "Cable Pull-Through",           diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lateral-hamstrings","lowerback","inner-thigh"] },
    { name: "Abductor Machine",             diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Lateral Band Walk",            diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus","outer-quadricep"] },
    { name: "Donkey Kicks",                 diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lateral-hamstrings","lowerback","gluteus-medius"] },
    { name: "Fire Hydrants",                diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Glute Kickback Machine",       diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lateral-hamstrings","gluteus-medius"] },
    { name: "Smith Machine Hip Thrust",     diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","inner-thigh","medial-hamstrings","lateral-hamstrings","outer-quadricep","inner-quadricep","lowerback"] },
    { name: "Banded Hip Thrust",            diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","medial-hamstrings","lateral-hamstrings","inner-thigh","outer-quadricep"] },
    { name: "Frog Pump",                    diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","inner-thigh"] },
    { name: "45° Back Extension (Glute)", angle: "45°",   diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","lowerback","medial-hamstrings","lateral-hamstrings"] },
    { name: "Reverse Hyperextension", angle: "Flat or slight decline",       diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lateral-hamstrings","lowerback"] },
    { name: "Clamshell",                    diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Standing Cable Abduction",     diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus","obliques"] },
  ],

  bicep: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Barbell Curl",                 diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Wide-Grip Barbell Curl",       diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Reverse Barbell Curl",         diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["brachioradialis","brachialis","wrist-extensors","long-head-bicep","short-head-bicep"] },
    { name: "21s",                          diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Curl",                diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Alternating Dumbbell Curl",    diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Hammer Curl",                  diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","brachialis","brachioradialis","short-head-bicep","wrist-flexors"] },
    { name: "Concentration Curl", angle: "Seated, 90°",           diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","brachialis","long-head-bicep","brachioradialis","wrist-flexors"] },
    { name: "Incline Dumbbell Curl", angle: "45–60°",        diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Spider Curl", angle: "45° prone on incline",                  diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Zottman Curl",                 diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep","brachialis","brachioradialis","wrist-extensors","wrist-flexors"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Preacher Curl",                diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","brachialis","long-head-bicep","brachioradialis","wrist-flexors"] },
    { name: "Machine Preacher Curl",        diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","brachialis","long-head-bicep","brachioradialis","wrist-flexors"] },
    { name: "Cable Curl",                   diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "High Cable Curl",              diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis"] },
    { name: "Cable Hammer Curl",            diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","brachialis","brachioradialis","short-head-bicep","wrist-flexors"] },
    { name: "Bicep Curl Machine",           diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis"] },
    { name: "Low Cable Curl",               diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Chin-ups",                     diff: "advanced",     type: "calisthenics", primary: "bicep",     svgTargets: ["lats","short-head-bicep","long-head-bicep","brachialis","lower-trapezius","infraspinatus","brachioradialis","traps-middle","mid-lower-pectoralis","wrist-flexors","posterior-deltoid"] },
    { name: "Inverted Row (Supinated)",     diff: "intermediate", type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","traps-middle","lats","brachialis","posterior-deltoid","lower-trapezius","infraspinatus","brachioradialis","wrist-flexors"] },
    { name: "Bayesian Curl", angle: "Cable behind body",                diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Cross Body Hammer Curl",       diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","brachialis","brachioradialis","short-head-bicep","wrist-flexors"] },
    { name: "Waiter Curl",                  diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","wrist-flexors","brachioradialis"] },
    { name: "Drag Curl",                    diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "Resistance Band Curl",         diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","wrist-flexors"] },
    { name: "TRX Curl",                     diff: "intermediate", type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","brachialis","brachioradialis","lats","wrist-flexors"] },
  ],

  tricep: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Close-Grip Bench Press",       diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","mid-lower-pectoralis","long-head-triceps","anterior-deltoid","upper-pectoralis"] },
    { name: "Skull Crushers", angle: "Flat (0°)",               diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Skull Crushers", angle: "Flat (0°)",      diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    { name: "Overhead Tricep Extension", angle: "Seated, 90°",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    { name: "Tricep Kickback",              diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Tate Press",                   diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","mid-lower-pectoralis"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Tricep Rope Pushdown",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Tricep Bar Pushdown",          diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Reverse Tricep Pushdown",      diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","wrist-extensors"] },
    { name: "Overhead Cable Tricep Ext",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    { name: "Tricep Machine Press",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","mid-lower-pectoralis","anterior-deltoid"] },
    { name: "Assisted Dip Machine",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","mid-lower-pectoralis","long-head-triceps","anterior-deltoid","upper-pectoralis","serratus-anterior"] },
    { name: "Cable Overhead Tricep Ext",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Tricep Dips",                  diff: "intermediate", type: "calisthenics", primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid","mid-lower-pectoralis","upper-pectoralis","serratus-anterior"] },
    { name: "Bench Dips",                   diff: "beginner",     type: "calisthenics", primary: "tricep",  swap: "Use a chair, table edge, bed, step or curb",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid","mid-lower-pectoralis","upper-pectoralis"] },
    { name: "Diamond Push-ups",             diff: "intermediate", type: "calisthenics", primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","mid-lower-pectoralis","long-head-triceps","upper-pectoralis","anterior-deltoid","serratus-anterior"] },
    { name: "Pike Push-up Hold",            diff: "intermediate", type: "calisthenics", iso: true, primary: "tricep",    svgTargets: ["anterior-deltoid","medial-head-triceps","lateral-head-triceps","lateral-deltoid","long-head-triceps","serratus-anterior","upper-trapezius","upper-pectoralis"] },
    { name: "JM Press",                     diff: "advanced",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","mid-lower-pectoralis","anterior-deltoid"] },
    { name: "California Press", angle: "Flat (0°)",             diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps","mid-lower-pectoralis","anterior-deltoid"] },
    { name: "Rolling Tricep Extension",     diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    { name: "Single Arm Pushdown",          diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Resistance Band Pushdown",     diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Ring Dips",                    diff: "elite",        type: "calisthenics", primary: "tricep",    svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","anterior-deltoid","medial-head-triceps","long-head-triceps","upper-pectoralis","serratus-anterior"] },
  ],

  forearms: [
    { name: "Wrist Curls",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors"] },
    { name: "Reverse Wrist Curls",          diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors","brachioradialis"] },
    { name: "Farmer's Walk",                diff: "intermediate", type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","upper-trapezius","obliques","brachioradialis","lowerback","gluteus-medius","traps-middle","upper-abdominals","outer-quadricep","gastrocnemius","soleus","lower-abdominals","inner-quadricep","rectus-femoris"] },
    { name: "Plate Pinch",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors","brachioradialis"] },
    { name: "Dead Hang",                    diff: "beginner",     type: "calisthenics", iso: true, primary: "forearms",  svgTargets: ["wrist-flexors","brachioradialis","lats","lower-trapezius"] },
    { name: "Towel Pull-ups",               diff: "advanced",     type: "calisthenics", primary: "forearms",  svgTargets: ["wrist-flexors","lats","brachioradialis","long-head-bicep","brachialis","short-head-bicep","lower-trapezius","traps-middle","infraspinatus","posterior-deltoid","wrist-extensors"] },
    { name: "Hammer Curl",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["long-head-bicep","brachialis","brachioradialis","short-head-bicep","wrist-flexors"] },
    { name: "Reverse Curl",                 diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["brachioradialis","brachialis","wrist-extensors","long-head-bicep","short-head-bicep"] },
    { name: "Cable Wrist Curl",             diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors"] },
    { name: "Cable Reverse Wrist Curl",     diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors","brachioradialis"] },
    { name: "Rice Bucket",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors","brachioradialis"] },
  ],

  core: [
    // ── ABS ──────────────────────────────────────────────────────────────────
    { name: "Crunch",                       diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Cable Crunch",                 diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Machine Crunch",               diff: "beginner",     type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Decline Sit-up", angle: "15–30°",               diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","hip-flexors","rectus-femoris","obliques"] },
    { name: "Weighted Sit-up",              diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","hip-flexors","rectus-femoris","obliques"] },
    { name: "Hanging Knee Raise",           diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["hip-flexors","lower-abdominals","upper-abdominals","rectus-femoris","obliques","wrist-flexors"] },
    { name: "Hanging Leg Raises",           diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["hip-flexors","lower-abdominals","upper-abdominals","rectus-femoris","obliques","wrist-flexors","lats","brachioradialis"] },
    { name: "Lying Leg Raise",              diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["hip-flexors","lower-abdominals","upper-abdominals","rectus-femoris","obliques"] },
    { name: "Reverse Crunch",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","hip-flexors","obliques"] },
    { name: "Ab Wheel Rollout",             diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lats","serratus-anterior","long-head-triceps","hip-flexors"] },
    { name: "V-ups",                        diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","hip-flexors","rectus-femoris","obliques"] },
    { name: "Toes to Bar",                  diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["hip-flexors","lower-abdominals","upper-abdominals","rectus-femoris","lats","obliques","wrist-flexors","brachioradialis"] },
    { name: "Dragon Flag",                  diff: "elite",        type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lats","hip-flexors","rectus-femoris"] },
    { name: "L-Sit",                        diff: "elite",        type: "calisthenics", iso: true, primary: "core",      svgTargets: ["hip-flexors","lower-abdominals","upper-abdominals","rectus-femoris","obliques","long-head-triceps","lats","lower-trapezius","serratus-anterior","anterior-deltoid"] },
    // ── OBLIQUES ─────────────────────────────────────────────────────────────
    { name: "Russian Twists",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    { name: "Weighted Russian Twists",      diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    { name: "Side Plank",                   diff: "beginner",     type: "calisthenics", iso: true, primary: "core",      svgTargets: ["obliques","gluteus-medius","upper-abdominals","lower-abdominals","lowerback"] },
    { name: "Side Plank with Rotation",     diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","gluteus-medius","lower-abdominals","anterior-deltoid"] },
    { name: "Woodchop",                     diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals","anterior-deltoid","gluteus-medius"] },
    { name: "Pallof Press",                 diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals","anterior-deltoid","gluteus-medius"] },
    { name: "Bicycle Crunch",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals","hip-flexors","rectus-femoris"] },
    // ── PLANK VARIATIONS ─────────────────────────────────────────────────────
    { name: "Plank",                        diff: "beginner",     type: "calisthenics", iso: true, primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","anterior-deltoid","serratus-anterior"] },
    { name: "Long-Lever Plank",             diff: "intermediate", type: "calisthenics", iso: true, primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","anterior-deltoid","serratus-anterior","hip-flexors"] },
    { name: "Weighted Plank",               diff: "intermediate", type: "strength", iso: true,     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","anterior-deltoid","serratus-anterior"] },
    { name: "Plank Reach",                  diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","anterior-deltoid","serratus-anterior"] },
    { name: "Dead Bug",                     diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","obliques","hip-flexors"] },
    { name: "Bird Dog",                     diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["gluteus-maximus","lowerback","obliques","upper-abdominals","lower-abdominals","medial-hamstrings","posterior-deltoid","lower-trapezius"] },
    { name: "Ab Wheel (Kneeling)",          diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lats","serratus-anterior","long-head-triceps"] },
    { name: "Cable Woodchop (High)",        diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals","anterior-deltoid","gluteus-medius"] },
    { name: "Cable Woodchop (Low)",         diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals","anterior-deltoid","gluteus-maximus"] },
    { name: "Landmine Rotation",            diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","anterior-deltoid","lower-abdominals"] },
    { name: "Copenhagen Plank",             diff: "advanced",     type: "calisthenics", iso: true, primary: "core",      svgTargets: ["inner-thigh","obliques","upper-abdominals","gluteus-medius","lower-abdominals","hip-flexors"] },
    { name: "Stir the Pot",                 diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","serratus-anterior","anterior-deltoid"] },
    { name: "Cable Crunch (Kneeling)",      diff: "beginner",     type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Weighted Decline Crunch", angle: "15–30°",      diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","hip-flexors","rectus-femoris"] },
    { name: "Shoulder Tap Push-ups",        diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","obliques","medial-head-triceps","serratus-anterior","upper-abdominals","lower-abdominals","long-head-triceps"] },
    { name: "Hollow Body Hold",             diff: "intermediate", type: "calisthenics", iso: true, primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","hip-flexors","obliques","rectus-femoris"] },
    { name: "Hollow Body Rock",             diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","hip-flexors","obliques","rectus-femoris"] },
    { name: "GHD Sit-up", angle: "GHD at 0° (parallel)",                   diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["hip-flexors","lower-abdominals","rectus-femoris","upper-abdominals","obliques","inner-thigh"] },
    { name: "Suitcase Carry",               diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","wrist-flexors","gluteus-medius","lowerback","upper-trapezius","upper-abdominals","lower-abdominals","brachioradialis"] },
  ],

  calves: [
    { name: "Standing Calf Raises",         diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Seated Calf Raises",           diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["soleus","gastrocnemius"] },
    { name: "Leg Press Calf Raise",         diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Donkey Calf Raises",           diff: "intermediate", type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Single-Leg Calf Raise",        diff: "intermediate", type: "calisthenics", primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Calf Raise Machine",           diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Smith Machine Calf Raise",     diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Tibialis Raise",               diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["tibialis"] },
    { name: "Calf Press on Leg Press",      diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Jump Rope",                    diff: "intermediate", type: "cardio",       primary: "calves",    cardioMode: "timed", met: 11.0, svgTargets: ["gastrocnemius","soleus"] },
    { name: "Plyometric Calf Jumps",        diff: "intermediate", type: "calisthenics", primary: "calves",    svgTargets: ["gastrocnemius","soleus","tibialis","outer-quadricep","rectus-femoris"] },
  ],

  cardio: [
    { name: "Walking",                      diff: "beginner",     type: "cardio",       cardioMode: "speed",  defaultSpeed: 3.0 },
    { name: "Incline Walking",              diff: "intermediate", type: "cardio",       cardioMode: "speed",  defaultSpeed: 3.5 },
    { name: "Running",                      diff: "intermediate", type: "cardio",       cardioMode: "speed",  defaultSpeed: 6.0 },
    { name: "Treadmill",                    diff: "beginner",     type: "cardio",       cardioMode: "speed",  defaultSpeed: 3.5 },
    { name: "Stairmaster",                  diff: "intermediate", type: "cardio",       cardioMode: "spm",  defaultSpm: 60,  met: 9.0 },
    { name: "Elliptical",                   diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 5.0 },
    { name: "Cycling",                      diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 7.5 },
    { name: "Stationary Bike",              diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 6.0 },
    { name: "Rowing Machine",               diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 8.5 },
    { name: "Jump Rope",                    diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 11.0 },
    { name: "Swimming",                     diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Battle Ropes",                 diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 10.0 },
    { name: "HIIT / Sprints",               diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 12.0 },
    { name: "Assault Bike",                 diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 12.5 },
    { name: "SkiErg",                       diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 9.5 },
    { name: "Sled Push",                    diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 10.5 },
    { name: "Sled Pull",                    diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 10.0 },
    { name: "Jacob's Ladder",               diff: "advanced",     type: "cardio",       cardioMode: "spm",  defaultSpm: 55,  met: 11.5 },
    { name: "Versaclimber",                 diff: "advanced",     type: "cardio",       cardioMode: "spm",  defaultSpm: 55,  met: 11.0 },
    { name: "Spin Class",                   diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.5 },
    { name: "Hiking",                       diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 6.5 },
    { name: "Burpees",                      diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Mountain Climbers",            diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Jumping Jacks",                diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 7.0 },
    { name: "High Knees",                   diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Stair Climbing",               diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 8.0 },
    { name: "Box Step-ups (Cardio)",        diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 6.0 },
    { name: "Sled Sprint",                  diff: "elite",        type: "cardio",       cardioMode: "timed",  met: 13.0 },
    { name: "Farmer's Walk (Cardio)",       diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 7.0 },
    { name: "Kettlebell Swing",             diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 9.0 },
    { name: "Tire Flip",                    diff: "elite",        type: "cardio",       cardioMode: "timed",  met: 10.0 },
    { name: "Shadow Boxing",                diff: "intermediate", type: "cardio",       cardioMode: "timed",  met: 7.5 },
    { name: "Dance / Zumba",               diff: "beginner",     type: "cardio",       cardioMode: "timed",  met: 6.5 },
    { name: "Rock Climbing",                diff: "advanced",     type: "cardio",       cardioMode: "timed",  met: 8.5 },
  ],

  calisthenics: [
    { name: "Muscle-up",                    diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["lats","lateral-head-triceps","long-head-bicep","short-head-bicep","mid-lower-pectoralis","medial-head-triceps","brachialis","lower-trapezius","anterior-deltoid","traps-middle","long-head-triceps","wrist-flexors","brachioradialis","upper-pectoralis","serratus-anterior","infraspinatus","lower-abdominals","upper-abdominals"] },
    { name: "Handstand",                    diff: "elite",        type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","serratus-anterior","medial-head-triceps","upper-abdominals","wrist-flexors","obliques","lateral-head-triceps","lower-abdominals","long-head-triceps","lowerback"] },
    { name: "Front Lever",                  diff: "elite",        type: "calisthenics", iso: true, primary: "back",      svgTargets: ["lats","lower-abdominals","upper-abdominals","lower-trapezius","posterior-deltoid","obliques","wrist-flexors","infraspinatus","long-head-triceps","long-head-bicep","brachioradialis","mid-lower-pectoralis","brachialis","serratus-anterior"] },
    { name: "Back Lever",                   diff: "elite",        type: "calisthenics", iso: true, primary: "back",      svgTargets: ["mid-lower-pectoralis","anterior-deltoid","upper-pectoralis","lats","lowerback","long-head-triceps","gluteus-maximus","upper-abdominals","wrist-flexors","lower-trapezius","lower-abdominals","serratus-anterior","infraspinatus","brachioradialis"] },
    { name: "Planche",                      diff: "elite",        type: "calisthenics", primary: "chest",     svgTargets: ["anterior-deltoid","mid-lower-pectoralis","upper-pectoralis","serratus-anterior","medial-head-triceps","lateral-head-triceps","upper-abdominals","wrist-flexors","long-head-triceps","lower-abdominals","lower-trapezius","obliques","brachioradialis","lowerback","gluteus-maximus"] },
    { name: "Human Flag",                   diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["obliques","lats","upper-abdominals","lower-abdominals","lateral-deltoid","wrist-flexors","anterior-deltoid","gluteus-medius","lateral-head-triceps","posterior-deltoid","short-head-bicep","brachioradialis","medial-head-triceps","serratus-anterior","brachialis","long-head-triceps","lowerback","infraspinatus","gluteus-maximus"] },
    { name: "Burpees",                      diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","gastrocnemius","mid-lower-pectoralis","anterior-deltoid","lateral-head-triceps","soleus","lateral-hamstrings","medial-head-triceps","upper-abdominals","hip-flexors","medial-hamstrings","upper-pectoralis","lower-abdominals","long-head-triceps","serratus-anterior","obliques","lowerback"] },
  ],
};

export const MACHINE_NAME_PATTERNS = [
  "machine", "pulldown", "pull-down", "leg press", "leg extension",
  "leg curl", "pec deck", "hack squat", "smith", "preacher",
];

// Calisthenics that need something to hang from or press between — a floor
// and body weight are not enough for these.
export const BAR_NAME_PATTERNS = [
  "pull-up", "pullup", "chin-up", "hanging", "muscle-up", "toes to bar",
  "inverted row", "dead hang", "front lever", "back lever", "scapular pull",
];

// Needing something to lie, sit or step on is a requirement layered ON TOP of
// the primary equipment: a dumbbell bench press needs dumbbells AND a bench.
// Machines and cables are exempt — they bring their own seat.
export const BENCH_REQUIRED = new Set([
  // pressing
  "Bench Press", "Incline Bench Press", "Decline Bench Press", "Close-Grip Bench Press",
  "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Dumbbell Press",
  "Hex Press", "Squeeze Press",
  // flyes / pullovers
  "Dumbbell Flyes", "Incline Dumbbell Flyes", "Decline Dumbbell Flyes", "Dumbbell Pullover",
  // lying triceps
  "Skull Crushers", "Dumbbell Skull Crushers", "JM Press", "California Press",
  "Tate Press", "Rolling Tricep Extension",
  // supported curls
  "Preacher Curl", "Incline Dumbbell Curl", "Spider Curl", "Concentration Curl",
  // seated / supported
  "Seated Dumbbell Press", "Seated Calf Raises", "Chest Supported Row", "Seal Row",
  "Back Extension (45°)", "Hyperextension",
  // hinge & unilateral work off a bench
  "Hip Thrust", "Barbell Hip Thrust", "Banded Hip Thrust", "Single-Leg Hip Thrust",
  "Bulgarian Split Squat", "Step-ups", "Barbell Step-ups", "Box Jumps",
  // elevation-dependent bodyweight
  "Bench Dips", "Decline Push-ups", "Incline Push-ups",
  "Decline Sit-up", "Weighted Decline Crunch",
]);

// ─── EMG ROUTING ──────────────────────────────────────────────────────────────
// Every built-in exercise has a profile in ./emg.js (scripts/physiology/
// validate-emg.mjs enforces it). Custom exercises without one get a profile
// derived from their ordered svgTargets.
// Derived profile for lifts with no measured EMG: svgTargets are listed in
// order of importance, so the first is the prime mover and the rest taper.
const DERIVED_WEIGHTS = [100, 70, 55, 45, 38, 32, 28, 25];
export function emgFor(ex) {
  if (!ex) return null;
  if (ex.emg) return ex.emg;
  const direct = EXERCISE_EMG[ex.name];
  if (direct) return direct;
  const targets = ex.svgTargets || [];
  if (targets.length === 0) return null;
  const out = {};
  targets.forEach((id, i) => { out[id] = DERIVED_WEIGHTS[Math.min(i, DERIVED_WEIGHTS.length - 1)]; });
  return out;
}

// ─── BODYWEIGHT LOAD FRACTIONS ───────────────────────────────────────────────
// Share of body mass a bodyweight movement actually places on the working
// muscles. Push-up values are measured (Ebben et al. 2011: 64 % standard,
// 41 % hands-elevated, 74 % feet-elevated); the rest follow segment-mass
// anatomy (legs ≈ 32 % of body mass, arms ≈ 10 %, head + trunk ≈ 58 %). A
// 220 lb hunter's push-up is therefore a ~140 lb press, and a hanging leg
// raise moves ~75 lb of legs — not 220 lb of "bodyweight".
export const BW_FRACTION = {
  "Push-ups": .64, "Wide Push-ups": .64, "Diamond Push-ups": .64, "Shoulder Tap Push-ups": .64,
  "Archer Push-ups": .75, "Clap Push-ups": .70, "Ring Push-ups": .68, "Incline Push-ups": .45,
  "Decline Push-ups": .74, "Pseudo Planche Push-up": .80, "Pike Push-ups": .70, "Pike Push-up Hold": .70,
  "Wall Handstand Push-ups": .90, "Handstand Push-ups": .95, "Handstand": .90, "Planche": 1.0,
  "Dips": .95, "Tricep Dips": .95, "Ring Dips": .95, "Bench Dips": .60,
  "Pull-ups": .95, "Wide-Grip Pull-ups": .95, "Chin-ups": .95, "Neutral-Grip Pull-ups": .95, "Towel Pull-ups": .95,
  "Muscle-up": .95, "Scapular Pull-ups": .95, "Dead Hang": .95, "Inverted Row": .60, "Inverted Row (Supinated)": .60,
  "TRX Curl": .50, "Front Lever": .90, "Back Lever": .90, "Human Flag": .90,
  "Bodyweight Squat": .88, "Jump Squats": .88, "Pistol Squat": .88, "Sissy Squat": .80, "Spanish Squat": .85,
  "Cossack Squat": .88, "Step-ups": .88, "Box Jumps": .88, "Broad Jumps": .88, "Wall Sit": .80,
  "Nordic Curl": .65, "Glute Ham Raise": .65, "Single-Leg Hip Thrust": .60, "Glute Bridge": .50,
  "Single-Leg Glute Bridge": .55, "Frog Pump": .45, "Donkey Kicks": .25, "Fire Hydrants": .20, "Clamshell": .15,
  "Lateral Band Walk": .30, "Single-Leg Calf Raise": 1.0, "Plyometric Calf Jumps": 1.0, "Hyperextension": .60, "Superman": .30,
  "Plank": .60, "Long-Lever Plank": .65, "Side Plank": .55, "Side Plank with Rotation": .55, "Copenhagen Plank": .60,
  "Plank Reach": .60, "Hollow Body Hold": .45, "Hollow Body Rock": .45, "L-Sit": .50, "Dragon Flag": .70,
  "Hanging Leg Raises": .35, "Hanging Knee Raise": .30, "Toes to Bar": .40, "Lying Leg Raise": .32, "Reverse Crunch": .30,
  "Crunch": .30, "Decline Sit-up": .45, "V-ups": .45, "Russian Twists": .30, "Bicycle Crunch": .35, "Dead Bug": .30,
  "Bird Dog": .30, "Ab Wheel Rollout": .65, "Ab Wheel (Kneeling)": .50, "Stir the Pot": .60, "GHD Sit-up": .55, "Burpees": .70,
};
export function bodyweightFraction(ex) {
  if (!ex) return 0;
  const f = BW_FRACTION[ex.name];
  if (f != null) return f;
  return ex.type === "calisthenics" ? 0.70 : 0;
}
