import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, RefreshCw, Sun, Moon, History, Star, MapPin, Shield } from 'lucide-react';
import { SavedCity, UserPreferences } from '../types';

interface NavbarProps {
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onRequestLocation?: () => void;
  onOpenOwnerView?: () => void;
  isLocating?: boolean;
  preferences: UserPreferences;
  onToggleUnit: () => void;
  onToggleTheme: () => void;
  favorites: SavedCity[];
  recentSearches: SavedCity[];
  isCurrentFavorite: boolean;
  onToggleFavorite: () => void;
  onSelectCity: (lat: number, lon: number, name: string, country?: string) => void;
  onClearRecent: () => void;
}

export function Navbar({
  onSearch,
  onRefresh,
  onRequestLocation,
  onOpenOwnerView,
  isLocating,
  preferences,
  onToggleUnit,
  onToggleTheme,
  favorites,
  recentSearches,
  isCurrentFavorite,
  onToggleFavorite,
  onSelectCity,
  onClearRecent,
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
      setShowDropdown(false);
    }
  };

  const handleCitySelect = (city: SavedCity) => {
    onSelectCity(city.lat, city.lon, city.name, city.country);
    setShowDropdown(false);
  };

  return (
    <nav className={`sticky top-0 z-40 w-full border-b transition-all duration-300 px-4 py-3 ${
      preferences.theme === 'light' 
        ? 'bg-white/80 border-slate-200/50 backdrop-blur-md text-slate-800 shadow-sm' 
        : 'bg-slate-950/40 border-white/10 backdrop-blur-md text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Branding & Clock */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <span className={`text-xl font-bold tracking-tight font-sans ${preferences.theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Sky<span className="text-sky-500">Pulse</span>
            </span>
            <span className={`ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              preferences.theme === 'light' 
                ? 'bg-slate-900/5 border-slate-900/5 text-slate-500' 
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}>
              v1.0.0
            </span>
          </div>
        </div>

        {/* Search Bar Block */}
        <div className="relative w-full md:max-w-md shrink-0">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search city, state or country..."
              className={`w-full pl-10 pr-12 py-2.5 text-sm transition-all focus:outline-none ${
                preferences.theme === 'light'
                  ? 'sleek-input-light text-slate-900 placeholder:text-slate-400'
                  : 'sleek-input-dark text-slate-100 placeholder:text-slate-500'
              }`}
            />
            <Search className={`absolute left-3.5 w-4 h-4 ${preferences.theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`} />
            
            {searchQuery && (
              <button
                type="submit"
                className="absolute right-3.5 text-xs text-sky-500 hover:text-sky-600 font-medium cursor-pointer"
              >
                Search
              </button>
            )}
          </form>

          {/* Quick-Access Dropdown for Favorites and Recent Searches */}
          <AnimatePresence>
            {showDropdown && (favorites.length > 0 || recentSearches.length > 0) && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowDropdown(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`absolute top-full left-0 right-0 mt-2 z-20 overflow-hidden border rounded-3xl shadow-2xl p-4 backdrop-blur-2xl transition-all ${
                    preferences.theme === 'light' 
                      ? 'bg-white/95 border-slate-200/80 shadow-slate-900/10' 
                      : 'bg-slate-950/90 border-white/10 shadow-black/40'
                  }`}
                >
                  {/* Favorites List */}
                  {favorites.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-500 uppercase tracking-wider mb-2">
                        <Star className="w-3.5 h-3.5 fill-sky-500/10" />
                        Saved Locations
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {favorites.map((city) => (
                          <motion.button
                            key={city.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleCitySelect(city)}
                            className={`flex items-center gap-2 p-2.5 text-left text-xs font-semibold rounded-2xl border transition-all text-ellipsis overflow-hidden whitespace-nowrap cursor-pointer ${
                              preferences.theme === 'light'
                                ? 'text-slate-700 hover:text-slate-950 bg-slate-900/5 hover:bg-slate-900/10 border-transparent'
                                : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border-white/5'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-sky-400" />
                            <span className="truncate">{city.name}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className={`flex items-center justify-between text-xs font-bold uppercase tracking-wider mb-2 ${
                        preferences.theme === 'light' ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span className="flex items-center gap-1.5">
                          <History className="w-3.5 h-3.5 text-sky-400" />
                          Recent Searches
                        </span>
                        <button
                          onClick={onClearRecent}
                          className="text-[10px] font-bold lowercase text-sky-500 hover:text-sky-600 transition-colors cursor-pointer"
                        >
                          clear
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {recentSearches.map((city) => (
                          <motion.button
                            key={city.id}
                            whileHover={{ x: 4 }}
                            onClick={() => handleCitySelect(city)}
                            className={`flex items-center justify-between p-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                              preferences.theme === 'light'
                                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-900/5'
                                : 'text-slate-300 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <span className="flex items-center gap-2 text-ellipsis overflow-hidden whitespace-nowrap">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{city.name}</span>
                              {city.country && (
                                <span className="text-[11px] text-slate-500 font-normal">({city.country})</span>
                              )}
                            </span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2.5">
          {/* My Location Button */}
          {onRequestLocation && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRequestLocation}
              id="btn-request-location"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border transition-all cursor-pointer text-xs font-bold ${
                isLocating
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 animate-pulse ring-1 ring-sky-400/30'
                  : preferences.theme === 'light'
                    ? 'bg-sky-500/10 border-sky-500/20 text-sky-600 hover:bg-sky-500/20'
                    : 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/25'
              }`}
              title="Fetch weather for my current location"
            >
              <MapPin className={`w-4 h-4 text-sky-400 ${isLocating ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">My Location</span>
            </motion.button>
          )}

          {/* Add Favorite Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleFavorite}
            id="btn-toggle-favorite"
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              isCurrentFavorite
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-500 shadow-lg shadow-rose-500/10'
                : preferences.theme === 'light'
                  ? 'bg-slate-900/5 border-slate-900/5 text-slate-600 hover:bg-slate-900/10 hover:text-slate-800'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Favorite this location"
          >
            <Heart className={`w-5 h-5 ${isCurrentFavorite ? 'fill-rose-500' : ''}`} />
          </motion.button>

          {/* Unit Switcher */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={onToggleUnit}
            id="btn-toggle-unit"
            className={`flex items-center gap-1 px-3.5 py-2 rounded-2xl border font-mono text-xs font-extrabold transition-all cursor-pointer ${
              preferences.theme === 'light'
                ? 'bg-slate-900/5 border-slate-900/5 text-slate-700 hover:bg-slate-900/10 hover:text-slate-950'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle Temperature Unit"
          >
            <span>°{preferences.unit.toUpperCase()}</span>
          </motion.button>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.9 }}
            onClick={onToggleTheme}
            id="btn-toggle-theme"
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              preferences.theme === 'light'
                ? 'bg-slate-900/5 border-slate-900/5 text-slate-600 hover:bg-slate-900/10 hover:text-slate-800'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Toggle theme (Light / Dark)"
          >
            {preferences.theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-400 sleek-glow-yellow" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </motion.button>

          {/* Owner Portal Button */}
          {onOpenOwnerView && (
            <motion.button
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenOwnerView}
              id="btn-owner-portal"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border transition-all cursor-pointer text-xs font-bold ${
                preferences.theme === 'light'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 hover:bg-rose-500/20'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400 hover:bg-rose-500/25 shadow-lg shadow-rose-500/10'
              }`}
              title="Open Owner Geolocation Portal"
            >
              <Shield className="w-4 h-4 text-rose-500" />
              <span className="hidden lg:inline">Owner Portal</span>
            </motion.button>
          )}

          {/* Refresh Button */}
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRefresh}
            id="btn-refresh-weather"
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
              preferences.theme === 'light'
                ? 'bg-slate-900/5 border-slate-900/5 text-slate-600 hover:bg-slate-900/10 hover:text-slate-800'
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Refresh current conditions"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>

      </div>
    </nav>
  );
}
