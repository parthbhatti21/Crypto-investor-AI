"use client";

import { useState, useEffect } from "react";
import {
  getPredictionCount,
  getAllPredictions,
} from "@/hooks/contract";
import PredictionCard from "./PredictionCard";

type Prediction = {
  id: bigint | number;
  creator: string;
  asset: string;
  direction: string;
  target_price: bigint | string;
  total_pool: bigint | string;
  stake: bigint | string;
  deadline: bigint | number;
  resolved: boolean;
  outcome: boolean;
};

export default function PredictionBoard({
  address,
  refreshKey,
  onRefresh,
}: {
  address: string;
  refreshKey: number;
  onRefresh: () => void;
}) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "resolved">("all");

  const load = async () => {
    setLoading(true);
    try {
      const count = await getPredictionCount();
      const preds = await getAllPredictions(count);
      setPredictions(preds.reverse());
    } catch {
      setPredictions([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [refreshKey]);

  const filtered = predictions.filter((p) => {
    if (filter === "pending") return !p.resolved;
    if (filter === "resolved") return p.resolved;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-xl">📊</span> Live Predictions
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {predictions.length}
          </span>
        </h3>
        <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-1">
          {(["all", "pending", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center">
          <div className="text-4xl mb-3">🔮</div>
          <p className="text-zinc-400 text-sm">
            No predictions yet. Create the first one!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PredictionCard
              key={String(p.id)}
              prediction={p}
              address={address}
              onAction={() => {
                onRefresh();
                setTimeout(load, 500);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
