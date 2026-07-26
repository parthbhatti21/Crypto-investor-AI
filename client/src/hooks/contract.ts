"use client";

import { useCallback, useState, useEffect } from "react";
import * as freighter from "@stellar/freighter-api";
import {
  SorobanRpc,
  Contract,
  TransactionBuilder,
  Networks,
  Address,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";

// ─── Config ────────────────────────────────────────────────────────
const RPC_URL = "https://soroban-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const server = new SorobanRpc.Server(RPC_URL);

// ─── Wallet ────────────────────────────────────────────────────────
export async function connectWallet(): Promise<string | null> {
  const allowed = await freighter.isAllowed();
  if (!allowed.isConnected) {
    await freighter.requestAccess();
  }
  const { address } = await freighter.getAddress();
  return address || null;
}

export async function getWalletAddress(): Promise<string | null> {
  try {
    const { address } = await freighter.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

// ─── ScVal Converters ──────────────────────────────────────────────
function toScValString(v: string) {
  return nativeToScVal(v, { type: "string" });
}

function toScValU64(v: number) {
  return nativeToScVal(v, { type: "u64" });
}

function toScValI128(v: string | number) {
  return nativeToScVal(v.toString(), { type: "i128" });
}

function toScValAddress(v: string) {
  return new Address(v).toScVal();
}

function toScValBool(v: boolean) {
  return nativeToScVal(v, { type: "bool" });
}

// ─── Contract Calls ────────────────────────────────────────────────
async function buildAndSign(
  method: string,
  args: xdr.ScVal[],
  source: string,
  simulate = false
): Promise<any> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract not deployed yet. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
    );
  }

  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(source);

  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  if (simulate) {
    const result = await server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(result)) {
      throw new Error(result.error);
    }
    return result;
  }

  const signed = await freighter.signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const result = await server.sendTransaction(
    TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE).build()
  );

  if (result.status === "ERROR") {
    throw new Error(JSON.stringify(result));
  }

  // Poll for confirmation
  let ledger = result.latestLedger;
  while (true) {
    await new Promise((r) => setTimeout(r, 3000));
    const status = await server.getTransaction(result.hash);
    if (status.status !== "NOT_FOUND") {
      if (status.status === "SUCCESS") {
        const resultVal = status.resultMetaXdr;
        if (resultVal) {
          const v = resultVal
            .v3()
            .sorobanMeta()
            ?.returnValue();
          if (v) return scValToNative(v);
        }
        return null;
      }
      throw new Error(`Tx failed: ${status.status}`);
    }
    ledger++;
  }
}

export async function createPrediction(
  caller: string,
  asset: string,
  direction: string,
  targetPrice: string,
  stake: string,
  deadline: number
) {
  return buildAndSign(
    "create_prediction",
    [
      toScValAddress(caller),
      toScValString(asset),
      toScValString(direction),
      toScValI128(targetPrice),
      toScValI128(stake),
      toScValU64(deadline),
    ],
    caller
  );
}

export async function backPrediction(
  caller: string,
  predictionId: number,
  amount: string
) {
  return buildAndSign(
    "back_prediction",
    [toScValAddress(caller), toScValU64(predictionId), toScValI128(amount)],
    caller
  );
}

export async function resolvePrediction(
  caller: string,
  predictionId: number,
  outcome: boolean
) {
  return buildAndSign(
    "resolve_prediction",
    [toScValAddress(caller), toScValU64(predictionId), toScValBool(outcome)],
    caller
  );
}

export async function claimRewards(caller: string, predictionId: number) {
  return buildAndSign(
    "claim_rewards",
    [toScValAddress(caller), toScValU64(predictionId)],
    caller
  );
}

// ─── Read-Only Calls ──────────────────────────────────────────────
export async function getPrediction(id: number) {
  if (!CONTRACT_ADDRESS) return null;
  try {
    const contract = new Contract(CONTRACT_ADDRESS);
    const tx = new TransactionBuilder(
      await server.getAccount(CONTRACT_ADDRESS),
      { fee: "0", networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_prediction", toScValU64(id)))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(result)) return null;
    return scValToNative(result.result?.retval) as any;
  } catch {
    return null;
  }
}

export async function getPredictionCount(): Promise<number> {
  if (!CONTRACT_ADDRESS) return 0;
  try {
    const contract = new Contract(CONTRACT_ADDRESS);
    const tx = new TransactionBuilder(
      await server.getAccount(CONTRACT_ADDRESS),
      { fee: "0", networkPassphrase: NETWORK_PASSPHRASE }
    )
      .addOperation(contract.call("get_prediction_count"))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(result)) return 0;
    return (scValToNative(result.result?.retval) as number) || 0;
  } catch {
    return 0;
  }
}

export async function getAllPredictions(count: number): Promise<any[]> {
  const predictions = [];
  for (let i = 1; i <= count; i++) {
    const pred = await getPrediction(i);
    if (pred) predictions.push(pred);
  }
  return predictions;
}

// ─── AI Insights (mock/off-chain analysis) ────────────────────────
export type AiInsight = {
  asset: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  reason: string;
};

export async function getAiInsights(): Promise<AiInsight[]> {
  // Simulated AI-powered market analysis
  return [
    {
      asset: "XLM",
      sentiment: "bullish",
      confidence: 87,
      reason:
        "Stellar ecosystem growth accelerating with new DeFi protocols. Cross-border payment volume up 34% this quarter.",
    },
    {
      asset: "BTC",
      sentiment: "bullish",
      confidence: 72,
      reason:
        "Institutional adoption trending upward. Halving cycle historically bullish for 12-18 months post-event.",
    },
    {
      asset: "ETH",
      sentiment: "neutral",
      confidence: 58,
      reason:
        "Layer 2 activity surging but mainnet fees declining. Market pricing in mixed signals on scaling progress.",
    },
    {
      asset: "SOL",
      sentiment: "bearish",
      confidence: 65,
      reason:
        "Network congestion concerns resurface. Competitor chains gaining developer mindshare in Q3.",
    },
  ];
}

// ─── Utility ──────────────────────────────────────────────────────
export function formatXlm(stroops: string | number): string {
  const val = typeof stroops === "string" ? parseFloat(stroops) : stroops;
  return (val / 10_000_000).toFixed(2);
}

export function parseXlm(xlm: string): string {
  return (parseFloat(xlm) * 10_000_000).toFixed(0);
}
