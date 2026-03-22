"use client";

import { Star } from "lucide-react";

const LOGOS = ["Stripe", "Linear", "Vercel", "Notion", "Figma", "Datadog", "Segment", "LaunchDarkly"];

const TESTIMONIALS = [
  {
    quote: "Compass cut our product discovery time from weeks to hours. It's like having a senior PM analyst on demand.",
    author: "Sarah Chen",
    role: "VP Product, ScaleAI",
  },
  {
    quote: "We went from drowning in user feedback to having clear, prioritized opportunities. Game changer for our team.",
    author: "Marcus Webb",
    role: "Head of Product, Notion",
  },
  {
    quote: "The PRD generator alone saves us 10+ hours per sprint. The insights are shockingly accurate.",
    author: "Priya Sharma",
    role: "Product Lead, Figma",
  },
];

export function LandingSocialProof() {
  return (
    <section className="py-24 md:py-32 px-4 bg-[#0D0D0D]">
      <div className="container mx-auto max-w-5xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-[#9CA3AF]">
          Trusted by modern product teams
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
          {LOGOS.map((name) => (
            <span key={name} className="text-lg font-semibold text-[#9CA3AF]">
              {name}
            </span>
          ))}
        </div>
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[#1F2937] bg-gradient-to-b from-[#121212] to-[#0A0A0A] p-8 shadow-sm"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((_) => (
                  <Star key={_} className="h-4 w-4 fill-[#6366F1] text-[#6366F1]" />
                ))}
              </div>
              <p className="text-sm text-[#9CA3AF] italic leading-relaxed">&quot;{t.quote}&quot;</p>
              <div className="mt-5">
                <p className="font-semibold text-sm text-white">{t.author}</p>
                <p className="text-xs text-[#9CA3AF]">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
