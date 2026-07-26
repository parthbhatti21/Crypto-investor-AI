"use client";

import { useState, useEffect, useCallback } from "react";
import { getPredictionCount, getAllPredictions } from "@/hooks/contract";
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

type Filter = "all" | "pending" | "resolved" | "mine";

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
  const [filter, setFilter] = useState<Filter>("all");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const count = await getPredictionCount();
      const preds = await getAllPredictions(count);
      setPredictions(preds.reverse());
      setLastFetch(new Date());
    } catch {
      setPredictions([]);
    }
    setLoading(false);
  }, []);

  // Reload when parent triggers refresh
  useEffect(() => { load(); }, [refreshKey, load]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const t = setInterval(() => load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = predictions.filter((p) => {
    if (filter === "pending") return !p.resolved;
    if (filter === "resolved") return p.resolved;
    if (filter === "mine") return (
      address && p.creator?.toLowerCase() === address.toLowerCase()
    );
    return true;
  });

  const pendingCount = predictions.filter((p) => !p.resolved).length;
  const mineCount = address
    ? predictions.filter((p) => p.creator?.toLowerCase() === address.toLowerCase()).length
    : 0;

  const FILTERS: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: predictions.length },
    { key: "pending", label: "Open", count: pendingCount },
    { key: "resolved", label: "Resolved" },
    ...(address ? [{ key: "mine" as Filter, label: "Mine", count: mineCount }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📊</span> Live Predictions
          </h3>
          {lastFetch && !loading && (
            <span className="text-[9px] text-zinc-600 font-mono">
              {lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-1">
          {FILTERS.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1 ${
                filter === key ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  filter === key ? "bg-zinc-600 text-zinc-200" : "bg-zinc-700/60 text-zinc-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-2">
          <div className="text-4xl">🔮</div>
          <p className="text-sm text-zinc-400">
            {filter === "mine"
              ? "You haven't created any predictions yet."
              : filter === "resolved"
              ? "No resolved predictions yet."
              : "No predictions yet. Create the first one!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PredictionCard
              key={String(p.id)}
              prediction={p}
              address={address}
              onAction={() => { onRefresh(); setTimeout(load, 800); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
