const URL_PATTERN = /https?:\/\/[^\s<>"'`]+/i;

const TRAILING_PUNCTUATION = /[.,;:!?)\]}>'"`]+$/;

const INTENT_PATTERNS: RegExp[] = [
  /\b(?:build|make|create|generate|spin\s*up|cook|ship|turn|convert|transform|wrap|expose|index|crawl|ingest|scaffold|setup|deploy)\b/i,
  /\b(?:mcp|doc2mcp|tools?|toolkit|workflows?|agent|cursor)\b/i,
  /\bfrom\s+https?:\/\//i,
  /\bdocs?\s+(?:url|link|page|site)\b/i,
  /^(?:please|pls|kindly|can\s+you|could\s+you|i\s+want|i\s+need|gimme|give\s+me)\b/i,
];

const NEGATIVE_PATTERNS: RegExp[] = [
  /\b(?:summari[sz]e|explain|what\s+is|describe|tell\s+me\s+about|review|critique|compare(?!\s+to\s+arc)|opinion|thoughts?)\b/i,
];

function cleanUrl(raw: string): string | null {
  let candidate = raw.replace(TRAILING_PUNCTUATION, "");
  while (candidate.endsWith(")") || candidate.endsWith("]")) {
    candidate = candidate.slice(0, -1);
  }
  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Extract the first valid http(s) URL found anywhere in the text.
 * Returns null if no URL is present.
 */
export function extractDocsUrl(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(URL_PATTERN);
  if (!match) {
    return null;
  }
  return cleanUrl(match[0]);
}

export type Doc2McpIntent = {
  /** A docs URL found in the message, or null. */
  url: string | null;
  /** True when the message is clearly asking us to build/generate an MCP. */
  hasIntent: boolean;
  /** True when the URL is unambiguous (URL-only or URL with explicit intent). */
  shouldAutoConvert: boolean;
};

/**
 * Decide whether a user message is asking doc2mcp to convert a docs URL
 * into an MCP, even when the explicit toggle is off.
 *
 * Triggers:
 *   - the message is just a URL
 *   - the message contains a URL AND verbs like "build/make/generate" or nouns
 *     like "mcp/tools/agent"
 *   - the URL is clearly a docs source (github docs path, /docs, swagger, etc.)
 */
export function detectDoc2McpIntent(text: string): Doc2McpIntent {
  const url = extractDocsUrl(text);
  if (!url) {
    return { url: null, hasIntent: false, shouldAutoConvert: false };
  }

  const trimmed = text.trim();

  // URL-only messages: always auto-convert.
  if (trimmed === url || trimmed.replace(TRAILING_PUNCTUATION, "") === url) {
    return { url, hasIntent: true, shouldAutoConvert: true };
  }

  const lower = trimmed.toLowerCase();
  const intentSignals = INTENT_PATTERNS.filter((p) => p.test(lower)).length;
  const negativeSignals = NEGATIVE_PATTERNS.some((p) => p.test(lower));

  if (negativeSignals && intentSignals < 2) {
    return { url, hasIntent: false, shouldAutoConvert: false };
  }

  const looksLikeDocsUrl = isLikelyDocsUrl(url);

  // Strong intent: two or more verb/noun signals, or one signal + docs-y URL.
  if (intentSignals >= 2 || (intentSignals >= 1 && looksLikeDocsUrl)) {
    return { url, hasIntent: true, shouldAutoConvert: true };
  }

  return {
    url,
    hasIntent: intentSignals > 0,
    shouldAutoConvert: false,
  };
}

const DOCS_HOST_HINTS = [
  "docs.",
  "developer.",
  "developers.",
  "api.",
  "platform.",
  "guide.",
  "reference.",
  "learn.",
];

const DOCS_PATH_HINTS = [
  "/docs",
  "/doc/",
  "/documentation",
  "/api/",
  "/reference/",
  "/guides/",
  "/openapi",
  "/swagger",
];

const GITHUB_DOC_HINTS = ["/tree/", "/blob/", "/docs", "/wiki"];

function isLikelyDocsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();

    if (DOCS_HOST_HINTS.some((h) => host.startsWith(h))) {
      return true;
    }
    if (DOCS_PATH_HINTS.some((h) => path.includes(h))) {
      return true;
    }
    if (
      (host === "github.com" || host.endsWith(".github.com")) &&
      GITHUB_DOC_HINTS.some((h) => path.includes(h))
    ) {
      return true;
    }
    if (host.endsWith("github.io") || host.endsWith("readthedocs.io")) {
      return true;
    }
    if (
      path.endsWith(".md") ||
      path.endsWith(".mdx") ||
      path.endsWith(".yaml") ||
      path.endsWith(".yml") ||
      path.endsWith(".json")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
