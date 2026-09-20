import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, RefreshCw, Sun, Moon, History, Bookmark, MapPin, X, Sparkles } from 'lucide-react';
import { SavedCity, UserPreferences } from '../types';

interface NavbarProps {
  onSearch: (query: string) => void;
  onRefresh: () => void;
  onRequestLocation?: () => void;
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowDropdown(true);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowDropdown(false);
    }
  };

  const handleCitySelect = (city: SavedCity) => {
    onSelectCity(city.lat, city.lon, city.name, city.country);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const isLight = preferences.theme === 'light';

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3 transition-colors duration-300">
      <div className={`max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-xl transition-all ${
        isLight
          ? 'bg-white/80 border-slate-200/80 shadow-sm shadow-slate-200/50 text-slate-800'
          : 'bg-slate-900/60 border-white/10 shadow-lg shadow-black/20 text-slate-100'
      }`}>
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 shrink-0 select-none">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">
            Sky<span className="text-sky-500">Pulse</span>
          </span>
        </div>

        {/* Minimalist Search Bar */}
        <div className="relative flex-1 max-w-sm sm:max-w-md mx-2">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className={`absolute left-3.5 w-4 h-4 pointer-events-none transition-colors ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search city... (Press / to search)"
              className={`w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border transition-all outline-none ${
                isLight
                  ? 'bg-slate-100/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15'
                  : 'bg-white/5 border-white/10 text-slate-100 placeholder:text-slate-500 focus:bg-white/10 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/15'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute right-2.5 p-1 rounded-md transition-colors ${
                  isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Clean Floating Suggestions Dropdown */}
          <AnimatePresence>
            {showDropdown && (favorites.length > 0 || recentSearches.length > 0) && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowDropdown(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className={`absolute top-full left-0 right-0 mt-2 z-30 p-3 rounded-2xl border shadow-xl backdrop-blur-2xl max-h-80 overflow-y-auto ${
                    isLight
                      ? 'bg-white/95 border-slate-200 shadow-slate-900/10'
                      : 'bg-slate-900/95 border-white/10 shadow-black/40'
                  }`}
                >
                  {/* Favorites */}
                  {favorites.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-500 uppercase tracking-wider px-1 mb-1.5">
                        <Bookmark className="w-3 h-3" />
                        <span>Saved Places</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {favorites.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => handleCitySelect(city)}
                            className={`flex items-center gap-2 p-2 text-left text-xs font-medium rounded-xl transition-colors truncate ${
                              isLight
                                ? 'hover:bg-slate-100 text-slate-700'
                                : 'hover:bg-white/10 text-slate-200'
                            }`}
                          >
                            <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            <span className="truncate">{city.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider px-1 mb-1.5">
                        <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                          <History className="w-3 h-3" />
                          Recent
                        </span>
                        <button
                          type="button"
                          onClick={onClearRecent}
                          className="text-[10px] text-sky-500 hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {recentSearches.map((city) => (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => handleCitySelect(city)}
                            className={`flex items-center justify-between p-2 text-left text-xs rounded-xl transition-colors ${
                              isLight
                                ? 'hover:bg-slate-100 text-slate-700'
                                : 'hover:bg-white/10 text-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{city.name}</span>
                            </span>
                            {city.country && (
                              <span className={`text-[10px] truncate ml-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                                {city.country}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Unified Control Pill */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${
          isLight ? 'bg-slate-100/80 border-slate-200/80' : 'bg-white/5 border-white/10'
        }`}>
          {/* My Location */}
          {onRequestLocation && (
            <button
              type="button"
              onClick={onRequestLocation}
              title="Use current location"
              aria-label="Use current location"
              className={`p-1.5 rounded-lg transition-all ${
                isLocating
                  ? 'bg-sky-500 text-white animate-pulse'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <MapPin className="w-4 h-4" />
            </button>
          )}

          {/* Bookmark / Favorite current */}
          <button
            type="button"
            onClick={onToggleFavorite}
            title={isCurrentFavorite ? 'Remove from favorites' : 'Save location'}
            aria-label="Toggle favorite"
            className={`p-1.5 rounded-lg transition-all ${
              isCurrentFavorite
                ? 'text-rose-500'
                : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-rose-500' : ''}`} />
          </button>

          {/* Temperature Unit */}
          <button
            type="button"
            onClick={onToggleUnit}
            title="Switch temperature unit"
            aria-label="Toggle unit"
            className={`px-2 py-1 text-xs font-mono font-semibold rounded-lg transition-all ${
              isLight
                ? 'text-slate-700 hover:text-slate-900 hover:bg-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            °{preferences.unit.toUpperCase()}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
            className={`p-1.5 rounded-lg transition-all ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh weather"
            aria-label="Refresh data"
            className={`p-1.5 rounded-lg transition-all ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-white'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
