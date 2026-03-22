"use client";

import { MessageSquare, Mail, ListChecks, FileSearch } from "lucide-react";

const SOURCES = [
  { icon: MessageSquare, label: "Customer interviews" },
  { icon: Mail, label: "Support tickets" },
  { icon: ListChecks, label: "Feature requests" },
  { icon: FileSearch, label: "Research documents" },
];

export function LandingProblem() {
  return (
    <section id="problem" className="py-24 md:py-32 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center text-white">
          Product teams are{" "}
          <span className="text-[#6366F1]">
            drowning in feedback
          </span>
          .
        </h2>
        <p className="mt-6 text-lg text-[#9CA3AF] text-center max-w-2xl mx-auto leading-relaxed">
          Product managers spend weeks manually analyzing scattered data. Compass automates this entire process.
        </p>
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {SOURCES.map((item) => (
            <div
              key={item.label}
              className="group rounded-2xl border border-[#1F2937] bg-gradient-to-b from-[#121212] to-[#0A0A0A] p-8 text-center transition-all hover:border-[#6366F1]/30 hover:shadow-lg hover:shadow-[#6366F1]/5"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#1F2937] bg-[#6366F1]/10 text-[#6366F1] group-hover:bg-[#6366F1]/20 transition-colors">
                <item.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <p className="mt-4 font-medium text-sm text-white">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
