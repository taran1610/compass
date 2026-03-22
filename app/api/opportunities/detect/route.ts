import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { detectOpportunities } from "@/lib/opportunities/detect";

export const maxDuration = 60;

/**
 * POST /api/opportunities/detect
 * Runs opportunity detection: internal docs + market signals + competitor insights.
 * Persists results to detected_opportunities.
 */
export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const workspaceId = body.workspace_id ?? null;

    const opportunities = await detectOpportunities(workspaceId);

    if (opportunities.length === 0) {
      return NextResponse.json({
        opportunities: [],
        message: "No documents found. Upload documents to detect opportunities.",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("detected_opportunities").delete().gte("created_at", "1970-01-01");

    const rows = opportunities.map((o) => ({
      workspace_id: workspaceId,
      title: o.title,
      feature_requests: o.feature_requests,
      support_tickets: o.support_tickets,
      interview_mentions: o.interview_mentions,
      reddit_mentions: o.reddit_mentions,
      x_mentions: o.x_mentions,
      product_review_mentions: o.product_review_mentions,
      competitor_missing: o.competitor_missing,
      competitor_names: o.competitor_names,
      priority: o.priority,
      confidence: o.confidence,
    }));

    const { error } = await supabase.from("detected_opportunities").insert(rows);

    if (error) throw error;

    return NextResponse.json({
      opportunities,
      count: opportunities.length,
    });
  } catch (err) {
    console.error("Opportunity detection error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Detection failed",
        opportunities: [],
      },
      { status: 500 }
    );
  }
}
