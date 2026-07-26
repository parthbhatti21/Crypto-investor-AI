"use client";

import { useState, useEffect } from "react";
import { backPrediction, resolvePrediction, claimRewards, formatXlm } from "@/hooks/contract";
import { TrendingUp, TrendingDown, Check, X, Trophy, CheckCircle2, AlertTriangle } from "lucide-react";

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

function useCountdown(deadlineSec: number) {
  const [label, setLabel] = useState("");
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const tick = () => {
      const ms = deadlineSec * 1000 - Date.now();
      if (ms <= 0) { setLabel("Expired"); setExpired(true); return; }
      setExpired(false);
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLabel(d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m ${s}s left`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadlineSec]);
  return { label, expired };
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
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState<string | null>(null);

  const id = Number(prediction.id);
  const isCreator = address?.toLowerCase() === prediction.creator?.toLowerCase();
  const { label: countdown, expired } = useCountdown(Number(prediction.deadline));
  const isUp = prediction.direction === "UP";
  const stake = BigInt(prediction.stake.toString());
  const pool = BigInt(prediction.total_pool.toString());
  const total = stake + pool;

  const showFeedback = (type: "ok" | "err", msg: string) => {
    setFeedback({ type, msg });
    if (type === "ok") setTimeout(() => setFeedback(null), 4000);
  };

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setFeedback(null);
    try { await fn(); onAction(); }
    catch (e: any) { showFeedback("err", e.message || "Transaction failed"); }
    setLoading(false);
  };

  const handleClaim = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const reward = await claimRewards(address, id);
      const amount = formatXlm((reward ?? 0).toString());
      setClaimed(true);
      setClaimedAmount(amount);
      showFeedback(
        "ok",
        Number(amount) > 0 ? `You received ${amount} XLM!` : "Already claimed — nothing more to receive."
      );
      onAction();
    } catch (e: any) {
      showFeedback("err", e.message || "Transaction failed");
    }
    setLoading(false);
  };

  return (
    <div className={`rounded-2xl border bg-zinc-900/60 p-5 space-y-4 transition-all ${
      prediction.resolved
        ? prediction.outcome ? "border-emerald-500/20" : "border-red-500/15"
        : "border-zinc-800 hover:border-zinc-700"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-xl ${isUp ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
            {isUp ? <TrendingUp className="h-5 w-5 text-emerald-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">{prediction.asset}</span>
              <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 ${isUp ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                {isUp ? "UP" : "DOWN"}
              </span>
              {isCreator && (
                <span className="text-[9px] font-bold rounded px-1.5 py-0.5 text-violet-400 bg-violet-500/10">Mine</span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Target ${formatXlm(prediction.target_price.toString())} · #{id}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="text-right shrink-0 space-y-0.5">
          {!prediction.resolved ? (
            <>
              <div className={`text-[10px] font-bold rounded-full px-2 py-0.5 inline-block ${expired ? "bg-zinc-700 text-zinc-400" : "bg-amber-500/10 text-amber-400"}`}>
                {expired ? "Expired" : "Open"}
              </div>
              <p className="text-[10px] text-zinc-600 font-mono">{countdown}</p>
            </>
          ) : (
            <div className={`inline-flex items-center gap-0.5 text-[10px] font-bold rounded-full px-2 py-0.5 ${prediction.outcome ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
              {prediction.outcome ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
              {prediction.outcome ? "Correct" : "Incorrect"}
            </div>
          )}
        </div>
      </div>

      {/* Pool info */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-zinc-800/50 px-2 py-2">
          <p className="text-[9px] text-zinc-500 uppercase mb-0.5">Staked</p>
          <p className="text-xs font-bold text-white">{formatXlm(prediction.stake.toString())} XLM</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 px-2 py-2">
          <p className="text-[9px] text-zinc-500 uppercase mb-0.5">Backed</p>
          <p className="text-xs font-bold text-violet-400">{formatXlm(prediction.total_pool.toString())} XLM</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 px-2 py-2">
          <p className="text-[9px] text-zinc-500 uppercase mb-0.5">Total Pool</p>
          <p className="text-xs font-bold text-amber-400">{formatXlm(total.toString())} XLM</p>
        </div>
      </div>

      {/* Pool bar */}
      {total > BigInt(0) && (
        <div>
          <div className="flex justify-between text-[9px] text-zinc-600 mb-1">
            <span>Creator</span><span>Backers</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
              style={{ width: `${Math.round((Number(pool) / Number(total)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {/* Back this prediction */}
        {!prediction.resolved && address && !isCreator && (
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={backAmount}
              onChange={(e) => setBackAmount(e.target.value)}
              placeholder="XLM to back"
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
            />
            <button
              onClick={() => run(() => backPrediction(address, id, backAmount).then(() => setBackAmount("")))}
              disabled={loading || !backAmount}
              className="rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 disabled:opacity-50 transition-all active:scale-95"
            >
              {loading ? "…" : "Back it"}
            </button>
          </div>
        )}

        {/* Creator: resolve after deadline */}
        {!prediction.resolved && expired && isCreator && (
          <div className="space-y-1.5">
            <p className="text-[11px] text-zinc-500">Did your prediction come true?</p>
            <div className="flex gap-2">
              <button
                onClick={() => run(() => resolvePrediction(address, id, true))}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Yes, it was correct
              </button>
              <button
                onClick={() => run(() => resolvePrediction(address, id, false))}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-500 transition-all active:scale-95 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> No, I was wrong
              </button>
            </div>
          </div>
        )}

        {/* Claim rewards */}
        {prediction.resolved && prediction.outcome && address && (
          claimed ? (
            <div className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-2.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Claimed {claimedAmount} XLM
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white hover:from-amber-400 hover:to-orange-400 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-amber-500/20"
            >
              {loading ? "Claiming…" : <><Trophy className="h-3.5 w-3.5" /> Claim Rewards</>}
            </button>
          )
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${
          feedback.type === "ok"
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        }`}>
          <span className="shrink-0">{feedback.type === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}</span>
          <span className="break-all">{feedback.msg}</span>
        </div>
      )}
    </div>
  );
}
