"use client";

import {
  rpc,
  Contract,
  TransactionBuilder,
  Networks,
  Address,
  Account,
  Asset,
  Keypair,
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
 * Always calls requestAccess() which triggers the Freighter approval popup
 * if the site hasn't been approved yet, or returns the address directly if it has.
 */
export async function connectWallet(): Promise<string | null> {
  // Check extension is installed
  const { isConnected } = await freighter.isConnected();
  if (!isConnected) {
    throw new Error(
      "Freighter extension not found. Install it from freighter.app then refresh."
    );
  }

  // requestAccess() opens the approval popup if needed, or returns address immediately
  const { address, error } = await freighter.requestAccess();
  if (error) throw new Error(`Freighter: ${error}`);
  return address || null;
}

/**
 * Called silently on page load to re-connect if the site is already approved.
 * Returns null (no error thrown) if not approved or extension missing.
 */
export async function getWalletAddress(): Promise<string | null> {
  try {
    // Don't bother if extension isn't installed
    const { isConnected } = await freighter.isConnected();
    if (!isConnected) return null;

    // Only get address if site is already approved — don't trigger a popup
    const { isAllowed } = await freighter.isAllowed();
    if (!isAllowed) return null;

    const { address, error } = await freighter.getAddress();
    if (error || !address) return null;
    return address;
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

function toScValBool(v: boolean): xdr.ScVal {
  return xdr.ScVal.scvBool(v);
}

// ─── Contract Calls ────────────────────────────────────────────────
async function buildAndSign(
  method: string,
  args: xdr.ScVal[],
  source: string
): Promise<any> {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract not deployed yet. Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local"
    );
  }

  const contract = new Contract(CONTRACT_ADDRESS);
  const account = await server.getAccount(source);

  // 1. Build the raw transaction
  const rawTx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  // 2. prepareTransaction: simulates + assembles Soroban footprint/auth
  //    This is required — submitting the raw tx causes txMalformed
  let preparedTx: Awaited<ReturnType<typeof server.prepareTransaction>>;
  try {
    preparedTx = await server.prepareTransaction(rawTx);
  } catch (e: any) {
    // prepareTransaction throws a string or Error with simulation details
    throw new Error(`Simulation failed: ${e?.message ?? e}`);
  }

  // 3. Sign the prepared (assembled) transaction with Freighter
  const { signedTxXdr, error: signError } = await freighter.signTransaction(
    preparedTx.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  );

  if (signError) {
    throw new Error(`Freighter signing error: ${signError}`);
  }

  // 4. Reconstruct from signed XDR and submit
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const result = await server.sendTransaction(signedTx);

  if (result.status === "ERROR") {
    throw new Error(
      `Transaction error: ${JSON.stringify(result.errorResult ?? result)}`
    );
  }

  // 5. Poll for confirmation (NOT_FOUND = still pending)
  while (true) {
    await new Promise((r) => setTimeout(r, 3000));
    const status = await server.getTransaction(result.hash);
    if (status.status !== "NOT_FOUND") {
      if (status.status === "SUCCESS") {
        try {
          const meta = status.resultMetaXdr;
          const v = meta?.v3?.().sorobanMeta?.()?.returnValue?.();
          return v ? scValToNative(v) : null;
        } catch {
          // resultMetaXdr is not v3 or has no soroban return value — that's fine
          return null;
        }
      }
      throw new Error(`Transaction failed: ${status.status}`);
    }
  }
}

// ─── Write Calls ──────────────────────────────────────────────────
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
// Reads use a throwaway Account at sequence 0 — no funded source needed for simulation.
// The Account is constructed inside the async function so it never runs at module
// evaluation time (avoids "accountId is invalid" crash on the server/edge runtime).
async function simulateRead(method: string, args: xdr.ScVal[]): Promise<xdr.ScVal | null> {
  if (!CONTRACT_ADDRESS) return null;
  try {
    const contract = new Contract(CONTRACT_ADDRESS);
    // Any valid G-address works here — it is never submitted, only used for tx structure.
    const dummyAccount = new Account(
      "GA5WUJ54Z23KILLCUOUNAKTPBVZWKMQVO4O6EQ5GHLAERIMLLHNCSKYH",
      "0"
    );
    const tx = new TransactionBuilder(dummyAccount, {
      fee: "0",
      networkPassphrase: NETWORK_PASSPHRASE,
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
  const retval = await simulateRead("get_prediction", [toScValU64(id)]);
  return retval ? (scValToNative(retval) as any) : null;
}

export async function getPredictionCount(): Promise<number> {
  const retval = await simulateRead("get_prediction_count", []);
  return retval ? ((scValToNative(retval) as number) || 0) : 0;
}

export async function getAllPredictions(count: number): Promise<any[]> {
  const results = await Promise.all(
    Array.from({ length: count }, (_, i) => getPrediction(i + 1))
  );
  return results.filter(Boolean);
}

// ─── Legacy AI Insights (kept for type compatibility) ─────────────
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

// ─── Utilities ────────────────────────────────────────────────────
export function formatXlm(stroops: string | number): string {
  const val = typeof stroops === "string" ? parseFloat(stroops) : stroops;
  return (val / 10_000_000).toFixed(2);
}

export function parseXlm(xlm: string): string {
  return (parseFloat(xlm) * 10_000_000).toFixed(0);
}

// ─── XLM Payment (Horizon) ────────────────────────────────────────
export type SendXlmResult = {
  hash: string;
  ledger: number;
};

/**
 * Sends a native XLM payment on Stellar testnet via Horizon.
 * Uses Freighter to sign; does NOT go through Soroban/RPC.
 *
 * @param sender  - G-address of the sending account (connected wallet)
 * @param destination - G-address of the recipient
 * @param amount  - XLM amount as a decimal string e.g. "10.5"
 * @param memo    - optional text memo (max 28 bytes)
 */
export async function sendXlmPayment(
  sender: string,
  destination: string,
  amount: string,
  memo?: string
): Promise<SendXlmResult> {
  // 1. Validate destination address
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

  // 2. Fetch sender account sequence from Horizon
  const accountRes = await fetch(`${HORIZON_URL}/accounts/${sender}`);
  if (!accountRes.ok) {
    throw new Error("Could not fetch sender account. Is your wallet funded?");
  }
  const accountData = await accountRes.json();
  const senderAccount = new Account(sender, accountData.sequence);

  // 3. Build the payment transaction
  const txBuilder = new TransactionBuilder(senderAccount, {
    fee: "100000", // 0.01 XLM max fee — generous for testnet
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

  // 4. Sign with Freighter
  const { signedTxXdr, error: signError } = await freighter.signTransaction(
    tx.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  );
  if (signError) {
    throw new Error(`Freighter signing failed: ${signError}`);
  }

  // 5. Submit to Horizon
  const submitRes = await fetch(`${HORIZON_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: signedTxXdr }),
  });

  const submitData = await submitRes.json();

  if (!submitRes.ok || !submitData.successful) {
    // Extract the most useful error message from Horizon's result_codes
    const codes = submitData?.extras?.result_codes;
    const detail = codes
      ? `${codes.transaction ?? ""}${codes.operations ? " / " + codes.operations.join(", ") : ""}`
      : submitData?.title ?? "Transaction failed";
    throw new Error(detail.trim());
  }

  return {
    hash: submitData.hash,
    ledger: submitData.ledger,
  };
}

/**
 * Fetches the native XLM balance for any G-address from Horizon.
 */
export async function fetchXlmBalance(address: string): Promise<string | null> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    const native = data.balances?.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === "native"
    );
    return native ? parseFloat(native.balance).toLocaleString("en-US", { maximumFractionDigits: 2 }) : null;
  } catch {
    return null;
  }
}
