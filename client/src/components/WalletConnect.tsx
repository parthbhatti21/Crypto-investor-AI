"use client";

import { useState, useEffect, useCallback } from "react";
import { connectWallet, getWalletAddress, fetchXlmBalance } from "@/hooks/contract";
import { Check, Copy, X, ExternalLink } from "lucide-react";

export default function WalletConnect({
  onConnect,
  externalBalance,
}: {
  onConnect: (addr: string) => void;
  externalBalance?: string | null;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Push externally-refreshed balance (e.g. after a send)
  useEffect(() => {
    if (externalBalance !== undefined) setBalance(externalBalance ?? null);
  }, [externalBalance]);

  const doFetchBalance = useCallback(async (addr: string) => {
    const bal = await fetchXlmBalance(addr);
    setBalance(bal);
  }, []);

  // Silent auto-reconnect on mount — only if site was already approved
  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) {
        setAddress(addr);
        onConnect(addr);
        doFetchBalance(addr);
      }
    });
  }, [onConnect, doFetchBalance]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const addr = await connectWallet();
      if (addr) {
        setAddress(addr);
        onConnect(addr);
        doFetchBalance(addr);
      }
    } catch (e: any) {
      setError(e.message ?? "Connection failed");
    }
    setLoading(false);
  };

  const handleDisconnect = () => {
    setAddress(null);
    setBalance(null);
    setError(null);
    onConnect("");
  };

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Connected state
  if (address) {
    return (
      <div className="flex items-center gap-2">
        {/* Testnet badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Testnet</span>
        </div>

        {/* Address + balance */}
        <button
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy address"}
          className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 hover:border-zinc-600 transition-all group"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-mono text-white">
              {address.slice(0, 5)}…{address.slice(-4)}
            </span>
            {balance !== null && (
              <span className="text-[9px] text-zinc-500 mt-0.5">{balance} XLM</span>
            )}
          </div>
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </span>
        </button>

        {/* Disconnect */}
        <button
          onClick={handleDisconnect}
          title="Disconnect"
          className="rounded-xl border border-zinc-700/40 bg-zinc-800/40 px-3 py-2 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Disconnected state
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        onClick={handleConnect}
        disabled={loading}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting…
          </>
        ) : (
          <>
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Freighter
          </>
        )}
      </button>

      {/* Inline error — shown below button */}
      {error && (
        <p className="text-[10px] text-red-400 max-w-[260px] text-right leading-snug">
          {error.includes("not found")
            ? <>Freighter not installed. <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline hover:text-red-300">Get it here <ExternalLink className="h-2.5 w-2.5" /></a></>
            : error}
        </p>
      )}
    </div>
  );
}
