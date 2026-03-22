/**
 * Seed script for demo market signals.
 * Run: npx tsx scripts/seed-market-signals.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, OPENAI_API_KEY
 */

const SAMPLE_SIGNALS = [
  { source: "reddit" as const, content: "I really wish AI coding tools could debug my code, not just generate it. When something breaks I have to manually trace through.", topic: "AI debugging" },
  { source: "reddit" as const, content: "Local AI models are the future. I don't want my code leaving my machine for privacy reasons.", topic: "Local AI" },
  { source: "x" as const, content: "The biggest gap in AI dev tools: they generate fast but debugging is still manual. Someone fix this.", topic: "AI debugging" },
  { source: "product_reviews" as const, content: "Great for generation but we need API access to integrate with our CI/CD pipeline.", topic: "API access" },
  { source: "startup_forum" as const, content: "Developers are increasingly demanding local model support. Privacy and compliance are driving this.", topic: "Local AI" },
  { source: "reddit" as const, content: "Jira is so complex. We switched to Linear but still miss some features. AI prioritization would be huge.", topic: "Project management" },
  { source: "x" as const, content: "Productboard is slow. Automated roadmap generation from user feedback would save us hours.", topic: "Roadmap" },
  { source: "community" as const, content: "Real-time collaboration with AI that understands multiple cursors would be a game changer for pair programming.", topic: "Collaboration" },
  { source: "reddit" as const, content: "Custom model fine-tuning on our codebase would make suggestions 10x better. Right now it's generic.", topic: "Fine-tuning" },
  { source: "product_reviews" as const, content: "Response time matters. Streaming helps but generation is still too slow for iterative workflows.", topic: "Performance" },
];

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/market/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signals: SAMPLE_SIGNALS }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Ingest failed");
  console.log("Seeded", data.inserted, "market signals");
}

main().catch(console.error);
