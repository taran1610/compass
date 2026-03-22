import { NextResponse } from "next/server";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { getChatModel } from "@/lib/ai/get-model";
import { retrieveContext } from "@/lib/rag/retrieve";

export const maxDuration = 60;

/** Normalize messages to UIMessage format (parts-based). Handles legacy { role, content }. */
function normalizeMessages(messages: unknown[]): UIMessage[] {
  return messages.map((m) => {
    if (m && typeof m === "object" && "role" in m) {
      const msg = m as { role: string; content?: string; parts?: Array<{ type: string; text?: string }> };
      const parts = msg.parts ?? (msg.content != null ? [{ type: "text" as const, text: String(msg.content) }] : []);
      return { ...msg, role: msg.role as "user" | "assistant" | "system", parts } as UIMessage;
    }
    return { role: "user" as const, parts: [{ type: "text" as const, text: "" }] } as UIMessage;
  });
}

function extractLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const parts = m.parts ?? [];
    return parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawMessages = body?.messages ?? [];
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const messages = normalizeMessages(rawMessages);
    const userQuery = extractLastUserText(messages);
    let chunks: string[] = [];
    let citations: string[] = [];

    try {
      const result = await retrieveContext(userQuery);
      chunks = result.chunks;
      citations = result.citations;
    } catch (ragErr) {
      console.error("[chat] RAG retrieve failed:", ragErr);
      // Continue without context - model can still answer
    }

    const contextBlock =
      chunks.length > 0
        ? `\n\n## Relevant context from uploaded documents:\n${chunks
            .map((c, i) => `[${i + 1}] ${c}`)
            .join("\n\n")}\n\nWhen using this context, cite the source (e.g. "From: ${citations[0] || "document"}").`
        : "\n\nNo relevant documents were found. Answer based on your knowledge.";

    const systemPrompt = `You are a helpful AI assistant for product managers. You help with research synthesis, prioritization, roadmaps, PRDs, and stakeholder updates.

${contextBlock}

Respond in Markdown. For roadmaps, use Mermaid timeline syntax when appropriate.`;

    const model = getChatModel();

    const result = streamText({
      model,
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat] Error:", err);

    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      {
        error: isDev ? message : "Chat service unavailable. Please try again.",
        ...(isDev && {
          hint: "Common causes: missing OPENAI_API_KEY/ANTHROPIC_API_KEY, invalid message format, or RAG/Supabase config",
        }),
      },
      { status: 500 }
    );
  }
}
