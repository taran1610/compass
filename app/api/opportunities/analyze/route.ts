import { NextResponse } from "next/server";
import { runOpportunityAnalysis } from "@/lib/ai/opportunity-engine";

export const maxDuration = 120;

/**
 * POST /api/opportunities/analyze
 * Runs opportunity detection pipeline: pain points → clustering → scoring → store
 */
export async function POST() {
  try {
    const opportunities = await runOpportunityAnalysis();
    return NextResponse.json({ opportunities, count: opportunities.length });
  } catch (err) {
    console.error("Opportunity analysis error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
