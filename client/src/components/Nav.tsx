"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import MarketTicker from "./MarketTicker";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: "⚡" },
  { href: "/predictions", label: "Predictions", icon: "🔮" },
  { href: "/markets", label: "Markets", icon: "🤖" },
  { href: "/portfolio", label: "Portfolio", icon: "💼" },
];

function WalletButton() {
  const { address, balance, connecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try { await connect(); }
    catch (e: any) { setError(e.message ?? "Connection failed"); }
  };

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Testnet</span>
        </div>
        <button
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy address"}
          className="flex items-center gap-2 rounded-xl border border-zinc-700/60 bg-zinc-800/60 px-3 py-2 hover:border-zinc-600 transition-all group"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-mono text-white">{address.slice(0, 5)}…{address.slice(-4)}</span>
            {balance !== null && <span className="text-[9px] text-zinc-500 mt-0.5">{balance} XLM</span>}
          </div>
          <span className="text-[9px] text-zinc-600 group-hover:text-zinc-400">{copied ? "✓" : "⎘"}</span>
        </button>
        <button
          onClick={disconnect}
          className="rounded-xl border border-zinc-700/40 bg-zinc-800/40 px-3 py-2 text-[10px] font-semibold text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleConnect}
        disabled={connecting}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
      >
        {connecting ? (
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
            Connect Wallet
          </>
        )}
      </button>
      {error && (
        <p className="text-[10px] text-red-400 max-w-[240px] text-right leading-snug">
          {error.includes("not found") ? (
            <>Not installed. <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="underline">Get Freighter ↗</a></>
          ) : error}
        </p>
      )}
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Main nav bar ── */}
      <header className="border-b border-zinc-800/50 backdrop-blur-xl bg-[#09090b]/90 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 text-lg">
              🔮
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">StellarPulse AI</p>
              <p className="text-[9px] text-zinc-500 mt-0.5 uppercase tracking-wider">Prediction Market</p>
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 rounded-xl bg-zinc-800/40 p-1 border border-zinc-700/30">
            {NAV_LINKS.map(({ href, label, icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                    active
                      ? "bg-zinc-700 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                  }`}
                >
                  <span className="text-sm">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <WalletButton />
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/50 text-zinc-400 hover:text-white transition-all"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-zinc-800/50 bg-[#09090b]/95 backdrop-blur-xl px-4 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label, icon }) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                      active
                        ? "bg-violet-600/15 text-violet-300 border border-violet-500/20"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <span>{icon}</span>
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Live market ticker — below nav */}
      <MarketTicker />
    </>
  );
}
