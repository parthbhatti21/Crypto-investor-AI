import type { Metadata } from "next";
import Link from "next/link";
import HomeClient from "@/components/HomeClient";
import { Sparkles, Bot, Trophy, Briefcase, Zap, DollarSign, CheckCircle2, Globe, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "StellarPulse AI — Predict Markets, Earn XLM",
};

const FEATURES: {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  cta: string;
  color: string;
  btn: string;
  iconColor: string;
}[] = [
  {
    icon: Sparkles,
    title: "Make Predictions",
    desc: "Choose any asset, set a target price, pick UP or DOWN, stake XLM, and submit to the blockchain.",
    href: "/predictions",
    cta: "Start predicting",
    color: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    btn: "bg-violet-600 hover:bg-violet-500",
    iconColor: "text-violet-400",
  },
  {
    icon: Bot,
    title: "AI Market Signals",
    desc: "Real-time AI signals derived from live prices, 7-day trends, and trading volume on 6 major assets.",
    href: "/markets",
    cta: "View signals",
    color: "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20",
    btn: "bg-indigo-600 hover:bg-indigo-500",
    iconColor: "text-indigo-400",
  },
  {
    icon: Trophy,
    title: "Earn Rewards",
    desc: "Back others' predictions. When the deadline passes, winners claim their proportional share of the pool.",
    href: "/predictions",
    cta: "Browse predictions",
    color: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    btn: "bg-amber-600 hover:bg-amber-500",
    iconColor: "text-amber-400",
  },
  {
    icon: Briefcase,
    title: "Track Portfolio",
    desc: "See all your predictions, win rate, total XLM staked, and send XLM to any Stellar address.",
    href: "/portfolio",
    cta: "My portfolio",
    color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    btn: "bg-emerald-600 hover:bg-emerald-500",
    iconColor: "text-emerald-400",
  },
];

const STATS: { label: string; value: string; icon: LucideIcon }[] = [
  { label: "Settlement time", value: "< 5s", icon: Zap },
  { label: "Transaction fee", value: "~$0.00001", icon: DollarSign },
  { label: "Smart contract tests", value: "13 passing", icon: CheckCircle2 },
  { label: "Network", value: "Stellar Testnet", icon: Globe },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 left-1/4 h-[700px] w-[800px] bg-violet-600/5 blur-[160px] rounded-full" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[500px] bg-indigo-600/4 blur-[130px] rounded-full" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[400px] bg-purple-600/3 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-16 space-y-24">

        {/* ── Hero ── */}
        <section className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/25 bg-violet-500/8 px-4 py-2">
            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
              Live on Stellar Testnet
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.02]">
            Predict Markets,{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Earn XLM
            </span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A decentralised prediction market powered by AI market analysis and Stellar Soroban smart contracts.
            Stake XLM, back insights, and earn rewards when you are right.
          </p>

          <HomeClient />
        </section>

        {/* ── Stats ── */}
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 text-center hover:border-zinc-700/60 transition-all">
                <s.icon className="h-6 w-6 mx-auto mb-3 text-zinc-400" />
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-[11px] text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature cards ── */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white">Everything in one place</h2>
            <p className="text-zinc-500 max-w-md mx-auto">Four tools, one platform, zero intermediaries.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className={`rounded-2xl border bg-gradient-to-br p-6 space-y-4 ${f.color}`}>
                <f.icon className={`h-8 w-8 ${f.iconColor}`} strokeWidth={1.75} />
                <div>
                  <h3 className="text-lg font-bold text-white">{f.title}</h3>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{f.desc}</p>
                </div>
                <Link
                  href={f.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all ${f.btn}`}
                >
                  {f.cta}
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white">How it works</h2>
            <p className="text-zinc-500">Four steps from wallet to rewards.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { n: "1", title: "Connect Wallet", desc: "Install Freighter, switch to Testnet, fund with Friendbot, then connect." },
              { n: "2", title: "Create a Prediction", desc: "Pick an asset, target price, UP or DOWN, stake XLM, choose a timeframe." },
              { n: "3", title: "Community Backs It", desc: "Other users back your prediction with XLM, growing the reward pool." },
              { n: "4", title: "Claim Rewards", desc: "After the deadline, the creator resolves it. Winners claim their share." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/15 text-sm font-black text-violet-400">
                  {s.n}
                </div>
                <h3 className="text-sm font-bold text-white">{s.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/8 to-indigo-500/5 p-12 space-y-5">
          <h2 className="text-3xl font-black text-white">Ready to start?</h2>
          <p className="text-zinc-400 max-w-sm mx-auto">Connect your wallet and make your first prediction in under a minute.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/predictions"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              View Predictions
            </Link>
            <Link
              href="/markets"
              className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 py-3 text-sm font-bold text-zinc-300 hover:text-white hover:border-zinc-600 transition-all"
            >
              AI Market Signals
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
