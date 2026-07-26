"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import UserDashboard from "@/components/UserDashboard";
import SendXLM from "@/components/SendXLM";
import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function PortfolioClient() {
  const { address, setBalanceFromExternal } = useWallet();
  const [refreshKey] = useState(0);

  if (!address) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <Briefcase className="h-14 w-14 mx-auto text-zinc-600" strokeWidth={1.5} />
          <h1 className="text-2xl font-black text-white">Your Portfolio</h1>
          <p className="text-zinc-500 max-w-sm mx-auto text-sm leading-relaxed">
            Connect your Freighter wallet to view your prediction history, win rate, and send XLM.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
          >
            Go to Home to Connect
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-[500px] w-[600px] bg-indigo-600/4 blur-[130px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">
        {/* Page header */}
        <div className="mb-2">
          <h1 className="text-3xl font-black text-white">My Portfolio</h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Your prediction history, performance stats, and wallet tools.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <UserDashboard address={address} refreshKey={refreshKey} />
          </div>
          <div className="space-y-6">
            <SendXLM address={address} onBalanceRefresh={setBalanceFromExternal} />
          </div>
        </div>
      </div>
    </div>
  );
}
