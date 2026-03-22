"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe,
  TrendingUp,
  Target,
  Building2,
  Sparkles,
  ArrowUpRight,
  Zap,
  Plus,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

type MarketTrend = {
  id: string;
  title: string;
  mention_count: number;
  growth_indicator?: "rising" | "stable" | "declining";
  sample_quotes?: string[];
};

type MarketOpportunity = {
  id: string;
  title: string;
  summary?: string;
  mention_count: number;
  opportunity_score?: number;
  sources?: string[];
};

type AIInsight = {
  id: string;
  insight: string;
  category?: string;
};

type CompetitorInsight = {
  competitor: string;
  type: string;
  content: string;
  mentionCount: number;
};

type MarketData = {
  trends: MarketTrend[];
  opportunities: MarketOpportunity[];
  aiInsights: AIInsight[];
  competitorInsights: CompetitorInsight[];
  competitors: { id: string; name: string }[];
};

export function MarketInsightsDashboard() {
  const { hasUploadedData, setActiveTab, setPendingFeatureForPrioritization } = useWorkspace();
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [advancedData, setAdvancedData] = useState<{
    trendClusters?: { title: string; mentionCount: number; growthIndicator: string; sampleQuotes: string[] }[];
    emergingProblems?: { problem: string; severity: string; mentionCount: number; suggestedSolution?: string }[];
    startupOpportunities?: { title: string; summary: string; marketSize: string; validationScore: number }[];
  } | null>(null);
  const [advancedLoading, setAdvancedLoading] = useState(false);

  useEffect(() => {
    fetch("/api/market")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const SAMPLE_SIGNALS = [
    { source: "reddit" as const, content: "I really wish AI coding tools could debug my code, not just generate it. When something breaks I have to manually trace through.", topic: "AI debugging" },
    { source: "reddit" as const, content: "Local AI models are the future. I don't want my code leaving my machine for privacy reasons.", topic: "Local AI" },
    { source: "x" as const, content: "The biggest gap in AI dev tools: they generate fast but debugging is still manual. Someone fix this.", topic: "AI debugging" },
    { source: "product_reviews" as const, content: "Great for generation but we need API access to integrate with our CI/CD pipeline.", topic: "API access" },
    { source: "startup_forum" as const, content: "Developers are increasingly demanding local model support. Privacy and compliance are driving this.", topic: "Local AI" },
    { source: "reddit" as const, content: "Jira is so complex. We switched to Linear but still miss some features. AI prioritization would be huge.", topic: "Project management" },
    { source: "x" as const, content: "Productboard is slow. Automated roadmap generation from user feedback would save us hours.", topic: "Roadmap" },
    { source: "community" as const, content: "Real-time collaboration with AI that understands multiple cursors would be a game changer for pair programming.", topic: "Collaboration" },
    { source: "reddit" as const, content: "Custom model fine-tuning on our codebase would make suggestions 10x better. Right now it's generic.", topic: "Fine-tuning" },
    { source: "product_reviews" as const, content: "Response time matters. Streaming helps but generation is still too slow for iterative workflows.", topic: "Performance" },
  ];

  const seedDemoData = async () => {
    setSeeding(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/market/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals: SAMPLE_SIGNALS }),
      });
      const result = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: result.error || "Seed failed" });
        return;
      }
      setFeedback({ type: "success", message: `Seeded ${result.inserted} signals. Now click Run Analysis.` });
    } catch (err) {
      setFeedback({ type: "error", message: "Seed failed. Check Supabase and OPENAI_API_KEY." });
    } finally {
      setSeeding(false);
    }
  };

  const runAdvancedAnalysis = async () => {
    setAdvancedLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/market/analyze-advanced", { method: "POST" });
      const result = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: result.error || "Advanced analysis failed" });
        return;
      }
      setAdvancedData(result);
      setFeedback({
        type: "success",
        message: `Found ${result.trendClusters?.length ?? 0} clusters, ${result.emergingProblems?.length ?? 0} problems, ${result.startupOpportunities?.length ?? 0} startup opportunities.`,
      });
    } catch {
      setFeedback({ type: "error", message: "Advanced analysis failed." });
    } finally {
      setAdvancedLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/market/analyze", { method: "POST" });
      const result = await res.json();
      if (!res.ok) {
        setFeedback({ type: "error", message: result.error || "Analysis failed" });
        return;
      }
      if (result.trendsCreated === 0 && result.opportunitiesCreated === 0) {
        setFeedback({
          type: "error",
          message: result.message || "No signals to analyze. Click Seed demo data first.",
        });
        return;
      }
      setFeedback({
        type: "success",
        message: `Found ${result.trendsCreated} trends and ${result.opportunitiesCreated} opportunities.`,
      });
      const updated = await fetch("/api/market").then((r) => r.json());
      setData(updated);
    } catch (err) {
      setFeedback({ type: "error", message: "Analysis failed. Check OPENAI_API_KEY or ANTHROPIC_API_KEY." });
    } finally {
      setAnalyzing(false);
    }
  };

  const addCompetitor = async () => {
    if (!newCompetitor.trim()) return;
    try {
      const res = await fetch("/api/market/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompetitor.trim() }),
      });
      if (res.ok) {
        setNewCompetitor("");
        const updated = await fetch("/api/market").then((r) => r.json());
        setData(updated);
      }
    } catch {
      // Fallback: add to local state for demo
      if (data) {
        setData({
          ...data,
          competitors: [...data.competitors, { id: `new-${Date.now()}`, name: newCompetitor.trim() }],
        });
        setNewCompetitor("");
      }
    }
  };

  const handleAddToPrioritization = (title: string) => {
    setPendingFeatureForPrioritization({
      id: `market-${Date.now()}`,
      feature: title,
      reach: 60,
      impact: 2,
      confidence: 85,
      effort: 3,
    });
    setActiveTab("prioritization");
  };

  const complaintsByCompetitor = (data?.competitorInsights ?? []).reduce(
    (acc, ci) => {
      if (ci.type === "complaint") {
        if (!acc[ci.competitor]) acc[ci.competitor] = [];
        acc[ci.competitor].push(ci);
      }
      return acc;
    },
    {} as Record<string, CompetitorInsight[]>
  );

  const gapsByCompetitor = (data?.competitorInsights ?? []).reduce(
    (acc, ci) => {
      if (ci.type === "feature_gap" || ci.type === "missing_capability") {
        if (!acc[ci.competitor]) acc[ci.competitor] = [];
        acc[ci.competitor].push(ci);
      }
      return acc;
    },
    {} as Record<string, CompetitorInsight[]>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  const trends = data?.trends ?? [];
  const opportunities = data?.opportunities ?? [];
  const aiInsights = data?.aiInsights ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Market Insights</h1>
        </div>
        <div className="flex flex-col gap-2 mt-1">
          <p className="text-muted-foreground">
            External market signals from Reddit, X, product reviews, and community discussions
          </p>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 mt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">We&apos;re building something special here.</span> Market Insights is in active development — we&apos;re connecting your product data with what people are saying across the web. Your early feedback shapes what we build next. Try it out, and let us know what would make this even more useful for you.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={seedDemoData}
              disabled={seeding}
            >
              {seeding ? "Seeding…" : "Seed demo data"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runAnalysis}
              disabled={analyzing}
            >
              {analyzing ? "Analyzing…" : "Run Analysis"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runAdvancedAnalysis}
              disabled={advancedLoading}
            >
              {advancedLoading ? "Analyzing…" : "Advanced Analysis"}
            </Button>
          </div>
          {feedback && (
            <p
              className={cn(
                "text-sm",
                feedback.type === "success" ? "text-emerald-600" : "text-destructive"
              )}
            >
              {feedback.message}
            </p>
          )}
        </div>
      </div>

      {/* High Confidence CTA - Integration with internal data */}
      {hasUploadedData && (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">High Confidence Opportunities</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Trends that appear in both your internal data and market signals are highlighted in the opportunities below.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid: 2 columns on large screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trending Product Requests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending Product Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trends.slice(0, 6).map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium truncate block">{t.title}</span>
                    {t.sample_quotes?.[0] && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">&quot;{t.sample_quotes[0]}&quot;</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.mention_count}
                    </Badge>
                    {t.growth_indicator === "rising" && (
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Market Opportunities */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top Market Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {opportunities.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-sm">{o.title}</span>
                      {o.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{o.summary}</p>
                      )}
                      <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                        <span>{o.mention_count} mentions</span>
                        {o.sources?.length && <span>{o.sources.join(", ")}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {o.opportunity_score != null && (
                        <Badge variant="default" className="text-[10px]">
                          {o.opportunity_score}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1"
                        onClick={() => handleAddToPrioritization(o.title)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Competitor Intelligence */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Competitor Feature Gaps
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add competitor (e.g. Jira)"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={addCompetitor}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.competitors ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">Add competitors to track feature gaps and complaints.</p>
              ) : (
                (data?.competitors ?? []).map((c) => (
                  <div key={c.id} className="rounded-lg border p-3">
                    <span className="font-medium text-sm">{c.name}</span>
                    <div className="mt-2 space-y-1.5">
                      {(complaintsByCompetitor[c.name] ?? []).length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase">Complaints</p>
                          <ul className="mt-0.5 space-y-0.5 text-xs">
                            {(complaintsByCompetitor[c.name] ?? []).map((ci, i) => (
                              <li key={i} className="flex justify-between">
                                <span>{ci.content}</span>
                                <Badge variant="outline" className="text-[10px]">{ci.mentionCount}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(gapsByCompetitor[c.name] ?? []).length > 0 && (
                        <div>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase">Feature Gaps</p>
                          <ul className="mt-0.5 space-y-0.5 text-xs">
                            {(gapsByCompetitor[c.name] ?? []).map((ci, i) => (
                              <li key={i} className="flex justify-between">
                                <span>{ci.content}</span>
                                <Badge variant="outline" className="text-[10px]">{ci.mentionCount}</Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!(complaintsByCompetitor[c.name]?.length) && !(gapsByCompetitor[c.name]?.length) && (
                        <p className="text-xs text-muted-foreground">No insights yet</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights Panel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Market Insights
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Natural language insights from market signal analysis
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiInsights.slice(0, 5).map((insight) => (
                <div
                  key={insight.id}
                  className="flex gap-2 rounded-lg border-l-4 border-l-primary/50 bg-muted/20 pl-3 py-2"
                >
                  <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{insight.insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced: Trend Clusters, Emerging Problems, Startup Opportunities */}
      {advancedData && (
        <div className="grid gap-6 lg:grid-cols-3">
          {advancedData.trendClusters && advancedData.trendClusters.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Trend Clusters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {advancedData.trendClusters.map((c, i) => (
                    <div key={i} className="rounded-lg border p-2 text-sm">
                      <span className="font-medium">{c.title}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.sampleQuotes?.[0]}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">{c.mentionCount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {advancedData.emergingProblems && advancedData.emergingProblems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Emerging Problems</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {advancedData.emergingProblems.map((p, i) => (
                    <div key={i} className="rounded-lg border p-2 text-sm">
                      <span className="font-medium">{p.problem}</span>
                      <Badge variant="outline" className="text-[10px] ml-1">{p.severity}</Badge>
                      {p.suggestedSolution && (
                        <p className="text-xs text-muted-foreground mt-0.5">→ {p.suggestedSolution}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {advancedData.startupOpportunities && advancedData.startupOpportunities.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Startup Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {advancedData.startupOpportunities.map((o, i) => (
                    <div key={i} className="rounded-lg border p-2 text-sm">
                      <span className="font-medium">{o.title}</span>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{o.summary}</p>
                      <Badge variant="default" className="text-[10px] mt-1">{o.validationScore}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Emerging Trends - Full width */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Emerging Trends
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Clustered themes from market discussions with sample quotes
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trends.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{t.title}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {t.mention_count} mentions
                    </Badge>
                    {t.growth_indicator === "rising" && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/50">
                        Rising
                      </Badge>
                    )}
                  </div>
                </div>
                {t.sample_quotes && t.sample_quotes.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground italic line-clamp-2">
                    &quot;{t.sample_quotes[0]}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
