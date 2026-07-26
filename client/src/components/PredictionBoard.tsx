"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getPredictionCount, getAllPredictions } from "@/hooks/contract";
import PredictionCard from "./PredictionCard";
import { Sparkles, ArrowRight } from "lucide-react";

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

  // Show only the 3 most recent
  const recent = predictions.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-white">Recent Predictions</h3>
          {lastFetch && !loading && (
            <span className="text-[10px] text-zinc-600 font-mono tabular-nums">
              · updated {lastFetch.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
        >
          View all {predictions.length > 0 && <span className="text-zinc-500">({predictions.length})</span>}
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* List — 3 latest only */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-2xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
          <Sparkles className="h-12 w-12 mx-auto text-zinc-600" strokeWidth={1.5} />
          <p className="text-base font-semibold text-white">No predictions yet</p>
          <p className="text-sm text-zinc-500">Create the first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recent.map(p => (
            <PredictionCard
              key={String(p.id)}
              prediction={p}
              address={address}
              onAction={() => { onRefresh(); setTimeout(load, 800); }}
            />
          ))}
        </div>
      )}

      {/* Footer link if there are more */}
      {predictions.length > 3 && (
        <Link
          href="/transactions"
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-zinc-800 bg-zinc-900/30 py-3 text-sm font-semibold text-zinc-500 hover:text-white hover:border-zinc-700 transition-all"
        >
          View all {predictions.length} predictions <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
