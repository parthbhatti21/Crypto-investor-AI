"use client";

import { useState, useEffect } from "react";
import { getAllPredictions, getPredictionCount, formatXlm } from "@/hooks/contract";

type Prediction = {
  id: bigint | number;
  creator: string;
  asset: string;
  direction: string;
  target_price: bigint | string;
  stake: bigint | string;
  total_pool: bigint | string;
  deadline: bigint | number;
  resolved: boolean;
  outcome: boolean;
};

export default function UserDashboard({
  address,
  refreshKey,
}: {
  address: string;
  refreshKey: number;
}) {
  const [myPredictions, setMyPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    getPredictionCount()
      .then((count) => getAllPredictions(count))
      .then((all) => {
        const mine = all.filter(
          (p) => p.creator?.toLowerCase() === address.toLowerCase()
        );
        setMyPredictions(mine.slice().reverse());
      })
      .catch(() => setMyPredictions([]))
      .finally(() => setLoading(false));
  }, [address, refreshKey]);

  if (!address) return null;

  // Compute simple stats
  const total = myPredictions.length;
  const active = myPredictions.filter((p) => !p.resolved).length;
  const correct = myPredictions.filter((p) => p.resolved && p.outcome).length;
  const resolved = myPredictions.filter((p) => p.resolved).length;
  const winRate = resolved > 0 ? Math.round((correct / resolved) * 100) : null;

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
        <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 flex items-center gap-4">
        <span className="text-3xl">🎯</span>
        <div>
          <p className="text-sm font-semibold text-white">No predictions yet</p>
          <p className="text-xs text-zinc-500 mt-0.5">Create your first prediction below to start tracking your stats.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">📊 My Stats</h3>
        <span className="text-[10px] font-mono text-zinc-500">{address.slice(0, 5)}…{address.slice(-4)}</span>
      </div>

      {/* Three key numbers */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-zinc-800/50 p-3 text-center">
          <p className="text-2xl font-black text-white">{total}</p>
          <p className="text-[10px] text-zinc-500 mt-1">{active} active</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wide mt-0.5">Predictions</p>
        </div>
        <div className="rounded-xl bg-zinc-800/50 p-3 text-center">
          <p className="text-2xl font-black text-emerald-400">{correct}</p>
          <p className="text-[10px] text-zinc-500 mt-1">of {resolved} resolved</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wide mt-0.5">Correct</p>
        </div>
        <div className="rounded-xl bg-zinc-800/50 p-3 text-center">
          <p className="text-2xl font-black text-violet-400">
            {winRate !== null ? `${winRate}%` : "—"}
          </p>
          <p className="text-[10px] text-zinc-500 mt-1">{resolved > 0 ? "resolved" : "no data yet"}</p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wide mt-0.5">Win Rate</p>
        </div>
      </div>

      {/* Recent list */}
      {myPredictions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Recent</p>
          {myPredictions.slice(0, 4).map((p) => {
            const isUp = p.direction === "UP";
            const isExpired = Date.now() >= Number(p.deadline) * 1000;
            let badge = "text-amber-400 bg-amber-500/10";
            let label = "Active";
            if (p.resolved) {
              badge = p.outcome ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10";
              label = p.outcome ? "Correct ✓" : "Incorrect ✗";
            } else if (isExpired) {
              badge = "text-zinc-400 bg-zinc-800";
              label = "Needs resolution";
            }
            return (
              <div key={String(p.id)} className="flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={isUp ? "text-emerald-400" : "text-red-400"}>{isUp ? "📈" : "📉"}</span>
                  <span className="text-xs font-bold text-white">{p.asset}</span>
                  <span className="text-[10px] text-zinc-500">{formatXlm(p.stake.toString())} XLM staked</span>
                </div>
                <span className={`text-[9px] font-bold rounded px-2 py-0.5 shrink-0 ${badge}`}>{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
