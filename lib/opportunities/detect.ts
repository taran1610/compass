import { createClient } from "@supabase/supabase-js";
import {
  fetchDocumentsForExtraction,
  extractFeaturesFromContent,
  aggregateFeatureSignals,
} from "@/lib/rag/extract-features";
import { getEmbeddings } from "@/lib/rag/embeddings";

export type DetectedOpportunity = {
  title: string;
  feature_requests: number;
  support_tickets: number;
  interview_mentions: number;
  reddit_mentions: number;
  x_mentions: number;
  product_review_mentions: number;
  competitor_missing: boolean;
  competitor_names: string[];
  priority: "high" | "medium" | "low";
  confidence: number;
};

function computePriorityAndConfidence(opp: Omit<DetectedOpportunity, "priority" | "confidence">): {
  priority: "high" | "medium" | "low";
  confidence: number;
} {
  const totalInternal =
    opp.feature_requests + opp.support_tickets + opp.interview_mentions;
  const totalExternal =
    opp.reddit_mentions + opp.x_mentions + opp.product_review_mentions;
  const totalSignals = totalInternal + totalExternal + (opp.competitor_missing ? 5 : 0);

  let priority: "high" | "medium" | "low" = "low";
  if (totalSignals >= 20 || (opp.competitor_missing && totalSignals >= 5)) {
    priority = "high";
  } else if (totalSignals >= 8 || opp.competitor_missing) {
    priority = "medium";
  }

  const sourceWeight =
    totalInternal * 1.2 + totalExternal * 0.8 + (opp.competitor_missing ? 15 : 0);
  const confidence = Math.min(
    95,
    Math.round(40 + Math.log2(sourceWeight + 1) * 12)
  );

  return { priority, confidence };
}

export async function detectOpportunities(
  workspaceId?: string | null
): Promise<DetectedOpportunity[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const embeddings = getEmbeddings();

  const documents = await fetchDocumentsForExtraction(50);
  if (documents.length === 0) {
    return [];
  }

  const extracted = await extractFeaturesFromContent(documents);
  const withSignals = aggregateFeatureSignals(extracted, documents);

  const opportunities: DetectedOpportunity[] = [];

  for (const f of withSignals) {
    const featureRequests = f.featureRequests ?? 0;
    const supportTickets = f.supportTickets ?? 0;
    const interviewMentions = f.interviewMentions ?? 0;

    let redditMentions = 0;
    let xMentions = 0;
    let productReviewMentions = 0;
    let competitorMissing = false;
    const competitorNames: string[] = [];

    try {
      const queryEmbedding = await embeddings.embedQuery(
        `${f.name} feature request user want`
      );
      const { data: marketMatches } = await supabase.rpc("match_market_signals", {
        query_embedding: queryEmbedding,
        match_count: 15,
        filter_source: null,
      });

      if (marketMatches && Array.isArray(marketMatches)) {
        for (const m of marketMatches as { source: string }[]) {
          if (m.source === "reddit") redditMentions++;
          else if (m.source === "x") xMentions++;
          else if (m.source === "product_reviews") productReviewMentions++;
        }
      }
    } catch {
      // Market search optional
    }

    const { data: competitors } = await supabase
      .from("competitors")
      .select("id, name");
    const { data: insights } = await supabase
      .from("competitor_insights")
      .select("competitor_id, content, insight_type");

    if (insights && competitors) {
      const searchTerms = f.name.toLowerCase().split(/\s+/);
      for (const ci of insights as { competitor_id: string; content: string; insight_type: string }[]) {
        const content = ci.content.toLowerCase();
        const matches = searchTerms.some((t) => t.length > 2 && content.includes(t));
        if (matches && (ci.insight_type === "feature_gap" || ci.insight_type === "missing_capability")) {
          competitorMissing = true;
          const comp = competitors.find((c: { id: string }) => c.id === ci.competitor_id);
          if (comp && !competitorNames.includes((comp as { name: string }).name)) {
            competitorNames.push((comp as { name: string }).name);
          }
        }
      }
    }

    const base = {
      title: f.name,
      feature_requests: featureRequests,
      support_tickets: supportTickets,
      interview_mentions: interviewMentions,
      reddit_mentions: redditMentions,
      x_mentions: xMentions,
      product_review_mentions: productReviewMentions,
      competitor_missing: competitorMissing,
      competitor_names: competitorNames,
    };

    const { priority, confidence } = computePriorityAndConfidence(base);
    opportunities.push({ ...base, priority, confidence });
  }

  opportunities.sort((a, b) => {
    const scoreA =
      a.feature_requests +
      a.support_tickets +
      a.interview_mentions +
      a.reddit_mentions +
      a.x_mentions +
      (a.competitor_missing ? 5 : 0);
    const scoreB =
      b.feature_requests +
      b.support_tickets +
      b.interview_mentions +
      b.reddit_mentions +
      b.x_mentions +
      (b.competitor_missing ? 5 : 0);
    return scoreB - scoreA;
  });

  return opportunities.slice(0, 15);
}
