export type ShiftNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  mouseSensitivity: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  headBobbing: boolean;
  fullscreen: boolean;
}

export interface StoreRule {
  id: string;
  ruleNumber?: number;
  title?: string;
  ruleText: string;
  warningNote?: string;
  hint?: string;
  minShift?: ShiftNumber;
  shift?: number;
  isRedacted?: boolean;
}

export interface CustomerProduct {
  id: string;
  name: string;
  price: number;
  barcode: string;
  color: string;
  shape?: 'can' | 'box' | 'bottle' | 'pack' | 'meat' | 'curse';
  isAnomalous?: boolean;
  anomalyNote?: string;
}

export interface DialogueChoice {
  playerText: string;
  customerReply: string;
  nextId?: string;
  closesDialogue?: boolean;
}

export interface DialogueNode {
  id: string;
  speakerName: string;
  text: string;
  choices: DialogueChoice[];
}

export interface CustomerData {
  id: string;
  name: string;
  appearance: {
    skinTone: string;
    shirtColor: string;
    pantsColor: string;
    hairColor: string;
    hasHat?: boolean;
    hasGlasses?: boolean;
    isSupernatural?: boolean;
    distortionType?: 'none' | 'elongated' | 'inverted' | 'shadow' | 'faceless' | 'mimic' | 'twitching';
  };
  products: CustomerProduct[];
  greeting?: string;
  dialogueChoices?: DialogueChoice[];
  isWearingRed?: boolean;
  isNamedDavid?: boolean;
  asksIfAlone?: boolean;
  is1998Patron?: boolean;
  refusalReaction?: string;
  acceptReaction?: string;
  paymentAmount?: number;
  entityType?: string;
  initialDialogueId?: string;
  dialogueTree?: any;
}

export type HorrorPhase = 'NORMAL' | 'ODD' | 'UNSETTLING' | 'DISTURBING' | 'THREATENING' | 'TERRIFYING';

export interface HorrorEventDefinition {
  id: string;
  minMinutes: number;
  minPhase: HorrorPhase;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare';
  description: string;
  execute: () => void;
}

export interface ActiveTask {
  id: string;
  title: string;
  description: string;
  type: 'register' | 'breaker' | 'lock_door' | 'check_cctv' | 'phone' | 'restock' | 'mop';
  completed: boolean;
  currentCount?: number;
  targetCount?: number;
  locationHint?: string;
}

export type PhoneTutorialStep =
  | 'intro'
  | 'idle_ring'
  | 'greeting'
  | 'look_at_register'
  | 'inspect_register'
  | 'explain_checkout'
  | 'check_cctv'
  | 'inspect_cctv'
  | 'explain_cctv'
  | 'conclusion'
  | 'completed';
