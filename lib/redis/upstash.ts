/**
 * Upstash Redis client + ratelimit helpers.
 *
 * Wired in for two reasons:
 *
 *   1. Cross-lambda caching. The in-memory `createCache` in
 *      `lib/observability/cache.ts` is per-instance, so cold lambdas always
 *      miss. Upstash's REST API works from Edge + Node runtimes with zero
 *      pooling, so cached values survive scale-out and redeploys.
 *
 *   2. Per-user / per-IP rate limiting for the MCP and ingestion routes.
 *      The Vercel Hobby plan gives us no built-in WAF — without ratelimit
 *      a single attacker can burn through Gemini budget in
 *      minutes.
 *
 * Free tier (Upstash, no-auth REST): 10 k commands/day, 256 MB storage.
 * Both are plenty for doc2mcp's current scale, but we expose
 * `isUpstashConfigured()` so callers can gracefully degrade to local
 * fallbacks when the env vars are missing (e.g., during local dev).
 *
 * Required env vars (set via the Vercel ↔ Upstash marketplace integration):
 *
 *   - UPSTASH_REDIS_REST_URL
 *   - UPSTASH_REDIS_REST_TOKEN
 *
 * Both are picked up automatically by the SDK via `Redis.fromEnv()` but
 * we wrap it so we can also be tolerant of misconfiguration in prod.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
let _checked = false;

/**
 * Resolve the Upstash REST URL + token from whichever naming convention is
 * present in the environment.
 *
 *   1. `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — what
 *      `Redis.fromEnv()` expects and what we document in `.env.example`.
 *   2. `KV_REST_API_URL` / `KV_REST_API_TOKEN` — what the Vercel ↔ Upstash
 *      marketplace integration auto-injects (legacy Vercel KV naming).
 *
 * We accept both so the marketplace integration "just works" without the
 * user manually renaming env vars in the Vercel dashboard.
 */
function resolveUpstashCreds(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!(url && token)) {
    return null;
  }
  return { url, token };
}

export function isUpstashConfigured(): boolean {
  return resolveUpstashCreds() !== null;
}

/**
 * Returns a singleton Upstash Redis client, or `null` if env vars are
 * missing. Callers MUST handle the null case and fall back to the local
 * in-memory cache to keep local dev + previews working without Upstash.
 */
export function getRedis(): Redis | null {
  if (_checked) {
    return _redis;
  }
  _checked = true;
  const creds = resolveUpstashCreds();
  if (!creds) {
    return null;
  }
  _redis = new Redis({ url: creds.url, token: creds.token });
  return _redis;
}

/**
 * Build a sliding-window ratelimiter. Returns `null` when Upstash isn't
 * configured so callers can short-circuit gracefully.
 *
 * Usage:
 *
 * ```ts
 * const limiter = getRatelimiter("mcp:ask", 30, "1 m");
 * if (limiter) {
 *   const { success, reset } = await limiter.limit(`user:${userId}`);
 *   if (!success) {
 *     return Response.json({ error: "rate_limited", reset }, { status: 429 });
 *   }
 * }
 * ```
 *
 * @param name      Stable identifier used as the analytics prefix + Redis
 *                  key namespace; pick one per route.
 * @param max       Max requests inside the window.
 * @param window    Window string accepted by @upstash/ratelimit (e.g.,
 *                  "10 s", "1 m", "1 h"). Sliding window is used by
 *                  default for smoother quotas than fixed windows.
 */
export function getRatelimiter(
  name: string,
  max: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
): Ratelimit | null {
  const redis = getRedis();
  if (!redis) {
    return null;
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    analytics: true,
    prefix: `rl:${name}`,
  });
}

/**
 * Best-effort distributed cache helper.
 *
 * Reads JSON from Redis; on miss runs `loader`, writes the result back
 * with TTL, then returns it. ALWAYS catches Redis errors and falls back
 * to running `loader` directly — under no circumstances should a Redis
 * outage take down a user-facing route.
 *
 * The value is JSON-serialised, so don't store anything that contains
 * BigInt, Date, Map, Set, or Buffer. For those, persist a serialisable
 * envelope.
 */
export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  const redis = getRedis();
  if (!redis) {
    return loader();
  }

  try {
    const hit = await redis.get<T>(key);
    if (hit !== null && hit !== undefined) {
      return hit;
    }
  } catch (error) {
    console.warn("upstash get failed", { key, error });
  }

  const fresh = await loader();

  // Fire-and-forget write; don't block the response on Redis being slow.
  try {
    await redis.set(key, fresh, { ex: ttlSeconds });
  } catch (error) {
    console.warn("upstash set failed", { key, error });
  }

  return fresh;
}
