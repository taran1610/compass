import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { getEmbeddings } from "./embeddings";

export async function getVectorStore() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and key required");
  }

  const client = createClient(supabaseUrl, supabaseKey);
  const embeddings = getEmbeddings();

  return SupabaseVectorStore.fromExistingIndex(embeddings, {
    client,
    tableName: "documents",
    queryName: "match_documents",
  });
}
