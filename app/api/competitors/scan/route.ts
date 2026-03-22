import { NextResponse } from "next/server";
import { runCompetitorScan } from "@/lib/ai/competitor-monitor";

export const maxDuration = 60;

export async function POST() {
  try {
    const { gaps, alerts } = await runCompetitorScan();
    return NextResponse.json({ gaps, alerts });
  } catch (err) {
    console.error("Competitor scan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 500 }
    );
  }
}
