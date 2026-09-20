import { motion } from 'motion/react';
import { Clock, Droplets } from 'lucide-react';
import { HourlyForecastItem } from '../types';
import * as LucideIcons from 'lucide-react';
import { formatTime } from '../utils/weatherHelpers';

interface HourlyForecastProps {
  hourlyData: HourlyForecastItem[];
  tempUnit: 'c' | 'f';
  theme?: 'light' | 'dark';
}

export function HourlyForecast({ hourlyData, tempUnit, theme = 'dark' }: HourlyForecastProps) {
  const isLight = theme === 'light';

  const formatTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${Math.round(celsius)}°`;
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Cloud;
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className={`w-full p-4 sm:p-5 rounded-2xl border transition-all ${
      isLight
        ? 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-100 text-slate-800'
        : 'bg-slate-900/50 border-white/10 shadow-sm shadow-black/20 text-slate-100'
    }`}>
      <div className="flex items-center gap-2 mb-3.5">
        <Clock className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Hourly Forecast
        </h3>
      </div>

      {/* Horizontal Scroll Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {hourlyData.map((item, index) => {
          const isCurrentHour = index === 0;
          return (
            <motion.div
              key={item.time}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.015, duration: 0.2 }}
              className={`flex flex-col items-center justify-between min-w-[72px] sm:min-w-[78px] py-3.5 px-2 rounded-xl border transition-all select-none ${
                isCurrentHour
                  ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                  : isLight
                    ? 'bg-slate-50 border-slate-100 hover:bg-slate-100/80'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              {/* Hour Label */}
              <span className={`text-[11px] font-mono font-medium ${
                isCurrentHour
                  ? 'text-sky-400 font-semibold'
                  : isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                {isCurrentHour ? 'Now' : formatTime(item.time).replace(':00', '')}
              </span>

              {/* Weather Icon */}
              <div className={`my-2.5 ${
                isCurrentHour 
                  ? 'text-sky-400' 
                  : isLight ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {getIconComponent(item.condition.icon)}
              </div>

              {/* Temp */}
              <span className={`text-sm font-bold tracking-tight font-display ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {formatTemp(item.temp)}
              </span>

              {/* Rain Chance */}
              {item.precipitationProb > 0 ? (
                <div className="flex items-center gap-0.5 mt-1.5 text-[10px] font-semibold text-sky-400">
                  <Droplets className="w-2.5 h-2.5 fill-sky-400" />
                  <span>{item.precipitationProb}%</span>
                </div>
              ) : (
                <div className="h-4 mt-1.5" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
