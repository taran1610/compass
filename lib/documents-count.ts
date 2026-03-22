import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/** Matches upload `source_type` and DataSidebar data source ids */
const SOURCE_KEYS = [
  "interviews",
  "feature-requests",
  "support-tickets",
  "analytics",
  "experiments",
  "roadmap",
  "artifacts",
] as const;

export type DocumentSourceCountKey = (typeof SOURCE_KEYS)[number];

function isDocumentSourceKey(s: string): s is DocumentSourceCountKey {
  return (SOURCE_KEYS as readonly string[]).includes(s);
}

function getSupabaseAdmin(): SupabaseClient | null {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key);
  return _client;
}

export async function getDocumentCount(): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("documents")
    .select("*", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

/** Unique uploaded files per `metadata.source_type` (from ingest), not chunk counts */
export async function getDocumentCountBySource(): Promise<
  Partial<Record<DocumentSourceCountKey, number>>
> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return {};
  const { data, error } = await supabase
    .from("documents")
    .select("metadata")
    .not("embedding", "is", null);
  if (error || !data?.length) return {};

  const uniqueFilesBySource = new Map<string, Set<string>>();
  for (const row of data) {
    const m = (row.metadata ?? {}) as Record<string, unknown>;
    const rawSource =
      typeof m.source_type === "string" && m.source_type ? m.source_type : "interviews";
    const source = isDocumentSourceKey(rawSource) ? rawSource : "interviews";
    const fileName =
      typeof m.file_name === "string" && m.file_name.trim() ? m.file_name : "document";
    if (!uniqueFilesBySource.has(source)) uniqueFilesBySource.set(source, new Set());
    uniqueFilesBySource.get(source)!.add(fileName);
  }

  const result: Partial<Record<DocumentSourceCountKey, number>> = {};
  for (const key of SOURCE_KEYS) {
    const n = uniqueFilesBySource.get(key)?.size ?? 0;
    if (n > 0) result[key] = n;
  }
  return result;
}
