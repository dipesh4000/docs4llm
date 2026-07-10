/**
 * Per-host circuit breaker.
 *
 * Three states:
 *   - closed   → requests flow through. Failures counted in a rolling window.
 *   - open     → requests short-circuited for a cooldown period.
 *   - half_open → next single probe allowed; if it succeeds we re-close.
 *
 * Why: protects upstream APIs (and us) from hammering a dead/rate-limited
 * origin. Big improvement during sitemap/openapi probing.
 */

type CircuitState = "closed" | "open" | "half_open";

type HostBreaker = {
  host: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number;
  openedAt: number;
  windowStart: number;
};

const REGISTRY = new Map<string, HostBreaker>();

const DEFAULTS = {
  failureThreshold: 5,
  windowMs: 30_000,
  cooldownMs: 60_000,
};

function getOrCreate(host: string): HostBreaker {
  let breaker = REGISTRY.get(host);
  if (!breaker) {
    breaker = {
      host,
      state: "closed",
      failures: 0,
      successes: 0,
      lastFailureAt: 0,
      openedAt: 0,
      windowStart: Date.now(),
    };
    REGISTRY.set(host, breaker);
  }
  if (Date.now() - breaker.windowStart > DEFAULTS.windowMs) {
    breaker.failures = 0;
    breaker.windowStart = Date.now();
  }
  return breaker;
}

/**
 * Check if a request to this host should be allowed. Returns:
 *   - true   → fire away
 *   - false  → circuit is open, short-circuit
 */
export function canRequest(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return true;
  }
  const breaker = getOrCreate(host);
  if (breaker.state === "open") {
    if (Date.now() - breaker.openedAt > DEFAULTS.cooldownMs) {
      breaker.state = "half_open";
      return true;
    }
    return false;
  }
  return true;
}

export function recordSuccess(url: string): void {
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return;
  }
  const breaker = getOrCreate(host);
  breaker.successes += 1;
  if (breaker.state === "half_open") {
    breaker.state = "closed";
    breaker.failures = 0;
  }
}

export function recordFailure(url: string): void {
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return;
  }
  const breaker = getOrCreate(host);
  breaker.failures += 1;
  breaker.lastFailureAt = Date.now();
  if (breaker.state === "half_open") {
    breaker.state = "open";
    breaker.openedAt = Date.now();
    return;
  }
  if (breaker.failures >= DEFAULTS.failureThreshold) {
    breaker.state = "open";
    breaker.openedAt = Date.now();
  }
}

export type CircuitMetric = {
  host: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureAt: number | null;
};

export function getCircuitMetrics(): CircuitMetric[] {
  return Array.from(REGISTRY.values()).map((b) => ({
    host: b.host,
    state: b.state,
    failures: b.failures,
    successes: b.successes,
    lastFailureAt: b.lastFailureAt || null,
  }));
}

export function resetBreaker(host: string): void {
  REGISTRY.delete(host);
}
