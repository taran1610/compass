"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { MermaidRenderer } from "@/components/output/mermaid-renderer";
import { TipTapEditor } from "@/components/output/tiptap-editor";
import type { OutputType } from "@/lib/types";

type Output = {
  id: string;
  title: string;
  content: string;
  type?: OutputType;
};

type OutputPaneProps = {
  outputs?: Output[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onExport?: (id: string, format: "md" | "pdf") => void;
  onCopy?: (id: string) => void;
  onContentChange?: (id: string, content: string) => void;
  className?: string;
};

function OutputContent({
  output,
  onContentChange,
}: {
  output: Output;
  onContentChange?: (id: string, content: string) => void;
}) {
  if (output.type === "prd") {
    return (
      <TipTapEditor
        content={output.content}
        onChange={(html) => onContentChange?.(output.id, html)}
        editable={true}
      />
    );
  }

  if (output.type === "mermaid" || /```mermaid/.test(output.content)) {
    return <MermaidRenderer content={output.content} />;
  }

  return (
    <pre className="whitespace-pre-wrap font-sans text-sm">{output.content}</pre>
  );
}

export function OutputPane({
  outputs = [],
  activeTab,
  onTabChange,
  onExport,
  onCopy,
  onContentChange,
  className,
}: OutputPaneProps) {
  if (outputs.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 p-10 text-center",
          className
        )}
      >
        <p className="text-sm font-medium text-muted-foreground">
          Ask a question to get started
        </p>
        <p className="mt-2 text-xs text-muted-foreground max-w-[200px]">
          Try: &quot;Draft a PRD for dark mode&quot; or &quot;Create a Now/Next/Later roadmap&quot;
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  <Download className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onExport?.(output.id, "md")}>
                    Export as MD/HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport?.(output.id, "pdf")}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ScrollArea className="flex-1 rounded-md border bg-background p-4">
              <OutputContent
                output={output}
                onContentChange={onContentChange}
              />
            </ScrollArea>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
