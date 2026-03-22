"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, FileText, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

export type FeatureSignals = {
  featureRequests?: number;
  supportTickets?: number;
  interviewMentions?: number;
};

type RiceFeatureCardProps = {
  id: string;
  feature: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  signals?: FeatureSignals;
  riceScore: number;
  rank?: number;
  isSelected?: boolean;
  onUpdate: (field: string, value: number | string) => void;
};

export function RiceFeatureCard({
  feature,
  reach,
  impact,
  confidence,
  effort,
  signals = {},
  riceScore,
  rank,
  isSelected,
  onUpdate,
}: RiceFeatureCardProps) {
  const totalMentions =
    (signals.featureRequests ?? 0) +
    (signals.supportTickets ?? 0) +
    (signals.interviewMentions ?? 0);

  return (
    <Card
      className={cn(
        "transition-all",
        isSelected && "ring-2 ring-primary shadow-md"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Input
            value={feature}
            onChange={(e) => onUpdate("feature", e.target.value)}
            className="h-8 border-0 bg-transparent px-0 font-semibold shadow-none focus-visible:ring-0"
          />
          <div className="flex shrink-0 items-center gap-1">
            {rank != null && rank <= 3 && (
              <Badge variant="secondary" className="text-[10px]">
                #{rank}
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              {riceScore.toFixed(1)}
            </Badge>
          </div>
        </div>
        {totalMentions > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
            {(signals.featureRequests ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {signals.featureRequests} requests
              </span>
            )}
            {(signals.supportTickets ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Headphones className="h-3 w-3" />
                {signals.supportTickets} tickets
              </span>
            )}
            {(signals.interviewMentions ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {signals.interviewMentions} interviews
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {[
          { key: "reach", label: "Reach", value: reach, max: 100, step: 5 },
          { key: "impact", label: "Impact", value: impact, max: 3, step: 1 },
          { key: "confidence", label: "Confidence", value: confidence, max: 100, step: 5 },
          { key: "effort", label: "Effort", value: effort, max: 100, step: 5 },
        ].map(({ key, label, value, max, step }) => (
          <div key={key}>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{label}</span>
              <span className="tabular-nums">{value}</span>
            </div>
            <Slider
              value={[value]}
              onValueChange={(v) =>
                onUpdate(key, Array.isArray(v) ? v[0] ?? 0 : 0)
              }
              max={max}
              step={step}
              className="mt-0.5"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
