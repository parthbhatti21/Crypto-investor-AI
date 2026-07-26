"use client";

import { useState, useEffect } from "react";
import { sendXlmPayment, fetchXlmBalanceRaw, type SendXlmResult } from "@/hooks/contract";
import { Send, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";

type TxState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "success"; result: SendXlmResult; amount: string; destination: string }
  | { status: "error"; message: string };

export default function SendXLM({
  address,
  onBalanceRefresh,
}: {
  address: string;
  onBalanceRefresh?: (bal: string) => void;
}) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [txState, setTxState] = useState<TxState>({ status: "idle" });
  const [balance, setBalance] = useState<number | null>(null);

  // Fetch current XLM balance to show inline and validate amount
  useEffect(() => {
    if (!address) return;
    fetchXlmBalanceRaw(address).then(setBalance);
  }, [address]);

  const busy = txState.status === "pending";
  const destOk = destination.startsWith("G") && destination.length === 56;
  const amtNum = parseFloat(amount);
  const amtOk = amtNum > 0;
  const overBalance = balance !== null && amtNum > balance - 1; // keep 1 XLM reserve for fees
  const canSend = destOk && amtOk && !busy && !overBalance;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setTxState({ status: "pending" });
    try {
      const result = await sendXlmPayment(address, destination, amount);
      setTxState({ status: "success", result, amount, destination });
      // Refresh balance display
      const raw = await fetchXlmBalanceRaw(address);
      setBalance(raw);
      if (raw !== null && onBalanceRefresh) {
        onBalanceRefresh(raw.toLocaleString("en-US", { maximumFractionDigits: 2 }));
      }
      setDestination("");
      setAmount("");
    } catch (err: any) {
      setTxState({ status: "error", message: err.message ?? "Unknown error" });
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Send className="h-4 w-4" /> Send XLM
        </h3>
        {balance !== null && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-zinc-500">Available:</span>
            <span className="font-bold text-white font-mono">
              {balance.toLocaleString("en-US", { maximumFractionDigits: 2 })} XLM
            </span>
          </div>
        )}
      </div>

      {/* Success state */}
      {txState.status === "success" && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-emerald-300">Transaction confirmed!</p>
              <p className="text-[11px] text-emerald-600">
                Ledger #{txState.result.ledger} · Stellar Testnet
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-800/50 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Sent</span>
              <span className="font-bold text-white">
                {parseFloat(txState.amount).toFixed(2)} XLM
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500 shrink-0">To</span>
              <span className="font-mono text-zinc-300 text-[10px] truncate">
                {txState.destination}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-zinc-500 shrink-0">Hash</span>
              <span className="font-mono text-[10px] text-violet-400 truncate">
                {txState.result.hash}
              </span>
            </div>
          </div>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txState.result.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-emerald-500/20 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all"
          >
            View on Stellar Expert <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={() => setTxState({ status: "idle" })}
            className="w-full rounded-lg border border-zinc-700 py-2 text-xs text-zinc-400 hover:text-white transition-all"
          >
            Send another
          </button>
        </div>
      )}

      {/* Form */}
      {txState.status !== "success" && (
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Recipient address
              <span className="ml-1 font-normal text-zinc-600">
                (starts with G, 56 characters)
              </span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value.trim());
                setTxState({ status: "idle" });
              }}
              placeholder="GABC…XYZ"
              spellCheck={false}
              disabled={busy}
              className={`w-full rounded-lg border px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 bg-zinc-800/50 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                destination.length > 0 && !destOk
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                  : destOk
                  ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/20"
                  : "border-zinc-700 focus:border-violet-500 focus:ring-violet-500/20"
              }`}
            />
            {destination.length > 0 && !destOk && (
              <p className="text-[11px] text-red-400 mt-1">
                Must be 56 characters starting with G
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              Amount (XLM)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setTxState({ status: "idle" });
              }}
              placeholder="0.00"
              disabled={busy}
              className={`w-full rounded-lg border bg-zinc-800/50 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                overBalance
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                  : "border-zinc-700 focus:border-violet-500 focus:ring-violet-500/20"
              }`}
            />
            {overBalance && (
              <p className="text-[11px] text-red-400 mt-1">
                Insufficient balance (keeping 1 XLM reserve for fees)
              </p>
            )}
            {/* Quick amounts */}
            <div className="flex gap-2 mt-2">
              {["1", "10", "100"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  disabled={busy}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-40"
                >
                  {v} XLM
                </button>
              ))}
              {balance !== null && balance > 2 && (
                <button
                  type="button"
                  onClick={() => setAmount((balance - 1).toFixed(2))}
                  disabled={busy}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all disabled:opacity-40"
                >
                  Max
                </button>
              )}
            </div>
          </div>

          {txState.status === "error" && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-400 flex gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{txState.message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!canSend}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {busy ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" strokeWidth="4" fill="none"
                  />
                  <path
                    className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Waiting for Freighter…
              </span>
            ) : (
              "Send XLM"
            )}
          </button>

          <p className="text-[10px] text-zinc-600 text-center">
            Freighter will ask you to approve. Fee: ~0.00001 XLM.
          </p>
        </form>
      )}
    </div>
  );
}
