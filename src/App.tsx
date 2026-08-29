import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Clock,
  CloudLightning,
  AlertCircle,
  TrendingUp,
  Activity,
  Heart,
  Globe,
  Compass,
  Info
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
import { OwnerDashboard } from './components/OwnerDashboard';

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

  const [isOwnerView, setIsOwnerView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('role') === 'owner' || params.get('owner') === 'true';
  });

  // Listen to popstate to handle back/forward navigation or manual URL updates
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setIsOwnerView(params.get('role') === 'owner' || params.get('owner') === 'true');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Live clock state (updated every 60s for hours and minutes)
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

  if (isOwnerView) {
    return (
      <OwnerDashboard
        theme={preferences.theme}
        onBackToUserView={() => {
          setIsOwnerView(false);
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    );
  }

  // Compute if current spot is favorite
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

  // Convert celsius temperature for display based on preference
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

  // Get dynamic weather icon component for primary header card
  const getHeaderIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.Cloud;
    const isSunny = iconName.toLowerCase().includes('sun');
    const isThunder = iconName.toLowerCase().includes('lightning') || iconName.toLowerCase().includes('bolt');
    const isRain = iconName.toLowerCase().includes('rain') || iconName.toLowerCase().includes('drizzle');
    
    let iconClass = "w-16 h-16 md:w-20 md:h-20 drop-shadow-xl transition-all duration-300";
    if (isSunny) {
      iconClass += " text-amber-400 sleek-glow-yellow";
    } else if (isThunder) {
      iconClass += " text-purple-400 sleek-glow-blue";
    } else if (isRain) {
      iconClass += " text-sky-400 sleek-glow-blue";
    } else {
      iconClass += preferences.theme === 'light' ? " text-slate-700" : " text-slate-100";
    }

    return <Icon className={iconClass} />;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 overflow-x-hidden ${preferences.theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      
      {/* 1. Dynamic weather animated background (Canvas-driven) */}
      <BackgroundAnimation type={weatherData?.condition.type || 'sunny'} />

      {/* 2. Frosted Navbar */}
      <Navbar
        onSearch={searchCity}
        onRefresh={() => coords && fetchWeather(coords.latitude, coords.longitude)}
        onRequestLocation={requestLocation}
        onOpenOwnerView={() => {
          setIsOwnerView(true);
          window.history.pushState({}, '', '?role=owner');
        }}
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

      {/* Main Layout Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 relative z-10">
        
        {/* Offline & Error Banners */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-medium shadow-md shadow-amber-500/5 select-none"
            >
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Offline Mode: Displaying last cached weather details stored locally.</span>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs font-medium shadow-md shadow-rose-500/5"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => requestLocation()}
                className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold transition-all shadow-md cursor-pointer shrink-0"
              >
                📍 Use My Location
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay - Skeletons or elegant spinner */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[450px]">
            <div className="relative flex items-center justify-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-t-2 border-r-2 border-sky-400 border-b-0 border-l-0"
              />
              <div className="absolute p-3 rounded-full bg-sky-500/10 text-sky-400">
                <CloudLightning className="w-6 h-6 animate-pulse" />
              </div>
            </div>
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-lg font-semibold tracking-wide font-sans ${preferences.theme === 'light' ? 'text-slate-800' : 'text-white'}`}
            >
              Syncing atmospheric currents...
            </motion.h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Fetching Open-Meteo & Nominatim metrics
            </p>
          </div>
        ) : weatherData ? (
          <div className="flex flex-col gap-6">
            
            {/* Primary Glass Header Hero Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`relative w-full p-6 md:p-8 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                preferences.theme === 'light' ? 'sleek-card-light text-slate-800' : 'sleek-card-dark text-slate-100'
              }`}
            >
              {/* Radial ambient glow corresponding to time */}
              <div className={`absolute -right-20 -top-20 w-96 h-96 rounded-full blur-[110px] pointer-events-none -z-10 transition-colors duration-1000 ${
                weatherData.isDay ? 'bg-sky-500/20' : 'bg-indigo-500/15'
              }`} />
              <div className={`absolute -left-20 -bottom-20 w-80 h-80 rounded-full blur-[90px] pointer-events-none -z-10 transition-colors duration-1000 ${
                weatherData.condition.type === 'sunny' ? 'bg-amber-500/15' : 'bg-blue-600/15'
              }`} />
              
              {/* Left Details block */}
              <div className="flex flex-col gap-1 z-10">
                {/* Location with map pin */}
                <div className={`flex items-center gap-1.5 ${preferences.theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                  <MapPin className="w-4 h-4 text-sky-400 animate-bounce-slow" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {location?.locality || location?.state || 'Current Location'}
                  </span>
                </div>
                
                {/* City Name */}
                <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight font-sans mt-1 ${
                  preferences.theme === 'light' ? 'text-slate-950' : 'text-white'
                }`}>
                  {location?.city || 'Unknown Location'}
                </h1>
                
                {/* Country and Region */}
                <p className={`text-xs font-mono mt-0.5 ${preferences.theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {[location?.state, location?.country].filter(Boolean).join(', ')}
                </p>

                {/* Clock & Sync time */}
                <div className={`flex items-center gap-2 mt-4 text-xs px-3.5 py-1.5 rounded-full w-fit border backdrop-blur-md transition-all ${
                  preferences.theme === 'light' 
                    ? 'text-slate-700 bg-slate-900/5 border-slate-900/10' 
                    : 'text-slate-300 bg-white/5 border-white/10'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span className="font-mono font-semibold">
                    {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} • {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Right Primary Weather Stats block */}
              <div className={`flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 z-10 ${
                preferences.theme === 'light' ? 'border-slate-900/10' : 'border-white/10'
              }`}>
                <div className="text-right flex flex-col justify-center">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className={`text-6xl md:text-7xl font-extrabold tracking-tighter font-display ${
                      preferences.theme === 'light' ? 'text-slate-950' : 'text-white'
                    }`}>
                      {formatTemp(weatherData.temp)}
                    </span>
                  </div>
                  
                  {/* Weather description */}
                  <span className={`text-base font-bold mt-1 md:mt-0 font-sans ${
                    preferences.theme === 'light' ? 'text-sky-600' : 'text-sky-300'
                  }`}>
                    {weatherData.condition.text}
                  </span>
                  
                  {/* Min / Max bounds */}
                  <p className={`text-xs font-semibold mt-1 ${preferences.theme === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    H: <span className={`${preferences.theme === 'light' ? 'text-slate-950' : 'text-white'} font-mono font-bold`}>{getTodayMinMax().max}</span> • L: <span className={`${preferences.theme === 'light' ? 'text-slate-950' : 'text-white'} font-mono font-bold`}>{getTodayMinMax().min}</span>
                  </p>
                </div>

                {/* Large responsive Floating icon with hover bounce */}
                <motion.div
                  whileHover={{ scale: 1.12, rotate: 4 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                  className={`p-5 rounded-3xl shadow-xl cursor-pointer shrink-0 border backdrop-blur-xl ${
                    preferences.theme === 'light' 
                      ? 'bg-slate-900/5 border-slate-900/10 shadow-slate-900/10' 
                      : 'bg-white/5 border-white/10 shadow-black/20'
                  }`}
                >
                  {getHeaderIconComponent(weatherData.condition.icon)}
                </motion.div>
              </div>
            </motion.div>

            {/* Weather Alerts if available */}
            <WeatherAlerts alerts={weatherData.alerts} theme={preferences.theme} />

            {/* Dashboard grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Left Column: Hourly + Bento details (spans 2 columns) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Hourly Forecast */}
                <HourlyForecast hourlyData={weatherData.hourly} tempUnit={preferences.unit} theme={preferences.theme} />

                {/* Detailed Parameters Bento */}
                <BentoDetails weather={weatherData} tempUnit={preferences.unit} theme={preferences.theme} />
                
              </div>

              {/* Right Column: 7-Day Forecast */}
              <div className="flex flex-col gap-6">
                
                {/* 7-Day Forecast card */}
                <DailyForecast dailyData={weatherData.daily} tempUnit={preferences.unit} theme={preferences.theme} />

              </div>

            </div>

          </div>
        ) : (
          /* Empty or fallback if something went wrong */
          <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-900/30 border border-white/5 rounded-3xl backdrop-blur-sm text-center">
            <AlertCircle className="w-12 h-12 text-slate-500 mb-3" />
            <h3 className="text-lg font-semibold text-slate-300">No Atmospheric Data Loaded</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Please click the "📍 Allow Location" button or search for any city in the search bar above to generate forecasts.
            </p>
          </div>
        )}
      </main>

      {/* Geolocation popup request */}
      <AnimatePresence>
        {showLocationPopup && (
          <LocationPopup onAllow={requestLocation} onDecline={declineLocation} />
        )}
      </AnimatePresence>

      {/* Footer explaining security & privacy rules */}
      <footer className="w-full text-center py-6 mt-12 border-t border-white/5 bg-slate-950/20 text-[11px] text-slate-500 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 SkyPulse Weather Dashboard. Atmospheric predictions generated via Open-Meteo API.
            <button
              onClick={() => {
                setIsOwnerView(true);
                window.history.pushState({}, '', '?role=owner');
              }}
              className="hover:underline text-rose-400 hover:text-rose-300 font-bold ml-1.5 cursor-pointer inline-flex items-center gap-1"
            >
              🔒 Owner Portal
            </button>
          </p>
          <div className="flex items-center gap-1 text-slate-400">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Privacy: Location data processed entirely within the client container.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
