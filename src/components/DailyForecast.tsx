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
  // Helper to convert Celsius to Fahrenheit
  const formatTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${Math.round(celsius)}°`;
  };

  // Convert for calculations
  const getCalcTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return (celsius * 9) / 5 + 32;
    }
    return celsius;
  };

  // Helper to retrieve correct icon component
  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Cloud;
    return <Icon className="w-5 h-5" />;
  };

  // Calculate the absolute minimum and maximum temperatures of the entire week
  // to scale the Apple-style temperature range bar.
  const weekMin = Math.min(...dailyData.map(d => getCalcTemp(d.tempMin)));
  const weekMax = Math.max(...dailyData.map(d => getCalcTemp(d.tempMax)));
  const totalRange = weekMax - weekMin;

  return (
    <div className={`w-full p-5 flex flex-col h-full ${
      theme === 'light' ? 'sleek-card-light text-slate-800' : 'sleek-card-dark text-slate-100'
    }`}>
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
          <Calendar className="w-4 h-4" />
        </div>
        <h3 className={`text-sm font-semibold uppercase tracking-wider font-sans ${
          theme === 'light' ? 'text-slate-800' : 'text-slate-300'
        }`}>
          7-Day Forecast
        </h3>
      </div>

      {/* Days Stack */}
      <div className="flex flex-col gap-3.5 flex-grow justify-around">
        {dailyData.map((day, index) => {
          // Calculate offset and width of the temperature range bar
          const dayMin = getCalcTemp(day.tempMin);
          const dayMax = getCalcTemp(day.tempMax);
          
          let leftPercent = 0;
          let widthPercent = 100;
          
          if (totalRange > 0) {
            leftPercent = ((dayMin - weekMin) / totalRange) * 100;
            widthPercent = ((dayMax - dayMin) / totalRange) * 100;
          }

          // Ensure width is at least 15% so it remains visible
          if (widthPercent < 15) widthPercent = 15;
          if (leftPercent + widthPercent > 100) leftPercent = 100 - widthPercent;

          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 6 }}
              transition={{ delay: index * 0.04, duration: 0.3, type: 'spring', stiffness: 300 }}
              className={`flex items-center justify-between gap-4 py-2 px-2.5 rounded-2xl border-b last:border-0 transition-colors cursor-pointer ${
                theme === 'light' 
                  ? 'border-slate-900/5 hover:bg-slate-900/5' 
                  : 'border-white/5 hover:bg-white/5'
              }`}
            >
              {/* Day Label & Small Date */}
              <div className="w-24 shrink-0 flex flex-col">
                <span className={`text-sm font-extrabold truncate ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {getDayOfWeek(day.date)}
                </span>
                <span className={`text-[10px] font-mono ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {formatDate(day.date).replace(/^[a-zA-Z]+,\s/, '')}
                </span>
              </div>

              {/* Weather Condition Icon & Precipitation % */}
              <div className="flex items-center gap-2 w-16 shrink-0 justify-start">
                <motion.div 
                  whileHover={{ scale: 1.25, rotate: 6 }}
                  className={theme === 'light' ? 'text-slate-700' : 'text-slate-200'} 
                  title={day.condition.text}
                >
                  {getIconComponent(day.condition.icon)}
                </motion.div>
                {day.precipitationProbMax > 15 ? (
                  <span className="text-[10px] font-extrabold text-sky-400 flex items-center gap-0.5 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">
                    <Droplets className="w-2.5 h-2.5 fill-sky-400 shrink-0" />
                    <span>{day.precipitationProbMax}%</span>
                  </span>
                ) : (
                  <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-400' : 'text-slate-600'}`}>-</span>
                )}
              </div>

              {/* Temperature Heatbar Range Indicator */}
              <div className="flex-1 flex items-center gap-2.5 max-w-[140px] md:max-w-none">
                {/* Min Temp Label */}
                <span className={`text-xs font-bold font-mono w-8 text-right ${
                  theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  {formatTemp(day.tempMin)}
                </span>

                {/* Progress bar tracks */}
                <div className={`relative flex-1 h-2.5 rounded-full overflow-hidden border ${
                  theme === 'light' ? 'bg-slate-900/10 border-slate-900/5' : 'bg-slate-950/60 border-white/5'
                }`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPercent}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05, ease: 'easeOut' }}
                    className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-orange-500 shadow-md"
                    style={{
                      left: `${leftPercent}%`,
                    }}
                  />
                </div>

                {/* Max Temp Label */}
                <span className={`text-xs font-extrabold font-mono w-8 ${
                  theme === 'light' ? 'text-slate-950' : 'text-white'
                }`}>
                  {formatTemp(day.tempMax)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
