import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../audio/SoundManager';
import { Zap, CheckCircle2, AlertTriangle, ShieldCheck, X, ArrowLeft } from 'lucide-react';

interface WirePuzzleModalProps {
  isOpen?: boolean;
  isBlackout?: boolean;
  onComplete: () => void;
  onClose: () => void;
}

interface WireColor {
  id: string;
  name: string;
  color: string;
  glow: string;
}

const WIRE_COLORS: WireColor[] = [
  { id: 'red', name: 'PHASE A (RED)', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' },
  { id: 'blue', name: 'PHASE B (BLUE)', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.8)' },
  { id: 'yellow', name: 'PHASE C (YELLOW)', color: '#eab308', glow: 'rgba(234, 179, 8, 0.8)' },
  { id: 'green', name: 'GROUND (GREEN)', color: '#22c55e', glow: 'rgba(34, 197, 94, 0.8)' },
];

export const WirePuzzleModal: React.FC<WirePuzzleModalProps> = ({
  isOpen = true,
  isBlackout = false,
  onComplete,
  onClose,
}) => {
  // Cabinet door open animation state
  const [doorAngle, setDoorAngle] = useState(0); // 0 = closed, 1 = open

  // Wire puzzle states (when broken)
  const [rightColors, setRightColors] = useState<WireColor[]>([]);
  const [connections, setConnections] = useState<Record<string, string>>({}); // leftColorId -> rightColorId
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sparkFlicker, setSparkFlicker] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPinsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const rightPinsRef = useRef<Record<string, HTMLDivElement | null>>({});

  // Reset and play open animation when modal opens
  useEffect(() => {
    if (isOpen) {
      setDoorAngle(0);
      const timer = setTimeout(() => {
        setDoorAngle(1);
        sound.playRegisterDrawer(); // Heavy metallic latch sound
      }, 50);

      if (isBlackout) {
        // Broken: shuffle right-side terminal order
        const shuffled = [...WIRE_COLORS].sort(() => Math.random() - 0.5);
        setRightColors(shuffled);
        setConnections({});
        setSelectedLeft(null);
        setIsCompleted(false);
      } else {
        // Normal working: All wires already connected 1:1
        const intact: Record<string, string> = {};
        WIRE_COLORS.forEach((w) => {
          intact[w.id] = w.id;
        });
        setRightColors([...WIRE_COLORS]);
        setConnections(intact);
        setSelectedLeft(null);
        setIsCompleted(true);
      }

      return () => clearTimeout(timer);
    }
  }, [isOpen, isBlackout]);

  // Periodic spark flicker when broken
  useEffect(() => {
    if (!isOpen || !isBlackout || isCompleted) return;
    const interval = setInterval(() => {
      setSparkFlicker((prev) => !prev);
      if (Math.random() > 0.6) {
        sound.playElectricalSparks();
      }
    }, 700);
    return () => clearInterval(interval);
  }, [isOpen, isBlackout, isCompleted]);

  // Keyboard handler: ESC or E closes/steps away
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || (e.code === 'KeyE' && !selectedLeft)) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedLeft, onClose]);

  // Handle clicking left terminal
  const handleLeftClick = (colorId: string) => {
    if (!isBlackout || isCompleted) return;
    sound.playUiClick();
    setSelectedLeft(colorId);
  };

  // Handle clicking right terminal
  const handleRightClick = (colorId: string) => {
    if (!isBlackout || !selectedLeft || isCompleted) return;

    if (selectedLeft === colorId) {
      // Correct matching wire!
      sound.playRegisterDrawer();
      const updated = { ...connections, [selectedLeft]: colorId };
      setConnections(updated);
      setSelectedLeft(null);

      // Check if all 4 are connected
      if (Object.keys(updated).length === WIRE_COLORS.length) {
        setIsCompleted(true);
        sound.playBreakerTrip();
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    } else {
      // Wrong terminal! Buzz + spark
      sound.playBuzzSound();
      sound.playElectricalSparks();
      setSelectedLeft(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none font-mono">
      {/* 3D-styled Electrical Cabinet Container */}
      <div
        className="relative w-full max-w-2xl bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 border-4 rounded-xl shadow-2xl p-6 text-neutral-100 overflow-hidden transition-all duration-500"
        style={{
          borderColor: isBlackout ? (isCompleted ? '#10b981' : '#f59e0b') : '#3b82f6',
          boxShadow: isBlackout
            ? isCompleted
              ? '0 0 35px rgba(16, 185, 129, 0.4)'
              : '0 0 35px rgba(245, 158, 11, 0.3)'
            : '0 0 25px rgba(59, 130, 246, 0.25)',
        }}
      >
        {/* Metal Door Panel Swing Effect (Simulated 3D cabinet door opening) */}
        <div
          className="absolute inset-0 bg-neutral-900 pointer-events-none transition-transform duration-700 ease-out origin-left z-30 border-r-4 border-neutral-700 shadow-2xl flex items-center justify-center"
          style={{
            transform: doorAngle === 1 ? 'perspective(1200px) rotateY(-105deg)' : 'none',
            opacity: doorAngle === 1 ? 0.05 : 0.98,
          }}
        >
          <div className="text-center p-8">
            <Zap className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-black tracking-widest text-neutral-200">
              HIGH VOLTAGE 480V 3-PHASE BREAKER
            </h2>
            <p className="text-sm text-neutral-500 mt-2">Opening industrial cabinet...</p>
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            {isBlackout ? (
              <Zap
                className={`w-6 h-6 ${
                  isCompleted ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
                }`}
              />
            ) : (
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            )}
            <div>
              <span
                className={`font-black text-sm tracking-wider ${
                  isBlackout
                    ? isCompleted
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                    : 'text-blue-400'
                }`}
              >
                {isBlackout
                  ? 'ELECTRICAL BREAKER PANEL — FIX DAMAGED WIRING'
                  : 'ELECTRICAL BREAKER PANEL — SYSTEM INSPECTION'}
              </span>
              <p className="text-[11px] text-neutral-400">
                {isBlackout
                  ? 'Main store circuit tripped. Reconnect damaged color terminals to restore electricity.'
                  : 'Power grid normal (480V AC 3-Phase). All breaker lines intact and properly connected.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer border border-neutral-700"
            title="Close Panel [ESC]"
          >
            <X className="w-4 h-4" />
            <span className="text-xs font-bold">Close [ESC]</span>
          </button>
        </div>

        {/* Panel Work Area */}
        <div
          ref={containerRef}
          className="relative bg-neutral-950 border-2 border-neutral-800 rounded-lg p-6 min-h-[310px] flex justify-between items-center shadow-inner overflow-hidden"
        >
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Sparks overlay when broken */}
          {isBlackout && !isCompleted && sparkFlicker && (
            <div className="absolute inset-0 pointer-events-none bg-amber-400/5 mix-blend-screen">
              <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-amber-300 rounded-full blur-xs animate-ping" />
              <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-300 rounded-full blur-xs animate-ping" />
            </div>
          )}

          {/* Left Cut/Feed Terminals */}
          <div className="flex flex-col justify-around h-full space-y-6 z-10">
            {WIRE_COLORS.map((w) => {
              const isConnected = !!connections[w.id];
              const isSelected = selectedLeft === w.id;
              return (
                <div
                  key={w.id}
                  onClick={() => !isConnected && handleLeftClick(w.id)}
                  className={`flex items-center space-x-3 group ${
                    isBlackout && !isConnected
                      ? 'cursor-pointer'
                      : 'cursor-default'
                  } ${isConnected ? 'opacity-90' : ''}`}
                >
                  <div
                    ref={(el) => {
                      leftPinsRef.current[w.id] = el;
                    }}
                    className="w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
                    style={{
                      backgroundColor: w.color,
                      borderColor: isSelected ? '#ffffff' : w.color,
                      boxShadow: isSelected
                        ? `0 0 16px ${w.glow}`
                        : isConnected
                        ? `0 0 8px ${w.glow}`
                        : undefined,
                    }}
                  />
                  <div
                    className="h-2.5 w-16 rounded-r shadow-sm transition-all"
                    style={{
                      backgroundColor: w.color,
                      boxShadow: `0 0 6px ${w.glow}`,
                    }}
                  />
                  <span
                    className={`text-xs font-bold tracking-wider transition-colors ${
                      isSelected
                        ? 'text-white underline'
                        : isConnected
                        ? 'text-neutral-300'
                        : 'text-neutral-400 group-hover:text-neutral-200'
                    }`}
                  >
                    {w.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Connected Wire SVG Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {Object.entries(connections).map(([leftId, rightId]) => {
              const leftEl = leftPinsRef.current[leftId];
              const rightEl = rightPinsRef.current[rightId];
              const cont = containerRef.current;
              if (!leftEl || !rightEl || !cont) return null;

              const cRect = cont.getBoundingClientRect();
              const lRect = leftEl.getBoundingClientRect();
              const rRect = rightEl.getBoundingClientRect();

              const x1 = lRect.right - cRect.left + 64;
              const y1 = lRect.top + lRect.height / 2 - cRect.top;
              const x2 = rRect.left - cRect.left - 64;
              const y2 = rRect.top + rRect.height / 2 - cRect.top;

              const color = WIRE_COLORS.find((w) => w.id === leftId)?.color || '#fff';

              return (
                <path
                  key={`${leftId}-${rightId}`}
                  d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 10px ${color})` }}
                />
              );
            })}
          </svg>

          {/* Right Matching Terminals */}
          <div className="flex flex-col justify-around h-full space-y-6 z-10">
            {rightColors.map((w) => {
              const isConnected = Object.values(connections).includes(w.id);
              return (
                <div
                  key={w.id}
                  onClick={() => !isConnected && handleRightClick(w.id)}
                  className={`flex items-center space-x-3 justify-end group ${
                    isBlackout && selectedLeft && !isConnected
                      ? 'cursor-pointer'
                      : 'cursor-default'
                  } ${isConnected ? 'opacity-90' : ''}`}
                >
                  <span className="text-xs font-bold tracking-wider text-neutral-400 group-hover:text-neutral-200 transition-colors">
                    {w.name}
                  </span>
                  <div
                    className="h-2.5 w-16 rounded-l shadow-sm"
                    style={{
                      backgroundColor: w.color,
                      boxShadow: `0 0 6px ${w.glow}`,
                    }}
                  />
                  <div
                    ref={(el) => {
                      rightPinsRef.current[w.id] = el;
                    }}
                    className="w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center"
                    style={{
                      backgroundColor: w.color,
                      borderColor: isConnected ? '#22c55e' : w.color,
                      boxShadow: isConnected ? '0 0 14px #22c55e' : undefined,
                    }}
                  >
                    {isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info & interactive action buttons */}
        <div className="mt-5 flex items-center justify-between text-xs pt-3 border-t border-neutral-800">
          <div className="text-neutral-300">
            {!isBlackout ? (
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>ALL 4 CONDUIT LINES SECURE — NO DEFECTS FOUND</span>
              </div>
            ) : isCompleted ? (
              <div className="flex items-center space-x-2 text-emerald-400 font-black tracking-wider text-sm animate-pulse">
                <Zap className="w-4 h-4" />
                <span>CIRCUIT RESTORED! POWER RE-ENGAGING...</span>
              </div>
            ) : selectedLeft ? (
              <div className="text-amber-300 font-bold animate-pulse">
                &gt; Now click matching terminal for: {selectedLeft.toUpperCase()}
              </div>
            ) : (
              <div className="text-neutral-400">
                Click a wire terminal on the left, then connect to matching color on the right.
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold transition-all border border-neutral-600 hover:border-neutral-500 shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Step Away / Close Cabinet [ESC or E]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
