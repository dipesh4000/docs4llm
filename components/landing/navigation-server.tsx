import { auth } from "@/app/(auth)/auth";
import {
  LandingNavigation,
  type LandingSessionInfo,
} from "@/components/landing/navigation";
import { isAdminEmail } from "@/lib/admin/admin-access";

/**
 * Server wrapper around <LandingNavigation/> — resolves the current session
 * on the server so the marketing nav can render a personalized profile chip
 * without any client-side flash.
 */
export async function LandingNavigationServer() {
  const session = await auth();

  let info: LandingSessionInfo = null;
  // Treat only real (non-guest) accounts as logged in. Anonymous visitors get
  // a synthesized `guest-…` email, and must still see Sign in / Sign up.
  if (session?.user?.email && session.user.type === "regular") {
    info = {
      email: session.user.email,
      name: session.user.name ?? null,
      initial: (
        (session.user.name?.trim()?.[0] || session.user.email[0]) ??
        "?"
      ).toUpperCase(),
      plan: "free",
      isAdmin: isAdminEmail(session.user.email),
    };
  }

  return <LandingNavigation session={info} />;
}
