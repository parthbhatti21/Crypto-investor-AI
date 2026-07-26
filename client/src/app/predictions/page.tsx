import type { Metadata } from "next";
import PredictionsClient from "./PredictionsClient";

export const metadata: Metadata = {
  title: "Predictions",
};

export default function PredictionsPage() {
  return <PredictionsClient />;
}
