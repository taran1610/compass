"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Plus, RefreshCw, Upload } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import type { SuggestedFeature } from "@/components/tools/rice-suggested-features";

export type DiscoveredFeature = {
  id: string;
  name: string;
  mentions: number;
  demandScore: number;
  featureRequests?: number;
  supportTickets?: number;
  interviewMentions?: number;
  explanation?: string;
  reach?: number;
  impact?: number;
  confidence?: number;
  effort?: number;
};

type FeatureDiscoveryEngineProps = {
  onAddToPrioritization?: (f: DiscoveredFeature) => void;
  onGeneratePRD?: (f: DiscoveredFeature) => void;
};

function suggestedToDiscovered(s: SuggestedFeature & { featureRequests?: number; supportTickets?: number; interviewMentions?: number }): DiscoveredFeature {
  const fr = s.featureRequests ?? 0;
  const st = s.supportTickets ?? 0;
  const im = s.interviewMentions ?? 0;
  const mentions = fr + st + im || 5;
  return {
    id: s.id,
    name: s.feature,
    mentions,
    demandScore: Math.min(100, (s.reach ?? 50) + (s.confidence ?? 80) / 2),
    featureRequests: fr || undefined,
    supportTickets: st || undefined,
    interviewMentions: im || undefined,
    explanation: s.reason,
    reach: s.reach,
    impact: s.impact,
    confidence: s.confidence,
    effort: s.effort,
  };
}

export function FeatureDiscoveryEngine({
  onAddToPrioritization,
  onGeneratePRD,
}: FeatureDiscoveryEngineProps) {
  const {
    hasUploadedData,
    suggestedFeatures,
    suggestionsLoading,
    refetchSuggestedFeatures,
    openUpload,
  } = useWorkspace();
  const features = useMemo(
    () => suggestedFeatures.map(suggestedToDiscovered),
    [suggestedFeatures]
  );

  if (!hasUploadedData) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#6366F1]" />
          <span className="text-sm font-semibold text-[#6366F1]">Suggested Features</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Extracted from your documents. AI-detected recurring requests.
        </p>
      </CardHeader>
      <CardContent>
        {suggestionsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : features.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No feature themes found in your documents yet. Try richer feedback files, or run extraction again.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => refetchSuggestedFeatures()}
                disabled={suggestionsLoading}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${suggestionsLoading ? "animate-spin" : ""}`} />
                Retry extraction
              </Button>
              <Button type="button" variant="secondary" size="sm" className="gap-1.5" onClick={openUpload}>
                <Upload className="h-3.5 w-3.5" />
                Upload documents
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {features.map((f) => (
              <div
                key={f.id}
                className="group flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{f.name}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {f.mentions} mentions
                    </Badge>
                  </div>
                  {f.explanation && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {f.explanation}
                    </p>
                  )}
                  <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                    {f.featureRequests != null && f.featureRequests > 0 && (
                      <span>{(f.featureRequests as number)} requests</span>
                    )}
                    {f.supportTickets != null && f.supportTickets > 0 && (
                      <span>{(f.supportTickets as number)} tickets</span>
                    )}
                    {f.interviewMentions != null && f.interviewMentions > 0 && (
                      <span>{(f.interviewMentions as number)} interviews</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    Demand {Math.round(f.demandScore)}%
                  </Badge>
                  {onAddToPrioritization && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1"
                      onClick={() => onAddToPrioritization(f)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  )}
                  {onGeneratePRD && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1"
                      onClick={() => onGeneratePRD(f)}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      PRD
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
