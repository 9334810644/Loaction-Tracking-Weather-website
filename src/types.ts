export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationInfo {
  country: string;
  state: string;
  city: string;
  locality: string;
  displayName: string;
}

export interface WeatherCondition {
  text: string;
  icon: string;
  type: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'thunderstorm' | 'night' | 'fog';
  code: number;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  feelsLike: number;
  precipitationProb: number;
  weatherCode: number;
  condition: WeatherCondition;
}

export interface DailyForecastItem {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  condition: WeatherCondition;
  sunrise: string;
  sunset: string;
  precipitationProbMax: number;
}

export interface AirQuality {
  aqiUs: number;
  aqiEu: number;
  pm25: number;
  pm10: number;
  label: string;
  color: string;
}

export interface WeatherAlert {
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  sender: string;
  time: string;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  uvIndex: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  rainChance: number;
  cloudCover: number;
  dewPoint: number;
  condition: WeatherCondition;
  isDay: boolean;
  airQuality: AirQuality;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  alerts: WeatherAlert[];
}

export interface SavedCity {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country?: string;
  state?: string;
}

export interface UserPreferences {
  unit: 'c' | 'f';
  theme: 'light' | 'dark';
}
