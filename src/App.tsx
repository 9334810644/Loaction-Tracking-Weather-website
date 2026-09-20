import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Clock,
  AlertCircle,
  Compass,
  Layers,
  Sparkles,
  CloudSun,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { useWeather } from './hooks/useWeather';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { LocationPopup } from './components/LocationPopup';
import { Navbar } from './components/Navbar';
import { WeatherAlerts } from './components/WeatherAlerts';
import { HourlyForecast } from './components/HourlyForecast';
import { DailyForecast } from './components/DailyForecast';
import { BentoDetails } from './components/BentoDetails';
import { WeatherMap } from './components/WeatherMap';

export default function App() {
  const {
    coords,
    location,
    weatherData,
    loading,
    isLocating,
    error,
    preferences,
    showLocationPopup,
    recentSearches,
    favorites,
    toggleUnit,
    toggleTheme,
    toggleFavorite,
    searchCity,
    fetchWeather,
    requestLocation,
    declineLocation,
    clearRecent,
  } = useWeather();

  // Active view toggle: 'forecast' or 'radar'
  const [activeTab, setActiveTab] = useState<'forecast' | 'radar'>('forecast');

  // Live clock state (updated every 60s)
  const [time, setTime] = useState(new Date());
  // Offline state tracker
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 60000);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(clockTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isCurrentFavorite = (() => {
    if (!weatherData || !location) return false;
    return favorites.some(
      f =>
        (coords && Math.abs(f.lat - coords.latitude) < 0.01 && Math.abs(f.lon - coords.longitude) < 0.01) ||
        f.name.toLowerCase() === location.city.toLowerCase()
    );
  })();

  const handleToggleFavorite = () => {
    if (!location || !coords) return;
    toggleFavorite({
      id: `${coords.latitude.toFixed(4)}_${coords.longitude.toFixed(4)}`,
      name: location.city,
      lat: coords.latitude,
      lon: coords.longitude,
      country: location.country,
      state: location.state,
    });
  };

  const handleSelectCity = (lat: number, lon: number, name: string, country?: string) => {
    fetchWeather(lat, lon, {
      city: name,
      country: country || '',
      state: '',
      locality: '',
      displayName: `${name}${country ? ', ' + country : ''}`,
    });
  };

  const formatTemp = (celsius: number) => {
    if (preferences.unit === 'f') {
      return `${Math.round((celsius * 9) / 5 + 32)}°`;
    }
    return `${Math.round(celsius)}°`;
  };

  const getTodayMinMax = () => {
    if (!weatherData || weatherData.daily.length === 0) return { min: '--', max: '--' };
    const today = weatherData.daily[0];
    return {
      min: formatTemp(today.tempMin),
      max: formatTemp(today.tempMax),
    };
  };

  const getHeaderIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Cloud;
    const isSunny = iconName.toLowerCase().includes('sun');
    const isThunder = iconName.toLowerCase().includes('lightning') || iconName.toLowerCase().includes('bolt');
    const isRain = iconName.toLowerCase().includes('rain') || iconName.toLowerCase().includes('drizzle');
    
    let colorClass = preferences.theme === 'light' ? 'text-slate-700' : 'text-slate-100';
    if (isSunny) colorClass = 'text-amber-400';
    else if (isThunder) colorClass = 'text-purple-400';
    else if (isRain) colorClass = 'text-sky-400';

    return <Icon className={`w-14 h-14 sm:w-16 sm:h-16 ${colorClass} transition-colors`} />;
  };

  const isLight = preferences.theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 overflow-x-hidden ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      
      {/* Calm dynamic atmospheric background */}
      <BackgroundAnimation type={weatherData?.condition.type || 'sunny'} />

      {/* Floating minimalist navbar */}
      <Navbar
        onSearch={searchCity}
        onRefresh={() => coords && fetchWeather(coords.latitude, coords.longitude)}
        onRequestLocation={requestLocation}
        isLocating={isLocating}
        preferences={preferences}
        onToggleUnit={toggleUnit}
        onToggleTheme={toggleTheme}
        favorites={favorites}
        recentSearches={recentSearches}
        isCurrentFavorite={isCurrentFavorite}
        onToggleFavorite={handleToggleFavorite}
        onSelectCity={handleSelectCity}
        onClearRecent={clearRecent}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col gap-5 relative z-10">
        
        {/* Offline & Error Banners */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Offline Mode: Showing locally cached forecast data.</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => requestLocation()}
                className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs font-medium transition-all shrink-0 cursor-pointer"
              >
                Use Location
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Toggle Tabs: Forecast / Radar */}
        <div className="flex items-center justify-center">
          <div className={`inline-flex items-center p-1 rounded-xl border ${
            isLight ? 'bg-slate-200/60 border-slate-300/60' : 'bg-white/5 border-white/10'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('forecast')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'forecast'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudSun className="w-3.5 h-3.5" />
              <span>Forecast</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'radar'
                  ? isLight
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Radar Map</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] text-center">
            <div className="w-10 h-10 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-4" />
            <p className={`text-sm font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Retrieving forecast data...
            </p>
          </div>
        ) : weatherData ? (
          <div className="flex flex-col gap-5">
            
            {/* View Tab 1: Primary Forecast */}
            {activeTab === 'forecast' ? (
              <>
                {/* Minimalist Hero Weather Banner */}
                <section aria-label="Current weather" className={`relative w-full p-6 sm:p-8 rounded-3xl border overflow-hidden backdrop-blur-xl transition-all ${
                  isLight
                    ? 'bg-white/80 border-slate-200/80 shadow-sm text-slate-900'
                    : 'bg-slate-900/50 border-white/10 shadow-lg text-slate-100'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    
                    {/* Left details */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>{location?.locality || location?.state || location?.country || 'Current Area'}</span>
                      </div>

                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-display">
                        {location?.city || 'Selected Location'}
                      </h1>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Min / Max Temperature Pill */}
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <span className={`px-2.5 py-1 rounded-full border font-mono font-medium ${
                          isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                        }`}>
                          H: {getTodayMinMax().max}  •  L: {getTodayMinMax().min}
                        </span>
                      </div>
                    </div>

                    {/* Right temperature & condition block */}
                    <div className="flex items-center gap-5 sm:justify-end">
                      <div className="text-left sm:text-right">
                        <div className="text-5xl sm:text-6xl font-bold tracking-tight font-display">
                          {formatTemp(weatherData.temp)}
                        </div>
                        <div className="text-sm font-semibold text-sky-500 mt-1">
                          {weatherData.condition.text}
                        </div>
                      </div>

                      {/* Icon */}
                      <div className={`p-3.5 rounded-2xl border ${
                        isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        {getHeaderIconComponent(weatherData.condition.icon)}
                      </div>
                    </div>

                  </div>
                </section>

                {/* Weather Alerts if available */}
                <WeatherAlerts alerts={weatherData.alerts} theme={preferences.theme} />

                {/* Hourly Horizontal Carousel */}
                <HourlyForecast hourlyData={weatherData.hourly} tempUnit={preferences.unit} theme={preferences.theme} />

                {/* Bento Grid & 7-Day Outlook */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  {/* Left (Bento 8 Metrics) */}
                  <div className="lg:col-span-2">
                    <BentoDetails weather={weatherData} tempUnit={preferences.unit} theme={preferences.theme} />
                  </div>

                  {/* Right (7-Day Outlook) */}
                  <div className="w-full">
                    <DailyForecast dailyData={weatherData.daily} tempUnit={preferences.unit} theme={preferences.theme} />
                  </div>
                </div>
              </>
            ) : (
              /* View Tab 2: Interactive Radar Map */
              <div className="flex flex-col gap-4">
                {coords && (
                  <WeatherMap
                    latitude={coords.latitude}
                    longitude={coords.longitude}
                    cityName={location?.city || 'Location'}
                    theme={preferences.theme}
                  />
                )}
              </div>
            )}

          </div>
        ) : (
          /* Empty / Fallback State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-white/5 bg-white/5">
            <Compass className="w-10 h-10 text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Location Selected</h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Search for any city above or allow browser geolocation to view live forecasts.
            </p>
          </div>
        )}
      </main>

      {/* Non-intrusive permission toast */}
      <AnimatePresence>
        {showLocationPopup && (
          <LocationPopup onAllow={requestLocation} onDecline={declineLocation} />
        )}
      </AnimatePresence>

      {/* Minimalist Footer */}
      <footer className="w-full py-4 text-center text-[11px] text-slate-400 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SkyPulse • Clean & Privacy-First Weather</span>
          <span>Powered by Open-Meteo & Nominatim</span>
        </div>
      </footer>

    </div>
  );
}
