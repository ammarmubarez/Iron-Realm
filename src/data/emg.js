// Muscle activation profiles for every exercise (v2.4 anatomy pass).
// Pure data — no runtime dependencies. Edit here, not in iron-realm.jsx.
//
// WHAT A PROFILE MEANS
//   { "sub-muscle id": relative activation 0–100 }. The prime mover is 100 and
//   every other muscle is scaled to it. The XP engine normalises a profile to
//   shares (a muscle at 50 next to a prime mover at 100 gets a third of the
//   stimulus), so what matters is the RATIO between muscles, not the absolute
//   %MVIC of any one of them. A stabiliser is listed when EMG studies put it
//   above ~15 % MVIC in the lift; below that it is noise for hypertrophy.
//
// HOW THE NUMBERS WERE SET
//   Where surface-EMG comparisons exist the ratios follow them; where they do
//   not (many machine and band variants) the profile is copied from the
//   closest studied movement pattern and adjusted for the joint angles and
//   stability demands that are known to move activation. Key sources:
//   Bench angle → Trebs 2010, Lauver 2016, Saeterbakken 2017 (0°/30°/45°);
//   grip width → Lehman 2005, Barnett 1995; dumbbell vs barbell → Saeterbakken
//   2011; push-up loading and core → Cogley 2005, Freeman 2006, Youdas 2010;
//   pull-up/chin-up → Youdas 2010; rows → Lehman 2004, Fenwick 2009; pulldown
//   grip → Andersen 2014, Lusk 2010; deadlift → Escamilla 2002, Swinton 2011;
//   squat depth/variant → Escamilla 2001, Contreras 2016, Vigotsky 2019;
//   leg extension vs squat → Ema 2016; hip thrust/bridge/glutes → Contreras
//   2015, Distefano 2009, Boren 2011; step-up/lunge → Simenz 2012, Andersen
//   2014; hamstrings → Bourne 2017, Maeo 2021; calves → Signorile 2002;
//   shoulders → Saeterbakken 2013, Sweeney 2014, Botton 2013 (rear delt),
//   Schoenfeld 2011 (upright row), Ekstrom 2003 (Y/T/W); biceps → Oliveira
//   2009, Marcolin 2018; triceps → Boehler/ACE 2011, Kholinne 2018; core →
//   Escamilla 2006/2010, Ekstrom 2007, Youdas 2008 (bird dog), Cambridge 2012
//   (band walks). Fibre-type data for atrophy: Johnson 1973.
//
// ANATOMY NOTES THAT SHAPE THE DATA
//   · "Upper/lower abs" are two ends of one rectus abdominis. Regional EMG
//     differences are real but modest (Sarti 1996, Willett 2001): trunk
//     flexion favours the upper portion slightly, posterior pelvic tilt /
//     leg-raising favours the lower portion slightly. Profiles reflect that;
//     they never give one end 100 and the other 0.
//   · Leg raises, sit-ups, L-sits and hanging work are HIP-FLEXOR dominant
//     (Escamilla 2006). The figure has no iliopsoas, so hip-flexion work is
//     credited to rectus femoris, the one hip flexor it does have.
//   · There is no serratus anterior, rotator cuff, brachialis or brachio-
//     radialis region. Serratus work (push-ups, punches) is dropped; brachialis
//     and brachioradialis effort is credited to the biceps long head / wrist
//     extensors respectively, which is where a hammer-grip curl's work lands
//     on the figure.
//   · Abduction machines and clamshells do NOT train the adductors; the old
//     data credited inner thigh there, which was simply wrong.
//   · The pull-over and straight-arm pulldown are pec-dominant, not lat-
//     dominant (Marchetti 2011) — the lats get a share, not the lead.
//   · Front squats, goblet squats and Zercher squats are more quad- and
//     trunk-dominant than back squats; low-bar/back squats load the hips more.
//   · Deadlifts are hip-hinge lifts: erectors, glutes and hamstrings lead;
//     the lats work isometrically and get ~50, not 70.
//
// CODES (parsed at load; unknown codes throw so a typo cannot ship):
//   UP upper pec · MP mid/lower pec · LAT lats · LB lower back (erectors)
//   UT/MT/LT upper/mid/lower traps · AD/LD/PD front/side/rear delt
//   BS/BL biceps short/long head · TM/TLO/TLA triceps medial/long/lateral
//   WF/WE wrist flexors/extensors · UA/LA/OB upper abs/lower abs/obliques
//   GM glute max · GMD glute med · VL/RF/VM outer quad/rectus femoris/inner quad
//   ADD adductors (inner thigh) · BF/ST lateral/medial hamstrings
//   GAS/SOL/TIB gastrocnemius/soleus/tibialis

const CODES = {
  UP: "upper-pectoralis", MP: "mid-lower-pectoralis",
  LAT: "lats", LB: "lowerback", UT: "upper-trapezius", MT: "traps-middle", LT: "lower-trapezius",
  AD: "anterior-deltoid", LD: "lateral-deltoid", PD: "posterior-deltoid",
  BS: "short-head-bicep", BL: "long-head-bicep",
  TM: "medial-head-triceps", TLO: "long-head-triceps", TLA: "lateral-head-triceps",
  WF: "wrist-flexors", WE: "wrist-extensors",
  UA: "upper-abdominals", LA: "lower-abdominals", OB: "obliques",
  GM: "gluteus-maximus", GMD: "gluteus-medius",
  VL: "outer-quadricep", RF: "rectus-femoris", VM: "inner-quadricep", ADD: "inner-thigh",
  BF: "lateral-hamstrings", ST: "medial-hamstrings",
  GAS: "gastrocnemius", SOL: "soleus", TIB: "tibialis",
};

const RAW = {
  // ── CHEST: horizontal pressing ──────────────────────────────────────────
  // Flat pressing: sternal pec leads, clavicular ~75 % of it, front delt ~60,
  // triceps ~half. Incline raises clavicular + front delt (Trebs 2010; at 44°
  // the front delt is the single most active muscle); decline drops both.
  "Bench Press":                    "MP100 UP75 AD60 TLA55 TM50 TLO40",
  "Dumbbell Bench Press":           "MP100 UP75 AD60 TLA45 TM40 TLO30",     // DBs: more pec, less triceps (Saeterbakken 2011)
  "Smith Machine Bench Press":      "MP100 UP70 AD55 TLA60 TM55 TLO40",     // fixed path: less stabiliser, more triceps
  "Chest Press Machine":            "MP100 UP70 AD55 TLA55 TM50 TLO35",
  "Converging Chest Press Machine": "MP100 UP75 AD55 TLA50 TM45 TLO30",
  "Floor Press":                    "MP90 UP55 AD50 TLA100 TM90 TLO60",      // half ROM removes the pec stretch; lockout is triceps
  "Hex Press":                      "MP100 UP70 AD45 TLA60 TM55 TLO40",
  "Squeeze Press":                  "MP100 UP75 AD45 TLA55 TM50 TLO35",
  "Svend Press":                    "MP100 UP80 AD40 TM20",                  // isometric squeeze; almost no elbow extension
  "Incline Bench Press":            "UP100 MP65 AD85 TLA50 TM45 TLO35",
  "Incline Dumbbell Press":         "UP100 MP65 AD85 TLA40 TM35 TLO30",
  "Incline Chest Press Machine":    "UP100 MP65 AD80 TLA45 TM40 TLO30",
  "Landmine Press":                 "UP100 MP60 AD90 TLA55 TM50 TLO40 UA20 OB25",
  "Landmine Press (Single)":        "UP95 MP55 AD100 TLA55 TM50 TLO40 OB40 UA25",
  "Decline Bench Press":            "MP100 UP50 AD40 TLA55 TM50 TLO40",
  "Decline Dumbbell Press":         "MP100 UP50 AD40 TLA45 TM40 TLO30",
  "Decline Chest Press Machine":    "MP100 UP50 AD40 TLA50 TM45 TLO35",
  "Close-Grip Bench Press":         "TLA100 TM95 TLO75 MP80 UP55 AD60",     // narrow grip: triceps lead, pec still high (Lehman 2005)
  "Close-Grip Bench":               "TLA100 TM95 TLO75 MP80 UP55 AD60",
  // Flyes and cable work: shoulder adduction, elbow fixed → pec + front delt,
  // essentially no triceps; the elbow-flexed hold puts a little on the biceps.
  "Dumbbell Flyes":                 "MP100 UP75 AD45 BS20",
  "Incline Dumbbell Flyes":         "UP100 MP70 AD60 BS20",
  "Decline Dumbbell Flyes":         "MP100 UP50 AD30 BS20",
  "Pec Deck Machine":               "MP100 UP75 AD35",
  "Fly Machine":                    "MP100 UP75 AD35",
  "Cable Crossover":                "MP100 UP70 AD40",
  "Cable Fly":                      "MP100 UP70 AD40",
  "Single Arm Cable Fly":           "MP100 UP70 AD40 OB30 UA20",
  "Low Cable Fly":                  "UP100 MP70 AD55",                       // low-to-high: clavicular fibres lead
  "High Cable Fly":                 "MP100 UP50 AD30",                       // high-to-low: sternal/abdominal fibres
  "Resistance Band Fly":            "MP100 UP70 AD40",
  // Pull-over: pec-dominant with the lats and long-head triceps assisting
  // (Marchetti 2011).
  "Dumbbell Pullover":              "MP100 UP60 LAT70 TLO65 PD25",
  "Lever Pullover Machine":         "MP90 UP55 LAT100 TLO60 PD30 LT30",     // machine arc keeps the arms locked → lats lead slightly
  // Push-ups: chest ~ triceps ~ 60–70 % MVIC, front delt ~ 45, rectus/obliques
  // 20–30 % as stabilisers (Freeman 2006, Youdas 2010).
  "Push-ups":                       "MP100 UP70 AD60 TLA65 TM60 TLO45 UA25 LA20 OB20",
  "Wide Push-ups":                  "MP100 UP70 AD60 TLA50 TM45 TLO35 UA25 LA20 OB20",
  "Incline Push-ups":               "MP100 UP60 AD45 TLA50 TM45 TLO35 UA15 LA15",
  "Decline Push-ups":               "UP100 MP80 AD80 TLA65 TM60 TLO45 UA30 LA25 OB25",
  "Diamond Push-ups":               "TLA100 TM95 TLO70 MP85 UP55 AD55 UA25 LA20 OB20",
  "Shoulder Tap Push-ups":          "MP100 UP65 AD65 TLA60 TM55 TLO40 OB60 UA50 LA45",
  "Archer Push-ups":                "MP100 UP70 AD65 TLA75 TM70 TLO50 UA30 LA25 OB35",
  "Clap Push-ups":                  "MP100 UP70 AD70 TLA75 TM70 TLO50 UA35 LA30 OB25",
  "Ring Push-ups":                  "MP100 UP70 AD65 TLA65 TM60 TLO45 UA35 LA30 OB30",
  "Pseudo Planche Push-up":         "AD100 UP80 MP85 TLA70 TM70 TLO55 UA45 LA40 OB35 WF35",
  "Dips":                           "MP100 UP50 AD70 TLA75 TM70 TLO55",      // forward lean: pec and triceps both high
  "Ring Dips":                      "MP100 UP50 AD75 TLA80 TM75 TLO60 UA25 LA20",
  "Assisted Dip Machine":           "TLA100 TM95 TLO70 MP80 UP40 AD65",      // upright machine dip: triceps lead
  "Tricep Dips":                    "TLA100 TM95 TLO70 MP60 UP35 AD65",
  "Bench Dips":                     "TLA100 TM95 TLO65 AD60 MP45 UP30",

  // ── BACK: hip hinges ─────────────────────────────────────────────────────
  // Deadlift (Escamilla 2002): erectors and glutes lead, hamstrings and quads
  // share the drive, lats/traps work isometrically, grip is real work.
  "Deadlift":                       "LB100 GM90 ST75 BF70 VL60 VM55 RF35 LAT50 UT60 MT55 WF45 OB30 UA25",
  "Rack Pull":                      "LB100 GM85 UT90 MT70 LAT55 ST60 BF55 WF50",
  "Sumo Deadlift":                  "GM100 ADD90 VM90 VL80 GMD60 LB80 ST55 BF50 UT55 MT45 WF45",  // wide stance: quads + adductors up, erectors down
  "Trap Bar Deadlift":              "VL100 VM90 RF85 GM90 LB80 ST60 BF55 UT60 MT45 WF45",           // more quad, less erector (Swinton 2011)
  "Romanian Deadlift":              "ST100 BF95 GM90 LB75 WF35 MT30",
  "Dumbbell Romanian Deadlift":     "ST100 BF95 GM90 LB70 WF35 MT30",
  "Stiff-Leg Deadlift":             "ST100 BF95 GM85 LB85 WF35",
  "Good Mornings":                  "LB100 ST90 BF85 GM80",
  "Jefferson Curl":                 "LB100 ST75 BF70 GM40 LAT20",
  "Back Extension Machine":         "LB100 GM70 ST60 BF55",
  "Back Extension (45°)":           "LB100 GM70 ST60 BF55",
  "Hyperextension":                 "LB100 GM70 ST60 BF55",
  "45° Back Extension (Glute)":     "GM100 LB80 ST80 BF75",                  // rounded upper back, hips do the work
  "Reverse Hyperextension":         "GM100 ST70 BF65 LB65",
  "Superman":                       "LB100 GM55 MT40 LT40 PD30 ST30 BF30",
  // Rows: lats + mid/lower traps + rear delt, biceps assist, erectors hold
  // the hinge in free-standing versions (Fenwick 2009).
  "Barbell Row":                    "LAT100 MT90 LT70 PD75 BL60 BS55 LB70 UT50 WF40",
  "Pendlay Row":                    "LAT100 MT95 LT70 PD75 BL55 BS50 LB55 UT45 WF40",
  "T-Bar Row":                      "LAT100 MT85 LT65 PD65 BL55 BS50 LB60 WF40",
  "Dumbbell Row":                   "LAT100 MT75 LT60 PD65 BL55 BS50 OB30 LB30 WF40",
  "Kroc Row":                       "LAT100 MT80 LT60 PD65 BL55 BS50 UT40 OB30 WF55",
  "Meadows Row":                    "LAT100 MT80 LT60 PD70 BL60 BS50 OB30 WF45",
  "Cable Row (Single Arm)":         "LAT100 MT75 LT60 PD60 BL55 BS50 OB35 WF35",
  "Seated Cable Row":               "LAT100 MT90 LT70 PD70 BL55 BS50 LB35 WF40",
  "Wide-Grip Cable Row":            "MT100 PD85 LT70 LAT65 BL40 BS35",
  "Chest Supported Row":            "MT100 LAT90 LT75 PD70 BL50 BS45 WF30",
  "Chest Supported Row Machine":    "MT100 LAT90 LT75 PD70 BL50 BS45 WF30",
  "Seal Row":                       "MT100 LAT90 LT75 PD70 BL50 BS45 WF30",
  "Machine Row":                    "MT100 LAT90 LT70 PD65 BL50 BS45",
  "Iso-Lateral Row Machine":        "LAT100 MT80 LT60 PD60 BL55 BS50",
  "Resistance Band Row":            "LAT100 MT80 LT60 PD55 BL50 BS45",
  "Inverted Row":                   "MT100 LAT85 PD80 LT70 BS60 BL55 LB25 WF35",   // Youdas 2016
  "Inverted Row (Supinated)":       "BS100 BL95 LAT85 MT90 PD65 LT60 WF35",
  "TRX Curl":                       "BS100 BL85 LAT30 LB20 WF30",
  "Shrugs":                         "UT100 MT45 WF40",
  "Smith Machine Shrug":            "UT100 MT45 WF35",
  // Vertical pulls (Youdas 2010: lats 117–130 % MVIC, biceps 78 % pull-up /
  // 96 % chin-up, lower trap, pec major 44–57 %, erectors ~40 %).
  "Pull-ups":                       "LAT100 BL60 BS55 LT60 MT55 PD55 MP35 WF45 LA25",
  "Wide-Grip Pull-ups":             "LAT100 BL50 BS45 LT60 MT60 PD60 MP30 WF45 LA25",
  "Chin-ups":                       "LAT100 BS85 BL80 LT55 MT45 PD40 MP45 WF45 LA25",
  "Neutral-Grip Pull-ups":          "LAT100 BL75 BS60 LT55 MT50 PD45 MP35 WF50 LA25",
  "Towel Pull-ups":                 "WF100 LAT95 BL60 BS55 LT50 MT45 PD40 WE35",
  "Muscle-up":                      "LAT100 BL70 BS65 LT60 MT55 MP65 UP45 AD60 TLA75 TM65 TLO55 WF55 LA35 UA30",
  "Scapular Pull-ups":              "LT100 LAT70 MT50 WF40",
  "Dead Hang":                      "WF100 LAT40 LT30 BL25",
  "Lat Pulldown":                   "LAT100 BL55 BS50 LT55 MT50 PD45 WF35",
  "Wide-Grip Lat Pulldown":         "LAT100 BL45 BS40 LT55 MT55 PD55 WF35",
  "Reverse-Grip Lat Pulldown":      "LAT100 BS80 BL75 LT50 MT45 PD35 WF35",
  "Neutral Grip Lat Pulldown":      "LAT100 BL65 BS55 LT55 MT50 PD40 WF40",
  "Cable Straight-Arm Pulldown":    "LAT100 TLO55 PD40 MP45 LT35 UA20",
  "Straight Arm Cable Pulldown":    "LAT100 TLO55 PD40 MP45 LT35 UA20",
  "Face Pulls":                     "PD100 MT85 LT65 UT45 LD35 BL25",
  "Banded Pull-apart":              "PD100 MT85 LT60 LD30",

  // ── SHOULDERS ───────────────────────────────────────────────────────────
  // Overhead pressing: front delt leads, side delt ~70, upper trap and
  // triceps ~60; standing barbell adds trunk work (Saeterbakken 2013).
  "Overhead Press":                 "AD100 LD70 UT65 TM65 TLA55 TLO50 UP35 PD20 LB30 UA25 OB25",
  "Military Press":                 "AD100 LD70 UT60 TM65 TLA55 TLO50 UP35 LB25 UA25 OB25",
  "Push Press":                     "AD100 LD65 UT70 TM60 TLA50 TLO45 VL55 RF45 VM45 GM40 GAS35 LB35",
  "Smith Machine OHP":              "AD100 LD70 UT55 TM60 TLA50 TLO45 UP30",
  "Machine Shoulder Press":         "AD100 LD65 UT40 TM55 TLA45 TLO40 UP25",
  "Dumbbell Shoulder Press":        "AD100 LD75 UT55 TM60 TLA50 TLO45 UP30",
  "Seated Dumbbell Press":          "AD100 LD75 UT55 TM60 TLA50 TLO45 UP30",
  "Arnold Press":                   "AD100 LD75 PD40 UT50 TM55 TLA45 TLO40 UP30",
  "Behind-the-Neck Press":          "LD100 AD85 PD45 UT65 TM60 TLA50 TLO45",
  "Z Press":                        "AD100 LD70 UT55 TM60 TLA50 TLO45 UA55 LA40 OB40 LB45",
  "Bradford Press":                 "AD100 LD85 PD40 UT60 TM40 TLA35 TLO30",
  "Scaption":                       "AD100 LD85 UT60 LT20",
  // Lateral raises: side delt with front delt and upper trap assisting;
  // rear delt joins as the arm goes past the frontal plane.
  "Lateral Raises":                 "LD100 AD45 PD30 UT55 MT20",
  "Cable Lateral Raise":            "LD100 AD40 PD30 UT45",
  "Machine Lateral Raise":          "LD100 AD35 PD25 UT40",
  "Landmine Lateral Raise":         "LD100 AD50 PD25 UT50 OB20",
  "Deltoid Fly":                    "LD100 PD60 AD30 UT45 MT25",
  "Front Raises":                   "AD100 LD45 UP40 UT30 BS15",
  "Cable Front Raise":              "AD100 LD45 UP40 UT30",
  "Machine Front Raise":            "AD100 LD45 UP35 UT30",
  // Rear delt: horizontal abduction. Mid/lower traps and infraspinatus (not
  // on the figure) share the work (Botton 2013, Schoenfeld 2013).
  "Bent-Over Rear Delt Raise":      "PD100 MT70 LT45 LD40 LB25",
  "Rear Delt Flyes":                "PD100 MT70 LT45 LD40 LB25",
  "Cable Rear Delt Fly":            "PD100 MT70 LT45 LD40",
  "Machine Rear Delt Fly":          "PD100 MT70 LT45 LD40",
  "Pec Deck Reverse Fly":           "PD100 MT70 LT45 LD40",
  "Seated Cable Rear Delt Row":     "PD100 MT85 LT60 BL30 BS25",
  "Dumbbell W Raise":               "PD100 MT80 LT65 LD30",
  "Dumbbell Y Raise":               "LT100 PD70 LD55 AD30 UT30",              // Y = lower trap (Ekstrom 2003)
  "Cable Y Raise":                  "LT100 PD70 LD55 AD30 UT30",
  "Dumbbell 6-Ways":                "AD100 LD90 PD70 UT50 LT35",
  "Upright Row":                    "LD100 UT90 AD60 PD40 BS40 BL35 WF30",    // Schoenfeld 2011 (wide grip)
  "Barbell Upright Row":            "LD100 UT90 AD60 PD40 BS40 BL35 WF30",
  "Cable Upright Row":              "LD100 UT85 AD55 PD40 BS40 BL35 WF30",
  // Inverted pressing: front delt + triceps, upper trap for the shrug at top.
  "Pike Push-ups":                  "AD100 LD65 TM65 TLA55 TLO45 UT50 UP40 UA25",
  "Pike Push-up Hold":              "AD100 LD50 TM65 TLA55 TLO45 UT40 UP30 UA20",
  "Wall Handstand Push-ups":        "AD100 LD75 TM70 TLA60 TLO50 UT65 UP40 UA30 OB25",
  "Handstand Push-ups":             "AD100 LD75 TM75 TLA65 TLO55 UT70 UP40 UA35 OB30 WF35",
  "Handstand":                      "AD100 LD70 UT65 TM50 TLA40 TLO35 UA50 OB45 LA40 WF50 LB30",

  // ── ARMS: biceps ────────────────────────────────────────────────────────
  // Supinated curls load both heads; the short head leads in preacher /
  // concentration positions (shoulder flexed), the long head in incline /
  // drag / Bayesian positions (shoulder extended, long head on stretch).
  // Hammer and reverse grips shift work to brachialis / brachioradialis,
  // credited to long head / wrist extensors on the figure.
  "Barbell Curl":                   "BS100 BL90 WF35 AD20",
  "Wide-Grip Barbell Curl":         "BS100 BL80 WF35 AD20",
  "21s":                            "BS100 BL90 WF35 AD20",
  "Dumbbell Curl":                  "BS100 BL90 WF35 AD15",
  "Alternating Dumbbell Curl":      "BS100 BL90 WF35 AD15",
  "Cable Curl":                     "BS100 BL85 WF30",
  "Low Cable Curl":                 "BS100 BL85 WF30",
  "High Cable Curl":                "BS100 BL65 WF25",
  "Bicep Curl Machine":             "BS100 BL80 WF25",
  "Resistance Band Curl":           "BS100 BL85 WF30",
  "Preacher Curl":                  "BS100 BL70 WF30",
  "Machine Preacher Curl":          "BS100 BL70 WF25",
  "Spider Curl":                    "BS100 BL75 WF30",
  "Concentration Curl":             "BS100 BL70 WF30",
  "Waiter Curl":                    "BS100 BL70 WF40",
  "Incline Dumbbell Curl":          "BL100 BS75 WF30",
  "Bayesian Curl":                  "BL100 BS80 WF30",
  "Drag Curl":                      "BL100 BS85 PD20 WF30",
  "Hammer Curl":                    "BL100 BS75 WE70 WF35",
  "Cable Hammer Curl":              "BL100 BS75 WE65 WF35",
  "Cross Body Hammer Curl":         "BL100 BS60 WE65 WF35",
  "Zottman Curl":                   "BL100 BS90 WE70 WF45",
  "Reverse Barbell Curl":           "WE100 BL60 BS45 WF25",
  "Reverse Curl":                   "WE100 BL60 BS45 WF25",

  // ── ARMS: triceps ───────────────────────────────────────────────────────
  // All three heads extend the elbow; the long head also crosses the
  // shoulder, so overhead and skull-crusher positions (shoulder flexed) load
  // it most, while pushdowns (arm at the side) favour lateral/medial heads.
  // Kickbacks are near the top of ACE's list (Boehler 2011).
  "Skull Crushers":                 "TLO100 TM85 TLA80",
  "Dumbbell Skull Crushers":        "TLO100 TM85 TLA80",
  "Rolling Tricep Extension":       "TLO100 TM85 TLA75",
  "Overhead Tricep Extension":      "TLO100 TM80 TLA70",
  "Overhead Cable Tricep Ext":      "TLO100 TM80 TLA70",
  "Cable Overhead Tricep Ext":      "TLO100 TM80 TLA70",
  "California Press":               "TLO100 TM90 TLA85 MP45 AD35",
  "JM Press":                       "TLA100 TM95 TLO70 MP55 AD45",
  "Tate Press":                     "TM100 TLA90 TLO60 MP30",
  "Tricep Rope Pushdown":           "TLA100 TM95 TLO55 WE20",
  "Tricep Pushdown":                "TLA100 TM95 TLO55 WE20",
  "Tricep Bar Pushdown":            "TLA100 TM95 TLO60",
  "Single Arm Pushdown":            "TLA100 TM90 TLO50 OB15",
  "Resistance Band Pushdown":       "TLA100 TM95 TLO55",
  "Reverse Tricep Pushdown":        "TM100 TLA85 TLO50 WE35",
  "Tricep Machine Press":           "TLA100 TM90 TLO60 MP30 AD30",
  "Tricep Kickback":                "TLA100 TM90 TLO85 PD25",

  // ── FOREARMS / GRIP ─────────────────────────────────────────────────────
  "Wrist Curls":                    "WF100",
  "Cable Wrist Curl":               "WF100",
  "Reverse Wrist Curls":            "WE100",
  "Cable Reverse Wrist Curl":       "WE100",
  "Rice Bucket":                    "WF100 WE90",
  "Plate Pinch":                    "WF100 WE30",
  "Farmer's Walk":                  "WF100 UT75 MT40 OB50 UA35 LA30 LB45 GMD45 VL35 VM30 RF30 GAS35 SOL35",
  "Suitcase Carry":                 "OB100 WF90 GMD65 UA50 LA45 LB55 UT55 VL25",

  // ── CORE ────────────────────────────────────────────────────────────────
  // Trunk flexion (crunch family): rectus leads, obliques ~30–40 %.
  // Hip-flexion movements (leg raises, sit-ups, L-sit): rectus femoris /
  // hip flexors are the main mover and the abs work hard to hold the pelvis
  // (Escamilla 2006, 2010). Anti-rotation / anti-extension: obliques lead.
  "Crunch":                         "UA100 LA80 OB30",
  "Machine Crunch":                 "UA100 LA85 OB30",
  "Cable Crunch":                   "UA100 LA85 OB40 LAT20",
  "Cable Crunch (Kneeling)":        "UA100 LA85 OB40 LAT20",
  "Weighted Decline Crunch":        "UA100 LA85 OB40 RF35",
  "Decline Sit-up":                 "UA100 LA90 OB40 RF60 ADD20",
  "Weighted Sit-up":                "UA100 LA90 OB40 RF60 ADD20",
  "Bicycle Crunch":                 "OB100 UA90 LA80 RF50",
  "Reverse Crunch":                 "LA100 UA80 OB35 RF35",
  "Lying Leg Raise":                "LA100 UA75 OB30 RF80",
  "Hanging Knee Raise":             "LA100 UA80 OB45 RF60 LAT25 WF40",
  "Hanging Leg Raises":             "LA100 UA85 OB50 RF75 LAT30 WF45",
  "Toes to Bar":                    "LA100 UA90 OB50 RF75 LAT60 WF50",
  "V-ups":                          "UA100 LA90 OB40 RF70",
  "GHD Sit-up":                     "RF100 LA90 UA85 OB40 ADD30",
  "L-Sit":                          "LA100 UA90 OB50 RF85 LAT40 TLO45 AD30 LT40",
  "Hollow Body Hold":               "LA100 UA90 OB50 RF55 LAT20",
  "Hollow Body Rock":               "LA100 UA90 OB55 RF55 LAT20",
  "Dragon Flag":                    "UA100 LA100 OB70 LAT50 RF40 LB20",
  "Ab Wheel Rollout":               "UA100 LA95 OB60 LAT50 TLO40",
  "Ab Wheel (Kneeling)":            "UA100 LA90 OB55 LAT45 TLO35",
  "Stir the Pot":                   "UA100 LA90 OB85 AD40 LAT25",
  "Plank":                          "UA100 LA90 OB65 AD30 RF25 LB20 VL20",
  "Weighted Plank":                 "UA100 LA90 OB65 AD35 RF25 LB20 VL20",
  "Long-Lever Plank":               "UA100 LA100 OB75 AD40 LAT25",
  "Plank Reach":                    "UA100 LA95 OB85 AD45",
  "Dead Bug":                       "LA100 UA85 OB50 RF35",
  "Bird Dog":                       "GM100 LB90 OB55 UA50 LA45 ST30 PD30 LT30",   // Ekstrom 2007 / Youdas 2008
  "Side Plank":                     "OB100 UA40 LA35 GMD60 LB35 LD25",           // side bridge: glute med ~74 % MVIC (Ekstrom 2007)
  "Side Plank with Rotation":       "OB100 UA55 LA45 GMD55 AD30",
  "Copenhagen Plank":               "ADD100 OB85 UA45 LA40 GMD45",
  "Russian Twists":                 "OB100 UA60 LA50 RF25",
  "Weighted Russian Twists":        "OB100 UA65 LA50 RF25",
  "Woodchop":                       "OB100 UA60 LA45 AD35 GMD30 LB25",
  "Cable Woodchop (High)":          "OB100 UA60 LA45 AD35 GMD30 LB25",
  "Cable Woodchop (Low)":           "OB100 UA55 LA50 AD45 GM35 VL25",
  "Landmine Rotation":              "OB100 UA60 LA40 AD45",
  "Pallof Press":                   "OB100 UA60 LA55 AD30 GMD30 LB25",
  "Burpees":                        "VL100 RF85 VM85 GM85 GAS60 SOL45 BF45 ST40 MP60 UP40 AD55 TLA50 TM45 TLO35 UA45 LA40 OB35 LB35 LD25",

  // ── LEGS: squats ────────────────────────────────────────────────────────
  // Squats: vasti lead, rectus femoris well below (Ema 2016), glute max
  // 70–80 % of the quads at parallel and rising with depth, adductor magnus a
  // real extensor (Vigotsky 2019), hamstrings low (~30), erectors hold the
  // bar (60 back squat, higher front/Zercher/overhead).
  "Barbell Back Squat":             "VL100 VM95 RF75 GM80 ADD65 ST30 BF25 LB60 GMD40 GAS25 SOL30 UA20 OB25",
  "Squat":                          "VL100 VM95 RF75 GM80 ADD65 ST30 BF25 LB60 GMD40 GAS25 SOL30 UA20 OB25",
  "Smith Machine Squat":            "VL100 VM95 RF75 GM70 ADD55 ST25 BF20 LB40",
  "Front Squat":                    "VL100 VM100 RF85 GM70 ADD55 ST20 BF20 LB65 UA35 UT35 AD20",
  "Zercher Squat":                  "VL100 VM95 RF75 GM80 ADD60 ST25 BF20 LB75 UA50 OB40 BS40 BL35 UT30",
  "Overhead Squat":                 "VL100 VM95 RF70 GM80 ADD55 ST25 BF20 LB80 AD65 LD55 UT60 LT35 TM30 UA50 OB45",
  "Goblet Squat":                   "VL100 VM95 RF75 GM75 ADD55 ST20 LB45 UA30 AD25 BS25",
  "Dumbbell Squat":                 "VL100 VM95 RF75 GM75 ADD55 ST20 LB45 WF30",
  "Landmine Squat":                 "VL100 VM95 RF75 GM75 ADD50 ST20 LB35 AD30 UA30",
  "Bodyweight Squat":               "VL100 VM95 RF70 GM65 ADD45 ST20 BF20 LB35 GMD35 GAS25 SOL25",
  "Resistance Band Squat":          "VL100 VM95 RF70 GM75 GMD60 ADD40 ST20 LB35",
  "Jump Squats":                    "VL100 RF90 VM90 GM90 GAS80 SOL60 BF45 ST40 LB40 ADD40 TIB30",
  "Pistol Squat":                   "VL100 VM95 RF85 GM85 GMD70 ADD40 ST30 BF25 GAS40 SOL45 TIB40 LB35 UA30 OB30",
  "Sissy Squat":                    "RF100 VL90 VM90 TIB30 GAS25 UA25",
  "Spanish Squat":                  "RF100 VL95 VM95 GM35",
  "Wall Sit":                       "VL100 VM100 RF90 GM40 ADD35 TIB20 GAS15",
  "Sumo Squat":                     "ADD100 VM100 VL80 RF65 GM85 GMD65 ST30 LB40",
  "Cossack Squat":                  "ADD100 VM95 VL85 RF70 GMD75 GM70 ST35 BF30",
  "Lateral Lunge":                  "ADD100 VM90 VL85 RF70 GMD70 GM75 ST35 BF30",
  "Curtsy Lunge":                   "GMD100 GM90 VL85 VM75 RF65 ADD70 ST35 BF35",
  // Machines
  "Leg Press":                      "VL100 VM95 RF70 GM65 ADD50 ST25 BF20 GAS20",
  "Horizontal Leg Press":           "VL100 VM95 RF70 GM60 ADD45 ST25 BF20",
  "Single Leg Press":               "VL100 VM95 RF70 GM75 GMD60 ADD50 ST25 BF20",
  "Leg Press (High Foot)":          "GM100 ST70 BF65 VL80 VM75 RF50 ADD50",
  "Leg Press (Low Foot)":           "VL100 VM100 RF85 GM45 ADD40 GAS20",
  "Hack Squat":                     "VL100 VM95 RF90 GM55 ADD45 LB20",
  "Pendulum Squat":                 "VL100 VM95 RF85 GM65 ADD45",
  "V-Squat Machine":                "VL100 VM95 RF85 GM60 ADD45",
  "Leg Extension":                  "RF100 VL95 VM95 TIB15",                // the one lift that fully loads rectus femoris (Ema 2016)
  // Hamstrings (Bourne 2017): knee-flexion curls hit both heads with the
  // gastrocnemius assisting; seated position lengthens the hamstrings and
  // grows them more (Maeo 2021) though EMG is similar; Nordics load the long
  // head of biceps femoris heavily.
  "Seated Leg Curl":                "ST100 BF95 GAS35 GM10",
  "Lying Leg Curl":                 "ST100 BF95 GAS45 GM15",
  "Leg Curl":                       "ST100 BF95 GAS45 GM15",
  "Standing Leg Curl":              "ST100 BF95 GAS40 GM30 GMD25",
  "Nordic Curl":                    "BF100 ST100 GAS45 GM30 LB30 UA25",
  "Glute Ham Raise":                "ST100 BF100 GM55 GAS50 LB45",
  // Lunges, split squats, step-ups: glute max + quads, glute med for the
  // single-leg stance, hamstrings 40–50 in the rear-leg stretch (Andersen
  // 2014); step-up is the highest glute-max exercise in Simenz 2012.
  "Walking Lunges":                 "VL100 RF85 VM85 GM90 GMD60 BF45 ST40 ADD45 GAS30 SOL30 LB30 OB20",
  "Reverse Lunges":                 "GM100 VL90 VM85 RF70 GMD60 BF50 ST45 ADD45 LB25",
  "Barbell Lunge":                  "VL100 RF85 VM85 GM90 GMD60 BF45 ST40 ADD45 LB45 UT25",
  "Smith Machine Lunge":            "VL100 VM90 RF75 GM85 GMD50 BF40 ST35 ADD40",
  "Bulgarian Split Squat":          "GM100 VL95 VM90 RF75 GMD65 BF50 ST45 ADD55 LB30 GAS25",
  "Step-ups":                       "GM95 VL100 RF80 VM85 GMD65 BF40 ST35 GAS35 SOL30 ADD35",
  "Barbell Step-ups":               "GM95 VL100 RF80 VM85 GMD65 BF40 ST35 GAS35 SOL30 ADD35 LB35 UT25",
  "Box Jumps":                      "VL100 RF90 VM90 GM90 GAS85 SOL60 BF50 ST45 TIB40 LB30 UA25",
  "Broad Jumps":                    "GM100 VL95 RF85 VM85 GAS80 SOL55 BF60 ST55 LB40 UA30 AD25",
  // Adductor / abductor machines: one muscle group each. Abduction does not
  // work the adductors; the old data said it did.
  "Adductor Machine":               "ADD100 VM25 GM10",
  "Abductor Machine":               "GMD100 GM45",
  "Standing Cable Abduction":       "GMD100 GM45 OB30",
  "Lateral Band Walk":              "GMD100 GM55 VL35 ADD20 TIB15",           // Cambridge 2012
  "Clamshell":                      "GMD100 GM50",                            // Distefano 2009: glute med 38 %, glute max 34 % MVIC
  "Fire Hydrants":                  "GMD100 GM70 OB20",
  "Donkey Kicks":                   "GM100 ST45 BF40 LB30 GMD30",
  // Hip thrusts and bridges (Contreras 2015): glute max 70–90 % MVIC, hams
  // ~40, vastus lateralis ~40, adductor magnus assists, glute med stabilises.
  "Hip Thrust":                     "GM100 GMD55 ST40 BF40 VL35 VM30 RF20 ADD45 LB30",
  "Barbell Hip Thrust":             "GM100 GMD55 ST40 BF40 VL35 VM30 RF20 ADD45 LB30",
  "Smith Machine Hip Thrust":       "GM100 GMD55 ST40 BF40 VL35 VM30 RF20 ADD45 LB30",
  "Banded Hip Thrust":              "GM100 GMD75 ST40 BF40 VL30 ADD35 LB25",
  "Single-Leg Hip Thrust":          "GM100 GMD70 ST45 BF40 LB25 ADD25",
  "Glute Bridge":                   "GM100 GMD50 ST45 BF45 LB20 ADD30",
  "Single-Leg Glute Bridge":        "GM100 GMD75 ST55 BF50 LB25",
  "Frog Pump":                      "GM100 ADD40 GMD45 ST20",
  "Cable Kickbacks":                "GM100 ST45 BF40 GMD35 LB25",
  "Glute Kickback Machine":         "GM100 ST50 BF45 GMD35 LB20",
  "Cable Pull-Through":             "GM100 ST85 BF80 LB55 ADD30",

  // ── CALVES (Signorile 2002: knee bent → soleus; knee straight → gastroc) ─
  "Standing Calf Raises":           "GAS100 SOL70",
  "Calf Raises":                    "GAS100 SOL70",
  "Standing Calf Raise Machine":    "GAS100 SOL70",
  "Calf Raise Machine":             "GAS100 SOL70",
  "Smith Machine Calf Raise":       "GAS100 SOL70",
  "Donkey Calf Raises":             "GAS100 SOL65",
  "Single-Leg Calf Raise":          "GAS100 SOL70 TIB25 GMD25",
  "Leg Press Calf Raise":           "GAS100 SOL75",
  "Calf Press on Leg Press":        "GAS100 SOL75",
  "Seated Calf Raises":             "SOL100 GAS35",
  "Seated Calf Raise Machine":      "SOL100 GAS35",
  "Tibialis Raise":                 "TIB100",
  "Plyometric Calf Jumps":          "GAS100 SOL75 TIB40 VL35 RF30",

  // ── CALISTHENICS SKILLS ─────────────────────────────────────────────────
  "Front Lever":                    "LAT100 LA90 UA85 OB50 LT60 PD55 TLO40 BL35 MP35 WF50 LB20",
  "Back Lever":                     "MP100 UP60 AD80 TLO55 LAT60 LT40 LB60 GM50 UA45 LA40 WF45",
  "Planche":                        "AD100 UP80 MP85 TM70 TLA60 TLO55 LT50 UA60 LA55 OB45 WF60 LB35 GM30",
  "Human Flag":                     "OB100 LAT90 UA70 LA70 LD60 AD55 PD45 BS45 TLA50 TM45 TLO40 WF60 GMD55 GM35 LB40",
};

function parse(str, name) {
  const out = {};
  const re = /([A-Z]+)(\d+)/g;
  let m, any = false;
  while ((m = re.exec(str))) {
    const id = CODES[m[1]];
    if (!id) throw new Error(`emg.js: unknown muscle code "${m[1]}" in "${name}"`);
    out[id] = Number(m[2]);
    any = true;
  }
  if (!any) throw new Error(`emg.js: empty profile for "${name}"`);
  return out;
}

export const EXERCISE_EMG = Object.fromEntries(Object.entries(RAW).map(([name, str]) => [name, parse(str, name)]));
