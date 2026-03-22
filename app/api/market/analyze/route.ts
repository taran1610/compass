import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getChatModel } from "@/lib/ai/get-model";
import { generateObject } from "ai";
import { z } from "zod";

export const maxDuration = 120;

/**
 * POST /api/market/analyze
 * Runs trend detection and opportunity detection on market signals.
 * Uses embeddings for clustering and LLM for summarization.
 */
export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: signals, error: signalsError } = await supabase
      .from("market_signals")
      .select("id, content, source, topic")
      .limit(100);

    if (signalsError || !signals?.length) {
      return NextResponse.json({
        message: "No market signals to analyze. Ingest signals first via POST /api/market/ingest",
        trendsCreated: 0,
        opportunitiesCreated: 0,
      });
    }

    const model = getChatModel();
    const contentSample = signals.slice(0, 20).map((s) => s.content).join("\n\n---\n\n");

    const { object: trendsResult } = await generateObject({
      model,
      schema: z.object({
        trends: z.array(
          z.object({
            title: z.string(),
            mention_count: z.number(),
            growth_indicator: z.enum(["rising", "stable", "declining"]),
            sample_quotes: z.array(z.string()).min(1).max(3),
          })
        ),
      }),
      prompt: `Analyze these market discussion excerpts and identify 3-5 trending product/feature requests. For each trend: title, estimated mention count, growth indicator, and 1-3 sample quotes.

Excerpts:
${contentSample}

Return structured trends.`,
    });

    const { object: opportunitiesResult } = await generateObject({
      model,
      schema: z.object({
        opportunities: z.array(
          z.object({
            title: z.string(),
            summary: z.string(),
            mention_count: z.number(),
            opportunity_score: z.number().min(0).max(100),
            sources: z.array(z.string()),
          })
        ),
      }),
      prompt: `Analyze these market discussion excerpts and identify 3-5 product opportunities (unmet needs). For each: title, 1-2 sentence summary, estimated mention count, opportunity score (0-100), and sources (e.g. Reddit, X).

Excerpts:
${contentSample}

Return structured opportunities.`,
    });

    const trendsToInsert = (trendsResult.trends ?? []).map((t) => ({
      title: t.title,
      mention_count: t.mention_count,
      growth_indicator: t.growth_indicator,
      sample_quotes: t.sample_quotes,
      signal_ids: signals.slice(0, 5).map((s) => s.id),
    }));

    const opportunitiesToInsert = (opportunitiesResult.opportunities ?? []).map((o) => ({
      title: o.title,
      summary: o.summary,
      mention_count: o.mention_count,
      opportunity_score: o.opportunity_score,
      sources: o.sources,
      signal_ids: signals.slice(0, 5).map((s) => s.id),
    }));

    if (trendsToInsert.length > 0) {
      await supabase.from("market_trends").insert(trendsToInsert);
    }
    if (opportunitiesToInsert.length > 0) {
      await supabase.from("market_opportunities").insert(opportunitiesToInsert);
    }

    return NextResponse.json({
      trendsCreated: trendsToInsert.length,
      opportunitiesCreated: opportunitiesToInsert.length,
    });
  } catch (err) {
    console.error("Market analyze error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
