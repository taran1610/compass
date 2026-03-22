import { NextResponse } from "next/server";
import { extractProductInsights } from "@/lib/rag/extract-insights";
import { getDocumentCount } from "@/lib/documents-count";
import { DEMO_PRODUCT_INSIGHTS } from "@/lib/demo-data";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * POST /api/insights/analyze
 * Returns cached insights when possible. For new users (0 docs), returns demo data.
 * Only runs AI analysis when cache miss.
 */
export async function POST() {
  try {
    const count = await getDocumentCount();

    // New users: return demo data (no tokens)
    if (count === 0) {
      return NextResponse.json({
        painPoints: DEMO_PRODUCT_INSIGHTS.painPoints,
        retentionRisks: DEMO_PRODUCT_INSIGHTS.retentionRisks,
        featureDemand: DEMO_PRODUCT_INSIGHTS.featureDemand,
        aiInsights: DEMO_PRODUCT_INSIGHTS.aiInsights,
      });
    }

    // Check cache
    const supabase = getSupabase();
    if (supabase) {
      const { data: cached } = await supabase
        .from("analysis_cache")
        .select("insights_json")
        .eq("id", "default")
        .eq("document_count", count)
        .single();

      if (cached?.insights_json && typeof cached.insights_json === "object") {
        const ins = cached.insights_json as Record<string, unknown>;
        return NextResponse.json({
          painPoints: ins.painPoints ?? [],
          retentionRisks: ins.retentionRisks ?? [],
          featureDemand: ins.featureDemand ?? [],
          aiInsights: ins.aiInsights ?? [],
        });
      }
    }

    // Cache miss: run analysis and persist (preserve features_json if present)
    const insights = await extractProductInsights();
    if (supabase) {
      const { data: existing } = await supabase
        .from("analysis_cache")
        .select("features_json")
        .eq("id", "default")
        .single();
      await supabase.from("analysis_cache").upsert(
        {
          id: "default",
          document_count: count,
          insights_json: insights,
          features_json: (existing?.features_json as unknown[]) ?? [],
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    return NextResponse.json(insights);
  } catch (err) {
    console.error("Insights analysis error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
