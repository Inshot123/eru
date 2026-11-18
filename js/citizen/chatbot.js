'use strict';
/* =====================================================================
   CITIZEN PAGE - CHATBOT  (keyword based, answers ONLY emergency / system topics)
   - To add an answer: add an entry to KB below  { k: [keywords], a: 'reply' }
   - urgent:true  = life-threatening topic. These are checked FIRST and the
                    reply starts with the "Call 911 now" banner.
   - Keywords of 3 letters or less must match a whole word; longer ones match
     the start of a word (so "shoot" also matches "shooting").
   ===================================================================== */
const URGENT_BANNER =
  '🚨 LIFE-THREATENING EMERGENCY\n' +
  'CALL 911 NOW. If you can, press "Quick Send" on this page so responders are sent to your exact location.\n\n';
const URGENT_FOOTER =
  '\n\nStay on the line with the 911 operator and follow their instructions. This is basic first aid, not a replacement for medical professionals.';

const KB = [
  /* ---------------- LIFE-THREATENING (checked first) ---------------- */
  { urgent: true,
    k: ['shoot', 'shot', 'gunshot', 'gun', 'bullet', 'firearm', 'sniper'],
    a: '🔫 SHOOTING / GUNSHOT\n' +
       '1) Your safety first: if shots may continue, get away or take cover, lock or block doors, silence your phone. Never approach the shooter.\n' +
       '2) Tell 911 the exact location, how many people are hurt, and a description of the suspect.\n' +
       '3) If someone is shot and the area is safe: press FIRMLY on the wound with a clean cloth or clothing using both hands. Keep pressing - do not lift to check.\n' +
       '4) Arm or leg wound that keeps bleeding heavily: put a tight band/belt (tourniquet) 5-7 cm above the wound, not on a joint, tighten until bleeding stops, and note the time.\n' +
       '5) Do not remove anything stuck in the wound. Keep the person lying down, warm and talking. If they are not breathing, start CPR.\n' +
       '6) Stay with them until responders arrive.' },
  { urgent: true,
    k: ['stab', 'knife', 'blade', 'slash', 'impale'],
    a: '🔪 STABBING / DEEP CUT\n' +
       '1) Make sure the attacker is gone and you are safe.\n' +
       '2) Do NOT pull out the knife or object. Press firmly around it with a clean cloth.\n' +
       '3) Keep the person lying down and still, keep them warm, and keep talking to them.\n' +
       '4) Heavy bleeding from an arm or leg: use a tourniquet 5-7 cm above the wound (not on a joint).\n' +
       '5) If they stop breathing, start CPR.' },
  { urgent: true,
    k: ['bleed', 'blood', 'hemorrh', 'wound', 'gash'],
    a: '🩸 SEVERE BLEEDING\n' +
       '1) Press hard directly on the wound with a clean cloth, shirt or gauze. Keep pressure on without stopping.\n' +
       '2) If blood soaks through, add more cloth on top - do not remove the first layer.\n' +
       '3) Raise the injured arm or leg above the heart if there is no broken bone.\n' +
       '4) If bleeding from a limb will not stop, apply a tourniquet 5-7 cm above the wound (not on a joint) and note the time.\n' +
       '5) Lay the person down, keep them warm, and do not give food or drink.\n' +
       '6) Watch for fainting, pale/cold skin or fast breathing - these mean shock.' },
  { urgent: true,
    k: ['not breathing', 'no pulse', 'unresponsive', 'unconscious', 'passed out', 'pass out', 'collapse', 'cpr', 'cardiac', 'dying', 'dead'],
    a: '🫀 NOT RESPONDING / NOT BREATHING (CPR)\n' +
       '1) Tap their shoulders and shout. If no response and no normal breathing, call 911 (or have someone call) and get an AED if there is one.\n' +
       '2) Lay them on their back on a firm surface.\n' +
       '3) Place the heel of your hand on the center of the chest, other hand on top. Push HARD and FAST - about 5-6 cm deep, 100-120 pushes per minute. Let the chest rise fully each time.\n' +
       '4) If trained: give 2 rescue breaths after every 30 pushes. If not trained: keep pushing without breaths.\n' +
       '5) Do not stop until the person breathes, an AED takes over, or responders arrive.\n' +
       '6) Use the AED as soon as it arrives and follow its voice instructions.' },
  { urgent: true,
    k: ['chok', 'cannot breathe', "can't breathe", 'cant breathe', 'swallowed', 'gasping'],
    a: '😮‍💨 CHOKING / CANNOT BREATHE\n' +
       'Adult or child who is awake and cannot cough, speak or breathe:\n' +
       '1) Lean them forward and give 5 hard back blows between the shoulder blades.\n' +
       '2) Then give 5 abdominal thrusts (stand behind, fist above the belly button, pull sharply inward and upward).\n' +
       '3) Repeat 5 blows + 5 thrusts until the object comes out or they pass out.\n' +
       'Baby: 5 back blows then 5 chest thrusts with two fingers - no belly thrusts.\n' +
       'If they become unresponsive: start CPR and keep checking the mouth for the object.' },
  { urgent: true,
    k: ['heart attack', 'chest pain', 'chest tight', 'chest pressure', 'heart'],
    a: '❤️ HEART ATTACK\n' +
       'Signs: chest pain or pressure, pain in arm/jaw/back, sweating, shortness of breath, nausea.\n' +
       '1) Sit the person down, keep them calm and still. Loosen tight clothes.\n' +
       '2) If they are awake and not allergic, let them chew one regular aspirin.\n' +
       '3) Get an AED if available. Do not let them walk or drive.\n' +
       '4) If they collapse and are not breathing, start CPR.' },
  { urgent: true,
    k: ['stroke', 'face droop', 'slurred', 'paralyz', 'numb'],
    a: '🧠 STROKE (use FAST)\n' +
       'F - Face drooping  A - Arm weak  S - Speech slurred  T - Time to call 911.\n' +
       '1) Note the exact time symptoms started and tell 911.\n' +
       '2) Keep them sitting or lying with head slightly raised.\n' +
       '3) Give NO food, drink or medicine. Do not let them walk around.' },
  { urgent: true,
    k: ['seiz', 'convuls', 'epilep', 'fits'],
    a: '⚡ SEIZURE\n' +
       '1) Stay calm, note the time, and move hard objects away.\n' +
       '2) Cushion the head. Do NOT hold them down and do NOT put anything in the mouth.\n' +
       '3) When shaking stops, turn them onto their side and check breathing.\n' +
       '4) Call 911 if it lasts over 5 minutes, repeats, they are injured, pregnant, or do not wake up.' },
  { urgent: true,
    k: ['burns', 'burned', 'burnt', 'scald', 'electric', 'electrocut'],
    a: '🔥 BURNS / ELECTRIC SHOCK\n' +
       'Burn: cool with clean running water for 20 minutes, remove rings/watches before swelling, cover loosely with a clean non-stick cloth. No ice, butter, toothpaste or popping blisters. Burns on the face, hands, genitals or large areas need 911.\n' +
       'Electric shock: do NOT touch the person until the power is switched off (or use a dry wooden stick to separate). Then check breathing and start CPR if needed.' },
  { urgent: true,
    k: ['drown', 'underwater', 'swept away'],
    a: '🌊 DROWNING\n' +
       '1) Reach or throw something that floats - do not swim out unless you are trained.\n' +
       '2) Once out of the water, check breathing. If not breathing, start CPR (rescue breaths are important for drowning).\n' +
       '3) Keep them warm and on their side if they are breathing but unconscious.' },
  { urgent: true,
    k: ['poison', 'overdos', 'swallowed pills', 'toxic', 'chemical', 'drank'],
    a: '☠️ POISONING / OVERDOSE\n' +
       '1) Move the person away from fumes or the substance.\n' +
       '2) Do NOT make them vomit. Keep the container or pills to show responders.\n' +
       '3) If unconscious but breathing, lay them on their side. If not breathing, start CPR.' },
  { urgent: true,
    k: ['allerg', 'anaphyl', 'swelling throat', 'swollen'],
    a: '🐝 SEVERE ALLERGIC REACTION\n' +
       '1) If they have an epinephrine auto-injector, use it on the outer thigh right away.\n' +
       '2) Lay them down with legs raised (sit up if struggling to breathe).\n' +
       '3) Be ready to start CPR. A second injection may be needed after 5-15 minutes.' },
  { urgent: true,
    k: ['snake', 'bite', 'bitten', 'venom'],
    a: '🐍 SNAKE / ANIMAL BITE\n' +
       '1) Move away from the animal and keep the person calm and still.\n' +
       '2) Keep the bitten limb at or below heart level. Remove rings and tight items.\n' +
       '3) Do NOT cut, suck, ice or tie the wound tightly. Note what the animal looked like.\n' +
       '4) Dog or animal bites: wash with soap and water and get medical care for rabies shots.' },
  { urgent: true,
    k: ['fracture', 'broken bone', 'broke', 'fell', 'fall from', 'head injury', 'neck injury', 'spine', 'back injury'],
    a: '🦴 FALL / BROKEN BONE / HEAD OR NECK INJURY\n' +
       '1) Do not move the person, especially if the head, neck or back may be hurt.\n' +
       '2) Support the injured part as it is. Control any bleeding with firm pressure.\n' +
       '3) Watch for vomiting, confusion, drowsiness or unequal pupils - tell 911 immediately.\n' +
       '4) Keep them warm and calm until responders arrive.' },
  { urgent: true,
    k: ['hurt', 'injur', 'victim', 'wounded', 'in pain', 'emergency', 'medical', 'ambulance', 'sick'],
    a: '🚑 SOMEONE IS HURT\n' +
       '1) Make sure the area is safe for you first (traffic, fire, attacker, falling objects).\n' +
       '2) Check if they respond and are breathing. Not breathing = start CPR.\n' +
       '3) Stop any heavy bleeding with firm pressure.\n' +
       '4) Do not move them unless they are in danger. Keep them warm and talk to them.\n' +
       '5) Tell 911 what happened, how many people are hurt, and the exact location.' },

  /* ---------------- GENERAL (non life-threatening) ---------------- */
  { k: ['fire', 'smoke', 'burn', 'flame'],
    a: 'FIRE: 1) Get everyone out and stay low under smoke. 2) Do not use elevators. 3) Never go back inside. 4) Submit a Fire report here or call 911. Stop, drop and roll if clothing ignites.' },
  { k: ['robbery', 'crime', 'theft', 'steal', 'holdup', 'assault', 'suspect', 'violence'],
    a: 'CRIME: Move to a safe place, do not confront the suspect, and note descriptions (clothes, vehicle, direction). Submit a Crime report here so Police units can be assigned.' },
  { k: ['accident', 'crash', 'collision', 'vehicle', 'motor', 'traffic'],
    a: 'TRAFFIC ACCIDENT: Turn on hazard lights, keep a safe distance, do not move seriously injured people, and report with the exact location so Police and Ambulance units are assigned.' },
  { k: ['flood', 'earthquake', 'typhoon', 'landslide', 'disaster', 'storm', 'tsunami'],
    a: 'DISASTER: Move to higher or open ground, avoid floodwater and damaged structures, bring emergency kit, and report so DRRMO Rescue can be assigned. Earthquake: Drop, Cover, Hold On.' },
  { k: ['report', 'submit', 'form', 'request', 'how', 'use', 'system', 'send'],
    a: 'To report: fill in your name, an 11-digit mobile number, pick the incident type, and set your location (use "Use my live location", tap the map, or press Quick Send). Admin then assigns the right station and unit.' },
  { k: ['location', 'gps', 'pin', 'map', 'where'],
    a: 'Press "Use my live location" and allow browser location access (needs HTTPS or localhost). You can also tap the map to pin the exact spot. Quick Send grabs your live GPS and submits immediately.' },
  { k: ['unit', 'station', 'responder', 'assign', 'mandaue', 'liloan', 'consolacion', 'available', 'dispatch'],
    a: 'This system covers Mandaue City, Liloan and Consolacion. Reports are filtered by incident type (e.g. Fire -> Fire + Ambulance) and only the admin assigns the station and unit.' },
  { k: ['hello', 'hi', 'hey', 'help'],
    a: 'Hello! I can help with emergency steps (fire, shooting, bleeding, CPR, choking, crime, accidents, disasters) and with using this reporting system. What do you need?' },
  { k: ['911', 'hotline', 'call', 'number'],
    a: 'For life-threatening emergencies in the Philippines you can also dial 911.' },
];

const matchesWord = (text, word) =>
  new RegExp(word.length <= 3 ? '\\b' + word + '\\b' : '\\b' + word).test(text);

function botReply(question) {
  const q = question.toLowerCase();
  const hit = KB.find((entry) => entry.k.some((word) => matchesWord(q, word)));
  if (!hit) {
    return 'Sorry, I can only answer questions about emergency response, safety steps and how to use this system. Try asking about shooting, bleeding, CPR, choking, fire, crime, accidents, disasters or how to report.';
  }
  return hit.urgent ? URGENT_BANNER + hit.a + URGENT_FOOTER : hit.a;
}

/* ---------- Chat window ---------- */
function initChat() {
  const log = document.querySelector('#log'), form = document.querySelector('#chatForm'), input = document.querySelector('#chatIn');
  const add = (text, who) => {
    const bubble = document.createElement('div');
    bubble.className = 'b ' + who;
    bubble.textContent = text;                    // textContent = safe against HTML injection
    log.append(bubble);
    log.scrollTop = log.scrollHeight;
  };
  add('Hi! I am the ERU Assistant. Ask me what to do in an emergency or how to use this system.', 'bot');
  form.onsubmit = (e) => {
    e.preventDefault();
    const q = input.value.trim().slice(0, 300);
    if (!q) return;
    add(q, 'me');
    input.value = '';
    setTimeout(() => add(botReply(q), 'bot'), 350);
  };
}
