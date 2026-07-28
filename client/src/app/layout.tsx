/**
 * Root layout — entry point for every page in the app.
 *
 * ── Stellar / Freighter wallet integration ────────────────────────────────
 *
 * All wallet logic lives in two files:
 *
 *   src/hooks/contract.ts          — raw @stellar/freighter-api calls:
 *     • connectWallet()            → freighter.requestAccess()   (connect + address retrieval)
 *     • getWalletAddress()         → freighter.isAllowed() + freighter.getAddress()  (silent reconnect)
 *     • buildAndSign()             → freighter.signTransaction()  (Soroban contract calls)
 *     • sendXlmPayment()           → freighter.signTransaction()  (native XLM payments via Horizon)
 *
 *   src/context/WalletContext.tsx  — React context that wraps the above for
 *                                   app-wide state (address, balance, connect/disconnect).
 *
 *   src/components/WalletConnect.tsx — "Connect Freighter" button component.
 *   src/components/Nav.tsx           — WalletButton in the top nav (uses WalletContext).
 *   src/components/SendXLM.tsx       — XLM payment form (calls sendXlmPayment → signTransaction).
 *   src/components/CreatePrediction.tsx — Prediction form (calls createPrediction → signTransaction).
 *
 * WalletProvider (below) wraps the entire app so every page has access to the
 * connected wallet address and balance without prop-drilling.
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { WalletProvider } from "@/context/WalletContext";
import Nav from "@/components/Nav";
import { Sparkles } from "lucide-react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "StellarPulse AI", template: "%s · StellarPulse AI" },
  description: "AI-powered crypto prediction market on the Stellar blockchain. Create predictions, back insights, earn XLM rewards.",
  keywords: ["Stellar", "blockchain", "prediction market", "crypto", "XLM", "Soroban", "DeFi"],
  openGraph: {
    title: "StellarPulse AI",
    description: "AI-powered prediction market on Stellar blockchain",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#09090b] text-white">
        <WalletProvider>
          <ToastProvider>
            <Nav />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-zinc-800/40">
              <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-xs text-zinc-600">StellarPulse AI · Built on Stellar Soroban</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span>Contract: <span className="font-mono text-zinc-500">CBMYC7K2…W4DO</span></span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-600">Testnet Online</span>
                  </div>
                </div>
              </div>
            </footer>
          </ToastProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
