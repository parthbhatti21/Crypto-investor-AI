"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { getWalletAddress, connectWallet, fetchXlmBalance } from "@/hooks/contract";

type WalletContextValue = {
  address: string;
  balance: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => void;
  setBalanceFromExternal: (bal: string) => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const loadBalance = useCallback(async (addr: string) => {
    const bal = await fetchXlmBalance(addr);
    setBalance(bal);
  }, []);

  // Auto-reconnect on mount
  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) {
        setAddress(addr);
        loadBalance(addr);
      }
    });
  }, [loadBalance]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      if (addr) {
        setAddress(addr);
        loadBalance(addr);
      }
    } finally {
      setConnecting(false);
    }
  }, [loadBalance]);

  const disconnect = useCallback(() => {
    setAddress("");
    setBalance(null);
  }, []);

  const refreshBalance = useCallback(() => {
    if (address) loadBalance(address);
  }, [address, loadBalance]);

  const setBalanceFromExternal = useCallback((bal: string) => {
    setBalance(bal);
  }, []);

  return (
    <WalletContext.Provider value={{ address, balance, connecting, connect, disconnect, refreshBalance, setBalanceFromExternal }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
