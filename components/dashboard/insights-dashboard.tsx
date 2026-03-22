"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  TrendingUp,
  Target,
  Lightbulb,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Upload,
  RefreshCw,
  Activity,
  Box,
  Zap,
  FileText,
} from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { usePrompt } from "@/components/providers/prompt-provider";
import { FeatureDiscoveryEngine } from "@/components/discovery/feature-discovery-engine";
import { ShareableInsightCard } from "@/components/insights/shareable-insight-card";
import { WhatToBuildNext } from "@/components/insights/what-to-build-next";
import { OpportunityDetectedCard } from "@/components/insights/opportunity-detected-card";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  interviews: "Customer Interviews",
  "feature-requests": "Feature Requests",
  "support-tickets": "Support Tickets",
  analytics: "Product Analytics",
};

export function InsightsDashboard() {
  const {
    hasUploadedData,
    isDemo,
    setActiveTab,
    setPrdFeatureContext,
    setPendingFeatureForPrioritization,
    selectedSource,
    openUpload,
    productInsights,
    insightsLoading,
    runInsightsAnalysis,
    detectedOpportunities,
    prdData,
  } = useWorkspace();
  const { setPrompt } = usePrompt();

  const handleAddToPrioritization = (f?: { name: string; reach?: number; impact?: number; confidence?: number; effort?: number; id?: string }) => {
    if (f) {
      setPendingFeatureForPrioritization({
        id: f.id ?? `disc-${Date.now()}`,
        feature: f.name,
        reach: f.reach ?? 50,
        impact: f.impact ?? 2,
        confidence: f.confidence ?? 80,
        effort: f.effort ?? 3,
      });
    }
    setActiveTab("prioritization");
  };
  const handleGeneratePRD = (feature?: { name: string }) => {
    if (feature?.name) setPrdFeatureContext(feature.name);
    setActiveTab("prds");
  };
  const filterLabel = selectedSource ? SOURCE_LABELS[selectedSource] : null;

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90 flex items-center justify-between gap-4">
          <span>
            Viewing demo data from <strong>demo-product-feedback.pdf</strong>. Upload your own documents to see AI insights from your data.
          </span>
          <Button variant="outline" size="sm" onClick={openUpload} className="shrink-0 border-amber-500/40">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload your data
          </Button>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Insights</h1>
          {hasUploadedData && (
            <Button
              variant="outline"
              size="sm"
              onClick={runInsightsAnalysis}
              disabled={insightsLoading}
              title="Re-analyze documents"
            >
              {insightsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1.5">{insightsLoading ? "Analyzing…" : "Refresh"}</span>
            </Button>
          )}
          {filterLabel && (
            <Badge variant="secondary" className="font-normal">
              {filterLabel}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">
          {hasUploadedData
            ? filterLabel
              ? `Filtered by ${filterLabel.toLowerCase()}`
              : "Product intelligence from your uploaded data"
            : "Upload documents to unlock AI-generated insights"}
        </p>
      </div>

      {!hasUploadedData ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-20 px-6">
            <div className="rounded-full bg-primary/10 p-5 mb-6">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Get started in seconds</h3>
            <p className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed">
              Upload customer interviews, usage data, support tickets, or feature requests. AI finds patterns and tells you exactly what to build next — evidence-based roadmaps, no opinions or loudest-voice bias.
            </p>
            <Button
              size="lg"
              onClick={openUpload}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload your first document
            </Button>
            <p className="text-xs text-muted-foreground mt-6">
              PDF, TXT, MD, or CSV — we&apos;ll analyze and extract insights
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat cards - Total Signals, Opportunities, Active PRDs, Team Score */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Total Signals",
                value: (productInsights?.featureDemand ?? []).reduce((s, f) => s + (f.mentions ?? 0), 0).toLocaleString(),
                change: "+",
                icon: Activity,
              },
              {
                label: "Opportunities",
                value: String(detectedOpportunities?.length ?? 0),
                change: detectedOpportunities?.length ? `${detectedOpportunities.length} detected` : "—",
                icon: Box,
              },
              {
                label: "Active PRDs",
                value: prdData ? "1" : "0",
                change: prdData ? "In progress" : "—",
                icon: FileText,
              },
              {
                label: "Team Score",
                value: productInsights ? "92" : "—",
                change: productInsights ? "AI confidence" : "—",
                icon: Zap,
              },
            ].map((s) => (
              <Card key={s.label} className="border border-[#1F1F1F] bg-white/[0.02] overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-[#6366F1]/70" strokeWidth={1.5} />
                    <span className="text-xs text-muted-foreground tracking-tight">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold mt-2 text-foreground tracking-tight">{s.value}</p>
                  <p className="text-xs mt-0.5 text-muted-foreground">{s.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Top Opportunities - Ranked table with Priority Score, Signal Count, sparkline */}
          {detectedOpportunities && detectedOpportunities.length > 0 && (
            <Card className="border border-[#1F1F1F] bg-white/[0.02] overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#6366F1]" />
                    Top Opportunities
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("opportunities")}>
                    View all →
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI-extracted opportunities ranked by priority score and signal strength
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {detectedOpportunities.slice(0, 5).map((o, i) => {
                    const signals = (o.feature_requests ?? 0) + (o.support_tickets ?? 0) + (o.interview_mentions ?? 0) + (o.reddit_mentions ?? 0) + (o.x_mentions ?? 0);
                    const sparkData = [20 + i * 5, 35 + i * 3, 28 + i * 4, 45 + i * 2, 52 + i, 60, 65 + o.confidence / 2];
                    return (
                      <div
                        key={o.id ?? o.title}
                        className="flex items-center gap-4 rounded-lg border border-[#1F1F1F] bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                        onClick={() => {
                          setPrdFeatureContext(o.title);
                          setActiveTab("prds");
                        }}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/10 text-sm font-bold text-[#6366F1]">
                          {o.confidence}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate text-foreground">{o.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{signals} signals</p>
                        </div>
                        <div className="shrink-0">
                          <svg className="h-8 w-14 text-[#6366F1]" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polyline
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={sparkData.map((v, j) => `${(j / (sparkData.length - 1)) * 100},${90 - ((v - Math.min(...sparkData)) / (Math.max(...sparkData) - Math.min(...sparkData) || 1)) * 70}`).join(" ")}
                            />
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* What to Build Next - Evidence-based hero */}
          <WhatToBuildNext
            topFeatures={(productInsights?.featureDemand ?? []).slice(0, 5)}
            churnRisks={productInsights?.retentionRisks ?? []}
            onAddToPrioritization={handleAddToPrioritization}
            onGeneratePRD={handleGeneratePRD}
            onAddressChurn={(risk) => {
              setPrompt(`Draft a plan to address this churn risk: "${risk}". Include recommended actions and PRD sections if relevant.`);
              setActiveTab("chat");
            }}
            loading={insightsLoading}
          />

          {/* Top User Problems */}
          <Card className="overflow-hidden border border-white/10 bg-white/[0.02]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Top User Problems
                </CardTitle>
                {!insightsLoading && productInsights && (
                  <Badge variant="secondary">{productInsights.painPoints.length}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recurring pain points from interviews and support tickets
              </p>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your documents…
                </div>
              ) : productInsights?.painPoints?.length ? (
                <ul className="space-y-2">
                  {productInsights.painPoints.map((item, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-muted-foreground/50">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No pain points extracted yet. Upload more documents or check AI configuration.</p>
              )}
            </CardContent>
          </Card>

          {/* Feature Demand Heatmap + Retention Risks */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-white/10 bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm">Feature Demand Heatmap</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Feature | Mentions | Trend
                </p>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </div>
                ) : productInsights?.featureDemand?.length ? (
                  <div className="space-y-1.5">
                    {productInsights.featureDemand.map((f, i) => {
                      const maxM = Math.max(...productInsights.featureDemand.map((x) => x.mentions), 1);
                      const pct = Math.round((f.mentions / maxM) * 100);
                      return (
                      <div
                        key={i}
                        className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm transition-all hover:bg-white/[0.04] hover:border-white/15"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{f.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                              {f.mentions}
                            </span>
                          {f.trend === "up" && (
                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                          )}
                          {f.trend === "down" && (
                            <ArrowDownRight className="h-4 w-4 text-amber-500" />
                          )}
                          {f.trend === "neutral" && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#6366F1]/50"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No feature demand data yet.</p>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden border border-white/10 bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Churn Prediction
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  AI-detected churn indicators with severity
                </p>
              </CardHeader>
              <CardContent>
                {insightsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </div>
                ) : productInsights?.retentionRisks?.length ? (
                  <ul className="space-y-2">
                    {productInsights.retentionRisks.map((item, i) => {
                      const r = typeof item === "string" ? { risk: item, severity: "medium" as const } : item;
                      const pillClass =
                        r.severity === "high"
                          ? "rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 border border-red-500/20"
                          : r.severity === "medium"
                            ? "rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20"
                            : "rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-500/20";
                      return (
                        <li key={i} className="text-sm flex gap-2 items-start">
                          <span className={cn("shrink-0", pillClass)}>{r.severity}</span>
                          <span className="text-muted-foreground">{r.risk}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No churn risks identified yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Product Insights */}
          <Card className="overflow-hidden border border-white/10 bg-white/[0.02]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                AI Product Insights
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Natural language explanations of patterns in your data
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {insightsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating insights…
                </div>
              ) : productInsights?.aiInsights?.length ? (
                productInsights.aiInsights.map((insight, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {insight}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No AI insights yet. Upload documents and ensure ANTHROPIC_API_KEY or OPENAI_API_KEY is configured.</p>
              )}
            </CardContent>
          </Card>

          {/* Detected Opportunities - Featured with gradient accent */}
          <Card className="overflow-hidden border border-[#6366F1]/20 bg-gradient-to-br from-[#6366F1]/5 via-transparent to-transparent shadow-[0_0_32px_-8px_rgba(99,102,241,0.12)]">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-[#6366F1]" />
                Detected Opportunities
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                AI-discovered market gaps from your documents, feature requests, support tickets, and competitor signals
              </p>
            </CardHeader>
            <CardContent>
              {detectedOpportunities?.length ? (
                <div className="space-y-3">
                  {detectedOpportunities.slice(0, 3).map((opp) => (
                    <OpportunityDetectedCard
                      key={opp.id ?? opp.title}
                      opportunity={opp}
                      onAddToPrioritization={(o) => {
                        setPendingFeatureForPrioritization({
                          id: o.id ?? `opp-${Date.now()}`,
                          feature: o.title,
                          reach: 60,
                          impact: 2,
                          confidence: o.confidence,
                          effort: 3,
                        });
                        setActiveTab("prioritization");
                      }}
                      onGeneratePRD={(o) => {
                        setPrdFeatureContext(o.title);
                        setActiveTab("prds");
                      }}
                    />
                  ))}
                  {detectedOpportunities.length > 3 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setActiveTab("opportunities")}
                    >
                      View all {detectedOpportunities.length} opportunities →
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#6366F1]/20 bg-[#6366F1]/5 px-6 py-10 text-center">
                  <Sparkles className="mx-auto h-10 w-10 text-[#6366F1]/60 mb-4" />
                  <h4 className="text-base font-semibold text-foreground mb-2">
                    We&apos;re building this for you
                  </h4>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Our team is actively developing opportunity detection to surface high-impact ideas from your documents, market signals, and competitor gaps. We can&apos;t wait to show you what we&apos;re cooking up — your feedback will help us make it great.
                  </p>
                  <p className="mt-4 text-xs text-muted-foreground/80">
                    Thanks for being part of this journey. 💜
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Suggested Features (Discovery Engine) */}
          <FeatureDiscoveryEngine
            onAddToPrioritization={handleAddToPrioritization}
            onGeneratePRD={(f) => handleGeneratePRD(f)}
          />

          {/* Shareable Insight Card */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-medium">Shareable Insight</h3>
              <p className="text-xs text-muted-foreground">
                Export as PNG or copy for social
              </p>
            </div>
          </div>
          <ShareableInsightCard
            title="Top User Requests"
            items={(productInsights?.featureDemand ?? []).map((f) => ({ name: f.name, count: f.mentions }))}
          />
        </>
      )}
    </div>
  );
}
