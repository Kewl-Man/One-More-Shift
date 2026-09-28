import React, { useEffect, useState } from 'react';
import { PhoneTutorialStep } from '../types';
import { sound } from '../audio/SoundManager';
import { PhoneCall, Radio, Volume2, CheckCircle } from 'lucide-react';

interface PhoneHUDProps {
  isRinging: boolean;
  isOnCall: boolean;
  speakerName?: string;
  speechText?: string;
  tutorialStep: PhoneTutorialStep;
  activeObjective?: string;
  onPickUp?: () => void;
  onHangup?: () => void;
}

export const PhoneHUD: React.FC<PhoneHUDProps> = ({
  isRinging,
  isOnCall,
  speakerName = 'STEVE (OVERNIGHT DISPATCH)',
  speechText,
  tutorialStep,
  activeObjective,
  onPickUp,
  onHangup,
}) => {
  const [displayedText, setDisplayedText] = useState('');

  // Typewriter effect & procedural vocal chatter
  useEffect(() => {
    if (!speechText || !isOnCall) {
      setDisplayedText('');
      return;
    }

    setDisplayedText('');
    sound.playPhoneVoiceChatter(5);

    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += 2;
      setDisplayedText(speechText.slice(0, charIndex));
      if (charIndex % 12 === 0) {
        sound.playPhoneVoiceChatter(2);
      }
      if (charIndex >= speechText.length) {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [speechText, isOnCall]);

  return (
    <>
      {/* 1. DISTINCTIVE "PICK UP THE PHONE" INTERACTIVE BANNER */}
      {isRinging && !isOnCall && (
        <div
          onClick={() => {
            sound.playUiClick();
            onPickUp?.();
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer animate-bounce"
        >
          <div className="flex items-center space-x-3 px-6 py-3.5 bg-red-950/95 hover:bg-red-900 border-2 border-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] backdrop-blur-md transition-all">
            <div className="relative">
              <PhoneCall className="w-6 h-6 text-red-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] tracking-widest text-red-300 font-bold uppercase">
                INCOMING CALL • WALL TELEPHONE
              </span>
              <span className="font-mono text-xs tracking-wider text-white font-black uppercase">
                CLICK OR PRESS [E] TO PICK UP
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. DISPATCH RADIO SUBTITLE BANNER AT TOP OF SCREEN (Leaves bottom open for customer dialogue!) */}
      {isOnCall && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-auto">
          <div className="bg-neutral-950/95 border-2 border-amber-600/70 rounded-xl p-3.5 shadow-2xl backdrop-blur-md font-mono text-neutral-200">
            {/* Header / Dispatch Status */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-amber-900/50">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold text-amber-400 tracking-wider">
                  {speakerName}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-amber-400/90 bg-amber-950/70 px-2 py-0.5 rounded border border-amber-800/60">
                  ANALOG DISPATCH 4.8kHz
                </span>
                {tutorialStep === 'completed' && onHangup && (
                  <button
                    onClick={onHangup}
                    className="text-xs text-neutral-300 hover:text-white px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors cursor-pointer"
                  >
                    Hang Up [H]
                  </button>
                )}
              </div>
            </div>

            {/* Spoken Text */}
            <div className="text-sm text-amber-100 leading-relaxed min-h-[38px]">
              "{displayedText || speechText}"
            </div>

            {/* Current In-World Action Objective */}
            {activeObjective && (
              <div className="mt-2.5 pt-1.5 border-t border-neutral-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>OBJECTIVE: {activeObjective}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
