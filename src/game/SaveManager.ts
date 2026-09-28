export interface GameSave {
  id: string;
  name: string;
  dateStarted: string;
  lastPlayed: string;
  shift: number;
  nightNumber?: number;
  gameMinutes: number;
  cashEarned: number;
  anomaliesSurvived: number;
  progressText: string;
  isDoorLocked?: boolean;
  isBlackout?: boolean;
  phoneTutorialStep?: string;
  playerPosition?: { x: number; y: number; z: number };
}

const STORAGE_KEY = 'onemoreshift_save_slots_v2';

export class SaveManager {
  public static getSaves(): GameSave[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load saves:', e);
      return [];
    }
  }

  public static saveList(saves: GameSave[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    } catch (e) {
      console.error('Failed to write saves:', e);
    }
  }

  public static createNewSave(customName?: string): GameSave {
    const saves = this.getSaves();
    const now = new Date();
    const dateStr =
      now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const slotNumber = saves.length + 1;
    const name = customName?.trim() || `Clerk Shift #${slotNumber}`;

    const newSave: GameSave = {
      id: 'save_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name,
      dateStarted: dateStr,
      lastPlayed: dateStr,
      shift: 1,
      nightNumber: 1,
      gameMinutes: 0, // 12:00 AM
      cashEarned: 0,
      anomaliesSurvived: 0,
      progressText: 'Night 1 — 12:00 AM (Orientation)',
      isDoorLocked: false,
      isBlackout: false,
      phoneTutorialStep: 'intro',
      playerPosition: { x: -10.4, y: 1.75, z: 9.8 },
    };

    saves.unshift(newSave);
    this.saveList(saves);
    return newSave;
  }

  public static createSave(customName?: string): GameSave {
    return this.createNewSave(customName);
  }

  public static autoSave(
    id: string,
    nightNumber: number,
    gameMinutes: number,
    isDoorLocked = false,
    isBlackout = false
  ) {
    const hour = Math.floor(gameMinutes / 60);
    const displayHour = hour === 0 ? 12 : hour;
    const mins = Math.floor(gameMinutes % 60);
    const timeStr = `${displayHour < 10 ? '0' + displayHour : displayHour}:${mins < 10 ? '0' + mins : mins} AM`;

    this.updateSave(id, {
      shift: nightNumber,
      nightNumber,
      gameMinutes,
      progressText: `Night ${nightNumber} — ${timeStr}`,
      isDoorLocked,
      isBlackout,
    });
  }

  public static updateSave(
    id: string,
    updates: Partial<Omit<GameSave, 'id' | 'dateStarted'>>
  ) {
    const saves = this.getSaves();
    const idx = saves.findIndex((s) => s.id === id);
    if (idx === -1) return;

    const now = new Date();
    const dateStr =
      now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    saves[idx] = {
      ...saves[idx],
      ...updates,
      lastPlayed: dateStr,
    };

    this.saveList(saves);
  }

  public static renameSave(id: string, newName: string) {
    const saves = this.getSaves();
    const save = saves.find((s) => s.id === id);
    if (save && newName.trim()) {
      save.name = newName.trim();
      this.saveList(saves);
    }
  }

  public static deleteSave(id: string) {
    const saves = this.getSaves().filter((s) => s.id !== id);
    this.saveList(saves);
  }
}
