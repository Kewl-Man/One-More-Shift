import { CustomerData, HorrorPhase, ShiftNumber } from '../types';
import { sound } from '../audio/SoundManager';
import { StoreWorld } from './StoreWorld';
import { CustomerManager } from './CustomerManager';
import { EntityManager } from './EntityManager';

export interface HorrorDirectorCallbacks {
  onPhoneRing: (callId: string, message: string, speaker?: string) => void;
  onEnvironmentalEvent: (type: string, message?: string) => void;
  onBlackout: () => void;
  onWindowKnock: () => void;
  onCctvGlitch: (camId: number) => void;
}

// 1. Vast Pool of Customers with different categories
const NORMAL_CUSTOMERS: CustomerData[] = [
  {
    id: 'norm_trucker',
    name: 'Dale (Interstate Hauler)',
    appearance: {
      skinTone: '#d4aa7d',
      shirtColor: '#2b3a4a',
      pantsColor: '#1f2429',
      hairColor: '#4a3b32',
      hasHat: true,
      hasGlasses: false,
    },
    greeting: "Long haul up Route 9. Got any hot black coffee left?",
    dialogueChoices: [
      {
        playerText: "Roads pretty quiet tonight?",
        customerReply: "Too quiet. Radio's been dead static since the county line.",
      },
      {
        playerText: "Just what's in the pots, Dale.",
        customerReply: "Good enough for me. Keep the change, kid.",
      },
    ],
    products: [
      { id: 'c_coffee', name: 'Fresh Drip Coffee', price: 2.25, barcode: '098124', color: '#331a00', shape: 'box' },
      { id: 'c_jerky', name: 'Peppered Beef Jerky', price: 6.50, barcode: '445211', color: '#551100', shape: 'pack' },
    ],
    acceptReaction: "Appreciate it. Stay awake in here.",
    refusalReaction: "Huh? What's your problem, clerk? Fine, I'll stop down the turnpike.",
  },
  {
    id: 'norm_nurse',
    name: 'Sarah (Night Shift RN)',
    appearance: {
      skinTone: '#f1c27d',
      shirtColor: '#207567', // Teal scrubs
      pantsColor: '#207567',
      hairColor: '#1a110a',
      hasHat: false,
      hasGlasses: true,
    },
    greeting: "Shift ended an hour late at St. Jude's. Just need caffeine to make the drive home.",
    dialogueChoices: [
      {
        playerText: "Rough night at the hospital?",
        customerReply: "You have no idea. ER was overflowed with people suffering night terrors.",
      },
      {
        playerText: "Drive safe out there in the rain.",
        customerReply: "Thanks. You take care of yourself too.",
      },
    ],
    products: [
      { id: 'c_energy', name: 'Volt Surge Energy (16oz)', price: 3.75, barcode: '109923', color: '#00cc88', shape: 'can' },
      { id: 'c_chips', name: 'Sea Salt Kettle Chips', price: 2.50, barcode: '772109', color: '#ddbb33', shape: 'pack' },
    ],
    acceptReaction: "Thanks so much. Have a quiet shift.",
    refusalReaction: "Are you serious? It's just an energy drink. Whatever.",
  },
  {
    id: 'norm_mechanic',
    name: 'Marcus (Highway Wrecker)',
    appearance: {
      skinTone: '#b87d4b',
      shirtColor: '#444c38',
      pantsColor: '#1c1e24',
      hairColor: '#222222',
      hasHat: true,
      hasGlasses: false,
    },
    greeting: "Towed a sedan out of the ravine three miles back. Nobody inside it.",
    dialogueChoices: [
      {
        playerText: "Nobody inside? Where'd the driver go?",
        customerReply: "Doors were locked from the inside. Footprints led straight into the tree line.",
      },
      {
        playerText: "Just typical Route 9 weirdness.",
        customerReply: "Don't let your guard down, kid.",
      },
    ],
    products: [
      { id: 'c_oil', name: 'Synthetic 10W-30 Motor Oil', price: 8.00, barcode: '332111', color: '#111111', shape: 'bottle' },
      { id: 'c_gum', name: 'Spearmint Chewing Gum', price: 1.50, barcode: '984412', color: '#22aa55', shape: 'pack' },
    ],
    acceptReaction: "Thanks, buddy. Lock the deadbolt behind me.",
    refusalReaction: "You're refusing me oil? My rig's burning smoke! Unbelievable.",
  },
  {
    id: 'norm_student',
    name: 'Leo (College Crammer)',
    appearance: {
      skinTone: '#e0ac69',
      shirtColor: '#6b3e26',
      pantsColor: '#3a4454',
      hairColor: '#5c4033',
      hasHat: false,
      hasGlasses: false,
    },
    greeting: "Midterms tomorrow morning. My brain is basically soup.",
    dialogueChoices: [
      {
        playerText: "Cramming this late?",
        customerReply: "Yeah, studying atmospheric anomalies in modern history. Pretty fitting for tonight.",
      },
    ],
    products: [
      { id: 'c_ramen', name: 'Spicy Chicken Instant Noodles', price: 1.75, barcode: '556100', color: '#cc4400', shape: 'box' },
      { id: 'c_soda', name: 'Black Cherry Cola', price: 2.25, barcode: '990145', color: '#880022', shape: 'bottle' },
    ],
    acceptReaction: "Life saver. Back to the library dungeon.",
    refusalReaction: "Man, I'm starving. Why won't you ring it up?",
  },
];

const ODD_CUSTOMERS: CustomerData[] = [
  {
    id: 'odd_bbq',
    name: 'The Charcoal Traveler',
    appearance: {
      skinTone: '#c29b7a',
      shirtColor: '#3d342c',
      pantsColor: '#1e1c1a',
      hairColor: '#111111',
      hasHat: true,
      hasGlasses: false,
    },
    greeting: "Evening. Smelled hickory outside. Or maybe something burning.",
    dialogueChoices: [
      {
        playerText: "Are you having a barbecue?",
        customerReply: "We don't have barbecues where I'm going.",
      },
      {
        playerText: "Just buying matches and lighter fluid?",
        customerReply: "The woods get cold when the headlights turn off.",
      },
    ],
    products: [
      { id: 'c_fluid', name: 'Charcoal Lighter Fluid', price: 5.50, barcode: '661029', color: '#eeaa00', shape: 'bottle' },
      { id: 'c_matches', name: 'Stormproof Match Strike Box', price: 3.00, barcode: '110294', color: '#cc2200', shape: 'box' },
    ],
    acceptReaction: "Keep your windows shut tonight, clerk.",
    refusalReaction: "...You're smarter than you look.",
  },
  {
    id: 'odd_beans',
    name: 'The Bunker Habitant',
    appearance: {
      skinTone: '#d9b38c',
      shirtColor: '#5a5446',
      pantsColor: '#2b2a26',
      hairColor: '#888888',
      hasHat: false,
      hasGlasses: false,
      distortionType: 'twitching',
    },
    greeting: "Do you have the brown cans? The ones with no expiration stamped on the rim?",
    dialogueChoices: [
      {
        playerText: "Just whatever is on the shelves in Aisle 2.",
        customerReply: "Good. The soil under the parking lot isn't right anymore. Store the cans deep.",
      },
      {
        playerText: "Planning for an emergency?",
        customerReply: "It's not an emergency if it never ends.",
      },
    ],
    products: [
      { id: 'c_beans1', name: 'Baked Molasses Beans', price: 2.50, barcode: '330011', color: '#884411', shape: 'can' },
      { id: 'c_beans2', name: 'Homestyle Pinto Beans', price: 2.50, barcode: '330012', color: '#663300', shape: 'can' },
      { id: 'c_beans3', name: 'Black Turtle Beans', price: 2.50, barcode: '330013', color: '#332211', shape: 'can' },
    ],
    acceptReaction: "The cellar is waiting. Don't look at the tree line.",
    refusalReaction: "You'll be wishing for these beans when the dawn doesn't come.",
  },
  {
    id: 'odd_map',
    name: 'Lost Motorist with Folded Map',
    appearance: {
      skinTone: '#d2a679',
      shirtColor: '#4a4459',
      pantsColor: '#25232e',
      hairColor: '#2b1d0c',
      hasHat: false,
      hasGlasses: false,
    },
    greeting: "Excuse me. This town... it isn't printed on my state atlas. What exit is this?",
    dialogueChoices: [
      {
        playerText: "This is Exit 41, K&M Mart on Route 9.",
        customerReply: "Route 9 was decommissioned thirty years ago. I've been driving in circles for six hours.",
      },
      {
        playerText: "Follow the highway north to reach the interstate.",
        customerReply: "I did. The road just loops back past your front neon sign.",
      },
    ],
    products: [
      { id: 'c_water', name: 'Distilled Spring Water (1 Gal)', price: 2.00, barcode: '449102', color: '#44aaff', shape: 'bottle' },
      { id: 'c_flashlight', name: 'Heavy Duty Halogen Torch', price: 14.00, barcode: '882019', color: '#ffcc00', shape: 'bottle' },
    ],
    acceptReaction: "I'll try driving again. If I see you in ten minutes... don't answer the door.",
    refusalReaction: "You won't let me have water? Fine... I'll wait outside in the rain.",
  },
];

const UNSETTLING_CUSTOMERS: CustomerData[] = [
  {
    id: 'unset_red_coat',
    name: 'The Woman in Crimson',
    appearance: {
      skinTone: '#b8c0c8', // Ash pale
      shirtColor: '#cc1111', // BRILLIANT RED - VIOLATES RED RULE!
      pantsColor: '#111111',
      hairColor: '#0a0a0a',
      hasHat: false,
      hasGlasses: false,
      isSupernatural: true,
      distortionType: 'elongated',
    },
    isWearingRed: true,
    greeting: "...Ring the items up. Quickly. The frost is spreading.",
    dialogueChoices: [
      {
        playerText: "Store policy says I cannot serve anyone wearing crimson.",
        customerReply: "...You read the rule. But the rule doesn't protect you once you say it aloud.",
      },
    ],
    products: [
      { id: 'c_raw_meat', name: 'Unlabeled Wrapped Flesh', price: 33.00, barcode: '000000', color: '#881111', shape: 'meat', isAnomalous: true },
      { id: 'c_salt', name: 'Coarse Rock Salt (5lb)', price: 7.00, barcode: '770012', color: '#dddddd', shape: 'box' },
    ],
    acceptReaction: "...You shouldn't have taken my money.",
    refusalReaction: "...Wise choice, clerk. The others behind the counter weren't so cautious.",
  },
  {
    id: 'unset_david',
    name: 'The Uniformed Stranger ("David")',
    appearance: {
      skinTone: '#c7b299',
      shirtColor: '#1a3320', // Store clerk green polo
      pantsColor: '#2b2a26', // Khaki
      hairColor: '#332211',
      hasHat: false,
      hasGlasses: false,
      isSupernatural: true,
    },
    isNamedDavid: true,
    greeting: "Hey partner! Manager sent me to relieve your shift early. You can head home right now, I'll take over.",
    dialogueChoices: [
      {
        playerText: "Management didn't mention any relief staff named David.",
        customerReply: "Oh, I'm new on the regional roster! Just step into the back storage and grab your coat.",
      },
      {
        playerText: "There are no employees named David here.",
        customerReply: "...Heh. Almost had you. Watch the aisles tonight, kid.",
      },
    ],
    products: [],
    acceptReaction: "Let me into the counter area...",
    refusalReaction: "Smart kid. See you in the back room.",
  },
  {
    id: 'unset_alone_asker',
    name: 'The Tall Shadow in Raincoat',
    appearance: {
      skinTone: '#9fa8a3',
      shirtColor: '#2c3539',
      pantsColor: '#1a1a1a',
      hairColor: '#050505',
      hasHat: true,
      hasGlasses: false,
      isSupernatural: true,
      distortionType: 'elongated',
    },
    asksIfAlone: true,
    greeting: "...Quiet out on Route 9. Tell me... are you working alone in here tonight?",
    dialogueChoices: [
      {
        playerText: "Yeah, just me running the register.",
        customerReply: "...Good. Very good. Nobody will notice.",
      },
      {
        playerText: "No, my supervisor Steve is reviewing cameras in the back office.",
        customerReply: "...Steve? There hasn't been a Steve here in twenty years.",
      },
    ],
    products: [
      { id: 'c_wire', name: 'Spool of Heavy Baling Wire', price: 12.00, barcode: '991024', color: '#555555', shape: 'box' },
      { id: 'c_bleach', name: 'Industrial Sodium Hypochlorite', price: 9.00, barcode: '221945', color: '#eeeeee', shape: 'bottle' },
    ],
    acceptReaction: "...See you after the lights go out.",
    refusalReaction: "...I'll be watching from across the asphalt.",
  },
  {
    id: 'unset_1998_patron',
    name: 'The 1998 Commuter',
    appearance: {
      skinTone: '#e2ba8f',
      shirtColor: '#703d52',
      pantsColor: '#293241',
      hairColor: '#4f3b26',
      hasHat: false,
      hasGlasses: false,
    },
    is1998Patron: true,
    greeting: "Man, I hope the Y2K bug doesn't crash the gas pumps next month. Got enough change for a twenty?",
    dialogueChoices: [
      {
        playerText: "Y2K? What year do you think it is?",
        customerReply: "1998, obviously. November 14th. Why, what year does your calendar say?",
      },
      {
        playerText: "This store closed in 1998.",
        customerReply: "...What? Don't be ridiculous, the lights are on and you're standing right there.",
      },
    ],
    products: [
      { id: 'c_cassette', name: 'Blank Maxell Audio Cassette (2-Pack)', price: 4.50, barcode: '883011', color: '#222222', shape: 'pack' },
      { id: 'c_film', name: 'Kodak 35mm Disposable Camera', price: 9.50, barcode: '119482', color: '#ffcc00', shape: 'box' },
    ],
    acceptReaction: "Thanks. Hope the morning paper has good news.",
    refusalReaction: "Fine, I'll pay at the pump outside.",
  },
];

export class HorrorDirector {
  public phase: HorrorPhase = 'NORMAL';
  public currentShift: ShiftNumber = 1;
  public gameMinutes = 0; // 0 to 360 (12:00 AM to 6:00 AM)
  public anxiety = 0; // 0 to 100

  // Cooldowns and timers
  private nextCustomerTime = 8; // In-game minutes until next customer arrives
  private nextEventTime = 45; // In-game minutes until next random environmental horror event
  private lastEventType: string | null = null;
  private spawnedCustomerHistory: string[] = [];

  // Active state
  public isWaitingQuietly = true; // Breathing room flag
  private quietTimer = 0;

  private callbacks: HorrorDirectorCallbacks;

  constructor(callbacks: HorrorDirectorCallbacks, initialShift: ShiftNumber = 1) {
    this.callbacks = callbacks;
    this.reset(initialShift);
  }

  public onCustomerServed(customer: CustomerData) {
    this.anxiety = Math.max(0, this.anxiety - 10);
    this.gameMinutes += 10;
  }

  public onCustomerRefused(customer: CustomerData) {
    this.anxiety = Math.min(100, this.anxiety + 15);
    this.gameMinutes += 5;
  }

  public reset(shift: ShiftNumber) {
    this.currentShift = shift;
    this.gameMinutes = 0;
    this.phase = 'NORMAL';
    this.anxiety = 0;
    this.spawnedCustomerHistory = [];
    this.isWaitingQuietly = true;
    this.quietTimer = 0;
    // Stagger arrival so the player has time to hear phone tutorial first
    this.nextCustomerTime = 40; // arrive around 12:40 AM
    this.nextEventTime = 70 + Math.random() * 30;
  }

  public update(deltaMinutes: number, world: StoreWorld, customerMgr: CustomerManager, entityMgr: EntityManager) {
    this.gameMinutes += deltaMinutes;

    // 1. Calculate Pacing Phase based on in-game time and shift
    const m = this.gameMinutes;
    if (m < 75) {
      this.phase = 'NORMAL';
    } else if (m < 155) {
      this.phase = 'ODD';
    } else if (m < 235) {
      this.phase = 'UNSETTLING';
    } else if (m < 295) {
      this.phase = 'DISTURBING';
    } else if (m < 340) {
      this.phase = 'THREATENING';
    } else {
      this.phase = 'TERRIFYING';
    }

    // 2. Manage Quiet Tension / Breathing Room
    if (this.isWaitingQuietly) {
      this.quietTimer += deltaMinutes;
    }

    // 3. Customer Spawning Logic (Dynamic, Unpredictable, Never the same sequence)
    if (!customerMgr.getCurrentCustomer() && this.gameMinutes >= this.nextCustomerTime) {
      this.spawnRandomCustomer(customerMgr);
      // Set next customer arrival with organic variability (30 to 75 minutes of store time)
      const variance = 35 + Math.random() * 45;
      this.nextCustomerTime = this.gameMinutes + variance;
    }

    // 4. Random Environmental Horror Event Trigger
    if (this.gameMinutes >= this.nextEventTime) {
      this.triggerRandomHorrorEvent(world, entityMgr);
      // Set next random event time (between 50 and 90 in-game minutes)
      this.nextEventTime = this.gameMinutes + (50 + Math.random() * 40);
    }
  }

  private spawnRandomCustomer(customerMgr: CustomerManager) {
    // Select customer pool based on current phase and shift
    let pool: CustomerData[] = [];

    if (this.phase === 'NORMAL') {
      pool = [...NORMAL_CUSTOMERS];
    } else if (this.phase === 'ODD') {
      pool = [...NORMAL_CUSTOMERS, ...ODD_CUSTOMERS];
    } else if (this.phase === 'UNSETTLING') {
      pool = [...ODD_CUSTOMERS, ...UNSETTLING_CUSTOMERS, ...NORMAL_CUSTOMERS.slice(0, 2)];
    } else {
      // DISTURBING or higher
      pool = [...UNSETTLING_CUSTOMERS, ...ODD_CUSTOMERS];
    }

    // Filter out recently spawned customers to avoid repeats
    const available = pool.filter((c) => !this.spawnedCustomerHistory.includes(c.id));
    const candidates = available.length > 0 ? available : pool;

    // Pick random candidate
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    this.spawnedCustomerHistory.push(picked.id);
    if (this.spawnedCustomerHistory.length > 5) {
      this.spawnedCustomerHistory.shift();
    }

    customerMgr.spawnCustomer(picked);
  }

  private triggerRandomHorrorEvent(world: StoreWorld, entityMgr: EntityManager) {
    // Choose an event appropriate for current phase
    const possibleEvents: { type: string; weight: number }[] = [];

    if (this.phase === 'NORMAL') {
      possibleEvents.push({ type: 'rain_gust', weight: 4 });
      possibleEvents.push({ type: 'isolated_light_dampen', weight: 2 });
      possibleEvents.push({ type: 'distant_thud', weight: 2 });
    } else if (this.phase === 'ODD') {
      possibleEvents.push({ type: 'distant_thud', weight: 3 });
      possibleEvents.push({ type: 'isolated_light_dampen', weight: 4 });
      possibleEvents.push({ type: 'light_flicker', weight: 2 });
      possibleEvents.push({ type: 'window_knock', weight: 2 });
      possibleEvents.push({ type: 'phone_call_strange', weight: 2 });
    } else if (this.phase === 'UNSETTLING') {
      possibleEvents.push({ type: 'window_knock', weight: 3 });
      possibleEvents.push({ type: 'cctv_glitch', weight: 3 });
      possibleEvents.push({ type: 'isolated_light_dampen', weight: 3 });
      possibleEvents.push({ type: 'light_flicker', weight: 3 });
      possibleEvents.push({ type: 'whisper_backroom', weight: 2 });
    } else if (this.phase === 'DISTURBING') {
      possibleEvents.push({ type: 'breaker_blackout', weight: 3 });
      possibleEvents.push({ type: 'isolated_light_dampen', weight: 3 });
      possibleEvents.push({ type: 'spawn_aisle6_entity', weight: 3 });
      possibleEvents.push({ type: 'cctv_glitch', weight: 3 });
    } else {
      // THREATENING / TERRIFYING
      possibleEvents.push({ type: 'breaker_blackout', weight: 4 });
      possibleEvents.push({ type: 'isolated_light_dampen', weight: 3 });
      possibleEvents.push({ type: 'spawn_aisle6_entity', weight: 4 });
      possibleEvents.push({ type: 'cctv_glitch', weight: 4 });
      possibleEvents.push({ type: 'window_slam', weight: 3 });
    }

    // Weighted selection
    const totalWeight = possibleEvents.reduce((acc, e) => acc + e.weight, 0);
    let rand = Math.random() * totalWeight;
    let selectedEvent = possibleEvents[0].type;
    for (const evt of possibleEvents) {
      if (rand < evt.weight) {
        selectedEvent = evt.type;
        break;
      }
      rand -= evt.weight;
    }

    this.lastEventType = selectedEvent;
    this.executeEvent(selectedEvent, world, entityMgr);
  }

  private executeEvent(type: string, world: StoreWorld, entityMgr: EntityManager) {
    switch (type) {
      case 'distant_thud':
        sound.playDistantThud();
        this.callbacks.onEnvironmentalEvent('distant_thud', 'A dull metallic clatter echoed from the rear storage racks.');
        break;

      case 'isolated_light_dampen':
        world.triggerSpecificLightDampening(undefined, 4.5, 0.15);
        sound.playStaticBurst(0.12);
        this.callbacks.onEnvironmentalEvent('isolated_light_dampen', 'A section of the ceiling fluorescent tubes dimmed with a low buzz.');
        break;

      case 'light_flicker':
        world.triggerLightFlicker(3.5);
        sound.playStaticBurst(0.2);
        this.callbacks.onEnvironmentalEvent('light_flicker', 'The fluorescent ballasts overhead buzz violently.');
        break;

      case 'window_knock':
        sound.playWindowKnock();
        this.callbacks.onWindowKnock();
        this.callbacks.onEnvironmentalEvent('window_knock', 'Three heavy knuckles rapped sharply against the front display glass.');
        break;

      case 'window_slam':
        sound.playWindowKnock();
        setTimeout(() => sound.playWindowKnock(), 400);
        this.callbacks.onWindowKnock();
        this.callbacks.onEnvironmentalEvent('window_slam', 'Violent pounding reverberated along the front entrance glass.');
        break;

      case 'breaker_blackout':
        world.triggerBlackout();
        sound.playBreakerTrip();
        this.callbacks.onBlackout();
        this.callbacks.onEnvironmentalEvent('breaker_blackout', 'The electrical main tripped outside. Head through the back exit to fix the alley breaker box.');
        break;

      case 'cctv_glitch':
        const cam = Math.floor(Math.random() * 6) + 1;
        sound.playStaticBurst(0.4);
        this.callbacks.onCctvGlitch(cam);
        this.callbacks.onEnvironmentalEvent('cctv_glitch', `CCTV Feed CAM-0${cam} suffered severe radio frequency interference.`);
        break;

      case 'spawn_aisle6_entity':
        if (!entityMgr.aisle6ManActive) {
          entityMgr.spawnAisle6Man();
          sound.playDistantThud();
        }
        break;

      case 'whisper_backroom':
        sound.playWhisper();
        break;

      case 'phone_call_strange':
        this.callbacks.onPhoneRing(
          'call_strange_' + Math.floor(Math.random() * 100),
          "...Don't answer the knocking. Whatever is standing in the rain isn't looking for groceries."
        );
        break;
    }
  }
}
