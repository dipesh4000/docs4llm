import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { startAppSession } from "@/lib/auth/start-app-session";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: string | null): string {
  if (!raw?.startsWith("/")) {
    return "/post-login";
  }
  if (raw.startsWith("//") || raw.startsWith("/auth/")) {
    return "/post-login";
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?error=missing_code`);
  }

  if (!isSupabasePublicConfigured()) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=auth_not_configured`
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    const message = encodeURIComponent(
      error?.message ?? "GitHub sign-in failed"
    );
    return NextResponse.redirect(
      `${origin}/auth/error?error=${message}&error_code=exchange_failed`
    );
  }

  const metadata = data.user.user_metadata ?? {};

  await startAppSession({
    id: data.user.id,
    email: data.user.email,
    name:
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      (typeof metadata.user_name === "string" && metadata.user_name) ||
      null,
    image:
      (typeof metadata.avatar_url === "string" && metadata.avatar_url) ||
      null,
  });

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
