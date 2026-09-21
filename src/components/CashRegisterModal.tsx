import React, { useState } from 'react';
import { CustomerData, CustomerProduct } from '../types';
import { sound } from '../audio/SoundManager';
import { Barcode, CheckCircle2, DollarSign, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';

interface CashRegisterModalProps {
  customer: CustomerData | null;
  onCompleteSale: (total: number) => void;
  onRefuseService: () => void;
  onStartDialogue: () => void;
  onClose: () => void;
}

export const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
  customer,
  onCompleteSale,
  onRefuseService,
  onStartDialogue,
  onClose,
}) => {
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [tendered, setTendered] = useState<string>('');

  if (!customer) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg p-6 shadow-2xl text-center">
          <div className="text-xl font-mono text-amber-400 mb-2">REGISTER IDLE</div>
          <p className="text-sm text-neutral-400 mb-6 font-mono">No customers currently at counter. Wait for customer arrival or ring service bell.</p>
          <button
            onClick={() => {
              sound.playServiceBell();
            }}
            className="w-full py-3 px-4 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/60 rounded text-amber-200 font-mono text-sm tracking-wider uppercase mb-3 transition-colors"
          >
            [ Ring Service Bell ]
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-sm rounded transition-colors"
          >
            Step Away [ESC]
          </button>
        </div>
      </div>
    );
  }

  const allScanned = customer.products.length === 0 || customer.products.every((p) => scannedItems.includes(p.id));
  const subtotal = customer.products
    .filter((p) => scannedItems.includes(p.id))
    .reduce((acc, p) => acc + p.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleScanItem = (prod: CustomerProduct) => {
    if (!scannedItems.includes(prod.id)) {
      sound.playScannerBeep();
      setScannedItems([...scannedItems, prod.id]);
    }
  };

  const handleFinish = () => {
    sound.playRegisterDrawer();
    onCompleteSale(total);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-neutral-950 border-2 border-emerald-900/60 rounded-lg shadow-2xl overflow-hidden flex flex-col font-mono text-neutral-200">
        {/* Register Screen Header */}
        <div className="bg-emerald-950/40 border-b border-emerald-800/40 p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 font-bold tracking-wider text-sm">K&M MART POS TERMINAL #01</span>
          </div>
          <div className="text-xs text-emerald-500/80">CLERK ON DUTY: OVERNIGHT</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
          {/* Customer & Items to scan */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div>
                <span className="text-xs text-neutral-400">CUSTOMER:</span>
                <div className="text-sm font-bold text-neutral-100">{customer.name}</div>
              </div>
              <button
                onClick={onStartDialogue}
                className="px-3 py-1.5 bg-sky-900/40 hover:bg-sky-800/50 border border-sky-600/50 text-sky-300 text-xs rounded flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Speak
              </button>
            </div>

            <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Items on Counter Belt:</div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {customer.products.length === 0 ? (
                <div className="text-xs text-neutral-500 italic p-3 bg-neutral-900/50 rounded border border-neutral-800">
                  Customer has placed no items on the counter.
                </div>
              ) : (
                customer.products.map((prod) => {
                  const isScanned = scannedItems.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleScanItem(prod)}
                      className={`p-2.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                        isScanned
                          ? 'bg-emerald-950/30 border-emerald-700/50 text-emerald-200'
                          : 'bg-neutral-900 hover:bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isScanned ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <Barcode className="w-4 h-4 text-neutral-400 shrink-0" />
                        )}
                        <div>
                          <div className="text-xs font-bold">{prod.name}</div>
                          <div className="text-[10px] text-neutral-400">UPC: {prod.barcode}</div>
                          {prod.isAnomalous && (
                            <div className="text-[10px] text-red-400 flex items-center gap-1 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              {prod.anomalyNote || 'UNREGISTERED ITEM'}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold">${prod.price.toFixed(2)}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isScanned ? 'bg-emerald-800/50 text-emerald-300' : 'bg-neutral-800 text-neutral-400'}`}>
                          {isScanned ? 'SCANNED' : 'CLICK TO SCAN'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* POS Receipt Tally & Payment */}
          <div className="bg-neutral-900/70 border border-neutral-800 rounded-lg p-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 border-b border-neutral-800 pb-1">TRANSACTION SUMMARY</div>
              <div className="flex justify-between text-xs text-neutral-300">
                <span>SUBTOTAL:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-300">
                <span>TAX (8%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-400 border-t border-neutral-800 pt-2">
                <span>TOTAL DUE:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800">
                <div className="text-xs text-neutral-400 mb-1">CASH TENDERED:</div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1.5 text-neutral-500 text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={customer.paymentAmount ? customer.paymentAmount.toFixed(2) : total.toFixed(2)}
                      value={tendered}
                      onChange={(e) => setTendered(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-700 rounded py-1 pl-6 pr-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => setTendered(customer.paymentAmount.toString())}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
                  >
                    Exact
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 mt-4">
              <button
                disabled={!allScanned}
                onClick={handleFinish}
                className={`w-full py-2.5 px-3 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                  allScanned
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                {allScanned ? 'Complete Sale [Print Receipt]' : 'Scan All Items First'}
              </button>

              <button
                onClick={onRefuseService}
                className="w-full py-2 px-3 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 rounded text-red-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Refuse Service [Rule Violation]
              </button>

              <button
                onClick={onClose}
                className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 text-xs text-center transition-colors"
              >
                Step Back [ESC]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
