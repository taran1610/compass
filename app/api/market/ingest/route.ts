import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmbeddings } from "@/lib/rag/embeddings";

export const maxDuration = 60;

type MarketSignalInput = {
  source: "reddit" | "x" | "product_reviews" | "startup_forum" | "community";
  content: string;
  topic?: string;
  author?: string;
  url?: string;
};

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const signals: MarketSignalInput[] = Array.isArray(body) ? body : body.signals ? body.signals : [body];

    if (signals.length === 0) {
      return NextResponse.json({ error: "No signals provided" }, { status: 400 });
    }

    const embeddings = getEmbeddings();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const texts = signals.map((s) => s.content);
    const vectors = await embeddings.embedDocuments(texts);

    const rows = signals.map((s, i) => ({
      source: s.source,
      content: s.content,
      topic: s.topic ?? null,
      author: s.author ?? null,
      url: s.url ?? null,
      embedding: vectors[i],
    }));

    const { error } = await supabase.from("market_signals").insert(rows);

    if (error) throw error;

    return NextResponse.json({ inserted: rows.length });
  } catch (err) {
    console.error("Market ingest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ingest failed" },
      { status: 500 }
    );
  }
}
