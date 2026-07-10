/**
 * Minimal robots.txt parser focused on what the crawler needs:
 *   - Allow / Disallow rules for our User-Agent (doc2mcp) and "*"
 *   - Sitemap declarations (for downstream sitemap discovery)
 *   - Crawl-delay (advisory; we already pace with the in-process queue)
 *
 * We honor robots.txt by default; the source URL itself is always allowed
 * (users explicitly requested that page).
 */

import { fetchWithRetry } from "./fetch-with-retry";

const USER_AGENT = "doc2mcp";

export type RobotsRules = {
  allow: string[];
  disallow: string[];
  sitemaps: string[];
  crawlDelayMs: number;
};

const EMPTY_RULES: RobotsRules = {
  allow: [],
  disallow: [],
  sitemaps: [],
  crawlDelayMs: 0,
};

export async function fetchRobotsRules(origin: string): Promise<RobotsRules> {
  const res = await fetchWithRetry(`${origin}/robots.txt`, {
    retries: 1,
    timeoutMs: 5000,
    headers: { Accept: "text/plain" },
  });
  if (!res.ok) {
    return EMPTY_RULES;
  }
  return parseRobotsTxt(res.text);
}

function parseRobotsTxt(text: string): RobotsRules {
  const rules: RobotsRules = {
    allow: [],
    disallow: [],
    sitemaps: [],
    crawlDelayMs: 0,
  };

  let active = false;
  let starRules: RobotsRules | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) {
      continue;
    }
    const colon = line.indexOf(":");
    if (colon === -1) {
      continue;
    }
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      if (value === "*") {
        active = false;
        if (!starRules) {
          starRules = {
            allow: [],
            disallow: [],
            sitemaps: [],
            crawlDelayMs: 0,
          };
        }
      } else if (value.toLowerCase() === USER_AGENT) {
        active = true;
      } else {
        active = false;
      }
      continue;
    }
    if (key === "sitemap") {
      rules.sitemaps.push(value);
      continue;
    }

    const target = active ? rules : starRules;
    if (!target) {
      continue;
    }

    if (key === "allow") {
      target.allow.push(value);
    } else if (key === "disallow") {
      if (value) {
        target.disallow.push(value);
      }
    } else if (key === "crawl-delay") {
      const seconds = Number(value);
      if (Number.isFinite(seconds) && seconds > 0) {
        target.crawlDelayMs = Math.min(seconds * 1000, 5000);
      }
    }
  }

  if (rules.disallow.length === 0 && rules.allow.length === 0 && starRules) {
    rules.allow = starRules.allow;
    rules.disallow = starRules.disallow;
    rules.crawlDelayMs = starRules.crawlDelayMs;
  }

  return rules;
}

function pathMatches(pattern: string, pathname: string): boolean {
  if (!pattern) {
    return false;
  }
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\$$/, "$");
  return new RegExp(`^${escaped}`).test(pathname);
}

/**
 * Should this URL be crawled per robots.txt?
 * The source URL is always allowed (caller responsibility).
 */
export function isPathAllowed(rules: RobotsRules, pathname: string): boolean {
  if (rules.disallow.length === 0) {
    return true;
  }
  const matchingAllow = rules.allow.find((p) => pathMatches(p, pathname));
  const matchingDisallow = rules.disallow.find((p) => pathMatches(p, pathname));
  if (!matchingDisallow) {
    return true;
  }
  if (!matchingAllow) {
    return false;
  }
  return matchingAllow.length >= matchingDisallow.length;
}
