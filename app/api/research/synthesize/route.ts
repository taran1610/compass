import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getChatModel } from "@/lib/ai/get-model";
import { fetchDocumentsForExtraction } from "@/lib/rag/extract-features";

const ThemesSchema = z.object({
  themes: z.array(
    z.object({
      title: z.string(),
      quoteCount: z.number(),
      quotes: z.array(
        z.object({
          text: z.string(),
          source: z.string(),
        })
      ),
    })
  ),
});

/**
 * POST /api/research/synthesize
 * Synthesizes research into clustered themes with quotes from source documents.
 */
export async function POST() {
  try {
    const documents = await fetchDocumentsForExtraction(30);
    if (documents.length === 0) {
      return NextResponse.json({
        themes: [],
        message: "No documents found. Upload documents to synthesize research.",
      });
    }

    const context = documents
      .map(
        (d) => `[Source: ${d.sourceType}, File: ${d.fileName}]\n${d.content.slice(0, 2500)}`
      )
      .join("\n\n---\n\n");

    const model = getChatModel();
    const { object } = await generateObject({
      model,
      schema: ThemesSchema,
      prompt: `Analyze these product research documents (customer interviews, feature requests, support tickets) and cluster them into 3-5 key themes.

For each theme:
- title: Short theme name (e.g. "Onboarding friction", "Export limitations")
- quoteCount: Number of supporting quotes
- quotes: 2-4 direct quotes from the documents with the source file name

Extract actual quotes from the text. Be specific.

Documents:
${context}`,
    });

    return NextResponse.json({ themes: object.themes ?? [] });
  } catch (err) {
    console.error("Research synthesize error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Synthesis failed" },
      { status: 500 }
    );
  }
}
