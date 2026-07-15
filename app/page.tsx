"use client";

import { SiteNav } from "./site-nav";
import { HeroSection } from "./hero-section";
import { StatsSection } from "./stats-section";
import { HowItWorksSection } from "./how-it-works-section";
import { DemosSection } from "./demos-section";
import { CompareBlock } from "./compare-section";
import { FeaturesGrid } from "./features-section";
import { PricingSection } from "./pricing-section";
import { FaqSection } from "./faq-section";
import { FinalCtaSection } from "./final-cta-section";
import { SiteFooter } from "./site-footer";

function LandingContent() {
  return (
    <>
      <SiteNav />
      <main className="relative overflow-hidden">
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <DemosSection />

        <section className="mx-auto max-w-6xl px-6 py-28">
          <CompareBlock />
          <FeaturesGrid />
        </section>

        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
        <SiteFooter />
      </main>
    </>
  );
}

export default function LandingPage() {
  return <LandingContent />;
}
