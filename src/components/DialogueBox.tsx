import React, { useState, useEffect } from 'react';
import { DialogueNode, DialogueChoice } from '../types';
import { sound } from '../audio/SoundManager';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface DialogueBoxProps {
  dialogueNode: DialogueNode | null;
  onSelectChoice: (choice: DialogueChoice) => void;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  dialogueNode,
  onSelectChoice,
  onClose,
}) => {
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  useEffect(() => {
    if (!dialogueNode) {
      setDisplayedText('');
      return;
    }

    const fullText = dialogueNode.text;
    let currentIdx = 0;
    setDisplayedText('');
    setIsTyping(true);

    const timer = setInterval(() => {
      currentIdx++;
      setDisplayedText(fullText.slice(0, currentIdx));
      sound.playTypewriterKey(dialogueNode.voiceType || 'normal');

      if (currentIdx >= fullText.length) {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [dialogueNode]);

  if (!dialogueNode) return null;

  const handleSkipTyping = () => {
    if (isTyping) {
      setDisplayedText(dialogueNode.text);
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl z-40 px-4 font-mono select-none">
      <div
        onClick={handleSkipTyping}
        className="bg-neutral-950/95 border-2 border-neutral-700/80 rounded-xl p-5 shadow-2xl backdrop-blur-md cursor-pointer"
      >
        {/* Speaker Name Tag */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-500" />
            <span className="text-amber-400 font-bold text-sm tracking-wider uppercase">
              {dialogueNode.speaker}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500">
            {isTyping ? '[Click to skip typing]' : '[Choose a response]'}
          </span>
        </div>

        {/* Dialogue Text */}
        <div className="text-neutral-100 text-sm leading-relaxed mb-4 min-h-12 font-sans">
          {displayedText}
          {isTyping && <span className="inline-block w-2 h-4 bg-amber-500 ml-1 animate-pulse" />}
        </div>

        {/* Choices */}
        {!isTyping && (
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            {dialogueNode.choices && dialogueNode.choices.length > 0 ? (
              dialogueNode.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playUiClick();
                    onSelectChoice(choice);
                  }}
                  className="w-full text-left p-2.5 rounded bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500 text-xs text-neutral-200 transition-all flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">[{idx + 1}]</span>
                    <span>{choice.text}</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-amber-400 transition-colors" />
                </button>
              ))
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs text-center transition-colors"
              >
                [ Continue ]
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
