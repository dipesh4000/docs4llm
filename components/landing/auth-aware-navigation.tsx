import { Suspense } from "react";
import { LandingNavigation } from "@/components/landing/navigation";
import { LandingNavigationServer } from "@/components/landing/navigation-server";

export function AuthAwareLandingNavigation() {
  return (
    <Suspense fallback={<LandingNavigation session={null} />}>
      <LandingNavigationServer />
    </Suspense>
  );
}
