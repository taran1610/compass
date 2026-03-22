"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const AI_ACTIONS = [
  { label: "Synthesize my research", prompt: "Synthesize my research into key themes and actionable insights." },
  { label: "Draft a PRD", prompt: "Draft a PRD for the most requested feature from my documents." },
  { label: "Create quarterly roadmap", prompt: "Create a quarterly roadmap based on feature demand and churn risks." },
  { label: "Summarize pain points", prompt: "Summarize the top pain points and suggest feature priorities." },
];

type ChatAreaProps = {
  onSend?: (message: string) => void;
  initialPrompt?: string;
  disabled?: boolean;
  className?: string;
};

export function ChatArea({
  onSend,
  initialPrompt = "",
  disabled = false,
  className,
}: ChatAreaProps) {
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (trimmed && onSend) {
      onSend(trimmed);
      setPrompt("");
    }
  };

  const handleAiAction = (actionPrompt: string) => {
    if (onSend) {
      onSend(actionPrompt);
      setPrompt("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-3", className)}
    >
      <div className="rounded-lg border border-white/10 bg-white/[0.02] focus-within:border-[#6366F1]/30 focus-within:ring-1 focus-within:ring-[#6366F1]/20 transition-all">
        <Textarea
          placeholder="Ask anything — e.g. &quot;Synthesize my research&quot;, &quot;Draft a PRD for API access&quot;, &quot;Create a quarterly roadmap&quot;"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={disabled}
          className="min-h-[100px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={4}
        />
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={disabled}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[#6366F1]/30 bg-transparent px-3 py-1.5 text-sm font-medium text-[#6366F1] hover:bg-[#6366F1]/10 hover:border-[#6366F1]/50 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Action
              <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {AI_ACTIONS.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={() => handleAiAction(action.prompt)}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="submit"
            disabled={disabled || !prompt.trim()}
            size="sm"
            className="bg-[#6366F1] hover:bg-[#5558E3] text-white border-0"
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </div>
    </form>
  );
}
