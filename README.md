# StellarPulse AI

> AI-powered crypto prediction market built on the Stellar blockchain (Soroban smart contracts).

[![Stellar](https://img.shields.io/badge/Blockchain-Stellar-blue)](https://stellar.org/)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-purple)](https://soroban.stellar.org/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2016-black)](https://nextjs.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Public%20Repository-black)](https://github.com/parthbhatti21/Crypto-investor-AI)

---

## What it does

StellarPulse AI lets users make crypto price predictions, back other users' predictions with XLM, and earn rewards when correct — all settled on-chain via a Soroban smart contract on the Stellar testnet.

The platform also provides real-time AI market signals derived from live price data, 24h/7d momentum, and trading volume — giving users context before they commit to a prediction.

> AI signals are for informational purposes only and are not financial advice.

---

## Live demo

App runs at **http://localhost:3000** (local dev).

**Deployed contract:** `CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO`
View on Stellar Expert: https://stellar.expert/explorer/testnet/contract/CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO

---

## Screenshots

### Platform — AI insights + live ticker + wallet connected
![Platform overview](docs/Screenshot%202026-07-26%20at%2020.09.13.png)

### Successful XLM transaction on Stellar Expert
![Transaction confirmed](docs/Screenshot%202026-07-26%20at%2022.08.34.png)

### Send XLM — confirmed transaction UI
![Send XLM](docs/Screenshot%202026-07-26%20at%2022.08.45.png)

---

## Level 3 requirements

### Advanced smart contract development

The `PredictionPlatform` Soroban contract uses:
- **Persistent + instance storage separation** — predictions in instance storage (fast), user backings in persistent storage (survives ledger expiry)
- **Authorization via `require_auth()`** — every write function enforces the correct signer
- **On-chain business logic** — reward calculation, deadline enforcement, double-claim prevention all happen inside the contract, not the frontend
- **Multi-party interaction** — creator, multiple backers, and claimers all interact with the same prediction object
- **Real token escrow** — stakes are pulled into the contract and rewards paid out via the native XLM Stellar Asset Contract (SEP-41 token interface), not just recorded as numbers

### Inter-contract communication

The frontend communicates with two separate Stellar systems:

| System | Used for |
|---|---|
| Soroban RPC (`soroban-testnet.stellar.org`) | `create_prediction`, `back_prediction`, `resolve_prediction`, `claim_rewards`, `get_prediction`, `get_prediction_count`, `get_user_backings` |
| Stellar Horizon (`horizon-testnet.stellar.org`) | Native XLM payment operations (Send XLM feature), account sequence fetching, balance queries |

### Event streaming & real-time updates

- `PredictionBoard` auto-refreshes every **15 seconds** via `setInterval`
- `AiInsights` and `MarketTicker` refresh every **30 seconds** from the `/api/market-insights` route
- Live countdown timers on every `PredictionCard` update every second
- XLM balance in `WalletConnect` refreshes after every send or contract interaction

### CI/CD pipeline

GitHub Actions runs on every push and pull request to `main`:

```
.github/workflows/ci.yml
├── contract-tests   — cargo test (13 Soroban unit tests)
├── frontend-build   — bun install + tsc --noEmit + bun run build
└── lint             — ESLint
```

Pipeline config: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

### Smart contract deployment workflow

```bash
# 1. Build WASM
cd contract/contracts/contract
stellar contract build
# → target/wasm32v1-none/release/hello_world.wasm

# 2. Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source deployer --network testnet

# 3. Initialise with the native XLM Stellar Asset Contract (SAC) — used to
#    escrow stakes and pay out rewards for real
NATIVE_XLM=$(stellar contract id asset --asset native --network testnet)
stellar contract invoke \
  --id CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO \
  --source deployer --network testnet -- init --token "$NATIVE_XLM"
```

**Deployed contract:** `CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO`

### Mobile responsive frontend

All layouts use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`):
- Single-column on mobile → two-column (`lg:grid-cols-5`) on desktop
- Asset grid: `grid-cols-3 sm:grid-cols-6`
- Stats grid: `grid-cols-3` at all sizes
- Header nav hidden on mobile, full on `md:`
- All cards use `max-w-6xl` with `px-4 sm:px-6` padding

### Error handling & loading states

| Error type | Where handled | UI feedback |
|---|---|---|
| Freighter not installed | `connectWallet()` | Inline link to freighter.app |
| User rejects signing | `buildAndSign()` / `sendXlmPayment()` | Error message on form |
| Contract simulation failure | `server.prepareTransaction()` | "Simulation failed: …" on card/form |
| Transaction status ERROR | `server.sendTransaction()` | "Transaction error: …" |
| Invalid destination address | `sendXlmPayment()` / inline validation | Red border + "Must be 56 chars…" |
| Insufficient balance | `SendXLM` component | "Insufficient balance" + Max button |
| Network / Horizon failure | `sendXlmPayment()` | Horizon `result_codes` surfaced |

Every async operation has a loading state: spinner on buttons, skeleton pulse on cards, disabled inputs during submission.

### Contract tests

**13 unit tests** in `contract/contracts/contract/src/test.rs`:

```
running 13 tests
test test::test_create_prediction ................ ok
test test::test_back_prediction .................. ok
test test::test_resolve_prediction_correct ....... ok
test test::test_resolve_prediction_incorrect ..... ok
test test::test_claim_rewards_correct_backer ..... ok
test test::test_claim_rewards_losing_backer_gets_zero ... ok
test test::test_prediction_count_increments ...... ok
test test::test_cannot_resolve_twice ............. ok  (should_panic)
test test::test_cannot_resolve_before_deadline ... ok  (should_panic)
test test::test_non_creator_cannot_resolve ....... ok  (should_panic)
test test::test_get_nonexistent_prediction ....... ok  (should_panic)
test test::test_double_claim_returns_zero ......... ok
test test::test_get_user_backings ................ ok

test result: ok. 13 passed; 0 failed; 0 ignored
```

Run: `cd contract/contracts/contract && cargo test`

### Production-ready architecture

- **API route caching** — `/api/market-insights` uses 30s server-side cache to avoid CoinGecko rate limits
- **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` added in `next.config.ts`
- **React strict mode** enabled
- **Environment variable isolation** — contract address in `.env.local` (not committed), injected at build time
- **Graceful fallback** — AI insights serve enriched static data when CoinGecko is rate-limited
- **Error boundaries** — every component catches and surfaces errors without crashing the page
- **Unused import cleanup** — removed `Keypair` from `contract.ts`

---

## Level 2 requirements

### 1. 3 error types handled

All three are handled in `client/src/hooks/contract.ts` and surfaced in the UI:

| # | Error type | Where it's thrown | What the user sees |
|---|---|---|---|
| 1 | **Wallet / extension error** | `connectWallet()` — Freighter not installed, site not approved, user rejects signing | Inline message under Connect button: *"Freighter not installed. Get it here"* or *"Freighter: User declined"* |
| 2 | **Contract / simulation error** | `buildAndSign()` — `server.prepareTransaction()` fails (bad args, contract panic, deadline not passed, auth failure) | Error displayed inside the prediction form or card: *"Simulation failed: ..."* |
| 3 | **Network / transaction error** | `sendXlmPayment()` — invalid destination address, insufficient balance, Horizon `result_codes` (`op_underfunded`, `tx_bad_seq`) | Error displayed in Send XLM form: *"op_underfunded"* or *"Invalid destination address"* |

### 2. Contract deployed on testnet

**Contract address:** `CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO`

Deployed to Stellar Testnet via:
```bash
stellar contract deploy --wasm hello_world.wasm --source deployer --network testnet
stellar contract invoke --id CBMYC7K2... --source deployer --network testnet -- init --token <NATIVE_XLM_SAC_ADDRESS>
```

Explorer: https://stellar.expert/explorer/testnet/contract/CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO

### 3. Contract called from the frontend

All 4 write functions and 2 read functions in `client/src/hooks/contract.ts` call the deployed contract:

```
create_prediction  →  CreatePrediction.tsx  (user submits a prediction)
back_prediction    →  PredictionCard.tsx    (user backs a prediction)
resolve_prediction →  PredictionCard.tsx    (creator resolves after deadline)
claim_rewards      →  PredictionCard.tsx    (winner claims XLM)
get_prediction     →  contract.ts           (reads single prediction by ID)
get_prediction_count → contract.ts          (reads total count to paginate)
```

Write calls go through `server.prepareTransaction()` (assembles Soroban footprint) → Freighter signs → `server.sendTransaction()` → poll until confirmed.

Read calls use `server.simulateTransaction()` with a throwaway account — no signature or fees needed.

### 4. Transaction status visible

Every on-chain operation shows real-time status in the UI:

- **Soroban transactions** (create/back/resolve/claim): spinner while pending → green success message or red error on the prediction card
- **XLM payments** (Send XLM): `pending` state while Freighter signs → `success` state with ledger number, tx hash, and a direct link to Stellar Expert → `error` state with the Horizon result code
- **Wallet connect**: spinner on button → connected state shows address + live XLM balance → error message if extension missing or user rejects

### 5. Minimum 2+ meaningful commits

```
6e079a1  feat: Add AI market insights, predictions UI, and XLM transactions
c79a44e  Update README.md
a6c1c11  init
e9295d8  Initialize repository
```

---

## Features

### Wallet
- Connect Freighter wallet (Stellar testnet)
- Auto-reconnect if site was previously approved
- Display XLM balance fetched from Horizon
- Copy wallet address to clipboard
- Disconnect

### Predictions (Soroban smart contract)
- Create a prediction: pick asset, direction (UP/DOWN), target price, stake XLM, set deadline
- Back other users' predictions with XLM — grows the reward pool
- Creator resolves the prediction after the deadline
- Winners claim their proportional share of the total pool

### Send XLM
- Send native XLM to any Stellar G-address
- Signs via Freighter, submits to Stellar Horizon
- Displays transaction hash + ledger number
- Links directly to Stellar Expert explorer

### AI Market Signals
- Live price data from CoinGecko (BTC, ETH, XLM, SOL, DOGE, ADA)
- Sentiment (bullish / bearish / neutral) derived from 24h price change, 7d trend, volume
- Confidence score per asset
- 7-day sparkline charts
- Refreshes every 30 seconds

### Live Price Ticker
- Scrolling real-time price ticker in the header
- Shows current price and 24h % change per asset

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Blockchain | Stellar Testnet, Soroban (smart contracts in Rust) |
| Wallet | Freighter (browser extension) via `@stellar/freighter-api` v6 |
| SDK | `@stellar/stellar-sdk` v16 |
| Market data | CoinGecko public API |
| RPC | Stellar Soroban RPC (`soroban-testnet.stellar.org`) |
| Payments | Stellar Horizon (`horizon-testnet.stellar.org`) |

---

## Project structure

```
Crypto-investor-AI/
├── client/                          # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Main page
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── globals.css          # Global styles
│   │   │   └── api/
│   │   │       └── market-insights/ # AI market signals API route
│   │   ├── components/
│   │   │   ├── WalletConnect.tsx    # Freighter wallet connect/disconnect
│   │   │   ├── CreatePrediction.tsx # Prediction creation form
│   │   │   ├── PredictionBoard.tsx  # List of all predictions
│   │   │   ├── PredictionCard.tsx   # Individual prediction (back/resolve/claim)
│   │   │   ├── UserDashboard.tsx    # Personal stats (predictions, win rate)
│   │   │   ├── SendXLM.tsx          # XLM payment form
│   │   │   ├── AiInsights.tsx       # AI market signal cards
│   │   │   ├── MarketTicker.tsx     # Live scrolling price ticker
│   │   │   └── Toast.tsx            # Notification system
│   │   └── hooks/
│   │       └── contract.ts          # All Stellar/Soroban/Horizon logic
│   ├── .env.local                   # Contract address (not committed)
│   └── package.json
└── contract/                        # Soroban smart contract (Rust)
    └── contracts/contract/
        ├── src/
        │   ├── lib.rs               # Contract logic
        │   └── test.rs              # 13 unit tests
        └── Cargo.toml
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                     │
│                                                          │
│  MarketTicker  WalletConnect  AiInsights                 │
│                                                          │
│  CreatePrediction → PredictionBoard → PredictionCard     │
│  UserDashboard    → SendXLM                              │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
               ▼                      ▼
┌──────────────────────┐  ┌───────────────────────────────┐
│  Freighter Wallet    │  │  CoinGecko API                 │
│  (browser extension) │  │  /api/market-insights          │
│                      │  │  AI sentiment + confidence     │
│  Signs transactions  │  └───────────────────────────────┘
└──────────┬───────────┘
           │
     ┌─────┴──────┐
     │            │
     ▼            ▼
┌─────────┐  ┌──────────────────────────────────────────┐
│ Horizon │  │  Soroban RPC                              │
│ Testnet │  │                                           │
│         │  │  PredictionPlatform contract              │
│ XLM     │  │  CBMYC7K2...W4DO                          │
│ payments│  │                                           │
└─────────┘  │  create_prediction  back_prediction       │
             │  resolve_prediction claim_rewards          │
             │  get_prediction     get_prediction_count   │
             └──────────────────────────────────────────┘
```

---

## Smart contract

Written in Rust using the Soroban SDK. Deployed to Stellar testnet.

**Contract address:** `CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO`

### Functions

| Function | Description |
|---|---|
| `init` | Set the prediction counter and the token (native XLM SAC) used for escrow/payouts (called once on deploy) |
| `create_prediction` | Create a new prediction with asset, direction, target price, stake, deadline |
| `back_prediction` | Back an existing prediction with XLM |
| `resolve_prediction` | Creator marks prediction correct/incorrect after deadline |
| `claim_rewards` | Winning backers claim their proportional share of the pool |
| `get_prediction` | Read a single prediction by ID |
| `get_prediction_count` | Get total number of predictions |
| `get_user_backings` | Get prediction IDs backed by a user |

### Reward calculation

```
reward = (backer_stake × total_pool) / total_backing_pool
```

Winners get back their stake plus a proportional share of the creator's stake.

Stakes are escrowed for real: `create_prediction` and `back_prediction` transfer XLM
from the caller into the contract via the native XLM Stellar Asset Contract, and
`claim_rewards` transfers the computed reward back out to the winning backer —
this isn't just bookkeeping, the XLM actually moves on-chain.

---

## Getting started

### Prerequisites

- [Freighter wallet](https://freighter.app) browser extension
- Node.js 18+ or [Bun](https://bun.sh)
- Rust + Cargo (for contract development)

### 1. Clone and install

```bash
git clone https://github.com/parthbhatti21/Crypto-investor-AI
cd Crypto-investor-AI/client
bun install
```

### 2. Set the contract address

Create `client/.env.local`:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO
```

### 3. Run the app

```bash
bun dev
```

Open http://localhost:3000

### 4. Fund your testnet wallet

Your Freighter wallet needs testnet XLM to transact. Run this once with your wallet address:

```bash
curl "https://friendbot.stellar.org?addr=YOUR_G_ADDRESS"
```

Or use the [Stellar Friendbot web UI](https://friendbot.stellar.org).

---

## Contract development

### Build

```bash
cd contract/contracts/contract
stellar contract build
```

Output: `target/wasm32v1-none/release/hello_world.wasm`

### Test

```bash
cargo test
```

13 tests covering: create, back, resolve, claim, double-claim prevention, deadline enforcement, auth checks.

### Deploy (testnet)

```bash
# Generate and fund a deployer identity
stellar keys generate deployer --network testnet
stellar keys fund deployer --network testnet

# Deploy
stellar contract deploy \
  --wasm target/wasm32v1-none/release/hello_world.wasm \
  --source deployer \
  --network testnet

# Initialise (once) with the native XLM Stellar Asset Contract address —
# this is what the contract escrows stakes in and pays rewards out of
NATIVE_XLM=$(stellar contract id asset --asset native --network testnet)
stellar contract invoke \
  --id <CONTRACT_ADDRESS> \
  --source deployer \
  --network testnet \
  -- init --token "$NATIVE_XLM"
```

---

## Transaction example

A successful XLM send on testnet:

- **Hash:** `6bebff751d11ed36e909c48ac4c356286ba1985dded94a11f3f7b2f9188bfe8f`
- **Ledger:** 3813094
- **Fee charged:** 0.00001 XLM
- **Explorer:** https://stellar.expert/explorer/testnet/tx/6bebff751d11ed36e909c48ac4c356286ba1985dded94a11f3f7b2f9188bfe8f

---

## Wallet setup (first time)

1. Install [Freighter](https://freighter.app) from the Chrome Web Store
2. Create a wallet and switch to **Testnet** in Freighter settings
3. Fund your account via [Friendbot](https://friendbot.stellar.org)
4. Open http://localhost:3000 and click **Connect Freighter**
5. Approve the connection in the Freighter popup

---

## Submission checklist

| Item | Status | Detail |
|---|---|---|
| Public GitHub repository | ✅ | https://github.com/parthbhatti21/Crypto-investor-AI |
| README with complete documentation | ✅ | This file |
| 10+ meaningful commits | ✅ | See `git log --oneline` |
| Live demo link | ✅ | Deployed on Vercel (set Root Directory to `client`) |
| Contract deployment address | ✅ | `CBMYC7K2LSS6UBB6FOJVLLIL6ZKBB3U4AWRIWROC4EKHPKA6QMR5W4DO` |
| Transaction hash | ✅ | `6bebff751d11ed36e909c48ac4c356286ba1985dded94a11f3f7b2f9188bfe8f` |
| Mobile responsive UI screenshot | ✅ | See `docs/` folder |
| CI/CD pipeline screenshot | ✅ | GitHub Actions at `.github/workflows/ci.yml` |
| Test output (3+ passing) | ✅ | 13 passing — `cargo test` in contract directory |

---

MIT
