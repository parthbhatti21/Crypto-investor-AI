"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import CreatePrediction from "@/components/CreatePrediction";
import PredictionBoard from "@/components/PredictionBoard";
import AiInsights from "@/components/AiInsights";
import { Plug } from "lucide-react";

export default function PredictionsClient() {
  const { address } = useWallet();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<string | undefined>();

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSelectAsset = useCallback((asset: string) => {
    setSelectedAsset(asset);
    document.getElementById("create-prediction")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[500px] w-[600px] bg-violet-600/4 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[500px] bg-indigo-600/4 blur-[110px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Live Predictions</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Browse community predictions, back the ones you agree with, and create your own.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Left — create + board */}
          <div className="lg:col-span-3 space-y-6">
            {address ? (
              <div id="create-prediction">
                <CreatePrediction
                  address={address}
                  onSuccess={refresh}
                  defaultAsset={selectedAsset}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-3">
                <Plug className="h-10 w-10 mx-auto text-zinc-600" strokeWidth={1.5} />
                <p className="text-base font-bold text-white">Connect your wallet to create predictions</p>
                <p className="text-sm text-zinc-500">You can still browse and view existing predictions below.</p>
              </div>
            )}
            <PredictionBoard address={address} refreshKey={refreshKey} onRefresh={refresh} />
          </div>

          {/* Right — AI insights sticky */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <AiInsights onSelectAsset={address ? handleSelectAsset : undefined} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
