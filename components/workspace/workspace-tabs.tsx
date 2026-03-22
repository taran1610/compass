"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  MessageSquare,
  Map,
  FileText,
  Lightbulb,
  ListOrdered,
  FlaskConical,
  Globe,
  Target,
  Building2,
  MapPin,
} from "lucide-react";
import { useWorkspace, type WorkspaceTab } from "@/components/providers/workspace-provider";
import { cn } from "@/lib/utils";

const TAB_CONFIG: { id: WorkspaceTab; label: string; icon: typeof Sparkles }[] = [
  { id: "insights", label: "Insights", icon: Sparkles },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "prds", label: "PRDs", icon: FileText },
  { id: "research", label: "Research", icon: Lightbulb },
  { id: "prioritization", label: "Prioritization", icon: ListOrdered },
  { id: "decision-lab", label: "Decision Lab", icon: FlaskConical },
  { id: "market-insights", label: "Market Insights", icon: Globe },
  { id: "opportunities", label: "Opportunities", icon: Target },
  { id: "competitors", label: "Competitors", icon: Building2 },
  { id: "opportunity-map", label: "Opportunity Map", icon: MapPin },
];

export function WorkspaceTabs() {
  const { activeTab, setActiveTab } = useWorkspace();

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as WorkspaceTab)}>
      <div className="overflow-x-auto overflow-y-hidden -mx-1 px-1">
        <TabsList className="h-11 min-w-max w-max justify-start gap-0.5 rounded-lg border border-white/10 bg-white/[0.02] p-1 flex-nowrap">
          {TAB_CONFIG.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-none gap-2 rounded-md px-3 transition-all data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm",
                activeTab === tab.id && "font-medium"
              )}
            >
            <tab.icon className={cn("h-4 w-4", activeTab === tab.id && "text-primary")} />
            {tab.label}
          </TabsTrigger>
        ))}
        </TabsList>
      </div>
    </Tabs>
  );
}
