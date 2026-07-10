/**
 * Aggressive OpenAPI / Swagger / GraphQL schema discovery.
 *
 * Given any docs URL, we probe a curated list of well-known spec endpoints
 * (relative to the origin and the docs path) and return the first matching
 * machine-readable spec. This is the single highest-leverage upgrade to MCP
 * generation quality: deterministic endpoint/parameter extraction from a
 * verified spec is always more accurate than AI-extracted endpoints from HTML.
 */

import { createCache } from "@/lib/observability/cache";
import type { CrawlResult } from "@/types/platform";
import { expandOpenApiSpec, parseOpenApiText } from "./openapi-source";

const discoveryCache = createCache<CrawlResult[]>({
  name: "openapi-discovery",
  max: 128,
  ttlMs: 30 * 60_000,
});

const PROBE_PATHS = [
  "/openapi.json",
  "/openapi.yaml",
  "/openapi.yml",
  "/swagger.json",
  "/swagger.yaml",
  "/swagger.yml",
  "/api-docs",
  "/api-docs.json",
  "/api/openapi.json",
  "/api/swagger.json",
  "/api/v1/openapi.json",
  "/api/v2/openapi.json",
  "/v1/openapi.json",
  "/v2/openapi.json",
  "/docs/openapi.json",
  "/docs/swagger.json",
  "/spec",
  "/spec.json",
  "/spec.yaml",
  "/.well-known/openapi",
  "/swagger-ui/swagger.json",
];

const PROBE_TIMEOUT_MS = 4000;

type Probe = {
  url: string;
  text: string;
};

async function fetchProbe(url: string): Promise<Probe | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        Accept:
          "application/json, application/yaml, text/yaml, application/x-yaml, */*;q=0.5",
        "User-Agent": "doc2mcp/1.0 (+https://doc2mcp.site)",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) {
      return null;
    }
    const text = await res.text();
    if (!text || text.length < 32) {
      return null;
    }
    return { url, text };
  } catch {
    return null;
  }
}

function looksLikeOpenApi(text: string): boolean {
  const head = text.slice(0, 4000).trim();
  if (head.startsWith("{")) {
    return /"(openapi|swagger)"\s*:/.test(head) && /"paths"\s*:/.test(head);
  }
  return /^(openapi|swagger)\s*:\s*['"]?[0-9]/m.test(head);
}

/**
 * Probe the given origin for an OpenAPI / Swagger spec and expand it into
 * one CrawlResult per endpoint plus an overview. Returns an empty array if
 * no spec is discovered.
 */
export async function discoverOpenApiSpec(
  sourceUrl: string
): Promise<CrawlResult[]> {
  let origin: string;
  let docsPath: string;
  try {
    const parsed = new URL(sourceUrl);
    origin = parsed.origin;
    docsPath = parsed.pathname.replace(/\/$/, "");
  } catch {
    return [];
  }

  const cacheKey = `${origin}|${docsPath}`;
  return await discoveryCache.wrap(cacheKey, async () => {
    const candidates = new Set<string>();
    for (const path of PROBE_PATHS) {
      candidates.add(`${origin}${path}`);
      if (docsPath && docsPath !== "/" && !docsPath.endsWith(path)) {
        candidates.add(`${origin}${docsPath}${path}`);
      }
    }

    const probes = await Promise.all(
      Array.from(candidates).map((url) => fetchProbe(url))
    );

    for (const probe of probes) {
      if (!probe) {
        continue;
      }
      if (!looksLikeOpenApi(probe.text)) {
        continue;
      }
      const spec = parseOpenApiText(probe.text);
      if (spec?.paths && Object.keys(spec.paths).length > 0) {
        return expandOpenApiSpec(spec, probe.url);
      }
    }

    return [];
  });
}

/**
 * Lightweight check: did discovery hit a usable spec? Used in logs.
 */
export function describeDiscoveredSpec(crawl: CrawlResult[]): string | null {
  if (crawl.length === 0) {
    return null;
  }
  const overview = crawl[0];
  if (!overview?.url) {
    return null;
  }
  return `${overview.url} (${crawl.length - 1} endpoints)`;
}
