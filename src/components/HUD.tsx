import React from 'react';
import { InteractiveObject } from '../game/StoreWorld';
import { Clock, AlertTriangle, Crosshair, Menu } from 'lucide-react';

interface HUDProps {
  shiftNumber: number;
  currentTimeString: string;
  targetedObject: InteractiveObject | null;
  isFlashlightOn: boolean;
  anxietyLevel: number;
  isBlackout: boolean;
  isDoorLocked: boolean;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  onOpenMenu: () => void;
  activeObjective?: string;
}

export const HUD: React.FC<HUDProps> = ({
  shiftNumber,
  currentTimeString,
  targetedObject,
  isFlashlightOn,
  anxietyLevel,
  isBlackout,
  isDoorLocked,
  isPointerLocked,
  onRequestPointerLock,
  onOpenMenu,
  activeObjective,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none font-mono">
      {/* 1. ANXIETY / SANITY HORROR VIGNETTE */}
      {anxietyLevel > 15 && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 ${Math.min(220, anxietyLevel * 2.8)}px rgba(180, 20, 20, ${Math.min(0.9, anxietyLevel / 85)})`,
          }}
        />
      )}

      {/* 2. BLACKOUT WARNING BANNER */}
      {isBlackout && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-red-950/90 border-2 border-red-600 rounded-lg text-red-300 text-xs font-bold tracking-widest flex items-center gap-2 shadow-2xl animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>ELECTRICAL MAIN TRIPPED: RESET BREAKER IN STORAGE ROOM</span>
        </div>
      )}

      {/* 3. TOP-LEFT MENU BUTTON, CLOCK & STATUS BAR */}
      <div className="absolute top-4 left-4 flex items-start space-x-2.5">
        {/* Top-Left Menu / Exit / Resume Button */}
        <button
          onClick={onOpenMenu}
          title="Open Menu / Pause Game (ESC)"
          className="pointer-events-auto flex items-center gap-2 px-3 py-2.5 bg-neutral-950/95 hover:bg-neutral-900 text-neutral-200 hover:text-amber-300 border border-neutral-800 hover:border-amber-500/80 rounded-lg shadow-2xl backdrop-blur-sm transition-all cursor-pointer group active:scale-95"
        >
          <Menu className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-300 tracking-wider">MENU</span>
        </button>

        <div className="bg-neutral-950/90 border border-neutral-800/80 rounded-lg p-2.5 backdrop-blur-sm shadow-xl space-y-1">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-bold text-base tracking-wider">{currentTimeString}</span>
            <span className="text-neutral-600 text-xs">|</span>
            <span className="text-xs text-neutral-300 font-semibold tracking-wide">
              NIGHT {shiftNumber}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-neutral-400">
            <span>ENTRANCE:</span>
            <span className={isDoorLocked ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isDoorLocked ? '[LOCKED]' : '[UNLOCKED]'}
            </span>
            <span>•</span>
            <span className={isFlashlightOn ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
              [F] FLASHLIGHT {isFlashlightOn ? 'ON' : 'OFF'}
            </span>
            <span>•</span>
            <button
              onClick={onRequestPointerLock}
              title="Press Q or click here to toggle mouse lock"
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors pointer-events-auto cursor-pointer ${
                isPointerLocked
                  ? 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white hover:bg-neutral-700'
                  : 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
              }`}
            >
              [Q] {isPointerLocked ? 'UNLOCK MOUSE' : 'LOCK MOUSE'}
            </button>
          </div>
        </div>

        {/* Current Objective Banner */}
        {activeObjective && (
          <div className="bg-neutral-950/90 border border-amber-900/60 rounded-lg px-4 py-2.5 backdrop-blur-sm shadow-xl text-xs text-neutral-200 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <div>
              <span className="text-neutral-400 font-semibold uppercase text-[10px] block">CURRENT TASK</span>
              <span className="text-amber-200 font-medium">{activeObjective}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. CENTER RETICLE / INTERACTION PROMPT */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {targetedObject ? (
          <div className="flex flex-col items-center space-y-2 transform -translate-y-2">
            <div className="w-4 h-4 border-2 border-emerald-400 rounded-full flex items-center justify-center animate-ping" />
            <div className="px-3.5 py-1.5 bg-neutral-950/95 border border-emerald-500/80 rounded-md shadow-2xl backdrop-blur-sm text-center">
              <span className="text-xs font-bold text-emerald-300 tracking-wider">
                {targetedObject.prompt}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
        )}
      </div>

      {/* 5. HELPER NOTIFICATION WHEN MOUSE IS UNLOCKED */}
      {!isPointerLocked && (
        <div
          onClick={onRequestPointerLock}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto cursor-pointer group"
        >
          <div className="flex items-center space-x-2.5 px-4 py-2 bg-neutral-950/95 hover:bg-neutral-900 border border-amber-500/80 hover:border-amber-400 rounded-full shadow-2xl backdrop-blur-md transition-all">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs text-amber-200 font-bold tracking-wide">
              MOUSE UNLOCKED • CLICK SCREEN OR PRESS [Q] TO LOCK & LOOK
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
