"use client";

import { useState, useCallback } from "react";
import WalletConnect from "@/components/WalletConnect";
import CreatePrediction from "@/components/CreatePrediction";
import PredictionBoard from "@/components/PredictionBoard";
import AiInsights from "@/components/AiInsights";
import UserDashboard from "@/components/UserDashboard";
import MarketTicker from "@/components/MarketTicker";
import SendXLM from "@/components/SendXLM";
import { ToastProvider } from "@/components/Toast";
import { CONTRACT_ADDRESS } from "@/hooks/contract";

const STEPS = [
  {
    n: "1",
    icon: "🔌",
    title: "Connect Wallet",
    desc: "Click Connect Freighter in the top-right and approve access in the extension.",
  },
  {
    n: "2",
    icon: "🔮",
    title: "Make a Prediction",
    desc: "Pick a crypto asset, choose UP or DOWN, set a target price, stake some XLM, and submit.",
  },
  {
    n: "3",
    icon: "🏆",
    title: "Earn Rewards",
    desc: "Others back your prediction. When the deadline passes, correct predictions claim the pool.",
  },
];

export default function Home() {
  const [address, setAddress] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [walletBalance, setWalletBalance] = useState<string | null | undefined>(undefined);
  // Asset selected by clicking an AI insight card — flows into CreatePrediction
  const [selectedAsset, setSelectedAsset] = useState<string | undefined>(undefined);

  const handleConnect = useCallback((addr: string) => {
    setAddress(addr);
    if (!addr) setWalletBalance(null);
  }, []);

  const handleBalanceRefresh = useCallback((bal: string) => {
    setWalletBalance(bal);
  }, []);

  const handleSelectAsset = useCallback((asset: string) => {
    setSelectedAsset(asset);
    // Scroll to the prediction form so the user sees the selection applied
    document.getElementById("create-prediction")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#09090b]">
        {/* Ambient glow */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[600px] w-[700px] bg-violet-600/4 blur-[140px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] bg-indigo-600/4 blur-[120px] rounded-full" />
        </div>

        <div className="relative flex flex-col min-h-screen">

          {/* ── Header ── */}
          <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-[#09090b]/85 sticky top-0 z-50">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 text-lg">
                  🔮
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">StellarPulse AI</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    Prediction Market · Stellar Testnet
                  </p>
                </div>
              </div>
              <WalletConnect onConnect={handleConnect} externalBalance={walletBalance} />
            </div>
          </header>

          {/* Live price ticker */}
          <MarketTicker />

          {/* Contract warning */}
          {!CONTRACT_ADDRESS && (
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 mt-4">
              <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-sm text-amber-300 flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  Contract not deployed — set{" "}
                  <code className="bg-amber-500/10 px-1 rounded text-xs font-mono">
                    NEXT_PUBLIC_CONTRACT_ADDRESS
                  </code>{" "}
                  in{" "}
                  <code className="bg-amber-500/10 px-1 rounded text-xs font-mono">
                    .env.local
                  </code>
                </span>
              </div>
            </div>
          )}

          <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-10 space-y-14">

            {/* Hero */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-4 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                  Live on Stellar Testnet
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Predict Markets,{" "}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  Earn XLM
                </span>
              </h1>
              <p className="text-zinc-400 max-w-xl mx-auto text-base leading-relaxed">
                Make crypto price predictions on the Stellar blockchain. Back others, and claim
                rewards when you are right.
              </p>
              {!address && (
                <p className="text-sm text-zinc-500 pt-2">
                  Connect your Freighter wallet in the top-right to get started.
                </p>
              )}
            </div>

            {/* How it works — only shown before connecting */}
            {!address && (
              <div className="space-y-4">
                <h2 className="text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                  How it works
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {STEPS.map((s) => (
                    <div
                      key={s.n}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-black text-violet-400">
                          {s.n}
                        </div>
                        <span className="text-base">{s.icon}</span>
                        <p className="text-sm font-bold text-white">{s.title}</p>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed pl-11">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main layout */}
            <div className="grid lg:grid-cols-5 gap-8 items-start">

              {/* Left column */}
              <div className="lg:col-span-3 space-y-6">
                {address && (
                  <>
                    <UserDashboard address={address} refreshKey={refreshKey} />
                    <div id="create-prediction">
                      <CreatePrediction
                        address={address}
                        onSuccess={refresh}
                        defaultAsset={selectedAsset}
                      />
                    </div>
                    <SendXLM address={address} onBalanceRefresh={handleBalanceRefresh} />
                  </>
                )}
                <PredictionBoard
                  address={address}
                  refreshKey={refreshKey}
                  onRefresh={refresh}
                />
              </div>

              {/* Right column — AI insights sticky */}
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-24">
                  <AiInsights onSelectAsset={address ? handleSelectAsset : undefined} />
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-zinc-800/40 mt-10">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex items-center justify-between">
              <p className="text-xs text-zinc-600">
                StellarPulse AI · Built on Stellar Soroban
              </p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-600">Testnet Online</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
