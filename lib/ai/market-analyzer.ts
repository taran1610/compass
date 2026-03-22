/**
 * Market Signal Intelligence
 * Trend clusters, emerging problems, startup opportunities.
 */

import { createClient } from "@supabase/supabase-js";
import { getChatModel } from "./get-model";
import { generateObject } from "ai";
import { z } from "zod";

export type TrendCluster = {
  title: string;
  mentionCount: number;
  growthIndicator: "rising" | "stable" | "declining";
  sampleQuotes: string[];
  topics: string[];
};

export type EmergingProblem = {
  problem: string;
  severity: "high" | "medium" | "low";
  mentionCount: number;
  suggestedSolution?: string;
};

export type StartupOpportunity = {
  title: string;
  summary: string;
  marketSize: string;
  validationScore: number;
  sources: string[];
};

export async function analyzeTrendClusters(
  signals: { content: string; source: string; topic?: string }[]
): Promise<TrendCluster[]> {
  if (signals.length === 0) return [];
  const model = getChatModel();
  const contentSample = signals.slice(0, 40).map((s) => s.content).join("\n\n---\n\n");

  const { object } = await generateObject({
    model,
    schema: z.object({
      clusters: z.array(
        z.object({
          title: z.string(),
          mention_count: z.number(),
          growth_indicator: z.enum(["rising", "stable", "declining"]),
          sample_quotes: z.array(z.string()).min(1).max(3),
          topics: z.array(z.string()).min(1).max(3),
        })
      ),
    }),
    prompt: `Analyze these market discussion excerpts and identify 3-5 trend clusters. For each: title, estimated mention count, growth indicator, sample quotes, and topics.

Excerpts:
${contentSample}

Return structured trend clusters.`,
  });

  return (object.clusters ?? []).map((c) => ({
    title: c.title,
    mentionCount: c.mention_count,
    growthIndicator: c.growth_indicator,
    sampleQuotes: c.sample_quotes,
    topics: c.topics,
  }));
}

export async function detectEmergingProblems(
  signals: { content: string }[]
): Promise<EmergingProblem[]> {
  if (signals.length === 0) return [];
  const model = getChatModel();
  const contentSample = signals.slice(0, 30).map((s) => s.content).join("\n\n---\n\n");

  const { object } = await generateObject({
    model,
    schema: z.object({
      problems: z.array(
        z.object({
          problem: z.string(),
          severity: z.enum(["high", "medium", "low"]),
          mention_count: z.number(),
          suggested_solution: z.string().optional(),
        })
      ),
    }),
    prompt: `Analyze these market signals and identify 3-5 emerging problems or pain points. For each: problem description, severity, estimated mention count, optional suggested solution.

Excerpts:
${contentSample}

Return structured emerging problems.`,
  });

  return (object.problems ?? []).map((p) => ({
    problem: p.problem,
    severity: p.severity,
    mentionCount: p.mention_count,
    suggestedSolution: p.suggested_solution,
  }));
}

export async function findStartupOpportunities(
  signals: { content: string; source: string }[]
): Promise<StartupOpportunity[]> {
  if (signals.length === 0) return [];
  const model = getChatModel();
  const contentSample = signals.slice(0, 30).map((s) => s.content).join("\n\n---\n\n");

  const { object } = await generateObject({
    model,
    schema: z.object({
      opportunities: z.array(
        z.object({
          title: z.string(),
          summary: z.string(),
          market_size: z.string(),
          validation_score: z.number().min(0).max(100),
          sources: z.array(z.string()),
        })
      ),
    }),
    prompt: `Analyze these market signals and identify 3-5 startup opportunities (unmet needs with clear demand). For each: title, summary, market size estimate, validation score (0-100), sources.

Excerpts:
${contentSample}

Return structured startup opportunities.`,
  });

  return (object.opportunities ?? []).map((o) => ({
    title: o.title,
    summary: o.summary,
    marketSize: o.market_size,
    validationScore: o.validation_score,
    sources: o.sources,
  }));
}

export async function runMarketAnalysis(): Promise<{
  trendClusters: TrendCluster[];
  emergingProblems: EmergingProblem[];
  startupOpportunities: StartupOpportunity[];
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { trendClusters: [], emergingProblems: [], startupOpportunities: [] };
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const { data: signals } = await client
    .from("market_signals")
    .select("content, source, topic")
    .limit(80);

  const sigs = signals ?? [];

  const [trendClusters, emergingProblems, startupOpportunities] = await Promise.all([
    analyzeTrendClusters(sigs),
    detectEmergingProblems(sigs),
    findStartupOpportunities(sigs),
  ]);

  return { trendClusters, emergingProblems, startupOpportunities };
}
