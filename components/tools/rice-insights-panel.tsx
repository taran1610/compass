"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type Feature = {
  id: string;
  feature: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
};

type RiceInsightsPanelProps = {
  topFeature: Feature | null;
  mostRequested: Feature | null;
  highestImpact: Feature | null;
  riceScore: (r: number, i: number, c: number, e: number) => number;
};

export function RiceInsightsPanel({
  topFeature,
  mostRequested,
  highestImpact,
  riceScore,
}: RiceInsightsPanelProps) {
  const insights = [
    {
      id: "top",
      title: "Top Priority Feature",
      value: topFeature?.feature ?? "—",
      sub: topFeature
        ? `RICE score ${riceScore(topFeature.reach, topFeature.impact, topFeature.confidence, topFeature.effort).toFixed(1)} — best ROI`
        : "Add features to see",
      icon: Trophy,
      className: "border-l-4 border-l-amber-500",
    },
    {
      id: "requested",
      title: "Most Requested",
      value: mostRequested?.feature ?? "—",
      sub: mostRequested
        ? `Reach ${mostRequested.reach} — appears in feature requests and support tickets`
        : "Based on document signals",
      icon: MessageSquare,
      className: "border-l-4 border-l-blue-500",
    },
    {
      id: "impact",
      title: "Highest Impact Potential",
      value: highestImpact?.feature ?? "—",
      sub: highestImpact
        ? `Impact ${highestImpact.impact}/3 — high user value`
        : "Adjust impact sliders",
      icon: Zap,
      className: "border-l-4 border-l-emerald-500",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {insights.map((insight) => (
        <Card key={insight.id} className={cn("overflow-hidden", insight.className)}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-muted p-1.5">
                <insight.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {insight.title}
                </p>
                <p className="mt-0.5 truncate font-semibold">{insight.value}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{insight.sub}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
