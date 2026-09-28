import React, { useEffect } from 'react';
import { CustomerData, CustomerProduct } from '../types';
import { sound } from '../audio/SoundManager';
import { CheckCircle2, ShieldAlert, DollarSign, XCircle, MessageSquare } from 'lucide-react';

interface CheckoutPanelProps {
  customer: CustomerData | null;
  scannedProducts: CustomerProduct[];
  activeDialogueChoice: { playerText: string; customerReply: string } | null;
  onSelectDialogue: (choice: { playerText: string; customerReply: string }) => void;
  onPay: () => void;
  onRefuse: () => void;
  onClose: () => void;
}

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({
  customer,
  scannedProducts,
  activeDialogueChoice,
  onSelectDialogue,
  onPay,
  onRefuse,
  onClose,
}) => {
  // Listen for keyboard 1, 2, 3 to trigger dialogue responses!
  useEffect(() => {
    if (!customer?.dialogueChoices || activeDialogueChoice) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      let index = -1;
      if (e.code === 'Digit1' || e.code === 'Numpad1' || e.key === '1') index = 0;
      else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.key === '2') index = 1;
      else if (e.code === 'Digit3' || e.code === 'Numpad3' || e.key === '3') index = 2;

      if (customer?.dialogueChoices && index >= 0 && index < customer.dialogueChoices.length) {
        e.preventDefault();
        sound.playUiClick();
        onSelectDialogue(customer.dialogueChoices[index]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [customer, activeDialogueChoice, onSelectDialogue]);

  if (!customer) return null;

  // NO TAX! Total equals subtotal exactly.
  const total = scannedProducts.reduce((sum, item) => sum + item.price, 0);
  const allScanned = customer.products.length === 0 || customer.products.length === scannedProducts.length;

  return (
    <>
      {/* 1. COMPACT SIDE TRANSACTION PANEL (Right side of screen, non-intrusive) */}
      <div className="fixed top-20 right-6 z-40 w-80 bg-neutral-950/90 border border-emerald-800/60 rounded-lg shadow-2xl p-4 font-mono text-neutral-200 backdrop-blur-sm pointer-events-auto">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/60 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 tracking-wider">POS #01 // REGISTER</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 text-xs px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Customer Name */}
        <div className="text-xs text-neutral-400 mb-1">CUSTOMER AT COUNTER:</div>
        <div className="text-sm font-bold text-neutral-100 mb-3 pb-2 border-b border-neutral-800">
          {customer.name}
          {customer.isWearingRed && (
            <span className="ml-2 text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-semibold uppercase">
              Wearing Red
            </span>
          )}
        </div>

        {/* Scanned Items List */}
        <div className="text-[11px] text-neutral-400 uppercase font-semibold mb-1">Scanned Products:</div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mb-3">
          {scannedProducts.length === 0 ? (
            <div className="text-xs text-neutral-500 italic p-3 bg-neutral-900/40 rounded border border-neutral-800/60 text-center">
              Look at counter items & press [E] to scan.
            </div>
          ) : (
            scannedProducts.map((item, idx) => (
              <div
                key={`${item.id}_${idx}`}
                className="flex items-center justify-between text-xs p-1.5 bg-neutral-900/70 border border-emerald-900/40 rounded"
              >
                <div className="flex items-center space-x-2 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate text-neutral-200">{item.name}</span>
                </div>
                <span className="font-semibold text-emerald-300 ml-2">${item.price.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        {/* Unscanned alert if items remain */}
        {customer.products.length > scannedProducts.length && (
          <div className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-800/40 p-1.5 rounded mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span>{customer.products.length - scannedProducts.length} item(s) waiting on counter belt.</span>
          </div>
        )}

        {/* Total Display (NO TAX!) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded p-2.5 mb-3">
          <div className="flex justify-between text-xs text-neutral-400 mb-1">
            <span>Subtotal:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-emerald-400 pt-1 border-t border-neutral-800">
            <span>TOTAL (NO TAX):</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Primary Action Buttons: PAY & REFUSE */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              sound.playRegisterDrawer();
              onPay();
            }}
            disabled={!allScanned}
            className={`py-2 px-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              allScanned
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50 cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            PAY
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onRefuse();
            }}
            className="py-2 px-3 bg-red-950/70 hover:bg-red-900 border border-red-700/60 hover:border-red-500 text-red-200 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            REFUSE
          </button>
        </div>
      </div>

      {/* 2. CINEMATIC DIALOGUE SUBTITLES AT BOTTOM OF SCREEN (Keeps 3D world visible!) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 pointer-events-auto">
        <div className="bg-neutral-950/92 border border-neutral-700/70 rounded-lg p-4 shadow-2xl backdrop-blur-md font-mono text-neutral-200">
          {/* Speaker label */}
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-neutral-800">
            <span className="text-xs font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              {customer.name.toUpperCase()}
            </span>
          </div>

          {/* Dialogue line */}
          <div className="text-sm text-neutral-100 leading-relaxed mb-3">
            "{activeDialogueChoice ? activeDialogueChoice.customerReply : customer.greeting}"
          </div>

          {/* Interactive Dialogue Choices */}
          {customer.dialogueChoices && customer.dialogueChoices.length > 0 && !activeDialogueChoice && (
            <div className="space-y-1.5 pt-2 border-t border-neutral-800/80">
              <div className="text-[11px] text-neutral-400 uppercase font-semibold">Respond to Customer:</div>
              <div className="grid grid-cols-1 gap-1.5">
                {customer.dialogueChoices.map((choice, i) => (
                  <button
                    key={i}
                    onClick={() => onSelectDialogue(choice)}
                    className="text-left text-xs p-2 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 hover:border-emerald-500 text-neutral-300 hover:text-emerald-300 transition-colors flex items-center gap-2"
                  >
                    <span className="text-neutral-500 font-bold">[{i + 1}]</span>
                    <span>"{choice.playerText}"</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
