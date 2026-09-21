import React, { useState, useEffect } from 'react';
import { sound } from '../audio/SoundManager';
import { Camera, Radio, Eye, AlertOctagon, X, RefreshCw } from 'lucide-react';

interface CCTVMonitorProps {
  onClose: () => void;
  watcherLocation: 'none' | 'parking' | 'aisle6' | 'backroom' | 'window';
  aisle6Active: boolean;
  onWatcherSpotted?: () => void;
}

interface CameraChannel {
  id: number;
  name: string;
  code: string;
  locationKey: 'register' | 'aisle1' | 'aisle6' | 'backroom' | 'parking' | 'coolers';
}

const CAMERAS: CameraChannel[] = [
  { id: 1, name: 'CAM 01 — FRONT CHECKOUT', code: 'CAM-01', locationKey: 'register' },
  { id: 2, name: 'CAM 02 — AISLE 1 & 2 (SNACKS)', code: 'CAM-02', locationKey: 'aisle1' },
  { id: 3, name: 'CAM 03 — AISLE 6 (BLIND SPOT)', code: 'CAM-03', locationKey: 'aisle6' },
  { id: 4, name: 'CAM 04 — STORAGE & BREAKERS', code: 'CAM-04', locationKey: 'backroom' },
  { id: 5, name: 'CAM 05 — PARKING LOT & GLASS', code: 'CAM-05', locationKey: 'parking' },
  { id: 6, name: 'CAM 06 — DRINK COOLERS', code: 'CAM-06', locationKey: 'coolers' },
];

export const CCTVMonitor: React.FC<CCTVMonitorProps> = ({
  onClose,
  watcherLocation,
  aisle6Active,
  onWatcherSpotted,
}) => {
  const [currentCam, setCurrentCam] = useState<number>(1);
  const [isStaticGlitch, setIsStaticGlitch] = useState<boolean>(false);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      setTimestamp(`1998-11-14 ${timeStr} EST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchCam = (camId: number) => {
    if (camId === currentCam) return;
    sound.playCctvSwitch();
    setIsStaticGlitch(true);
    setCurrentCam(camId);
    setTimeout(() => {
      setIsStaticGlitch(false);
    }, 180);
  };

  const activeChannel = CAMERAS.find((c) => c.id === currentCam)!;

  // Check if an anomaly is visible on current feed
  const hasWatcherHere =
    (activeChannel.locationKey === 'parking' && (watcherLocation === 'parking' || watcherLocation === 'window')) ||
    (activeChannel.locationKey === 'aisle6' && watcherLocation === 'aisle6') ||
    (activeChannel.locationKey === 'backroom' && watcherLocation === 'backroom');

  const hasAisle6ManHere = activeChannel.locationKey === 'aisle6' && aisle6Active;

  useEffect(() => {
    if (hasWatcherHere && onWatcherSpotted) {
      onWatcherSpotted();
    }
  }, [hasWatcherHere, onWatcherSpotted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 select-none font-mono">
      <div className="w-full max-w-4xl bg-neutral-950 border-4 border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
        {/* CRT Bezel Frame Header */}
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-neutral-300">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-emerald-400">SURVEILLANCE TERMINAL — K&M MART SEC-SYS 4.2</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsNightVision(!isNightVision)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                isNightVision
                  ? 'bg-emerald-800 border-emerald-500 text-emerald-100'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              IR Mode {isNightVision ? '[ON]' : '[OFF]'}
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs rounded flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Exit Monitor [ESC]
            </button>
          </div>
        </div>

        {/* CRT Screen Display */}
        <div
          className={`relative w-full h-[460px] bg-neutral-900 overflow-hidden flex items-center justify-center ${
            isNightVision ? 'filter brightness-110 contrast-125 saturate-150 hue-rotate-60' : ''
          }`}
        >
          {/* Scanlines and screen curvature overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-20 opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1px, transparent 1px, transparent 2px)',
            }}
          />

          {/* CRT Flicker Vignette */}
          <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_100px_rgba(0,0,0,0.85)]" />

          {/* Static Switch Noise */}
          {isStaticGlitch && (
            <div className="absolute inset-0 bg-white/20 z-30 flex items-center justify-center backdrop-invert animate-pulse">
              <div className="text-white text-xl font-bold tracking-widest">FEED RE-SYNCING...</div>
            </div>
          )}

          {/* Camera Visual Scene Simulation */}
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-black flex items-center justify-center">
            {/* Background perspective of current feed */}
            {activeChannel.locationKey === 'register' && (
              <div className="w-full h-full relative flex items-center justify-center opacity-80">
                <div className="w-64 h-32 border border-neutral-700 bg-neutral-950/60 rounded flex items-center justify-center text-xs text-neutral-500">
                  [ CHECKOUT COUNTER & EMPTY BELT ]
                </div>
              </div>
            )}

            {activeChannel.locationKey === 'aisle1' && (
              <div className="w-full h-full relative flex items-center justify-center opacity-80">
                <div className="w-80 h-64 border-x-2 border-neutral-700 flex justify-between p-4 text-xs text-neutral-600">
                  <div>[ SHELF: CHIPS ]</div>
                  <div>[ SHELF: CANDY ]</div>
                </div>
              </div>
            )}

            {activeChannel.locationKey === 'aisle6' && (
              <div className="w-full h-full relative flex items-center justify-center">
                <div className="w-80 h-72 border-x-2 border-neutral-800 flex flex-col justify-end items-center pb-8">
                  {hasAisle6ManHere && (
                    <div className="flex flex-col items-center animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-neutral-600 mb-1" />
                      <div className="w-14 h-24 bg-neutral-800 rounded" />
                      <div className="text-[10px] text-red-400 font-bold mt-2">
                        [ SUBJECT DETECTED: FACING WALL - DO NOT APPROACH ]
                      </div>
                    </div>
                  )}
                  {hasWatcherHere && !hasAisle6ManHere && (
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-black border border-white/40 mb-1" />
                      <div className="w-10 h-32 bg-black rounded" />
                      <div className="text-[10px] text-red-500 font-bold mt-2 animate-pulse">
                        [ ENTITY DETECTED: THE WATCHER ]
                      </div>
                    </div>
                  )}
                  {!hasAisle6ManHere && !hasWatcherHere && (
                    <div className="text-xs text-neutral-600 italic">[ AISLE 6 EMPTY — DIM ILLUMINATION ]</div>
                  )}
                </div>
              </div>
            )}

            {activeChannel.locationKey === 'backroom' && (
              <div className="w-full h-full relative flex items-center justify-center">
                <div className="w-72 h-48 border border-neutral-800 p-4 flex flex-col justify-between text-xs text-neutral-500">
                  <div className="flex justify-between">
                    <span>[ ELECTRICAL BREAKER PANEL ]</span>
                    <span>[ RED PHONE DESK ]</span>
                  </div>
                  {hasWatcherHere && (
                    <div className="self-center flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-black mb-1" />
                      <div className="w-12 h-28 bg-black rounded" />
                      <div className="text-[10px] text-red-500 font-bold mt-1 animate-pulse">
                        [ UNKNOWN PRESENCE IN STORAGE ]
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeChannel.locationKey === 'parking' && (
              <div className="w-full h-full relative flex items-center justify-center">
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-neutral-500 relative">
                  <div className="text-center mb-4">[ PARKING LOT — RAIN FALLING ]</div>
                  {hasWatcherHere && (
                    <div className="flex flex-col items-center animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-black shadow-[0_0_10px_rgba(255,255,255,0.4)] mb-1" />
                      <div className="w-14 h-36 bg-black" />
                      <div className="text-[11px] text-red-500 font-bold mt-3 uppercase tracking-wider bg-black/80 px-2 py-1 border border-red-800">
                        WARNING: ENTITY STARING INTO LENS
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeChannel.locationKey === 'coolers' && (
              <div className="w-full h-full relative flex items-center justify-center opacity-80">
                <div className="w-80 h-48 border border-cyan-900/60 flex items-center justify-center text-xs text-cyan-500">
                  [ 5 REFRIGERATED GLASS DOORS — CONDENSATION DETECTED ]
                </div>
              </div>
            )}
          </div>

          {/* OSD (On-Screen Display) */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 text-emerald-400 text-xs font-bold tracking-wider">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-red-500">● REC</span>
            <span className="text-neutral-400">|</span>
            <span>{activeChannel.code}</span>
            <span className="text-neutral-400">|</span>
            <span className="text-emerald-300">{activeChannel.name}</span>
          </div>

          <div className="absolute top-4 right-4 z-20 text-emerald-400 text-xs tracking-wider">
            {timestamp}
          </div>

          <div className="absolute bottom-4 left-4 z-20 text-xs text-neutral-400 flex items-center gap-2">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
            <span>INTERFERENCE: NORMAL</span>
          </div>
        </div>

        {/* Camera Selector Buttons */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {CAMERAS.map((cam) => (
              <button
                key={cam.id}
                onClick={() => handleSwitchCam(cam.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                  currentCam === cam.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                CAM {cam.id}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSwitchCam(currentCam)}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded border border-neutral-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-Sync Feed
          </button>
        </div>
      </div>
    </div>
  );
};
