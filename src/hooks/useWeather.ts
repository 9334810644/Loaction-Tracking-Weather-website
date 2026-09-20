import { useState, useEffect, useCallback, useRef } from 'react';
import { Coordinates, LocationInfo, WeatherData, SavedCity, UserPreferences } from '../types';
import { getWeatherCondition, getAirQualityStatus } from '../utils/weatherHelpers';

const RECENT_SEARCHES_KEY = 'weather_recent_searches';
const FAVORITES_KEY = 'weather_favorites_cities';
const LAST_WEATHER_KEY = 'weather_last_cached';
const LAST_LOCATION_KEY = 'weather_last_location';

export function useWeather() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [location, setLocation] = useState<LocationInfo | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [locationChoiceMade, setLocationChoiceMade] = useState<boolean>(() => {
    return localStorage.getItem('weather_location_choice_made') === 'true';
  });

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const cachedUnit = localStorage.getItem('weather_unit');
    const cachedTheme = localStorage.getItem('weather_theme');
    return {
      unit: (cachedUnit === 'f' ? 'f' : 'c') as 'c' | 'f',
      theme: (cachedTheme === 'light' ? 'light' : 'dark') as 'light' | 'dark',
    };
  });

  // Location permission popup state
  const [showLocationPopup, setShowLocationPopup] = useState<boolean>(() => {
    return !localStorage.getItem('weather_location_choice_made');
  });

  // Search History & Favorites
  const [recentSearches, setRecentSearches] = useState<SavedCity[]>(() => {
    try {
      const data = localStorage.getItem(RECENT_SEARCHES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<SavedCity[]>(() => {
    try {
      const data = localStorage.getItem(FAVORITES_KEY);
      return data ? JSON.parse(data) : [
        { id: 'london', name: 'London', lat: 51.5074, lon: -0.1278, country: 'United Kingdom' },
        { id: 'newyork', name: 'New York', lat: 40.7128, lon: -74.0060, country: 'United States' },
        { id: 'tokyo', name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
      ];
    } catch {
      return [];
    }
  });

  // Save units & theme changes
  useEffect(() => {
    localStorage.setItem('weather_unit', preferences.unit);
  }, [preferences.unit]);

  useEffect(() => {
    localStorage.setItem('weather_theme', preferences.theme);
    // Sync class list with dark mode preference
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.theme]);

  // Load cached offline backup on boot
  useEffect(() => {
    const cachedWeather = localStorage.getItem(LAST_WEATHER_KEY);
    const cachedLocation = localStorage.getItem(LAST_LOCATION_KEY);
    const cachedCoords = localStorage.getItem('weather_last_coords');
    if (cachedWeather && cachedLocation) {
      try {
        setWeatherData(JSON.parse(cachedWeather));
        setLocation(JSON.parse(cachedLocation));
        if (cachedCoords) {
          setCoords(JSON.parse(cachedCoords));
        }
        setLoading(false);
      } catch {
        // ignore malformed cache
      }
    }
  }, []);

  // Set unit preferences helper
  const toggleUnit = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      unit: prev.unit === 'c' ? 'f' : 'c',
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferences(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  // Save favorites to storage
  const toggleFavorite = useCallback((city: SavedCity) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.lat === city.lat && f.lon === city.lon);
      let updated;
      if (exists) {
        updated = prev.filter(f => !(f.lat === city.lat && f.lon === city.lon));
      } else {
        updated = [...prev, city];
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addToRecent = useCallback((city: SavedCity) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(item => !(item.lat === city.lat && item.lon === city.lon));
      const updated = [city, ...filtered].slice(0, 5); // limit to 5
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  // Reverse Geocode (Nominatim - OSM)
  const reverseGeocode = async (lat: number, lon: number): Promise<LocationInfo> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=en`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'SkyPulseWeatherApp/1.0 (weather-app)',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to reverse geocode');
      const data = await response.json();

      const address = data.address || {};
      const country = address.country || '';
      const state = address.state || address.region || '';
      const city = address.city || address.town || address.village || address.suburb || address.municipality || 'Unknown City';
      const locality = address.suburb || address.neighbourhood || address.quarter || address.road || '';
      const displayName = data.display_name || `${city}, ${country}`;

      return { country, state, city, locality, displayName };
    } catch {
      return {
        country: '',
        state: '',
        city: 'Current Location',
        locality: '',
        displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      };
    }
  };

  // Main Weather Loader
  const fetchWeather = useCallback(async (latitude: number, longitude: number, providedLocation?: LocationInfo, silent: boolean = false) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      // 1. Fetch location info if not provided
      let locInfo = providedLocation;
      if (!locInfo) {
        locInfo = await reverseGeocode(latitude, longitude);
      }
      setLocation(locInfo);
      localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(locInfo));
      localStorage.setItem('weather_last_coords', JSON.stringify({ latitude, longitude }));

      // 2. Fetch Open-Meteo Weather data and Air Quality data in parallel
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,visibility,uv_index,dew_point_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;
      const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10`;

      const [weatherRes, aqiRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(aqiUrl)
      ]);

      if (!weatherRes.ok) throw new Error('Weather service failure');
      if (!aqiRes.ok) throw new Error('AQI service failure');

      const weather = await weatherRes.json();
      const aqiData = await aqiRes.json();

      // Parse Air Quality
      const aqiVal = aqiData.current?.us_aqi ?? 25;
      const pm25Val = aqiData.current?.pm2_5 ?? 5.5;
      const pm10Val = aqiData.current?.pm10 ?? 12.0;
      const airQuality = getAirQualityStatus(aqiVal, pm25Val, pm10Val);

      // Find closest index matching current hour for accurate hourly & current metric display
      const totalHourlyCount = weather.hourly.time.length;
      const nowIsoHour = new Date().toISOString().slice(0, 13); // e.g. "2026-08-16T18"
      let startIndex = weather.hourly.time.findIndex((t: string) => t.startsWith(nowIsoHour));
      if (startIndex === -1) {
        startIndex = 0;
      }

      // Parse Hourly (Take next 24 hours starting from current hour)
      const hourlyList = [];
      for (let i = startIndex; i < startIndex + 24 && i < totalHourlyCount; i++) {
        const time = weather.hourly.time[i];
        const temp = weather.hourly.temperature_2m[i];
        const feelsLike = weather.hourly.apparent_temperature[i];
        const precipitationProb = weather.hourly.precipitation_probability[i];
        const wCode = weather.hourly.weather_code[i];
        
        // Determine Day/Night based on hour of actual timestamp
        const hour = new Date(time).getHours();
        const isDayHour = hour >= 6 && hour < 19;

        hourlyList.push({
          time,
          temp,
          feelsLike,
          precipitationProb,
          weatherCode: wCode,
          condition: getWeatherCondition(wCode, isDayHour),
        });
      }

      // Parse Daily (7 Days)
      const dailyList = [];
      const totalDailyCount = weather.daily.time.length;
      for (let i = 0; i < 7 && i < totalDailyCount; i++) {
        const date = weather.daily.time[i];
        const tempMax = weather.daily.temperature_2m_max[i];
        const tempMin = weather.daily.temperature_2m_min[i];
        const wCode = weather.daily.weather_code[i];
        const sunrise = weather.daily.sunrise[i];
        const sunset = weather.daily.sunset[i];
        const precipitationProbMax = weather.daily.precipitation_probability_max[i];

        dailyList.push({
          date,
          tempMax,
          tempMin,
          weatherCode: wCode,
          condition: getWeatherCondition(wCode, true),
          sunrise,
          sunset,
          precipitationProbMax,
        });
      }

      // Dynamic Weather Alerts Scanner based on real physical properties
      const alerts = [];
      const uv = weather.daily.uv_index_max[0] ?? 0;
      const windSp = weather.current.wind_speed_10m ?? 0;
      const curTemp = weather.current.temperature_2m ?? 0;
      const prec = weather.current.precipitation ?? 0;

      if (uv > 7) {
        alerts.push({
          title: 'High UV Exposure Advisory',
          description: `UV Index is expected to peak at ${uv.toFixed(1)}. Wear sunscreen (SPF 30+), protective clothing, sunglasses, and a wide-brimmed hat. Limit direct sun exposure between 10 AM and 4 PM.`,
          severity: 'moderate' as const,
          sender: 'National Meteorology Center',
          time: new Date().toISOString(),
        });
      }
      if (windSp > 35) {
        alerts.push({
          title: 'Severe High Wind Alert',
          description: `Strong winds of ${windSp.toFixed(1)} km/h detected. Wind gusts can snap tree branches, cause isolated power outages, and create difficult driving conditions. Secure loose outdoor items.`,
          severity: 'severe' as const,
          sender: 'Severe Weather Warning Hub',
          time: new Date().toISOString(),
        });
      }
      if (curTemp > 38) {
        alerts.push({
          title: 'Extreme Heat Warning',
          description: `Dangerously hot conditions with temperature around ${curTemp.toFixed(1)}°C. Stay hydrated, avoid heavy physical work, and seek air-conditioned environments. Never leave children or pets in parked cars.`,
          severity: 'extreme' as const,
          sender: 'Department of Public Health',
          time: new Date().toISOString(),
        });
      } else if (curTemp < -2) {
        alerts.push({
          title: 'Frost Advisory',
          description: `Sub-zero temperatures of ${curTemp.toFixed(1)}°C can freeze crops, damage plumbing, and cause black ice on roadways. Protect sensitive vegetation and keep pets indoors.`,
          severity: 'moderate' as const,
          sender: 'Agriculture Extension Service',
          time: new Date().toISOString(),
        });
      }
      if (prec > 15) {
        alerts.push({
          title: 'Heavy Rainfall Warning',
          description: `Intense precipitation rate of ${prec.toFixed(1)} mm/hr. Localized flash flooding in low-lying fields or streets with clogged drains is possible. Avoid driving through waterlogged corridors.`,
          severity: 'severe' as const,
          sender: 'Hydrology Division Office',
          time: new Date().toISOString(),
        });
      }

      // Fallback standard warning to explain context if needed, but only if alerts are empty
      if (alerts.length === 0) {
        if (weather.current.weather_code === 95 || weather.current.weather_code === 96 || weather.current.weather_code === 99) {
          alerts.push({
            title: 'Thunderstorm Warning',
            description: 'Active severe thunderstorm in the vicinity. Remain indoors, avoid electric outlets, and keep away from windows.',
            severity: 'severe' as const,
            sender: 'National Severe Storm Center',
            time: new Date().toISOString(),
          });
        }
      }

      // Compile everything together
      const condition = getWeatherCondition(weather.current.weather_code, weather.current.is_day === 1);
      
      const parsedData: WeatherData = {
        temp: weather.current.temperature_2m,
        feelsLike: weather.current.apparent_temperature,
        humidity: weather.current.relative_humidity_2m,
        windSpeed: weather.current.wind_speed_10m,
        windDirection: weather.current.wind_direction_10m,
        pressure: weather.current.pressure_msl,
        uvIndex: uv,
        visibility: weather.hourly.visibility[startIndex] ? weather.hourly.visibility[startIndex] / 1000 : 10.0, // convert meters to km
        sunrise: weather.daily.sunrise[0],
        sunset: weather.daily.sunset[0],
        rainChance: weather.daily.precipitation_probability_max[0] ?? 0,
        cloudCover: weather.current.cloud_cover,
        dewPoint: weather.hourly.dew_point_2m[startIndex] ?? 12,
        condition,
        isDay: weather.current.is_day === 1,
        airQuality,
        hourly: hourlyList,
        daily: dailyList,
        alerts,
      };

      setWeatherData(parsedData);
      localStorage.setItem(LAST_WEATHER_KEY, JSON.stringify(parsedData));
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Unable to retrieve weather data. Check your connection or query.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  // Helper to fetch IP-based coarse geolocation when GPS is denied or restricted
  const fetchIPLocation = async (): Promise<{ lat: number; lon: number; locInfo?: LocationInfo } | null> => {
    // Try ipwho.is (fast, no rate limits for client queries)
    try {
      const response = await fetch('https://ipwho.is/');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.latitude && data.longitude) {
          const city = data.city || 'Current Location';
          const country = data.country || '';
          const state = data.region || '';
          return {
            lat: data.latitude,
            lon: data.longitude,
            locInfo: {
              city,
              country,
              state,
              locality: '',
              displayName: `${city}${country ? ', ' + country : ''}`,
            },
          };
        }
      }
    } catch (e) {
      // Try next IP fallback
    }

    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const city = data.city || 'Current Location';
          const country = data.country_name || '';
          const state = data.region || '';
          return {
            lat: data.latitude,
            lon: data.longitude,
            locInfo: {
              city,
              country,
              state,
              locality: '',
              displayName: `${city}${country ? ', ' + country : ''}`,
            },
          };
        }
      }
    } catch (e) {
      // Try next IP fallback
    }

    try {
      const response = await fetch('https://freeipapi.com/api/json');
      if (response.ok) {
        const data = await response.json();
        if (data.latitude && data.longitude) {
          const city = data.cityName || 'Current Location';
          const country = data.countryName || '';
          const state = data.regionName || '';
          return {
            lat: data.latitude,
            lon: data.longitude,
            locInfo: {
              city,
              country,
              state,
              locality: '',
              displayName: `${city}${country ? ', ' + country : ''}`,
            },
          };
        }
      }
    } catch (e) {
      // Ignore
    }

    return null;
  };

  // Request browser location permission & pull coords (with automatic IP fallback)
  const requestLocation = useCallback(async () => {
    localStorage.setItem('weather_location_choice_made', 'true');
    setLocationChoiceMade(true);
    setShowLocationPopup(false);
    setLoading(true);
    setIsLocating(true);
    setError(null);

    const applyLocationSuccess = async (latitude: number, longitude: number, providedLocation?: LocationInfo) => {
      const crds = { latitude, longitude };
      setCoords(crds);
      await fetchWeather(latitude, longitude, providedLocation);
      setIsLocating(false);
    };

    const handleIPFallback = async (reasonNotice?: string) => {
      console.warn("Attempting IP-based geolocation fallback...", reasonNotice);
      const ipData = await fetchIPLocation();
      if (ipData) {
        await applyLocationSuccess(ipData.lat, ipData.lon, ipData.locInfo);
        if (reasonNotice) {
          setError(`${reasonNotice} Showing estimated weather for ${ipData.locInfo?.city || 'your area'} based on IP.`);
        }
      } else {
        if (reasonNotice) {
          setError(`${reasonNotice} IP lookup also failed. Displaying default weather.`);
        }
        await applyLocationSuccess(51.5074, -0.1278, {
          city: 'London',
          country: 'United Kingdom',
          state: 'England',
          locality: 'Westminster',
          displayName: 'London, United Kingdom',
        });
      }
      setIsLocating(false);
    };

    if (!navigator.geolocation) {
      await handleIPFallback('Browser geolocation is not supported.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const crds = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        await applyLocationSuccess(crds.latitude, crds.longitude);
      },
      async (err) => {
        let msg = 'Browser location permission was denied in settings.';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'Location signal unavailable.';
        if (err.code === err.TIMEOUT) msg = 'Location request timed out.';
        
        await handleIPFallback(msg);
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 30000 }
    );
  }, [fetchWeather]);

  // Deny permission action
  const declineLocation = useCallback(async () => {
    localStorage.setItem('weather_location_choice_made', 'true');
    setLocationChoiceMade(true);
    setShowLocationPopup(false);
    setLoading(true);
    setIsLocating(true);
    
    // Automatically try IP location so the user still gets local weather without prompt
    const ipData = await fetchIPLocation();
    if (ipData) {
      setCoords({ latitude: ipData.lat, longitude: ipData.lon });
      await fetchWeather(ipData.lat, ipData.lon, ipData.locInfo);
    } else {
      await fetchWeather(51.5074, -0.1278, {
        city: 'London',
        country: 'United Kingdom',
        state: 'England',
        locality: 'Westminster',
        displayName: 'London, United Kingdom',
      });
    }
    setIsLocating(false);
  }, [fetchWeather]);

  // Search a city manually
  const searchCity = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=en`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'SkyPulseWeatherApp/1.0 (weather-app)',
          },
        }
      );
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      
      if (!data || data.length === 0) {
        throw new Error('City not found. Please try a different name.');
      }

      const match = data[0];
      const lat = parseFloat(match.lat);
      const lon = parseFloat(match.lon);
      
      // Parse detailed address elements
      const displayParts = match.display_name.split(', ');
      const city = displayParts[0] || 'Unknown City';
      const country = displayParts[displayParts.length - 1] || 'Unknown Country';
      const state = displayParts[displayParts.length - 2] || '';
      
      const locInfo: LocationInfo = {
        city,
        country,
        state,
        locality: displayParts[1] || '',
        displayName: match.display_name,
      };

      const cityObj: SavedCity = {
        id: `${lat.toFixed(4)}_${lon.toFixed(4)}`,
        name: city,
        lat,
        lon,
        country,
        state,
      };

      addToRecent(cityObj);
      setCoords({ latitude: lat, longitude: lon });
      await fetchWeather(lat, lon, locInfo);
    } catch (err: any) {
      setError(err?.message || 'Search query failed.');
      setLoading(false);
    }
  }, [addToRecent, fetchWeather]);

  // Initial load on component mount (runs once only)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Load cached coordinates for immediate UI display if available
    const cachedCoords = localStorage.getItem('weather_last_coords');
    if (cachedCoords) {
      try {
        const { latitude, longitude } = JSON.parse(cachedCoords);
        setCoords({ latitude, longitude });
        fetchWeather(latitude, longitude, undefined, true);
      } catch (e) {
        // ignore
      }
    }

    // Always fetch fresh current location on startup
    requestLocation();
  }, [fetchWeather, requestLocation]);

  return {
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
  };
}
