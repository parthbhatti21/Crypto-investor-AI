"use client";

import { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { MessageSquare, X, Star, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

type State = "idle" | "open" | "submitting" | "success" | "error";

export default function FeedbackWidget() {
  const { address } = useWallet();
  const [state, setState] = useState<State>("idle");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const reset = () => {
    setRating(0);
    setHovered(0);
    setMessage("");
    setErrorMsg("");
  };

  const open = () => { reset(); setState("open"); };
  const close = () => { reset(); setState("idle"); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setErrorMsg("Please pick a star rating."); return; }
    setState("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, message, address: address || "anonymous" }),
      });
      if (!res.ok) throw new Error(await res.text());
      setState("success");
      setTimeout(() => setState("idle"), 3500);
    } catch (err: any) {
      setErrorMsg(err.message ?? "Submission failed. Try again.");
      setState("error");
    }
  };

  const display = hovered || rating;

  const LABELS: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Great",
    5: "Excellent",
  };

  return (
    <>
      {/* Floating trigger button */}
      {state === "idle" && (
        <button
          onClick={open}
          aria-label="Leave feedback"
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-400 shadow-xl shadow-black/40 hover:text-white hover:border-zinc-600 transition-all hover:scale-105 active:scale-95"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Feedback</span>
        </button>
      )}

      {/* Success toast */}
      {state === "success" && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-zinc-900 px-4 py-3 text-sm font-semibold text-emerald-400 shadow-xl shadow-black/40">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Thanks for your feedback!
        </div>
      )}

      {/* Modal */}
      {(state === "open" || state === "submitting" || state === "error") && (
        <div
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        >
          <div className="relative w-full max-w-sm rounded-2xl border border-zinc-700/60 bg-zinc-900 p-6 shadow-2xl shadow-black/60 space-y-5">

            {/* Close */}
            <button
              onClick={close}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="pr-6">
              <h3 className="text-base font-bold text-white">How are we doing?</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Your feedback helps improve StellarPulse AI for everyone.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star rating */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 mb-2">Your rating</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => { setRating(n); setErrorMsg(""); }}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          n <= display
                            ? "text-amber-400 fill-amber-400"
                            : "text-zinc-700 fill-zinc-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {display > 0 && (
                  <p className="text-[11px] text-amber-400 mt-1 font-semibold">{LABELS[display]}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Comments <span className="font-normal text-zinc-600">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What worked well? What could be better?"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/40 resize-none transition-all"
                />
                <p className="text-[10px] text-zinc-600 text-right mt-0.5">
                  {message.length}/500
                </p>
              </div>

              {/* Wallet note */}
              <p className="text-[10px] text-zinc-600">
                {address
                  ? <>Submitting as <span className="font-mono text-zinc-500">{address.slice(0, 5)}…{address.slice(-4)}</span></>
                  : "Submitting anonymously (wallet not connected)"}
              </p>

              {/* Error */}
              {state === "error" && errorMsg && (
                <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {errorMsg}
                </div>
              )}
              {state !== "error" && errorMsg && (
                <p className="text-xs text-red-400">{errorMsg}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={state === "submitting"}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state === "submitting" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                ) : (
                  "Submit Feedback"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
