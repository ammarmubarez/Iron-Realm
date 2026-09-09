// The exercise database, EMG activation profiles, and equipment classification.
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.

// ─── EXERCISE DB ──────────────────────────────────────────────────────────────
export const EXERCISE_EMG = {
  "Bench Press": {"mid-lower-pectoralis": 100, "upper-pectoralis": 70, "anterior-deltoid": 50, "lateral-head-triceps": 55, "medial-head-triceps": 40},
  "Incline Bench Press": {"upper-pectoralis": 100, "mid-lower-pectoralis": 55, "anterior-deltoid": 75, "lateral-head-triceps": 50},
  "Decline Bench Press": {"mid-lower-pectoralis": 100, "upper-pectoralis": 40, "lateral-head-triceps": 50, "medial-head-triceps": 35},
  "Dumbbell Flyes": {"mid-lower-pectoralis": 100, "upper-pectoralis": 80, "anterior-deltoid": 25},
  "Cable Crossover": {"mid-lower-pectoralis": 100, "upper-pectoralis": 75, "anterior-deltoid": 20},
  "Pec Deck Machine": {"mid-lower-pectoralis": 100, "upper-pectoralis": 80},
  "Dips": {"mid-lower-pectoralis": 100, "upper-pectoralis": 40, "lateral-head-triceps": 80, "medial-head-triceps": 60, "long-head-triceps": 50, "anterior-deltoid": 45},
  "Push-ups": {"mid-lower-pectoralis": 100, "upper-pectoralis": 70, "anterior-deltoid": 55, "lateral-head-triceps": 50, "medial-head-triceps": 35},
  "Deadlift": {"lats": 70, "lowerback": 100, "upper-trapezius": 60, "traps-middle": 65, "gluteus-maximus": 85, "outer-quadricep": 55, "medial-hamstrings": 70},
  "Barbell Row": {"lats": 100, "traps-middle": 80, "lower-trapezius": 70, "posterior-deltoid": 65, "long-head-bicep": 55, "lowerback": 50},
  "Pull-ups": {"lats": 100, "lower-trapezius": 70, "short-head-bicep": 65, "long-head-bicep": 60, "traps-middle": 45},
  "Lat Pulldown": {"lats": 100, "lower-trapezius": 65, "long-head-bicep": 60, "traps-middle": 40},
  "Seated Cable Row": {"lats": 100, "traps-middle": 75, "lower-trapezius": 65, "posterior-deltoid": 60, "long-head-bicep": 45},
  "T-Bar Row": {"lats": 100, "traps-middle": 80, "lower-trapezius": 65, "long-head-bicep": 50, "lowerback": 45},
  "Dumbbell Row": {"lats": 100, "lower-trapezius": 65, "posterior-deltoid": 55, "long-head-bicep": 50},
  "Face Pulls": {"posterior-deltoid": 100, "traps-middle": 80, "upper-trapezius": 60, "lateral-deltoid": 30},
  "Shrugs": {"upper-trapezius": 100, "traps-middle": 70},
  "Back Extension": {"lowerback": 100, "gluteus-maximus": 65, "medial-hamstrings": 55},
  "Squat": {"outer-quadricep": 100, "rectus-femoris": 95, "inner-quadricep": 85, "gluteus-maximus": 80, "medial-hamstrings": 30, "lowerback": 25},
  "Romanian Deadlift": {"lateral-hamstrings": 100, "medial-hamstrings": 95, "gluteus-maximus": 85, "lowerback": 50},
  "Leg Press": {"outer-quadricep": 100, "rectus-femoris": 90, "inner-quadricep": 80, "gluteus-maximus": 55},
  "Hack Squat": {"outer-quadricep": 100, "rectus-femoris": 95, "inner-quadricep": 75, "gluteus-maximus": 40},
  "Leg Extension": {"rectus-femoris": 100, "outer-quadricep": 90, "inner-quadricep": 80},
  "Leg Curl": {"medial-hamstrings": 100, "lateral-hamstrings": 90},
  "Walking Lunges": {"outer-quadricep": 100, "rectus-femoris": 90, "gluteus-maximus": 75, "lateral-hamstrings": 45, "inner-quadricep": 70},
  "Calf Raises": {"gastrocnemius": 100, "soleus": 65},
  "Seated Calf Raises": {"soleus": 100, "gastrocnemius": 30},
  "Sumo Squat": {"inner-quadricep": 100, "inner-thigh": 90, "gluteus-maximus": 80, "gluteus-medius": 65, "outer-quadricep": 55},
  "Nordic Curl": {"medial-hamstrings": 100, "lateral-hamstrings": 85},
  "Pistol Squat": {"rectus-femoris": 100, "outer-quadricep": 95, "inner-quadricep": 85, "gluteus-maximus": 70},
  "Overhead Press": {"anterior-deltoid": 100, "lateral-deltoid": 75, "upper-trapezius": 55, "medial-head-triceps": 60, "long-head-triceps": 45},
  "Arnold Press": {"anterior-deltoid": 100, "lateral-deltoid": 80, "posterior-deltoid": 50, "medial-head-triceps": 40},
  "Lateral Raises": {"lateral-deltoid": 100, "anterior-deltoid": 25, "upper-trapezius": 30},
  "Front Raises": {"anterior-deltoid": 100, "lateral-deltoid": 30},
  "Rear Delt Flyes": {"posterior-deltoid": 100, "traps-middle": 60, "lateral-deltoid": 35},
  "Upright Row": {"lateral-deltoid": 100, "anterior-deltoid": 75, "upper-trapezius": 80, "short-head-bicep": 45},
  "Cable Lateral Raise": {"lateral-deltoid": 100, "anterior-deltoid": 30},
  "Shoulder Tap Push-ups": {"mid-lower-pectoralis": 100, "upper-pectoralis": 65, "obliques": 60, "anterior-deltoid": 55, "lateral-head-triceps": 50, "upper-abdominals": 45},
  "Pike Push-ups": {"anterior-deltoid": 100, "lateral-deltoid": 65, "medial-head-triceps": 55, "upper-trapezius": 40},
  "Barbell Curl": {"short-head-bicep": 100, "long-head-bicep": 85, "wrist-flexors": 30},
  "Hammer Curl": {"long-head-bicep": 100, "short-head-bicep": 70, "wrist-flexors": 40},
  "Concentration Curl": {"short-head-bicep": 100, "long-head-bicep": 50},
  "Incline Curl": {"long-head-bicep": 100, "short-head-bicep": 60},
  "Preacher Curl": {"short-head-bicep": 100, "long-head-bicep": 75},
  "Cable Curl": {"short-head-bicep": 100, "long-head-bicep": 80},
  "Skull Crushers": {"long-head-triceps": 100, "medial-head-triceps": 70, "lateral-head-triceps": 55},
  "Tricep Pushdown": {"lateral-head-triceps": 100, "medial-head-triceps": 85, "long-head-triceps": 40},
  "Overhead Tricep Ext": {"long-head-triceps": 100, "medial-head-triceps": 60},
  "Close-Grip Bench": {"medial-head-triceps": 100, "lateral-head-triceps": 90, "long-head-triceps": 70, "mid-lower-pectoralis": 45},
  "Wrist Curls": {"wrist-flexors": 100},
  "Reverse Wrist Curls": {"wrist-extensors": 100},
  "Chin-ups": {"short-head-bicep": 100, "long-head-bicep": 90, "lats": 70, "lower-trapezius": 40},
  "Diamond Push-ups": {"medial-head-triceps": 100, "lateral-head-triceps": 85, "long-head-triceps": 70, "mid-lower-pectoralis": 40},
  "Plank": {"upper-abdominals": 100, "lower-abdominals": 80, "obliques": 65},
  "Crunch": {"upper-abdominals": 100, "lower-abdominals": 50},
  "Hanging Leg Raises": {"lower-abdominals": 100, "upper-abdominals": 70, "obliques": 40},
  "Ab Wheel Rollout": {"upper-abdominals": 100, "lower-abdominals": 90, "obliques": 50},
  "Cable Crunch": {"upper-abdominals": 100, "lower-abdominals": 75},
  "Russian Twists": {"obliques": 100, "upper-abdominals": 55},
  "Side Plank": {"obliques": 100, "upper-abdominals": 40},
  "Dragon Flag": {"upper-abdominals": 100, "lower-abdominals": 95, "obliques": 70},
  "L-Sit": {"lower-abdominals": 100, "upper-abdominals": 80},
  "Bicycle Crunch": {"obliques": 100, "upper-abdominals": 80, "lower-abdominals": 60},
  "Hip Thrust": {"gluteus-maximus": 100, "gluteus-medius": 55, "lateral-hamstrings": 40},
  "Glute Bridge": {"gluteus-maximus": 100, "gluteus-medius": 50},
  "Cable Kickbacks": {"gluteus-maximus": 100, "lateral-hamstrings": 30},
  "Bulgarian Split Squat": {"gluteus-maximus": 100, "outer-quadricep": 85, "rectus-femoris": 75, "lateral-hamstrings": 40},
  "Sumo Deadlift": {"gluteus-maximus": 100, "gluteus-medius": 70, "inner-thigh": 75, "lowerback": 55, "medial-hamstrings": 60},
  "Abductor Machine": {"gluteus-medius": 100, "inner-thigh": 60},
  "Donkey Kicks": {"gluteus-maximus": 100, "lateral-hamstrings": 30},
  "Fire Hydrants": {"gluteus-medius": 100, "gluteus-maximus": 40},
};

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
};

export const EXERCISE_DB = {
  // svgTargets use exact SVG IDs from the anatomy figures
  // EMG activation ratios sourced from Schoenfeld (2010), ACE muscle activation studies,
  // Bret Contreras EMG research, and NSCA Exercise Technique Manual

  chest: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Bench Press", angle: "Flat (0°)",                  diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Incline Bench Press", angle: "30–45°",          diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Decline Bench Press", angle: "15–30°",          diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","anterior-deltoid"] },
    { name: "Close-Grip Bench Press",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","medial-head-triceps","lateral-head-triceps","long-head-triceps","anterior-deltoid"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Bench Press", angle: "Flat (0°)",         diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Incline Dumbbell Press", angle: "30–45°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Decline Dumbbell Press", angle: "15–30°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps"] },
    { name: "Dumbbell Flyes", angle: "Flat (0°)",               diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Incline Dumbbell Flyes", angle: "30–45°",       diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid"] },
    { name: "Decline Dumbbell Flyes", angle: "15–30°",       diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis"] },
    { name: "Dumbbell Pullover",            diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","lats","long-head-triceps"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Pec Deck Machine",             diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
    { name: "Chest Press Machine",          diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Incline Chest Press Machine", angle: "30–45°",  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Decline Chest Press Machine", angle: "15–30°",  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps"] },
    { name: "Cable Crossover",              diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Low Cable Fly", angle: "Cable set at bottom",                diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid"] },
    { name: "High Cable Fly", angle: "Cable set at top",               diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","anterior-deltoid"] },
    { name: "Smith Machine Bench Press",    diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Converging Chest Press Machine", diff: "beginner",  type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Fly Machine",                  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Landmine Press",               diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Push-ups",                     diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Wide Push-ups",                diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Diamond Push-ups",             diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","mid-lower-pectoralis"] },
    { name: "Decline Push-ups",             diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Shoulder Tap Push-ups",        diff: "intermediate", type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","obliques","upper-abdominals"] },
    { name: "Incline Push-ups",             diff: "beginner",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Dips",                         diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","medial-head-triceps","anterior-deltoid"] },
    { name: "Archer Push-ups",              diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Clap Push-ups",                diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps"] },
    { name: "Ring Push-ups",                diff: "advanced",     type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","lateral-head-triceps","medial-head-triceps"] },
    { name: "Svend Press",                  diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
    { name: "Cable Fly",                    diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Hex Press",                    diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","medial-head-triceps"] },
    { name: "Floor Press", angle: "Flat on floor",                  diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","lateral-head-triceps","medial-head-triceps"] },
    { name: "Squeeze Press",                diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
    { name: "Single Arm Cable Fly",         diff: "intermediate", type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid"] },
    { name: "Pseudo Planche Push-up",       diff: "elite",        type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","anterior-deltoid","medial-head-triceps"] },
    { name: "Resistance Band Fly",          diff: "beginner",     type: "strength",     primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis"] },
  ],

  back: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Deadlift",                     diff: "elite",        type: "strength",     primary: "back",      svgTargets: ["lats","lowerback","upper-trapezius","traps-middle","gluteus-maximus","outer-quadricep","medial-hamstrings"] },
    { name: "Barbell Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep","short-head-bicep"] },
    { name: "Pendlay Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Sumo Deadlift",                diff: "elite",        type: "strength",     primary: "back",      svgTargets: ["lats","lowerback","gluteus-maximus","gluteus-medius","inner-thigh","medial-hamstrings"] },
    { name: "Rack Pull",                    diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","lowerback","upper-trapezius","traps-middle","gluteus-maximus"] },
    { name: "Good Mornings",                diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lowerback","medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Row",                 diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Dumbbell Pullover",            diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","mid-lower-pectoralis","long-head-triceps"] },
    { name: "Chest Supported Row", angle: "30–45° prone",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Shrugs",                       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["upper-trapezius","traps-middle"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Lat Pulldown",                 diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","long-head-bicep","short-head-bicep"] },
    { name: "Wide-Grip Lat Pulldown",       diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid"] },
    { name: "Reverse-Grip Lat Pulldown",    diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","short-head-bicep","long-head-bicep"] },
    { name: "Seated Cable Row",             diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Wide-Grip Cable Row",          diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","posterior-deltoid","lats"] },
    { name: "T-Bar Row",                    diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","long-head-bicep"] },
    { name: "Machine Row",                  diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","lats","posterior-deltoid"] },
    { name: "Cable Straight-Arm Pulldown",  diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-triceps"] },
    { name: "Face Pulls",                   diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["posterior-deltoid","traps-middle","upper-trapezius"] },
    { name: "Back Extension Machine", angle: "45° or 90°",       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings"] },
    { name: "Back Extension (45°)", angle: "45°",         diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lowerback","gluteus-maximus","lateral-hamstrings"] },
    { name: "Smith Machine Shrug",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["upper-trapezius","traps-middle"] },
    { name: "Chest Supported Row Machine",  diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Iso-Lateral Row Machine",      diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","posterior-deltoid","long-head-bicep"] },
    { name: "Lever Pullover Machine",       diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","mid-lower-pectoralis","long-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Pull-ups",                     diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","lower-trapezius","short-head-bicep","long-head-bicep","posterior-deltoid"] },
    { name: "Wide-Grip Pull-ups",           diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid"] },
    { name: "Chin-ups",                     diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","short-head-bicep","long-head-bicep","lower-trapezius"] },
    { name: "Neutral-Grip Pull-ups",        diff: "advanced",     type: "calisthenics", primary: "back",      svgTargets: ["lats","long-head-bicep","short-head-bicep","lower-trapezius"] },
    { name: "Inverted Row",                 diff: "intermediate", type: "calisthenics", primary: "back",      svgTargets: ["traps-middle","lower-trapezius","lats","posterior-deltoid","short-head-bicep"] },
    { name: "Scapular Pull-ups",            diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lower-trapezius","lats"] },
    { name: "Superman",                     diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lowerback","gluteus-maximus","traps-middle"] },
    { name: "Meadows Row",                  diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Kroc Row",                     diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","lower-trapezius","long-head-bicep"] },
    { name: "Seal Row", angle: "Flat bench, prone",                     diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["traps-middle","lower-trapezius","lats","posterior-deltoid"] },
    { name: "Cable Row (Single Arm)",       diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","posterior-deltoid","long-head-bicep"] },
    { name: "Banded Pull-apart",            diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Resistance Band Row",          diff: "beginner",     type: "strength",     primary: "back",      svgTargets: ["lats","traps-middle","long-head-bicep"] },
    { name: "Straight Arm Cable Pulldown",  diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","long-head-triceps"] },
    { name: "Neutral Grip Lat Pulldown",    diff: "intermediate", type: "strength",     primary: "back",      svgTargets: ["lats","lower-trapezius","long-head-bicep","short-head-bicep"] },
    { name: "Jefferson Curl",               diff: "advanced",     type: "strength",     primary: "back",      svgTargets: ["lowerback","lateral-hamstrings","medial-hamstrings"] },
    { name: "Hyperextension",               diff: "beginner",     type: "calisthenics", primary: "back",      svgTargets: ["lowerback","gluteus-maximus","medial-hamstrings"] },
  ],

  shoulders: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Overhead Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps"] },
    { name: "Push Press",                   diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","outer-quadricep"] },
    { name: "Behind-the-Neck Press",        diff: "elite",        type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Upright Row",                  diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","anterior-deltoid","upper-trapezius","short-head-bicep"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Shoulder Press",      diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Arnold Press", angle: "90° upright",                 diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","posterior-deltoid","medial-head-triceps"] },
    { name: "Lateral Raises",               diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Front Raises",                 diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid"] },
    { name: "Bent-Over Rear Delt Raise",    diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Scaption",                     diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Machine Shoulder Press", angle: "90° upright",       diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps"] },
    { name: "Cable Lateral Raise",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Cable Front Raise",            diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid"] },
    { name: "Cable Rear Delt Fly",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle"] },
    { name: "Pec Deck Reverse Fly",         diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Machine Lateral Raise",        diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Deltoid Fly",                  diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","upper-trapezius"] },
    { name: "Machine Rear Delt Fly",        diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Machine Front Raise",          diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid"] },
    { name: "Smith Machine OHP",            diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Landmine Lateral Raise",       diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius"] },
    { name: "Landmine Press (Single)",      diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","upper-pectoralis","lateral-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Pike Push-ups",                diff: "intermediate", type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","medial-head-triceps"] },
    { name: "Handstand Push-ups",           diff: "elite",        type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps"] },
    { name: "Wall Handstand Push-ups",      diff: "advanced",     type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    // Additional shoulder exercises
    { name: "Military Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps","lateral-head-triceps"] },
    { name: "Seated Dumbbell Press", angle: "90° upright",        diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Z Press", angle: "Seated on floor, 90°",                      diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","upper-abdominals","medial-head-triceps"] },
    { name: "Bradford Press",               diff: "advanced",     type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","medial-head-triceps"] },
    { name: "Barbell Upright Row",          diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","anterior-deltoid","upper-trapezius","short-head-bicep"] },
    { name: "Cable Upright Row",            diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","upper-trapezius","short-head-bicep"] },
    { name: "Dumbbell Y Raise",             diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","lower-trapezius"] },
    { name: "Dumbbell W Raise",             diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Cable Y Raise",                diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["lateral-deltoid","posterior-deltoid","lower-trapezius"] },
    { name: "Seated Cable Rear Delt Row",   diff: "beginner",     type: "strength",     primary: "shoulders", svgTargets: ["posterior-deltoid","traps-middle","lower-trapezius"] },
    { name: "Dumbbell 6-Ways",              diff: "intermediate", type: "strength",     primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","posterior-deltoid"] },
  ],

  legs: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Barbell Back Squat",           diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","gluteus-medius","medial-hamstrings","lowerback"] },
    { name: "Front Squat",                  diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","upper-abdominals"] },
    { name: "Romanian Deadlift",            diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["lateral-hamstrings","medial-hamstrings","gluteus-maximus","lowerback"] },
    { name: "Stiff-Leg Deadlift",           diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["lateral-hamstrings","medial-hamstrings","gluteus-maximus","lowerback"] },
    { name: "Barbell Lunge",                diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings","gluteus-medius"] },
    { name: "Barbell Step-ups",             diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Barbell Hip Thrust",           diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings","medial-hamstrings"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Squat",               diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Goblet Squat",                 diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","upper-abdominals"] },
    { name: "Dumbbell Romanian Deadlift",   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["lateral-hamstrings","medial-hamstrings","gluteus-maximus","lowerback"] },
    { name: "Walking Lunges",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings","gluteus-medius"] },
    { name: "Reverse Lunges",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Bulgarian Split Squat",        diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings","gluteus-medius"] },
    { name: "Sumo Squat",                   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["inner-quadricep","inner-thigh","gluteus-maximus","gluteus-medius"] },
    // ── MACHINE ──────────────────────────────────────────────────────────────
    { name: "Leg Press", angle: "45°",                    diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","medial-hamstrings"] },
    { name: "Hack Squat", angle: "45°",                   diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Leg Extension",                diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Seated Leg Curl",              diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings"] },
    { name: "Lying Leg Curl",               diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings"] },
    { name: "Standing Leg Curl",            diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    { name: "Smith Machine Squat",          diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Smith Machine Lunge",          diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Adductor Machine",             diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep"] },
    { name: "Abductor Machine",             diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gluteus-medius","inner-thigh"] },
    { name: "Pendulum Squat",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Horizontal Leg Press",         diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","medial-hamstrings"] },
    { name: "V-Squat Machine",              diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Seated Calf Raise Machine",    diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gastrocnemius"] },
    { name: "Standing Calf Raise Machine",  diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gastrocnemius"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Bodyweight Squat",             diff: "beginner",     type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus"] },
    { name: "Jump Squats",                  diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","gastrocnemius"] },
    { name: "Pistol Squat",                 diff: "elite",        type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep","gluteus-maximus"] },
    { name: "Nordic Curl",                  diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus"] },
    { name: "Wall Sit",                     diff: "beginner",     type: "calisthenics", iso: true, primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Step-ups",                     diff: "beginner",     type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lateral-hamstrings"] },
    { name: "Box Jumps",                    diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","gastrocnemius"] },
    { name: "Broad Jumps",                  diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","gastrocnemius","lateral-hamstrings"] },
    { name: "Single-Leg Hip Thrust",        diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings"] },
    { name: "Landmine Squat",               diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus"] },
    { name: "Sissy Squat",                  diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Spanish Squat",                diff: "intermediate", type: "calisthenics", primary: "legs",      svgTargets: ["rectus-femoris","outer-quadricep","inner-quadricep"] },
    { name: "Lateral Lunge",                diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep","gluteus-medius","outer-quadricep"] },
    { name: "Curtsy Lunge",                 diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["gluteus-medius","outer-quadricep","inner-thigh"] },
    { name: "Single Leg Press", angle: "45°",             diff: "intermediate", type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus"] },
    { name: "Trap Bar Deadlift",            diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","lowerback","medial-hamstrings"] },
    { name: "Glute Ham Raise",              diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["medial-hamstrings","lateral-hamstrings","gluteus-maximus","gastrocnemius"] },
    { name: "Leg Press (High Foot)", angle: "45°",        diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["gluteus-maximus","medial-hamstrings","outer-quadricep"] },
    { name: "Leg Press (Low Foot)", angle: "45°",         diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep"] },
    { name: "Resistance Band Squat",        diff: "beginner",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus"] },
    { name: "Zercher Squat",                diff: "advanced",     type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","inner-quadricep","gluteus-maximus","upper-abdominals"] },
    { name: "Overhead Squat",               diff: "elite",        type: "strength",     primary: "legs",      svgTargets: ["outer-quadricep","rectus-femoris","gluteus-maximus","anterior-deltoid","upper-abdominals"] },
    { name: "Cossack Squat",                diff: "advanced",     type: "calisthenics", primary: "legs",      svgTargets: ["inner-thigh","inner-quadricep","gluteus-medius","outer-quadricep"] },
  ],

  glutes: [
    { name: "Hip Thrust",                   diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings","medial-hamstrings"] },
    { name: "Barbell Hip Thrust",           diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings","medial-hamstrings"] },
    { name: "Glute Bridge",                 diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","medial-hamstrings"] },
    { name: "Single-Leg Glute Bridge",      diff: "intermediate", type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings"] },
    { name: "Sumo Deadlift",                diff: "advanced",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","inner-thigh","lowerback","medial-hamstrings"] },
    { name: "Bulgarian Split Squat",        diff: "advanced",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","outer-quadricep","rectus-femoris","lateral-hamstrings"] },
    { name: "Cable Kickbacks",              diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","lateral-hamstrings"] },
    { name: "Cable Pull-Through",           diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lowerback"] },
    { name: "Abductor Machine",             diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-medius","inner-thigh"] },
    { name: "Lateral Band Walk",            diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Donkey Kicks",                 diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","lateral-hamstrings"] },
    { name: "Fire Hydrants",                diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
    { name: "Glute Kickback Machine",       diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus"] },
    { name: "Smith Machine Hip Thrust",     diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius","lateral-hamstrings"] },
    { name: "Banded Hip Thrust",            diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","gluteus-medius"] },
    { name: "Frog Pump",                    diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-maximus","inner-thigh"] },
    { name: "45° Back Extension (Glute)", angle: "45°",   diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","medial-hamstrings","lowerback"] },
    { name: "Reverse Hyperextension", angle: "Flat or slight decline",       diff: "intermediate", type: "strength",     primary: "glutes",    svgTargets: ["gluteus-maximus","lateral-hamstrings","lowerback"] },
    { name: "Clamshell",                    diff: "beginner",     type: "calisthenics", primary: "glutes",    svgTargets: ["gluteus-medius","inner-thigh"] },
    { name: "Standing Cable Abduction",     diff: "beginner",     type: "strength",     primary: "glutes",    svgTargets: ["gluteus-medius","gluteus-maximus"] },
  ],

  bicep: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Barbell Curl",                 diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","wrist-flexors"] },
    { name: "Wide-Grip Barbell Curl",       diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Reverse Barbell Curl",         diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-extensors"] },
    { name: "21s",                          diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Curl",                diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","wrist-flexors"] },
    { name: "Alternating Dumbbell Curl",    diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","wrist-flexors"] },
    { name: "Hammer Curl",                  diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-flexors","wrist-extensors"] },
    { name: "Concentration Curl", angle: "Seated, 90°",           diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Incline Dumbbell Curl", angle: "45–60°",        diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep"] },
    { name: "Spider Curl", angle: "45° prone on incline",                  diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Zottman Curl",                 diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep","wrist-extensors","wrist-flexors"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Preacher Curl",                diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Machine Preacher Curl",        diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Cable Curl",                   diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "High Cable Curl",              diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep"] },
    { name: "Cable Hammer Curl",            diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-flexors"] },
    { name: "Bicep Curl Machine",           diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Low Cable Curl",               diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Chin-ups",                     diff: "advanced",     type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","lats","lower-trapezius"] },
    { name: "Inverted Row (Supinated)",     diff: "intermediate", type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","lats","traps-middle"] },
    { name: "Bayesian Curl", angle: "Cable behind body",                diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep"] },
    { name: "Cross Body Hammer Curl",       diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","wrist-flexors"] },
    { name: "Waiter Curl",                  diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "Drag Curl",                    diff: "intermediate", type: "strength",     primary: "bicep",     svgTargets: ["long-head-bicep","short-head-bicep"] },
    { name: "Resistance Band Curl",         diff: "beginner",     type: "strength",     primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep"] },
    { name: "TRX Curl",                     diff: "intermediate", type: "calisthenics", primary: "bicep",     svgTargets: ["short-head-bicep","long-head-bicep","lats"] },
  ],

  tricep: [
    // ── BARBELL ──────────────────────────────────────────────────────────────
    { name: "Close-Grip Bench Press",       diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","mid-lower-pectoralis","anterior-deltoid"] },
    { name: "Skull Crushers", angle: "Flat (0°)",               diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    // ── DUMBBELL ─────────────────────────────────────────────────────────────
    { name: "Dumbbell Skull Crushers", angle: "Flat (0°)",      diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Overhead Tricep Extension", angle: "Seated, 90°",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Tricep Kickback",              diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Tate Press",                   diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps"] },
    // ── MACHINE / CABLE ──────────────────────────────────────────────────────
    { name: "Tricep Rope Pushdown",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Tricep Bar Pushdown",          diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Reverse Tricep Pushdown",      diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps"] },
    { name: "Overhead Cable Tricep Ext",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Tricep Machine Press",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Assisted Dip Machine",         diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid"] },
    { name: "Cable Overhead Tricep Ext",    diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    // ── CALISTHENICS ─────────────────────────────────────────────────────────
    { name: "Tricep Dips",                  diff: "intermediate", type: "calisthenics", primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid"] },
    { name: "Bench Dips",                   diff: "beginner",     type: "calisthenics", primary: "tricep",  swap: "Use a chair, table edge, bed, step or curb",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps"] },
    { name: "Diamond Push-ups",             diff: "intermediate", type: "calisthenics", primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps","mid-lower-pectoralis"] },
    { name: "Pike Push-up Hold",            diff: "intermediate", type: "calisthenics", iso: true, primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","anterior-deltoid"] },
    { name: "JM Press",                     diff: "advanced",     type: "strength",     primary: "tricep",    svgTargets: ["medial-head-triceps","lateral-head-triceps","long-head-triceps"] },
    { name: "California Press", angle: "Flat (0°)",             diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps","lateral-head-triceps"] },
    { name: "Rolling Tricep Extension",     diff: "intermediate", type: "strength",     primary: "tricep",    svgTargets: ["long-head-triceps","medial-head-triceps"] },
    { name: "Single Arm Pushdown",          diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Resistance Band Pushdown",     diff: "beginner",     type: "strength",     primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps"] },
    { name: "Ring Dips",                    diff: "elite",        type: "calisthenics", primary: "tricep",    svgTargets: ["lateral-head-triceps","medial-head-triceps","long-head-triceps","anterior-deltoid","mid-lower-pectoralis"] },
  ],

  forearms: [
    { name: "Wrist Curls",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors"] },
    { name: "Reverse Wrist Curls",          diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors"] },
    { name: "Farmer's Walk",                diff: "intermediate", type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors"] },
    { name: "Plate Pinch",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors"] },
    { name: "Dead Hang",                    diff: "beginner",     type: "calisthenics", iso: true, primary: "forearms",  svgTargets: ["wrist-flexors","long-head-bicep","lats"] },
    { name: "Towel Pull-ups",               diff: "advanced",     type: "calisthenics", primary: "forearms",  svgTargets: ["wrist-flexors","long-head-bicep","lats"] },
    { name: "Hammer Curl",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["long-head-bicep","wrist-flexors","wrist-extensors"] },
    { name: "Reverse Curl",                 diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors","long-head-bicep"] },
    { name: "Cable Wrist Curl",             diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors"] },
    { name: "Cable Reverse Wrist Curl",     diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-extensors"] },
    { name: "Rice Bucket",                  diff: "beginner",     type: "strength",     primary: "forearms",  svgTargets: ["wrist-flexors","wrist-extensors"] },
  ],

  core: [
    // ── ABS ──────────────────────────────────────────────────────────────────
    { name: "Crunch",                       diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals"] },
    { name: "Cable Crunch",                 diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Machine Crunch",               diff: "beginner",     type: "strength",     primary: "core",      svgTargets: ["upper-abdominals"] },
    { name: "Decline Sit-up", angle: "15–30°",               diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Weighted Sit-up",              diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Hanging Knee Raise",           diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals"] },
    { name: "Hanging Leg Raises",           diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","obliques"] },
    { name: "Lying Leg Raise",              diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals"] },
    { name: "Reverse Crunch",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals"] },
    { name: "Ab Wheel Rollout",             diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lats","long-head-triceps"] },
    { name: "V-ups",                        diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Toes to Bar",                  diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","lats"] },
    { name: "Dragon Flag",                  diff: "elite",        type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lats"] },
    { name: "L-Sit",                        diff: "elite",        type: "calisthenics", iso: true, primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","outer-quadricep"] },
    // ── OBLIQUES ─────────────────────────────────────────────────────────────
    { name: "Russian Twists",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Weighted Russian Twists",      diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Side Plank",                   diff: "beginner",     type: "calisthenics", iso: true, primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Side Plank with Rotation",     diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    { name: "Woodchop",                     diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Pallof Press",                 diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    { name: "Bicycle Crunch",               diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","lower-abdominals"] },
    // ── PLANK VARIATIONS ─────────────────────────────────────────────────────
    { name: "Plank",                        diff: "beginner",     type: "calisthenics", iso: true, primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lowerback"] },
    { name: "Long-Lever Plank",             diff: "intermediate", type: "calisthenics", iso: true, primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Weighted Plank",               diff: "intermediate", type: "strength", iso: true,     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques","lowerback"] },
    { name: "Plank Reach",                  diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Dead Bug",                     diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["lower-abdominals","upper-abdominals","lowerback"] },
    { name: "Bird Dog",                     diff: "beginner",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lowerback","gluteus-maximus"] },
    { name: "Ab Wheel (Kneeling)",          diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lats","long-head-triceps"] },
    { name: "Cable Woodchop (High)",        diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Cable Woodchop (Low)",         diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","lower-abdominals"] },
    { name: "Landmine Rotation",            diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals"] },
    { name: "Copenhagen Plank",             diff: "advanced",     type: "calisthenics", iso: true, primary: "core",      svgTargets: ["inner-thigh","obliques","upper-abdominals"] },
    { name: "Stir the Pot",                 diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","obliques"] },
    { name: "Cable Crunch (Kneeling)",      diff: "beginner",     type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Weighted Decline Crunch", angle: "15–30°",      diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "Shoulder Tap Push-ups",        diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["obliques","upper-abdominals","mid-lower-pectoralis","anterior-deltoid"] },
    { name: "Hollow Body Hold",             diff: "intermediate", type: "calisthenics", iso: true, primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","lats"] },
    { name: "Hollow Body Rock",             diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals"] },
    { name: "GHD Sit-up", angle: "GHD at 0° (parallel)",                   diff: "advanced",     type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","rectus-femoris"] },
    { name: "Suitcase Carry",               diff: "intermediate", type: "strength",     primary: "core",      svgTargets: ["obliques","upper-abdominals","wrist-flexors"] },
  ],

  calves: [
    { name: "Standing Calf Raises",         diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Seated Calf Raises",           diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["soleus"] },
    { name: "Leg Press Calf Raise",         diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Donkey Calf Raises",           diff: "intermediate", type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius"] },
    { name: "Single-Leg Calf Raise",        diff: "intermediate", type: "calisthenics", primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Calf Raise Machine",           diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Smith Machine Calf Raise",     diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Tibialis Raise",               diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["tibialis"] },
    { name: "Calf Press on Leg Press",      diff: "beginner",     type: "strength",     primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
    { name: "Jump Rope",                    diff: "intermediate", type: "cardio",       primary: "calves",    cardioMode: "timed", met: 11.0, svgTargets: ["gastrocnemius","soleus"] },
    { name: "Plyometric Calf Jumps",        diff: "intermediate", type: "calisthenics", primary: "calves",    svgTargets: ["gastrocnemius","soleus"] },
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
    { name: "Muscle-up",                    diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["lats","short-head-bicep","long-head-bicep","medial-head-triceps","lateral-head-triceps","upper-pectoralis","anterior-deltoid"] },
    { name: "Handstand",                    diff: "elite",        type: "calisthenics", primary: "shoulders", svgTargets: ["anterior-deltoid","lateral-deltoid","upper-trapezius","upper-abdominals","obliques"] },
    { name: "Front Lever",                  diff: "elite",        type: "calisthenics", iso: true, primary: "back",      svgTargets: ["lats","lower-trapezius","upper-abdominals","lower-abdominals","long-head-bicep"] },
    { name: "Back Lever",                   diff: "elite",        type: "calisthenics", iso: true, primary: "back",      svgTargets: ["lats","mid-lower-pectoralis","long-head-triceps","posterior-deltoid"] },
    { name: "Planche",                      diff: "elite",        type: "calisthenics", primary: "chest",     svgTargets: ["mid-lower-pectoralis","upper-pectoralis","anterior-deltoid","medial-head-triceps","upper-abdominals"] },
    { name: "Human Flag",                   diff: "elite",        type: "calisthenics", primary: "back",      svgTargets: ["lats","obliques","upper-abdominals","lateral-deltoid","short-head-bicep"] },
    { name: "Burpees",                      diff: "intermediate", type: "calisthenics", primary: "core",      svgTargets: ["upper-abdominals","lower-abdominals","outer-quadricep","gluteus-maximus","anterior-deltoid","mid-lower-pectoralis"] },
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
// Only ~70 lifts have a measured EMG profile above. Variants of the same
// movement pattern borrow the parent's profile (a dumbbell bench press loads
// the same muscles in the same proportions as a barbell one); everything else
// gets a profile DERIVED from its ordered svgTargets, so that no exercise ever
// credits 100 % of its work to one muscle group while its siblings credit 54 %.
export const EMG_ALIASES = {
  // orphaned keys (profile exists under an older name)
  "Barbell Back Squat": "Squat", "Front Squat": "Squat", "Smith Machine Squat": "Squat",
  "Dumbbell Squat": "Squat", "Goblet Squat": "Squat", "Bodyweight Squat": "Squat",
  "Landmine Squat": "Squat", "Pendulum Squat": "Hack Squat", "V-Squat Machine": "Hack Squat",
  "Zercher Squat": "Squat", "Overhead Squat": "Squat", "Jump Squats": "Squat", "Resistance Band Squat": "Squat",
  "Back Extension Machine": "Back Extension", "Back Extension (45°)": "Back Extension",
  "45° Back Extension (Glute)": "Back Extension", "Hyperextension": "Back Extension", "Superman": "Back Extension",
  "Seated Leg Curl": "Leg Curl", "Lying Leg Curl": "Leg Curl", "Standing Leg Curl": "Leg Curl",
  "Standing Calf Raises": "Calf Raises", "Calf Raise Machine": "Calf Raises", "Smith Machine Calf Raise": "Calf Raises",
  "Standing Calf Raise Machine": "Calf Raises", "Leg Press Calf Raise": "Calf Raises", "Calf Press on Leg Press": "Calf Raises",
  "Donkey Calf Raises": "Calf Raises", "Single-Leg Calf Raise": "Calf Raises", "Plyometric Calf Jumps": "Calf Raises",
  "Seated Calf Raise Machine": "Seated Calf Raises",
  "Bent-Over Rear Delt Raise": "Rear Delt Flyes", "Machine Rear Delt Fly": "Rear Delt Flyes",
  "Cable Rear Delt Fly": "Rear Delt Flyes", "Pec Deck Reverse Fly": "Rear Delt Flyes", "Dumbbell W Raise": "Rear Delt Flyes",
  "Seated Cable Rear Delt Row": "Rear Delt Flyes", "Banded Pull-apart": "Rear Delt Flyes",
  "Incline Dumbbell Curl": "Incline Curl",
  "Tricep Rope Pushdown": "Tricep Pushdown", "Tricep Bar Pushdown": "Tricep Pushdown",
  "Reverse Tricep Pushdown": "Tricep Pushdown", "Single Arm Pushdown": "Tricep Pushdown",
  "Resistance Band Pushdown": "Tricep Pushdown", "Tricep Machine Press": "Tricep Pushdown", "Tricep Kickback": "Tricep Pushdown",
  "Overhead Tricep Extension": "Overhead Tricep Ext", "Overhead Cable Tricep Ext": "Overhead Tricep Ext",
  "Cable Overhead Tricep Ext": "Overhead Tricep Ext", "Rolling Tricep Extension": "Overhead Tricep Ext",
  "Close-Grip Bench Press": "Close-Grip Bench", "JM Press": "Close-Grip Bench", "California Press": "Close-Grip Bench",
  "Dumbbell Skull Crushers": "Skull Crushers", "Tate Press": "Skull Crushers",
  // pressing variants
  "Dumbbell Bench Press": "Bench Press", "Smith Machine Bench Press": "Bench Press", "Chest Press Machine": "Bench Press",
  "Converging Chest Press Machine": "Bench Press", "Floor Press": "Bench Press", "Hex Press": "Bench Press",
  "Squeeze Press": "Bench Press", "Svend Press": "Pec Deck Machine",
  "Incline Dumbbell Press": "Incline Bench Press", "Incline Chest Press Machine": "Incline Bench Press",
  "Landmine Press": "Incline Bench Press", "Landmine Press (Single)": "Incline Bench Press",
  "Decline Dumbbell Press": "Decline Bench Press", "Decline Chest Press Machine": "Decline Bench Press",
  "Incline Dumbbell Flyes": "Dumbbell Flyes", "Decline Dumbbell Flyes": "Dumbbell Flyes", "Fly Machine": "Pec Deck Machine",
  "Cable Fly": "Cable Crossover", "Low Cable Fly": "Cable Crossover", "High Cable Fly": "Cable Crossover",
  "Single Arm Cable Fly": "Cable Crossover", "Resistance Band Fly": "Cable Crossover",
  "Wide Push-ups": "Push-ups", "Incline Push-ups": "Push-ups", "Decline Push-ups": "Incline Bench Press",
  "Archer Push-ups": "Push-ups", "Clap Push-ups": "Push-ups", "Ring Push-ups": "Push-ups", "Pseudo Planche Push-up": "Dips",
  "Tricep Dips": "Dips", "Ring Dips": "Dips", "Assisted Dip Machine": "Dips", "Bench Dips": "Diamond Push-ups",
  // pulling variants
  "Wide-Grip Pull-ups": "Pull-ups", "Neutral-Grip Pull-ups": "Pull-ups", "Towel Pull-ups": "Pull-ups",
  "Wide-Grip Lat Pulldown": "Lat Pulldown", "Reverse-Grip Lat Pulldown": "Chin-ups", "Neutral Grip Lat Pulldown": "Lat Pulldown",
  "Pendlay Row": "Barbell Row", "Meadows Row": "Dumbbell Row", "Kroc Row": "Dumbbell Row", "Cable Row (Single Arm)": "Dumbbell Row",
  "Chest Supported Row": "Seated Cable Row", "Chest Supported Row Machine": "Seated Cable Row", "Seal Row": "Seated Cable Row",
  "Machine Row": "Seated Cable Row", "Iso-Lateral Row Machine": "Seated Cable Row", "Wide-Grip Cable Row": "Seated Cable Row",
  "Inverted Row": "Seated Cable Row", "Inverted Row (Supinated)": "Chin-ups", "Resistance Band Row": "Seated Cable Row",
  "Rack Pull": "Deadlift", "Trap Bar Deadlift": "Deadlift", "Smith Machine Shrug": "Shrugs",
  // shoulders
  "Dumbbell Shoulder Press": "Overhead Press", "Seated Dumbbell Press": "Overhead Press", "Military Press": "Overhead Press",
  "Machine Shoulder Press": "Overhead Press", "Smith Machine OHP": "Overhead Press", "Push Press": "Overhead Press",
  "Z Press": "Overhead Press", "Bradford Press": "Overhead Press", "Behind-the-Neck Press": "Overhead Press",
  "Wall Handstand Push-ups": "Pike Push-ups", "Handstand Push-ups": "Pike Push-ups", "Pike Push-up Hold": "Pike Push-ups",
  "Machine Lateral Raise": "Lateral Raises", "Landmine Lateral Raise": "Lateral Raises", "Deltoid Fly": "Lateral Raises",
  "Cable Front Raise": "Front Raises", "Machine Front Raise": "Front Raises",
  "Barbell Upright Row": "Upright Row", "Cable Upright Row": "Upright Row",
  // arms
  "Wide-Grip Barbell Curl": "Barbell Curl", "Dumbbell Curl": "Barbell Curl", "Alternating Dumbbell Curl": "Barbell Curl",
  "21s": "Barbell Curl", "Machine Preacher Curl": "Preacher Curl", "Spider Curl": "Preacher Curl",
  "High Cable Curl": "Cable Curl", "Low Cable Curl": "Cable Curl", "Bicep Curl Machine": "Cable Curl",
  "Bayesian Curl": "Incline Curl", "Drag Curl": "Barbell Curl", "Waiter Curl": "Concentration Curl",
  "Resistance Band Curl": "Cable Curl", "TRX Curl": "Chin-ups",
  "Cable Hammer Curl": "Hammer Curl", "Cross Body Hammer Curl": "Hammer Curl", "Zottman Curl": "Hammer Curl",
  "Reverse Barbell Curl": "Hammer Curl", "Reverse Curl": "Hammer Curl",
  "Cable Wrist Curl": "Wrist Curls", "Cable Reverse Wrist Curl": "Reverse Wrist Curls",
  // legs & glutes
  "Leg Press (High Foot)": "Leg Press", "Leg Press (Low Foot)": "Leg Press", "Horizontal Leg Press": "Leg Press",
  "Single Leg Press": "Leg Press", "Stiff-Leg Deadlift": "Romanian Deadlift", "Dumbbell Romanian Deadlift": "Romanian Deadlift",
  "Good Mornings": "Romanian Deadlift", "Jefferson Curl": "Romanian Deadlift", "Glute Ham Raise": "Nordic Curl",
  "Barbell Lunge": "Walking Lunges", "Reverse Lunges": "Walking Lunges", "Smith Machine Lunge": "Walking Lunges",
  "Barbell Step-ups": "Walking Lunges", "Step-ups": "Walking Lunges", "Box Jumps": "Squat", "Broad Jumps": "Squat",
  "Barbell Hip Thrust": "Hip Thrust", "Smith Machine Hip Thrust": "Hip Thrust", "Banded Hip Thrust": "Hip Thrust",
  "Single-Leg Hip Thrust": "Hip Thrust", "Single-Leg Glute Bridge": "Glute Bridge", "Frog Pump": "Glute Bridge",
  "Glute Kickback Machine": "Cable Kickbacks", "Cable Pull-Through": "Hip Thrust", "Reverse Hyperextension": "Back Extension",
  "Standing Cable Abduction": "Abductor Machine", "Lateral Band Walk": "Fire Hydrants", "Clamshell": "Fire Hydrants",
  // core
  "Machine Crunch": "Crunch", "Cable Crunch (Kneeling)": "Cable Crunch", "Weighted Decline Crunch": "Cable Crunch",
  "Decline Sit-up": "Crunch", "Weighted Sit-up": "Crunch", "Hanging Knee Raise": "Hanging Leg Raises",
  "Toes to Bar": "Hanging Leg Raises", "Lying Leg Raise": "Hanging Leg Raises", "Reverse Crunch": "Hanging Leg Raises",
  "V-ups": "Dragon Flag", "Ab Wheel (Kneeling)": "Ab Wheel Rollout", "Weighted Russian Twists": "Russian Twists",
  "Side Plank with Rotation": "Side Plank", "Long-Lever Plank": "Plank", "Weighted Plank": "Plank", "Plank Reach": "Plank",
  "Hollow Body Hold": "L-Sit", "Hollow Body Rock": "L-Sit", "Woodchop": "Russian Twists", "Cable Woodchop (High)": "Russian Twists",
  "Cable Woodchop (Low)": "Russian Twists", "Landmine Rotation": "Russian Twists", "Pallof Press": "Side Plank",
};

// Derived profile for lifts with no measured EMG: svgTargets are listed in
// order of importance, so the first is the prime mover and the rest taper.
const DERIVED_WEIGHTS = [100, 70, 55, 45, 38, 32, 28, 25];
export function emgFor(ex) {
  if (!ex) return null;
  if (ex.emg) return ex.emg;
  const direct = EXERCISE_EMG[ex.name];
  if (direct) return direct;
  const alias = EMG_ALIASES[ex.name];
  if (alias && EXERCISE_EMG[alias]) return EXERCISE_EMG[alias];
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
