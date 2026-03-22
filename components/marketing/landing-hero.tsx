"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 pt-24 pb-32 md:pt-32 md:pb-40 bg-[#0A0A0A]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.1),transparent_50%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_80%_50%,rgba(99,102,241,0.05),transparent)]" />
      <div className="container mx-auto max-w-5xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#1F1F1F] bg-white/[0.02] backdrop-blur-md px-4 py-1.5 text-sm text-[#6366F1] mb-10 tracking-tight font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6366F1] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#6366F1]" />
          </span>
          Now in Public Beta
        </div>
        <h1 className="text-4xl font-bold tracking-[-0.02em] sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.08]">
          AI That Tells Product Teams{" "}
          <span className="bg-gradient-to-r from-[#6366F1] via-[#A78BFA] to-[#6366F1] bg-clip-text text-transparent font-bold">
            What to Build Next
          </span>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg md:text-xl text-[#9CA3AF] leading-relaxed tracking-tight">
          Upload customer interviews, usage data, support tickets, and feature requests. AI finds patterns and tells you exactly{" "}
          <span className="text-[#A5B4FC]">what to build next</span>
          {" "}— evidence-based roadmaps, no opinions or loudest-voice bias.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="h-12 px-8 text-base bg-[#6366F1] hover:bg-[#5558E3] text-white border-0 font-medium tracking-tight shadow-lg shadow-[#6366F1]/25 hover:shadow-[#6366F1]/30 transition-shadow"
            >
              Start Free →
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base border-[#1F1F1F] bg-white/[0.02] text-[#9CA3AF] hover:text-white hover:bg-white/[0.06] hover:border-[#2a2a2a] backdrop-blur-sm tracking-tight"
          >
            <Play className="mr-2 h-4 w-4" />
            Watch Demo
          </Button>
        </div>
        <p className="mt-6 text-sm text-[#6B7280] tracking-tight">
          No credit card required • Set up in 2 minutes
        </p>
        <div className="mt-20">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
