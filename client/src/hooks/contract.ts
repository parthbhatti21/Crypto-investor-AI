"use client";

import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  Address,
  Account,
  Asset,
  Operation,
  StrKey,
  nativeToScVal,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import * as freighter from "@stellar/freighter-api";

// ─── Config ────────────────────────────────────────────────────────
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = Networks.TESTNET;
export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

const server = new rpc.Server(RPC_URL);

// ─── Wallet ────────────────────────────────────────────────────────

/**
 * Called when the user clicks "Connect Freighter".
 * Triggers the Freighter approval popup if the site hasn't been approved yet,
 * or returns the address immediately if it has.
 */
export async function connectWallet(): Promise<string | null> {
  const { isConnected } = await freighter.isConnected();
  if (!isConnected) {
    throw new Error(
      "Freighter extension not found. Install it from freighter.app then refresh."
    );
  }
  const { address, error } = await freighter.requestAccess();
  if (error) throw new Error(`Freighter: ${error}`);
  return address || null;
}

/**
 * Called silently on page load. Returns null without throwing if the site
 * hasn't been approved or extension is missing.
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    const { isConnected } = await freighter.isConnected();
    if (!isConnected) return null;
    const { isAllowed } = await freighter.isAllowed();
    if (!isAllowed) return null;
    const { address, error } = await freighter.getAddress();
    if (error || !address) return null;
    return address;
  } catch {
    return null;
  }
}

// ─── ScVal Helpers ─────────────────────────────────────────────────
function toScValString(v: string) { return nativeToScVal(v, { type: "string" }); }
function toScValU64(v: number)    { return nativeToScVal(v, { type: "u64" }); }
function toScValI128(v: string | number) { return nativeToScVal(v.toString(), { type: "i128" }); }
function toScValAddress(v: string) { return new Address(v).toScVal(); }
function toScValBool(v: boolean): xdr.ScVal { return xdr.ScVal.scvBool(v); }

// ─── Soroban Write ─────────────────────────────────────────────────
async function buildAndSign(
  method: string,
  args: xdr.ScVal[],
  source: string
): Promise<any> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract not deployed. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
    );
  }

  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(source);

  const rawTx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  // prepareTransaction simulates + assembles Soroban footprint/auth.
  // Skipping this step produces txMalformed.
  let preparedTx: Awaited<ReturnType<typeof server.prepareTransaction>>;
  try {
    preparedTx = await server.prepareTransaction(rawTx);
  } catch (e: any) {
    throw new Error(`Simulation failed: ${e?.message ?? e}`);
  }

  const { signedTxXdr, error: signError } = await freighter.signTransaction(
    preparedTx.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  );
  if (signError) throw new Error(`Freighter signing error: ${signError}`);

  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const result = await server.sendTransaction(signedTx);

  if (result.status === "ERROR") {
    throw new Error(
      `Transaction error: ${JSON.stringify(result.errorResult ?? result)}`
    );
  }

  // Poll until confirmed
  while (true) {
    await new Promise((r) => setTimeout(r, 3000));
    const status = await server.getTransaction(result.hash);
    if (status.status !== "NOT_FOUND") {
      if (status.status === "SUCCESS") {
        try {
          const v = status.resultMetaXdr?.v3?.().sorobanMeta?.()?.returnValue?.();
          return v ? scValToNative(v) : null;
        } catch {
          return null;
        }
      }
      throw new Error(`Transaction failed: ${status.status}`);
    }
  }
}

// ─── Write Calls ───────────────────────────────────────────────────
export async function createPrediction(
  caller: string, asset: string, direction: string,
  targetPrice: string, stake: string, deadline: number
) {
  return buildAndSign("create_prediction", [
    toScValAddress(caller), toScValString(asset), toScValString(direction),
    toScValI128(targetPrice), toScValI128(stake), toScValU64(deadline),
  ], caller);
}

export async function backPrediction(caller: string, predictionId: number, amount: string) {
  return buildAndSign("back_prediction", [
    toScValAddress(caller), toScValU64(predictionId), toScValI128(amount),
  ], caller);
}

export async function resolvePrediction(caller: string, predictionId: number, outcome: boolean) {
  return buildAndSign("resolve_prediction", [
    toScValAddress(caller), toScValU64(predictionId), toScValBool(outcome),
  ], caller);
}

export async function claimRewards(caller: string, predictionId: number) {
  return buildAndSign("claim_rewards", [
    toScValAddress(caller), toScValU64(predictionId),
  ], caller);
}

// ─── Soroban Read (simulation, no signing needed) ──────────────────
const DUMMY_ADDRESS = "GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH";

async function simulateRead(method: string, args: xdr.ScVal[]): Promise<xdr.ScVal | null> {
  if (!CONTRACT_ADDRESS) return null;
  try {
    const contract = new Contract(CONTRACT_ADDRESS);
    const dummyAccount = new Account(DUMMY_ADDRESS, "0");
    const tx = new TransactionBuilder(dummyAccount, {
      fee: "0", networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const result = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(result)) return null;
    return result.result?.retval ?? null;
  } catch {
    return null;
  }
}

export async function getPrediction(id: number): Promise<any> {
  const v = await simulateRead("get_prediction", [toScValU64(id)]);
  if (!v) return null;
  const raw = scValToNative(v) as any;
  if (!raw) return null;
  // Normalise BigInt fields to strings so components can safely call .toString()
  return {
    ...raw,
    id: Number(raw.id ?? id),
    stake: raw.stake?.toString() ?? "0",
    total_pool: raw.total_pool?.toString() ?? "0",
    target_price: raw.target_price?.toString() ?? "0",
    deadline: Number(raw.deadline ?? 0),
  };
}

export async function getPredictionCount(): Promise<number> {
  const v = await simulateRead("get_prediction_count", []);
  if (!v) return 0;
  // scValToNative returns bigint for u64 — convert to plain number
  const raw = scValToNative(v);
  return Number(raw) || 0;
}

export async function getAllPredictions(count: number): Promise<any[]> {
  const results = await Promise.all(
    Array.from({ length: count }, (_, i) => getPrediction(i + 1))
  );
  return results.filter(Boolean);
}

/**
 * Returns all prediction IDs that a user has backed (from on-chain UserBackings list).
 */
export async function getUserBackings(user: string): Promise<number[]> {
  try {
    const v = await simulateRead("get_user_backings", [toScValAddress(user)]);
    if (!v) return [];
    const raw = scValToNative(v) as any;
    // raw is an array of u64
    return Array.isArray(raw) ? raw.map(Number) : [];
  } catch {
    return [];
  }
}

/**
 * Fetches all predictions backed by a specific user.
 */
export async function getMyBackedPredictions(user: string): Promise<any[]> {
  const ids = await getUserBackings(user);
  if (ids.length === 0) return [];
  const results = await Promise.all(ids.map((id) => getPrediction(id)));
  return results.filter(Boolean);
}

// ─── AI Insights ──────────────────────────────────────────────────
export type AiInsight = {
  asset: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  reason: string;
};

export async function getAiInsights(): Promise<AiInsight[]> {
  try {
    const res = await fetch("/api/market-insights");
    if (!res.ok) throw new Error("fetch failed");
    return await res.json();
  } catch {
    return [];
  }
}

// ─── Utilities ─────────────────────────────────────────────────────
export function formatXlm(stroops: string | number): string {
  const val = typeof stroops === "string" ? parseFloat(stroops) : stroops;
  return (val / 10_000_000).toFixed(2);
}

export function parseXlm(xlm: string): string {
  return (parseFloat(xlm) * 10_000_000).toFixed(0);
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

// ─── XLM Payment (Horizon) ─────────────────────────────────────────
export type SendXlmResult = {
  hash: string;
  ledger: number;
};

export async function sendXlmPayment(
  sender: string,
  destination: string,
  amount: string,
  memo?: string
): Promise<SendXlmResult> {
  if (!StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error("Invalid destination address.");
  }
  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new Error("Amount must be a positive number.");
  }
  if (amountNum < 0.0000001) {
    throw new Error("Amount too small. Minimum is 0.0000001 XLM.");
  }

  const accountRes = await fetch(`${HORIZON_URL}/accounts/${sender}`);
  if (!accountRes.ok) {
    throw new Error("Could not load sender account. Is your wallet funded?");
  }
  const accountData = await accountRes.json();
  const senderAccount = new Account(sender, accountData.sequence);

  const txBuilder = new TransactionBuilder(senderAccount, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    Operation.payment({
      destination,
      asset: Asset.native(),
      amount: amountNum.toFixed(7),
    })
  );

  if (memo) {
    const { Memo } = await import("@stellar/stellar-sdk");
    txBuilder.addMemo(Memo.text(memo.slice(0, 28)));
  }

  const tx = txBuilder.setTimeout(300).build();

  const { signedTxXdr, error: signError } = await freighter.signTransaction(
    tx.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  );
  if (signError) throw new Error(`Freighter signing failed: ${signError}`);

  const submitRes = await fetch(`${HORIZON_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: signedTxXdr }),
  });

  const submitData = await submitRes.json();
  if (!submitRes.ok || !submitData.successful) {
    const codes = submitData?.extras?.result_codes;
    const detail = codes
      ? `${codes.transaction ?? ""}${codes.operations ? " / " + codes.operations.join(", ") : ""}`
      : submitData?.title ?? "Transaction failed";
    throw new Error(detail.trim());
  }

  return { hash: submitData.hash, ledger: submitData.ledger };
}

export async function fetchXlmBalance(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    const native = data.balances?.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === "native"
    );
    return native
      ? parseFloat(native.balance).toLocaleString("en-US", { maximumFractionDigits: 2 })
      : null;
  } catch {
    return null;
  }
}

/** Raw balance as a number (for display/validation). */
export async function fetchXlmBalanceRaw(address: string): Promise<number | null> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    const native = data.balances?.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === "native"
    );
    return native ? parseFloat(native.balance) : null;
  } catch {
    return null;
  }
}
