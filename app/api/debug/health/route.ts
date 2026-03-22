import { NextResponse } from "next/server";

/**
 * GET /api/debug/health
 * Returns env/config status for debugging. Never exposes secret values.
 */
export async function GET() {
  const env = {
    supabase: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    ai: {
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    },
    chat: "unknown" as "ok" | "missing_model" | "missing_embeddings",
    rag: "unknown" as "ok" | "missing_supabase" | "missing_openai",
  };

  // Chat needs at least one model provider
  if (env.ai.openai || env.ai.anthropic) {
    env.chat = "ok";
  } else {
    env.chat = "missing_model";
  }

  // RAG needs Supabase + OpenAI (embeddings require OpenAI; Anthropic has no embeddings)
  if (!env.supabase.url || !env.supabase.anonKey) {
    env.rag = "missing_supabase";
  } else if (!env.ai.openai) {
    env.rag = "missing_openai";
  } else {
    env.rag = "ok";
  }

  return NextResponse.json({
    ok: env.chat === "ok",
    env,
    hints: {
      chat: env.chat === "missing_model"
        ? "Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env.local"
        : null,
      rag: env.rag === "missing_openai"
        ? "RAG/embeddings require OPENAI_API_KEY (Anthropic has no embeddings)"
        : env.rag === "missing_supabase"
          ? "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
          : null,
    },
  });
}
