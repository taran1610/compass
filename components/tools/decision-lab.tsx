"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FlaskConical,
  Sparkles,
  TrendingUp,
  Target,
  AlertTriangle,
  Zap,
  DollarSign,
  Shield,
} from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { DecisionImpactRadar } from "./decision-impact-radar";
import { cn } from "@/lib/utils";

type DecisionResult = {
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

export function DecisionLab() {
  const { hasUploadedData, pendingFeatureForPrioritization } = useWorkspace();
  const [featureInput, setFeatureInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecisionResult | null>(null);

  useEffect(() => {
    if (pendingFeatureForPrioritization?.feature) {
      setFeatureInput(pendingFeatureForPrioritization.feature);
    }
  }, [pendingFeatureForPrioritization]);

  const runSimulation = async () => {
    const feature = featureInput.trim();
    if (!feature) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/decision/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Simulation failed");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        feature,
        featureImpactScore: 65,
        retentionRisk: 45,
        revenuePotential: 55,
        confidence: 70,
        demandSignals: { featureRequests: 12, interviews: 4, supportTickets: 6 },
        estimatedImpact: { retentionImprovement: "+5%", enterpriseAdoption: "+10%" },
        effortEstimate: "4-6 weeks",
        summary: "Demo result. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY for AI analysis.",
        radarMetrics: { impact: 65, effort: 55, demand: 60, confidence: 70, revenue: 55 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Decision Lab</h2>
        <p className="text-sm text-muted-foreground">
          Simulate a feature before building. Get impact score, retention risk, revenue potential, and confidence.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Feature Simulation</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a feature idea. Compass analyzes your documents for demand signals.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. API Access, Dark Mode, Zapier Integration"
              value={featureInput}
              onChange={(e) => setFeatureInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSimulation()}
              className="flex-1"
            />
            <Button onClick={runSimulation} disabled={loading || !featureInput.trim()}>
              {loading ? (
                <span className="animate-pulse">Analyzing…</span>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Simulate
                </>
              )}
            </Button>
          </div>
          {!hasUploadedData && (
            <p className="text-xs text-amber-600">
              Upload documents for accurate demand signals. Using demo data for now.
            </p>
          )}
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">Analyzing product data…</span>
              </div>
              <Progress value={60} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Calculating impact, retention risk, revenue potential
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Simulation Results</h3>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 !mt-0">
                  <Target className="h-4 w-4" />
                  Impact & Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Impact: {result.featureImpactScore}</Badge>
                  <Badge variant="secondary">Confidence: {result.confidence}%</Badge>
                </div>
                <DecisionImpactRadar metrics={result.radarMetrics} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 !mt-0">
                  <Shield className="h-4 w-4" />
                  Retention Risk & Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Retention Risk (if we don&apos;t build)</p>
                  <Progress value={result.retentionRisk} className="h-2" />
                  <p className="text-xs mt-1">{result.retentionRisk}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Revenue Potential</p>
                  <Progress value={result.revenuePotential} className="h-2" />
                  <p className="text-xs mt-1">{result.revenuePotential}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Confidence</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={result.confidence} className="h-2 flex-1" />
                    <span className="text-sm font-medium">{result.confidence}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 !mt-0">
                  <TrendingUp className="h-4 w-4" />
                  Demand & Effort
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Feature requests</span>
                  <span className="font-mono font-medium">{result.demandSignals.featureRequests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Interview mentions</span>
                  <span className="font-mono font-medium">{result.demandSignals.interviews}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Support tickets</span>
                  <span className="font-mono font-medium">{result.demandSignals.supportTickets}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Retention improvement</span>
                  <span className="font-mono font-medium text-emerald-600">
                    {result.estimatedImpact.retentionImprovement}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Enterprise adoption</span>
                  <span className="font-mono font-medium text-emerald-600">
                    {result.estimatedImpact.enterpriseAdoption}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Effort estimate</span>
                  <span className="font-mono font-medium">{result.effortEstimate}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 !mt-0">
                <AlertTriangle className="h-4 w-4" />
                AI Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
