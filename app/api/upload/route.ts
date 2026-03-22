import { NextResponse } from "next/server";
import { ingestDocument } from "@/lib/rag/ingest";

export const maxDuration = 60;

function getSourceType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes("interview")) return "interviews";
  if (lower.includes("request") || lower.includes("feature")) return "feature-requests";
  if (lower.includes("support") || lower.includes("ticket")) return "support-tickets";
  if (lower.includes("analytics")) return "analytics";
  return "interviews";
}

async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (file.name.toLowerCase().endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const data = await pdfParse(Buffer.from(bytes));
    return data?.text ?? "";
  }

  if (
    file.name.toLowerCase().endsWith(".txt") ||
    file.name.toLowerCase().endsWith(".md")
  ) {
    return new TextDecoder().decode(bytes);
  }

  if (file.name.toLowerCase().endsWith(".csv")) {
    const text = new TextDecoder().decode(bytes);
    return text
      .split("\n")
      .map((row) => row.replace(/,/g, " | "))
      .join("\n");
  }

  return new TextDecoder().decode(bytes);
}

/**
 * POST /api/upload
 * Accepts multipart/form-data with files. Parses and ingests into RAG.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files?.length) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    let totalChunks = 0;

    for (const file of files) {
      if (!file.size) continue;

      const text = await extractText(file);
      if (!text?.trim()) continue;

      const sourceType = getSourceType(file.name);
      const chunks = await ingestDocument(text, {
        file_name: file.name,
        source_type: sourceType,
      });
      totalChunks += chunks;
    }

    return NextResponse.json({
      success: true,
      filesProcessed: files.length,
      chunksIngested: totalChunks,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
