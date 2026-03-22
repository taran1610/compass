import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ competitors: [{ id: "1", name: "Linear" }, { id: "2", name: "Jira" }, { id: "3", name: "Productboard" }] });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("competitors").select("*").order("name");

    if (error) throw error;
    return NextResponse.json({ competitors: data ?? [] });
  } catch (err) {
    console.error("Competitors fetch error:", err);
    return NextResponse.json({ competitors: [] });
  }
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from("competitors").insert({ name: name.trim() }).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Competitor add error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Add failed" },
      { status: 500 }
    );
  }
}
