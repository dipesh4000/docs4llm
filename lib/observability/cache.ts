/**
 * Tiny in-memory LRU cache with per-entry TTL + hit/miss metrics.
 *
 * Why not Redis: this runs on Vercel serverless. Each lambda instance has
 * its own memory, but instances are sticky enough that the LRU is still a
 * massive win for hot paths (OpenAPI probes, sitemap fetches, AI hints).
 *
 * Each `createCache(name)` call gets its own metric bucket exposed via
 * `getCacheMetrics()` for the observability dashboard.
 */

import { addSpanEvent } from "./tracing";

type Entry<V> = {
  value: V;
  expiresAt: number;
};

const REGISTRY = new Map<string, CacheBackend<unknown>>();

class CacheBackend<V> {
  readonly name: string;
  private readonly max: number;
  private readonly defaultTtlMs: number;
  private readonly store = new Map<string, Entry<V>>();
  hits = 0;
  misses = 0;
  evictions = 0;

  constructor(name: string, max: number, defaultTtlMs: number) {
    this.name = name;
    this.max = max;
    this.defaultTtlMs = defaultTtlMs;
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      this.misses += 1;
      return;
    }
    // refresh LRU order
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits += 1;
    addSpanEvent("cache.hit", { "cache.name": this.name, "cache.key": key });
    return entry.value;
  }

  set(key: string, value: V, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.max) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
        this.evictions += 1;
      }
    }
    this.store.set(key, { value, expiresAt });
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }

  reset(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }
}

export type Cache<V> = {
  readonly name: string;
  get(key: string): V | undefined;
  set(key: string, value: V, ttlMs?: number): void;
  delete(key: string): boolean;
  size(): number;
  wrap<T extends V>(
    key: string,
    fn: () => Promise<T>,
    ttlMs?: number
  ): Promise<T>;
};

export function createCache<V>(options: {
  name: string;
  max?: number;
  ttlMs?: number;
}): Cache<V> {
  const existing = REGISTRY.get(options.name);
  if (existing) {
    return wrapBackend(existing as CacheBackend<V>);
  }
  const backend = new CacheBackend<V>(
    options.name,
    options.max ?? 256,
    options.ttlMs ?? 5 * 60_000
  );
  REGISTRY.set(options.name, backend as CacheBackend<unknown>);
  return wrapBackend(backend);
}

function wrapBackend<V>(backend: CacheBackend<V>): Cache<V> {
  return {
    name: backend.name,
    get: (key) => backend.get(key),
    set: (key, value, ttl) => backend.set(key, value, ttl),
    delete: (key) => backend.delete(key),
    size: () => backend.size(),
    async wrap<T extends V>(
      key: string,
      fn: () => Promise<T>,
      ttlMs?: number
    ): Promise<T> {
      const cached = backend.get(key) as T | undefined;
      if (cached !== undefined) {
        return cached;
      }
      const value = await fn();
      backend.set(key, value as V, ttlMs);
      return value;
    },
  };
}

export type CacheMetrics = {
  name: string;
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
};

export function getCacheMetrics(): CacheMetrics[] {
  return Array.from(REGISTRY.values()).map((backend) => {
    const total = backend.hits + backend.misses;
    return {
      name: backend.name,
      size: backend.size(),
      hits: backend.hits,
      misses: backend.misses,
      hitRate: total === 0 ? 0 : Math.round((backend.hits / total) * 100),
      evictions: backend.evictions,
    };
  });
}
