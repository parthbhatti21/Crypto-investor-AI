"use client";

import { useState, useCallback } from "react";
import WalletConnect from "@/components/WalletConnect";
import CreatePrediction from "@/components/CreatePrediction";
import PredictionBoard from "@/components/PredictionBoard";
import AiInsights from "@/components/AiInsights";
import { CONTRACT_ADDRESS } from "@/hooks/contract";

export default function Home() {
  const [address, setAddress] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConnect = useCallback((addr: string) => {
    setAddress(addr);
  }, []);

  const refresh = () => setRefreshKey((k) => k + 1);

  const noContract = !CONTRACT_ADDRESS;

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[500px] w-[600px] bg-violet-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-[#09090b]/80 sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
                <span className="text-lg">🔮</span>
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  StellarPulse AI
                </h1>
                <p className="text-[10px] text-zinc-500 -mt-0.5">
                  Decentralised Prediction Platform
                </p>
              </div>
            </div>
            <WalletConnect onConnect={handleConnect} />
          </div>
        </header>

        {/* Contract warning */}
        {noContract && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>
                Contract not deployed. Deploy the contract first, then set{" "}
                <code className="font-mono bg-amber-500/10 px-1 rounded">
                  NEXT_PUBLIC_CONTRACT_ADDRESS
                </code>{" "}
                in{" "}
                <code className="font-mono bg-amber-500/10 px-1 rounded">
                  .env.local
                </code>
              </span>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
              AI-Powered
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {" "}
                Investment Predictions
              </span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Leverage AI-driven market analysis on Stellar blockchain. Create
              predictions, back insights, and earn rewards through transparent,
              community-powered investment intelligence.
            </p>
          </div>

          {/* Stats banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Avg. Settlement", value: "< 5s", icon: "⚡" },
              { label: "Tx Cost", value: "~0.00001 XLM", icon: "💰" },
              { label: "AI Accuracy", value: "72%+", icon: "🧠" },
              { label: "Network", value: "Stellar Testnet", icon: "🌐" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 text-center"
              >
                <div className="text-lg mb-1">{stat.icon}</div>
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Two-column layout */}
          <div className="grid lg:grid-cols-5 gap-8">
            {/* Left column — predictions */}
            <div className="lg:col-span-3 space-y-6">
              {address && (
                <CreatePrediction address={address} onSuccess={refresh} />
              )}

              {!address && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
                  <div className="text-5xl mb-4">👋</div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto">
                    Connect your Freighter wallet to create predictions, back
                    insights, and earn rewards on the Stellar network.
                  </p>
                </div>
              )}

              <PredictionBoard
                address={address}
                refreshKey={refreshKey}
                onRefresh={refresh}
              />
            </div>

            {/* Right column — AI insights */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <AiInsights />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-800/50 mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-between">
            <p className="text-xs text-zinc-600">
              StellarPulse AI · Built on Stellar Soroban
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-600">Testnet</span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
