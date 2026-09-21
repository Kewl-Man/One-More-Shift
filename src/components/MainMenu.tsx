import React, { useState } from 'react';
import { sound } from '../audio/SoundManager';
import { Play, RotateCcw, BookOpen, Settings, Volume2, ShieldAlert, Sparkles, Moon } from 'lucide-react';
import { ShiftNumber } from '../types';

interface MainMenuProps {
  onStartShift: (shift: ShiftNumber) => void;
  savedShift: ShiftNumber;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartShift,
  savedShift,
  soundEnabled,
  onToggleSound,
}) => {
  const [view, setView] = useState<'main' | 'shifts' | 'handbook' | 'settings'>('main');
  const [sensitivity, setSensitivity] = useState<number>(2.2);

  const shiftsList: { num: ShiftNumber; title: string; desc: string }[] = [
    { num: 1, title: 'Shift 1: The Orientation', desc: 'Routine tasks, basic rules, and the first customer anomalies.' },
    { num: 2, title: 'Shift 2: The Red Rule', desc: 'Do not serve anyone wearing red. Knocking at the glass.' },
    { num: 3, title: 'Shift 3: David', desc: 'There are no employees named David. Blackout events.' },
    { num: 4, title: 'Shift 4: The Inversion', desc: 'Never admit to being alone. The Customer returns.' },
    { num: 5, title: 'Shift 5: One More Shift', desc: 'The store closed in 1998. The grand convergence.' },
    { num: 6, title: 'Shift 6: Endless Overtime', desc: 'Procedural anomalies and survival scoring.' },
  ];

  const handleStart = (shift: ShiftNumber) => {
    sound.init();
    sound.playUiClick();
    onStartShift(shift);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black select-none font-mono text-neutral-200">
      {/* Background Ambience: Night Store & Rain Visual */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black opacity-90" />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 30%, rgba(245, 158, 11, 0.15), transparent 60%)',
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl p-8 flex flex-col items-center text-center">
        {/* Neon Title */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-semibold tracking-widest uppercase mb-2">
            <Moon className="w-3.5 h-3.5" />
            K&M Mart Overnight Convenience Simulator
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-neutral-100 uppercase drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            ONE MORE SHIFT
          </h1>
          <p className="text-xs text-neutral-400 tracking-widest uppercase font-mono">
            Survival Horror & Convenience Store Management
          </p>
        </div>

        {/* View Router */}
        {view === 'main' && (
          <div className="w-full space-y-3">
            <button
              onClick={() => handleStart(savedShift || 1)}
              className="w-full py-3.5 px-6 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-sm tracking-wider uppercase rounded-lg shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              {savedShift > 1 ? `Continue Shift ${savedShift}` : 'Start New Shift'}
            </button>

            <button
              onClick={() => setView('shifts')}
              className="w-full py-3 px-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              Select Shift (1 - 6)
            </button>

            <button
              onClick={() => setView('handbook')}
              className="w-full py-3 px-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Employee Rulebook
            </button>

            <button
              onClick={() => setView('settings')}
              className="w-full py-3 px-6 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold tracking-wider uppercase rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              Settings & Audio
            </button>

            <div className="pt-4 text-[11px] text-neutral-500">
              * Recommended: Headphones on for 3D positional audio.
            </div>
          </div>
        )}

        {/* Shifts Selection View */}
        {view === 'shifts' && (
          <div className="w-full space-y-2.5">
            <div className="text-xs font-bold text-neutral-400 mb-3 border-b border-neutral-800 pb-2 flex items-center justify-between">
              <span>SELECT SHIFT ASSIGNMENT</span>
              <button
                onClick={() => setView('main')}
                className="text-amber-400 hover:underline"
              >
                Back [ESC]
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-left">
              {shiftsList.map((s) => (
                <div
                  key={s.num}
                  onClick={() => handleStart(s.num)}
                  className="p-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500 rounded-lg cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{s.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">
                      PLAY
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 font-sans mt-1">{s.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setView('main')}
              className="w-full mt-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
            >
              Return to Main Menu
            </button>
          </div>
        )}

        {/* Handbook View */}
        {view === 'handbook' && (
          <div className="w-full space-y-3 text-left">
            <div className="text-xs font-bold text-neutral-400 border-b border-neutral-800 pb-2 flex items-center justify-between">
              <span>K&M MART EMPLOYEE CODE OF CONDUCT</span>
              <button
                onClick={() => setView('main')}
                className="text-amber-400 hover:underline"
              >
                Back [ESC]
              </button>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg text-xs space-y-3 max-h-72 overflow-y-auto">
              <div className="text-amber-400 font-bold">1. TIMEKEEPING</div>
              <p className="text-neutral-300 font-sans leading-relaxed">
                Shifts run from 12:00 AM to 6:00 AM. You are strictly forbidden from leaving before the clock strikes 06:00 AM.
              </p>

              <div className="text-amber-400 font-bold">2. REGISTER ACCURACY</div>
              <p className="text-neutral-300 font-sans leading-relaxed">
                All merchandise must be scanned on the POS barcode reader before cash is tendered. Never accept money for items not found in inventory.
              </p>

              <div className="text-amber-400 font-bold">3. ENTRANCE SECURITY</div>
              <p className="text-neutral-300 font-sans leading-relaxed">
                At 2:00 AM sharp, turn the deadbolt on the sliding glass entrance doors. Customers attempting to enter after 2:00 AM may not be human.
              </p>

              <div className="text-amber-400 font-bold">4. THE MAN IN AISLE 6</div>
              <p className="text-neutral-300 font-sans leading-relaxed">
                If an individual is seen standing motionless facing the rear wall of Aisle 6, do not approach from behind.
              </p>
            </div>

            <button
              onClick={() => setView('main')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
            >
              Return to Main Menu
            </button>
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className="w-full space-y-4 text-left">
            <div className="text-xs font-bold text-neutral-400 border-b border-neutral-800 pb-2 flex items-center justify-between">
              <span>SETTINGS & AUDIO</span>
              <button
                onClick={() => setView('main')}
                className="text-amber-400 hover:underline"
              >
                Back [ESC]
              </button>
            </div>

            <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-neutral-200">Audio Engine:</div>
                  <div className="text-[10px] text-neutral-400">Procedural 3D Web Audio synthesizers</div>
                </div>
                <button
                  onClick={onToggleSound}
                  className={`px-3 py-1.5 rounded font-bold ${
                    soundEnabled
                      ? 'bg-emerald-700 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {soundEnabled ? 'ENABLED' : 'MUTED'}
                </button>
              </div>

              <div>
                <div className="flex justify-between font-bold text-neutral-200 mb-1">
                  <span>Mouse Look Sensitivity:</span>
                  <span className="text-amber-400">{sensitivity.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.2"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
                <div>• Controls: WASD to Move, Shift to Sprint, C to Crouch</div>
                <div>• E to Interact, F for Flashlight, P for Corporate Phone</div>
              </div>
            </div>

            <button
              onClick={() => setView('main')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
            >
              Save & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
