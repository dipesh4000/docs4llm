/**
 * Canonical endpoint deduplication.
 *
 * AI extraction routinely emits duplicates: same method + path with cosmetic
 * differences (trailing slashes, casing, concrete IDs in place of params).
 * We canonicalize each endpoint to `${METHOD} ${normalizedPath}` and keep
 * the richest variant (most metadata) per key.
 */

import type { ApiEndpoint } from "@/types/platform";

export type DedupeReport = {
  inputCount: number;
  uniqueCount: number;
  collapsed: number;
};

function normalizePath(path: string): string {
  if (!path) {
    return "/";
  }
  let p = path.trim();
  if (!p.startsWith("/")) {
    p = `/${p}`;
  }
  p = p.replace(/\/+$/g, "");
  if (p === "") {
    p = "/";
  }
  p = p.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, "{$1}");
  p = p.replace(/\/([0-9a-fA-F-]{8,})(?=\/|$)/g, "/{id}");
  p = p.replace(/\/(\d+)(?=\/|$)/g, "/{id}");
  return p.toLowerCase();
}

function richnessScore(e: ApiEndpoint): number {
  let score = 0;
  if (e.summary && e.summary.length > 4) {
    score += 4;
  }
  if (e.description && e.description.length > 16) {
    score += 6;
  }
  if (e.tags && e.tags.length > 0) {
    score += 2;
  }
  if (e.auth && e.auth !== "none") {
    score += 1;
  }
  return score;
}

export function dedupeEndpoints<T extends ApiEndpoint>(
  endpoints: T[]
): { endpoints: T[]; report: DedupeReport } {
  const byKey = new Map<string, T>();

  for (const e of endpoints) {
    const method = (e.method ?? "GET").toUpperCase();
    const key = `${method} ${normalizePath(e.path)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, e);
      continue;
    }
    if (richnessScore(e) > richnessScore(prev)) {
      const merged: T = {
        ...prev,
        ...e,
        tags: Array.from(new Set([...(prev.tags ?? []), ...(e.tags ?? [])])),
      };
      byKey.set(key, merged);
    }
  }

  const unique = Array.from(byKey.values()).map((e, i) => ({
    ...e,
    id: `endpoint-${i}`,
  }));

  return {
    endpoints: unique,
    report: {
      inputCount: endpoints.length,
      uniqueCount: unique.length,
      collapsed: endpoints.length - unique.length,
    },
  };
}

export function canonicalEndpointKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}
