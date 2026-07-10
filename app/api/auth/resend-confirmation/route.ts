import { NextResponse } from "next/server";
import { z } from "zod";
import { getConfirmRedirectUrl } from "@/lib/auth/redirect-url";
import { getRatelimiter } from "@/lib/redis/upstash";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  email: z.string().email(),
});

// In-memory fallback for local dev / previews without Upstash. Per-lambda
// only — production durability comes from the Upstash limiter below.
const inflight = new Map<string, number>();
const COOLDOWN_MS = 60_000;

// Distributed cooldown: one resend per email per 60s, shared across all
// serverless instances. Gracefully degrades to the in-memory map when
// Upstash isn't configured.
const resendLimiter = getRatelimiter("auth:resend", 1, "60 s");

async function isRateLimited(email: string): Promise<boolean> {
  if (resendLimiter) {
    const { success } = await resendLimiter.limit(`email:${email}`);
    return !success;
  }
  const last = inflight.get(email);
  if (last && Date.now() - last < COOLDOWN_MS) {
    return true;
  }
  inflight.set(email, Date.now());
  return false;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  if (await isRateLimited(email)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (!isSupabasePublicConfigured()) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const emailRedirectTo = await getConfirmRedirectUrl("/chat");

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    const status = error.status === 429 ? 429 : 400;
    return NextResponse.json(
      { error: error.message ?? "failed_to_resend" },
      { status }
    );
  }

  return NextResponse.json({ ok: true });
}
