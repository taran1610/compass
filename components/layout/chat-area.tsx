"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-2", className)}
    >
      <Textarea
        placeholder="Ask anything... Synthesize research, prioritize features, draft a PRD..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        disabled={disabled}
        className="min-h-[120px] resize-none"
        rows={4}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={disabled || !prompt.trim()} size="sm">
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
      </div>
    </form>
  );
}
