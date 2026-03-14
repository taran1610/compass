"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type OutputPaneProps = {
  outputs?: { id: string; title: string; content: string }[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onExport?: (id: string, format: "md" | "pdf") => void;
  onCopy?: (id: string) => void;
  className?: string;
};

export function OutputPane({
  outputs = [],
  activeTab,
  onTabChange,
  onExport,
  onCopy,
  className,
}: OutputPaneProps) {
  if (outputs.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 text-center",
          className
        )}
      >
        <p className="text-sm text-muted-foreground">
          Outputs will appear here when you run Quick Actions or chat.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Editable Markdown, Mermaid diagrams, and more.
        </p>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab ?? outputs[0]?.id}
      onValueChange={onTabChange ?? (() => {})}
      className={cn("flex h-full flex-col", className)}
    >
      <TabsList className="w-full justify-start overflow-x-auto">
        {outputs.map((output) => (
          <TabsTrigger key={output.id} value={output.id} className="truncate">
            {output.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {outputs.map((output) => (
        <TabsContent
          key={output.id}
          value={output.id}
          className="mt-2 flex-1 overflow-hidden data-[state=inactive]:hidden"
        >
          <div className="flex h-full flex-col gap-2">
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy?.(output.id)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExport?.(output.id, "md")}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1 rounded-md border bg-background p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {output.content}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
