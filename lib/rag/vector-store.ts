import { Document } from "@langchain/core/documents";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import { getEmbeddings } from "./embeddings";

const TABLE = "documents";
const MATCH_RPC = "match_documents";

/** pgvector text format for PostgREST (1536-dim for text-embedding-3-small) */
function vectorToSqlLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Minimal Supabase + pgvector store (replaces @langchain/community SupabaseVectorStore)
 * so we avoid optional peer deps (e.g. stagehand → zod@^3) that break npm on Vercel.
 */
class SupabasePgVectorStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly embeddings: EmbeddingsInterface
  ) {}

  async addDocuments(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;
    const texts = documents.map((d) => d.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts);
    const rows = documents.map((doc, i) => ({
      content: doc.pageContent,
      metadata: doc.metadata ?? {},
      embedding: vectorToSqlLiteral(vectors[i]!),
    }));
    const batchSize = 32;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await this.client.from(TABLE).insert(batch);
      if (error) throw new Error(`Supabase insert failed: ${error.message}`);
    }
  }

  async similaritySearch(query: string, k: number): Promise<Document[]> {
    const qv = await this.embeddings.embedQuery(query);
    const { data, error } = await this.client.rpc(MATCH_RPC, {
      query_embedding: vectorToSqlLiteral(qv),
      match_count: k,
      filter: {},
    });
    if (error) throw new Error(`Supabase match_documents failed: ${error.message}`);
    return (data ?? []).map(
      (row: { content: string; metadata?: Record<string, unknown> }) =>
        new Document({
          pageContent: row.content,
          metadata: (row.metadata ?? {}) as Record<string, unknown>,
        })
    );
  }
}

export async function getVectorStore(): Promise<SupabasePgVectorStore> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and key required");
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const embeddings = getEmbeddings();

  return new SupabasePgVectorStore(client, embeddings);
}
