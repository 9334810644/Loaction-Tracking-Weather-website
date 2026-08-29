import { motion } from 'motion/react';
import {
  Thermometer,
  Wind,
  Droplets,
  Sun,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Navigation,
  Activity,
  Cloud,
  CloudRain
} from 'lucide-react';
import { WeatherData } from '../types';
import { getWindDirectionLabel } from '../utils/weatherHelpers';

interface BentoDetailsProps {
  weather: WeatherData;
  tempUnit: 'c' | 'f';
  theme?: 'light' | 'dark';
}

export function BentoDetails({ weather, tempUnit, theme = 'dark' }: BentoDetailsProps) {
  const formatTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return `${Math.round((celsius * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const formattedWind = (speedKmh: number) => {
    // 1 km/h = 0.621371 mph
    if (tempUnit === 'f') {
      return `${Math.round(speedKmh * 0.621371)} mph`;
    }
    return `${Math.round(speedKmh)} km/h`;
  };

  // Sunrise/Sunset parser helper
  const parseTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  };

  const cardStyle = `p-5 rounded-3xl border shadow-xl flex flex-col justify-between h-44 transition-all duration-300 ${
    theme === 'light' ? 'sleek-card-light text-slate-800' : 'sleek-card-dark text-slate-100'
  }`;

  const titleStyle = `text-xs font-semibold uppercase tracking-wider ${
    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
  }`;

  const valueStyle = `text-3xl font-extrabold tracking-tight font-sans ${
    theme === 'light' ? 'text-slate-950' : 'text-white'
  }`;

  const descStyle = `text-[11px] mt-1.5 leading-snug ${
    theme === 'light' ? 'text-slate-600 font-medium' : 'text-slate-400'
  }`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      
      {/* 1. Feels Like Apparent Temp */}
      <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>Feels Like</span>
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <Thermometer className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className={valueStyle}>
            {formatTemp(weather.feelsLike)}
          </span>
          <p className={descStyle}>
            {weather.feelsLike > weather.temp ? 'Warmer than actual temperature.' : 'Cooler than actual temperature.'}
          </p>
        </div>
      </motion.div>

      {/* 2. Wind Status with Compass */}
      <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>Wind</span>
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
            <Wind className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Rotating Compass Arrow */}
          <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl border shrink-0 ${
            theme === 'light' ? 'bg-sky-500/10 border-sky-500/20 text-sky-600' : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
          }`}>
            <Navigation 
              className="w-5 h-5 transition-transform duration-1000 ease-out drop-shadow"
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
          </div>
          <div>
            <span className={`text-xl font-extrabold font-mono tracking-tight ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
              {formattedWind(weather.windSpeed)}
            </span>
            <p className={`text-[10px] font-semibold leading-none mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {getWindDirectionLabel(weather.windDirection)} ({weather.windDirection}°)
            </p>
          </div>
        </div>
      </motion.div>

      {/* 3. Humidity & Dew Point */}
      <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>Humidity</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Droplets className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className={valueStyle}>
            {weather.humidity}%
          </span>
          <p className={descStyle}>
            Dew point is {formatTemp(weather.dewPoint)} right now.
          </p>
        </div>
      </motion.div>

      {/* 4. UV Index with Gauge Meter */}
      <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>UV Index</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Sun className="w-4 h-4 sleek-glow-yellow" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <span className={valueStyle}>
              {weather.uvIndex.toFixed(0)}
            </span>
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
              weather.uvIndex <= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              weather.uvIndex <= 5 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              weather.uvIndex <= 7 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {weather.uvIndex <= 2 ? 'Low' : weather.uvIndex <= 5 ? 'Moderate' : weather.uvIndex <= 7 ? 'High' : 'Very High'}
            </span>
          </div>
          {/* Mini-progress indicator bar */}
          <div className={`w-full h-2 rounded-full mt-3 overflow-hidden border ${
            theme === 'light' ? 'bg-slate-900/10 border-slate-900/5' : 'bg-slate-950/60 border-white/5'
          }`}>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((weather.uvIndex / 12) * 100, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 rounded-full shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* 5. Air Quality Index (PM2.5, PM10) - Double Column */}
      <motion.div
        whileHover={{ y: -5, scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`col-span-2 ${cardStyle}`}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>Air Quality Index (AQI)</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
          <div>
            <div className="flex items-center gap-2.5">
              <span 
                className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-lg animate-pulse"
                style={{ backgroundColor: weather.airQuality.color }}
              />
              <span className={`text-2xl font-extrabold tracking-tight leading-none ${
                theme === 'light' ? 'text-slate-950' : 'text-white'
              }`}>
                {weather.airQuality.aqiUs} <span className="text-xs font-medium text-slate-400">US AQI</span>
              </span>
            </div>
            <p className="text-xs font-bold mt-1.5" style={{ color: weather.airQuality.color }}>
              {weather.airQuality.label}
            </p>
          </div>
          
          {/* Particulate Matter labels */}
          <div className={`flex gap-4 border-t md:border-t-0 md:border-l pt-2.5 md:pt-0 md:pl-5 shrink-0 text-xs ${
            theme === 'light' ? 'border-slate-900/10' : 'border-white/10'
          }`}>
            <div className="px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5">
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>PM2.5</span>
              <p className={`font-mono text-sm font-bold mt-0.5 ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                {weather.airQuality.pm25.toFixed(1)} <span className={`text-[9px] font-normal ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</span>
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-white/5 border border-white/5">
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>PM10</span>
              <p className={`font-mono text-sm font-bold mt-0.5 ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>
                {weather.airQuality.pm10.toFixed(1)} <span className={`text-[9px] font-normal ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>µg/m³</span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 6. Sunrise & Sunset Solar Day Meter - Double Column */}
      <motion.div
        whileHover={{ y: -5, scale: 1.005 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`col-span-2 ${cardStyle}`}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>Solar Cycle</span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Sunrise className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-6 mt-1.5">
          {/* Sunrise Card */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              theme === 'light' ? 'bg-amber-500/10 text-amber-600' : 'bg-amber-500/15 text-amber-400'
            }`}>
              <Sunrise className="w-5 h-5 animate-bounce-slow" />
            </div>
            <div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Sunrise</span>
              <p className={`text-sm font-extrabold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{parseTime(weather.sunrise)}</p>
            </div>
          </div>

          {/* Graphical connecting line representing sun trajectory */}
          <div className="hidden sm:block flex-1 relative h-8">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" fill="none">
              <path 
                d="M5,22 Q50,2 95,22" 
                stroke={theme === 'light' ? 'rgba(15,23,42,0.15)' : 'rgba(255,255,255,0.15)'} 
                strokeWidth="2" 
                strokeDasharray="4,4"
              />
              <motion.circle 
                cx="50" 
                cy="9" 
                r="4" 
                fill="#f59e0b" 
                className="sleek-glow-yellow"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              />
            </svg>
          </div>

          {/* Sunset Card */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${
              theme === 'light' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'
            }`}>
              <Sunset className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Sunset</span>
              <p className={`text-sm font-extrabold ${theme === 'light' ? 'text-slate-950' : 'text-white'}`}>{parseTime(weather.sunset)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 7. Visibility */}
      <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>Visibility</span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
            <Eye className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className={valueStyle}>
            {weather.visibility.toFixed(1)} <span className={`text-sm font-normal ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>km</span>
          </span>
          <p className={descStyle}>
            {weather.visibility > 9 ? 'Perfect clear visibility conditions.' : 'Slight mist reducing distance.'}
          </p>
        </div>
      </motion.div>

      {/* 8. Pressure & Cloud Cover */}
      <motion.div
        whileHover={{ y: -5, scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cardStyle}
      >
        <div className="flex items-center justify-between">
          <span className={titleStyle}>Pressure</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className={valueStyle}>
            {Math.round(weather.pressure)} <span className={`text-sm font-normal ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>hPa</span>
          </span>
          <div className={`flex items-center gap-1.5 mt-2 text-[11px] font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            <Cloud className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
            <span>{weather.cloudCover}% Cloud coverage</span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
