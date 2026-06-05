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
      if (hrs >= 5 && hrs < 12) setGreeting("상쾌한 아침입니다 ☕");
      else if (hrs >= 12 && hrs < 17) setGreeting("활기찬 오후입니다 ☀️");
      else if (hrs >= 17 && hrs < 22) setGreeting("편안한 저녁입니다 🌙");
      else setGreeting("고요한 밤입니다 🌌");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchWeather(DEFAULT_CITY);
  }, []);

  useEffect(() => {
    localStorage.setItem("weather_search_history", JSON.stringify(history));
  }, [history]);

  // 클라이언트단에서 직접 OpenWeatherMap API를 호출하도록 프론트 융합 처리
  const fetchWeather = async (city: string, coords?: { lat: number; lng: number }) => {
    setLoading(true);
    setError(null);

    // Netlify 환경변수에서 Vite 전용 API Key를 동적으로 수집
    const openWeatherKey = import.meta.env.VITE_WEATHER_API_KEY;
    const targetCity = city ? city.trim() : "Seoul";

    if (!openWeatherKey) {
      setError("Netlify 환경변수에 VITE_WEATHER_API_KEY가 설정되지 않았습니다. 설정을 확인해 주세요.");
      setLoading(false);
      return;
    }

    try {
      let currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(targetCity)}&units=metric&appid=${openWeatherKey}&lang=kr`;
      let forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(targetCity)}&units=metric&appid=${openWeatherKey}&lang=kr`;

      if (coords?.lat !== undefined && coords?.lng !== undefined) {
        currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&units=metric&appid=${openWeatherKey}&lang=kr`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lng}&units=metric&appid=${openWeatherKey}&lang=kr`;
      }

      const currentRes = await fetch(currentUrl);
      if (!currentRes.ok) {
        throw new Error("도시를 찾을 수 없거나 날씨 정보를 가져오는 데 실패했습니다.");
      }

      const currentJson = await currentRes.json();
      const forecastRes = await fetch(forecastUrl);
      let forecastList = [];

      if (forecastRes.ok) {
        const forecastJson = await forecastRes.json();
        const list = forecastJson.list || [];
        for (let i = 8; i < list.length; i += 8) {
          const item = list[i];
          const date = new Date(item.dt * 1000);
          const daysK = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
          forecastList.push({
            day: daysK[date.getDay()],
            temp: Math.round(item.main.temp),
            humidity: Math.round(item.main.humidity),
            condition: mapOpenWeatherCondition(item.weather?.[0]?.id),
            conditionText: item.weather?.[0]?.description || "맑음",
          });
          if (forecastList.length >= 4) break;
        }
      }

      if (forecastList.length === 0) {
        forecastList = generateFallbackForecast(currentJson.main.temp);
      }

      const conditionVal = mapOpenWeatherCondition(currentJson.weather?.[0]?.id);
      const tempVal = Math.round(currentJson.main.temp);

      const computedData: WeatherData = {
        location: currentJson.name || targetCity,
        source: "OpenWeather",
        current: {
          temp: tempVal,
          feelsLike: Math.round(currentJson.main.feels_like),
          humidity: Math.round(currentJson.main.humidity),
          condition: conditionVal,
          conditionText: currentJson.weather?.[0]?.description || "맑음",
          windSpeed: `${currentJson.wind?.speed || 0} m/s`,
          airQuality: "보통",
          lastUpdated: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }),
          tip: getStandardConditionTip(conditionVal, tempVal),
        },
        forecast: forecastList,
      };

      setWeather(computedData);

      setHistory((prev) => {
        const filtered = prev.filter(item => item.city.toLowerCase() !== computedData.location.toLowerCase());
        const newItem: SearchHistoryItem = {
          id: Date.now().toString(),
          city: computedData.location,
          temp: computedData.current.temp,
          condition: computedData.current.condition,
          timestamp: new Date().toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" }),
        };
        return [newItem, ...filtered].slice(0, 6);
      });

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "날씨 데이터를 가져오는 중 오류가 발생했습니다.");
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
        fetchWeather("현재 위치", { lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setError("위치 권한 연동에 실패하여 기본 도시를 조회합니다.");
        fetchWeather(DEFAULT_CITY);
      },
      { timeout: 10000 }
    );
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const style = getAtmosphereStyles(weather?.current?.condition);

  return (
    <div className={`min-h-screen font-sans ${style.wrapper} ${style.bgGradient} transition-colors duration-700 text-slate-800 pb-16`}>
      <header className="border-b border-slate-200/40 bg-white/30 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
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
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 border border-slate-150/80 text-[11px] font-bold text-slate-500 shadow-sm">
              <Clock className="h-3.5 w-3.5 text-sky-500" strokeWidth={2.5} />
              <span className="font-mono tracking-wider">{timeStr}</span>
            </div>
            <button onClick={() => setExplainOpen(true)} className="flex items-center gap-1.5 rounded-full bg-white/90 border border-slate-200/80 hover:bg-slate-900 hover:text-white hover:border-slate-900 px-4 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 cursor-pointer">
              <HelpCircle className="h-4 w-4 text-sky-500" strokeWidth={2.4} />
              <span>시스템 작동 가이드</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-slate-400 pointer-events-none" strokeWidth={2.2} />
              <input type="text" value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="검색할 도시명을 입력해 주세요 (예: 서울, 제주, New York...)" className="w-full pl-12 pr-20 py-3.5 text-sm rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-100/50 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-150/50 transition-all font-bold text-slate-700" />
              <button type="submit" className="absolute right-2 px-5 py-2 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-500 text-xs text-white font-extrabold tracking-tight hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-md shadow-sky-400/20">검색</button>
            </form>
            <button onClick={handleGeolocation} className="px-5 py-3.5 rounded-3xl bg-white border border-slate-150/80 text-sm font-bold text-slate-600 flex items-center justify-center gap-2 shadow-xl shadow-slate-100/40 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer">
              <MapPin className="h-4 w-4 text-sky-500 shrink-0" strokeWidth={2.4} />
              <span>내 위치 조회</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-400 font-extrabold mr-1 bg-slate-900/5 px-2.5 py-1 rounded-full">주요 관심 지역:</span>
            {POPULAR_CITIES.map((tag) => {
              const isActive = weather?.location?.toLowerCase().includes(tag.label.toLowerCase()) || weather?.location?.toLowerCase().includes(tag.name.toLowerCase());
              return (
                <button key={tag.name} onClick={() => fetchWeather(tag.name)} className={`px-4 py-1.5 text-xs font-extrabold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer border ${isActive ? "bg-slate-900 border-slate-950 text-white shadow-md" : "bg-white/80 border-slate-200/60 text-slate-600"}`}>
                  {tag.label}
                </button>
              );
            })}
          </div>
        </section>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm font-semibold text-rose-800 flex items-start gap-3 shadow-lg">
              <div className="flex-1"><p>{error}</p></div>
              <button onClick={() => setError(null)} className="text-rose-500 cursor-pointer"><X className="h-4 w-4" /></button>
            </motion.div>
          )}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-3xl bg-white/40 border border-white/60 p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xl backdrop-blur-md">
              <div className="h-14 w-14 rounded-full border-4 border-sky-100 border-t-sky-500 animate-spin"></div>
              <h4 className="text-sm font-bold text-slate-800">날씨 데이터를 연동하고 있습니다</h4>
            </motion.div>
          )}
        </AnimatePresence>

        {!loading && weather && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div className={`relative overflow-hidden rounded-[36px] bg-gradient-to-br ${style.cardTheme} p-8 shadow-2xl border backdrop-blur-xl flex flex-col justify-between min-h-[420px]`}>
                <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl opacity-20 bg-gradient-to-tr from-sky-400 to-blue-600" />
                <div className="relative flex items-start justify-between z-10 w-full">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-bold text-slate-700/80">
                      <MapPin className="h-3.5 w-3.5 text-slate-600" />
                      <span>{weather.location}</span>
                    </div>
                    <p className="text-xs text-slate-400/90 font-semibold pl-1 font-mono">업데이트 {weather.current.lastUpdated}</p>
                  </div>
                  <span className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold bg-sky-50 text-sky-700 ring-1 ring-sky-600/10">
                    {weather.source}
                  </span>
                </div>

                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 z-10 py-8">
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
                  <div className="flex h-32 w-32 items-center justify-center bg-white/40 rounded-3xl shadow-xl border p-4">
                    <WeatherIcon condition={weather.current.condition} size={84} />
                  </div>
                </div>

                <div className="relative z-10 w-full border-t border-slate-200/40 pt-6 mt-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{style.badgeText}</span>
                </div>
              </div>

              <WeatherStats feelsLike={weather.current.feelsLike} humidity={weather.current.humidity} windSpeed={weather.current.windSpeed} airQuality={weather.current.airQuality} />
              <ForecastList forecast={weather.forecast} />
            </div>

            <div className="space-y-6">
              <AITipCard tip={weather.current.tip} source={weather.source} />
              <div className="rounded-[32px] bg-white/80 p-6 shadow-2xl border backdrop-blur-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase">최근 날씨 탐색 이력</h3>
                  {history.length > 0 && <button onClick={() => setHistory([])} className="text-[10px] font-extrabold text-rose-500 hover:underline cursor-pointer">전체 삭제</button>}
                </div>
                {history.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 font-bold">탐색 기록이 비어 있습니다.</div>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div key={item.id} onClick={() => fetchWeather(item.city)} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/40 hover:bg-white border cursor-pointer shadow-sm transition-all duration-200">
                        <div className="flex items-center gap-2.5">
                          <WeatherIcon condition={item.condition} size={22} />
                          <div className="space-y-0.5">
                            <div className="text-xs font-extrabold text-slate-700">{item.city}</div>
                            <span className="text-[10px] text-slate-400 font-bold font-mono">{item.timestamp}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold font-mono text-slate-800">{item.temp}°</span>
                          <button onClick={(e) => { e.stopPropagation(); setHistory(prev => prev.filter(i => i.id !== item.id)); }} className="h-6 w-6 text-slate-400 hover:text-rose-500 flex items-center justify-center cursor-pointer"><X className="h-3.5 w-3.5" /></button>
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
    </div>
  );
}

// 대기 배경 스타일 함수 도우미
function getAtmosphereStyles(condition?: string) {
  const defaults = {
    wrapper: "bg-[#FAFAFA]", cardTheme: "from-slate-100/60 via-slate-50/40 to-[#FDFDFD] border-slate-200/40",
    bgGradient: "bg-gradient-to-b from-slate-100/15 via-slate-50/5 to-[#FAFAFA]", badgeText: "온화하고 편안한 오늘 하루 ✨"
  };
  if (!condition) return defaults;
  const styles: Record<string, typeof defaults> = {
    sunny: { wrapper: "bg-[#FFFDF8]", cardTheme: "from-amber-100/70 via-orange-50/50 to-amber-50/30", bgGradient: "bg-gradient-to-b from-amber-100/30 to-[#FFFDF8]", badgeText: "화창하고 맑은 날씨 ☀️" },
    cloudy: { wrapper: "bg-[#F7F9FA]", cardTheme: "from-blue-50/50 via-slate-100/40 to-zinc-55/20", bgGradient: "bg-gradient-to-b from-slate-100/30 to-[#F7F9FA]", badgeText: "흐릿하지만 선선한 구름날 ☁️" },
    rainy: { wrapper: "bg-[#F2F6FA]", cardTheme: "from-blue-100/50 via-sky-50/40 to-indigo-50/20", bgGradient: "bg-gradient-to-b from-blue-100/25 to-[#F2F6FA]", badgeText: "감성 가득 빗소리가 들리는 날 ☔" },
    snowy: { wrapper: "bg-[#F8FBFC]", cardTheme: "from-sky-100/60 via-cyan-50/40 to-indigo-50/10", bgGradient: "bg-gradient-to-b from-sky-100/20 to-[#F8FBFC]", badgeText: "포근하고 새하얀 눈 내리는 날 ❄️" },
    stormy: { wrapper: "bg-[#FAF7F5]", cardTheme: "from-indigo-100/50 via-purple-50/40 to-stone-50/20", bgGradient: "bg-gradient-to-b from-indigo-100/15 to-[#FAF7F5]", badgeText: "거친 천둥번개와 뇌우 날씨 ⚡" },
    windy: { wrapper: "bg-[#F5FAF9]", cardTheme: "from-teal-100/50 via-emerald-55/30 to-slate-50/15", bgGradient: "bg-gradient-to-b from-teal-100/20 to-[#F5FAF9]", badgeText: "시원하게 기분 좋은 바람 부는 날 🍃" },
    foggy: { wrapper: "bg-[#FAF9F7]", cardTheme: "from-slate-100/50 via-zinc-100/40 to-[#FBFBF9]", bgGradient: "bg-gradient-to-b from-slate-150/15 to-[#FAF9F7]", badgeText: "신비롭고 차분한 안개 낀 날 🌫️" }
  };
  return styles[condition] || defaults;
}
