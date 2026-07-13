import { headers } from "next/headers";
import { getDocs4LlmBaseUrl } from "@/lib/docs4llm/app-url";

/**
 * Resolve the origin of the *current* deployment for auth email redirects.
 *
 * On Vercel preview deployments the request host is a unique per-branch URL
 * (for example `docs4llm-git-feature-team.vercel.app`). Confirmation and
 * magic-link emails must point back to THAT host — not the configured
 * production URL — otherwise a developer testing a branch finishes login on
 * production and the session cookie never lands on the preview deployment.
 *
 * Resolution order:
 *   1. The live request host (`x-forwarded-host` / `host`). This is the exact
 *      deployment the user is on, whether production or a preview branch.
 *   2. `VERCEL_URL` — the per-deployment system env Vercel sets on every build,
 *      used when no request scope is available (background jobs, etc.).
 *   3. The configured production base URL as a final fallback.
 *
 * The resolved URL still has to be allow-listed in Supabase Auth → URL
 * Configuration → Redirect URLs (use a wildcard such as
 * `https://*-<team>.vercel.app/**`) for the redirect to be honoured.
 */
export async function getAuthOrigin(): Promise<string> {
  try {
    const headerList = await headers();
    const host =
      headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
    if (host) {
      const proto =
        headerList.get("x-forwarded-proto") ??
        (host.includes("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : "https");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() throws outside a request scope; fall through to env-based URLs.
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return getDocs4LlmBaseUrl();
}

/** Build the email-confirmation redirect target for the current deployment. */
export async function getConfirmRedirectUrl(next = "/chat"): Promise<string> {
  const origin = await getAuthOrigin();
  return `${origin}/auth/confirm?next=${encodeURIComponent(next)}`;
}
