import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Waitlist is not configured" },
      { status: 503 }
    );
  }

  try {
    const { email } = await req.json();
    const trimmed = typeof email === "string" ? email.trim() : "";

    if (!trimmed) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(trimmed)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase
      .from("waitlist_signups")
      .insert({ email: trimmed });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: true, message: "You're already on the list!" }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "You're on the list! We'll be in touch.",
    });
  } catch (err) {
    console.error("Waitlist signup error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
