import { Document } from "@langchain/core/documents";
import { getVectorStore } from "./vector-store";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";

  for (const p of paragraphs) {
    if (current.length + p.length + 2 > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      const overlap = current.slice(-CHUNK_OVERLAP);
      current = overlap + "\n\n" + p;
    } else {
      current += (current ? "\n\n" : "") + p;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  if (chunks.length === 0 && text.trim()) {
    for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
    }
  }
  return chunks;
}

export async function ingestDocument(
  content: string,
  metadata: { file_name?: string; source_type?: string } = {}
): Promise<number> {
  const chunks = chunkText(content);
  if (chunks.length === 0) return 0;

  const docs = chunks.map(
    (c) =>
      new Document({
        pageContent: c,
        metadata: { ...metadata },
      })
  );

  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(docs);
  return docs.length;
}
