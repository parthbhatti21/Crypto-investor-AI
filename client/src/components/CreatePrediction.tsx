"use client";

import { useState, useEffect } from "react";
import { createPrediction, parseXlm } from "@/hooks/contract";

const ASSETS = ["XLM", "BTC", "ETH", "SOL", "DOGE", "ADA"];
const DURATIONS = [
  { label: "1 hour", hours: 1 },
  { label: "1 day", hours: 24 },
  { label: "7 days", hours: 168 },
  { label: "30 days", hours: 720 },
];

type MarketInsight = {
  asset: string;
  price: number;
  change24h: number;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
};

function formatPrice(p: number) {
  if (p >= 10000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return p.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return p.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export default function CreatePrediction({
  address,
  onSuccess,
}: {
  address: string;
  onSuccess: () => void;
}) {
  const [asset, setAsset] = useState("XLM");
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [targetPrice, setTargetPrice] = useState("");
  const [stake, setStake] = useState("");
  const [duration, setDuration] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [marketData, setMarketData] = useState<Record<string, MarketInsight>>({});

  useEffect(() => {
    fetch("/api/market-insights", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: MarketInsight[]) => {
        const map: Record<string, MarketInsight> = {};
        data.forEach((d) => { map[d.asset] = d; });
        setMarketData(map);
      })
      .catch(() => {});
  }, []);

  // Auto-fill target price when asset or direction changes
  useEffect(() => {
    const d = marketData[asset];
    if (!d) return;
    const suggested = d.price * (direction === "UP" ? 1.05 : 0.95);
    setTargetPrice(suggested.toFixed(suggested < 1 ? 6 : suggested < 100 ? 4 : 2));
  }, [asset, direction, marketData]);

  const currentAsset = marketData[asset];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || !stake) return;
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const deadline = Math.floor(Date.now() / 1000) + duration * 3600;
      await createPrediction(address, asset, direction, parseXlm(targetPrice), parseXlm(stake), deadline);
      setTargetPrice("");
      setStake("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
      <h3 className="text-base font-bold text-white flex items-center gap-2">
        🔮 Create a Prediction
      </h3>

      {/* Step 1 — Pick asset */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-2">Step 1 — Which asset?</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ASSETS.map((a) => {
            const d = marketData[a];
            return (
              <button
                key={a}
                type="button"
                onClick={() => setAsset(a)}
                className={`rounded-xl px-2 py-2.5 text-xs font-bold transition-all ${
                  asset === a
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                <div>{a}</div>
                {d && (
                  <div className={`text-[9px] mt-0.5 ${
                    asset === a ? "text-violet-200" : d.change24h >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {d.change24h >= 0 ? "+" : ""}{d.change24h.toFixed(1)}%
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {currentAsset && (
          <p className="text-[11px] text-zinc-500 mt-2">
            Current price: <span className="text-white font-mono">${formatPrice(currentAsset.price)}</span>
            {" · "}AI signal: <span className={`font-semibold ${
              currentAsset.sentiment === "bullish" ? "text-emerald-400" :
              currentAsset.sentiment === "bearish" ? "text-red-400" : "text-amber-400"
            }`}>{currentAsset.sentiment}</span>
          </p>
        )}
      </div>

      {/* Step 2 — Direction */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-2">Step 2 — Will it go up or down?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDirection("UP")}
            className={`rounded-xl py-3.5 text-sm font-bold transition-all ${
              direction === "UP"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            📈 Going UP
          </button>
          <button
            type="button"
            onClick={() => setDirection("DOWN")}
            className={`rounded-xl py-3.5 text-sm font-bold transition-all ${
              direction === "DOWN"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            📉 Going DOWN
          </button>
        </div>
      </div>

      {/* Step 3 — Price & stake */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-2">Step 3 — Set your target price and stake</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1.5">Target price (USD)</label>
            <input
              type="number"
              step="any"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="0.00"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
            />
            <p className="text-[9px] text-zinc-600 mt-1">Pre-filled with a ±5% suggestion</p>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1.5">Your stake (XLM)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="e.g. 10"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
            />
            <p className="text-[9px] text-zinc-600 mt-1">Minimum 0.01 XLM</p>
          </div>
        </div>
      </div>

      {/* Step 4 — Duration */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 mb-2">Step 4 — How long until resolution?</p>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.hours}
              type="button"
              onClick={() => setDuration(d.hours)}
              className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                duration === d.hours
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {targetPrice && stake && (
        <div className="rounded-xl bg-zinc-800/40 border border-zinc-700/40 px-4 py-3">
          <p className="text-xs text-zinc-300">
            You're predicting <span className="font-bold text-white">{asset}</span> will go{" "}
            <span className={`font-bold ${direction === "UP" ? "text-emerald-400" : "text-red-400"}`}>{direction}</span>{" "}
            to <span className="font-bold text-white font-mono">${parseFloat(targetPrice).toLocaleString()}</span>{" "}
            within <span className="font-bold text-white">{DURATIONS.find(d => d.hours === duration)?.label}</span>,
            staking <span className="font-bold text-violet-400">{parseFloat(stake || "0").toFixed(2)} XLM</span>.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-400 flex gap-2">
          <span>⚠️</span><span>{error}</span>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-xs text-emerald-400 flex gap-2">
          <span>✅</span><span>Prediction submitted to Stellar!</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !targetPrice || !stake}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting to Stellar…
          </span>
        ) : "🚀 Submit Prediction"}
      </button>
    </form>
  );
}
