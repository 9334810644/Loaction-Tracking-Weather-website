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
} from 'lucide-react';
import { WeatherData } from '../types';
import { getWindDirectionLabel } from '../utils/weatherHelpers';

interface BentoDetailsProps {
  weather: WeatherData;
  tempUnit: 'c' | 'f';
  theme?: 'light' | 'dark';
}

export function BentoDetails({ weather, tempUnit, theme = 'dark' }: BentoDetailsProps) {
  const isLight = theme === 'light';

  const formatTemp = (celsius: number) => {
    if (tempUnit === 'f') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${Math.round(celsius)}°`;
  };

  const formattedWind = (speedKmh: number) => {
    if (tempUnit === 'f') {
      return `${Math.round(speedKmh * 0.621371)} mph`;
    }
    return `${Math.round(speedKmh)} km/h`;
  };

  const parseTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return '--:--';
    }
  };

  const cardBase = `p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
    isLight
      ? 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-100 text-slate-800'
      : 'bg-slate-900/50 border-white/10 shadow-sm shadow-black/20 text-slate-100'
  }`;

  const labelStyle = `text-[11px] font-semibold tracking-wider uppercase ${
    isLight ? 'text-slate-400' : 'text-slate-400'
  }`;

  const valueStyle = `text-2xl sm:text-3xl font-bold tracking-tight font-display ${
    isLight ? 'text-slate-900' : 'text-white'
  }`;

  const hintStyle = `text-xs mt-1 leading-normal ${
    isLight ? 'text-slate-500' : 'text-slate-400'
  }`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full">
      
      {/* 1. Feels Like */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Feels Like</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Thermometer className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={valueStyle}>{formatTemp(weather.feelsLike)}</div>
          <p className={hintStyle}>
            {Math.round(weather.feelsLike) === Math.round(weather.temp)
              ? 'Similar to actual'
              : weather.feelsLike > weather.temp
                ? 'Warmer than actual'
                : 'Cooler than actual'}
          </p>
        </div>
      </div>

      {/* 2. Wind */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Wind</span>
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Wind className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className={valueStyle}>{formattedWind(weather.windSpeed)}</span>
            <div
              className="inline-flex items-center transition-transform duration-500"
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            >
              <Navigation className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
            </div>
          </div>
          <p className={hintStyle}>
            From {getWindDirectionLabel(weather.windDirection)} ({weather.windDirection}°)
          </p>
        </div>
      </div>

      {/* 3. Humidity */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Humidity</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Droplets className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={valueStyle}>{weather.humidity}%</div>
          <p className={hintStyle}>Dew point is {formatTemp(weather.dewPoint)}</p>
        </div>
      </div>

      {/* 4. UV Index */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>UV Index</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Sun className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className={valueStyle}>{Math.round(weather.uvIndex)}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
              weather.uvIndex <= 2
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                : weather.uvIndex <= 5
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                  : weather.uvIndex <= 7
                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}>
              {weather.uvIndex <= 2 ? 'Low' : weather.uvIndex <= 5 ? 'Moderate' : weather.uvIndex <= 7 ? 'High' : 'Very High'}
            </span>
          </div>
          <p className={hintStyle}>
            {weather.uvIndex <= 2 ? 'Minimal sun protection required' : 'Wear sunscreen & shades'}
          </p>
        </div>
      </div>

      {/* 5. Air Quality */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Air Quality</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className={valueStyle}>{weather.airQuality.aqiUs}</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${weather.airQuality.color}15`,
                borderColor: `${weather.airQuality.color}30`,
                color: weather.airQuality.color,
              }}
            >
              {weather.airQuality.label}
            </span>
          </div>
          <p className={hintStyle}>PM2.5: {weather.airQuality.pm25.toFixed(1)} µg/m³</p>
        </div>
      </div>

      {/* 6. Solar Cycle (Sunrise & Sunset) */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Sun Cycle</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Sunrise className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
              <Sunrise className="w-3 h-3 text-amber-500" />
              <span>Rise</span>
            </div>
            <div className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {parseTime(weather.sunrise)}
            </div>
          </div>
          <div className="w-[1px] h-7 bg-white/10" />
          <div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-0.5">
              <Sunset className="w-3 h-3 text-indigo-400" />
              <span>Set</span>
            </div>
            <div className={`font-semibold text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {parseTime(weather.sunset)}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Visibility */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Visibility</span>
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
            <Eye className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={valueStyle}>
            {weather.visibility.toFixed(1)} <span className="text-sm font-normal text-slate-400">km</span>
          </div>
          <p className={hintStyle}>
            {weather.visibility >= 10 ? 'Clear distance' : 'Reduced visibility'}
          </p>
        </div>
      </div>

      {/* 8. Pressure & Cloud Cover */}
      <div className={cardBase}>
        <div className="flex items-center justify-between">
          <span className={labelStyle}>Pressure</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Gauge className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className={valueStyle}>
            {Math.round(weather.pressure)} <span className="text-sm font-normal text-slate-400">hPa</span>
          </div>
          <p className={hintStyle}>
            {weather.cloudCover}% cloud coverage
          </p>
        </div>
      </div>

    </div>
  );
}
