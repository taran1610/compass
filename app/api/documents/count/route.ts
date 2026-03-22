import { NextResponse } from "next/server";
import { getDocumentCount, getDocumentCountBySource } from "@/lib/documents-count";

/**
 * GET /api/documents/count
 * Returns document count for determining if user has uploaded data.
 * New users (count=0) get hasData: true + isDemo: true so they see demo data.
 * `bySource`: unique files per upload source_type (see /api/upload).
 */
export async function GET() {
  try {
    const [count, bySource] = await Promise.all([
      getDocumentCount(),
      getDocumentCountBySource(),
    ]);
    // Always show dashboard: demo for new users, real data when they have docs
    return NextResponse.json({
      count,
      hasData: true,
      isDemo: count === 0,
      bySource,
    });
  } catch (err) {
    console.error("Documents count error:", err);
    return NextResponse.json({
      count: 0,
      hasData: true,
      isDemo: true,
      bySource: {},
    });
  }
}
