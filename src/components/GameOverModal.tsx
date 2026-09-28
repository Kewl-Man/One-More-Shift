import React from 'react';
import { ShiftNumber } from '../types';
import { sound } from '../audio/SoundManager';
import { Skull, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  shiftNumber?: ShiftNumber | number;
  causeOfDeath?: string;
  cause?: string;
  ruleViolated?: string;
  ruleBroken?: string;
  onRetry?: () => void;
  onRestart?: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  shiftNumber = 1,
  causeOfDeath,
  cause,
  ruleViolated,
  ruleBroken,
  onRetry,
  onRestart,
  onMainMenu,
}) => {
  const finalCause = cause || causeOfDeath || 'You failed to survive your shift.';
  const finalRule = ruleBroken || ruleViolated;
  const handleRestart = onRestart || onRetry || onMainMenu;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg p-4 select-none font-mono text-neutral-200">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-red-900/80 rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.3)] p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-950/60 border border-red-700/80 flex items-center justify-center mx-auto text-red-500 animate-pulse">
          <Skull className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest bg-red-950 px-2.5 py-0.5 rounded border border-red-800">
            EMPLOYEE CASUALTY REPORT
          </span>
          <h2 className="text-xl font-extrabold text-neutral-100 mt-2 tracking-wider">
            YOUR SHIFT HAS ENDED
          </h2>
          <p className="text-xs text-red-400 font-sans mt-1">{finalCause}</p>
        </div>

        {finalRule && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 text-left">
            <div className="text-[11px] text-red-400 font-bold mb-1">RULE NEGLECTED:</div>
            <div className="text-xs text-neutral-300 font-serif italic">"{finalRule}"</div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              sound.playUiClick();
              handleRestart();
            }}
            className="flex-1 py-2.5 px-4 bg-red-700 hover:bg-red-600 text-white font-bold text-xs rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Night
          </button>
          <button
            onClick={() => {
              sound.playUiClick();
              onMainMenu();
            }}
            className="flex-1 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-bold rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
