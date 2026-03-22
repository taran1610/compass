"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  MessageSquare,
  Lightbulb,
  Headphones,
  BarChart3,
  FlaskConical,
  Map,
  FileText,
  Upload,
  Plus,
  Compass,
  FileStack,
  Send,
  ImagePlus,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/providers/auth-provider";
import { useWorkspace, type DataSource, type WorkspaceTab } from "@/components/providers/workspace-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const DATA_SOURCES: { id: DataSource; label: string; icon: typeof MessageSquare }[] = [
  { id: "interviews", label: "Customer Interviews", icon: MessageSquare },
  { id: "feature-requests", label: "Feature Requests", icon: Lightbulb },
  { id: "support-tickets", label: "Support Tickets", icon: Headphones },
  { id: "analytics", label: "Product Analytics", icon: BarChart3 },
  { id: "experiments", label: "Experiments", icon: FlaskConical },
  { id: "roadmap", label: "Roadmap", icon: Map },
  { id: "artifacts", label: "Artifacts", icon: FileText },
];

type UploadedFile = { name: string; chunks: number };

type DataSidebarProps = {
  onUploadClick?: () => void;
  refreshFilesTrigger?: number;
};

const SOURCE_TO_TAB: Partial<Record<DataSource, WorkspaceTab>> = {
  interviews: "insights",
  "feature-requests": "insights",
  "support-tickets": "insights",
  analytics: "insights",
  experiments: "decision-lab",
  roadmap: "roadmap",
  artifacts: "prds",
};

export function DataSidebar({ onUploadClick, refreshFilesTrigger = 0 }: DataSidebarProps) {
  const { user, signOut } = useAuth();
  const { selectedSource, setSelectedSource, setActiveTab } = useWorkspace();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [sourceFileCounts, setSourceFileCounts] = useState<Partial<Record<DataSource, number>>>({});
  const [feedback, setFeedback] = useState("");
  const [feedbackImages, setFeedbackImages] = useState<File[]>([]);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const feedbackFileInputRef = useRef<HTMLInputElement>(null);

  const handleFeedbackSubmit = async () => {
    const trimmed = feedback.trim();
    if (!trimmed || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("text", trimmed);
      formData.set("userId", user?.id ?? "");
      feedbackImages.forEach((f) => formData.append("images", f));

      const res = await fetch("/api/feedback", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback("");
        setFeedbackImages([]);
        setFeedbackSent(true);
        setTimeout(() => setFeedbackSent(false), 3000);
      } else {
        console.error(data.error ?? "Failed to send feedback");
      }
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleFeedbackImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const valid = files.filter((f) =>
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.type)
    );
    setFeedbackImages((prev) => [...prev, ...valid].slice(0, 5));
    e.target.value = "";
  };

  const removeFeedbackImage = (index: number) => {
    setFeedbackImages((prev) => prev.filter((_, i) => i !== index));
  };

  const previewUrls = useMemo(
    () => feedbackImages.map((f) => URL.createObjectURL(f)),
    [feedbackImages]
  );
  useEffect(
    () => () => previewUrls.forEach(URL.revokeObjectURL),
    [previewUrls]
  );

  useEffect(() => {
    setFilesLoading(true);
    fetch("/api/documents/list")
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .catch(() => setFiles([]))
      .finally(() => setFilesLoading(false));
  }, [refreshFilesTrigger]);

  useEffect(() => {
    fetch("/api/documents/count")
      .then((r) => r.json())
      .then((d) => {
        const by = d?.bySource;
        if (by && typeof by === "object" && !Array.isArray(by)) {
          setSourceFileCounts(by as Partial<Record<DataSource, number>>);
        } else {
          setSourceFileCounts({});
        }
      })
      .catch(() => setSourceFileCounts({}));
  }, [refreshFilesTrigger]);

  const totalFiles = files.length;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Compass className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm">Compass</span>
              <p className="text-[10px] text-muted-foreground">AI Product Intelligence</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-6">
        <SidebarGroup className="space-y-3">
          <div className="flex items-center justify-between px-2 py-2">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Data Sources
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onUploadClick}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {DATA_SOURCES.map((source) => {
                const count = sourceFileCounts[source.id] ?? 0;
                const isSelected = selectedSource === source.id;
                return (
                  <SidebarMenuItem key={source.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        const next = isSelected ? null : source.id;
                        setSelectedSource(next);
                        if (next) {
                          const tab = SOURCE_TO_TAB[next];
                          if (tab) setActiveTab(tab);
                        }
                      }}
                      className={cn(
                        "cursor-pointer transition-colors relative",
                        isSelected && "bg-primary/10 text-primary before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:rounded-r before:bg-primary before:content-['']"
                      )}
                    >
                      <source.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate text-sm">{source.label}</span>
                      {count > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[20px] rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold tabular-nums">
                          {count}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Feedback */}
        <SidebarGroup className="space-y-3 pt-2">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-[#6366F1] px-2">
            Feedback
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="rounded-lg border border-[#6366F1]/30 bg-[#6366F1]/5 p-3 space-y-3">
              <Textarea
                placeholder="Share your feedback, ideas, or report issues…"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[80px] text-xs resize-none focus-visible:ring-[#6366F1]/50 focus-visible:border-[#6366F1]/50"
                maxLength={2000}
                disabled={feedbackSubmitting}
              />
              <input
                ref={feedbackFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={handleFeedbackImageSelect}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs border-[#6366F1]/30 text-[#6366F1] hover:bg-[#6366F1]/10 hover:border-[#6366F1]/50"
                  onClick={() => feedbackFileInputRef.current?.click()}
                  disabled={feedbackSubmitting || feedbackImages.length >= 5}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Add photos ({feedbackImages.length}/5)
                </Button>
                {feedbackImages.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="relative group h-12 w-12 rounded-md overflow-hidden border border-[#6366F1]/20 bg-[#6366F1]/5"
                  >
                    <img
                      src={previewUrls[i]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFeedbackImage(i)}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full bg-[#6366F1] hover:bg-[#5558E3] text-white border-0"
                onClick={handleFeedbackSubmit}
                disabled={!feedback.trim() || feedbackSubmitting}
              >
                {feedbackSubmitting ? (
                  "Sending…"
                ) : feedbackSent ? (
                  "Thanks!"
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Send feedback
                  </>
                )}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="space-y-3 pt-2">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
            Quick Add
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-2 px-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={onUploadClick}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedSource("interviews");
                setActiveTab("insights");
                onUploadClick?.();
              }}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Add Interview
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedSource("feature-requests");
                setActiveTab("insights");
                onUploadClick?.();
              }}
            >
              <Lightbulb className="mr-2 h-4 w-4" />
              Add Feature Request
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedSource("support-tickets");
                setActiveTab("insights");
                onUploadClick?.();
              }}
            >
              <Headphones className="mr-2 h-4 w-4" />
              Add Support Ticket
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedSource("analytics");
                setActiveTab("insights");
                onUploadClick?.();
              }}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Add Analytics
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedSource("experiments");
                setActiveTab("decision-lab");
              }}
            >
              <FlaskConical className="mr-2 h-4 w-4" />
              Run Experiment
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedSource("roadmap");
                setActiveTab("roadmap");
              }}
            >
              <Map className="mr-2 h-4 w-4" />
              Add Roadmap Item
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                setSelectedSource("artifacts");
                setActiveTab("prds");
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Add Artifact
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="space-y-3 pt-2 mt-auto">
          <div className="flex items-center justify-between px-2 py-2">
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Files
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onUploadClick}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <SidebarGroupContent>
            {filesLoading ? (
              <div className="px-2 py-3 text-xs text-muted-foreground">Loading…</div>
            ) : totalFiles === 0 ? (
              <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-center">
                <FileStack className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">No files yet</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5">PDF, TXT, MD, CSV</p>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onUploadClick}>
                  <Upload className="h-3 w-3 mr-1.5" />
                  Upload
                </Button>
              </div>
            ) : (
              <div className="space-y-1 px-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium tabular-nums">{totalFiles}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {totalFiles === 1 ? "file" : "files"} uploaded
                  </span>
                </div>
                <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-white/[0.04]"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate min-w-0 flex-1" title={f.name}>
                        {f.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                        {f.chunks}
                      </span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={onUploadClick}>
                  <Upload className="h-3 w-3 mr-1.5" />
                  Add more
                </Button>
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full cursor-pointer items-center justify-start gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user?.email?.[0]?.toUpperCase() ?? (user?.id === "demo" ? "D" : "?")}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{user?.email ?? (user?.id === "demo" ? "Demo" : "User")}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
