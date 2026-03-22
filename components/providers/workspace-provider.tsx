"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ProductInsights } from "@/lib/rag/extract-insights";
import type { DetectedOpportunityData } from "@/components/insights/opportunity-detected-card";
import type { SuggestedFeature } from "@/components/tools/rice-suggested-features";

export type PendingFeatureForPrioritization = {
  id: string;
  feature: string;
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
};

export type PRDUserStory = { id: string; as: string; want: string; soThat: string };
export type PRDEvidence = { featureRequests: number; supportTickets: number; interviewMentions: number };
export type PRDPredictedImpact = { retentionImprovement: string; adoptionImprovement: string; confidenceScore: number };
export type PRDEngineering = {
  technicalRequirements: string;
  apiConsiderations: string;
  systemComponents: string;
  edgeCases: string;
};

export type PersistedPRDData = {
  problem: string;
  goals: string;
  scope: string;
  stories: PRDUserStory[];
  metrics: string;
  predictedImpact: PRDPredictedImpact | null;
  evidence: PRDEvidence | null;
  engineering: PRDEngineering | null;
};

export type ResearchTheme = {
  id?: string;
  title: string;
  quoteCount: number;
  quotes: { text: string; source: string }[];
};

export type WorkspaceTab =
  | "insights"
  | "chat"
  | "roadmap"
  | "prds"
  | "research"
  | "prioritization"
  | "decision-lab"
  | "market-insights"
  | "opportunities"
  | "competitors"
  | "opportunity-map";

export type DataSource =
  | "interviews"
  | "feature-requests"
  | "support-tickets"
  | "analytics"
  | "experiments"
  | "roadmap"
  | "artifacts";

type WorkspaceContextType = {
  activeTab: WorkspaceTab;
  setActiveTab: (tab: WorkspaceTab) => void;
  selectedSource: DataSource | null;
  setSelectedSource: (source: DataSource | null) => void;
  hasUploadedData: boolean;
  isDemo: boolean;
  setHasUploadedData: (v: boolean) => void;
  setDemoMode: (v: boolean) => void;
  prdFeatureContext: string | null;
  setPrdFeatureContext: (v: string | null) => void;
  pendingFeatureForPrioritization: PendingFeatureForPrioritization | null;
  setPendingFeatureForPrioritization: (v: PendingFeatureForPrioritization | null) => void;
  openUpload: () => void;
  setOpenUpload: (fn: () => void) => void;
  // Persisted insights (avoids re-fetch when switching tabs)
  productInsights: ProductInsights | null;
  setProductInsights: (v: ProductInsights | null) => void;
  detectedOpportunities: DetectedOpportunityData[];
  setDetectedOpportunities: (v: DetectedOpportunityData[]) => void;
  insightsLoading: boolean;
  setInsightsLoading: (v: boolean) => void;
  opportunitiesLoading: boolean;
  setOpportunitiesLoading: (v: boolean) => void;
  runInsightsAnalysis: () => Promise<void>;
  runOpportunityDetection: () => Promise<void>;
  invalidateInsightsCache: () => void;
  // AI Suggested Features (Prioritization tab - avoids re-fetch on tab switch)
  suggestedFeatures: SuggestedFeature[];
  setSuggestedFeatures: (v: SuggestedFeature[]) => void;
  suggestionsLoading: boolean;
  setSuggestionsLoading: (v: boolean) => void;
  refetchSuggestedFeatures: () => void;
  // Persisted PRD (survives tab switch)
  prdData: PersistedPRDData | null;
  setPrdData: (v: PersistedPRDData | null) => void;
  // Persisted research synthesis (survives tab switch)
  researchThemes: ResearchTheme[];
  setResearchThemes: (v: ResearchTheme[]) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined
);

const DEMO_MODE_KEY = "compass-has-uploaded-data";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("insights");
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [hasUploadedDataState, setHasUploadedDataState] = useState(false);
  const [isDemoState, setIsDemoState] = useState(false);
  const [prdFeatureContext, setPrdFeatureContext] = useState<string | null>(null);
  const [pendingFeatureForPrioritization, setPendingFeatureForPrioritization] =
    useState<PendingFeatureForPrioritization | null>(null);
  const [openUploadFn, setOpenUploadFn] = useState<() => void>(() => () => {});
  const [productInsights, setProductInsights] = useState<ProductInsights | null>(null);
  const [detectedOpportunities, setDetectedOpportunities] = useState<DetectedOpportunityData[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [prdData, setPrdData] = useState<PersistedPRDData | null>(null);
  const [researchThemes, setResearchThemes] = useState<ResearchTheme[]>([]);
  const [suggestedFeatures, setSuggestedFeatures] = useState<SuggestedFeature[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [featureSuggestionsNonce, setFeatureSuggestionsNonce] = useState(0);
  const [insightsNonce, setInsightsNonce] = useState(0);
  const [opportunitiesNonce, setOpportunitiesNonce] = useState(0);

  const refetchSuggestedFeatures = useCallback(() => {
    setFeatureSuggestionsNonce((n) => n + 1);
  }, []);

  const invalidateInsightsCache = useCallback(() => {
    setProductInsights(null);
    setDetectedOpportunities([]);
    setSuggestedFeatures([]);
    setInsightsNonce((n) => n + 1);
    setOpportunitiesNonce((n) => n + 1);
    setFeatureSuggestionsNonce((n) => n + 1);
  }, []);

  const runInsightsAnalysis = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/insights/analyze", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const risks = data.retentionRisks ?? [];
      const normalizedRisks = risks.map((r: unknown) =>
        typeof r === "string" ? { risk: r, severity: "medium" as const } : r
      );
      setProductInsights({
        painPoints: data.painPoints ?? [],
        retentionRisks: normalizedRisks,
        featureDemand: data.featureDemand ?? [],
        aiInsights: data.aiInsights ?? [],
      });
    } catch {
      setProductInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const runOpportunityDetection = useCallback(async () => {
    setOpportunitiesLoading(true);
    try {
      const res = await fetch("/api/opportunities/detect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.opportunities) {
        setDetectedOpportunities(data.opportunities);
      } else {
        const listRes = await fetch("/api/opportunities");
        const listData = await listRes.json();
        if (listRes.ok && listData.opportunities) {
          setDetectedOpportunities(listData.opportunities);
        }
      }
    } catch {
      // ignore
    } finally {
      setOpportunitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(DEMO_MODE_KEY) === "true") {
      setHasUploadedDataState(true);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch("/api/documents/count", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data?.hasData) {
          setHasUploadedDataState(true);
          if (typeof window !== "undefined") {
            localStorage.setItem(DEMO_MODE_KEY, "true");
          }
        }
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
  }, []);

  // Fetch insights when workspace has data; nonce bumps refetch (invalidate / upload).
  // Avoid productInsights + insightsLoading in deps — failed or empty responses would loop forever.
  useEffect(() => {
    if (!hasUploadedDataState) return;
    let cancelled = false;
    setInsightsLoading(true);
    fetch("/api/insights/analyze", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error);
        const risks = data.retentionRisks ?? [];
        const normalizedRisks = risks.map((r: unknown) =>
          typeof r === "string" ? { risk: r, severity: "medium" as const } : r
        );
        setProductInsights({
          painPoints: data.painPoints ?? [],
          retentionRisks: normalizedRisks,
          featureDemand: data.featureDemand ?? [],
          aiInsights: data.aiInsights ?? [],
        });
      })
      .catch(() => {
        if (!cancelled) setProductInsights(null);
      })
      .finally(() => {
        if (!cancelled) setInsightsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasUploadedDataState, insightsNonce]);

  // Same pattern: empty opportunities [] must not retrigger fetches via deps.
  useEffect(() => {
    if (!hasUploadedDataState) return;
    let cancelled = false;
    setOpportunitiesLoading(true);
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setDetectedOpportunities(data.opportunities ?? []);
      })
      .catch(() => {
        if (!cancelled) setDetectedOpportunities([]);
      })
      .finally(() => {
        if (!cancelled) setOpportunitiesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasUploadedDataState, opportunitiesNonce]);

  // Fetch AI suggested features when workspace has data; nonce bumps refetch (upload, manual retry)
  useEffect(() => {
    if (!hasUploadedDataState) return;
    let cancelled = false;
    setSuggestionsLoading(true);
    fetch("/api/features/extract", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.suggestions?.length) {
          setSuggestedFeatures(
            data.suggestions.map((s: SuggestedFeature, i: number) => ({
              ...s,
              id: s.id ?? `sug-${i + 1}`,
            }))
          );
        } else {
          setSuggestedFeatures([]);
        }
      })
      .catch(() => {
        if (!cancelled) setSuggestedFeatures([]);
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasUploadedDataState, featureSuggestionsNonce]);

  const setHasUploadedData = useCallback((v: boolean) => {
    setHasUploadedDataState(v);
    if (!v) {
      setIsDemoState(false);
      setProductInsights(null);
      setDetectedOpportunities([]);
      setSuggestedFeatures([]);
      setSuggestionsLoading(false);
    }
    if (typeof window !== "undefined") {
      if (v) localStorage.setItem(DEMO_MODE_KEY, "true");
      else localStorage.removeItem(DEMO_MODE_KEY);
    }
  }, []);

  const setDemoMode = useCallback((v: boolean) => setIsDemoState(v), []);

  return (
    <WorkspaceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedSource,
        setSelectedSource,
        hasUploadedData: hasUploadedDataState,
        isDemo: isDemoState,
        setHasUploadedData,
        setDemoMode,
        prdFeatureContext,
        setPrdFeatureContext,
        pendingFeatureForPrioritization,
        setPendingFeatureForPrioritization,
        openUpload: openUploadFn,
        setOpenUpload: setOpenUploadFn,
        productInsights,
        setProductInsights,
        detectedOpportunities,
        setDetectedOpportunities,
        insightsLoading,
        setInsightsLoading,
        opportunitiesLoading,
        setOpportunitiesLoading,
        runInsightsAnalysis,
        runOpportunityDetection,
        invalidateInsightsCache,
        suggestedFeatures,
        setSuggestedFeatures,
        suggestionsLoading,
        setSuggestionsLoading,
        refetchSuggestedFeatures,
        prdData,
        setPrdData,
        researchThemes,
        setResearchThemes,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
