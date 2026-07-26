"use client";

import { useState } from "react";
import { createPrediction, parseXlm } from "@/hooks/contract";

const ASSETS = ["XLM", "BTC", "ETH", "SOL", "DOGE", "ADA"];
const DURATIONS = [
  { label: "1 Hour", hours: 1 },
  { label: "24 Hours", hours: 24 },
  { label: "7 Days", hours: 168 },
  { label: "30 Days", hours: 720 },
];

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || !stake) return;
    setSubmitting(true);
    setError("");

    try {
      const deadline = Math.floor(Date.now() / 1000) + duration * 3600;
      await createPrediction(
        address,
        asset,
        direction,
        parseXlm(targetPrice),
        parseXlm(stake),
        deadline
      );
      setTargetPrice("");
      setStake("");
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Transaction failed");
    }
    setSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5"
    >
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="text-xl">🔮</span> Create AI Prediction
      </h3>

      {/* Asset selector */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
          Asset
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ASSETS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAsset(a)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                asset === a
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Direction */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
          Prediction Direction
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDirection("UP")}
            className={`rounded-xl py-3 text-sm font-bold transition-all ${
              direction === "UP"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            📈 BULLISH (UP)
          </button>
          <button
            type="button"
            onClick={() => setDirection("DOWN")}
            className={`rounded-xl py-3 text-sm font-bold transition-all ${
              direction === "DOWN"
                ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            📉 BEARISH (DOWN)
          </button>
        </div>
      </div>

      {/* Target price & Stake */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
            Target Price (XLM)
          </label>
          <input
            type="number"
            step="0.01"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="e.g. 0.50"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
            Stake (XLM)
          </label>
          <input
            type="number"
            step="0.01"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="e.g. 100"
            required
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
          Resolution Window
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.hours}
              type="button"
              onClick={() => setDuration(d.hours)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                duration === d.hours
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !targetPrice || !stake}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Submitting to Stellar...
          </span>
        ) : (
          `🚀 Submit Prediction`
        )}
      </button>
    </form>
  );
}
