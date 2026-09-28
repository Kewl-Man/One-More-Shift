import React, { useState, useEffect } from 'react';
import { CCTVCameraDef } from '../game/StoreWorld';
import { sound } from '../audio/SoundManager';
import { Video, Shield, AlertTriangle, Monitor, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CCTVMonitorProps {
  cctvDefs: CCTVCameraDef[];
  activeCamIndex: number;
  onSelectCam: (index: number) => void;
  onClose: () => void;
  isGlitching: boolean;
  gameMinutes: number;
}

export const CCTVMonitor: React.FC<CCTVMonitorProps> = ({
  cctvDefs,
  activeCamIndex,
  onSelectCam,
  onClose,
  isGlitching,
  gameMinutes,
}) => {
  const currentCam = cctvDefs[activeCamIndex] || cctvDefs[0];

  // Calculate 1998 analog timestamp
  const hour = Math.floor(gameMinutes / 60);
  const min = Math.floor(gameMinutes % 60);
  const sec = Math.floor((gameMinutes * 60) % 60);
  const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')} AM`;

  const handlePrev = () => {
    sound.playCctvSwitch();
    const nextIdx = (activeCamIndex - 1 + cctvDefs.length) % cctvDefs.length;
    onSelectCam(nextIdx);
  };

  const handleNext = () => {
    sound.playCctvSwitch();
    const nextIdx = (activeCamIndex + 1) % cctvDefs.length;
    onSelectCam(nextIdx);
  };

  const handleSelect = (idx: number) => {
    sound.playCctvSwitch();
    onSelectCam(idx);
  };

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-6">
      {/* 1. CRT SCANLINES & VIGNETTE OVERLAY (Applied across viewport) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-60" />
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.85)] pointer-events-none" />

      {/* Dynamic Horror Static Glitch Overlay */}
      {isGlitching && (
        <div className="absolute inset-0 bg-white/10 mix-blend-difference pointer-events-none animate-pulse">
          <div className="w-full h-8 bg-black/40 my-12 blur-xs animate-bounce" />
          <div className="w-full h-14 bg-black/50 my-24 blur-xs" />
        </div>
      )}

      {/* 2. TOP OSD BAR */}
      <div className="relative z-10 flex items-center justify-between text-neutral-200 font-mono pointer-events-auto bg-neutral-950/70 p-3 rounded-lg border border-neutral-800/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-red-400">REC</span>
          </div>
          <span className="text-neutral-500">|</span>
          <span className="text-xs tracking-wider text-emerald-400 font-bold">
            {currentCam.name} // {currentCam.locationName}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-xs text-neutral-400 tracking-widest">
            NOV-14-1998 • {timeString}
          </div>
          <button
            onClick={onClose}
            className="flex items-center space-x-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs rounded border border-neutral-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit CCTV [ESC]</span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM CAMERA SELECTOR CONTROLS */}
      <div className="relative z-10 flex items-center justify-center space-x-3 pointer-events-auto">
        <div className="bg-neutral-950/90 border border-neutral-800 p-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center space-x-2 font-mono">
          <button
            onClick={handlePrev}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 transition-colors"
            title="Previous Camera"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1.5 px-2">
            {cctvDefs.map((cam, idx) => {
              const isActive = idx === activeCamIndex;
              return (
                <button
                  key={cam.id}
                  onClick={() => handleSelect(idx)}
                  className={`px-3 py-1.5 text-xs font-bold rounded transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-emerald-950/80 border-2 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-neutral-900/90 border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{cam.name}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300 transition-colors"
            title="Next Camera"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
