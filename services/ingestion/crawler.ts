import { parseGitHubRepoUrl } from "@/lib/doc2mcp/detect-source-type";
import { discoverExtraDocUrls } from "@/lib/search/discover";
import type { CrawlResult, SourceType } from "@/types/platform";
import { CrawlQueue } from "./crawl-queue";
import { crawlGitHubRepo } from "./github-source";
import { discoverOpenApiSpec } from "./openapi-discovery";
import { expandOpenApiSpec, parseOpenApiText } from "./openapi-source";
import { contentHash, DuplicateFilter } from "./page-dedupe";
import { fetchRobotsRules, isPathAllowed } from "./robots";
import { discoverSitemapUrls } from "./sitemap";

// Tuned for Vercel Hobby's 60s lambda cap. The full pipeline (crawl +
// Gemini analyze + tool compression + DB writes) needs to fit in one
// invocation when QStash isn't configured, so we cap pages aggressively.
// On Pro/Enterprise (300s+), bump this back to 80 for breadth.
const MAX_PAGES = 40;
const PER_PAGE_CHARS = 50_000;
const FETCH_TIMEOUT_MS = 12_000;
const USER_AGENT = "doc2mcp/1.0 (+https://doc2mcp.site)";

/**
 * Number of pages to fetch concurrently from the same origin. Tuned for
 * polite crawling of documentation sites — most hosts are happy with 6
 * parallel reads, far fewer impose a global rate limit. Increase only if
 * you have measured the target host's tolerance.
 */
const HOST_CONCURRENCY = 6;

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * HTML → markdown-ish text that preserves code blocks, headings, links.
 * Used only as fallback when we can't get a .md source.
 */
function htmlToMarkdownish(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  text = text.replace(
    /<pre[^>]*>\s*<code[^>]*class="[^"]*language-([a-z0-9+#.-]+)[^"]*"[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi,
    (_m, lang: string, body: string) =>
      `\n\n\`\`\`${lang}\n${decodeEntities(body.replace(/<[^>]+>/g, ""))}\n\`\`\`\n\n`
  );

  text = text.replace(
    /<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    (_m, body: string) =>
      `\n\n\`\`\`\n${decodeEntities(body.replace(/<[^>]+>/g, ""))}\n\`\`\`\n\n`
  );

  text = text.replace(
    /<code[^>]*>([\s\S]*?)<\/code>/gi,
    (_m, body: string) => `\`${decodeEntities(body.replace(/<[^>]+>/g, ""))}\``
  );

  text = text.replace(
    /<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_m, level: string, body: string) =>
      `\n\n${"#".repeat(Number(level))} ${decodeEntities(body.replace(/<[^>]+>/g, "").trim())}\n\n`
  );

  text = text.replace(
    /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href: string, body: string) => {
      const label = decodeEntities(body.replace(/<[^>]+>/g, "").trim());
      return label ? `[${label}](${href})` : href;
    }
  );

  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n- $1");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<[^>]+>/g, " ");

  text = decodeEntities(text);

  return text
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match = hrefRegex.exec(html);
  while (match) {
    try {
      const url = new URL(match[1], baseUrl);
      if (url.origin === new URL(baseUrl).origin) {
        links.push(url.href.split("#")[0] ?? url.href);
      }
    } catch {
      // skip invalid URLs
    }
    match = hrefRegex.exec(html);
  }
  return [...new Set(links)];
}

function detectPageType(content: string, url: string): CrawlResult["type"] {
  const lower = content.toLowerCase();
  if (
    lower.includes("oauth") ||
    lower.includes("bearer") ||
    lower.includes("api key") ||
    url.includes("auth")
  ) {
    return "auth";
  }
  if (
    lower.includes("workflow") ||
    lower.includes("step") ||
    lower.includes("tutorial")
  ) {
    return "workflow";
  }
  if (
    lower.includes("endpoint") ||
    lower.includes("post /") ||
    lower.includes("get /") ||
    url.includes("api")
  ) {
    return "api";
  }
  return "page";
}

async function fetchText(
  url: string,
  accept = "text/html,application/json,text/markdown,text/plain"
): Promise<{ text: string; contentType: string; status: number } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: accept,
      },
    });
    if (!response.ok) {
      return null;
    }
    const text = await response.text();
    return {
      text,
      contentType: response.headers.get("content-type") ?? "",
      status: response.status,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Jina Reader — free service that renders any URL (including JS-heavy SPAs)
 * to clean markdown. No API key required for the free tier; setting
 * JINA_API_KEY only raises rate limits.
 */
async function fetchViaJinaReader(
  url: string
): Promise<{ title: string; content: string } | null> {
  const apiKey = process.env.JINA_API_KEY;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      signal: controller.signal,
      headers: {
        Accept: "text/markdown,text/plain",
        "User-Agent": USER_AGENT,
        "X-Return-Format": "markdown",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    });
    if (!response.ok) {
      return null;
    }
    const text = await response.text();
    if (!text || text.length < 200) {
      return null;
    }
    const title =
      firstHeading(text) ??
      text.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ??
      titleFromUrl(url);

    // Jina prefixes content with "Title:" and "URL Source:" lines — strip them
    const cleaned = text
      .replace(/^Title:\s*.+$/m, "")
      .replace(/^URL Source:\s*.+$/m, "")
      .replace(/^Markdown Content:\s*$/m, "")
      .trim();

    return { title, content: cleaned };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function looksLikeMarkdown(text: string, contentType: string): boolean {
  if (
    contentType.includes("markdown") ||
    contentType.includes("text/plain") ||
    contentType.includes("text/x-markdown")
  ) {
    return true;
  }
  const head = text.slice(0, 500).trimStart();
  if (head.startsWith("<!DOCTYPE") || head.startsWith("<html")) {
    return false;
  }
  if (head.startsWith("---")) {
    return true;
  }
  // Markdown almost always contains headings or code fences within the first 500 chars
  return /(^|\n)#{1,6}\s/.test(head) || head.includes("```");
}

function stripFrontmatter(md: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: md };
  }
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      meta[line.slice(0, idx).trim()] = line
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body: match[2] };
}

function firstHeading(md: string): string | null {
  const match = md.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() ?? null;
}

function titleFromUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    const last = segments.at(-1) ?? "page";
    return last
      .replace(/[-_]+/g, " ")
      .replace(/\.(md|mdx|html?)$/i, "")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return url;
  }
}

function dropExtension(url: string): string {
  return url.replace(/\.(md|mdx|html?)$/i, "");
}

/**
 * Try fetching a page as raw markdown first.
 * Many doc platforms (Mintlify, Docusaurus, GitBook, Nextra, etc.) expose
 * either `${url}.md`, `${url}.mdx`, `${url}/index.md`, or the URL itself
 * already returns markdown.
 */
async function fetchPageMarkdown(url: string): Promise<{
  title: string;
  content: string;
} | null> {
  const base = dropExtension(url.replace(/\/$/, ""));
  const candidates = [
    `${base}.md`,
    `${base}.mdx`,
    `${base}/index.md`,
    `${base}/llms.txt`,
  ];

  for (const candidate of candidates) {
    const res = await fetchText(
      candidate,
      "text/markdown,text/plain,text/x-markdown"
    );
    if (res && looksLikeMarkdown(res.text, res.contentType)) {
      const { meta, body } = stripFrontmatter(res.text);
      const title =
        meta.title ?? firstHeading(body) ?? titleFromUrl(url) ?? url;
      return { title, content: body };
    }
  }

  return null;
}

async function fetchPageHtml(url: string): Promise<{
  title: string;
  content: string;
  html: string;
} | null> {
  const res = await fetchText(url);
  if (!res) {
    return null;
  }
  const content = htmlToMarkdownish(res.text);
  const titleMatch = res.text.match(/<title[^>]*>([^<]+)<\/title>/i);
  const titleRaw = titleMatch?.[1]?.trim();
  const fromHeading = firstHeading(content);
  const title = fromHeading ?? titleRaw ?? titleFromUrl(url);
  return { title, content, html: res.text };
}

async function fetchOneDoc(
  url: string
): Promise<{ title: string; content: string; html?: string } | null> {
  // 1. Try the source's own .md / .mdx — works for Mintlify, Docusaurus, etc.
  const md = await fetchPageMarkdown(url);
  if (md && md.content.trim().length > 500) {
    return md;
  }

  // 2. HTML scrape with code-preserving extraction
  const html = await fetchPageHtml(url);

  // 3. If HTML is also thin (JS-rendered SPA shell), use Jina Reader (no key needed)
  const htmlLen = html?.content.trim().length ?? 0;
  if (htmlLen < 800) {
    const jina = await fetchViaJinaReader(url);
    if (jina && jina.content.trim().length > htmlLen) {
      return {
        title: jina.title,
        content: jina.content,
        html: html?.html,
      };
    }
  }

  if (html && htmlLen >= (md?.content.trim().length ?? 0)) {
    return html;
  }
  return md ?? html;
}

/**
 * Many products keep marketing on the apex domain and put real docs on a
 * docs.* subdomain. When users paste the marketing URL, prefer the docs root.
 */
const KNOWN_DOC_ALIASES: Record<string, string> = {
  "stripe.com": "https://docs.stripe.com",
  "openai.com": "https://platform.openai.com/docs",
  "platform.openai.com": "https://platform.openai.com/docs",
  "anthropic.com": "https://docs.anthropic.com",
  "claude.ai": "https://docs.anthropic.com",
  "langchain.com": "https://docs.langchain.com",
  "vercel.com": "https://vercel.com/docs",
  "supabase.com": "https://supabase.com/docs",
  "cloudflare.com": "https://developers.cloudflare.com",
  "developers.cloudflare.com": "https://developers.cloudflare.com",
  "github.com": "https://docs.github.com",
  "fetch.ai": "https://innovationlab.fetch.ai/resources/docs",
  "agentverse.ai": "https://innovationlab.fetch.ai/resources/docs",
  "discord.com": "https://discord.com/developers/docs",
  "shopify.com": "https://shopify.dev/docs",
  "twilio.com": "https://www.twilio.com/docs",
  "modelcontextprotocol.io": "https://modelcontextprotocol.io",
  "mcp.io": "https://modelcontextprotocol.io",
};

/**
 * Normalize a user-pasted URL to the canonical docs root.
 * - If user pasted apex domain or marketing path, redirect to known docs URL.
 * - Else try docs.<host> and developers.<host>; if reachable, use that.
 * - Else keep the original URL.
 */
async function normalizeDocsUrl(input: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return input;
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const baseHost = host.replace(
    /^(?:docs|developers|developer|platform)\./,
    ""
  );
  const path = parsed.pathname;

  // 1. Direct alias hit (apex or non-docs subdomain)
  const aliasKeys = [host, baseHost];
  for (const key of aliasKeys) {
    const alias = KNOWN_DOC_ALIASES[key];
    if (!alias) {
      continue;
    }
    try {
      const aliasUrl = new URL(alias);
      if (
        aliasUrl.hostname === parsed.hostname &&
        path.startsWith(aliasUrl.pathname)
      ) {
        // already on the canonical path, keep
        break;
      }
      // If user pasted apex root or a marketing path, switch to alias
      if (path === "/" || isMarketingPath(path)) {
        return alias;
      }
      // If user is already inside a docs path on the same host, keep
      if (aliasUrl.hostname === parsed.hostname) {
        return input;
      }
      // Different docs host known — prefer it
      return alias;
    } catch {
      // fall through
    }
  }

  // 2. Heuristic: try docs.<host> and developers.<host>
  if (path === "/" || isMarketingPath(path)) {
    const candidates = [
      `https://docs.${baseHost}`,
      `https://developers.${baseHost}`,
      `https://${baseHost}/docs`,
    ];
    for (const candidate of candidates) {
      const res = await fetchText(candidate);
      if (res && res.text.length > 500) {
        return candidate;
      }
    }
  }

  return input;
}

const MARKETING_BLOCKLIST = [
  "/pricing",
  "/blog",
  "/about",
  "/careers",
  "/jobs",
  "/customers",
  "/case-studies",
  "/case-study",
  "/testimonials",
  "/press",
  "/news",
  "/partners",
  "/partner",
  "/legal",
  "/privacy",
  "/terms",
  "/security",
  "/cookies",
  "/contact",
  "/sales",
  "/login",
  "/signin",
  "/sign-in",
  "/signup",
  "/sign-up",
  "/register",
  "/account",
  "/community",
  "/events",
  "/event/",
  "/podcasts",
  "/podcast/",
  "/webinars",
  "/team",
  "/leadership",
  "/investors",
  "/media",
  "/newsroom",
  "/use-cases",
  "/why-",
  "/compare",
  "/customers/",
  "/manifesto",
  "/affiliates",
];

function isMarketingPath(path: string): boolean {
  const lower = path.toLowerCase();
  for (const seg of MARKETING_BLOCKLIST) {
    const hitsSegment =
      lower === seg || lower.startsWith(`${seg}/`) || lower.includes(seg);
    const looksLikeDoc =
      lower.includes("/docs") ||
      lower.includes("/api") ||
      lower.includes("/reference") ||
      lower.includes("/guide") ||
      lower.includes("/sdk");
    if (hitsSegment && !looksLikeDoc) {
      return true;
    }
  }
  return false;
}

/**
 * Mintlify and similar platforms publish a list of all doc URLs at
 * /llms.txt. Try multiple common locations and the docs subdomain.
 */
async function fetchLlmsManifest(origin: string): Promise<string[]> {
  let host = "";
  try {
    host = new URL(origin).hostname.replace(/^www\./, "");
  } catch {
    // ignore
  }
  const baseHost = host.replace(
    /^(?:docs|developers|developer|platform)\./,
    ""
  );

  const candidates = new Set<string>([
    `${origin}/llms.txt`,
    `${origin}/llms-full.txt`,
    `${origin}/docs/llms.txt`,
  ]);
  if (baseHost && baseHost !== host) {
    candidates.add(`https://docs.${baseHost}/llms.txt`);
    candidates.add(`https://docs.${baseHost}/llms-full.txt`);
    candidates.add(`https://developers.${baseHost}/llms.txt`);
  }

  for (const url of candidates) {
    const res = await fetchText(url, "text/plain,text/markdown");
    if (!res?.text || res.text.length < 50) {
      continue;
    }
    const urls = new Set<string>();
    const lines = res.text.split("\n");
    for (const line of lines) {
      const linkMatches = line.matchAll(/\((https?:[^)\s]+)\)/g);
      for (const m of linkMatches) {
        if (m[1]) {
          urls.add(m[1]);
        }
      }
      const bareMatch = line.trim().match(/^(https?:\/\/\S+)$/);
      if (bareMatch?.[1]) {
        urls.add(bareMatch[1]);
      }
    }
    if (urls.size > 0) {
      return [...urls];
    }
  }
  return [];
}

const DOC_LINK_PATTERNS = [
  "/docs",
  "/doc/",
  "/api",
  "/api-reference",
  "/reference",
  "/guide",
  "/guides",
  "/developers",
  "/developer",
  "/documentation",
  "/swagger",
  "/openapi",
  "/quickstart",
  "/tutorial",
  "/tutorials",
  "/examples",
  "/example",
  "/concepts",
  "/learn",
  "/sdk",
  "/cli",
  "/integration",
  "/integrations",
  "/getting-started",
  "/intro",
  "/overview",
  "/agent",
  "/agents",
  "/resources",
];

function isDocLink(link: string, originPath: string): boolean {
  const lower = link.toLowerCase();
  if (isMarketingPath(lower)) {
    return false;
  }
  if (lower.endsWith(".md") || lower.endsWith(".mdx")) {
    return true;
  }
  if (/\/v\d+(?:\.\d+)?\//.test(lower)) {
    return true;
  }
  if (originPath && lower.includes(originPath.toLowerCase())) {
    return true;
  }
  return DOC_LINK_PATTERNS.some((p) => lower.includes(p));
}

interface PostmanRequestItem {
  name: string;
  request?: {
    method?: string;
    description?: string | { content?: string };
    url?: string | { raw?: string };
    body?: { raw?: string };
  };
  item?: PostmanRequestItem[];
}

function recursiveParsePostman(
  items: PostmanRequestItem[],
  results: CrawlResult[],
  sourceUrl: string
) {
  for (const item of items) {
    if (item.item && Array.isArray(item.item)) {
      recursiveParsePostman(item.item, results, sourceUrl);
    } else if (item.request) {
      const method = item.request.method ?? "GET";
      const desc =
        typeof item.request.description === "object"
          ? (item.request.description.content ?? "")
          : (item.request.description ?? "");
      const rawUrl =
        typeof item.request.url === "object"
          ? (item.request.url.raw ?? "")
          : (item.request.url ?? "");
      const body = item.request.body?.raw ?? "";

      const content = `### Endpoint: ${item.name}
Method: ${method}
URL: ${rawUrl}

Description:
${desc}

Request Body Schema:
\`\`\`json
${body}
\`\`\`
`;
      results.push({
        url: `${sourceUrl}#${encodeURIComponent(item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}`,
        title: item.name,
        content: content.slice(0, PER_PAGE_CHARS),
        type: "api",
      });
    }
  }
}

export async function crawlDocsSource(
  sourceUrl: string,
  sourceType: SourceType
): Promise<CrawlResult[]> {
  if (sourceType === "postman") {
    const res = await fetchText(sourceUrl, "application/json,text/plain");
    if (!res) {
      return [];
    }
    try {
      const collection = JSON.parse(res.text);
      if (collection && (collection.item || collection.info)) {
        const results: CrawlResult[] = [];
        recursiveParsePostman(collection.item ?? [], results, sourceUrl);
        if (results.length > 0) {
          return results;
        }
      }
    } catch {
      // fallback
    }
  }

  if (sourceType === "openapi") {
    const res = await fetchText(
      sourceUrl,
      "application/json,application/yaml,text/yaml,text/plain"
    );
    if (!res) {
      return [];
    }
    const spec = parseOpenApiText(res.text);
    if (spec?.paths && Object.keys(spec.paths).length > 0) {
      return expandOpenApiSpec(spec, sourceUrl);
    }
    return [
      {
        url: sourceUrl,
        title: spec?.info?.title ?? "API Specification",
        content: res.text.slice(0, PER_PAGE_CHARS),
        type: "api",
      },
    ];
  }

  if (sourceType === "github") {
    const repo = parseGitHubRepoUrl(sourceUrl);
    if (repo) {
      const repoResults = await crawlGitHubRepo(repo);
      if (repoResults.length > 0) {
        return repoResults.map((r) => ({
          ...r,
          content: r.content.slice(0, PER_PAGE_CHARS),
        }));
      }
    }
    // Fallback: single-file fetch
    const doc = await fetchOneDoc(sourceUrl);
    if (!doc) {
      return [];
    }
    return [
      {
        url: sourceUrl,
        title: doc.title,
        content: doc.content.slice(0, PER_PAGE_CHARS),
        type: "page",
      },
    ];
  }

  if (sourceType === "markdown") {
    const doc = await fetchOneDoc(sourceUrl);
    if (!doc) {
      return [];
    }
    return [
      {
        url: sourceUrl,
        title: doc.title,
        content: doc.content.slice(0, PER_PAGE_CHARS),
        type: "page",
      },
    ];
  }

  const normalizedSourceUrl = await normalizeDocsUrl(sourceUrl);

  if (sourceType === "url" || sourceType === "gitbook") {
    const specCrawl = await discoverOpenApiSpec(normalizedSourceUrl);
    if (specCrawl.length > 0) {
      return specCrawl;
    }
  }

  const sourceOrigin = (() => {
    try {
      return new URL(normalizedSourceUrl).origin;
    } catch {
      return "";
    }
  })();
  const sourcePath = (() => {
    try {
      const p = new URL(normalizedSourceUrl).pathname;
      return p.endsWith("/") ? p : p.replace(/\/[^/]+$/, "/");
    } catch {
      return "/";
    }
  })();

  const robots = sourceOrigin
    ? await fetchRobotsRules(sourceOrigin)
    : { allow: [], disallow: [], sitemaps: [], crawlDelayMs: 0 };

  const queue = new CrawlQueue(sourceOrigin || "", {
    maxDepth: 4,
    sameOrigin: true,
    sourcePathPrefix: sourcePath,
  });
  queue.enqueue({ url: normalizedSourceUrl, depth: 0, baseScore: 100 });

  if (sourceOrigin) {
    const sitemapUrls = await discoverSitemapUrls(
      sourceOrigin,
      robots.sitemaps
    );
    for (const url of sitemapUrls) {
      queue.enqueue({ url, depth: 1 });
    }

    if (sitemapUrls.length === 0) {
      const manifest = await fetchLlmsManifest(sourceOrigin);
      for (const url of manifest) {
        queue.enqueue({ url, depth: 1 });
      }

      if (manifest.length === 0) {
        const fromSearch = await discoverExtraDocUrls(sourceOrigin);
        for (const url of fromSearch) {
          queue.enqueue({ url, depth: 1 });
        }
      }
    }
  }

  const dedupe = new DuplicateFilter();
  const results: CrawlResult[] = [];
  const seenTitles = new Map<string, number>();

  // Bounded-concurrency crawl loop.
  //
  // Pulls up to HOST_CONCURRENCY entries off the queue per round, fetches
  // them in parallel via Promise.allSettled, then drains results and
  // enqueues newly-discovered links. This drops 80-page crawl time from
  // ~90-180s (sequential) to ~15-25s for the same number of pages.
  while (results.length < MAX_PAGES && queue.size() > 0) {
    const remaining = MAX_PAGES - results.length;
    const batchSize = Math.min(HOST_CONCURRENCY, remaining);
    const batch: { url: string; depth: number }[] = [];

    for (let i = 0; i < batchSize; i++) {
      const entry = queue.dequeue();
      if (!entry) {
        break;
      }

      // robots.txt path-allow check inline; same logic as before.
      if (entry.url !== normalizedSourceUrl) {
        try {
          const pathname = new URL(entry.url).pathname;
          if (!isPathAllowed(robots, pathname)) {
            continue;
          }
        } catch {
          continue;
        }
      }

      batch.push(entry);
    }

    if (batch.length === 0) {
      // Queue exhausted of allowed URLs.
      break;
    }

    const fetched = await Promise.allSettled(
      batch.map(async (entry) => {
        const doc = await fetchOneDoc(entry.url);
        return { entry, doc };
      })
    );

    for (const settled of fetched) {
      if (settled.status !== "fulfilled") {
        continue;
      }
      const { entry, doc } = settled.value;
      if (!doc || doc.content.trim().length < 80) {
        continue;
      }
      if (dedupe.isDuplicate(entry.url, doc.content)) {
        continue;
      }
      if (results.length >= MAX_PAGES) {
        break;
      }

      let title = doc.title || titleFromUrl(entry.url);
      const titleKey = title.toLowerCase().trim();
      const count = (seenTitles.get(titleKey) ?? 0) + 1;
      seenTitles.set(titleKey, count);
      if (count > 1) {
        title = `${title} — ${titleFromUrl(entry.url)}`;
      }

      const content = doc.content.slice(0, PER_PAGE_CHARS);
      results.push({
        url: entry.url,
        title,
        content,
        type: detectPageType(doc.content, entry.url),
        contentHash: contentHash(content),
        crawledAt: new Date().toISOString(),
      });

      // Prefer the HTML the markdown fetcher already retrieved; only
      // fall back to a fresh fetchPageHtml when we don't have it (avoids
      // doubling the round-trip cost on the majority of pages).
      const html =
        (doc as { html?: string }).html ??
        (await (async () => {
          const fallback = await fetchPageHtml(entry.url);
          return fallback?.html;
        })());

      if (!html) {
        continue;
      }

      const links = extractLinks(html, entry.url);
      for (const link of links) {
        if (!isDocLink(link, sourcePath)) {
          continue;
        }
        queue.enqueue({ url: link, depth: entry.depth + 1 });
      }
    }

    // Respect robots.txt crawl-delay once per BATCH, not per page.
    if (robots.crawlDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, robots.crawlDelayMs));
    }
  }

  return results;
}

export function parseOpenApiSpec(spec: string): Array<{
  method: string;
  path: string;
  summary?: string;
  description?: string;
}> {
  try {
    const parsed = JSON.parse(spec) as {
      paths?: Record<
        string,
        Record<string, { summary?: string; description?: string }>
      >;
    };
    const endpoints: Array<{
      method: string;
      path: string;
      summary?: string;
      description?: string;
    }> = [];

    for (const [path, methods] of Object.entries(parsed.paths ?? {})) {
      for (const [method, details] of Object.entries(methods)) {
        if (["get", "post", "put", "patch", "delete"].includes(method)) {
          endpoints.push({
            method: method.toUpperCase(),
            path,
            summary: details.summary,
            description: details.description,
          });
        }
      }
    }
    return endpoints;
  } catch {
    return [];
  }
}
