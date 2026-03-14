"use client";

import { useState } from "react";
import { ChatArea } from "@/components/layout/chat-area";
import { OutputPane } from "@/components/layout/output-pane";
import { usePrompt } from "@/components/providers/prompt-provider";

export default function DashboardPage() {
  const { prompt, setPrompt } = usePrompt();
  const [outputs, setOutputs] = useState<
    { id: string; title: string; content: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<string | undefined>();

  const handleSend = (message: string) => {
    // Placeholder: will connect to RAG + AI in next step
    const id = `output-${Date.now()}`;
    setOutputs((prev) => [
      ...prev,
      {
        id,
        title: `Output ${prev.length + 1}`,
        content: `**Your prompt:**\n${message}\n\n*AI response will appear here once RAG + streaming is connected.*`,
      },
    ]);
    setActiveTab(id);
  };

  const handleCopy = (id: string) => {
    const output = outputs.find((o) => o.id === id);
    if (output) {
      navigator.clipboard.writeText(output.content);
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col gap-4 p-4 md:flex-row">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex-1 overflow-auto rounded-lg border bg-card p-4">
          <h2 className="mb-4 text-lg font-semibold">Chat</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Ask questions, run Quick Actions from the sidebar, or request
            structured outputs. RAG will retrieve context from your uploaded
            files.
          </p>
          <ChatArea
            onSend={handleSend}
            initialPrompt={prompt}
          />
        </div>
      </div>
      <div className="flex w-full flex-col overflow-hidden md:w-[400px] lg:w-[480px]">
        <h2 className="mb-2 text-lg font-semibold">Output</h2>
        <OutputPane
          outputs={outputs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onCopy={handleCopy}
          className="min-h-[300px] flex-1"
        />
      </div>
    </div>
  );
}
