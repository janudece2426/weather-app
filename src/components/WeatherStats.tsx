import React from "react";
import { Droplets, Wind, Activity, Thermometer } from "lucide-react";
import { motion } from "motion/react";

interface WeatherStatsProps {
  humidity: number;
  windSpeed: string;
  airQuality: string;
  feelsLike: number;
}

export default function WeatherStats({ humidity, windSpeed, airQuality, feelsLike }: WeatherStatsProps) {
  // Determine air quality color representation
  const getAQIColors = (aqi: string) => {
    const text = aqi.toLowerCase();
    if (text.includes("좋음") || text.includes("good") || text.includes("clean") || text.includes("맑음")) {
      return { bg: "bg-emerald-50 border-emerald-200/50", text: "text-emerald-700", dot: "bg-emerald-500" };
    }
    if (text.includes("나쁨") || text.includes("bad") || text.includes("poor") || text.includes("매우나쁨")) {
      return { bg: "bg-rose-50 border-rose-200/50", text: "text-rose-700", dot: "bg-rose-500" };
    }
    return { bg: "bg-amber-50 border-amber-200/50", text: "text-amber-700", dot: "bg-amber-500" };
  };

  const aqiColors = getAQIColors(airQuality);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Feels Like Card */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-3xl bg-white/80 p-5 shadow-xl shadow-slate-100/30 backdrop-blur-lg border border-white/90 flex flex-col justify-between min-h-[148px]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 tracking-wider">체감 온도</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100/60">
            <Thermometer className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
            {feelsLike}<span className="text-lg font-bold text-slate-400 ml-0.5">°C</span>
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">바람과 습도를 고려한 온도</p>
        </div>
      </motion.div>

      {/* Humidity Card */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-3xl bg-white/80 p-5 shadow-xl shadow-slate-100/30 backdrop-blur-lg border border-white/90 flex flex-col justify-between min-h-[148px]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 tracking-wider">대기 습도</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 border border-blue-100/60">
            <Droplets className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
            {humidity}<span className="text-lg font-bold text-slate-400 ml-0.5">%</span>
          </div>
          {/* Progress gauge/line */}
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/20">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${humidity}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Wind Card */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-3xl bg-white/80 p-5 shadow-xl shadow-slate-100/30 backdrop-blur-lg border border-white/90 flex flex-col justify-between min-h-[148px]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 tracking-wider">바람 세기</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-100/60">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
            >
              <Wind className="h-4.5 w-4.5" strokeWidth={2.2} />
            </motion.div>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
            {windSpeed}
          </div>
          <p className="text-[11px] text-slate-400 font-semibold">초당 바람의 이동 속도</p>
        </div>
      </motion.div>

      {/* Air Quality Card */}
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="rounded-3xl bg-white/80 p-5 shadow-xl shadow-slate-100/30 backdrop-blur-lg border border-white/90 flex flex-col justify-between min-h-[148px]"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 tracking-wider">미세먼지 예보</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60">
            <Activity className="h-4.5 w-4.5" strokeWidth={2.2} />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
            {airQuality}
          </div>
          <div className="flex">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${aqiColors.bg} ${aqiColors.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${aqiColors.dot} animate-pulse`} />
              실시간 대기 등급
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
