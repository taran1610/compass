import { NextResponse } from "next/server";
import { runDecisionSimulation } from "@/lib/ai/decision-engine";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const feature = body?.feature?.trim();
    if (!feature) {
      return NextResponse.json({ error: "Feature required" }, { status: 400 });
    }

    const result = await runDecisionSimulation(feature);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Decision simulation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
