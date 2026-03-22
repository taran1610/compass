import { NextResponse } from "next/server";
import { runMarketAnalysis } from "@/lib/ai/market-analyzer";

export const maxDuration = 120;

export async function POST() {
  try {
    const result = await runMarketAnalysis();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Market analysis error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
