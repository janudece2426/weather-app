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
const POPULAR_CITIES = [
  { name: "서울", label: "서울" },
  { name: "부산", label: "부산" },
  { name: "제주도", label: "제주" },
  { name: "New York", label: "뉴욕" },
  { name: "London", label: "런던" },
  { name: "Tokyo", label: "도쿄" },
  { name: "Paris", label: "파리" }
];

export default function App() {
  const [cityInput, setCityInput] = useState("");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local storage recent search history
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem("weather_search_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal displaying integration explanation
  const [explainOpen, setExplainOpen] = useState(false);

  // Time & Greeting
  const [timeStr, setTimeStr] = useState("");
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    // Current time update loop
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("ko-KR", { 
        hour: "numeric", 
        minute: "2-digit", 
        second: "2-digit",
        hour12: true 
      }));

      const hrs = now.getHours();
      if (hrs >= 5 && hrs < 12) setGreeting("상쾌한 아침입니다 ☕");
      else if (hrs >= 12 && hrs < 17) setGreeting("활기찬 오후입니다 ☀️");
      else if (hrs >= 17 && hrs < 22) setGreeting("편안한 저녁입니다 🌙");
      else setGreeting("고요한 밤입니다 🌌");
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial city weather on load
  useEffect(() => {
    fetchWeather(DEFAULT_CITY);
  }, []);

  // Save history state to storage
  useEffect(() => {
    localStorage.setItem("weather_search_history", JSON.stringify(history));
  }, [history]);

  const fetchWeather = async (city: string, coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/weather", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: city,
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      });

      if (!response.ok) {
        throw new Error("날씨 정보를 불러오는 중 서버에서 오류가 발생했습니다.");
      }

      const data: WeatherData = await response.json();
      setWeather(data);

      // Add to search history if success
      if (data && data.location) {
        setHistory((prev) => {
          // Remove duplicates
          const filtered = prev.filter(item => item.city.toLowerCase() !== data.location.toLowerCase());
          const newItem: SearchHistoryItem = {
            id: Date.now().toString(),
            city: data.location,
            temp: data.current.temp,
            condition: data.current.condition,
            timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }),
          };
          return [newItem, ...filtered].slice(0, 6); // Keep top 6
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "날씨 데이터를 가져오는 백엔드 서비스 실행이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;
    fetchWeather(cityInput.trim());
    setCityInput("");
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setError("죄송합니다. 사용하시는 브라우저가 위치정보 서비스를 제공하지 않습니다.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        // We fetch with location coordinate API!
        fetchWeather("현재 좌표 기반 위치", coords);
      },
      (geoError) => {
        console.error("Geolocation error:", geoError);
        setError("위치 권한 연동이 해제되었거나 좌표를 수신하는 데 실패하였습니다. 기본 도시를 조회합니다.");
        setLoading(false);
        // Fallback to default
        fetchWeather(DEFAULT_CITY);
      },
      { timeout: 10000 }
    );
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    setHistory([]);
  };

  // Determine elegant dynamic atmospheric backgrounds based on condition
  const getAtmosphereStyles = (condition?: string) => {
    switch (condition) {
      case "sunny":
        return {
          wrapper: "bg-[#FFFDF8]",
          cardTheme: "from-amber-100/70 via-orange-50/50 to-amber-50/30 border-amber-200/40",
          accentColor: "text-amber-700 bg-amber-50 border-amber-150",
          textAccent: "text-amber-800",
          bgGradient: "bg-gradient-to-b from-amber-100/30 via-orange-50/10 to-[#FFFDF8]",
          decorations: "after:bg-amber-400/10 after:-translate-x-12 after:-translate-y-12 before:bg-orange-300/10 before:translate-x-24 before:translate-y-24",
          badgeText: "화창하고 맑은 날씨 ☀️"
        };
      case "cloudy":
        return {
          wrapper: "bg-[#F7F9FA]",
          cardTheme: "from-blue-50/50 via-slate-100/40 to-zinc-55/20 border-slate-200/40",
          accentColor: "text-slate-600 bg-slate-100/80 border-slate-150",
          textAccent: "text-slate-800",
          bgGradient: "bg-gradient-to-b from-slate-100/30 via-zinc-100/10 to-[#F7F9FA]",
          decorations: "after:bg-slate-300/10 after:-translate-x-12 after:-translate-y-12 before:bg-blue-300/10 before:translate-x-24 before:translate-y-24",
          badgeText: "흐릿하지만 선선한 구름날 ☁️"
        };
      case "rainy":
        return {
          wrapper: "bg-[#F2F6FA]",
          cardTheme: "from-blue-100/50 via-sky-50/40 to-indigo-50/20 border-blue-200/30",
          accentColor: "text-blue-700 bg-blue-50 border-blue-150",
          textAccent: "text-blue-900",
          bgGradient: "bg-gradient-to-b from-blue-100/25 via-sky-50/10 to-[#F2F6FA]",
          decorations: "after:bg-blue-400/8 after:-translate-x-12 after:-translate-y-12 before:bg-teal-400/6 before:translate-x-24 before:translate-y-24",
          badgeText: "감성 가득 빗소리가 들리는 날 ☔"
        };
      case "snowy":
        return {
          wrapper: "bg-[#F8FBFC]",
          cardTheme: "from-sky-100/60 via-cyan-50/40 to-indigo-50/10 border-sky-200/35",
          accentColor: "text-sky-700 bg-sky-50 border-sky-150",
          textAccent: "text-sky-900",
          bgGradient: "bg-gradient-to-b from-sky-100/20 via-cyan-50/10 to-[#F8FBFC]",
          decorations: "after:bg-cyan-300/10 after:-translate-x-12 after:-translate-y-12 before:bg-blue-300/5 before:translate-x-24 before:translate-y-24",
          badgeText: "포근하고 새하얀 눈 내리는 날 ❄️"
        };
      case "stormy":
        return {
          wrapper: "bg-[#FAF7F5]",
          cardTheme: "from-indigo-100/50 via-purple-50/40 to-stone-50/20 border-indigo-200/30",
          accentColor: "text-indigo-700 bg-indigo-55 border-indigo-150",
          textAccent: "text-indigo-900",
          bgGradient: "bg-gradient-to-b from-indigo-100/15 via-purple-50/5 to-[#FAF7F5]",
          decorations: "after:bg-purple-300/10 after:-translate-x-12 after:-translate-y-12 before:bg-amber-300/8 before:translate-x-24 before:translate-y-24",
          badgeText: "거친 천둥번개와 뇌우 날씨 ⚡"
        };
      case "windy":
        return {
          wrapper: "bg-[#F5FAF9]",
          cardTheme: "from-teal-100/50 via-emerald-55/30 to-slate-50/15 border-teal-200/30",
          accentColor: "text-teal-700 bg-teal-50 border-teal-150",
          textAccent: "text-teal-900",
          bgGradient: "bg-gradient-to-b from-teal-100/20 via-emerald-100/5 to-[#F5FAF9]",
          decorations: "after:bg-teal-300/10 after:-translate-x-12 after:-translate-y-12 before:bg-cyan-300/10 before:translate-x-24 before:translate-y-24",
          badgeText: "시원하게 기분 좋은 바람 부는 날 🍃"
        };
      case "foggy":
        return {
          wrapper: "bg-[#FAF9F7]",
          cardTheme: "from-slate-100/50 via-zinc-100/40 to-[#FBFBF9] border-zinc-250/30",
          accentColor: "text-slate-650 bg-slate-100/80 border-slate-200/40",
          textAccent: "text-slate-800",
          bgGradient: "bg-gradient-to-b from-slate-150/15 via-zinc-100/5 to-[#FAF9F7]",
          decorations: "after:bg-zinc-300/10 after:-translate-x-12 after:-translate-y-12 before:bg-gray-300/5 before:translate-x-24 before:translate-y-24",
          badgeText: "신비롭고 차분한 안개 낀 날 🌫️"
        };
      default:
        return {
          wrapper: "bg-[#FAFAFA]",
          cardTheme: "from-slate-100/60 via-slate-50/40 to-[#FDFDFD] border-slate-200/40",
          accentColor: "text-slate-700 bg-slate-100/80 border-slate-150",
          textAccent: "text-slate-900",
          bgGradient: "bg-gradient-to-b from-slate-100/15 via-slate-50/5 to-[#FAFAFA]",
          decorations: "after:bg-slate-300/5 after:-translate-x-12 after:-translate-y-12 before:bg-slate-250/5 before:translate-x-24 before:translate-y-24",
          badgeText: "온화하고 편안한 오늘 하루 ✨"
        };
    }
  };

  const style = getAtmosphereStyles(weather?.current?.condition);

  return (
    <div className={`min-h-screen font-sans ${style.wrapper} ${style.bgGradient} transition-colors duration-700 text-slate-800 pb-16`}>
      
      {/* Top Header Bar */}
      <header className="border-b border-slate-200/40 bg-white/30 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Greeting */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-white shadow-md shadow-sky-500/20">
              <span className="text-lg font-bold font-mono">W</span>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white ring-2 ring-white">✓</span>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-800">기분 좋은 날씨 생활</h1>
              <p className="text-[11px] text-slate-500 font-medium">{greeting}</p>
            </div>
          </div>

          {/* Time & API Key Information Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 border border-slate-150/80 text-[11px] font-bold text-slate-500 shadow-sm">
              <Clock className="h-3.5 w-3.5 text-sky-500" strokeWidth={2.5} />
              <span className="font-mono tracking-wider">{timeStr}</span>
            </div>

            <button
              onClick={() => setExplainOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-white/90 border border-slate-200/80 hover:bg-slate-900 hover:text-white hover:border-slate-900 px-4 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <HelpCircle className="h-4 w-4 text-sky-500" strokeWidth={2.4} />
              <span>시스템 작동 가이드</span>
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Search Block & Location Tags */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            
            {/* Direct Input Field */}
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" strokeWidth={2.2} />
              <input
                type="text"
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                placeholder="검색할 도시명을 입력해 주세요 (예: 서울, 제주, New York...)"
                className="w-full pl-12 pr-20 py-3.5 text-sm rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-100/50 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-150/50 transition-all font-bold text-slate-700"
              />
              <button 
                type="submit"
                className="absolute right-2 px-5 py-2 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-xs text-white font-extrabold tracking-tight hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md shadow-sky-400/20"
              >
                검색
              </button>
            </form>

            {/* Current Geo Location Request Button */}
            <button
              onClick={handleGeolocation}
              className="px-5 py-3.5 rounded-3xl bg-white border border-slate-150/80 text-sm font-bold text-slate-600 flex items-center justify-center gap-2 shadow-xl shadow-slate-100/40 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              <MapPin className="h-4 w-4 text-sky-500 shrink-0" strokeWidth={2.4} />
              <span>내 위치 조회</span>
            </button>

          </div>

          {/* Quick Filter Tag Buttons */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-extrabold mr-1 bg-slate-900/5 px-2.5 py-1 rounded-full">주요 관심 지역:</span>
            {POPULAR_CITIES.map((tag) => {
              const isActive = weather?.location?.toLowerCase().includes(tag.label.toLowerCase()) || 
                               weather?.location?.toLowerCase().includes(tag.name.toLowerCase());
              return (
                <button
                  key={tag.name}
                  onClick={() => fetchWeather(tag.name)}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-full transition-all duration-300 shadow-sm shadow-slate-100/10 transform hover:scale-105 active:scale-95 cursor-pointer border ${
                    isActive
                      ? "bg-slate-900 border-slate-950 text-white shadow-md shadow-slate-900/20"
                      : "bg-white/80 border-slate-200/60 text-slate-600 hover:bg-white hover:border-slate-350"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Global Loading / Error Area */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-800 flex items-start gap-3 shadow-lg"
            >
              <div className="flex-1">
                <p>{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700 transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl bg-white/40 border border-white/60 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xl backdrop-blur-md"
            >
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-sky-500">
                  <TrendingUp className="h-5 w-5 animate-pulse" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">날씨 데이터를 연동하고 있습니다</h4>
                <p className="text-[11px] text-slate-400 font-medium mt-1">OpenWeather API와 Gemini AI 실시간 검색엔진을 병렬 가동 중입니다.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Dashboard Area */}
        {!loading && weather && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          >
            
            {/* COLUMN 1: Large Weather Card (Primary Display) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Giant Weather Card */}
              <div className={`relative overflow-hidden rounded-[36px] bg-gradient-to-br ${style.cardTheme} p-8 shadow-2xl shadow-sky-950/5 border backdrop-blur-xl flex flex-col justify-between min-h-[420px]`}>
                
                {/* Visual Glow elements */}
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-sky-400 to-blue-600" />
                
                {/* Header info */}
                <div className="relative flex items-start justify-between z-10 w-full">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-bold text-slate-700/80 border border-slate-900/5">
                      <MapPin className="h-3.5 w-3.5 text-slate-600" />
                      <span>{weather.location}</span>
                    </div>
                    <p className="text-xs text-slate-400/90 font-semibold pl-1 font-mono">업데이트 {weather.current.lastUpdated}</p>
                  </div>

                  <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${
                    weather.source === "OpenWeather" 
                      ? "bg-sky-50 text-sky-700 ring-sky-600/10" 
                      : weather.source === "Gemini AI Search"
                      ? "bg-purple-50 text-purple-700 ring-purple-600/10" 
                      : "bg-slate-50 text-slate-700 ring-slate-600/10"
                  }`}>
                    {weather.source}
                  </span>
                </div>

                {/* Hero Middle row */}
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 z-10 py-8">
                  
                  {/* Temp Display */}
                  <div className="space-y-1">
                    <div className="text-7xl sm:text-8xl font-extrabold text-slate-800 tracking-tighter flex items-start font-mono">
                      <span>{weather.current.temp}</span>
                      <span className="text-4xl sm:text-5xl font-semibold text-slate-400 mt-1">°C</span>
                    </div>
                    <div className="flex items-center gap-2 pl-1">
                      <span className="text-md font-bold text-slate-700">{weather.current.conditionText}</span>
                      <span className="h-3.5 w-[1px] bg-slate-300" />
                      <span className="text-xs text-slate-400 font-medium">체감 {weather.current.feelsLike}°</span>
                    </div>
                  </div>

                  {/* Giant Atmospheric Mascot Icon */}
                  <div className="flex h-32 w-32 items-center justify-center bg-white/40 rounded-3xl shadow-xl shadow-slate-200/10 border border-white/60 p-4">
                    <WeatherIcon condition={weather.current.condition} size={84} />
                  </div>

                </div>

                {/* Bottom Stats Summary banner */}
                <div className="relative z-10 w-full border-t border-slate-200/40 pt-6 mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{style.badgeText}</span>
                  </div>
                  
                  <span className="text-[11px] font-medium text-slate-400 font-mono">
                    좌표 수집 결과: {weather.location} 주변 데이터셋 정산
                  </span>
                </div>

              </div>

              {/* Dynamic Stats Row Component */}
              <WeatherStats
                feelsLike={weather.current.feelsLike}
                humidity={weather.current.humidity}
                windSpeed={weather.current.windSpeed}
                airQuality={weather.current.airQuality}
              />

              {/* Multi-day Forecast List Component */}
              <ForecastList forecast={weather.forecast} />

            </div>

            {/* COLUMN 2: AI Tip Card & Search History Sidebar */}
            <div className="space-y-6">
              
              {/* AI Weather Tip Custom Speech bubble */}
              <AITipCard tip={weather.current.tip} source={weather.source} />

              {/* Local Storage Search History Panel */}
              <div className="rounded-[32px] bg-white/80 p-6 shadow-2xl shadow-slate-100/50 border border-white/95 backdrop-blur-lg space-y-4">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                    <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">최근 날씨 탐색 이력</h3>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={clearAllHistory}
                      className="text-[10px] font-extrabold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer transition-all"
                    >
                      전체 삭제
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-450 font-bold leading-relaxed">
                    탐색 기록이 비어 있습니다.<br />새로운 도시명을 조회해 보세요.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => fetchWeather(item.city)}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 hover:bg-white border border-slate-100/80 hover:border-slate-200 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-98"
                      >
                        <div className="flex items-center gap-2.5">
                          <WeatherIcon condition={item.condition} size={22} />
                          <div className="space-y-0.5">
                            <div className="text-xs font-extrabold text-slate-700">{item.city}</div>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{item.timestamp}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold font-mono text-slate-800">{item.temp}°</span>
                          <button
                            onClick={(e) => deleteHistoryItem(item.id, e)}
                            className="h-6 w-6 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>

          </motion.div>
        )}

      </main>

      {/* Explained Integration Information Overlay Modal */}
      <AnimatePresence>
        {explainOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              
              {/* Close Button */}
              <button
                onClick={() => setExplainOpen(false)}
                className="absolute right-4 top-4 h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-5">
                
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <Terminal className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-slate-800">날씨 수집 작동 원리안내</h3>
                    <p className="text-xs text-slate-400 font-medium font-mono">System Configuration Overview</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
                  
                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-sky-50 border border-sky-100">
                    <h4 className="font-bold text-sky-800">우선순위 1: OpenWeatherMap 직접 연동</h4>
                    <p className="text-sky-700/90 leading-relaxed">
                      API 키가 설정된 경우 메인 기상 레이더를 OpenWeather API로 매핑 호출합니다.
                    </p>
                    <div className="text-[10px] text-sky-500/80 font-semibold bg-white/50 inline-block px-1.5 py-0.5 rounded border border-sky-200">
                      변수: OPENWEATHERMAP_API_KEY
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-purple-50 border border-purple-100">
                    <h4 className="font-bold text-purple-800">우선순위 2: Gemini AI 실시간 검색 연동 (자동)</h4>
                    <p className="text-purple-700/90 leading-relaxed">
                      만약 키가 없거나 사용량이 한계일 때, <strong>Gemini AI (Google Search Grounding)</strong>를 돌려 실제 구글 기상 검색에서 현재 위도와 경도의 실시간 최고/최저 기온 및 코멘트를 한눈에 요약해 냅니다.
                    </p>
                    <div className="text-[10px] text-purple-500/80 font-semibold bg-white/50 inline-block px-1.5 py-0.5 rounded border border-purple-200">
                      비용 무료 (플랫폼 내장 지원)
                    </div>
                  </div>

                  <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <h4 className="font-bold text-slate-800">설정은 어디서 하나요?</h4>
                    <p className="text-slate-500">
                      AI Studio의 <strong>Settings &gt; Secrets (환경 변수)</strong> 탭을 클릭하신 후 <code>OPENWEATHERMAP_API_KEY</code>를 지정해 주실 수 있습니다.
                    </p>
                  </div>

                </div>

                <button
                  onClick={() => setExplainOpen(false)}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white tracking-tight transition-colors cursor-pointer"
                >
                  이해했습니다
                </button>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
