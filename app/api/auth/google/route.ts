import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function safeRedirectUrl(raw: string | null): string | null {
  if (!raw?.startsWith("/") || raw.startsWith("//")) {
    return null;
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const redirectUrl = safeRedirectUrl(searchParams.get("redirectUrl"));

  if (!isSupabasePublicConfigured()) {
    const message = encodeURIComponent(
      "Auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then redeploy."
    );
    return NextResponse.redirect(`${origin}/login?error=${message}`);
  }

  const next = redirectUrl
    ? `/post-login?redirectUrl=${encodeURIComponent(redirectUrl)}`
    : "/post-login";
  const redirectTo = `${origin}/auth/oauth?next=${encodeURIComponent(next)}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data.url) {
    const message = encodeURIComponent(
      error?.message ?? "Google sign-in failed"
    );
    return NextResponse.redirect(`${origin}/login?error=${message}`);
  }

  return NextResponse.redirect(data.url);
}
