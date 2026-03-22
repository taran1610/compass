"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWorkspace } from "@/components/providers/workspace-provider";
import { FileText, CheckCircle2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
};

type UploadPhase = "idle" | "uploading" | "analyzing" | "done" | "error";

export function UploadDialog({ open, onOpenChange, onUploadComplete }: UploadDialogProps) {
  const { setHasUploadedData, setDemoMode, invalidateInsightsCache } = useWorkspace();
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPhase("idle");
      setProgress(0);
      setFiles([]);
      setError(null);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter(
      (f) =>
        f.name.endsWith(".pdf") ||
        f.name.endsWith(".txt") ||
        f.name.endsWith(".md") ||
        f.name.endsWith(".csv")
    );
    setFiles((prev) => [...prev, ...valid]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setPhase("uploading");
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      setProgress(20);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(60);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setProgress(0);
      setPhase("analyzing");
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 150));
        setProgress(i);
      }

      try {
        await fetch("/api/opportunities/detect", { method: "POST" });
      } catch {
        // Opportunity detection is best-effort
      }

      setPhase("done");
      invalidateInsightsCache();
      setDemoMode(false);
      setHasUploadedData(true);
      setFiles([]);
      onUploadComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  };

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Upload customer interviews, usage data, support tickets, or feature requests. PDF, MD, TXT, CSV. AI finds patterns and tells you what to build next.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {phase === "idle" && (
            <>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                  "hover:border-primary/50 hover:bg-muted/30"
                )}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.csv"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Click to browse or drag files</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Interviews · Usage data · Support tickets · Feature requests
                </p>
              </div>
              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="truncate">{f.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFile(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={handleUpload} className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Process
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Or use{" "}
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => {
                    setHasUploadedData(true);
                    onOpenChange(false);
                  }}
                >
                  demo mode
                </Button>{" "}
                (no data stored)
              </p>
            </>
          )}
          {(phase === "uploading" || phase === "analyzing") && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium">
                  {phase === "uploading"
                    ? "Uploading..."
                    : "Analyzing product data…"}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {phase === "uploading"
                  ? "Storing documents"
                  : "Extracting themes · Feature demand scoring · Churn prediction · Detecting opportunities"}
              </p>
            </div>
          )}
          {phase === "done" && (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <p className="font-medium mb-1">Analysis complete</p>
              <p className="text-sm text-muted-foreground mb-4">
                Insights are ready. Check the Insights tab.
              </p>
              <Button onClick={handleClose}>View Insights</Button>
            </div>
          )}
          {phase === "error" && (
            <div className="text-center py-4">
              <p className="text-sm text-destructive mb-4">{error}</p>
              <p className="text-xs text-muted-foreground mb-4">
                Ensure tables exist: run{" "}
                <code className="bg-muted px-1 rounded">supabase/APPLY_MIGRATIONS.sql</code> in
                Supabase SQL Editor.
              </p>
              <Button variant="outline" onClick={() => setPhase("idle")}>
                Try again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
