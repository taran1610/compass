"use client";

import { useState } from "react";
import { DataSidebar } from "@/components/layout/data-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { WorkspaceTabs } from "@/components/workspace/workspace-tabs";
import { InsightsDashboard } from "@/components/dashboard/insights-dashboard";
import ChatWorkspace from "@/components/workspace/chat-workspace";
import { RoadmapBuilder } from "@/components/tools/roadmap-builder";
import { PRDBuilder } from "@/components/tools/prd-builder";
import { RicePrioritizer } from "@/components/tools/rice-prioritizer";
import { ResearchSynthesizer } from "@/components/tools/research-synthesizer";
import { DecisionLab } from "@/components/tools/decision-lab";
import { MarketInsightsDashboard } from "@/components/market/market-insights-dashboard";
import { OpportunityFeed } from "@/components/opportunities/opportunity-feed";
import { CompetitorsDashboard } from "@/components/competitors/competitors-dashboard";
import { GlobalOpportunityMap } from "@/components/opportunity-map/global-opportunity-map";
import { UploadDialog } from "@/components/upload/upload-dialog";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AppDashboardPage() {
  const { activeTab } = useWorkspace();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);

  return (
    <>
      <DataSidebar
        onUploadClick={() => setUploadOpen(true)}
        refreshFilesTrigger={filesRefreshKey}
      />
      <SidebarInset className="min-w-0 overflow-x-hidden">
        <div className="flex flex-col h-[calc(100vh-0px)] overflow-hidden min-w-0">
          <div className="border-b border-white/5 px-6 py-4 shrink-0">
            <WorkspaceTabs />
          </div>
          <ScrollArea className="dashboard-scroll-area flex-1 min-h-0">
            <div className="dashboard-content p-8 max-w-6xl mx-auto min-w-0 w-full">
              {activeTab === "insights" && <InsightsDashboard />}
              {activeTab === "chat" && <ChatWorkspace />}
              {activeTab === "roadmap" && <RoadmapBuilder />}
              {activeTab === "prds" && <PRDBuilder />}
              {activeTab === "research" && <ResearchSynthesizer />}
              {activeTab === "prioritization" && <RicePrioritizer />}
              {activeTab === "decision-lab" && <DecisionLab />}
              {activeTab === "market-insights" && <MarketInsightsDashboard />}
              {activeTab === "opportunities" && <OpportunityFeed />}
              {activeTab === "competitors" && <CompetitorsDashboard />}
              {activeTab === "opportunity-map" && <GlobalOpportunityMap />}
            </div>
          </ScrollArea>
        </div>
      </SidebarInset>
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={() => setFilesRefreshKey((k) => k + 1)}
      />
    </>
  );
}
