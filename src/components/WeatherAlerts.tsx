import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ChevronDown, ChevronUp, BellRing, ShieldCheck } from 'lucide-react';
import { WeatherAlert } from '../types';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  theme?: 'light' | 'dark';
}

export function WeatherAlerts({ alerts, theme = 'dark' }: WeatherAlertsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (alerts.length === 0) return null;

  return (
    <div className="w-full flex flex-col gap-2.5">
      {alerts.map((alert, idx) => {
        const isExpanded = expandedIndex === idx;
        const isSevere = alert.severity === 'severe' || alert.severity === 'extreme';

        let cardClass = '';
        if (theme === 'light') {
          cardClass = isSevere
            ? 'bg-rose-500/5 border-rose-200 text-rose-900 shadow-md'
            : 'bg-amber-500/5 border-amber-200 text-amber-900 shadow-md';
        } else {
          cardClass = isSevere
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-200 shadow-lg shadow-rose-500/5'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-200 shadow-lg shadow-amber-500/5';
        }

        return (
          <div
            key={idx}
            className={`overflow-hidden rounded-3xl border transition-all duration-300 ${cardClass}`}
          >
            {/* Header / Click Trigger */}
            <div
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 active:bg-black/10 select-none transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-2xl ${
                    isSevere 
                      ? theme === 'light' ? 'bg-rose-100 text-rose-600' : 'bg-rose-500/15 text-rose-400'
                      : theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/15 text-amber-400'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 animate-bounce-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isSevere 
                          ? theme === 'light' ? 'bg-rose-200/50 text-rose-800' : 'bg-rose-500/20 text-rose-300'
                          : theme === 'light' ? 'bg-amber-200/50 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {alert.severity} advisory
                    </span>
                    <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {alert.sender}
                    </span>
                  </div>
                  <h4 className={`text-sm font-bold tracking-tight mt-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {alert.title}
                  </h4>
                </div>
              </div>

              {/* Expansion Indicators */}
              <div className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* Expandable Body */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <div className={`px-4 pb-5 pt-1 text-xs leading-relaxed border-t flex flex-col gap-3 ${
                    theme === 'light' 
                      ? 'text-slate-700 border-slate-200 bg-slate-50' 
                      : 'text-slate-300 border-white/5 bg-white/5'
                  }`}>
                    <p>{alert.description}</p>
                    
                    {/* Action recommendations checklist */}
                    <div className={`flex gap-2.5 items-start p-3 rounded-2xl border text-[11px] ${
                      theme === 'light'
                        ? 'bg-white border-slate-200 text-slate-600'
                        : 'bg-slate-950/20 border-white/5 text-slate-400'
                    }`}>
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      <div>
                        <p className={`font-bold mb-0.5 ${theme === 'light' ? 'text-slate-800' : 'text-slate-300'}`}>Safety Precaution Checklist</p>
                        <p>Remain informed via local broadcasts. Keep outdoor pets secured. Have essential emergency contacts ready if necessary.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
