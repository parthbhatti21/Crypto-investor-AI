"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { TrendingUp, TrendingDown, Minus, RefreshCw, ArrowRight, type LucideIcon } from "lucide-react";

type MarketInsight = {
  asset: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume: number;
  marketCap: number;
  rank: number;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  reason: string;
  sparkline: number[];
  ath: number;
  athPct: string | null;
};

const sentimentConfig: Record<string, { color: string; bg: string; bar: string; icon: LucideIcon; label: string; glow: string }> = {
  bullish: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25", bar: "bg-emerald-500", icon: TrendingUp,   label: "Bullish", glow: "shadow-emerald-500/10" },
  bearish: { color: "text-red-400",     bg: "bg-red-500/10 border-red-500/25",         bar: "bg-red-500",     icon: TrendingDown, label: "Bearish", glow: "shadow-red-500/10"     },
  neutral: { color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/25",     bar: "bg-amber-500",   icon: Minus,         label: "Neutral", glow: "shadow-amber-500/10"  },
};

function fmt(p: number) {
  if (p >= 10000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p >= 1) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 4 })}`;
  return `$${p.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function fmtVol(v: number) {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${(v / 1e3).toFixed(0)}K`;
}

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data || data.length < 2) return null;
  const W = 96; const H = 32;
  const min = Math.min(...data); const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) =>
    `${((i / (data.length - 1)) * W).toFixed(1)},${(H - ((v - min) / range) * H).toFixed(1)}`
  ).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={up ? "#10b981" : "#ef4444"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
    </svg>
  );
}

export default function MarketsClient() {
  const { address } = useWallet();
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/market-insights", { cache: "no-store" });
      if (res.ok) { setInsights(await res.json()); setLastUpdated(new Date()); }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const bullish = insights.filter(i => i.sentiment === "bullish").length;
  const bearish = insights.filter(i => i.sentiment === "bearish").length;
  const avgConf = insights.length ? Math.round(insights.reduce((s, i) => s + i.confidence, 0) / insights.length) : 0;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 h-[500px] w-[600px] bg-indigo-600/4 blur-[130px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white">AI Market Signals</h1>
            <p className="text-zinc-500 mt-1 text-sm">
              Live sentiment analysis derived from price momentum, 7-day trends, and volume. Updates every 30s.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-[10px] text-zinc-600 font-mono">
                {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-600 transition-all disabled:opacity-40"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} strokeWidth={2.5} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary bar */}
        {!loading && insights.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-400">{bullish} Bullish</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/8 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-red-400" />
              <span className="text-xs font-bold text-red-400">{bearish} Bearish</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-3 py-1.5">
              <span className="text-xs font-bold text-violet-400">Avg {avgConf}% confidence</span>
            </div>
            <span className="text-xs text-zinc-600 ml-auto hidden sm:block">Not financial advice</span>
          </div>
        )}

        {/* Cards grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-48 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {insights.map(insight => {
              const cfg = sentimentConfig[insight.sentiment];
              const up = insight.change24h >= 0;
              const up7 = insight.change7d >= 0;
              const isExp = expanded === insight.asset;

              return (
                <div
                  key={insight.asset}
                  onClick={() => setExpanded(isExp ? null : insight.asset)}
                  className={`rounded-2xl border bg-zinc-900/60 p-5 space-y-4 cursor-pointer transition-all hover:shadow-lg ${
                    isExp ? `border-zinc-600 shadow-lg ${cfg.glow}` : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">{insight.asset}</span>
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[9px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>
                          <cfg.icon className="h-2.5 w-2.5" /> {cfg.label}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">{insight.name}</span>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-sm font-black text-white font-mono">{fmt(insight.price)}</p>
                      <p className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${up ? "text-emerald-400" : "text-red-400"}`}>
                        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(insight.change24h).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Sparkline */}
                  <div className="flex justify-center">
                    <Sparkline data={insight.sparkline} up={up} />
                  </div>

                  {/* Confidence */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500">AI Confidence</span>
                      <span className={`font-bold ${cfg.color}`}>{insight.confidence}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${insight.confidence}%` }} />
                    </div>
                  </div>

                  {/* Reason */}
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{insight.reason}</p>

                  {/* Expanded stats */}
                  {isExp && (
                    <div className="pt-3 border-t border-zinc-800/60 grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-[9px] text-zinc-600 uppercase mb-1">7d Change</p>
                        <p className={`text-xs font-bold ${up7 ? "text-emerald-400" : "text-red-400"}`}>
                          {up7 ? "+" : ""}{insight.change7d.toFixed(2)}%
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-zinc-600 uppercase mb-1">Volume</p>
                        <p className="text-xs font-bold text-zinc-200">{fmtVol(insight.volume)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-zinc-600 uppercase mb-1">ATH %</p>
                        <p className="text-xs font-bold text-violet-400">{insight.athPct ? `${insight.athPct}%` : "—"}</p>
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  {address && (
                    <Link
                      href={`/predictions?asset=${insight.asset}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/40 py-2 text-[11px] font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                    >
                      Predict {insight.asset} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
