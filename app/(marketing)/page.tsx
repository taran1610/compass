import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingProblem } from "@/components/marketing/landing-problem";
import { LandingHowItWorks } from "@/components/marketing/landing-how-it-works";
import { LandingFeatures } from "@/components/marketing/landing-features";
import { LandingSocialProof } from "@/components/marketing/landing-social-proof";
import { LandingPricing } from "@/components/marketing/landing-pricing";
import { LandingAbout } from "@/components/marketing/landing-about";
import { LandingWaitlist } from "@/components/marketing/landing-waitlist";

export default function MarketingPage() {
  return (
    <>
      <LandingHero />
      <LandingProblem />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingSocialProof />
      <LandingPricing />
      <LandingAbout />
      <LandingWaitlist />
    </>
  );
}
