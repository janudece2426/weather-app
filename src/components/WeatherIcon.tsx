import React from "react";
import { Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, CloudFog } from "lucide-react";
import { motion } from "motion/react";

interface WeatherIconProps {
  condition: "sunny" | "cloudy" | "rainy" | "snowy" | "stormy" | "windy" | "foggy";
  size?: number;
}

export default function WeatherIcon({ condition, size = 48 }: WeatherIconProps) {
  const customStyle = { width: size, height: size };

  switch (condition) {
    case "sunny":
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          style={customStyle}
          className="text-amber-500 drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]"
        >
          <Sun style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      );
    case "cloudy":
      return (
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          style={customStyle}
          className="text-slate-400 drop-shadow-[0_4px_8px_rgba(148,163,184,0.2)]"
        >
          <Cloud style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      );
    case "rainy":
      return (
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          style={customStyle}
          className="text-blue-500 drop-shadow-[0_4px_8px_rgba(59,130,246,0.3)]"
        >
          <CloudRain style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      );
    case "snowy":
      return (
        <motion.div
          animate={{ rotate: [-10, 10, -10], scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          style={customStyle}
          className="text-sky-400 drop-shadow-[0_4px_12px_rgba(56,189,248,0.3)]"
        >
          <Snowflake style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      );
    case "stormy":
      return (
        <motion.div
          animate={{ scale: [1, 1.03, 1], rotate: [-1, 1, -1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          style={customStyle}
          className="text-purple-500 drop-shadow-[0_4px_12px_rgba(168,85,247,0.3)]"
        >
          <CloudLightning style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      );
    case "windy":
      return (
        <motion.div
          animate={{ x: [-4, 4, -4] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          style={customStyle}
          className="text-teal-500 drop-shadow-[0_4px_8px_rgba(20,184,166,0.25)]"
        >
          <Wind style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      );
    case "foggy":
      return (
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          style={customStyle}
          className="text-slate-400 drop-shadow-[0_4px_6px_rgba(148,163,184,0.15)]"
        >
          <CloudFog style={{ width: "100%", height: "100%" }} strokeWidth={1.8} />
        </motion.div>
      );
    default:
      return (
        <Sun style={customStyle} className="text-amber-500" strokeWidth={1.8} />
      );
  }
}
