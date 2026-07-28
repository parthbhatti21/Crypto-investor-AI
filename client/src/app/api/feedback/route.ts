import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Resolve path relative to project root, not the build output
const DATA_FILE = path.join(process.cwd(), "data", "feedback.json");

export type FeedbackEntry = {
  id: string;
  rating: number;       // 1–5
  message: string;
  address: string;      // wallet address or "anonymous"
  timestamp: string;    // ISO 8601
};

// ── GET — return all entries (used by /admin/feedback) ─────────────
export async function GET(req: NextRequest) {
  // Require the admin key to read submissions
  const adminKey = process.env.ADMIN_KEY || process.env.NEXT_PUBLIC_ADMIN_KEY;
  const provided  = req.nextUrl.searchParams.get("key");

  if (adminKey && provided !== adminKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const entries: FeedbackEntry[] = JSON.parse(raw);
    return NextResponse.json(entries);
  } catch {
    return NextResponse.json([]);
  }
}

// ── POST — submit new feedback ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 });
    }

    const message = String(body.message ?? "").trim().slice(0, 500);
    // Accept any G-address or fall back to "anonymous"
    const address = typeof body.address === "string" && body.address.startsWith("G")
      ? body.address
      : "anonymous";

    const entry: FeedbackEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      rating,
      message,
      address,
      timestamp: new Date().toISOString(),
    };

    // Read → append → write (file is tiny; fine for MVP scale)
    let entries: FeedbackEntry[] = [];
    try {
      const raw = await fs.readFile(DATA_FILE, "utf-8");
      entries = JSON.parse(raw);
    } catch { /* first write */ }

    entries.push(entry);
    await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));

    return NextResponse.json({ ok: true, id: entry.id }, { status: 201 });
  } catch (err: any) {
    console.error("Feedback POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
