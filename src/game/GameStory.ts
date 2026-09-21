import { CustomerData, StoreRule, ShiftNumber, ActiveTask } from '../types';

export const STORE_RULES: Record<ShiftNumber, StoreRule[]> = {
  1: [
    {
      id: 'rule_s1_1',
      shift: 1,
      ruleText: 'Lock the front doors at 2:00 AM sharp.',
      hint: 'Use the deadbolt on the front sliding entrance doors when the store clock strikes 02:00 AM.',
    },
    {
      id: 'rule_s1_2',
      shift: 1,
      ruleText: 'Keep shelves stocked and aisles clean before morning delivery.',
      hint: 'Grab supplies from the backroom storage crates.',
    },
  ],
  2: [
    {
      id: 'rule_s2_1',
      shift: 2,
      ruleText: 'DO NOT serve any customer wearing RED.',
      hint: 'Refuse service or ring the counter bell if a customer arrives wearing a red coat or shirt.',
    },
    {
      id: 'rule_s2_2',
      shift: 2,
      ruleText: 'Check security cameras if you hear knocking from the parking lot.',
      hint: 'Use the CCTV security terminal in the office.',
    },
  ],
  3: [
    {
      id: 'rule_s3_1',
      shift: 3,
      ruleText: 'There are NO employees named David.',
      hint: 'If anyone wearing a David nametag speaks to you, DO NOT speak back.',
    },
    {
      id: 'rule_s3_2',
      shift: 3,
      ruleText: 'If the electrical breaker trips, reset it immediately in the backroom.',
      hint: 'Keep your flashlight ready at all times.',
    },
    {
      id: 'rule_s3_3',
      shift: 3,
      ruleText: 'Do not walk behind the man standing at the end of Aisle 6.',
      hint: 'He is facing the wall for a reason.',
    },
  ],
  4: [
    {
      id: 'rule_s4_1',
      shift: 4,
      ruleText: 'If anyone asks whether you are alone tonight, NEVER answer "Yes".',
      hint: 'Always claim a manager or co-worker is present.',
    },
    {
      id: 'rule_s4_2',
      shift: 4,
      ruleText: 'Never allow "The Customer" to see you twice.',
      hint: 'If a familiar face returns with incorrect proportions, avoid direct eye contact.',
    },
    {
      id: 'rule_s4_3',
      shift: 4,
      ruleText: 'Do not trust the employee handbook.',
      hint: 'Some notices on the bulletin board were not printed by human staff.',
    },
  ],
  5: [
    {
      id: 'rule_s5_1',
      shift: 5,
      ruleText: 'The store closed in November 1998. You must remember this to leave.',
      hint: 'Do not accept any transaction paid in currency dated after 1998.',
    },
    {
      id: 'rule_s5_2',
      shift: 5,
      ruleText: 'Follow all previous shift rules simultaneously.',
      hint: 'Survive until 6:00 AM dawn.',
    },
  ],
  6: [
    {
      id: 'rule_s6_1',
      shift: 6,
      ruleText: 'OVERTIME MODE: Protocol is offline. Trust your instincts.',
      hint: 'Survive as many customer waves and anomalies as you can.',
    },
  ],
};

export const SHIFT_CUSTOMERS: Record<ShiftNumber, CustomerData[]> = {
  1: [
    {
      id: 's1_c1_driver',
      name: 'Exhausted Trucker',
      appearance: {
        skinTone: '#e0b896',
        shirtColor: '#2b4c7e',
        pantsColor: '#1c1c1c',
        hairColor: '#4a3728',
        hasHat: true,
      },
      products: [
        { id: 'p1', name: 'Mega Energy Drink', price: 2.99, barcode: '8841920', color: '#00cc66' },
        { id: 'p2', name: 'Salted Pretzels', price: 1.89, barcode: '4491023', color: '#bb7733' },
      ],
      paymentAmount: 5.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Trucker',
          text: "Just these two, partner. Got another four hundred miles of dark highway ahead of me.",
          choices: [
            { text: "That'll be $4.88, sir.", nextDialogueId: 'pay' },
            { text: "Long night out there. Stay awake.", nextDialogueId: 'friendly' },
          ],
        },
        friendly: {
          id: 'friendly',
          speaker: 'Trucker',
          text: "Yeah... road gets weird between two and four in the morning. Swear the trees start leaning in. Take care, kid.",
          choices: [{ text: "Here's your receipt.", nextDialogueId: 'pay' }],
        },
        pay: {
          id: 'pay',
          speaker: 'Trucker',
          text: "Keep the twelve cents change. Have a safe shift.",
        },
      },
    },
    {
      id: 's1_c2_beans',
      name: 'The Bean Collector',
      appearance: {
        skinTone: '#f0ceab',
        shirtColor: '#5c6f34',
        pantsColor: '#3a3a3a',
        hairColor: '#8c827a',
      },
      products: [
        { id: 'p3', name: 'Canned Baked Beans (x47)', price: 47.0, barcode: '1109923', color: '#994411' },
      ],
      paymentAmount: 50.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Customer',
          text: "I need all of them. Every single can on Aisle 2.",
          choices: [
            { text: "Are you having a barbecue?", nextDialogueId: 'bbq' },
            { text: "That's... forty-seven cans of beans.", nextDialogueId: 'explain' },
          ],
        },
        bbq: {
          id: 'bbq',
          speaker: 'Customer',
          text: "Barbecue? No. Winter is coming. Not season winter. The other one.",
          choices: [{ text: "Right... your total is $47.00.", nextDialogueId: 'pay' }],
        },
        explain: {
          id: 'explain',
          speaker: 'Customer',
          text: "Legumes do not spoil when the sun stops rising. You should stock up too, clerk.",
          choices: [{ text: "Cash or card?", nextDialogueId: 'pay' }],
        },
        pay: {
          id: 'pay',
          speaker: 'Customer',
          text: "Keep the three dollars. You'll need it when the currency changes to bone meal.",
        },
      },
    },
    {
      id: 's1_c3_battery',
      name: 'The Battery Guy',
      appearance: {
        skinTone: '#d9a87d',
        shirtColor: '#222222',
        pantsColor: '#555555',
        hairColor: '#1a1a1a',
        hasGlasses: true,
      },
      products: [
        { id: 'p4', name: '9-Volt Heavy Duty Batteries', price: 6.49, barcode: '9920192', color: '#ddaa11' },
      ],
      paymentAmount: 10.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Customer',
          text: "Excuse me. Do you sell batteries?",
          choices: [
            { text: "Yes, they're right here.", nextDialogueId: 'ask_work' },
          ],
        },
        ask_work: {
          id: 'ask_work',
          speaker: 'Customer',
          text: "...Do they work?",
          choices: [
            { text: "...Yes, brand new.", nextDialogueId: 'unfortunate' },
          ],
        },
        unfortunate: {
          id: 'unfortunate',
          speaker: 'Customer',
          text: "That's unfortunate.",
          choices: [
            { text: "Wait, why?", nextDialogueId: 'leave' },
            { text: "That'll be $6.49.", nextDialogueId: 'pay' },
          ],
        },
        leave: {
          id: 'leave',
          speaker: 'Customer',
          text: "Electricity gives things courage. It's better when the dark stays dark.",
        },
        pay: {
          id: 'pay',
          speaker: 'Customer',
          text: "Here is your paper. Don't turn on any radio tonight.",
        },
      },
    },
  ],

  2: [
    {
      id: 's2_c1_normal',
      name: 'College Student',
      appearance: {
        skinTone: '#f4c29c',
        shirtColor: '#3b82f6', // Blue shirt - SAFE!
        pantsColor: '#1e293b',
        hairColor: '#451a03',
      },
      products: [
        { id: 'p5', name: 'Cool Ranch Corn Chips', price: 2.19, barcode: '3391024', color: '#2563eb' },
        { id: 'p6', name: 'Sparkling Mineral Water', price: 1.79, barcode: '8829104', color: '#06b6d4' },
      ],
      paymentAmount: 5.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Student',
          text: "Cramming for finals. Is it just me or does your parking lot look... bigger tonight?",
          choices: [
            { text: "Just fog, man. That'll be $3.98.", nextDialogueId: 'pay' },
          ],
        },
        pay: {
          id: 'pay',
          speaker: 'Student',
          text: "Thanks. Good luck with the night shift, wouldn't catch me here alone.",
        },
      },
    },
    {
      id: 's2_c2_red',
      name: 'Man in Red Trenchcoat',
      appearance: {
        skinTone: '#d4a373',
        shirtColor: '#dc2626', // CRIMSON RED SHIRT! Violates Shift 2 Rule!
        pantsColor: '#991b1b',
        hairColor: '#171717',
        hasHat: true,
      },
      isWearingRed: true,
      products: [
        { id: 'p7', name: 'Suspicious Raw Meat Package', price: 13.99, barcode: '6660001', color: '#7f1d1d', isAnomalous: true },
      ],
      paymentAmount: 20.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Red Coat Figure',
          text: "Good evening, clerk. Ring this up quickly. The blood is soaking through the butcher paper.",
          choices: [
            { text: "I cannot serve anyone wearing red tonight. Store policy.", nextDialogueId: 'refused_correct', isCorrectRule: true },
            { text: "Sure, that'll be $13.99.", nextDialogueId: 'served_wrong' },
          ],
        },
        refused_correct: {
          id: 'refused_correct',
          speaker: 'Red Coat Figure',
          text: "...Smart clerk. You actually read the bulletin board. Most of your predecessors didn't.",
        },
        served_wrong: {
          id: 'served_wrong',
          speaker: 'Red Coat Figure',
          text: "You broke the rule. Now your shift is mine.",
        },
      },
    },
    {
      id: 's2_c3_refund',
      name: 'The Refund',
      appearance: {
        skinTone: '#94a3b8',
        shirtColor: '#475569',
        pantsColor: '#0f172a',
        hairColor: '#000000',
        isSupernatural: true,
        distortionType: 'faceless',
      },
      products: [
        { id: 'p8', name: 'Jar of 1994 Memories (UNSTOCKED)', price: 0.0, barcode: '0000000', color: '#8b5cf6', isAnomalous: true, anomalyNote: 'Never stocked in this store!' },
      ],
      paymentAmount: 0.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'The Entity',
          text: "I want my refund. I purchased this here yesterday.",
          choices: [
            { text: "We do not sell memories, and this barcode does not exist.", nextDialogueId: 'deny_correct', isCorrectRule: true },
            { text: "I can offer store credit...?", nextDialogueId: 'offer_wrong' },
          ],
        },
        deny_correct: {
          id: 'deny_correct',
          speaker: 'The Entity',
          text: "Then take it as a gift. It remembers you even if you forgot.",
        },
        offer_wrong: {
          id: 'offer_wrong',
          speaker: 'The Entity',
          text: "Your store does not have enough credit to pay for what you lost.",
        },
      },
    },
  ],

  3: [
    {
      id: 's3_c1_david',
      name: 'Employee Named "David"',
      appearance: {
        skinTone: '#f8fafc',
        shirtColor: '#15803d', // Green employee vest
        pantsColor: '#1e293b',
        hairColor: '#334155',
      },
      isNamedDavid: true,
      products: [],
      paymentAmount: 0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'David (Employee)',
          text: "Hey partner! Manager sent me to relieve you early. Go take your break in the freezer.",
          choices: [
            { text: "[SAY NOTHING - REMAIN COMPLETELY SILENT]", nextDialogueId: 'silent_correct', isCorrectRule: true },
            { text: "Wait, the manager never mentioned a relief shift.", nextDialogueId: 'spoke_wrong' },
            { text: "Thanks David, I really need a break.", nextDialogueId: 'spoke_wrong' },
          ],
        },
        silent_correct: {
          id: 'silent_correct',
          speaker: 'David (Employee)',
          text: "...Not a single word, huh? Heh. You're no fun.",
        },
        spoke_wrong: {
          id: 'spoke_wrong',
          speaker: 'David (Employee)',
          text: "You spoke to me. Rule 1 broken: David has no friends here.",
        },
      },
    },
    {
      id: 's3_c2_regular',
      name: 'Nervous Nurse',
      appearance: {
        skinTone: '#fed7aa',
        shirtColor: '#0284c7',
        pantsColor: '#0369a1',
        hairColor: '#78350f',
      },
      products: [
        { id: 'p9', name: 'Black Coffee 16oz', price: 1.99, barcode: '1182749', color: '#451a03' },
        { id: 'p10', name: 'Aspirin Tablets', price: 4.5, barcode: '7729103', color: '#f8fafc' },
      ],
      paymentAmount: 10.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Nurse',
          text: "Night shift at the clinic was hell. Keep the change. Hey, why are the lights buzzing so loud?",
          choices: [
            { text: "Old wiring. Have a good rest.", nextDialogueId: 'pay' },
          ],
        },
        pay: {
          id: 'pay',
          speaker: 'Nurse',
          text: "Be careful. A patient came in raving about a shadow staring into store cameras.",
        },
      },
    },
  ],

  4: [
    {
      id: 's4_c1_inquisitor',
      name: 'The Inquisitor',
      appearance: {
        skinTone: '#e2e8f0',
        shirtColor: '#334155',
        pantsColor: '#0f172a',
        hairColor: '#0f172a',
        hasHat: true,
      },
      asksIfAlone: true,
      products: [
        { id: 'p11', name: 'Matches Box', price: 0.99, barcode: '5581920', color: '#ef4444' },
      ],
      paymentAmount: 1.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Stranger',
          text: "So quiet out here. Pitch black on highway 9. Tell me, clerk... are you alone in the store tonight?",
          choices: [
            { text: "No. My manager and security guard are in the backroom.", nextDialogueId: 'not_alone_correct', isCorrectRule: true },
            { text: "Yeah, just me holding down the fort.", nextDialogueId: 'alone_wrong' },
          ],
        },
        not_alone_correct: {
          id: 'not_alone_correct',
          speaker: 'Stranger',
          text: "...Pity. It is so much easier when you are alone.",
        },
        alone_wrong: {
          id: 'alone_wrong',
          speaker: 'Stranger',
          text: "Just you. Delicious.",
        },
      },
    },
    {
      id: 's4_c2_mimic',
      name: 'The Return Customer',
      appearance: {
        skinTone: '#cbd5e1',
        shirtColor: '#2b4c7e', // Same shirt as trucker from Shift 1, but distorted!
        pantsColor: '#1c1c1c',
        hairColor: '#4a3728',
        hasHat: true,
        isSupernatural: true,
        distortionType: 'elongated',
      },
      entityType: 'mimic',
      products: [
        { id: 'p12', name: 'Black Sludge Jar', price: 9.99, barcode: '9999999', color: '#09090b', isAnomalous: true },
      ],
      paymentAmount: 10.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'It',
          text: "You remember me, right? I drove four hundred miles. But the road never ended.",
          choices: [
            { text: "[AVOID EYE CONTACT - LOOK AT REGISTER]", nextDialogueId: 'avoid_correct', isCorrectRule: true },
            { text: "You're... not the trucker. What happened to your arms?!", nextDialogueId: 'look_wrong' },
          ],
        },
        avoid_correct: {
          id: 'avoid_correct',
          speaker: 'It',
          text: "Smart prey keeps its eyes cast down. See you at five AM.",
        },
        look_wrong: {
          id: 'look_wrong',
          speaker: 'It',
          text: "You looked twice! The mimic is satisfied!",
        },
      },
    },
  ],

  5: [
    {
      id: 's5_c1_manager',
      name: 'The Store Owner',
      appearance: {
        skinTone: '#94a3b8',
        shirtColor: '#1e293b',
        pantsColor: '#0f172a',
        hairColor: '#ffffff',
      },
      products: [],
      paymentAmount: 0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Owner',
          text: "Shift 5. You made it further than any applicant since 1998. Ready to clock out?",
          choices: [
            { text: "I remember: the store closed in November 1998. I'm leaving at 6:00 AM.", nextDialogueId: 'win_choice', isCorrectRule: true },
            { text: "Yes, please take the keys.", nextDialogueId: 'trapped_choice' },
          ],
        },
        win_choice: {
          id: 'win_choice',
          speaker: 'Owner',
          text: "The dawn is breaking. The doors are unlocked. You survived One More Shift.",
        },
        trapped_choice: {
          id: 'trapped_choice',
          speaker: 'Owner',
          text: "If you take the keys, you become the manager. Welcome to your permanent shift.",
        },
      },
    },
  ],

  6: [
    {
      id: 's6_c_endless',
      name: 'Late Night Drifter',
      appearance: {
        skinTone: '#e2e8f0',
        shirtColor: '#4b5563',
        pantsColor: '#1f2937',
        hairColor: '#374151',
      },
      products: [
        { id: 'pe1', name: 'Cursed Soda', price: 3.33, barcode: '3333333', color: '#8b5cf6' },
      ],
      paymentAmount: 5.0,
      initialDialogueId: 'start',
      dialogueTree: {
        start: {
          id: 'start',
          speaker: 'Drifter',
          text: "The night never ends here, does it? Just one more shift. Always one more shift.",
          choices: [
            { text: "That'll be $3.33, sir.", nextDialogueId: 'pay' },
          ],
        },
        pay: {
          id: 'pay',
          speaker: 'Drifter',
          text: "May the morning find you alive.",
        },
      },
    },
  ],
};

export const SHIFT_TASKS: Record<ShiftNumber, ActiveTask[]> = {
  1: [
    {
      id: 'task_s1_restock',
      title: 'Restock Aisle 1 & 2 Shelves',
      description: 'Grab the inventory crate in the backroom and stock the empty shelf in Aisle 1.',
      currentCount: 0,
      targetCount: 1,
      type: 'restock',
      completed: false,
      locationHint: 'Storage Room -> Aisle 1',
    },
    {
      id: 'task_s1_spill',
      title: 'Mop Mysterious Floor Spill',
      description: 'Find the mop in the backroom bucket and clean the dark puddle near Aisle 1.',
      currentCount: 0,
      targetCount: 1,
      type: 'mop',
      completed: false,
      locationHint: 'Aisle 1 Floor',
    },
    {
      id: 'task_s1_lock',
      title: 'Lock Front Doors at 2:00 AM',
      description: 'Turn the front door deadbolt when the clock reaches 02:00 AM.',
      currentCount: 0,
      targetCount: 1,
      type: 'lock_door',
      completed: false,
      locationHint: 'Front Entrance',
    },
  ],
  2: [
    {
      id: 'task_s2_customers',
      title: 'Follow the Red Rule',
      description: 'Check out arriving customers, but strictly REFUSE anyone wearing red.',
      currentCount: 0,
      targetCount: 2,
      type: 'register',
      completed: false,
      locationHint: 'Front Counter',
    },
    {
      id: 'task_s2_cctv',
      title: 'Audit CCTV Cameras for The Watcher',
      description: 'Check CAM 01 through CAM 06 on the security desk monitor.',
      currentCount: 0,
      targetCount: 1,
      type: 'check_cctv',
      completed: false,
      locationHint: 'Security Desk',
    },
  ],
  3: [
    {
      id: 'task_s3_breaker',
      title: 'Reset Electrical Breaker Panel',
      description: 'When power blows, navigate backroom with flashlight and flip the tripped breaker.',
      currentCount: 0,
      targetCount: 1,
      type: 'breaker',
      completed: false,
      locationHint: 'Backroom Breaker Box',
    },
    {
      id: 'task_s3_restock',
      title: 'Restock Beverage Coolers',
      description: 'Restock the right-hand drink cooler racks with supply crates.',
      currentCount: 0,
      targetCount: 1,
      type: 'restock',
      completed: false,
      locationHint: 'Cooler Wall',
    },
  ],
  4: [
    {
      id: 'task_s4_register',
      title: 'Survive Customer Inquiries',
      description: 'Handle customer interrogations without answering "Yes" to being alone.',
      currentCount: 0,
      targetCount: 2,
      type: 'register',
      completed: false,
      locationHint: 'Front Counter',
    },
    {
      id: 'task_s4_phone',
      title: 'Consult Corporate Red Hotline',
      description: 'Pick up the supervisor hotline in the backroom to receive instructions.',
      currentCount: 0,
      targetCount: 1,
      type: 'phone',
      completed: false,
      locationHint: 'Backroom Desk Phone',
    },
  ],
  5: [
    {
      id: 'task_s5_final',
      title: 'Survive Until 06:00 AM Dawn',
      description: 'Remember all rules, keep doors secured, and do not succumb to the anomalies.',
      currentCount: 0,
      targetCount: 1,
      type: 'register',
      completed: false,
      locationHint: 'Everywhere',
    },
  ],
  6: [
    {
      id: 'task_s6_endless',
      title: 'Survive the Endless Overtime Shift',
      description: 'Keep the store running as long as you can.',
      currentCount: 0,
      targetCount: 10,
      type: 'register',
      completed: false,
      locationHint: 'Front Counter',
    },
  ],
};
