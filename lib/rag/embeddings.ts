import { OpenAIEmbeddings } from "@langchain/openai";

export function getEmbeddings() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY or ANTHROPIC_API_KEY required for embeddings");
  }
  // Use OpenAI for embeddings (Anthropic doesn't provide embeddings)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY required for embeddings (Anthropic does not provide embeddings)");
  }
  return new OpenAIEmbeddings({
    openAIApiKey: openaiKey,
    modelName: "text-embedding-3-small",
  });
}
