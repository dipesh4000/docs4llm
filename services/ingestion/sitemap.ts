/**
 * sitemap.xml + sitemapindex discovery.
 *
 * Strategy:
 *   1. Fetch /sitemap.xml from origin (and /sitemap_index.xml).
 *   2. Detect <sitemapindex>: recursively fetch nested sitemaps.
 *   3. Detect <urlset>: extract <loc> values.
 *   4. Apply same-origin filter and docs-path heuristics.
 *
 * Bounded recursion to avoid runaway fan-out on huge sites.
 */

import { fetchWithRetry } from "./fetch-with-retry";

const SITEMAP_CANDIDATES = [
  "/sitemap.xml",
  "/sitemap_index.xml",
  "/sitemap-index.xml",
  "/wp-sitemap.xml",
];

const MAX_NESTED_SITEMAPS = 6;
const MAX_URLS_PER_SITEMAP = 5000;

function extractLocs(xml: string): string[] {
  const matches = xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi);
  return Array.from(matches, (m) => m[1] ?? "").filter(Boolean);
}

function isSitemapIndex(xml: string): boolean {
  return /<sitemapindex[\s>]/i.test(xml);
}

async function fetchSitemap(url: string): Promise<string | null> {
  const res = await fetchWithRetry(url, {
    headers: { Accept: "application/xml, text/xml, */*;q=0.1" },
    retries: 1,
    timeoutMs: 8000,
  });
  if (!res.ok) {
    return null;
  }
  if (!res.text.includes("<")) {
    return null;
  }
  return res.text;
}

/**
 * Discover URLs declared in sitemap.xml. Returns an empty array if no
 * sitemap exists or none could be fetched.
 */
export async function discoverSitemapUrls(
  origin: string,
  extraSitemapUrls: string[] = []
): Promise<string[]> {
  const visited = new Set<string>();
  const urls = new Set<string>();
  const queue: string[] = [
    ...extraSitemapUrls,
    ...SITEMAP_CANDIDATES.map((p) => `${origin}${p}`),
  ];

  while (queue.length > 0 && visited.size < MAX_NESTED_SITEMAPS) {
    const url = queue.shift();
    if (!url || visited.has(url)) {
      continue;
    }
    visited.add(url);

    const xml = await fetchSitemap(url);
    if (!xml) {
      continue;
    }

    const locs = extractLocs(xml).slice(0, MAX_URLS_PER_SITEMAP);
    if (isSitemapIndex(xml)) {
      for (const loc of locs) {
        if (!visited.has(loc)) {
          queue.push(loc);
        }
      }
      continue;
    }

    for (const loc of locs) {
      urls.add(loc);
    }
  }

  return Array.from(urls);
}

/**
 * Score a URL by docs-affinity to prioritize crawl order. Higher = better.
 */
export function docsRelevanceScore(url: string): number {
  const lower = url.toLowerCase();
  let score = 0;
  if (/\/docs?\//.test(lower)) {
    score += 30;
  }
  if (/\/api\//.test(lower)) {
    score += 25;
  }
  if (/\/reference\//.test(lower)) {
    score += 20;
  }
  if (/\/guide\b/.test(lower)) {
    score += 15;
  }
  if (/\/(?:getting-started|quickstart|tutorial)\b/.test(lower)) {
    score += 12;
  }
  if (/\/blog\//.test(lower)) {
    score -= 20;
  }
  if (/\/(news|press|jobs|careers|legal|privacy|terms)\b/.test(lower)) {
    score -= 30;
  }
  if (/\.(png|jpg|jpeg|gif|svg|webp|mp4|pdf|zip)$/.test(lower)) {
    score -= 50;
  }
  if (/^https?:\/\/[^/]+\/?$/.test(lower)) {
    score += 5;
  }
  return score;
}
