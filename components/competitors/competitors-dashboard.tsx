"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  RefreshCw,
  Plus,
  AlertTriangle,
  Zap,
  FileText,
  Map,
} from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

type Competitor = { id: string; name: string };
type FeatureGap = { competitorName: string; gap: string; severity: string; mentionCount: number };
type RiskAlert = { competitorName: string; risk: string; impact: string };

export function CompetitorsDashboard() {
  const { setActiveTab, setPrdFeatureContext } = useWorkspace();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [gaps, setGaps] = useState<FeatureGap[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/market/competitors").then((r) => r.json()),
    ])
      .then(([compRes]) => {
        setCompetitors(compRes.competitors ?? []);
      })
      .catch(() => setCompetitors([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/competitors/scan", { method: "POST" });
      const data = await res.json();
      setGaps(data.gaps ?? []);
      setAlerts(data.alerts ?? []);
    } catch {
      setGaps([]);
      setAlerts([]);
    } finally {
      setScanning(false);
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
        fetchData();
      }
    } catch {
      setCompetitors([...competitors, { id: `new-${Date.now()}`, name: newCompetitor.trim() }]);
      setNewCompetitor("");
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">This section is in development.</span> We&apos;re building competitor tracking, feature gap analysis, and risk alerts. Your feedback helps us prioritize what to build next.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Competitor Intelligence</h1>
          <p className="text-muted-foreground mt-1">
            Track competitors, feature gaps, and risk alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={runScan} disabled={scanning}>
            <RefreshCw className={cn("h-4 w-4 mr-1", scanning && "animate-spin")} />
            {scanning ? "Scanning…" : "Run Scan"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add competitor (e.g. Jira, Linear)"
          value={newCompetitor}
          onChange={(e) => setNewCompetitor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
          className="max-w-xs"
        />
        <Button size="sm" variant="outline" onClick={addCompetitor}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Competitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {competitors.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add competitors to track</p>
              ) : (
                competitors.map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-sm">
                    {c.name}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Run scan to detect risks</p>
              ) : (
                alerts.slice(0, 5).map((a, i) => (
                  <div key={i} className="rounded-lg border p-2 text-sm">
                    <span className="font-medium">{a.competitorName}</span>: {a.risk}
                    <Badge variant={a.impact === "high" ? "destructive" : "secondary"} className="ml-2 text-[10px]">
                      {a.impact}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Feature Gaps & Suggested Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Run scan to detect feature gaps</p>
              ) : (
                gaps.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 rounded-lg border p-3 hover:bg-muted/30"
                  >
                    <div>
                      <span className="font-medium text-sm">{g.competitorName}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{g.gap}</p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {g.mentionCount} mentions
                      </Badge>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleGeneratePRD(g.gap)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        PRD
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAddToRoadmap(g.gap)}
                      >
                        <Map className="h-3 w-3 mr-1" />
                        Roadmap
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
