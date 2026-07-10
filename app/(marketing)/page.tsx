import { Suspense } from "react";
import { CliSection } from "@/components/landing/cli-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { EnterpriseSection } from "@/components/landing/enterprise-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FooterSection } from "@/components/landing/footer-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSectionClient } from "@/components/landing/how-it-works-client";
import { LandingNavigation } from "@/components/landing/navigation";
import { LandingNavigationServer } from "@/components/landing/navigation-server";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProblemSectionClient } from "@/components/landing/problem-section-client";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { ToolsStripSection } from "@/components/landing/tools-strip-section";
import { UseCasesSection } from "@/components/landing/use-cases-section";
import { WhyNowSection } from "@/components/landing/why-now-section";
import { WhyTeamsSection } from "@/components/landing/why-teams-section";
import { LandingTour } from "@/components/onboarding/landing-tour";
import { PlatformSection } from "@/components/platform-section";

export default function Page() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden noise-overlay">
      <Suspense fallback={<LandingNavigation session={null} />}>
        <LandingNavigationServer />
      </Suspense>
      <LandingTour />
      <HeroSection />
      <ToolsStripSection />
      <Suspense
        fallback={
          <section className="relative h-[600px] border-border/30 border-y bg-background" />
        }
      >
        <ProblemSectionClient />
      </Suspense>
      <Suspense
        fallback={<section className="relative h-[600px] bg-background" />}
      >
        <HowItWorksSectionClient />
      </Suspense>
      <PlatformSection />
      <TestimonialsSection />
      <WhyTeamsSection />
      <UseCasesSection />
      <ComparisonSection />
      <EnterpriseSection />
      <WhyNowSection />
      <CliSection />
      <PricingSection />
      <FaqSection />
      <FooterSection />
    </main>
  );
}
