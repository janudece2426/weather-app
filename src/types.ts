export interface WeatherData {
  location: string;
  source: "OpenWeather" | "Gemini AI Search" | "Default Simulator";
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    condition: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy";
    conditionText: string;
    windSpeed: string;
    airQuality: string;
    lastUpdated: string;
    tip: string;
  };
  forecast: Array<{
    day: string;
    temp: number;
    humidity: number;
    condition: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy";
    conditionText: string;
  }>;
}

export interface SearchHistoryItem {
  id: string;
  city: string;
  temp: number;
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy";
  timestamp: string;
}
