import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/get-model";
import { fetchDocumentsForExtraction } from "./extract-features";

const PainPointsSchema = z.object({
  pain_points: z.array(z.string()).describe("Recurring user pain points, frustrations, friction"),
});

const RetentionRisksSchema = z.object({
  retention_risks: z.array(
    z.object({
      risk: z.string().describe("Churn indicator or retention risk description"),
      severity: z.enum(["high", "medium", "low"]).describe("How likely this could cause churn"),
    })
  ).describe("Churn indicators, activation gaps, retention risks with severity"),
});

const FeatureDemandSchema = z.object({
  features: z.array(
    z.object({
      name: z.string(),
      mentions: z.number(),
      trend: z.enum(["up", "down", "neutral"]),
    })
  ),
});

const AIInsightsSchema = z.object({
  insights: z.array(z.string()).describe("2-4 natural language insights connecting patterns in the data"),
});

export type ChurnRisk = { risk: string; severity: "high" | "medium" | "low" };

export type ProductInsights = {
  painPoints: string[];
  retentionRisks: ChurnRisk[];
  featureDemand: { name: string; mentions: number; trend: "up" | "down" | "neutral" }[];
  aiInsights: string[];
};

export async function extractProductInsights(): Promise<ProductInsights> {
  const documents = await fetchDocumentsForExtraction(50);
  if (documents.length === 0) {
    return {
      painPoints: [],
      retentionRisks: [],
      featureDemand: [],
      aiInsights: [],
    };
  }

  const context = documents
    .map(
      (d) => `[Source: ${d.sourceType}, File: ${d.fileName}]\n${d.content.slice(0, 2000)}`
    )
    .join("\n\n---\n\n");

  const model = getChatModel();

  const [painRes, retentionRes, demandRes, aiRes] = await Promise.all([
    generateObject({
      model,
      schema: PainPointsSchema,
      prompt: `Analyze these product documents (interviews, feature requests, support tickets) and extract 3-6 recurring pain points or user frustrations. Be specific (e.g. "Onboarding is too long — users drop off at step 3").

Documents:\n${context}`,
    }),
    generateObject({
      model,
      schema: RetentionRisksSchema,
      prompt: `Analyze these product documents and identify 2-5 churn/retention risks. For each: risk description and severity (high=likely to cause churn soon, medium=moderate risk, low=early warning). Include activation gaps, friction points, and explicit churn indicators.

Documents:\n${context}`,
    }),
    generateObject({
      model,
      schema: FeatureDemandSchema,
      prompt: `Extract 5-8 feature/product requests from these documents. For each: name, estimated mention count, and trend (up/down/neutral based on sentiment).

Documents:\n${context}`,
    }),
    generateObject({
      model,
      schema: AIInsightsSchema,
      prompt: `Generate 2-4 natural language insights that connect patterns in this product data. Each insight should be 1-2 sentences, actionable, and cite evidence (e.g. "X is the top request across all sources. Y feature requests and Z support tickets suggest strong demand.").

Documents:\n${context}`,
    }),
  ]);

  const rawRisks = retentionRes.object.retention_risks ?? [];
  const retentionRisks: ChurnRisk[] = rawRisks.map((r) =>
    typeof r === "string" ? { risk: r, severity: "medium" as const } : r
  );

  return {
    painPoints: painRes.object.pain_points ?? [],
    retentionRisks,
    featureDemand: demandRes.object.features ?? [],
    aiInsights: aiRes.object.insights ?? [],
  };
}
