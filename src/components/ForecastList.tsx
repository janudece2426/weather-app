import React from "react";
import WeatherIcon from "./WeatherIcon";
import { motion } from "motion/react";

interface ForecastItem {
  day: string;
  temp: number;
  humidity: number;
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy";
  conditionText: string;
}

interface ForecastListProps {
  forecast: ForecastItem[];
}

export default function ForecastList({ forecast }: ForecastListProps) {
  // Stagger items entry
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } },
  };

  // Helper to color up forecast cards
  const getForecastTheme = (cond: string) => {
    switch (cond) {
      case "sunny":
        return "bg-gradient-to-b from-amber-50/50 to-orange-50/20 border-amber-200/30 text-amber-950";
      case "rainy":
      case "stormy":
        return "bg-gradient-to-b from-blue-50/50 to-indigo-50/20 border-blue-200/30 text-blue-950";
      case "snowy":
        return "bg-gradient-to-b from-sky-50/50 to-cyan-50/20 border-sky-200/20 text-sky-950";
      case "windy":
        return "bg-gradient-to-b from-teal-50/50 to-emerald-50/20 border-teal-200/20 text-teal-950";
      default:
        return "bg-gradient-to-b from-white/60 to-slate-50/40 border-slate-200/40 text-slate-850";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-extrabold tracking-tight text-slate-800 uppercase">
          주간 날씨 예보 <span className="text-xs font-normal text-slate-400 ml-1.5">(4일 트렌드)</span>
        </h3>
        <span className="text-[10px] bg-slate-900/5 px-2.5 py-1 rounded-full text-slate-550 font-bold font-mono">FORECAST</span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {forecast.map((item, index) => {
          const cardStyle = getForecastTheme(item.condition);
          return (
            <motion.div
              key={`${item.day}-${index}`}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.03 }}
              className={`rounded-3xl p-5 border shadow-xl shadow-slate-100/30 backdrop-blur-md flex flex-col items-center justify-center text-center gap-3 transition-colors ${cardStyle}`}
            >
              <div className="text-xs font-bold tracking-tight opacity-75">{item.day}</div>
              
              <div className="flex h-14 w-14 items-center justify-center bg-white/70 rounded-2xl shadow-sm border border-white/50">
                <WeatherIcon condition={item.condition} size={34} />
              </div>

              <div className="space-y-0.5">
                <div className="text-xl font-extrabold font-mono tracking-tighter">
                  {item.temp}°
                </div>
                <div className="text-[11px] font-semibold opacity-80">
                  {item.conditionText}
                </div>
              </div>

              <div className="text-[10px] font-bold opacity-70 bg-white/80 rounded-full px-2.5 py-1 border border-slate-150/40">
                습도 {item.humidity}%
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
