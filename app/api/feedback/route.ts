import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FEEDBACK_BUCKET = "feedback-images";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGES = 5;
const MAX_SIZE_MB = 5;

export async function POST(req: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Feedback is not configured" },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const text = formData.get("text");
    const userId = formData.get("userId");
    const trimmed = typeof text === "string" ? text.trim() : "";

    if (!trimmed) {
      return NextResponse.json(
        { error: "Feedback text is required" },
        { status: 400 }
      );
    }

    if (trimmed.length > 2000) {
      return NextResponse.json(
        { error: "Feedback must be 2000 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const imageUrls: string[] = [];

    // Handle image uploads
    const files = formData.getAll("images") as File[];
    const validFiles = files.filter(
      (f) => f && f.size > 0 && ALLOWED_TYPES.includes(f.type)
    );

    if (validFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed` },
        { status: 400 }
      );
    }

    for (const file of validFiles) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          { error: `Each image must be under ${MAX_SIZE_MB}MB` },
          { status: 400 }
        );
      }
    }

    if (validFiles.length > 0) {
      try {
        // Ensure bucket exists (service role can create)
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some((b) => b.name === FEEDBACK_BUCKET);
        if (!bucketExists && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          await supabase.storage.createBucket(FEEDBACK_BUCKET, {
            public: true,
            fileSizeLimit: MAX_SIZE_MB * 1024 * 1024,
          });
        }
      } catch {
        // Bucket may already exist or creation failed - continue
      }

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

        const { data, error } = await supabase.storage
          .from(FEEDBACK_BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          console.error("Storage upload error:", error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from(FEEDBACK_BUCKET)
          .getPublicUrl(data.path);
        imageUrls.push(urlData.publicUrl);
      }
    }

    const { error } = await supabase.from("user_feedback").insert({
      text: trimmed,
      image_urls: imageUrls,
      user_id: userId || null,
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Thanks for your feedback!",
    });
  } catch (err) {
    console.error("Feedback error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
