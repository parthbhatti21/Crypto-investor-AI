"use client";

import { useState, useEffect, useMemo } from "react";
import { getPredictionCount, getAllPredictions, formatXlm } from "@/hooks/contract";
import { useWallet } from "@/context/WalletContext";
import Link from "next/link";
import { Check, X, Clock, TrendingUp, TrendingDown, ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";

type Prediction = {
  id: number;
  creator: string;
  asset: string;
  direction: string;
  target_price: string;
  stake: string;
  total_pool: string;
  deadline: number;
  resolved: boolean;
  outcome: boolean;
};

type StatusFilter = "all" | "open" | "resolved" | "mine";
type SortKey = "id" | "asset" | "stake" | "pool" | "deadline";
type SortDir = "asc" | "desc";

const ASSETS = ["All", "XLM", "BTC", "ETH", "SOL", "DOGE", "ADA"];

function StatusBadge({ p }: { p: Prediction }) {
  const expired = Date.now() >= p.deadline * 1000;
  if (p.resolved) {
    return p.outcome
      ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400"><Check className="h-2.5 w-2.5" /> Correct</span>
      : <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400"><X className="h-2.5 w-2.5" /> Incorrect</span>;
  }
  if (expired) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-400"><Clock className="h-2.5 w-2.5" /> Expired</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400"><Clock className="h-2.5 w-2.5" /> Open</span>;
}

function DeadlineCell({ deadline }: { deadline: number }) {
  const ms = deadline * 1000 - Date.now();
  if (ms <= 0) return <span className="text-zinc-500 text-xs">Expired</span>;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const label = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
  return <span className="text-zinc-300 text-xs font-mono">{label}</span>;
}

export default function TransactionsClient() {
  const { address } = useWallet();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assetFilter, setAssetFilter] = useState("All");
  const [directionFilter, setDirectionFilter] = useState("All");
  const [search, setSearch] = useState("");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    setLoading(true);
    getPredictionCount()
      .then(count => getAllPredictions(count))
      .then(preds => setPredictions(preds as Prediction[]))
      .catch(() => setPredictions([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let rows = [...predictions];

    if (statusFilter === "open")     rows = rows.filter(p => !p.resolved && Date.now() < p.deadline * 1000);
    if (statusFilter === "resolved") rows = rows.filter(p => p.resolved);
    if (statusFilter === "mine")     rows = rows.filter(p => address && p.creator?.toLowerCase() === address.toLowerCase());
    if (assetFilter !== "All")       rows = rows.filter(p => p.asset === assetFilter);
    if (directionFilter !== "All")   rows = rows.filter(p => p.direction === directionFilter);
    if (search.trim())               rows = rows.filter(p =>
      p.asset.toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).includes(search) ||
      p.creator?.toLowerCase().includes(search.toLowerCase())
    );

    rows.sort((a, b) => {
      let av: number | string, bv: number | string;
      if (sortKey === "id")       { av = a.id;                            bv = b.id; }
      else if (sortKey === "asset")    { av = a.asset;                        bv = b.asset; }
      else if (sortKey === "stake")    { av = parseFloat(a.stake);            bv = parseFloat(b.stake); }
      else if (sortKey === "pool")     { av = parseFloat(a.total_pool);       bv = parseFloat(b.total_pool); }
      else                             { av = a.deadline;                     bv = b.deadline; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [predictions, statusFilter, assetFilter, directionFilter, search, sortKey, sortDir, address]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span className={`inline-block ml-1 align-middle ${sortKey === k ? "text-violet-400" : "text-zinc-600"}`}>
      {sortKey === k
        ? (sortDir === "asc" ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />)
        : <ChevronsUpDown className="h-2.5 w-2.5" />}
    </span>
  );

  const STATUS_TABS: { key: StatusFilter; label: string }[] = [
    { key: "all",      label: `All (${predictions.length})` },
    { key: "open",     label: `Open (${predictions.filter(p => !p.resolved && Date.now() < p.deadline * 1000).length})` },
    { key: "resolved", label: `Resolved (${predictions.filter(p => p.resolved).length})` },
    ...(address ? [{ key: "mine" as StatusFilter, label: `Mine (${predictions.filter(p => p.creator?.toLowerCase() === address.toLowerCase()).length})` }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 h-[400px] w-[600px] bg-violet-600/3 blur-[130px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-black text-white">All Transactions</h1>
            <p className="text-zinc-500 mt-1 text-sm">Every prediction submitted to the Stellar smart contract.</p>
          </div>
          <Link
            href="/predictions"
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all hover:scale-[1.01]"
          >
            + New Prediction
          </Link>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                statusFilter === key
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" strokeWidth={2} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search asset, ID, creator…"
              className="pl-8 pr-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800/50 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/30 w-56 transition-all"
            />
          </div>

          {/* Asset filter */}
          <select
            value={assetFilter}
            onChange={e => setAssetFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            {ASSETS.map(a => <option key={a} value={a}>{a === "All" ? "All Assets" : a}</option>)}
          </select>

          {/* Direction filter */}
          <select
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="All">All Directions</option>
            <option value="UP">UP (Bullish)</option>
            <option value="DOWN">DOWN (Bearish)</option>
          </select>

          {/* Result count */}
          <span className="text-xs text-zinc-600 ml-auto">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl border border-zinc-800 bg-zinc-900/30 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-16 text-center space-y-3">
            <Search className="h-12 w-12 mx-auto text-zinc-600" strokeWidth={1.5} />
            <p className="text-base font-semibold text-white">No results</p>
            <p className="text-sm text-zinc-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_80px_64px_80px_1fr_1fr_110px_100px] gap-3 px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              <button onClick={() => toggleSort("id")} className="text-left hover:text-zinc-300 transition-colors">
                # <SortIcon k="id" />
              </button>
              <button onClick={() => toggleSort("asset")} className="text-left hover:text-zinc-300 transition-colors">
                Asset <SortIcon k="asset" />
              </button>
              <span>Dir</span>
              <span>Status</span>
              <button onClick={() => toggleSort("stake")} className="text-left hover:text-zinc-300 transition-colors">
                Staked <SortIcon k="stake" />
              </button>
              <button onClick={() => toggleSort("pool")} className="text-left hover:text-zinc-300 transition-colors">
                Pool <SortIcon k="pool" />
              </button>
              <button onClick={() => toggleSort("deadline")} className="text-left hover:text-zinc-300 transition-colors">
                Deadline <SortIcon k="deadline" />
              </button>
              <span>Creator</span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-zinc-800/60">
              {filtered.map((p, idx) => {
                const isUp = p.direction === "UP";
                const isMe = address && p.creator?.toLowerCase() === address.toLowerCase();
                const total = parseFloat(p.stake) + parseFloat(p.total_pool);

                return (
                  <div
                    key={p.id}
                    className={`grid grid-cols-[40px_80px_64px_80px_1fr_1fr_110px_100px] gap-3 px-4 py-3 items-center text-sm transition-colors hover:bg-zinc-800/30 ${
                      idx % 2 === 0 ? "" : "bg-zinc-900/20"
                    }`}
                  >
                    {/* ID */}
                    <span className="text-zinc-500 text-xs font-mono">#{p.id}</span>

                    {/* Asset */}
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">{p.asset}</span>
                      {isMe && (
                        <span className="text-[8px] font-bold text-violet-400 bg-violet-500/10 rounded px-1 py-0.5">me</span>
                      )}
                    </div>

                    {/* Direction */}
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {isUp ? "UP" : "DN"}
                    </span>

                    {/* Status */}
                    <StatusBadge p={p} />

                    {/* Staked */}
                    <span className="text-xs text-zinc-300 font-mono">{formatXlm(p.stake)} XLM</span>

                    {/* Pool */}
                    <div>
                      <span className="text-xs text-violet-400 font-mono">{formatXlm(total.toString())} XLM</span>
                      {parseFloat(p.total_pool) > 0 && (
                        <div className="mt-1 h-1 w-20 rounded-full bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                            style={{ width: `${Math.min(100, (parseFloat(p.total_pool) / total) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Deadline */}
                    <DeadlineCell deadline={p.deadline} />

                    {/* Creator */}
                    <span className="text-[10px] font-mono text-zinc-600 truncate">
                      {p.creator ? `${p.creator.slice(0, 4)}…${p.creator.slice(-4)}` : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-[10px] text-zinc-700 text-center">
          All data sourced directly from the Stellar Soroban smart contract · CBE5T4…NBZZX4
        </p>
      </div>
    </div>
  );
}
