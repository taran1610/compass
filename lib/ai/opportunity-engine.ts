import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/get-model";
import { fetchDocumentsForExtraction } from "@/lib/rag/extract-features";
import { createClient } from "@supabase/supabase-js";

export type OpportunityInput = {
  title: string;
  problem: string;
  demandMentions: number;
  competitorGap: number;
  marketTrend: number;
  confidence: number;
};

const PAIN_POINTS_SCHEMA = z.object({
  pain_points: z.array(
    z.object({
      title: z.string(),
      problem: z.string(),
      mention_count: z.number(),
      sources: z.array(z.string()),
    })
  ),
});

/**
 * score = (demand_mentions * 0.4) + (competitor_gap * 0.3) + (market_trend * 0.2) + (confidence * 0.1)
 * All inputs normalized 0-100
 */
export function calculateOpportunityScore(input: OpportunityInput): number {
  const { demandMentions, competitorGap, marketTrend, confidence } = input;
  return (
    Math.min(100, demandMentions) * 0.4 +
    Math.min(100, competitorGap) * 0.3 +
    Math.min(100, marketTrend) * 0.2 +
    Math.min(100, confidence) * 0.1
  );
}

export async function extractPainPoints(): Promise<
  { title: string; problem: string; mentionCount: number; sources: string[] }[]
> {
  const documents = await fetchDocumentsForExtraction(50);
  if (documents.length === 0) return [];

  const context = documents
    .map(
      (d) => `[Source: ${d.sourceType}, File: ${d.fileName}]\n${d.content.slice(0, 2000)}`
    )
    .join("\n\n---\n\n");

  const model = getChatModel();
  const { object } = await generateObject({
    model,
    schema: PAIN_POINTS_SCHEMA,
    prompt: `Analyze these product documents and extract 5-10 pain points or unmet needs. For each: title (short), problem (1-2 sentences), estimated mention count, and sources (e.g. support-tickets, interviews).

Documents:
${context}`,
  });

  return (object.pain_points ?? []).map((p) => ({
    title: p.title,
    problem: p.problem,
    mentionCount: p.mention_count,
    sources: p.sources ?? [],
  }));
}

export function clusterMentions(
  painPoints: { title: string; problem: string; mentionCount: number; sources: string[] }[]
): { title: string; problem: string; signalsCount: number; sources: string[] }[] {
  const seen = new Map<string, { problem: string; signalsCount: number; sources: Set<string> }>();
  for (const p of painPoints) {
    const key = p.title.toLowerCase().trim();
    const existing = seen.get(key);
    if (existing) {
      existing.signalsCount += p.mentionCount;
      p.sources.forEach((s) => existing.sources.add(s));
    } else {
      seen.set(key, {
        problem: p.problem,
        signalsCount: p.mentionCount,
        sources: new Set(p.sources),
      });
    }
  }
  return Array.from(seen.entries()).map(([title, v]) => ({
    title,
    problem: v.problem,
    signalsCount: v.signalsCount,
    sources: Array.from(v.sources),
  }));
}

export async function generateOpportunityCard(opportunity: {
  title: string;
  problem: string;
  signalsCount: number;
  sources: string[];
  opportunityScore: number;
  confidence: number;
  competitorGap?: string;
}): Promise<string> {
  const model = getChatModel();
  const { object } = await generateObject({
    model,
    schema: z.object({ summary: z.string() }),
    prompt: `Generate a 1-2 sentence opportunity summary for: ${opportunity.title}. Problem: ${opportunity.problem}. Score: ${opportunity.opportunityScore.toFixed(1)}.`,
  });
  return object.summary ?? opportunity.problem;
}

export async function runOpportunityAnalysis(): Promise<
  {
    id: string;
    title: string;
    problem: string;
    signals_count: number;
    sources: string[];
    competitor_gap: string | null;
    opportunity_score: number;
    confidence: number;
  }[]
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const painPoints = await extractPainPoints();
  const clustered = clusterMentions(painPoints);

  const model = getChatModel();
  const { object: gaps } = await generateObject({
    model,
    schema: z.object({
      gaps: z.array(z.object({ topic: z.string(), gap: z.string(), score: z.number() })),
    }),
    prompt: `For these product themes, estimate competitor gap (0-100) and a brief gap description: ${clustered.map((c) => c.title).join(", ")}. Return one entry per theme.`,
  });

  const gapMap = new Map((gaps.gaps ?? []).map((g) => [g.topic.toLowerCase(), { gap: g.gap, score: g.score }]));

  const opportunities = clustered.map((c) => {
    const gapInfo = gapMap.get(c.title.toLowerCase()) ?? { gap: "Unknown", score: 50 };
    const demandMentions = Math.min(100, c.signalsCount * 5);
    const competitorGap = gapInfo.score;
    const marketTrend = 60;
    const confidence = Math.min(100, 50 + c.signalsCount * 3);
    const score = calculateOpportunityScore({
      title: c.title,
      problem: c.problem,
      demandMentions,
      competitorGap,
      marketTrend,
      confidence,
    });

    return {
      title: c.title,
      problem: c.problem,
      signals_count: c.signalsCount,
      sources: c.sources,
      competitor_gap: gapInfo.gap,
      opportunity_score: Math.round(score * 10) / 10,
      confidence,
    };
  });

  const sorted = opportunities.sort((a, b) => b.opportunity_score - a.opportunity_score).slice(0, 20);

  const client = createClient(supabaseUrl, supabaseKey);
  const { error: delErr } = await client.from("opportunities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) console.warn("Opportunities clear:", delErr);
  if (sorted.length > 0) {
    await client.from("opportunities").insert(
      sorted.map((o) => ({
        title: o.title,
        problem: o.problem,
        signals_count: o.signals_count,
        sources: o.sources,
        competitor_gap: o.competitor_gap,
        opportunity_score: o.opportunity_score,
        confidence: o.confidence,
      }))
    );
  }

  const { data } = await client.from("opportunities").select("*").order("opportunity_score", { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    problem: r.problem,
    signals_count: r.signals_count,
    sources: r.sources ?? [],
    competitor_gap: r.competitor_gap,
    opportunity_score: r.opportunity_score,
    confidence: r.confidence,
  }));
}
