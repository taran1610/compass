"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, RefreshCw, FileText, Map, BarChart3, Share2 } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

type Opportunity = {
  id: string;
  title: string;
  problem?: string;
  signals_count: number;
  sources?: string[];
  competitor_gap?: string;
  opportunity_score: number;
  confidence: number;
};

export function OpportunityFeed() {
  const { setActiveTab, setPrdFeatureContext, setPendingFeatureForPrioritization } = useWorkspace();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchOpportunities = () => {
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((d) => setOpportunities(d.opportunities ?? []))
      .catch(() => setOpportunities([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/opportunities/analyze", { method: "POST" });
      const data = await res.json();
      if (data.opportunities) setOpportunities(data.opportunities);
    } finally {
      setAnalyzing(false);
      fetchOpportunities();
    }
  };

  const handleGeneratePRD = (title: string) => {
    setPrdFeatureContext(title);
    setActiveTab("prds");
  };

  const handleAddToRoadmap = (title: string) => {
    setPrdFeatureContext(title);
    setActiveTab("roadmap");
  };

  const handleSimulateImpact = (title: string) => {
    setPendingFeatureForPrioritization({
      id: `opp-${Date.now()}`,
      feature: title,
      reach: 60,
      impact: 2,
      confidence: 85,
      effort: 3,
    });
    setActiveTab("decision-lab");
  };

  const handleShare = (opp: Opportunity) => {
    const params = new URLSearchParams({
      title: opp.title,
      score: String(opp.opportunity_score.toFixed(1)),
      signals: String(opp.signals_count),
    });
    if (opp.problem) params.set("problem", opp.problem.slice(0, 200));
    window.open(`/api/opportunities/share?${params.toString()}`, "_blank", "width=620,height=420");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opportunity Feed</h1>
          <p className="text-muted-foreground mt-1">
            Detected opportunities from internal and external signals
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={runAnalysis} disabled={analyzing}>
          <RefreshCw className={cn("h-4 w-4 mr-1", analyzing && "animate-spin")} />
          {analyzing ? "Analyzing…" : "Run Analysis"}
        </Button>
      </div>

      {opportunities.length === 0 ? (
        <Card className="border-dashed border-[#6366F1]/20 bg-[#6366F1]/5">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#6366F1]/10">
              <Target className="h-6 w-6 text-[#6366F1]" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              We&apos;re building this for you
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mx-auto leading-relaxed">
              Our team is actively developing opportunity detection to surface high-impact ideas from your documents, market signals, and competitor gaps. We can&apos;t wait to show you what we&apos;re cooking up — your feedback will help us make it great.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/80">
              Thanks for being part of this journey. 💜
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{opp.title}</h3>
                  <Badge variant="default" className="shrink-0">
                    {opp.opportunity_score.toFixed(1)}
                  </Badge>
                </div>
                {opp.problem && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{opp.problem}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>{opp.signals_count} signals</span>
                  {opp.sources?.length ? (
                    <span>{opp.sources.join(", ")}</span>
                  ) : null}
                  {opp.competitor_gap && (
                    <span>Gap: {opp.competitor_gap}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleGeneratePRD(opp.title)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    PRD
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleAddToRoadmap(opp.title)}
                  >
                    <Map className="h-3 w-3 mr-1" />
                    Roadmap
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleSimulateImpact(opp.title)}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Simulate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleShare(opp)}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
