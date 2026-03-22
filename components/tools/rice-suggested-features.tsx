"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

export type SuggestedFeature = {
  id: string;
  feature: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  reason?: string;
};

type RiceSuggestedFeaturesProps = {
  suggestions?: SuggestedFeature[];
  onAdd: (suggestion: SuggestedFeature) => void;
  isLoading?: boolean;
};

const MOCK_SUGGESTIONS: SuggestedFeature[] = [
  {
    id: "sug-1",
    feature: "Bulk export to Excel",
    reach: 75,
    impact: 3,
    confidence: 85,
    effort: 3,
    reason: "21 feature requests, 14 support tickets",
  },
  {
    id: "sug-2",
    feature: "Webhook notifications",
    reach: 40,
    impact: 2,
    confidence: 90,
    effort: 2,
    reason: "8 feature requests, 3 interview mentions",
  },
  {
    id: "sug-3",
    feature: "Keyboard shortcuts",
    reach: 55,
    impact: 2,
    confidence: 95,
    effort: 1,
    reason: "12 support tickets, power user segment",
  },
];

export function RiceSuggestedFeatures({
  suggestions = MOCK_SUGGESTIONS,
  onAdd,
  isLoading = false,
}: RiceSuggestedFeaturesProps) {
  if (suggestions.length === 0 && !isLoading) return null;

  return (
    <Card className="border border-white/10 bg-white/[0.02]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">AI Suggested Features</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Extracted from uploaded documents. Add to prioritize.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-white/[0.02]"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 transition-all hover:bg-white/[0.04] hover:border-white/15"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{s.feature}</p>
                  {s.reason && (
                    <p className="text-xs text-muted-foreground truncate">
                      {s.reason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium tabular-nums">
                    RICE ~
                    {((s.reach * s.impact * s.confidence) / (s.effort || 1)).toFixed(0)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onAdd(s)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
