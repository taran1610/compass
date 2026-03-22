"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatArea } from "@/components/layout/chat-area";
import { OutputPane } from "@/components/layout/output-pane";
import { usePrompt } from "@/components/providers/prompt-provider";
import { exportContentToPdf } from "@/lib/export-pdf";
import type { OutputType } from "@/lib/types";

export default function ChatWorkspace() {
  const { prompt, setPrompt } = usePrompt();
  const [outputs, setOutputs] = useState<
    { id: string; title: string; content: string; type?: OutputType }[]
  >([]);
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const pendingOutputId = useRef<string | null>(null);

  const { messages, sendMessage, status } = useChat();

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant || !pendingOutputId.current) return;

    const text = (lastAssistant.parts ?? [])
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");

    setOutputs((prev) => {
      const idx = prev.findIndex((o) => o.id === pendingOutputId.current);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = { ...next[idx], content: text };
      return next;
    });

    if (status !== "streaming" && status !== "submitted") {
      pendingOutputId.current = null;
    }
  }, [messages, status]);

  const handleSend = (message: string) => {
    const id = `output-${Date.now()}`;
    const isPRD = /prd|product requirements|draft prd/i.test(message);
    const isRoadmap = /roadmap|now\/next\/later|quarterly|timeline/i.test(message);

    setOutputs((prev) => [
      ...prev,
      {
        id,
        title: isPRD ? "PRD" : isRoadmap ? "Roadmap" : `Output ${prev.length + 1}`,
        content: "",
        type: isPRD ? "prd" : isRoadmap ? "mermaid" : "markdown",
      },
    ]);
    setActiveTab(id);
    pendingOutputId.current = id;

    sendMessage({ text: message });
  };

  const handleCopy = (id: string) => {
    const output = outputs.find((o) => o.id === id);
    if (output) navigator.clipboard.writeText(output.content);
  };

  const handleExport = (id: string, format: "md" | "pdf") => {
    const output = outputs.find((o) => o.id === id);
    if (!output) return;
    if (format === "md") {
      const ext = output.type === "prd" ? "html" : "md";
      const mime = output.type === "prd" ? "text/html" : "text/markdown";
      const blob = new Blob([output.content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${output.title.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "pdf") {
      exportContentToPdf(output.content, output.title, output.type);
    }
  };

  const handleContentChange = (id: string, content: string) => {
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, content } : o)));
  };

  return (
    <div className="flex h-full gap-4">
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-auto rounded-lg border bg-card p-4">
          <ChatArea
            onSend={handleSend}
            initialPrompt={prompt}
            disabled={status === "streaming" || status === "submitted"}
          />
        </div>
      </div>
      <div className="w-[400px] shrink-0 flex flex-col min-h-0">
        <h3 className="text-sm font-medium mb-2">Output</h3>
        <OutputPane
          outputs={outputs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCopy={handleCopy}
          onExport={handleExport}
          onContentChange={handleContentChange}
          className="flex-1 min-h-[200px]"
        />
      </div>
    </div>
  );
}
