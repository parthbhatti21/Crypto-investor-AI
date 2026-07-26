"use client";

import { useState, useEffect } from "react";
import { connectWallet, getWalletAddress } from "@/hooks/contract";

export default function WalletConnect({
  onConnect,
}: {
  onConnect: (addr: string) => void;
}) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) {
        setAddress(addr);
        onConnect(addr);
      }
    });
  }, [onConnect]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const addr = await connectWallet();
      if (addr) {
        setAddress(addr);
        onConnect(addr);
      }
    } catch (e) {
      console.error("Wallet connection failed:", e);
    }
    setLoading(false);
  };

  if (address) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-mono text-zinc-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => {
            setAddress(null);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      {loading ? "Connecting..." : "Connect Freighter"}
    </button>
  );
}
