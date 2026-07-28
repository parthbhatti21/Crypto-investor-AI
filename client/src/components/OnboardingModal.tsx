"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { X, Wallet, Zap, Rocket, ExternalLink, CheckCircle2 } from "lucide-react";

const STORAGE_KEY = "sp_onboarded";

const STEPS = [
  {
    icon: Wallet,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/10",
    title: "Install Freighter Wallet",
    desc: "Freighter is a free browser extension that gives you a Stellar wallet in seconds.",
    cta: "Get Freighter",
    ctaHref: "https://freighter.app",
    ctaExternal: true,
  },
  {
    icon: Zap,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    title: "Fund with Test XLM",
    desc: "Switch Freighter to Testnet, then use Stellar Friendbot to get 10,000 free testnet XLM instantly.",
    cta: "Open Friendbot",
    ctaHref: "https://friendbot.stellar.org",
    ctaExternal: true,
  },
  {
    icon: Rocket,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
    title: "Connect & Start Predicting",
    desc: "Click \"Connect Freighter\" in the top-right corner, approve the popup, and you're ready.",
    cta: null,
    ctaHref: null,
    ctaExternal: false,
  },
];

export default function OnboardingModal() {
  const { address } = useWallet();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Show once, only for users who haven't connected before
  useEffect(() => {
    if (address) return; // already connected — don't show
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // localStorage blocked (SSR / privacy mode) — silently skip
    }
  }, [address]);

  // Dismiss once wallet connects mid-flow
  useEffect(() => {
    if (address && open) dismiss();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  };

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-2xl shadow-black/60 p-6 space-y-5">

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider">
              Getting started — step {step + 1} of {STEPS.length}
            </span>
          </div>
          <h2 className="text-xl font-black text-white">Welcome to StellarPulse AI</h2>
          <p className="text-xs text-zinc-500">Three quick steps to make your first on-chain prediction.</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1 flex-1 rounded-full transition-all ${
                i === step ? "bg-violet-500" : i < step ? "bg-emerald-500" : "bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex gap-4 items-start">
          <div className={`shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl ${current.iconBg}`}>
            <Icon className={`h-6 w-6 ${current.iconColor}`} strokeWidth={1.75} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-white">{current.title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{current.desc}</p>
          </div>
        </div>

        {/* CTA / actions */}
        <div className="flex items-center gap-3">
          {current.ctaHref && (
            <a
              href={current.ctaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:border-zinc-600 hover:bg-zinc-700 transition-all"
            >
              {current.cta}
              {current.ctaExternal && <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />}
            </a>
          )}

          {isLast ? (
            <button
              onClick={dismiss}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all hover:scale-[1.01]"
            >
              <CheckCircle2 className="h-4 w-4" /> Got it, let&apos;s go
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all hover:scale-[1.01]"
            >
              Next step →
            </button>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={dismiss}
          className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Skip tutorial
        </button>
      </div>
    </div>
  );
}
