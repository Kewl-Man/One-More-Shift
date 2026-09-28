import React, { useState, useEffect } from 'react';
import { sound } from '../audio/SoundManager';
import { SaveManager, GameSave } from '../game/SaveManager';
import { Play, PlusCircle, Settings, Volume2, VolumeX, Moon, Trash2, Edit3, Check, ArrowLeft, FolderOpen } from 'lucide-react';

interface MainMenuProps {
  onLoadGame: (save: GameSave) => void;
  onStartNewGame: (saveName?: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  masterVolume: number;
  onVolumeChange: (vol: number) => void;
  sensitivity: number;
  onSensitivityChange: (sens: number) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onLoadGame,
  onStartNewGame,
  soundEnabled,
  onToggleSound,
  masterVolume,
  onVolumeChange,
  sensitivity,
  onSensitivityChange,
}) => {
  const [view, setView] = useState<'main' | 'select_game' | 'settings'>('main');
  const [saves, setSaves] = useState<GameSave[]>([]);
  const [editingSaveId, setEditingSaveId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [newSaveNameInput, setNewSaveNameInput] = useState('');
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  useEffect(() => {
    setSaves(SaveManager.getSaves());
  }, [view]);

  const handleStartRename = (save: GameSave) => {
    setEditingSaveId(save.id);
    setRenameText(save.name);
  };

  const handleConfirmRename = (id: string) => {
    if (renameText.trim()) {
      SaveManager.renameSave(id, renameText.trim());
      setSaves(SaveManager.getSaves());
    }
    setEditingSaveId(null);
  };

  const handleDeleteSave = (id: string) => {
    sound.playUiClick();
    SaveManager.deleteSave(id);
    setSaves(SaveManager.getSaves());
  };

  const handleSelectSave = (save: GameSave) => {
    sound.init();
    sound.playUiClick();
    onLoadGame(save);
  };

  const handleConfirmNewGame = () => {
    sound.init();
    sound.playUiClick();
    onStartNewGame(newSaveNameInput.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none font-mono text-neutral-200">
      {/* Background Ambience: Deep Cold Convenience Store Darkness */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black opacity-95" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.15), transparent 60%)',
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl p-8 flex flex-col items-center text-center">
        {/* Title */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold tracking-widest uppercase mb-2">
            <Moon className="w-3.5 h-3.5" />
            K&M Mart Overnight Convenience Store
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-neutral-100 uppercase drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            ONE MORE SHIFT
          </h1>
        </div>

        {/* 1. MAIN MENU VIEW */}
        {view === 'main' && (
          <div className="w-full space-y-3.5">
            <button
              onClick={() => {
                sound.playUiClick();
                setView('select_game');
              }}
              className="w-full py-4 px-6 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-sm tracking-widest uppercase rounded-lg shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4" />
              CONTINUE GAME
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setShowNewGameModal(true);
              }}
              className="w-full py-3.5 px-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              START NEW GAME
            </button>

            <button
              onClick={() => {
                sound.playUiClick();
                setView('settings');
              }}
              className="w-full py-3.5 px-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              SETTINGS
            </button>

            <div className="pt-4 text-[11px] text-neutral-500">
              Vite / React 19 • Route 9 Convenience Store • 1998
            </div>
          </div>
        )}

        {/* 2. SELECT GAME (SAVES LIST) VIEW */}
        {view === 'select_game' && (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold tracking-wider text-neutral-100">SELECT GAME</span>
              </div>
              <button
                onClick={() => {
                  sound.playUiClick();
                  setView('main');
                }}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            {saves.length === 0 ? (
              <div className="p-8 bg-neutral-900/50 rounded-lg border border-neutral-800 text-center space-y-3">
                <p className="text-xs text-neutral-400">No saved games found on this terminal.</p>
                <button
                  onClick={() => setShowNewGameModal(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded transition-colors"
                >
                  Start New Game
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-left">
                {saves.map((save) => (
                  <div
                    key={save.id}
                    className="p-3.5 bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 rounded-lg space-y-2 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      {editingSaveId === save.id ? (
                        <div className="flex items-center space-x-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            className="bg-neutral-950 border border-amber-500 px-2 py-1 text-xs text-white rounded w-full font-mono outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleConfirmRename(save.id)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-500 rounded text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-neutral-100">{save.name}</span>
                          <button
                            onClick={() => handleStartRename(save)}
                            className="text-neutral-500 hover:text-neutral-300"
                            title="Rename Save"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectSave(save)}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-neutral-950 text-xs font-bold rounded tracking-wider uppercase transition-colors"
                        >
                          Load Game
                        </button>
                        <button
                          onClick={() => handleDeleteSave(save.id)}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          title="Delete Save"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-400 space-y-0.5">
                      <div>Progress: <span className="text-emerald-400 font-semibold">{save.progressText}</span></div>
                      <div>Last Played: {save.lastPlayed}</div>
                      <div>Started: {save.dateStarted}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. SETTINGS VIEW */}
        {view === 'settings' && (
          <div className="w-full space-y-5 text-left bg-neutral-900/60 p-6 rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <span className="text-sm font-bold tracking-wider text-neutral-100">SETTINGS</span>
              <button
                onClick={() => setView('main')}
                className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                  <span>MASTER AUDIO VOLUME</span>
                  <span>{Math.round(masterVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={masterVolume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                  <span>MOUSE SENSITIVITY</span>
                  <span>{sensitivity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="4.0"
                  step="0.1"
                  value={sensitivity}
                  onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-neutral-400">AUDIO MUTE</span>
                <button
                  onClick={onToggleSound}
                  className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    soundEnabled
                      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      : 'bg-red-950 text-red-300 border border-red-800'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  {soundEnabled ? 'Enabled' : 'Muted'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW GAME NAME PROMPT MODAL */}
      {showNewGameModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Start New Game</h3>
            <p className="text-xs text-neutral-400">
              Create a new save file. You will start at Night 1 from 12:00 AM.
            </p>
            <div>
              <label className="text-[11px] text-neutral-400 uppercase font-semibold mb-1 block">
                Save File Name (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Clerk Shift #1"
                value={newSaveNameInput}
                onChange={(e) => setNewSaveNameInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-700 focus:border-amber-500 px-3 py-2 text-xs rounded text-neutral-200 outline-none font-mono"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNewGameModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNewGame}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs rounded transition-colors uppercase tracking-wider"
              >
                Start Shift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
