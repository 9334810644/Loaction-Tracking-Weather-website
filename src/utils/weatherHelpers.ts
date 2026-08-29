import { WeatherCondition, AirQuality } from '../types';

/**
 * Decodes WMO weather code into condition text, type, and icons
 * @param code WMO Weather Code
 * @param isDay Day or Night indicator
 */
export function getWeatherCondition(code: number, isDay: boolean = true): WeatherCondition {
  // WMO Weather interpretation codes (WW)
  switch (code) {
    case 0:
      return {
        text: isDay ? 'Sunny' : 'Clear Night',
        icon: isDay ? 'Sun' : 'Moon',
        type: isDay ? 'sunny' : 'night',
        code,
      };
    case 1:
    case 2:
      return {
        text: isDay ? 'Partly Cloudy' : 'Partly Cloudy Night',
        icon: isDay ? 'CloudSun' : 'CloudMoon',
        type: isDay ? 'cloudy' : 'night',
        code,
      };
    case 3:
      return {
        text: 'Overcast',
        icon: 'Cloud',
        type: 'cloudy',
        code,
      };
    case 45:
    case 48:
      return {
        text: 'Foggy',
        icon: 'CloudFog',
        type: 'fog',
        code,
      };
    case 51:
    case 53:
    case 55:
      return {
        text: 'Drizzle',
        icon: 'CloudDrizzle',
        type: 'rainy',
        code,
      };
    case 56:
    case 57:
      return {
        text: 'Freezing Drizzle',
        icon: 'CloudSnow',
        type: 'snowy',
        code,
      };
    case 61:
    case 63:
      return {
        text: 'Moderate Rain',
        icon: 'CloudRain',
        type: 'rainy',
        code,
      };
    case 65:
      return {
        text: 'Heavy Rain',
        icon: 'CloudLightning',
        type: 'rainy',
        code,
      };
    case 66:
    case 67:
      return {
        text: 'Freezing Rain',
        icon: 'CloudSnow',
        type: 'snowy',
        code,
      };
    case 71:
    case 73:
      return {
        text: 'Light Snow',
        icon: 'Snowflake',
        type: 'snowy',
        code,
      };
    case 75:
    case 77:
      return {
        text: 'Heavy Snow',
        icon: 'Snowflake',
        type: 'snowy',
        code,
      };
    case 80:
    case 81:
    case 82:
      return {
        text: 'Rain Showers',
        icon: 'CloudRain',
        type: 'rainy',
        code,
      };
    case 85:
    case 86:
      return {
        text: 'Snow Showers',
        icon: 'CloudSnow',
        type: 'snowy',
        code,
      };
    case 95:
      return {
        text: 'Thunderstorm',
        icon: 'CloudLightning',
        type: 'thunderstorm',
        code,
      };
    case 96:
    case 99:
      return {
        text: 'Severe Thunderstorm',
        icon: 'CloudLightning',
        type: 'thunderstorm',
        code,
      };
    default:
      return {
        text: 'Unknown',
        icon: 'Cloud',
        type: 'cloudy',
        code,
      };
  }
}

/**
 * Returns wind direction label from degrees
 */
export function getWindDirectionLabel(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

/**
 * Parses US AQI and returns AirQuality status
 */
export function getAirQualityStatus(aqiUs: number, pm25: number, pm10: number): AirQuality {
  // US EPA Air Quality Index scale
  let label = 'Good';
  let color = '#22c55e'; // Green-500

  if (aqiUs > 300) {
    label = 'Hazardous';
    color = '#7f1d1d'; // Red-900
  } else if (aqiUs > 200) {
    label = 'Very Unhealthy';
    color = '#a855f7'; // Purple-500
  } else if (aqiUs > 150) {
    label = 'Unhealthy';
    color = '#ef4444'; // Red-500
  } else if (aqiUs > 100) {
    label = 'Unhealthy for Sensitive Groups';
    color = '#f97316'; // Orange-500
  } else if (aqiUs > 50) {
    label = 'Moderate';
    color = '#eab308'; // Yellow-500
  }

  return {
    aqiUs,
    aqiEu: Math.round(aqiUs * 0.8), // approximation for simple display
    pm25,
    pm10,
    label,
    color,
  };
}

/**
 * Format timestamp into simple AM/PM format
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch (e) {
    return '--:--';
  }
}

/**
 * Format date into simple short name (e.g. Mon, Jul 14)
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) {
    return '--';
  }
}

/**
 * Format day of week
 */
export function getDayOfWeek(isoString: string): string {
  try {
    const date = new Date(isoString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } catch (e) {
    return '--';
  }
}
