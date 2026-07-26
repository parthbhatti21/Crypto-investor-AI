import type { Metadata } from "next";
import MarketsClient from "./MarketsClient";

export const metadata: Metadata = {
  title: "Markets",
};

export default function MarketsPage() {
  return <MarketsClient />;
}
