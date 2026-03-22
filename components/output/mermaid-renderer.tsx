"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { marked } from "marked";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  securityLevel: "loose",
});

type ContentPart = { type: "text"; content: string } | { type: "mermaid"; content: string };

function splitContent(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /```mermaid\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: "mermaid", content: match[1].trim() });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: "text", content }];
}

export function MermaidRenderer({ content }: { content: string }) {
  const [mermaidSvgs, setMermaidSvgs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const parts = splitContent(content);
  const mermaidParts = parts.filter((p): p is { type: "mermaid"; content: string } => p.type === "mermaid");

  useEffect(() => {
    if (mermaidParts.length === 0) {
      setMermaidSvgs([]);
      return;
    }

    const render = async () => {
      setError(null);
      const results: string[] = [];
      for (let i = 0; i < mermaidParts.length; i++) {
        try {
          const id = `mermaid-${Date.now()}-${i}`;
          const { svg } = await mermaid.render(id, mermaidParts[i].content);
          results.push(svg);
        } catch (e) {
          setError((e as Error).message);
          results.push("");
        }
      }
      setMermaidSvgs(results);
    };

    render();
  }, [content]);

  let mermaidIdx = 0;
  return (
    <div className="space-y-4">
      {parts.map((part, i) => {
        if (part.type === "text") {
          if (!part.content.trim()) return null;
          return (
            <div
              key={i}
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: marked.parse(part.content) as string,
              }}
            />
          );
        }
        const svg = mermaidSvgs[mermaidIdx++];
        if (!svg) return <pre key={i} className="text-sm overflow-x-auto">{part.content}</pre>;
        return (
          <div key={i} className="my-4 flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
        );
      })}
      {error && <p className="text-sm text-destructive">Mermaid: {error}</p>}
    </div>
  );
}
