/**
 * AI Decision Engine
 * feature_impact_score, retention_risk, revenue_potential, confidence.
 */

import { createClient } from "@supabase/supabase-js";
import { getChatModel } from "./get-model";
import { generateObject } from "ai";
import { z } from "zod";

export type DecisionResult = {
  feature: string;
  featureImpactScore: number;
  retentionRisk: number;
  revenuePotential: number;
  confidence: number;
  demandSignals: {
    featureRequests: number;
    interviews: number;
    supportTickets: number;
  };
  estimatedImpact: {
    retentionImprovement: string;
    enterpriseAdoption: string;
  };
  effortEstimate: string;
  summary: string;
  radarMetrics: {
    impact: number;
    effort: number;
    demand: number;
    confidence: number;
    revenue: number;
  };
};

export async function simulateFeatureDecision(
  feature: string,
  documentContext?: string
): Promise<DecisionResult> {
  const model = getChatModel();
  const context = documentContext
    ? `\n\nDocument context:\n${documentContext.slice(0, 3000)}`
    : "";

  const { object } = await generateObject({
    model,
    schema: z.object({
      feature_impact_score: z.number().min(0).max(100),
      retention_risk: z.number().min(0).max(100),
      revenue_potential: z.number().min(0).max(100),
      confidence: z.number().min(0).max(100),
      demand_signals: z.object({
        feature_requests: z.number(),
        interviews: z.number(),
        support_tickets: z.number(),
      }),
      estimated_impact: z.object({
        retention_improvement: z.string(),
        enterprise_adoption: z.string(),
      }),
      effort_estimate: z.string(),
      summary: z.string(),
      radar_metrics: z.object({
        impact: z.number().min(0).max(100),
        effort: z.number().min(0).max(100),
        demand: z.number().min(0).max(100),
        confidence: z.number().min(0).max(100),
        revenue: z.number().min(0).max(100),
      }),
    }),
    prompt: `Analyze this feature idea for product decision: "${feature}"
${context}

Return feature_impact_score (0-100), retention_risk (0-100, higher = more risk if we don't build), revenue_potential (0-100), confidence (0-100), demand signals (counts), estimated impact (retention and enterprise adoption), effort estimate, summary, and radar metrics (all 0-100 for: impact, effort, demand, confidence, revenue).`,
  });

  return {
    feature,
    featureImpactScore: object.feature_impact_score ?? 0,
    retentionRisk: object.retention_risk ?? 0,
    revenuePotential: object.revenue_potential ?? 0,
    confidence: object.confidence ?? 0,
    demandSignals: {
      featureRequests: object.demand_signals?.feature_requests ?? 0,
      interviews: object.demand_signals?.interviews ?? 0,
      supportTickets: object.demand_signals?.support_tickets ?? 0,
    },
    estimatedImpact: {
      retentionImprovement: object.estimated_impact?.retention_improvement ?? "N/A",
      enterpriseAdoption: object.estimated_impact?.enterprise_adoption ?? "N/A",
    },
    effortEstimate: object.effort_estimate ?? "Unknown",
    summary: object.summary ?? "",
    radarMetrics: object.radar_metrics ?? {
      impact: 50,
      effort: 50,
      demand: 50,
      confidence: 50,
      revenue: 50,
    },
  };
}

export async function runDecisionSimulation(
  feature: string,
  workspaceId?: string
): Promise<DecisionResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let documentContext = "";
  if (supabaseUrl && supabaseKey) {
    const client = createClient(supabaseUrl, supabaseKey);
    const { data: docs } = await client
      .from("documents")
      .select("content")
      .limit(20);
    if (docs?.length) {
      documentContext = docs.map((d) => d.content).join("\n\n");
    }
  }

  return simulateFeatureDecision(feature, documentContext);
}
