import type { Metadata } from "next";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { AuthenticatedPricingSection } from "@/components/landing/authenticated-pricing-section";
import { FooterSection } from "@/components/landing/footer-section";

export const metadata: Metadata = {
  title: "Pricing — doc2mcp",
  description:
    "Free forever for tinkering. Starter ₹299, Pro ₹999, Team ₹2,999 per month. Razorpay checkout, INR pricing, monthly / 6-month / yearly cycles.",
};

export default function PricingPage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <AuthAwareLandingNavigation />
      <div className="h-24" />
      <AuthenticatedPricingSection detailed />
      <FooterSection />
    </main>
  );
}
