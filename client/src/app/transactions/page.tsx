import type { Metadata } from "next";
import TransactionsClient from "./TransactionsClient";

export const metadata: Metadata = { title: "Transactions" };

export default function TransactionsPage() {
  return <TransactionsClient />;
}
