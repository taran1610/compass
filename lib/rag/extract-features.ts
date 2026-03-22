import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/get-model";
import { createClient } from "@supabase/supabase-js";

const ExtractedFeatureSchema = z.object({
  name: z.string().describe("Short feature/product request name"),
  reach: z.number().min(0).max(100).describe("Estimated reach 0-100"),
  impact: z.number().min(1).max(3).describe("Impact 1-3"),
  confidence: z.number().min(0).max(100).describe("Confidence 0-100"),
  effort: z.number().min(1).max(100).describe("Effort 1-100"),
});

const ExtractionSchema = z.object({
  features: z.array(ExtractedFeatureSchema),
});

export type ExtractedFeature = z.infer<typeof ExtractedFeatureSchema>;

/**
 * Fetch document chunks from Supabase for feature extraction.
 * Uses metadata.source_type to filter: interviews, feature-requests, support-tickets
 */
export async function fetchDocumentsForExtraction(limit = 20) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return [];

  const client = createClient(supabaseUrl, supabaseKey);
  const { data } = await client
    .from("documents")
    .select("id, content, metadata")
    .not("embedding", "is", null)
    .limit(limit);

  return (data ?? []).map((d) => ({
    id: d.id,
    content: d.content,
    sourceType: (d.metadata as Record<string, string>)?.source_type ?? "unknown",
    fileName: (d.metadata as Record<string, string>)?.file_name ?? "document",
  }));
}

/**
 * Use LLM to extract product/feature requests from document content.
 */
export async function extractFeaturesFromContent(
  documents: { id: number; content: string; sourceType: string; fileName: string }[]
): Promise<ExtractedFeature[]> {
  if (documents.length === 0) return [];

  const context = documents
    .map(
      (d) => `[Source: ${d.sourceType}, File: ${d.fileName}]\n${d.content.slice(0, 1200)}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are a product intelligence system. Analyze the following documents (customer interviews, feature requests, support tickets) and extract recurring product/feature requests.

For each distinct feature request you find:
- name: Short, actionable feature name (e.g. "Bulk CSV export", "Dark mode")
- reach: 0-100, how many users would benefit
- impact: 1-3, user value (3=high)
- confidence: 0-100, how sure you are about the estimates
- effort: 1-100, relative development effort

Deduplicate similar requests (e.g. "export to CSV" and "CSV export" → one "Bulk CSV export").
Return 5-15 features. Focus on the most frequently mentioned or highest-impact items.

Documents:
${context}`;

  const model = getChatModel();
  const { object } = await generateObject({
    model,
    schema: ExtractionSchema,
    prompt,
  });

  return object.features;
}

/**
 * Aggregate extracted features with mention counts per source type.
 */
export function aggregateFeatureSignals(
  extracted: ExtractedFeature[],
  documents: { id: number; content: string; sourceType: string }[]
): Array<ExtractedFeature & { featureRequests?: number; supportTickets?: number; interviewMentions?: number }> {
  // Simple aggregation: count how many docs of each type mention each feature (by name similarity)
  const result = extracted.map((f) => ({
    ...f,
    featureRequests: 0,
    supportTickets: 0,
    interviewMentions: 0,
  }));

  for (const doc of documents) {
    const contentLower = doc.content.toLowerCase();
    for (let i = 0; i < result.length; i++) {
      const nameLower = result[i].name.toLowerCase();
      if (contentLower.includes(nameLower) || nameLower.split(" ").some((w) => contentLower.includes(w))) {
        if (doc.sourceType === "feature-requests") result[i].featureRequests!++;
        else if (doc.sourceType === "support-tickets") result[i].supportTickets!++;
        else if (doc.sourceType === "interviews") result[i].interviewMentions!++;
      }
    }
  }

  return result;
}
