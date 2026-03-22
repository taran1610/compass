import { getVectorStore } from "./vector-store";

const K = 5;

export async function retrieveContext(query: string): Promise<{
  chunks: string[];
  citations: string[];
}> {
  try {
    const vectorStore = await getVectorStore();
    const docs = await vectorStore.similaritySearch(query, K);

    const chunks = docs.map((d) => d.pageContent);
    const citations = [
      ...new Set(
        docs
          .map((d) => d.metadata?.file_name as string)
          .filter(Boolean)
      ),
    ];

    return { chunks, citations };
  } catch (err) {
    console.error("[rag] retrieveContext failed:", err);
    return { chunks: [], citations: [] };
  }
}
