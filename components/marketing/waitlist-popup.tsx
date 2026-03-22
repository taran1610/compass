"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, X } from "lucide-react";

const DISMISSED_KEY = "compass-waitlist-popup-dismissed";
const DELAY_MS = 7000;

export function WaitlistPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISSED_KEY) === "true") return;

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISSED_KEY, "true");
    }
  };

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

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      role="dialog"
      aria-label="Join waitlist"
      onClick={handleDismiss}
    >
      <div
        className="relative rounded-2xl border border-[#1F2937] bg-gradient-to-b from-[#121212] to-[#0A0A0A] shadow-2xl p-12 pr-16 w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-md p-2 text-[#9CA3AF] hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-emerald-400">
              <Check className="h-8 w-8 shrink-0" />
              <span className="text-xl font-medium">You&apos;re on the list! We&apos;ll be in touch.</span>
            </div>
            <Button
              onClick={handleDismiss}
              variant="outline"
              size="lg"
              className="border-[#1F2937] bg-white/5 text-[#9CA3AF] hover:text-white hover:bg-white/10"
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <p className="text-2xl font-semibold mb-2 text-white">Ready to build smarter?</p>
            <p className="text-base text-[#9CA3AF] mb-6">
              Join the waitlist and be first to experience AI-powered product intelligence.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 flex-1 text-base bg-white/5 border-[#1F2937] text-white placeholder:text-[#6B7280]"
                disabled={loading}
                required
              />
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-12 px-8 text-lg bg-[#6366F1] hover:bg-[#5558E3] text-white border-0 shrink-0"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Join Waitlist"
                )}
              </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
