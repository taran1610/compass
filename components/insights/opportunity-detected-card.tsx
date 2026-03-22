"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export type DetectedOpportunityData = {
  id?: string;
  title: string;
  feature_requests: number;
  support_tickets: number;
  interview_mentions: number;
  reddit_mentions: number;
  x_mentions: number;
  product_review_mentions?: number;
  competitor_missing: boolean;
  competitor_names?: string[];
  priority: "high" | "medium" | "low";
  confidence: number;
};

type OpportunityDetectedCardProps = {
  opportunity: DetectedOpportunityData;
  onAddToPrioritization?: (opportunity: DetectedOpportunityData) => void;
  onGeneratePRD?: (opportunity: DetectedOpportunityData) => void;
  className?: string;
};

function formatTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.startsWith("users want") || lower.startsWith("user wants")) {
    return title;
  }
  return `Users want ${title}.`;
}

export function OpportunityDetectedCard({
  opportunity,
  onAddToPrioritization,
  onGeneratePRD,
  className,
}: OpportunityDetectedCardProps) {
  const signals: { label: string; count?: number }[] = [];

  if (opportunity.feature_requests > 0) {
    signals.push({
      label: `${opportunity.feature_requests} feature request${opportunity.feature_requests !== 1 ? "s" : ""}`,
    });
  }
  if (opportunity.support_tickets > 0) {
    signals.push({
      label: `${opportunity.support_tickets} support ticket${opportunity.support_tickets !== 1 ? "s" : ""}`,
    });
  }
  if (opportunity.interview_mentions > 0) {
    signals.push({
      label: `${opportunity.interview_mentions} interview mention${opportunity.interview_mentions !== 1 ? "s" : ""}`,
    });
  }
  if (opportunity.reddit_mentions > 0) {
    signals.push({
      label: `${opportunity.reddit_mentions} Reddit mention${opportunity.reddit_mentions !== 1 ? "s" : ""}`,
    });
  }
  if (opportunity.x_mentions > 0) {
    signals.push({
      label: `${opportunity.x_mentions} X mention${opportunity.x_mentions !== 1 ? "s" : ""}`,
    });
  }
  if ((opportunity.product_review_mentions ?? 0) > 0) {
    signals.push({
      label: `${opportunity.product_review_mentions} product review mention${(opportunity.product_review_mentions ?? 0) !== 1 ? "s" : ""}`,
    });
  }
  if (opportunity.competitor_missing) {
    const compNames = opportunity.competitor_names?.length
      ? ` (${opportunity.competitor_names.join(", ")})`
      : "";
    signals.push({
      label: `Competitor missing feature${compNames}`,
    });
  }

  const priorityVariant =
    opportunity.priority === "high"
      ? "default"
      : opportunity.priority === "medium"
        ? "secondary"
        : "outline";

  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4 border-l-[#6366F1] bg-gradient-to-r from-[#6366F1]/10 via-transparent to-transparent",
        "shadow-[0_0_24px_-4px_rgba(99,102,241,0.15)]",
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Opportunity Detected
            </p>
            <p className="text-base font-semibold mt-1">
              {formatTitle(opportunity.title)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={priorityVariant} className="capitalize">
              {opportunity.priority}
            </Badge>
            <Badge variant="outline">{opportunity.confidence}% confidence</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {signals.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Signals:
            </p>
            <ul className="space-y-1">
              {signals.map((s, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-muted-foreground/50">•</span>
                  {s.label}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(onAddToPrioritization || onGeneratePRD) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {onAddToPrioritization && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddToPrioritization(opportunity)}
              >
                <Target className="h-3.5 w-3.5 mr-1.5" />
                Add to Prioritization
              </Button>
            )}
            {onGeneratePRD && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGeneratePRD(opportunity)}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Generate PRD
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
