import React, { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Clock, 
  RotateCcw, 
  History, 
  HelpCircle, 
  ArrowRight,
  TrendingUp, 
  Terminal,
  X,
  Gauge
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { WeatherData, SearchHistoryItem } from "./types";
import WeatherIcon from "./components/WeatherIcon";
import WeatherStats from "./components/WeatherStats";
import AITipCard from "./components/AITipCard";
import ForecastList from "./components/ForecastList";

const DEFAULT_CITY = "서울";

// ✨ 1. OpenWeatherMap과 완벽 연동되도록 상단 버튼의 영문 이름 구조 정렬!
const POPULAR_CITIES = [
  { name: "Seoul", label: "서울" },
  { name: "Busan", label: "부산" },
  { name: "Jeju", label: "제주" },
  { name: "New York", label: "뉴욕" },
  { name: "London", label: "런던" },
  { name: "Tokyo", label: "도쿄" },
  { name: "Paris", label: "파리" }
];

// 백엔드 역할을 하던 매퍼 함수들을 클라이언트로 이관
function mapOpenWeatherCondition(id?: number): "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy" {
  if (!id) return "sunny";
  if (id >= 200 && id < 300) return "stormy";
  if (id >= 300 && id < 600) return "rainy";
  if (id >= 600 && id < 700) return "snowy";
  if (id >= 701 && id < 800) return "foggy";
  if (id === 800) return "sunny";
  if (id > 800 && id < 804) return "cloudy";
  if (id === 804) return "cloudy";
  return "cloudy";
}

function getStandardConditionTip(condition: string, temp: number): string {
  if (temp < 5) return "날씨가 꽤 춥습니다. 따뜻한 외투와 목도리를 꼭 챙기시고 건강에 유의하세요!";
  if (temp > 28) return "햇살이 뜨거운 한여름 날씨입니다. 충분한 수분 섭취와 비타민 충전을 잊지 마세요! 🌞";
  
  switch (condition) {
    case "sunny": return "오늘은 하늘이 아주 맑고 화창하네요. 기분 좋은 산책을 즐기기 위해 밖으로 나서볼까요?";
    case "cloudy": return "하늘에 구름이 가득 찬 흐린 날입니다. 은은한 필터링 채광 속에 차 한잔의 여유를 즐겨보세요.";
    case "rainy": return "추적추적 기분 좋은 빗소리가 들립니다. 외출하실 때 우산을 잊지 말고 꼭 챙기세요. ☔";
    case "snowy": return "온 세상이 하얗게 덮이는 눈 오는 날입니다! 길이 미끄러울 수 있으니 걸음마다 조심하세요. ❄️";
    case "stormy": return "천둥번개를 동반한 거친 날씨입니다. 가급적 안전하고 아늑한 실내에 머무르는 것을 권장해요.";
    case "windy": return "바람이 매우 싱그럽게 부는 날입니다. 날리는 머리칼을 정리하며 시원한 바람결을 느껴보세요.";
    case "foggy": return "눈앞이 하얗게 흐려지는 안개 낀 날입니다. 가시거리가 짧으니 온종일 서행 및 안전운전 하세요.";
    default: return "기분 좋은 행운이 가득한 오늘 하루가 되시기를 바랍니다!";
  }
}

function generateFallbackForecast(baseTemp: number, conditionCode: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy" = "sunny") {
  const days = ["내일", "모레", "글피(3일 뒤)", "4일 뒤"];
  const conditions: Array<"sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy"> = ["sunny", "cloudy", "rainy", "windy", "foggy"];
  const condTexts = {
    sunny: "맑음", cloudy: "대체로 흐림", rainy: "가끔 비", snowy: "진눈깨비", stormy: "뇌우 동반", windy: "바람 많이 붊", foggy: "옅은 안개"
  };

  return days.map((day, index) => {
    const tempOffset = [1, -2, -1, 2][index] || 0;
    const humOffset = [5, -8, 12, -4][index] || 0;
    let chosenCond = conditionCode;
    if (index > 0) {
      const idx = Math.abs((Math.round(baseTemp) + index) % conditions.length);
      chosenCond = conditions[idx];
    }
    return {
      day,
      temp: Math.round(baseTemp) + tempOffset,
      humidity: Math.min(Math.max(45 + humOffset, 20), 100),
      condition: chosenCond,
      conditionText: condTexts[chosenCond],
    };
  });
}

export default function App() {
  const [cityInput, setCityInput] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("weather_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [explainOpen, setExplainOpen] = useState(false);
  const [timeStr, setTimeStr] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }));
      const hrs = now.getHours();
      if (hrs >= 5 && hrs < 12) setGreeting("상쾌한 아
