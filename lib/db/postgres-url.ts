const DEFAULT_POOLER_HOST = "aws-1-ap-south-1.pooler.supabase.com";

function shouldUsePooler(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

/**
 * Supabase direct connections (db.*.supabase.co:5432) use IPv6 and fail on
 * Vercel. Rewrite to the Supavisor transaction pooler for serverless runtime.
 */
export function resolvePostgresUrl(raw?: string): string {
  const url = raw ?? process.env.POSTGRES_URL ?? "";
  if (!url) {
    return "";
  }

  if (!shouldUsePooler()) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const refMatch = parsed.hostname.match(/^db\.(.+)\.supabase\.co$/);
    const isDirect =
      refMatch !== null && (parsed.port === "5432" || parsed.port === "");

    if (isDirect) {
      const ref = refMatch[1];
      const poolerHost =
        process.env.SUPABASE_POOLER_HOST ?? DEFAULT_POOLER_HOST;

      parsed.username = `postgres.${ref}`;
      parsed.hostname = poolerHost;
      parsed.port = "6543";
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}
