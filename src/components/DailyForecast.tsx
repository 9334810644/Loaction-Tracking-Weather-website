import { motion } from 'motion/react';
import { Calendar, Droplets } from 'lucide-react';
import { DailyForecastItem } from '../types';
import * as LucideIcons from 'lucide-react';
import { getDayOfWeek, formatDate } from '../utils/weatherHelpers';

interface DailyForecastProps {
  dailyData: DailyForecastItem[];
  tempUnit: 'c' | 'f';
  theme?: 'light' | 'dark';
}

export function DailyForecast({ dailyData, tempUnit, theme = 'dark' }: DailyForecastProps) {
  const isLight = theme === 'light';

  const formatTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${Math.round(celsius)}°`;
  };

  const getCalcTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Cloud;
    return <Icon className="w-5 h-5" />;
  };

  const weekMin = Math.min(...dailyData.map(d => getCalcTemp(d.tempMin)));
  const weekMax = Math.max(...dailyData.map(d => getCalcTemp(d.tempMax)));
  const totalRange = weekMax - weekMin;

  return (
    <div className={`w-full p-4 sm:p-5 rounded-2xl border transition-all flex flex-col h-full ${
      isLight
        ? 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-100 text-slate-800'
        : 'bg-slate-900/50 border-white/10 shadow-sm shadow-black/20 text-slate-100'
    }`}>
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <Calendar className="w-4 h-4 text-sky-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          7-Day Outlook
        </h3>
      </div>

      <div className="flex flex-col divide-y divide-white/5 flex-grow justify-between">
        {dailyData.map((day, index) => {
          const dayMin = getCalcTemp(day.tempMin);
          const dayMax = getCalcTemp(day.tempMax);
          
          let leftPercent = 0;
          let widthPercent = 100;
          
          if (totalRange > 0) {
            leftPercent = ((dayMin - weekMin) / totalRange) * 100;
            widthPercent = ((dayMax - dayMin) / totalRange) * 100;
          }

          if (widthPercent < 15) widthPercent = 15;
          if (leftPercent + widthPercent > 100) leftPercent = 100 - widthPercent;

          return (
            <div
              key={day.date}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              {/* Day Label */}
              <div className="w-20 shrink-0">
                <div className={`text-xs sm:text-sm font-semibold truncate ${
                  isLight ? 'text-slate-900' : 'text-slate-100'
                }`}>
                  {getDayOfWeek(day.date)}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {formatDate(day.date).replace(/^[a-zA-Z]+,\s/, '')}
                </div>
              </div>

              {/* Weather Condition Icon & Rain % */}
              <div className="flex items-center gap-1.5 w-14 shrink-0">
                <div className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                  {getIconComponent(day.condition.icon)}
                </div>
                {day.precipitationProbMax > 20 && (
                  <span className="text-[10px] font-semibold text-sky-400">
                    {day.precipitationProbMax}%
                  </span>
                )}
              </div>

              {/* Temperature Bar */}
              <div className="flex-1 flex items-center gap-2 max-w-[170px] sm:max-w-none">
                <span className="text-xs font-mono font-medium text-slate-400 w-7 text-right">
                  {formatTemp(day.tempMin)}
                </span>

                <div className="relative flex-1 h-1.5 rounded-full overflow-hidden bg-slate-500/20">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ duration: 0.6, delay: index * 0.04 }}
                    className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-400"
                    style={{ left: `${leftPercent}%` }}
                  />
                </div>

                <span className={`text-xs font-mono font-bold w-7 ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {formatTemp(day.tempMax)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
