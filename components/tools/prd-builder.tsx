"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Sparkles, ChevronDown, ChevronRight, FileText, RefreshCw, Eye, Map, ListOrdered, FlaskConical } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

type UserStory = {
  id: string;
  as: string;
  want: string;
  soThat: string;
};

type Evidence = {
  featureRequests: number;
  supportTickets: number;
  interviewMentions: number;
};

type PredictedImpact = {
  retentionImprovement: string;
  adoptionImprovement: string;
  confidenceScore: number;
};

type EngineeringContent = {
  technicalRequirements: string;
  apiConsiderations: string;
  systemComponents: string;
  edgeCases: string;
};

type PRDSectionProps = {
  title: string;
  collapsed: boolean;
  onToggle: () => void;
  evidence?: Evidence;
  onShowEvidence?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function PRDSection({
  title,
  collapsed,
  onToggle,
  evidence,
  onShowEvidence,
  actions,
  children,
}: PRDSectionProps) {
  const [showEvidence, setShowEvidence] = useState(false);
  const hasEvidence = evidence && (evidence.featureRequests + evidence.supportTickets + evidence.interviewMentions > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div
          className="flex items-center justify-between cursor-pointer group"
          onClick={onToggle}
        >
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm">{title}</CardTitle>
            {hasEvidence && (
              <Badge variant="secondary" className="text-[10px]">
                {evidence!.featureRequests + evidence!.supportTickets + evidence!.interviewMentions} sources
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {hasEvidence && onShowEvidence && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setShowEvidence((v) => !v);
                  onShowEvidence?.();
                }}
              >
                <Eye className="mr-1 h-3 w-3" />
                Evidence
              </Button>
            )}
            {actions}
          </div>
        </div>
        {!collapsed && hasEvidence && showEvidence && (
          <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs">
            <p className="font-medium text-muted-foreground mb-1">Evidence</p>
            <ul className="space-y-0.5">
              {evidence!.featureRequests > 0 && (
                <li>• {evidence!.featureRequests} feature requests</li>
              )}
              {evidence!.supportTickets > 0 && (
                <li>• {evidence!.supportTickets} support tickets</li>
              )}
              {evidence!.interviewMentions > 0 && (
                <li>• {evidence!.interviewMentions} interview mentions</li>
              )}
            </ul>
          </div>
        )}
      </CardHeader>
      {!collapsed && <CardContent>{children}</CardContent>}
    </Card>
  );
}

const DEFAULT_STORY: UserStory = { id: "1", as: "a power user", want: "bulk export to CSV", soThat: "I can analyze data offline" };

export function PRDBuilder() {
  const { setActiveTab, prdFeatureContext, setPrdFeatureContext, prdData, setPrdData } = useWorkspace();
  const [problem, setProblem] = useState(prdData?.problem ?? "");
  const [goals, setGoals] = useState(prdData?.goals ?? "");
  const [scope, setScope] = useState(prdData?.scope ?? "");
  const [stories, setStories] = useState<UserStory[]>(prdData?.stories?.length ? prdData.stories : [DEFAULT_STORY]);
  const [metrics, setMetrics] = useState(prdData?.metrics ?? "");
  const [predictedImpact, setPredictedImpact] = useState<PredictedImpact | null>(prdData?.predictedImpact ?? null);
  const [evidence, setEvidence] = useState<Evidence | null>(prdData?.evidence ?? null);
  const [engineering, setEngineering] = useState<EngineeringContent | null>(prdData?.engineering ?? null);
  const [mode, setMode] = useState<"pm" | "engineering">("pm");
  const [generating, setGenerating] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Sync from persisted data when it changes (e.g. returning from another tab)
  useEffect(() => {
    if (prdData) {
      setProblem(prdData.problem);
      setGoals(prdData.goals);
      setScope(prdData.scope);
      setStories(prdData.stories?.length ? prdData.stories : [DEFAULT_STORY]);
      setMetrics(prdData.metrics);
      setPredictedImpact(prdData.predictedImpact ?? null);
      setEvidence(prdData.evidence ?? null);
      setEngineering(prdData.engineering ?? null);
    }
  }, [prdData]);

  const toggleCollapsed = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addStory = () => {
    setStories((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, as: "", want: "", soThat: "" },
    ]);
  };

  const updateStory = (id: string, field: keyof UserStory, value: string) => {
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeStory = (id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
  };

  const generatePRD = async () => {
    setGenerating(true);
    setPrdFeatureContext(null);
    try {
      const res = await fetch("/api/prd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "pm",
          featureContext: prdFeatureContext || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newStories = data.userStories?.length
        ? data.userStories.map((s: { as: string; want: string; soThat: string }, i: number) => ({
            id: `gen-${i}-${Date.now()}`,
            as: s.as ?? "",
            want: s.want ?? "",
            soThat: s.soThat ?? "",
          }))
        : stories;

      setProblem(data.problem ?? "");
      setGoals(data.goals ?? "");
      setScope(data.scope ?? "");
      setMetrics(data.impactMetrics ?? "");
      setPredictedImpact(data.predictedImpact ?? null);
      setEvidence(data.evidence ?? null);
      setStories(newStories);

      setPrdData({
        problem: data.problem ?? "",
        goals: data.goals ?? "",
        scope: data.scope ?? "",
        stories: newStories,
        metrics: data.impactMetrics ?? "",
        predictedImpact: data.predictedImpact ?? null,
        evidence: data.evidence ?? null,
        engineering,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const generateEngineering = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/prd/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "engineering",
          problem: problem || "See PRD above",
          goals: goals || "See PRD above",
          userStories: stories.map((s) => ({ as: s.as, want: s.want, soThat: s.soThat })),
        }),
      });
      const data = await res.json();
      if (data.engineering) {
        setEngineering(data.engineering);
        setPrdData({
          problem,
          goals,
          scope,
          stories,
          metrics,
          predictedImpact: predictedImpact ?? null,
          evidence: evidence ?? null,
          engineering: data.engineering,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">PRD Builder</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered product specification from insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <button
              onClick={() => setMode("pm")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                mode === "pm" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              PM Mode
            </button>
            <button
              onClick={() => setMode("engineering")}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                mode === "engineering" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              )}
            >
              Engineering Mode
            </button>
          </div>
          {prdFeatureContext && mode === "pm" && (
            <Badge variant="secondary" className="text-xs">
              Focus: {prdFeatureContext}
            </Badge>
          )}
          {mode === "pm" && (
            <Button onClick={() => generatePRD()} disabled={generating}>
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Generating…" : "Generate PRD from Insights"}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {mode === "pm" && (
          <>
        <PRDSection
          title="Problem"
          collapsed={!!collapsed.problem}
          onToggle={() => toggleCollapsed("problem")}
          evidence={evidence ?? undefined}
          actions={
            <Button variant="ghost" size="sm" className="h-7" onClick={() => generatePRD()} disabled={generating}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          }
        >
          <Textarea
            placeholder="What problem are we solving?"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </PRDSection>

        <PRDSection
          title="Goals"
          collapsed={!!collapsed.goals}
          onToggle={() => toggleCollapsed("goals")}
          evidence={evidence ?? undefined}
        >
          <Textarea
            placeholder="Success criteria and objectives"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </PRDSection>

        <PRDSection
          title="Scope"
          collapsed={!!collapsed.scope}
          onToggle={() => toggleCollapsed("scope")}
          evidence={evidence ?? undefined}
        >
          <Textarea
            placeholder="In scope / Out of scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </PRDSection>

        <PRDSection
          title="User Stories"
          collapsed={!!collapsed.stories}
          onToggle={() => toggleCollapsed("stories")}
          evidence={evidence ?? undefined}
          actions={
            <Button variant="outline" size="sm" onClick={addStory} className="h-7">
              <Plus className="mr-1 h-3 w-3" />
              Add
            </Button>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              As a [user type] I want to [action] So that [benefit]
            </p>
            {stories.map((story) => (
              <div key={story.id} className="rounded-lg border p-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="As a..."
                    value={story.as}
                    onChange={(e) => updateStory(story.id, "as", e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="I want..."
                    value={story.want}
                    onChange={(e) => updateStory(story.id, "want", e.target.value)}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="So that..."
                      value={story.soThat}
                      onChange={(e) => updateStory(story.id, "soThat", e.target.value)}
                      className="text-sm"
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeStory(story.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PRDSection>

        <PRDSection
          title="Impact Metrics"
          collapsed={!!collapsed.metrics}
          onToggle={() => toggleCollapsed("metrics")}
          evidence={evidence ?? undefined}
        >
          <Textarea
            placeholder="How we'll measure success"
            value={metrics}
            onChange={(e) => setMetrics(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </PRDSection>

        <PRDSection
            title="Predicted Impact"
            collapsed={!!collapsed.impact}
            onToggle={() => toggleCollapsed("impact")}
          >
            {predictedImpact ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Retention improvement</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {predictedImpact.retentionImprovement}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Adoption improvement</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {predictedImpact.adoptionImprovement}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Confidence score</p>
                  <p className="text-lg font-semibold">{predictedImpact.confidenceScore}%</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Generate PRD from Insights to see predicted impact.
              </p>
            )}
          </PRDSection>
          </>
        )}

        {mode === "engineering" && (
          <>
            <p className="text-sm text-muted-foreground -mt-2 mb-2">
              Engineering content is generated from your PM PRD. Switch to PM Mode to create or edit problem, goals, and user stories first.
            </p>
            <PRDSection
              title="Technical Requirements"
              collapsed={!!collapsed.tech}
              onToggle={() => toggleCollapsed("tech")}
              actions={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={generateEngineering}
                  disabled={generating}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Generate
                </Button>
              }
            >
              {engineering ? (
                <Textarea
                  value={engineering.technicalRequirements}
                  onChange={(e) =>
                    setEngineering((prev) =>
                      prev ? { ...prev, technicalRequirements: e.target.value } : null
                    )
                  }
                  rows={4}
                  className="resize-none font-mono text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click Generate to create technical requirements from the PRD.
                </p>
              )}
            </PRDSection>
            <PRDSection
              title="API Considerations"
              collapsed={!!collapsed.api}
              onToggle={() => toggleCollapsed("api")}
            >
              {engineering ? (
                <Textarea
                  value={engineering.apiConsiderations}
                  onChange={(e) =>
                    setEngineering((prev) =>
                      prev ? { ...prev, apiConsiderations: e.target.value } : null
                    )
                  }
                  rows={3}
                  className="resize-none font-mono text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Generate technical content first.</p>
              )}
            </PRDSection>
            <PRDSection
              title="System Components"
              collapsed={!!collapsed.components}
              onToggle={() => toggleCollapsed("components")}
            >
              {engineering ? (
                <Textarea
                  value={engineering.systemComponents}
                  onChange={(e) =>
                    setEngineering((prev) =>
                      prev ? { ...prev, systemComponents: e.target.value } : null
                    )
                  }
                  rows={3}
                  className="resize-none font-mono text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Generate technical content first.</p>
              )}
            </PRDSection>
            <PRDSection
              title="Edge Cases"
              collapsed={!!collapsed.edge}
              onToggle={() => toggleCollapsed("edge")}
            >
              {engineering ? (
                <Textarea
                  value={engineering.edgeCases}
                  onChange={(e) =>
                    setEngineering((prev) =>
                      prev ? { ...prev, edgeCases: e.target.value } : null
                    )
                  }
                  rows={3}
                  className="resize-none font-mono text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">Generate technical content first.</p>
              )}
            </PRDSection>
          </>
        )}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PRD Integration
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Link this PRD to roadmap items, prioritization features, or Decision Lab simulations
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => setActiveTab("roadmap")}
          >
            <Map className="h-3.5 w-3.5 mr-1.5" />
            Link to Roadmap
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => setActiveTab("prioritization")}
          >
            <ListOrdered className="h-3.5 w-3.5 mr-1.5" />
            Link to Prioritization
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={() => setActiveTab("decision-lab")}
          >
            <FlaskConical className="h-3.5 w-3.5 mr-1.5" />
            Link to Decision Lab
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
