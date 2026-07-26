"use client";

import { useState, useEffect, useCallback } from "react";

type MarketInsight = {
  asset: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume: number;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  reason: string;
  sparkline: number[];
};

const sentimentConfig = {
  bullish: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", icon: "📈", label: "Bullish" },
  bearish: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/25", icon: "📉", label: "Bearish" },
  neutral: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25", icon: "➡️", label: "Neutral" },
};

function formatPrice(p: number) {
  if (p >= 10000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
  return `$${p.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;
  const W = 60; const H = 22;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={up ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
    </svg>
  );
}

export default function AiInsights() {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetch_ = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/market-insights", { cache: "no-store" });
      if (res.ok) { setInsights(await res.json()); setLastUpdated(new Date()); }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(() => fetch_(), 30_000);
    return () => clearInterval(t);
  }, [fetch_]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          🤖 AI Market Signals
        </h3>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] text-zinc-600 font-mono">
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => fetch_(true)}
            disabled={refreshing || loading}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40"
          >
            {refreshing ? "…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        AI-powered signals based on live price momentum, 7-day trends, and trading volume. Tap any card to use the signal in your prediction.
      </p>

      {/* Cards */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight) => {
            const cfg = sentimentConfig[insight.sentiment];
            const up = insight.change24h >= 0;
            return (
              <div key={insight.asset} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3.5 space-y-2 hover:border-zinc-700 transition-all">
                {/* Top row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{insight.asset}</span>
                    <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <MiniSparkline data={insight.sparkline} up={up} />
                    <div className="text-right">
                      <p className="text-xs font-bold text-white font-mono">{formatPrice(insight.price)}</p>
                      <p className={`text-[10px] font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {up ? "▲" : "▼"}{Math.abs(insight.change24h).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        insight.sentiment === "bullish" ? "bg-emerald-500" :
                        insight.sentiment === "bearish" ? "bg-red-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">{insight.confidence}% confidence</span>
                </div>

                {/* Reason — always visible */}
                <p className="text-[11px] text-zinc-400 leading-relaxed">{insight.reason}</p>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center pt-1">
        Not financial advice. Updates every 30 seconds.
      </p>
    </div>
  );
}
