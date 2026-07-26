# 🤖 Crypto Investor AI

> An AI-powered Web3 investor prediction platform built on the Stellar blockchain.

[![Stellar](https://img.shields.io/badge/Blockchain-Stellar-blue)](https://stellar.org/)
[![Soroban](https://img.shields.io/badge/Smart%20Contracts-Soroban-purple)](https://soroban.stellar.org/)
[![GitHub](https://img.shields.io/badge/GitHub-Public%20Repository-black)](https://github.com/parthbhatti21/Crypto-investor-AI)

---

## 🔗 Public GitHub Repository

The complete source code for this project is publicly available on GitHub:

👉 **[Crypto Investor AI – GitHub Repository](https://github.com/parthbhatti21/Crypto-investor-AI)**

---

## 📌 Project Description

**Crypto Investor AI** is a Web3 application that combines **Artificial Intelligence and blockchain technology** to help users explore crypto investment predictions and interact with the Stellar blockchain.

The platform provides AI-powered investor insights while allowing users to connect their Stellar wallet, view their XLM balance, perform transactions on the Stellar Testnet, and receive transaction results directly inside the application.

The project demonstrates how AI and Web3 can work together to create a transparent, accessible, and blockchain-powered investment experience.

> ⚠️ AI-generated predictions are for educational and experimental purposes only and should not be considered financial advice.

---

## ✨ Key Features

### 🤖 AI-Powered Investor Predictions

The platform uses AI-powered analysis to generate insights and predictions related to crypto investment opportunities.

Users can explore:

- Market insights
- Crypto investment predictions
- Potential opportunities
- AI-generated analysis
- Prediction-based investor insights

### 🔗 Stellar Wallet Connection

Users can connect their Stellar-compatible wallet to the application.

After connecting their wallet, users can interact with the Web3 features of the platform.

The application displays the connected wallet address to confirm the successful wallet connection.

### 💰 XLM Balance Display

After the wallet is connected, the application retrieves and displays the user's XLM balance from the Stellar network.

### ⚡ Stellar Blockchain Transactions

Users can perform transactions using their connected Stellar wallet.

The transaction is submitted to the Stellar Testnet and processed through the blockchain.

### ✅ Transaction Result Display

After a successful transaction, the application displays the result to the user.

The transaction result includes information such as:

- Transaction status
- Transaction hash
- Confirmation result
- Blockchain transaction details

---

## 🏗️ Project Architecture

```text
┌───────────────────────────────┐
│       User / Investor         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│        Client Application     │
│                               │
│  • AI Predictions             │
│  • Wallet Connection          │
│  • Balance Display            │
│  • Transaction Interface      │
└───────────────┬───────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌───────────────┐  ┌───────────────┐
│   AI Engine    │  │ Stellar Wallet│
│               │  │               │
│ Predictions   │  │ User Approval │
└───────────────┘  └───────┬───────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ Stellar Network│
                  │                │
                  │ Testnet        │
                  │ Transactions   │
                  └────────────────┘
