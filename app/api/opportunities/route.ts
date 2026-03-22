import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getDocumentCount } from "@/lib/documents-count";
import { DEMO_OPPORTUNITIES } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/opportunities
 * Returns detected opportunities. For new users (0 docs), returns demo data.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      opportunities: [],
      message: "Supabase not configured. Run POST /api/opportunities/analyze after configuring.",
    });
  }

  try {
    const count = await getDocumentCount();

    // New users: return demo opportunities (no DB/tokens)
    if (count === 0) {
      return NextResponse.json({ opportunities: DEMO_OPPORTUNITIES });
    }

    const client = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await client
      .from("detected_opportunities")
      .select("*")
      .order("confidence", { ascending: false });

    if (error) throw error;

    const opportunities = (data ?? []).map((row: Record<string, unknown>) => {
      const signals =
        (Number(row.feature_requests) || 0) +
        (Number(row.support_tickets) || 0) +
        (Number(row.interview_mentions) || 0) +
        (Number(row.reddit_mentions) || 0) +
        (Number(row.x_mentions) || 0) +
        (Number(row.product_review_mentions) || 0);
      return {
        ...row,
        signals_count: signals,
        opportunity_score: Number(row.confidence) || 0,
      };
    });

    return NextResponse.json({ opportunities });
  } catch (err) {
    console.error("Opportunities fetch error:", err);
    return NextResponse.json({ opportunities: [] });
  }
}
