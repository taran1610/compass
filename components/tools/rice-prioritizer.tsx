"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { RiceInsightsPanel } from "./rice-insights-panel";
import { RiceImpactEffortChart } from "./rice-impact-effort-chart";
import { RiceFeatureCard, type FeatureSignals } from "./rice-feature-card";
import {
  RiceSuggestedFeatures,
  type SuggestedFeature,
} from "./rice-suggested-features";
import { useWorkspace } from "@/components/providers/workspace-provider";

export type RiceItem = {
  id: string;
  feature: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  signals?: FeatureSignals;
};

export function riceScore(r: number, i: number, c: number, e: number) {
  if (e === 0) return 0;
  return (r * i * c) / e;
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const INITIAL_ITEMS: RiceItem[] = [
  {
    id: "1",
    feature: "Bulk CSV export",
    reach: 80,
    impact: 3,
    confidence: 90,
    effort: 2,
    signals: { featureRequests: 21, supportTickets: 14, interviewMentions: 3 },
  },
  {
    id: "2",
    feature: "Dark mode",
    reach: 60,
    impact: 2,
    confidence: 100,
    effort: 1,
    signals: { featureRequests: 18, supportTickets: 8 },
  },
  {
    id: "3",
    feature: "API access",
    reach: 20,
    impact: 3,
    confidence: 70,
    effort: 5,
    signals: { featureRequests: 12, interviewMentions: 5 },
  },
  {
    id: "4",
    feature: "Custom dashboards",
    reach: 45,
    impact: 2,
    confidence: 85,
    effort: 4,
    signals: { featureRequests: 9, supportTickets: 4 },
  },
  {
    id: "5",
    feature: "Slack integration",
    reach: 55,
    impact: 2,
    confidence: 95,
    effort: 2,
    signals: { featureRequests: 7, interviewMentions: 2 },
  },
];

export function RicePrioritizer() {
  const {
    hasUploadedData,
    pendingFeatureForPrioritization,
    setPendingFeatureForPrioritization,
    suggestedFeatures,
    suggestionsLoading,
  } = useWorkspace();
  const [items, setItems] = useState<RiceItem[]>(INITIAL_ITEMS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFeatureForPrioritization) return;
    const newItem: RiceItem = {
      id: uniqueId("pending"),
      feature: pendingFeatureForPrioritization.feature,
      reach: pendingFeatureForPrioritization.reach,
      impact: pendingFeatureForPrioritization.impact,
      confidence: pendingFeatureForPrioritization.confidence,
      effort: pendingFeatureForPrioritization.effort,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setPendingFeatureForPrioritization(null);
  }, [pendingFeatureForPrioritization, setPendingFeatureForPrioritization]);

  const updateItem = (id: string, field: keyof RiceItem, value: number | string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const addItem = () => {
    const newItem: RiceItem = {
      id: uniqueId("new"),
      feature: "New feature",
      reach: 50,
      impact: 2,
      confidence: 80,
      effort: 3,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  const addSuggested = (s: SuggestedFeature) => {
    const newItem: RiceItem = {
      id: uniqueId("sug"),
      feature: s.feature,
      reach: s.reach,
      impact: s.impact,
      confidence: s.confidence,
      effort: s.effort,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          riceScore(b.reach, b.impact, b.confidence, b.effort) -
          riceScore(a.reach, a.impact, a.confidence, a.effort)
      ),
    [items]
  );

  const topFeature = sorted[0] ?? null;
  const mostRequested = useMemo(
    () =>
      [...items].sort((a, b) => {
        const aTotal = (a.signals?.featureRequests ?? 0) + (a.signals?.supportTickets ?? 0);
        const bTotal = (b.signals?.featureRequests ?? 0) + (b.signals?.supportTickets ?? 0);
        return bTotal - aTotal;
      })[0] ?? null,
    [items]
  );
  const highestImpact = useMemo(
    () => [...items].sort((a, b) => b.impact - a.impact)[0] ?? null,
    [items]
  );

  const exportCsv = () => {
    const headers = ["Rank", "Feature", "Reach", "Impact", "Confidence", "Effort", "RICE Score"];
    const rows = sorted.map((item, i) => [
      i + 1,
      item.feature,
      item.reach,
      item.impact,
      item.confidence,
      item.effort,
      riceScore(item.reach, item.impact, item.confidence, item.effort).toFixed(1),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rice-prioritization.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedItem = selectedId ? items.find((i) => i.id === selectedId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">RICE Prioritization</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered feature ranking. Signals from documents, live scoring.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* 1. Insights Panel */}
      <RiceInsightsPanel
        topFeature={topFeature}
        mostRequested={mostRequested}
        highestImpact={highestImpact}
        riceScore={riceScore}
      />

      {/* 2. Impact vs Effort Chart + 3. Table + 4. Side Panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 min-w-0">
          {/* Impact vs Effort Chart */}
          <Card>
            <CardContent className="pt-6">
              <RiceImpactEffortChart
                features={items}
                onFeatureClick={setSelectedId}
                selectedId={selectedId}
              />
            </CardContent>
          </Card>

          {/* Feature Ranking Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium px-4 py-3 w-12">#</th>
                      <th className="text-left font-medium px-4 py-3 min-w-[160px]">Feature</th>
                      <th className="text-left font-medium px-4 py-3 w-20">Reach</th>
                      <th className="text-left font-medium px-4 py-3 w-20">Impact</th>
                      <th className="text-left font-medium px-4 py-3 w-20">Conf</th>
                      <th className="text-left font-medium px-4 py-3 w-20">Effort</th>
                      <th className="text-right font-medium px-4 py-3 w-24">RICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((item, rank) => {
                      const score = riceScore(
                        item.reach,
                        item.impact,
                        item.confidence,
                        item.effort
                      );
                      const isTop3 = rank < 3;
                      const isSelected = selectedId === item.id;
                      return (
                        <tr
                          key={item.id}
                          className={cn(
                            "border-b transition-colors cursor-pointer",
                            isSelected && "bg-primary/5",
                            isTop3 && !isSelected && "bg-amber-500/5",
                            "hover:bg-muted/30"
                          )}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <td className="px-4 py-3">
                            {isTop3 ? (
                              <Badge
                                variant={rank === 0 ? "default" : "secondary"}
                                className={cn(
                                  "font-mono",
                                  rank === 0 && "bg-amber-600 hover:bg-amber-600",
                                  rank === 1 && "bg-slate-400 hover:bg-slate-400",
                                  rank === 2 && "bg-amber-700 hover:bg-amber-700"
                                )}
                              >
                                <Trophy className="mr-1 h-3 w-3" />
                                {rank + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground font-mono">
                                {rank + 1}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <span className="font-medium">{item.feature}</span>
                              {(item.signals?.featureRequests ?? 0) +
                                (item.signals?.supportTickets ?? 0) +
                                (item.signals?.interviewMentions ?? 0) >
                                0 && (
                                <span className="ml-2 text-[10px] text-muted-foreground">
                                  {[
                                    item.signals?.featureRequests &&
                                      `${item.signals.featureRequests} req`,
                                    item.signals?.supportTickets &&
                                      `${item.signals.supportTickets} tickets`,
                                    item.signals?.interviewMentions &&
                                      `${item.signals.interviewMentions} interviews`,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 tabular-nums">{item.reach}</td>
                          <td className="px-4 py-3 tabular-nums">{item.impact}</td>
                          <td className="px-4 py-3 tabular-nums">{item.confidence}</td>
                          <td className="px-4 py-3 tabular-nums">{item.effort}</td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={cn(
                                "font-mono font-semibold tabular-nums",
                                isTop3 && "text-amber-600"
                              )}
                            >
                              {score.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* AI Suggested Features */}
          <RiceSuggestedFeatures
            suggestions={hasUploadedData ? suggestedFeatures : undefined}
            onAdd={addSuggested}
            isLoading={suggestionsLoading}
          />
        </div>

        {/* Side Panel: Feature Card Editor */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Edit Feature</h3>
            {selectedItem ? (
              <RiceFeatureCard
                id={selectedItem.id}
                feature={selectedItem.feature}
                reach={selectedItem.reach}
                impact={selectedItem.impact}
                confidence={selectedItem.confidence}
                effort={selectedItem.effort}
                signals={selectedItem.signals}
                riceScore={riceScore(
                  selectedItem.reach,
                  selectedItem.impact,
                  selectedItem.confidence,
                  selectedItem.effort
                )}
                rank={
                  sorted.findIndex((i) => i.id === selectedItem.id) + 1 || undefined
                }
                isSelected
                onUpdate={(field, value) =>
                  updateItem(selectedItem.id, field as keyof RiceItem, value)
                }
              />
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    Select a feature from the table or chart to edit
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={addItem}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add feature
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
