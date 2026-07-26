"use client";

import { useState } from "react";
import {
  backPrediction,
  resolvePrediction,
  claimRewards,
  formatXlm,
} from "@/hooks/contract";

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

function statusColor(p: Prediction) {
  if (!p.resolved) return "text-amber-400";
  return p.outcome ? "text-emerald-400" : "text-red-400";
}

function statusLabel(p: Prediction) {
  if (!p.resolved) return "PENDING";
  return p.outcome ? "CORRECT ✓" : "INCORRECT ✗";
}

function deadlineFormatted(ts: bigint | number) {
  const ms = Number(ts) * 1000;
  const diff = ms - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
}

export default function PredictionCard({
  prediction,
  address,
  onAction,
}: {
  prediction: Prediction;
  address: string;
  onAction: () => void;
}) {
  const [backAmount, setBackAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const id = Number(prediction.id);
  const isCreator = address === prediction.creator;
  const isExpired = Date.now() >= Number(prediction.deadline) * 1000;

  const handleBack = async () => {
    if (!backAmount) return;
    setLoading(true);
    setError("");
    try {
      await backPrediction(address, id, backAmount);
      setBackAmount("");
      onAction();
    } catch (e: any) {
      setError(e.message || "Failed");
    }
    setLoading(false);
  };

  const handleResolve = async (outcome: boolean) => {
    setLoading(true);
    try {
      await resolvePrediction(address, id, outcome);
      onAction();
    } catch (e: any) {
      setError(e.message || "Failed");
    }
    setLoading(false);
  };

  const handleClaim = async () => {
    setLoading(true);
    try {
      await claimRewards(address, id);
      onAction();
    } catch (e: any) {
      setError(e.message || "Failed");
    }
    setLoading(false);
  };

  const isUp = prediction.direction === "UP";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${
              isUp
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {isUp ? "📈" : "📉"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {prediction.asset}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  isUp
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {prediction.direction}
              </span>
            </div>
            <div className="text-[11px] text-zinc-500">
              Target: {formatXlm(prediction.target_price)} XLM
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-bold ${statusColor(prediction)}`}>
            {statusLabel(prediction)}
          </div>
          <div className="text-[11px] text-zinc-500">
            #{id} · {deadlineFormatted(prediction.deadline)}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Creator Stake</div>
          <div className="text-sm font-bold text-white">
            {formatXlm(prediction.stake)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Pool</div>
          <div className="text-sm font-bold text-violet-400">
            {formatXlm(prediction.total_pool)}
          </div>
        </div>
        <div className="rounded-lg bg-zinc-800/50 px-3 py-2 text-center">
          <div className="text-[10px] text-zinc-500 uppercase">Total</div>
          <div className="text-sm font-bold text-amber-400">
            {formatXlm(
              BigInt(prediction.stake.toString()) +
                BigInt(prediction.total_pool.toString())
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Back prediction (when not resolved) */}
        {!prediction.resolved && (
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={backAmount}
              onChange={(e) => setBackAmount(e.target.value)}
              placeholder="Amount (XLM)"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
            <button
              onClick={handleBack}
              disabled={loading || !backAmount}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-all"
            >
              {loading ? "..." : "Back"}
            </button>
          </div>
        )}

        {/* Creator resolve */}
        {!prediction.resolved && isExpired && isCreator && (
          <div className="flex gap-2">
            <button
              onClick={() => handleResolve(true)}
              disabled={loading}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all"
            >
              ✓ Mark Correct
            </button>
            <button
              onClick={() => handleResolve(false)}
              disabled={loading}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500 transition-all"
            >
              ✗ Mark Incorrect
            </button>
          </div>
        )}

        {/* Claim rewards */}
        {prediction.resolved && prediction.outcome && (
          <button
            onClick={handleClaim}
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-bold text-white hover:from-amber-400 hover:to-orange-400 transition-all"
          >
            {loading ? "Claiming..." : "🏆 Claim Rewards"}
          </button>
        )}

        {prediction.resolved && !prediction.outcome && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 text-center">
            Prediction was incorrect — no rewards available
          </div>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
