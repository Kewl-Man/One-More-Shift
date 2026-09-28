import React, { useState } from 'react';
import { sound } from '../audio/SoundManager';
import { Play, Save, LogOut, Check, ShieldAlert, Clock } from 'lucide-react';

interface PauseMenuModalProps {
  nightNumber: number;
  timeString: string;
  activeObjective?: string;
  onResume: () => void;
  onSave: () => void;
  onExitToMenu: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  nightNumber,
  timeString,
  activeObjective,
  onResume,
  onSave,
  onExitToMenu,
}) => {
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveClick = () => {
    sound.playUiClick();
    onSave();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleResumeClick = () => {
    sound.playUiClick();
    onResume();
  };

  const handleExitClick = () => {
    sound.playUiClick();
    onExitToMenu();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl p-6 text-neutral-200 max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="text-center pb-4 border-b border-neutral-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/60 border border-amber-800/80 rounded-full text-amber-400 text-xs font-bold tracking-widest mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>NIGHT {nightNumber} • {timeString}</span>
          </div>
          <h2 className="text-2xl font-black tracking-wider text-neutral-100">SHIFT PAUSED</h2>
          <p className="text-xs text-neutral-500 mt-1">K&M Mart Overnight Shift Management</p>
        </div>

        {/* Current Objective */}
        {activeObjective && (
          <div className="my-4 p-3 bg-neutral-900/80 border border-neutral-800 rounded-lg text-xs">
            <span className="text-neutral-500 font-bold block text-[10px] uppercase">Active Objective</span>
            <span className="text-amber-300 font-medium">{activeObjective}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 my-4">
          {/* Resume Game */}
          <button
            onClick={handleResumeClick}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black rounded-lg shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2.5 text-sm tracking-wider cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME SHIFT [ESC]</span>
          </button>

          {/* Save Shift */}
          <button
            onClick={handleSaveClick}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 hover:border-neutral-600 font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-xs tracking-wider cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">SHIFT PROGRESS SAVED!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-neutral-400" />
                <span>SAVE SHIFT PROGRESS</span>
              </>
            )}
          </button>

          {/* Exit to Main Menu */}
          <button
            onClick={handleExitClick}
            className="w-full py-2.5 px-4 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-red-200 border border-red-900/60 font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-xs tracking-wider cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>SAVE & EXIT TO MAIN MENU</span>
          </button>
        </div>

        {/* Key Controls Quick Reference */}
        <div className="pt-3 border-t border-neutral-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-500" />
            <span>CONTROLS CHEATSHEET</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-neutral-400 bg-neutral-900/50 p-2.5 rounded-lg border border-neutral-800/60">
            <div><span className="text-neutral-200 font-bold">W / A / S / D:</span> Move</div>
            <div><span className="text-neutral-200 font-bold">Mouse:</span> Look around</div>
            <div><span className="text-neutral-200 font-bold">E / Left Click:</span> Interact / Scan</div>
            <div><span className="text-neutral-200 font-bold">Q:</span> Unlock / Lock Mouse</div>
            <div><span className="text-neutral-200 font-bold">F:</span> Flashlight On/Off</div>
            <div><span className="text-neutral-200 font-bold">Shift:</span> Sprint / Run</div>
            <div><span className="text-neutral-200 font-bold">C:</span> Crouch</div>
            <div><span className="text-neutral-200 font-bold">ESC:</span> Resume Game</div>
          </div>
        </div>
      </div>
    </div>
  );
};
