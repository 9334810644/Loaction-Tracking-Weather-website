import { motion } from 'motion/react';
import { MapPin, X, ShieldCheck } from 'lucide-react';

interface LocationPopupProps {
  onAllow: () => void;
  onDecline: () => void;
}

export function LocationPopup({ onAllow, onDecline }: LocationPopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-md p-6 overflow-hidden text-slate-100 border border-white/10 rounded-3xl bg-slate-900/80 backdrop-blur-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          {/* Animated Map Pin Pulse */}
          <div className="relative flex items-center justify-center w-16 h-16 mb-5 rounded-2xl bg-sky-500/10 text-sky-400">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-2xl bg-sky-500/5"
            />
            <MapPin className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-white mb-2 font-sans">
            Weather Location Access
          </h2>
          
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Allow location access to get accurate, real-time local weather forecasts for your current location.
          </p>

          {/* Privacy Disclaimer Card */}
          <div className="flex gap-3 p-4 mb-6 text-left text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-400 mb-0.5">Privacy Guaranteed</p>
              <p>
                We value your privacy. Your location coordinates are used exclusively in your browser to fetch weather forecasts. We never collect, track, store, or sell your personal data.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAllow}
              id="btn-allow-location"
              className="flex items-center justify-center w-full gap-2 px-5 py-3.5 font-bold text-white transition-all bg-sky-500 rounded-2xl hover:bg-sky-400 shadow-xl shadow-sky-500/25 cursor-pointer"
            >
              <span>📍 Allow Location</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={onDecline}
              id="btn-decline-location"
              className="flex items-center justify-center w-full gap-2 px-5 py-3.5 font-bold transition-all border border-white/10 bg-white/5 text-slate-300 rounded-2xl hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <span>❌ Continue without Location</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
