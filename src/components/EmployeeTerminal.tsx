import React, { useState } from 'react';
import { sound } from '../audio/SoundManager';
import { PhoneCall, PhoneOff, BookOpen, AlertTriangle, Send, ShieldAlert, X } from 'lucide-react';
import { StoreRule, ShiftNumber } from '../types';

interface EmployeeTerminalProps {
  currentShift: ShiftNumber;
  currentRules: StoreRule[];
  currentTime: string;
  onClose: () => void;
}

export const EmployeeTerminal: React.FC<EmployeeTerminalProps> = ({
  currentShift,
  currentRules,
  currentTime,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'handbook'>('phone');
  const [query, setQuery] = useState<string>('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [callConnected, setCallConnected] = useState<boolean>(false);

  const predefinedQueries = [
    'A customer is wearing bright red and demands raw meat.',
    'There is a tall figure standing in Aisle 6 who refuses to turn around.',
    'A man wearing a nametag that says "David" offered to relieve my shift.',
    'The customer asked me if I am alone in the store tonight.',
    'The lights blew out and I hear breathing in the backroom.',
  ];

  const handleStartCall = () => {
    sound.playPhoneRing();
    setTimeout(() => {
      setCallConnected(true);
      setResponse(
        'K&M MART REGIONAL SUPERVISION DISPATCH. Your call has been logged. State your shift anomaly or protocol question.'
      );
    }, 1800);
  };

  const handleSendQuery = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setIsLoading(true);
    setResponse(null);
    sound.playTypewriterKey('corporate');

    try {
      const activeRuleText = currentRules.map((r) => r.ruleText).join('; ');
      const res = await fetch('/api/manager-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          shift: currentShift,
          hour: currentTime,
          currentRule: activeRuleText,
          recentIncident: 'High paranormal activity detected by store clerk.',
        }),
      });

      const data = await res.json();
      setResponse(data.reply || 'Corporate guidance unavailable. Re-read the posted handbook notices.');
      sound.playTypewriterKey('corporate');
    } catch (err) {
      setResponse('CORPORATE LINE STATIC: "...If you hear static... step away from the phone immediately."');
    } finally {
      setIsLoading(false);
      setQuery('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono text-neutral-200">
      <div className="w-full max-w-2xl bg-neutral-950 border-2 border-red-900/60 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Terminal Header */}
        <div className="bg-red-950/40 border-b border-red-900/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <span className="text-red-400 font-bold text-sm tracking-wider">
              RED PHONE // CORPORATE SUPERVISOR HOTLINE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60">
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'phone'
                ? 'bg-neutral-950 text-red-400 border-b-2 border-red-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Emergency Hotline
          </button>
          <button
            onClick={() => setActiveTab('handbook')}
            className={`flex-1 py-2.5 px-4 text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'handbook'
                ? 'bg-neutral-950 text-amber-400 border-b-2 border-amber-500'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Employee Rule Handbook (Shift {currentShift})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[460px] overflow-y-auto">
          {activeTab === 'phone' ? (
            <div className="space-y-4">
              {!callConnected ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-700/60 flex items-center justify-center mx-auto text-red-400 animate-pulse">
                    <PhoneCall className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-neutral-100 mb-1">
                      DIRECT LINE TO CORPORATE NIGHT SUPERVISION
                    </div>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      Authorized for shift clerks facing severe anomalies, rule ambiguity, or paranormal protocol breaches.
                    </p>
                  </div>
                  <button
                    onClick={handleStartCall}
                    className="px-6 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider rounded shadow-lg shadow-red-950 transition-colors"
                  >
                    [ Lift Red Handset ]
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Speaker Message Box */}
                  <div className="p-3.5 bg-neutral-900 border border-neutral-800 rounded-lg min-h-24">
                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-2 pb-1 border-b border-neutral-800">
                      <span className="text-red-400 font-bold">SUPERVISOR DISPATCH (HIGH-THINKING AI):</span>
                      <span>TIME: {currentTime}</span>
                    </div>
                    {isLoading ? (
                      <div className="text-xs text-amber-400 flex items-center gap-2 animate-pulse py-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Analyzing corporate bylaws and employee survival probability...
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-200 leading-relaxed font-sans">
                        {response}
                      </div>
                    )}
                  </div>

                  {/* Predefined Emergency Questions */}
                  <div>
                    <div className="text-[11px] text-neutral-400 uppercase tracking-wider mb-2 font-bold">
                      Common Incident Reports:
                    </div>
                    <div className="space-y-1.5">
                      {predefinedQueries.map((q, idx) => (
                        <button
                          key={idx}
                          disabled={isLoading}
                          onClick={() => handleSendQuery(q)}
                          className="w-full text-left p-2 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded text-xs text-neutral-300 transition-colors"
                        >
                          → "{q}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Question Input */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                    <input
                      type="text"
                      placeholder="Ask the Supervisor a custom question..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendQuery(query);
                      }}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-xs text-neutral-100 font-mono focus:outline-none focus:border-red-500"
                    />
                    <button
                      disabled={isLoading || !query.trim()}
                      onClick={() => handleSendQuery(query)}
                      className="p-2 bg-red-700 hover:bg-red-600 disabled:bg-neutral-800 text-white rounded transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Handbook Tab */
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 leading-relaxed">
                  MEMORIZE THESE RULES. Violations result in immediate disciplinary liquidation.
                </div>
              </div>

              <div className="space-y-2.5">
                {currentRules.map((rule, idx) => (
                  <div key={rule.id} className="p-3 bg-neutral-900 border border-neutral-800 rounded">
                    <div className="text-xs font-bold text-amber-400 mb-1">
                      RULE #{idx + 1}: {rule.ruleText}
                    </div>
                    <div className="text-xs text-neutral-400 font-sans">{rule.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-900/80 border-t border-neutral-800 px-4 py-2.5 flex items-center justify-between text-xs text-neutral-500">
          <span>K&M MART CORP © 1998</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded transition-colors"
          >
            Hang Up [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
