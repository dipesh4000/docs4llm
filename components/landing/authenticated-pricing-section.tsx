import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { PricingSection } from "@/components/landing/pricing-section";

async function PricingSectionWithAuth({
  detailed = false,
}: {
  detailed?: boolean;
}) {
  const session = await auth();
  const initiallyAuthenticated =
    !!session?.user?.id && session.user.type !== "guest";

  return (
    <PricingSection
      detailed={detailed}
      initiallyAuthenticated={initiallyAuthenticated}
    />
  );
}

export function AuthenticatedPricingSection({
  detailed = false,
}: {
  detailed?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <PricingSection detailed={detailed} initiallyAuthenticated={false} />
      }
    >
      <PricingSectionWithAuth detailed={detailed} />
    </Suspense>
  );
}
