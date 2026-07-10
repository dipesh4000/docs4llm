/**
 * Resilient fetch with exponential backoff, jitter, and abort timeout.
 *
 * Retries on:
 *   - network errors (TypeError thrown by fetch)
 *   - 408, 425, 429, 500, 502, 503, 504
 *
 * Respects Retry-After response header when present (seconds or HTTP-date).
 */

import {
  canRequest,
  recordFailure,
  recordSuccess,
} from "@/lib/observability/circuit-breaker";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 400;
const USER_AGENT = "doc2mcp/1.0 (+https://doc2mcp.site)";

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export type FetchWithRetryOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  onAttempt?: (info: {
    attempt: number;
    url: string;
    status?: number;
    error?: string;
  }) => void;
};

export type FetchSuccess = {
  ok: true;
  status: number;
  url: string;
  text: string;
  contentType: string;
};

export type FetchFailure = {
  ok: false;
  url: string;
  status?: number;
  error: string;
};

export type FetchResult = FetchSuccess | FetchFailure;

function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * ms * 0.5);
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1000, 30_000);
  }
  const target = Date.parse(value);
  if (Number.isNaN(target)) {
    return null;
  }
  const delta = target - Date.now();
  return delta > 0 ? Math.min(delta, 30_000) : 0;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<FetchResult> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    baseDelayMs = DEFAULT_BASE_DELAY_MS,
    onAttempt,
    headers,
    ...init
  } = options;

  if (!canRequest(url)) {
    return { ok: false, url, error: "circuit_open" };
  }

  let attempt = 0;
  let lastError = "";
  let lastStatus: number | undefined;

  while (attempt <= retries) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          "User-Agent": USER_AGENT,
          ...(headers as Record<string, string> | undefined),
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timer);
      lastStatus = response.status;
      onAttempt?.({ attempt, url, status: response.status });

      if (response.ok) {
        const text = await response.text();
        recordSuccess(url);
        return {
          ok: true,
          status: response.status,
          url: response.url || url,
          text,
          contentType: response.headers.get("content-type") ?? "",
        };
      }

      if (!RETRYABLE_STATUS.has(response.status) || attempt > retries) {
        if (response.status >= 500 || response.status === 429) {
          recordFailure(url);
        }
        return {
          ok: false,
          url,
          status: response.status,
          error: `HTTP ${response.status}`,
        };
      }

      const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
      const delay = retryAfterMs ?? jitter(baseDelayMs * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : "unknown";
      onAttempt?.({ attempt, url, error: lastError });
      if (attempt > retries) {
        break;
      }
      const delay = jitter(baseDelayMs * 2 ** (attempt - 1));
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  recordFailure(url);
  return {
    ok: false,
    url,
    status: lastStatus,
    error: lastError || "max_retries_exceeded",
  };
}
