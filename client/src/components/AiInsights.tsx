"use client";

import { useState, useEffect } from "react";
import { getAiInsights, type AiInsight } from "@/hooks/contract";

const sentimentColor = {
  bullish: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  bearish: "text-red-400 bg-red-500/10 border-red-500/20",
  neutral: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

const sentimentEmoji = {
  bullish: "📈",
  bearish: "📉",
  neutral: "➡️",
};

export default function AiInsights() {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAiInsights().then((data) => {
      setInsights(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">🤖</span> AI Market Insights
        </h3>
        <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2.5 py-0.5 text-[10px] font-bold text-violet-400 uppercase tracking-wider">
          Powered by AI
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.asset}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white">
                    {insight.asset}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                      sentimentColor[insight.sentiment]
                    }`}
                  >
                    {sentimentEmoji[insight.sentiment]} {insight.sentiment}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-16 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {insight.confidence}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {insight.reason}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center">
        <p className="text-xs text-zinc-500">
          AI analysis updates in real-time based on on-chain data, market
          sentiment, and trading volume patterns.
        </p>
      </div>
    </div>
  );
}
