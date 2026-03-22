"use client";

import {
  BarChart3,
  Lightbulb,
  ListOrdered,
  Map,
  FileText,
  Globe,
  FlaskConical,
} from "lucide-react";

const FEATURES = [
  {
    icon: BarChart3,
    title: "AI Insights Dashboard",
    description: "Detect recurring pain points and feature demand across all your data sources.",
  },
  {
    icon: Lightbulb,
    title: "Opportunity Detection",
    description: "Automatically surface high-impact product opportunities ranked by confidence.",
  },
  {
    icon: ListOrdered,
    title: "Feature Prioritization",
    description: "RICE scoring combined with AI-powered demand signals for smarter decisions.",
  },
  {
    icon: Map,
    title: "Roadmap Builder",
    description: "Create Now / Next / Later product roadmaps aligned with real user needs.",
  },
  {
    icon: FileText,
    title: "PRD Generator",
    description: "Generate structured product requirement documents instantly from insights.",
  },
  {
    icon: Globe,
    title: "Market Intelligence",
    description: "Track market trends, community discussions, and competitor gaps automatically.",
  },
  {
    icon: FlaskConical,
    title: "Decision Lab",
    description: "Simulate the impact of product ideas before committing engineering resources.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 md:py-32 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center text-white">
          Everything you need to{" "}
          <span className="text-[#6366F1]">
            build smarter
          </span>
          .
        </h2>
        <p className="mt-6 text-lg text-[#9CA3AF] text-center">
          A complete AI-powered toolkit for modern product teams.
        </p>
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-[#1F2937] bg-gradient-to-b from-[#121212] to-[#0A0A0A] p-8 transition-all hover:border-[#6366F1]/30 hover:shadow-lg hover:shadow-[#6366F1]/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#1F2937] bg-[#6366F1]/10 text-[#6366F1] group-hover:bg-[#6366F1]/20 transition-colors">
                <f.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 font-semibold text-white">{f.title}</h3>
              <p className="mt-3 text-sm text-[#9CA3AF] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
