/**
 * /admin/feedback — view all user feedback submissions.
 *
 * Access: append ?key=<ADMIN_KEY> to the URL, where ADMIN_KEY is set as an
 * environment variable (ADMIN_KEY or NEXT_PUBLIC_ADMIN_KEY) in .env.local /
 * Vercel dashboard.  If no key is configured the page is open (dev-mode).
 *
 * Example: https://your-app.vercel.app/admin/feedback?key=mysecret
 */

import type { Metadata } from "next";
import { headers } from "next/headers";
import type { FeedbackEntry } from "@/app/api/feedback/route";
import { Star, MessageSquare, Wallet, Clock, AlertTriangle } from "lucide-react";

export const metadata: Metadata = { title: "Feedback Admin · StellarPulse AI" };

// Disable static caching so submissions always show fresh
export const dynamic = "force-dynamic";

async function fetchFeedback(adminKey: string): Promise<FeedbackEntry[]> {
  // Build an absolute URL — required for server-side fetch in Next.js App Router
  const headersList = await headers();
  const host   = headersList.get("host") ?? "localhost:3000";
  const proto  = process.env.NODE_ENV === "production" ? "https" : "http";
  const url    = `${proto}://${host}/api/feedback?key=${encodeURIComponent(adminKey)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-4 w-4 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-700 fill-zinc-700"}`}
        />
      ))}
    </div>
  );
}

function avgRating(entries: FeedbackEntry[]): string {
  if (!entries.length) return "—";
  const avg = entries.reduce((s, e) => s + e.rating, 0) / entries.length;
  return avg.toFixed(1);
}

function ratingCount(entries: FeedbackEntry[], r: number) {
  return entries.filter((e) => e.rating === r).length;
}

export default async function FeedbackAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const params   = await searchParams;
  const adminKey = process.env.ADMIN_KEY ?? process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";
  const provided = params.key ?? "";

  // If a key is configured and the wrong one (or none) was supplied, gate the page
  const locked = adminKey !== "" && provided !== adminKey;

  if (locked) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-red-500/10">
            <AlertTriangle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-xl font-black text-white">Access Denied</h1>
          <p className="text-sm text-zinc-500">
            Append <code className="text-zinc-300 bg-zinc-800 px-1 rounded">?key=YOUR_ADMIN_KEY</code> to
            the URL.
          </p>
        </div>
      </div>
    );
  }

  const entries = await fetchFeedback(provided);
  const sorted  = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="min-h-screen bg-[#09090b]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white">User Feedback</h1>
          <p className="text-sm text-zinc-500">
            {entries.length} submission{entries.length !== 1 ? "s" : ""} collected via the in-app feedback widget.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-3xl font-black text-white">{entries.length}</p>
            <p className="text-xs text-zinc-500 mt-1">Total responses</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-3xl font-black text-amber-400">{avgRating(entries)}</p>
            <p className="text-xs text-zinc-500 mt-1">Avg rating / 5</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-3xl font-black text-violet-400">
              {entries.filter((e) => e.address !== "anonymous").length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">With wallet address</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-3xl font-black text-emerald-400">
              {entries.filter((e) => e.message.trim().length > 0).length}
            </p>
            <p className="text-xs text-zinc-500 mt-1">With comments</p>
          </div>
        </div>

        {/* Rating distribution */}
        {entries.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
            <h2 className="text-sm font-bold text-white">Rating distribution</h2>
            {[5, 4, 3, 2, 1].map((r) => {
              const count = ratingCount(entries, r);
              const pct   = entries.length ? Math.round((count / entries.length) * 100) : 0;
              return (
                <div key={r} className="flex items-center gap-3">
                  <div className="flex gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3 w-3 ${n <= r ? "text-amber-400 fill-amber-400" : "text-zinc-700 fill-zinc-700"}`} />
                    ))}
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-500 w-14 text-right">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Entries list */}
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-12 text-center space-y-3">
            <MessageSquare className="h-12 w-12 mx-auto text-zinc-600" strokeWidth={1.5} />
            <p className="text-base font-semibold text-white">No feedback yet</p>
            <p className="text-sm text-zinc-500">Submissions will appear here once users rate the app.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white">All submissions</h2>
            {sorted.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <StarDisplay rating={entry.rating} />
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                    <Clock className="h-3 w-3" />
                    {new Date(entry.timestamp).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                </div>

                {entry.message.trim() && (
                  <p className="text-sm text-zinc-300 leading-relaxed">{entry.message}</p>
                )}

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
                  <Wallet className="h-3 w-3" />
                  {entry.address === "anonymous"
                    ? "Anonymous"
                    : <span className="font-mono">{entry.address.slice(0, 8)}…{entry.address.slice(-6)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
