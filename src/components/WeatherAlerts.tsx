import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { WeatherAlert } from '../types';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  theme?: 'light' | 'dark';
}

export function WeatherAlerts({ alerts, theme = 'dark' }: WeatherAlertsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!alerts || alerts.length === 0) return null;

  const isLight = theme === 'light';

  return (
    <div className="w-full flex flex-col gap-2">
      {alerts.map((alert, idx) => {
        const isExpanded = expandedIndex === idx;
        const isSevere = alert.severity === 'severe' || alert.severity === 'extreme';

        return (
          <div
            key={idx}
            className={`overflow-hidden rounded-2xl border transition-all ${
              isSevere
                ? isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                : isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}
          >
            <div
              onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-black/5 active:bg-black/10 select-none transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className={`w-4 h-4 shrink-0 ${isSevere ? 'text-rose-500' : 'text-amber-500'}`} />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-xs font-bold tracking-tight">{alert.title}</span>
                  <span className="text-[10px] opacity-70 font-mono">({alert.sender})</span>
                </div>
              </div>

              <div className="opacity-60 shrink-0">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-4 pb-3.5 pt-1 text-xs leading-relaxed opacity-90 border-t border-current/10">
                    <p>{alert.description}</p>
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
