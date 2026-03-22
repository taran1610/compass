"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useWorkspace } from "@/components/providers/workspace-provider";
import type { ResearchTheme } from "@/components/providers/workspace-provider";

export function ResearchSynthesizer() {
  const { hasUploadedData, researchThemes, setResearchThemes } = useWorkspace();
  const [loading, setLoading] = useState(false);

  const synthesize = () => {
    setLoading(true);
    fetch("/api/research/synthesize", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.themes?.length) {
          setResearchThemes(data.themes);
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Research Synthesizer</h2>
          <p className="text-sm text-muted-foreground">
            Clustered themes with quotes from source documents
          </p>
        </div>
        {hasUploadedData && (
          <Button variant="outline" size="sm" onClick={synthesize} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Synthesizing…" : "Synthesize"}
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {researchThemes.length === 0 && !loading && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                {hasUploadedData
                  ? "Click Synthesize to cluster themes and extract quotes from your documents."
                  : "Upload documents to synthesize research themes."}
              </p>
              {hasUploadedData && (
                <Button onClick={synthesize} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Synthesize Research
                </Button>
              )}
            </CardContent>
          </Card>
        )}
        {researchThemes.map((theme, idx) => (
          <Card key={theme.id ?? idx}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{theme.title}</span>
                <Badge variant="secondary">{theme.quoteCount} quotes</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {theme.quotes.map((q, i) => (
                <div
                  key={i}
                  className="rounded-lg border-l-4 border-muted-foreground/30 bg-muted/30 pl-4 py-2"
                >
                  <p className="text-sm italic">&quot;{q.text}&quot;</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    — {q.source}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
