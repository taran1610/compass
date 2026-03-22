import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents/list
 * Returns list of uploaded files (unique by file_name from metadata) and total count.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ files: [], totalFiles: 0, totalChunks: 0 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("documents")
      .select("id, metadata")
      .not("embedding", "is", null);

    if (error) throw error;

    const byFile = new Map<string, number>();
    for (const row of data ?? []) {
      const file = (row.metadata as Record<string, string>)?.file_name ?? "document";
      byFile.set(file, (byFile.get(file) ?? 0) + 1);
    }

    const files = Array.from(byFile.entries()).map(([name, chunks]) => ({
      name,
      chunks,
    }));

    return NextResponse.json({
      files,
      totalFiles: files.length,
      totalChunks: data?.length ?? 0,
    });
  } catch (err) {
    console.error("Documents list error:", err);
    return NextResponse.json({ files: [], totalFiles: 0, totalChunks: 0 });
  }
}
