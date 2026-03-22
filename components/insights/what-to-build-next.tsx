"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, FileText, BarChart3, Shield, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChurnRisk } from "@/lib/rag/extract-insights";

type WhatToBuildNextProps = {
  topFeatures: { name: string; mentions: number; trend: "up" | "down" | "neutral" }[];
  churnRisks: ChurnRisk[];
  onAddToPrioritization: (f: { name: string }) => void;
  onGeneratePRD: (f?: { name: string }) => void;
  onAddressChurn: (risk: string) => void;
  loading?: boolean;
};

function SignalsBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
      <TrendingUp className="h-3 w-3 text-primary/70" />
      {count}
    </span>
  );
}

function ChurnPill({ severity }: { severity: "high" | "medium" | "low" }) {
  const styles = {
    high: "rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/20",
    medium: "rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20",
    low: "rounded-full bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-500/20",
  };
  return <span className={styles[severity]}>{severity}</span>;
}

export function WhatToBuildNext({
  topFeatures,
  churnRisks,
  onAddToPrioritization,
  onGeneratePRD,
  onAddressChurn,
  loading,
}: WhatToBuildNextProps) {
  return (
    <Card className="overflow-hidden border border-white/10 bg-white/[0.02] shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            What to Build Next
          </CardTitle>
          <Badge variant="secondary" className="font-normal text-xs rounded-full">
            Evidence-based
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          AI finds patterns across your data. No opinions. No loudest-voice bias.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Analyzing your documents…
          </div>
        ) : (
          <>
            {/* Top feature opportunities */}
            {topFeatures.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Top feature demand
                </h4>
                <ul className="space-y-1.5">
                  {topFeatures.slice(0, 5).map((f, i) => {
                    const maxMentions = Math.max(...topFeatures.slice(0, 5).map((x) => x.mentions), 1);
                    const demandPct = Math.round((f.mentions / maxMentions) * 100);
                    return (
                    <li
                      key={i}
                      className={cn(
                        "flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm",
                        "transition-all duration-200 hover:bg-white/[0.04] hover:border-white/15 hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-foreground">{f.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <SignalsBadge count={f.mentions} />
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-md border-white/10 bg-transparent px-2.5 text-xs font-medium hover:bg-white/5 hover:border-white/15"
                              onClick={() => onAddToPrioritization(f)}
                            >
                              Prioritize
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-md border-white/10 bg-transparent px-2.5 text-xs font-medium hover:bg-white/5 hover:border-white/15 gap-1.5"
                              onClick={() => onGeneratePRD(f)}
                            >
                              <FileText className="h-3 w-3" />
                              PRD
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#6366F1]/60 transition-all"
                            style={{ width: `${demandPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8">{demandPct}%</span>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Churn risks to address */}
            {churnRisks.length > 0 && (
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-[#6366F1] mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#6366F1]" />
                  Churn risks to address
                </h4>
                <ul className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {churnRisks.map((r, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm",
                        "transition-all duration-200 hover:bg-white/[0.04] hover:border-white/15 hover:shadow-sm"
                      )}
                    >
                      <span className="text-muted-foreground">{r.risk}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <ChurnPill severity={r.severity} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 rounded-md border-[#6366F1]/30 bg-transparent px-2.5 text-xs font-medium text-[#6366F1] hover:bg-[#6366F1]/10 hover:border-[#6366F1]/50"
                          onClick={() => onAddressChurn(r.risk)}
                        >
                          Address
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topFeatures.length === 0 && churnRisks.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">
                Upload more documents to get evidence-based recommendations.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
