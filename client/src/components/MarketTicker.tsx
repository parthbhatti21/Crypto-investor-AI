"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type TickerItem = {
  asset: string;
  price: number;
  change24h: number;
};

function formatPrice(price: number): string {
  if (price >= 10000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 100) return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (price >= 1) return price.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return price.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export default function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/market-insights", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch failed");
      const data: TickerItem[] = await res.json();
      setItems(data.map((d) => ({ asset: d.asset, price: d.price, change24h: d.change24h })));
    } catch {
      // silently skip on error — ticker is non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading || items.length === 0) return null;

  // Duplicate items for seamless scroll loop
  const doubled = [...items, ...items];

  return (
    <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm overflow-hidden">
      <div className="relative flex">
        {/* Fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-12 z-10 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-12 z-10 bg-gradient-to-l from-zinc-950 to-transparent" />

        <div className="flex gap-0 ticker-scroll">
          {doubled.map((item, i) => {
            const isUp = item.change24h >= 0;
            return (
              <div
                key={`${item.asset}-${i}`}
                className="flex items-center gap-2 px-5 py-1.5 border-r border-zinc-800/40 whitespace-nowrap shrink-0"
              >
                <span className="text-[11px] font-bold text-zinc-300 tracking-wide">
                  {item.asset}
                </span>
                <span className="text-[11px] font-mono text-white">
                  ${formatPrice(item.price)}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                    isUp ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(item.change24h).toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
