import React from 'react';
import { ActiveTask, ShiftNumber } from '../types';
import { InteractiveObject } from '../game/StoreWorld';
import { Clock, CheckSquare, Square, Flashlight, Key, Package, Sparkles, AlertTriangle } from 'lucide-react';

interface HUDProps {
  shiftNumber: ShiftNumber;
  currentTimeString: string;
  tasks: ActiveTask[];
  targetedObject: InteractiveObject | null;
  isFlashlightOn: boolean;
  heldItem: 'none' | 'crate' | 'mop' | 'keys';
  anxietyLevel: number;
  isBlackout: boolean;
  isDoorLocked: boolean;
  isPointerLocked: boolean;
  onRequestPointerLock: () => void;
  onOpenRules: () => void;
  onOpenPhone: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  shiftNumber,
  currentTimeString,
  tasks,
  targetedObject,
  isFlashlightOn,
  heldItem,
  anxietyLevel,
  isBlackout,
  isDoorLocked,
  isPointerLocked,
  onRequestPointerLock,
  onOpenRules,
  onOpenPhone,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none font-mono">
      {/* Anxiety / Horror Red Vignette */}
      {anxietyLevel > 15 && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 ${Math.min(180, anxietyLevel * 2.2)}px rgba(180, 20, 20, ${Math.min(0.85, anxietyLevel / 90)})`,
          }}
        />
      )}

      {/* Blackout Flashing Banner */}
      {isBlackout && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 px-5 py-2 bg-red-950/90 border-2 border-red-600 rounded-lg text-red-300 text-xs font-bold tracking-widest flex items-center gap-2 shadow-2xl animate-pulse">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>POWER FAILURE: RESET BREAKER IN STORAGE ROOM</span>
        </div>
      )}

      {/* Top Header: Clock, Shift & Status */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        {/* Clock & Shift */}
        <div className="bg-neutral-950/85 border border-neutral-800/80 rounded-lg p-3 backdrop-blur-sm shadow-xl space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 font-bold text-base tracking-wider">{currentTimeString}</span>
            <span className="text-neutral-500 text-xs">|</span>
            <span className="text-xs text-neutral-300 font-semibold tracking-wide">
              SHIFT {shiftNumber} {shiftNumber === 6 ? '(OVERTIME)' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-neutral-400">
            <span>DOOR:</span>
            <span className={isDoorLocked ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {isDoorLocked ? '[LOCKED]' : '[UNLOCKED]'}
            </span>
            <span>•</span>
            <button
              onClick={onOpenRules}
              className="text-amber-400/90 hover:text-amber-300 underline pointer-events-auto"
            >
              [F1] View Rules
            </button>
            <span>•</span>
            <button
              onClick={onOpenPhone}
              className="text-red-400/90 hover:text-red-300 underline pointer-events-auto"
            >
              [P] Red Hotline
            </button>
          </div>
        </div>

        {/* Active Objectives Checklist */}
        <div className="bg-neutral-950/85 border border-neutral-800/80 rounded-lg p-3 backdrop-blur-sm shadow-xl max-w-sm w-full">
          <div className="text-xs font-bold text-neutral-300 border-b border-neutral-800 pb-1.5 mb-2 flex items-center justify-between">
            <span>SHIFT OBJECTIVES</span>
            <span className="text-[10px] text-neutral-500">
              {tasks.filter((t) => t.completed).length} / {tasks.length} DONE
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`text-xs flex items-start space-x-2 ${
                  task.completed ? 'text-neutral-500 line-through' : 'text-neutral-200'
                }`}
              >
                {task.completed ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                )}
                <div className="leading-snug">
                  <div>{task.title}</div>
                  {!task.completed && task.locationHint && (
                    <div className="text-[10px] text-neutral-400">Location: {task.locationHint}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Crosshair & Interaction Prompt */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {targetedObject ? (
          <div className="flex flex-col items-center">
            {/* Expanded active reticle */}
            <div className="w-4 h-4 rounded-full border-2 border-amber-400 bg-amber-400/20 mb-2 animate-ping" />
            <div className="px-3 py-1.5 bg-neutral-950/90 border border-amber-500/80 rounded-lg shadow-xl text-center pointer-events-auto">
              <div className="text-xs font-bold text-amber-300 tracking-wide">
                [E / Click] {targetedObject.prompt}
              </div>
              <div className="text-[10px] text-neutral-400">{targetedObject.name}</div>
            </div>
          </div>
        ) : (
          /* Idle Reticle */
          <div className="w-1.5 h-1.5 rounded-full bg-white/70 shadow-sm" />
        )}
      </div>

      {/* Bottom Controls / Inventory Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        {/* Inventory Item in Hand */}
        <div className="flex items-center space-x-2">
          <div
            className={`px-3 py-2 rounded-lg border backdrop-blur-sm flex items-center gap-2 text-xs font-bold ${
              heldItem !== 'none'
                ? 'bg-amber-950/40 border-amber-600/60 text-amber-200'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-400'
            }`}
          >
            {heldItem === 'crate' && <Package className="w-4 h-4 text-amber-400" />}
            {heldItem === 'mop' && <Sparkles className="w-4 h-4 text-cyan-400" />}
            {heldItem === 'keys' && <Key className="w-4 h-4 text-emerald-400" />}
            <span>
              HANDS:{' '}
              {heldItem === 'crate'
                ? 'Inventory Crate'
                : heldItem === 'mop'
                ? 'Cleaning Mop'
                : heldItem === 'keys'
                ? 'Store Keys'
                : 'Empty (Free)'}
            </span>
          </div>

          <div
            className={`px-3 py-2 rounded-lg border backdrop-blur-sm flex items-center gap-2 text-xs font-bold ${
              isFlashlightOn
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-neutral-950/80 border-neutral-800 text-neutral-500'
            }`}
          >
            <Flashlight className="w-4 h-4" />
            <span>[F] Flashlight {isFlashlightOn ? 'ON' : 'OFF'}</span>
          </div>
        </div>

        {/* Pointer Lock Warning / Click to Play Helper */}
        {!isPointerLocked && (
          <div className="px-4 py-2 bg-neutral-900/90 border border-neutral-700 rounded-lg text-xs text-neutral-300 shadow-xl pointer-events-auto flex items-center gap-2">
            <span>[ Click Screen to Look / Play ]</span>
            <button
              onClick={onRequestPointerLock}
              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold"
            >
              Lock Mouse
            </button>
          </div>
        )}

        {/* Controls Quick Hints */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-lg px-3 py-2 text-[11px] text-neutral-400 space-x-3 hidden sm:flex">
          <span>WASD: Move</span>
          <span>SHIFT: Sprint</span>
          <span>C: Crouch</span>
          <span>E: Interact</span>
          <span>F: Flashlight</span>
          <span>ESC: Menu</span>
        </div>
      </div>
    </div>
  );
};
