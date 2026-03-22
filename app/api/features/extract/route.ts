import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchDocumentsForExtraction,
  extractFeaturesFromContent,
  aggregateFeatureSignals,
} from "@/lib/rag/extract-features";
import { getDocumentCount } from "@/lib/documents-count";
import { DEMO_SUGGESTED_FEATURES } from "@/lib/demo-data";

export const maxDuration = 30;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * POST /api/features/extract
 * Returns cached features when possible. For new users (0 docs), returns demo data.
 * Only runs AI when cache miss.
 */
export async function POST() {
  try {
    const count = await getDocumentCount();

    // New users: return demo data (no tokens)
    if (count === 0) {
      return NextResponse.json({ suggestions: DEMO_SUGGESTED_FEATURES });
    }

    // Check cache
    const supabase = getSupabase();
    if (supabase) {
      const { data: cached } = await supabase
        .from("analysis_cache")
        .select("features_json")
        .eq("id", "default")
        .eq("document_count", count)
        .single();

      const features = cached?.features_json;
      if (Array.isArray(features) && features.length > 0) {
        return NextResponse.json({ suggestions: features });
      }
    }

    const documents = await fetchDocumentsForExtraction(50);
    if (documents.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const extracted = await extractFeaturesFromContent(documents);
    const withSignals = aggregateFeatureSignals(extracted, documents);

    const suggestions = withSignals.map((f, i) => ({
      id: `sug-${i + 1}`,
      feature: f.name,
      reach: f.reach,
      impact: f.impact,
      confidence: f.confidence,
      effort: f.effort,
      featureRequests: f.featureRequests ?? 0,
      supportTickets: f.supportTickets ?? 0,
      interviewMentions: f.interviewMentions ?? 0,
      reason: [
        f.featureRequests && `${f.featureRequests} feature requests`,
        f.supportTickets && `${f.supportTickets} support tickets`,
        f.interviewMentions && `${f.interviewMentions} interview mentions`,
      ]
        .filter(Boolean)
        .join(", "),
    }));

    // Persist to cache (preserve insights_json)
    if (supabase) {
      const { data: existing } = await supabase
        .from("analysis_cache")
        .select("insights_json")
        .eq("id", "default")
        .single();
      await supabase.from("analysis_cache").upsert(
        {
          id: "default",
          document_count: count,
          insights_json: (existing?.insights_json as object) ?? {},
          features_json: suggestions,
          created_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("Feature extraction error:", err);
    return NextResponse.json(
      { error: "Feature extraction failed", suggestions: [] },
      { status: 500 }
    );
  }
}
