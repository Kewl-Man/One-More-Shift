import React from 'react';
import { ShiftNumber } from '../types';
import { sound } from '../audio/SoundManager';
import { Award, ArrowRight, DollarSign, CheckCircle, ShieldAlert } from 'lucide-react';

interface ShiftSummaryModalProps {
  shiftNumber: ShiftNumber;
  totalEarnings: number;
  anomaliesSurvived: number;
  tasksCompleted: number;
  totalTasks: number;
  onNextShift: () => void;
  onMainMenu: () => void;
}

export const ShiftSummaryModal: React.FC<ShiftSummaryModalProps> = ({
  shiftNumber,
  totalEarnings,
  anomaliesSurvived,
  tasksCompleted,
  totalTasks,
  onNextShift,
  onMainMenu,
}) => {
  const basePay = 85.0;
  const taskBonus = tasksCompleted * 10.0;
  const hazardPay = anomaliesSurvived * 15.0;
  const corporateDeductions = 14.5;
  const netPay = basePay + taskBonus + hazardPay - corporateDeductions;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none font-mono text-neutral-200">
      <div className="w-full max-w-md bg-neutral-950 border-2 border-amber-600/70 rounded-xl shadow-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
          <Award className="w-6 h-6" />
        </div>

        <div>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-800/60">
            Shift {shiftNumber} Complete
          </span>
          <h2 className="text-xl font-bold text-neutral-100 mt-2">SHIFT PERFORMANCE PAYSTUB</h2>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            You survived until 06:00 AM. Morning sunlight breaks through the glass.
          </p>
        </div>

        {/* Breakdown */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs space-y-2 text-left">
          <div className="flex justify-between text-neutral-300">
            <span>BASE OVERNIGHT WAGE (6 HRS):</span>
            <span className="font-bold">${basePay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>TASK COMPLETION BONUS ({tasksCompleted}/{totalTasks}):</span>
            <span className="text-emerald-400 font-bold">+${taskBonus.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-neutral-300">
            <span>PARANORMAL HAZARD STIPEND:</span>
            <span className="text-emerald-400 font-bold">+${hazardPay.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-red-400">
            <span>UNEXPLAINED PROPERTY WEAR:</span>
            <span>-${corporateDeductions.toFixed(2)}</span>
          </div>

          <div className="border-t border-neutral-800 pt-2 flex justify-between text-sm font-bold text-amber-400">
            <span>NET DISBURSED:</span>
            <span>${netPay.toFixed(2)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          {shiftNumber < 5 ? (
            <button
              onClick={() => {
                sound.playUiClick();
                onNextShift();
              }}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>Clock In for Shift {shiftNumber + 1}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playUiClick();
                onNextShift();
              }}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>Clock In for Overtime (Shift 6)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onMainMenu}
            className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-400 transition-colors"
          >
            Clock Out / Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
