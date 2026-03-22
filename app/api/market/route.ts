import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(getMockMarketData());
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [trendsRes, opportunitiesRes, insightsRes, competitorsRes] = await Promise.all([
      supabase.from("market_trends").select("*").order("mention_count", { ascending: false }).limit(10),
      supabase.from("market_opportunities").select("*").order("opportunity_score", { ascending: false }).limit(10),
      supabase.from("market_ai_insights").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("competitors").select("*, competitor_insights(*)").limit(10),
    ]);

    const trends = trendsRes.data ?? [];
    const opportunities = opportunitiesRes.data ?? [];
    const aiInsights = insightsRes.data ?? [];
    const competitors = competitorsRes.data ?? [];

    const competitorInsights = competitors.flatMap((c: { id: string; name: string; competitor_insights?: Array<{ insight_type: string; content: string; mention_count: number }> }) =>
      (c.competitor_insights ?? []).map((ci) => ({
        competitor: c.name,
        type: ci.insight_type,
        content: ci.content,
        mentionCount: ci.mention_count,
      }))
    );

    const mock = getMockMarketData();
    return NextResponse.json({
      trends: trends.length > 0 ? trends : mock.trends,
      opportunities: opportunities.length > 0 ? opportunities : mock.opportunities,
      aiInsights: aiInsights.length > 0 ? aiInsights : mock.aiInsights,
      competitors: competitors.length > 0 ? competitors : mock.competitors,
      competitorInsights: competitorInsights.length > 0 ? competitorInsights : mock.competitorInsights,
    });
  } catch (err) {
    console.error("Market data fetch error:", err);
    return NextResponse.json(getMockMarketData());
  }
}

function getMockMarketData() {
  return {
    trends: [
      { id: "1", title: "Local AI Models", mention_count: 142, growth_indicator: "rising", sample_quotes: ["I need offline AI for privacy", "Local models are the future"] },
      { id: "2", title: "Better Debugging Tools", mention_count: 98, growth_indicator: "rising", sample_quotes: ["AI can generate but can't debug", "Debugging is the bottleneck"] },
      { id: "3", title: "Faster Generation", mention_count: 87, growth_indicator: "stable", sample_quotes: ["Response time matters", "Streaming helps but still slow"] },
      { id: "4", title: "API Access", mention_count: 76, growth_indicator: "rising", sample_quotes: ["Need to integrate with our stack", "API is table stakes"] },
      { id: "5", title: "Multi-tenant Support", mention_count: 54, growth_indicator: "stable", sample_quotes: ["Enterprise needs isolation", "Team workspaces"] },
    ],
    opportunities: [
      { id: "1", title: "AI Debugging Assistant", summary: "Developers want AI tools that can debug code, not just generate it.", mention_count: 120, opportunity_score: 86, sources: ["Reddit", "X"] },
      { id: "2", title: "Local-First AI IDE", summary: "Privacy-conscious developers demand local model support with no data leaving the machine.", mention_count: 95, opportunity_score: 82, sources: ["Reddit", "Product Reviews"] },
      { id: "3", title: "AI Code Review Automation", summary: "Automated PR reviews with context-aware suggestions are highly requested.", mention_count: 78, opportunity_score: 79, sources: ["X", "Startup Forums"] },
      { id: "4", title: "Real-time Collaboration", summary: "Pair programming with AI that understands multiple cursors and live edits.", mention_count: 62, opportunity_score: 74, sources: ["Reddit", "Community"] },
      { id: "5", title: "Custom Model Fine-tuning", summary: "Developers want to fine-tune models on their codebase for better suggestions.", mention_count: 51, opportunity_score: 71, sources: ["X", "Product Reviews"] },
    ],
    aiInsights: [
      { id: "1", insight: "Developers increasingly demand local AI model support due to privacy concerns and regulatory requirements.", category: "trend" },
      { id: "2", insight: "AI coding tools are criticized for generating code that fails at runtime; debugging is the main pain point.", category: "opportunity" },
      { id: "3", insight: "API access and integration capabilities are table stakes for enterprise adoption of AI dev tools.", category: "trend" },
      { id: "4", insight: "Jira and Linear users frequently request AI-powered prioritization and automated roadmap generation.", category: "competitor" },
    ],
    competitors: [
      { id: "1", name: "Linear", competitor_insights: [] },
      { id: "2", name: "Jira", competitor_insights: [{ insight_type: "complaint", content: "Complex interface", mention_count: 45 }, { insight_type: "feature_gap", content: "AI prioritization", mention_count: 32 }] },
      { id: "3", name: "Productboard", competitor_insights: [{ insight_type: "complaint", content: "Slow workflows", mention_count: 28 }, { insight_type: "missing_capability", content: "Automated roadmap generation", mention_count: 24 }] },
    ],
    competitorInsights: [
      { competitor: "Jira", type: "complaint", content: "Complex interface", mentionCount: 45 },
      { competitor: "Jira", type: "feature_gap", content: "AI prioritization", mentionCount: 32 },
      { competitor: "Productboard", type: "complaint", content: "Slow workflows", mentionCount: 28 },
      { competitor: "Productboard", type: "missing_capability", content: "Automated roadmap generation", mentionCount: 24 },
    ],
  };
}
