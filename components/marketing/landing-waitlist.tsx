"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Loader2 } from "lucide-react";

export function LandingWaitlist() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="waitlist" className="py-24 md:py-32 px-4 scroll-mt-20">
      <div className="container mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-white">
          Ready to build smarter?
        </h2>
        <p className="mt-6 text-[#9CA3AF]">
          Join the waitlist and be the first to experience AI-powered product intelligence.
        </p>
        {submitted ? (
          <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-emerald-400">
            <Check className="h-5 w-5 shrink-0" />
            <span className="font-medium">You&apos;re on the list! We&apos;ll be in touch.</span>
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center gap-3">
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md w-full">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 flex-1 bg-white/5 border-[#1F2937] text-white placeholder:text-[#6B7280]"
              disabled={loading}
              required
            />
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 px-8 bg-[#6366F1] hover:bg-[#5558E3] text-white border-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Join Waitlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          </div>
        )}
      </div>
    </section>
  );
}
