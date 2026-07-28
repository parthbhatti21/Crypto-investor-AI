# Wallet Integration — @stellar/freighter-api

This file documents every `@stellar/freighter-api` function call used in the project.
All calls live in `contract.ts` in this directory; no other file imports freighter directly.

## Package

```json
"@stellar/freighter-api": "^6.0.1"   // client/package.json
```

---

## 1. `freighter.isConnected()` — detect extension presence

**File:** `contract.ts` → `connectWallet()`

```ts
import * as freighter from "@stellar/freighter-api";

const { isConnected } = await freighter.isConnected();
if (!isConnected) {
  throw new Error("Freighter extension not found. Install it from freighter.app then refresh.");
}
```

Checked before every explicit connect attempt. If the extension is absent the user sees
an inline error with a link to freighter.app.

---

## 2. `freighter.requestAccess()` — connect wallet + retrieve address

**File:** `contract.ts` → `connectWallet()`  
**Triggered by:** "Connect Freighter" button in `WalletConnect.tsx` and `Nav.tsx`

```ts
export async function connectWallet(): Promise<string | null> {
  const { isConnected } = await freighter.isConnected();
  if (!isConnected) throw new Error("Freighter extension not found...");

  const { address, error } = await freighter.requestAccess();
  if (error) throw new Error(`Freighter: ${error}`);
  return address || null;
}
```

`requestAccess()` opens the Freighter approval popup if the site hasn't been approved yet,
then returns the user's Stellar G-address.

---

## 3. `freighter.isAllowed()` — check prior approval (silent reconnect)

**File:** `contract.ts` → `getWalletAddress()`  
**Triggered by:** `useEffect` on mount in `WalletContext.tsx` and `WalletConnect.tsx`

```ts
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
```

Returns `null` without showing any popup if the site hasn't been approved before.
Returns the address immediately if it has — enabling seamless auto-reconnect.

---

## 4. `freighter.getAddress()` — retrieve address without popup

**File:** `contract.ts` → `getWalletAddress()` (see above)

Called after confirming `isAllowed()`. Only runs if the site already has permission,
so it never triggers a popup unexpectedly.

---

## 5. `freighter.signTransaction()` — sign Soroban contract transactions

**File:** `contract.ts` → `buildAndSign()`  
**Used by:** `createPrediction()`, `backPrediction()`, `resolvePrediction()`, `claimRewards()`  
**UI components:** `CreatePrediction.tsx`, `PredictionCard.tsx`

```ts
async function buildAndSign(method: string, args: xdr.ScVal[], source: string) {
  // 1. Build raw transaction
  const rawTx = new TransactionBuilder(account, { fee: "100000", networkPassphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(300)
    .build();

  // 2. Simulate + assemble Soroban footprint
  const preparedTx = await server.prepareTransaction(rawTx);

  // 3. Sign with Freighter
  const { signedTxXdr, error: signError } = await freighter.signTransaction(
    preparedTx.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  );
  if (signError) throw new Error(`Freighter signing error: ${signError}`);

  // 4. Submit and poll for confirmation
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const result = await server.sendTransaction(signedTx);
  // ... poll loop
}
```

---

## 6. `freighter.signTransaction()` — sign native XLM payment transactions

**File:** `contract.ts` → `sendXlmPayment()`  
**UI component:** `SendXLM.tsx`

```ts
export async function sendXlmPayment(sender, destination, amount, memo?) {
  // Build a Horizon payment transaction
  const tx = new TransactionBuilder(senderAccount, { fee: "100000", networkPassphrase })
    .addOperation(Operation.payment({ destination, asset: Asset.native(), amount }))
    .setTimeout(300)
    .build();

  // Sign with Freighter
  const { signedTxXdr, error: signError } = await freighter.signTransaction(
    tx.toXDR(),
    { networkPassphrase: NETWORK_PASSPHRASE }
  );
  if (signError) throw new Error(`Freighter signing failed: ${signError}`);

  // Submit to Horizon
  const submitRes = await fetch(`${HORIZON_URL}/transactions`, {
    method: "POST",
    body: new URLSearchParams({ tx: signedTxXdr }),
  });
  // ...
}
```

---

## Call map

| freighter-api function    | contract.ts function  | UI trigger                            |
|---------------------------|-----------------------|---------------------------------------|
| `isConnected()`           | `connectWallet()`     | "Connect Freighter" button click      |
| `requestAccess()`         | `connectWallet()`     | "Connect Freighter" button click      |
| `isConnected()`           | `getWalletAddress()`  | Auto on page load (mount effect)      |
| `isAllowed()`             | `getWalletAddress()`  | Auto on page load (mount effect)      |
| `getAddress()`            | `getWalletAddress()`  | Auto on page load (mount effect)      |
| `signTransaction()`       | `buildAndSign()`      | Submit prediction / back / resolve / claim |
| `signTransaction()`       | `sendXlmPayment()`    | "Send XLM" form submit                |

---

## WalletContext — full implementation summary

`client/src/context/WalletContext.tsx` wraps the entire app via `layout.tsx`.

```ts
// client/src/context/WalletContext.tsx
import { getWalletAddress, connectWallet, fetchXlmBalance } from "@/hooks/contract";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Auto-reconnect on mount — calls freighter.isAllowed() + freighter.getAddress()
  useEffect(() => {
    getWalletAddress().then((addr) => {
      if (addr) { setAddress(addr); loadBalance(addr); }
    });
  }, [loadBalance]);

  // Explicit connect — calls freighter.requestAccess()
  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const addr = await connectWallet();
      if (addr) { setAddress(addr); loadBalance(addr); }
    } finally {
      setConnecting(false);
    }
  }, [loadBalance]);

  const disconnect = useCallback(() => { setAddress(""); setBalance(null); }, []);
}
```

## WalletConnect — full implementation summary

`client/src/components/WalletConnect.tsx` renders the connect button used on predictions
and portfolio pages.

```ts
// client/src/components/WalletConnect.tsx
import { connectWallet, getWalletAddress, fetchXlmBalance } from "@/hooks/contract";

// Silent auto-reconnect on mount
useEffect(() => {
  getWalletAddress().then((addr) => {
    if (addr) { setAddress(addr); onConnect(addr); doFetchBalance(addr); }
  });
}, [onConnect, doFetchBalance]);

// Explicit connect button handler
const handleConnect = async () => {
  setLoading(true);
  const addr = await connectWallet();   // → freighter.requestAccess()
  if (addr) { setAddress(addr); onConnect(addr); doFetchBalance(addr); }
  setLoading(false);
};
```

---

## Component hierarchy

```
layout.tsx
└── WalletProvider (context/WalletContext.tsx)
    │   calls connectWallet() and getWalletAddress() from contract.ts
    │
    ├── Nav.tsx → WalletButton
    │       reads address/balance/connect/disconnect from WalletContext
    │
    ├── WalletConnect.tsx
    │       also calls connectWallet() / getWalletAddress() directly
    │
    ├── CreatePrediction.tsx
    │       calls createPrediction() → buildAndSign() → signTransaction()
    │
    ├── PredictionCard.tsx
    │       calls backPrediction / resolvePrediction / claimRewards → signTransaction()
    │
    └── SendXLM.tsx
            calls sendXlmPayment() → signTransaction()
```
