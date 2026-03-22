import { NextResponse } from "next/server";
import { generatePRDFromDocuments, generateEngineeringPRD } from "@/lib/rag/generate-prd";

export const maxDuration = 60;

/**
 * POST /api/prd/generate
 * Body: { featureContext?: string, mode?: "pm" | "engineering", problem?, goals?, userStories? }
 * Generates PRD from uploaded documents via RAG.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const featureContext = body.featureContext as string | undefined;
    const mode = (body.mode as "pm" | "engineering") ?? "pm";
    const problem = body.problem as string | undefined;
    const goals = body.goals as string | undefined;
    const userStories = body.userStories as { as: string; want: string; soThat: string }[] | undefined;

    if (mode === "engineering" && problem && goals && userStories?.length) {
      const engineering = await generateEngineeringPRD(problem, goals, userStories);
      return NextResponse.json({ engineering });
    }

    const prd = await generatePRDFromDocuments(featureContext);
    return NextResponse.json(prd);
  } catch (err) {
    console.error("PRD generation error:", err);
    return NextResponse.json(
      { error: "PRD generation failed" },
      { status: 500 }
    );
  }
}
