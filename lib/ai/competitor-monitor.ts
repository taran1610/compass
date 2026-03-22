/**
 * AI Competitor Intelligence
 * Tracks competitors, feature gaps, updates, and risk alerts.
 */

import { createClient } from "@supabase/supabase-js";
import { getChatModel } from "./get-model";
import { generateObject } from "ai";
import { z } from "zod";

export type CompetitorUpdate = {
  competitorId: string;
  competitorName: string;
  type: "new_feature" | "pricing_change" | "acquisition" | "release";
  title: string;
  description: string;
  source?: string;
};

export type FeatureGap = {
  competitorId: string;
  competitorName: string;
  gap: string;
  severity: "high" | "medium" | "low";
  mentionCount: number;
};

export type RiskAlert = {
  competitorId: string;
  competitorName: string;
  risk: string;
  impact: "high" | "medium" | "low";
};

export async function analyzeCompetitorGaps(
  competitorIds: string[],
  signals: { content: string; source: string }[]
): Promise<FeatureGap[]> {
  if (signals.length === 0) return [];
  const model = getChatModel();
  const contentSample = signals.slice(0, 30).map((s) => s.content).join("\n\n---\n\n");

  const { object } = await generateObject({
    model,
    schema: z.object({
      gaps: z.array(
        z.object({
          competitor_name: z.string(),
          gap: z.string(),
          severity: z.enum(["high", "medium", "low"]),
          mention_count: z.number(),
        })
      ),
    }),
    prompt: `Analyze these market signals and identify feature gaps or missing capabilities for competitors.

Signals:
${contentSample}

Return structured feature gaps. Map competitor names from the signals (e.g. Jira, Linear, Productboard).`,
  });

  return (object.gaps ?? []).map((g) => ({
    competitorId: "",
    competitorName: g.competitor_name,
    gap: g.gap,
    severity: g.severity,
    mentionCount: g.mention_count,
  }));
}

export async function generateRiskAlerts(
  competitors: { id: string; name: string }[],
  signals: { content: string }[]
): Promise<RiskAlert[]> {
  if (signals.length === 0 || competitors.length === 0) return [];
  const model = getChatModel();
  const contentSample = signals.slice(0, 20).map((s) => s.content).join("\n\n---\n\n");

  const { object } = await generateObject({
    model,
    schema: z.object({
      alerts: z.array(
        z.object({
          competitor_name: z.string(),
          risk: z.string(),
          impact: z.enum(["high", "medium", "low"]),
        })
      ),
    }),
    prompt: `Analyze these market signals for competitive risks or threats to our product.

Signals:
${contentSample}

Return structured risk alerts.`,
  });

  const alerts = object.alerts ?? [];
  return alerts.map((a) => {
    const comp = competitors.find((c) => c.name.toLowerCase().includes(a.competitor_name.toLowerCase()));
    return {
      competitorId: comp?.id ?? "",
      competitorName: a.competitor_name,
      risk: a.risk,
      impact: a.impact,
    };
  });
}

export async function runCompetitorScan(): Promise<{
  gaps: FeatureGap[];
  alerts: RiskAlert[];
}> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return { gaps: [], alerts: [] };

  const client = createClient(supabaseUrl, supabaseKey);
  const [compRes, sigRes] = await Promise.all([
    client.from("competitors").select("id, name"),
    client.from("market_signals").select("content, source").limit(50),
  ]);

  const competitors = compRes.data ?? [];
  const signals = (sigRes.data ?? []).map((s) => ({ content: s.content, source: s.source ?? "unknown" }));

  const [gaps, alerts] = await Promise.all([
    analyzeCompetitorGaps(competitors.map((c) => c.id), signals),
    generateRiskAlerts(competitors, signals),
  ]);

  for (const g of gaps) {
    const comp = competitors.find((c) => c.name.toLowerCase().includes(g.competitorName.toLowerCase()));
    if (comp) g.competitorId = comp.id;
  }

  return { gaps, alerts };
}
