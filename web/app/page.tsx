import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingNav } from "@/components/landing/landing-nav";
import { PricingCta } from "@/components/landing/pricing-cta";
import { TrialModalProvider } from "@/components/landing/trial-modal-context";
import { TrustBar } from "@/components/landing/trust-bar";
import { WhyRoleReady } from "@/components/landing/why-roleready";

export default function Home() {
  return (
    <TrialModalProvider>
      <div
        id="top"
        className="relative min-h-screen overflow-hidden bg-page bg-[radial-gradient(1200px_520px_at_82%_-6%,rgba(123,63,228,0.10),transparent_60%),radial-gradient(1000px_480px_at_6%_2%,rgba(46,91,240,0.10),transparent_58%)]"
      >
        <LandingNav />
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Features />
        <DashboardPreview />
        <WhyRoleReady />
        <PricingCta />
        <Footer />
      </div>
    </TrialModalProvider>
  );
}