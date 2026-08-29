import { motion } from 'motion/react';
import { Clock, Droplets, Thermometer } from 'lucide-react';
import { HourlyForecastItem } from '../types';
import * as LucideIcons from 'lucide-react';
import { formatTime } from '../utils/weatherHelpers';

interface HourlyForecastProps {
  hourlyData: HourlyForecastItem[];
  tempUnit: 'c' | 'f';
  theme?: 'light' | 'dark';
}

export function HourlyForecast({ hourlyData, tempUnit, theme = 'dark' }: HourlyForecastProps) {
  // Helper to convert Celsius to Fahrenheit
  const formatTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${Math.round(celsius)}°`;
  };

  // Helper to retrieve correct icon component
  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Cloud;
    return <Icon className="w-6 h-6" />;
  };

  return (
    <div className={`w-full p-5 ${
      theme === 'light' ? 'sleek-card-light text-slate-800' : 'sleek-card-dark text-slate-100'
    }`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
          <Clock className="w-4 h-4 animate-pulse" />
        </div>
        <h3 className={`text-sm font-semibold uppercase tracking-wider font-sans ${
          theme === 'light' ? 'text-slate-800' : 'text-slate-300'
        }`}>
          Hourly Forecast (Next 24 Hours)
        </h3>
      </div>

      {/* Horizontal Scroll Area */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {hourlyData.map((item, index) => {
          const isCurrentHour = index === 0;
          return (
            <motion.div
              key={item.time}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ delay: index * 0.02, duration: 0.3, type: 'spring', stiffness: 350 }}
              className={`flex flex-col items-center justify-between min-w-[80px] py-4 px-2 rounded-2xl border transition-all cursor-pointer select-none ${
                isCurrentHour
                  ? 'bg-sky-500/20 border-sky-400/50 shadow-lg shadow-sky-500/20 ring-1 ring-sky-400/30'
                  : theme === 'light'
                    ? 'bg-slate-900/5 border-slate-900/5 hover:bg-slate-900/10 hover:border-slate-900/10'
                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
              }`}
            >
              {/* Timestamp */}
              <span className={`text-[11px] font-mono font-semibold ${
                isCurrentHour
                  ? 'text-sky-400 font-bold'
                  : theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {isCurrentHour ? 'Now' : formatTime(item.time).replace(':00', '')}
              </span>

              {/* Weather Icon with micro-bounce on hover */}
              <motion.div
                whileHover={{ scale: 1.2, rotate: 6 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className={`my-3 ${
                  isCurrentHour 
                    ? 'text-sky-400 sleek-glow-blue' 
                    : theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                {getIconComponent(item.condition.icon)}
              </motion.div>

              {/* Temperature */}
              <span className={`text-sm font-extrabold tracking-tight mb-1.5 ${
                theme === 'light' ? 'text-slate-950' : 'text-white'
              }`}>
                {formatTemp(item.temp)}
              </span>

              {/* Rain Chance Indicator */}
              {item.precipitationProb > 0 ? (
                <div className="flex items-center gap-0.5 text-[10px] font-extrabold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">
                  <Droplets className="w-2.5 h-2.5 fill-sky-400 shrink-0" />
                  <span>{item.precipitationProb}%</span>
                </div>
              ) : (
                <span className={`text-[9px] font-mono ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>-</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
