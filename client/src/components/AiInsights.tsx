"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, TrendingUp, TrendingDown, Minus, RefreshCw, Check, type LucideIcon } from "lucide-react";

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

const sentimentConfig: Record<string, { color: string; bg: string; bar: string; icon: LucideIcon; label: string }> = {
  bullish: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/25",
    bar: "bg-emerald-500",
    icon: TrendingUp,
    label: "Bullish",
  },
  bearish: {
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/25",
    bar: "bg-red-500",
    icon: TrendingDown,
    label: "Bearish",
  },
  neutral: {
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/25",
    bar: "bg-amber-500",
    icon: Minus,
    label: "Neutral",
  },
};

function formatPrice(p: number) {
  if (p >= 10000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
  return `$${p.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;
  const W = 60;
  const H = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map(
      (v, i) =>
        `${((i / (data.length - 1)) * W).toFixed(1)},${(
          H - ((v - min) / range) * H
        ).toFixed(1)}`
    )
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={up ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  );
}

export default function AiInsights({
  onSelectAsset,
}: {
  onSelectAsset?: (asset: string) => void;
}) {
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [justSelected, setJustSelected] = useState<string | null>(null);

  const fetch_ = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/market-insights", { cache: "no-store" });
      if (res.ok) {
        setInsights(await res.json());
        setLastUpdated(new Date());
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(() => fetch_(), 30_000);
    return () => clearInterval(t);
  }, [fetch_]);

  const handleSelect = (asset: string) => {
    if (!onSelectAsset) return;
    onSelectAsset(asset);
    setJustSelected(asset);
    setTimeout(() => setJustSelected(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Bot className="h-4 w-4 text-indigo-400" /> AI Market Signals
        </h3>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] text-zinc-600 font-mono">
              {lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={() => fetch_(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-2.5 py-1 text-[10px] font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40"
          >
            <RefreshCw className={`h-2.5 w-2.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {onSelectAsset && (
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          AI signals based on live price data. Tap a card to use that asset in your prediction.
        </p>
      )}

      {/* Cards */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {insights.map((insight) => {
            const cfg = sentimentConfig[insight.sentiment];
            const up = insight.change24h >= 0;
            const isSelected = justSelected === insight.asset;
            const clickable = !!onSelectAsset;

            return (
              <div
                key={insight.asset}
                onClick={() => handleSelect(insight.asset)}
                className={`rounded-xl border bg-zinc-900/50 p-3.5 space-y-2 transition-all ${
                  clickable ? "cursor-pointer" : ""
                } ${
                  isSelected
                    ? "border-violet-500/50 bg-violet-500/5 shadow-lg shadow-violet-500/10"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-bold text-white">{insight.asset}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase ${cfg.bg} ${cfg.color}`}
                    >
                      <cfg.icon className="h-2.5 w-2.5" /> {cfg.label}
                    </span>
                    {isSelected && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-violet-400 bg-violet-500/10 rounded px-1.5 py-0.5">
                        <Check className="h-2.5 w-2.5" /> Selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <MiniSparkline data={insight.sparkline} up={up} />
                    <div className="text-right">
                      <p className="text-xs font-bold text-white font-mono">
                        {formatPrice(insight.price)}
                      </p>
                      <p
                        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                          up ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        {Math.abs(insight.change24h).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`}
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                    {insight.confidence}%
                  </span>
                </div>

                {/* Reason */}
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {insight.reason}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-zinc-600 text-center pt-1">
        Not financial advice · Updates every 30 s
      </p>
    </div>
  );
}
