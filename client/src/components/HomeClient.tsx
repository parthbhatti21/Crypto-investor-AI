"use client";

import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { ArrowRight, ExternalLink } from "lucide-react";

export default function HomeClient() {
  const { address, connecting, connect } = useWallet();

  if (address) {
    return (
      <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
        <Link
          href="/predictions"
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Go to Predictions <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/portfolio"
          className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-7 py-3 text-sm font-bold text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
        >
          My Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      <button
        onClick={connect}
        disabled={connecting}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
      >
        {connecting ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Connect Freighter to Start
          </>
        )}
      </button>
      <p className="text-xs text-zinc-600">
        Need Freighter?{" "}
        <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-violet-400 hover:text-violet-300 underline">
          Download it here <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </p>
    </div>
  );
}
