"use client";

import { useState, useEffect, type ReactNode } from "react";
import { getAllPredictions, getPredictionCount, formatXlm } from "@/hooks/contract";
import { Target, BarChart3, Clock, TrendingUp, TrendingDown, Check, X } from "lucide-react";

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

  const total = myPredictions.length;
  const active = myPredictions.filter((p) => !p.resolved).length;
  const correct = myPredictions.filter((p) => p.resolved && p.outcome).length;
  const resolved = myPredictions.filter((p) => p.resolved).length;
  const winRate = resolved > 0 ? Math.round((correct / resolved) * 100) : null;

  // Predictions that have expired but not been resolved yet — creator needs to act
  const needsAction = myPredictions.filter(
    (p) => !p.resolved && Date.now() >= Number(p.deadline) * 1000
  );

  // Total XLM staked across all my predictions
  const totalStaked = myPredictions.reduce(
    (s, p) => s + parseFloat(formatXlm(p.stake.toString())), 0
  );

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
        <Target className="h-8 w-8 shrink-0 text-zinc-500" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-semibold text-white">No predictions yet</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            Create your first prediction below to start tracking your stats.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
          <BarChart3 className="h-4 w-4" /> My Stats
        </h3>
        <span className="text-[10px] font-mono text-zinc-500">
          {address.slice(0, 5)}…{address.slice(-4)}
        </span>
      </div>

      {/* Needs-action banner — only shown when creator has expired unresolved predictions */}
      {needsAction.length > 0 && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 flex items-start gap-3">
          <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="text-xs font-bold text-amber-300">
              {needsAction.length} prediction{needsAction.length > 1 ? "s" : ""} need{needsAction.length === 1 ? "s" : ""} resolution
            </p>
            <p className="text-[10px] text-amber-600 mt-0.5">
              Scroll to{" "}
              {needsAction.map((p) => `${p.asset} #${Number(p.id)}`).join(", ")}{" "}
              and mark {needsAction.length > 1 ? "them" : "it"} correct or incorrect.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
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
          <p className="text-[10px] text-zinc-500 mt-1">
            {resolved > 0 ? "win rate" : "no resolved yet"}
          </p>
          <p className="text-[9px] text-zinc-600 uppercase tracking-wide mt-0.5">Accuracy</p>
        </div>
      </div>

      {/* Total staked */}
      {totalStaked > 0 && (
        <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 px-3 py-2 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Total staked across all predictions</span>
          <span className="text-xs font-bold text-violet-400">{totalStaked.toFixed(2)} XLM</span>
        </div>
      )}

      {/* Recent predictions list */}
      {myPredictions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Recent</p>
          {myPredictions.slice(0, 4).map((p) => {
            const isUp = p.direction === "UP";
            const isExpired = Date.now() >= Number(p.deadline) * 1000;
            let badge = "text-amber-400 bg-amber-500/10";
            let label: ReactNode = "Active";
            if (p.resolved) {
              badge = p.outcome
                ? "text-emerald-400 bg-emerald-500/10"
                : "text-red-400 bg-red-500/10";
              label = p.outcome ? (
                <span className="inline-flex items-center gap-0.5"><Check className="h-2.5 w-2.5" />Correct</span>
              ) : (
                <span className="inline-flex items-center gap-0.5"><X className="h-2.5 w-2.5" />Incorrect</span>
              );
            } else if (isExpired) {
              badge = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
              label = <span className="inline-flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Resolve</span>;
            }
            return (
              <div
                key={String(p.id)}
                className="flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2 gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={isUp ? "text-emerald-400" : "text-red-400"}>
                    {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-xs font-bold text-white">{p.asset}</span>
                  <span className="text-[10px] text-zinc-500">
                    {formatXlm(p.stake.toString())} XLM
                  </span>
                </div>
                <span className={`text-[9px] font-bold rounded px-2 py-0.5 shrink-0 ${badge}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
