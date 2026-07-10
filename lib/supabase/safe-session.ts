/**
 * Helpers for Supabase auth lookups that gracefully tolerate stale refresh
 * tokens. When a project's cookies were issued by a different domain or have
 * expired, Supabase logs noisy "Invalid Refresh Token" errors to the server
 * console even though the call resolves with a null session.
 *
 * These helpers:
 *   1. Treat AuthApiError(refresh_token_not_found) as "no session" instead
 *      of an unhandled error.
 *   2. Best-effort signOut to clear the bad cookies so subsequent requests
 *      stop tripping the refresh path.
 *   3. Suppress Supabase's own console.error within the call window so the
 *      terminal stays clean.
 */

import type { Session, User } from "@supabase/supabase-js";

/**
 * Structural subtype of @supabase/supabase-js `SupabaseClient.auth` — keeping
 * the dependency loose lets us reuse this helper with both the default and
 * Database-typed clients (`SupabaseClient<Database>`).
 */
type AuthLike = {
  auth: {
    getUser(): Promise<{
      data: { user: User | null };
      error: { code?: string; message?: string } | null;
    }>;
    getSession(): Promise<{
      data: { session: Session | null };
      error: { code?: string; message?: string } | null;
    }>;
    signOut(options?: { scope?: "local" | "global" | "others" }): Promise<{
      error: { code?: string; message?: string } | null;
    }>;
  };
};

const REFRESH_ERROR_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "invalid_refresh_token",
]);

type SupabaseAuthErrorShape = {
  code?: string;
  status?: number;
  message?: string;
  __isAuthError?: boolean;
};

function isRefreshTokenError(err: unknown): boolean {
  if (!err) {
    return false;
  }
  const e = err as SupabaseAuthErrorShape;
  if (e.code && REFRESH_ERROR_CODES.has(e.code)) {
    return true;
  }
  if (typeof e.message === "string" && /refresh token/i.test(e.message)) {
    return true;
  }
  return false;
}

/**
 * Temporarily mute console.error for refresh-token noise during a call.
 * Other errors still pass through.
 */
async function withMutedRefreshLogs<T>(fn: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = (...args: unknown[]) => {
    const first = args[0];
    const stringified =
      typeof first === "string"
        ? first
        : first && typeof first === "object" && "message" in first
          ? String((first as { message?: unknown }).message ?? "")
          : "";
    if (/refresh token/i.test(stringified)) {
      return;
    }
    original.apply(console, args as Parameters<typeof original>);
  };
  try {
    return await fn();
  } finally {
    console.error = original;
  }
}

/**
 * Get the current verified Supabase user. Returns null when there is no
 * valid session for any reason (no cookies, expired token, refresh failure).
 * Clears stale cookies on refresh-token failure.
 */
export async function getSafeUser(supabase: AuthLike): Promise<User | null> {
  return await withMutedRefreshLogs(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (isRefreshTokenError(error)) {
          await supabase.auth
            .signOut({ scope: "local" })
            .catch(() => undefined);
        }
        return null;
      }
      return data.user ?? null;
    } catch (err) {
      if (isRefreshTokenError(err)) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      }
      return null;
    }
  });
}

/**
 * Get the current Supabase session — convenience for places that already
 * destructured the user-shape from session.user (e.g. our auth() helper).
 * Behaves the same as getSafeUser w.r.t. error handling.
 */
export async function getSafeSession(supabase: AuthLike) {
  return await withMutedRefreshLogs(async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (isRefreshTokenError(error)) {
          await supabase.auth
            .signOut({ scope: "local" })
            .catch(() => undefined);
        }
        return null;
      }
      return data.session ?? null;
    } catch (err) {
      if (isRefreshTokenError(err)) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      }
      return null;
    }
  });
}
