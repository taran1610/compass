"use client";

import { Upload, Brain, Target, FileText } from "lucide-react";

const STEPS = [
  {
    icon: Upload,
    title: "Upload",
    description: "Import customer interviews, support tickets, feature requests, and research documents.",
  },
  {
    icon: Brain,
    title: "Analyze",
    description: "AI detects recurring pain points, demand patterns, and market signals across your data.",
  },
  {
    icon: Target,
    title: "Detect",
    description: "Surface high-impact opportunities ranked by potential, confidence, and signal strength.",
  },
  {
    icon: FileText,
    title: "Generate",
    description: "Instantly produce structured PRDs, prioritized backlogs, and visual roadmaps.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-4 bg-[#0A0A0A]">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold tracking-[-0.02em] md:text-4xl text-center text-white">
          How It Works
        </h2>
        <p className="mt-6 text-lg text-[#9CA3AF] text-center tracking-tight">
          From raw feedback to clear product strategy in minutes.
        </p>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={i} className="relative group">
              <div className="flex flex-col rounded-2xl border border-[#1F1F1F] bg-white/[0.02] backdrop-blur-xl p-8 h-full transition-all duration-300 hover:border-[#6366F1]/30 hover:bg-white/[0.04] hover:shadow-[0_0_40px_-12px_rgba(99,102,241,0.15)]">
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#1F1F1F] bg-[#6366F1]/10 group-hover:bg-[#6366F1]/15 transition-colors">
                    <step.icon className="h-7 w-7 text-[#6366F1]" strokeWidth={1.5} />
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#6366F1] text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-semibold text-white tracking-tight">{step.title}</h3>
                <p className="mt-3 text-sm text-[#9CA3AF] leading-relaxed">{step.description}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 left-[calc(100%+12px)] w-[calc(50%-24px)] h-px bg-gradient-to-r from-[#6366F1]/30 to-transparent -translate-y-1/2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
