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

type Filter = "all" | "open" | "resolved" | "mine";

const FILTER_META: { key: Filter; label: string; icon: string; desc: string }[] = [
  { key: "all",      label: "All",      icon: "🌐", desc: "Every prediction" },
  { key: "open",     label: "Open",     icon: "⏳", desc: "Accepting backers" },
  { key: "resolved", label: "Resolved", icon: "✅", desc: "Closed predictions" },
  { key: "mine",     label: "Mine",     icon: "👤", desc: "Created by you"    },
];

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

  useEffect(() => { load(); }, [refreshKey, load]);
  useEffect(() => {
    const t = setInterval(() => load(), 15_000);
    return () => clearInterval(t);
  }, [load]);

  // Count per filter
  const counts: Record<Filter, number> = {
    all:      predictions.length,
    open:     predictions.filter(p => !p.resolved).length,
    resolved: predictions.filter(p => p.resolved).length,
    mine:     address ? predictions.filter(p => p.creator?.toLowerCase() === address.toLowerCase()).length : 0,
  };

  const filtered = predictions.filter(p => {
    if (filter === "open")     return !p.resolved;
    if (filter === "resolved") return p.resolved;
    if (filter === "mine")     return address && p.creator?.toLowerCase() === address.toLowerCase();
    return true;
  });

  // Only show Mine tab when connected
  const visibleFilters = FILTER_META.filter(f => f.key !== "mine" || !!address);

  return (
    <div className="space-y-5">

      {/* Section heading + timestamp */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">📊 Live Predictions</h3>
        {lastFetch && !loading && (
          <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
            Updated {lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Filter cards — each on its own pill, full-width row */}
      <div className={`grid gap-2 ${address ? "grid-cols-4" : "grid-cols-3"}`}>
        {visibleFilters.map(({ key, label, icon }) => {
          const active = filter === key;
          const count = counts[key];
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-xl border px-3 py-3 text-center transition-all ${
                active
                  ? "bg-zinc-700 border-zinc-600 shadow-sm"
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50"
              }`}
            >
              <div className="text-base mb-1">{icon}</div>
              <div className={`text-xs font-bold ${active ? "text-white" : "text-zinc-400"}`}>
                {label}
              </div>
              <div className={`text-lg font-black mt-0.5 ${
                active ? "text-white" : "text-zinc-500"
              }`}>
                {count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active filter description */}
      <p className="text-xs text-zinc-600">
        {FILTER_META.find(f => f.key === filter)?.desc} · {filtered.length} prediction{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
          <div className="text-5xl">🔮</div>
          <p className="text-base font-semibold text-white">
            {filter === "mine"     ? "No predictions yet" :
             filter === "resolved" ? "No resolved predictions yet" :
             filter === "open"     ? "No open predictions" :
                                    "No predictions yet"}
          </p>
          <p className="text-sm text-zinc-500">
            {filter === "mine"
              ? "Create your first prediction using the form above."
              : "Check back soon or create the first one!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
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
