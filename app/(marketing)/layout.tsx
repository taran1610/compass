import { LandingNav } from "@/components/marketing/landing-nav";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { WaitlistPopup } from "@/components/marketing/waitlist-popup";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-white font-[var(--font-inter),system-ui,sans-serif]">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <LandingFooter />
      <WaitlistPopup />
    </div>
  );
}
