import { motion } from 'motion/react';
import { MapPin, X } from 'lucide-react';

interface LocationPopupProps {
  onAllow: () => void;
  onDecline: () => void;
}

export function LocationPopup({ onAllow, onDecline }: LocationPopupProps) {
  return (
    <motion.aside
      aria-label="Location permission banner"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-50 p-4 rounded-2xl border backdrop-blur-2xl bg-slate-900/90 border-white/10 text-slate-100 shadow-2xl flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white tracking-tight">Enable Local Weather</h4>
          <p className="text-xs text-slate-400 truncate">Get instant forecasts for your location</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onAllow}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-sky-500 hover:bg-sky-400 text-white transition-all shadow-md shadow-sky-500/20"
        >
          Enable
        </button>
        <button
          type="button"
          onClick={onDecline}
          aria-label="Dismiss location request"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.aside>
  );
}
