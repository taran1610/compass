"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader2 } from "lucide-react";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "For individual product managers",
    price: "$29",
    period: "/month",
    cta: "Start Free Trial",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER ?? "",
    highlight: false,
    features: [
      "1 workspace",
      "500 signal uploads/mo",
      "AI Insights Dashboard",
      "5 PRDs/month",
      "Email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For product teams",
    price: "$79",
    period: "/month",
    cta: "Start Free Trial",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO ?? "",
    highlight: true,
    features: [
      "Unlimited workspaces",
      "Unlimited signal uploads",
      "Opportunity Detection",
      "Roadmap Builder",
      "Unlimited PRDs",
      "Priority support",
      "Team collaboration",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations at scale",
    price: "Custom",
    period: "",
    cta: "Contact Sales",
    priceId: null,
    highlight: false,
    features: [
      "Everything in Pro",
      "SSO & SAML",
      "Custom integrations",
      "Dedicated CSM",
      "SLA guarantees",
      "On-prem deployment",
    ],
  },
];

export function LandingPricing() {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: (typeof PLANS)[number]) => {
    if (!plan.priceId) return;

    if (!user) {
      window.location.href = "/login?next=/";
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, plan: plan.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Checkout failed");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="py-24 md:py-32 px-4">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-center text-white">
          Simple, transparent pricing.
        </h2>
        <p className="mt-6 text-[#9CA3AF] text-center">
          Start free. Scale as your team grows.
        </p>
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-[#6366F1]/50 bg-[#6366F1]/5 shadow-lg shadow-[#6366F1]/10"
                  : "border-[#1F2937] bg-gradient-to-b from-[#121212] to-[#0A0A0A]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#6366F1] px-4 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
              )}
              <h3 className="font-semibold text-lg text-white">{plan.name}</h3>
              <p className="mt-2 text-sm text-[#9CA3AF]">{plan.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">{plan.price}</span>
                <span className="text-[#9CA3AF]">{plan.period}</span>
              </div>
              <div className="mt-6">
                {plan.id === "enterprise" ? (
                  <Link href="mailto:sales@compass.ai?subject=Enterprise%20Plan" className="block">
                    <Button
                      className="w-full border-[#1F2937] bg-white/5 text-[#9CA3AF] hover:text-white hover:bg-white/10 backdrop-blur-sm"
                      variant="outline"
                      size="lg"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                ) : plan.priceId ? (
                  <Button
                    className={`w-full ${plan.highlight ? "bg-[#6366F1] hover:bg-[#5558E3] text-white border-0" : "border-[#1F2937] bg-white/5 text-[#9CA3AF] hover:text-white hover:bg-white/10 backdrop-blur-sm"}`}
                    variant={plan.highlight ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleCheckout(plan)}
                    disabled={!!loadingPlan}
                  >
                    {loadingPlan === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      plan.cta
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full border-[#1F2937] bg-white/5 text-[#9CA3AF] cursor-not-allowed"
                    variant="outline"
                    size="lg"
                    disabled
                  >
                    Configure Stripe
                  </Button>
                )}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#9CA3AF]">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
