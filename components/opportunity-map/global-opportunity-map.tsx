"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCw, FileText, Map, BarChart3 } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

type OpportunityCluster = {
  id: string;
  market: string;
  problem: string;
  signalVolume: number;
  competitorCoverage: string;
  opportunityScore: number;
  industry?: string;
};

export function GlobalOpportunityMap() {
  const { setActiveTab, setPrdFeatureContext, setPendingFeatureForPrioritization } = useWorkspace();
  const [clusters, setClusters] = useState<OpportunityCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppRes, marketRes] = await Promise.all([
        fetch("/api/opportunities"),
        fetch("/api/market"),
      ]);
      const oppData = await oppRes.json();
      const marketData = await marketRes.json();

      const opps = oppData.opportunities ?? [];
      const marketOpps = marketData.opportunities ?? [];

      const combined: OpportunityCluster[] = [
        ...opps.map((o: { id: string; title: string; problem?: string; signals_count: number; competitor_gap?: string; opportunity_score: number }) => ({
          id: `opp-${o.id}`,
          market: "Internal",
          problem: o.problem ?? o.title,
          signalVolume: o.signals_count ?? 0,
          competitorCoverage: o.competitor_gap ?? "Unknown",
          opportunityScore: o.opportunity_score ?? 0,
          industry: "Product",
        })),
        ...marketOpps.map((o: { id: string; title: string; summary?: string; mention_count: number; opportunity_score?: number; sources?: string[] }) => ({
          id: `mo-${o.id}`,
          market: (o.sources ?? ["Market"]).join(", "),
          problem: o.summary ?? o.title,
          signalVolume: o.mention_count ?? 0,
          competitorCoverage: "Market-wide",
          opportunityScore: o.opportunity_score ?? 0,
          industry: "SaaS",
        })),
      ];

      setClusters(combined.sort((a, b) => b.opportunityScore - a.opportunityScore));
    } catch {
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGeneratePRD = (title: string) => {
    setPrdFeatureContext(title);
    setActiveTab("prds");
  };

  const handleAddToRoadmap = (title: string) => {
    setPrdFeatureContext(title);
    setActiveTab("roadmap");
  };

  const handlePrioritize = (title: string) => {
    setPendingFeatureForPrioritization({
      id: `map-${Date.now()}`,
      feature: title,
      reach: 60,
      impact: 2,
      confidence: 85,
      effort: 3,
    });
    setActiveTab("decision-lab");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">This section is in development.</span> We&apos;re building the opportunity map to visualize clusters across industries and markets. Your feedback helps us prioritize what to build next.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Global Opportunity Map</h1>
          <p className="text-muted-foreground mt-1">
            Clusters of opportunities across industries and markets
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>

      {clusters.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <MapPin className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              Coming soon — we&apos;re building something special
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mx-auto leading-relaxed">
              Our team is crafting an opportunity detection feature that will surface high-impact ideas from your documents, market signals, and competitor gaps. We&apos;re excited to bring this to you soon.
            </p>
            <p className="mt-4 text-xs text-muted-foreground text-center">
              Thanks for your patience — your feedback helps us build the best product intelligence tool for you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clusters.map((c) => (
            <Card key={c.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {c.market}
                  </Badge>
                  <Badge variant="default">{c.opportunityScore.toFixed(1)}</Badge>
                </div>
                <h3 className="font-semibold mt-2">{c.problem.slice(0, 80)}{c.problem.length > 80 ? "…" : ""}</h3>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                  <span>{c.signalVolume} signals</span>
                  <span>•</span>
                  <span>{c.competitorCoverage}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleGeneratePRD(c.problem)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    PRD
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleAddToRoadmap(c.problem)}
                  >
                    <Map className="h-3 w-3 mr-1" />
                    Roadmap
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => handlePrioritize(c.problem)}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Prioritize
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
