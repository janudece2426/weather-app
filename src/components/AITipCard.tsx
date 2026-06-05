import React from "react";
import { Sparkles, Bot } from "lucide-react";
import { motion } from "motion/react";

interface AITipCardProps {
  tip: string;
  source: string;
}

export default function AITipCard({ tip, source }: AITipCardProps) {
  // Determine if it is real Gemini AI search or standard
  const isGemini = source === "Gemini AI Search";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="relative overflow-hidden rounded-[32px] bg-white/80 p-6 shadow-2xl shadow-slate-100/50 backdrop-blur-lg border border-white/95"
    >
      {/* Decorative gradient glowing orb */}
      <div className={`absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-30 ${
        isGemini ? "bg-purple-300" : "bg-sky-300"
      }`} />

      <div className="flex items-start gap-4">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${
            isGemini 
              ? "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white shadow-purple-500/10" 
              : "bg-gradient-to-tr from-sky-400 to-blue-500 text-white shadow-sky-500/10"
          }`}
        >
          {isGemini ? <Bot className="h-6 w-6" strokeWidth={1.8} /> : <Sparkles className="h-5 w-5" strokeWidth={1.8} />}
        </motion.div>

        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="text-sm font-extrabold tracking-tight text-slate-800 uppercase">
              {isGemini ? "Gemini Weather AI 분석가" : "지능형 날씨 코멘트"}
            </h4>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border transform scale-95 origin-right ${
              isGemini 
                ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-indigo-700 border-indigo-150" 
                : "bg-sky-50 text-sky-700 border-sky-100"
            }`}>
              {source}
            </span>
          </div>
          
          <div className="relative rounded-2xl bg-slate-50/70 p-4 border border-slate-150/40">
            <span className="absolute -left-1.5 top-4.5 h-3 w-3 rotate-45 border-b border-l border-slate-150/40 bg-slate-50/70" />
            <p className="text-sm leading-relaxed text-slate-700 font-bold">
              {tip}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
