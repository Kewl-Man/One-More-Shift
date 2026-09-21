export type ShiftNumber = 1 | 2 | 3 | 4 | 5 | 6; // 6 is Endless/Overtime

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  mouseSensitivity: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  headBobbing: boolean;
  fullscreen: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface StoreRule {
  id: string;
  shift: ShiftNumber;
  ruleText: string;
  hint: string;
  isRedHerring?: boolean;
}

export interface DialogueChoice {
  text: string;
  nextDialogueId?: string;
  action?: () => void;
  isCorrectRule?: boolean;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  avatar?: string;
  voiceType?: 'normal' | 'deep' | 'glitched' | 'whisper' | 'radio' | 'corporate';
  choices?: DialogueChoice[];
}

export interface CustomerProduct {
  id: string;
  name: string;
  price: number;
  barcode: string;
  color: string;
  isAnomalous?: boolean;
  anomalyNote?: string;
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
    distortionType?: 'none' | 'elongated' | 'inverted' | 'shadow' | 'faceless' | 'mimic';
  };
  products: CustomerProduct[];
  dialogueTree: Record<string, DialogueNode>;
  initialDialogueId: string;
  isWearingRed?: boolean;
  isNamedDavid?: boolean;
  asksIfAlone?: boolean;
  paymentAmount: number;
  entityType?: 'none' | 'mimic' | 'the_refund' | 'watcher' | 'aisle6_man';
}

export interface ActiveTask {
  id: string;
  title: string;
  description: string;
  currentCount: number;
  targetCount: number;
  type: 'restock' | 'register' | 'mop' | 'trash' | 'breaker' | 'lock_door' | 'check_cctv' | 'phone';
  completed: boolean;
  locationHint?: string;
}

export interface GameSaveData {
  currentShift: ShiftNumber;
  highestShiftUnlocked: ShiftNumber;
  totalCashEarned: number;
  shiftsCompleted: number;
  settings: GameSettings;
}

export interface GameEvent {
  id: string;
  timeHour: number; // e.g. 1.5 = 1:30 AM
  trigger: () => void;
  executed: boolean;
}
