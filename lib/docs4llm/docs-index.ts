import type { CrawlResult } from "@/types/platform";

export type DocPageSummary = {
  id: string;
  url: string;
  title: string;
  type: CrawlResult["type"];
  excerpt: string;
};

export type DocSearchHit = {
  id: string;
  url: string;
  title: string;
  snippet: string;
  score: number;
};

function pageId(url: string): string {
  return Buffer.from(url).toString("base64url").slice(0, 32);
}

export function listDocPages(pages: CrawlResult[]): DocPageSummary[] {
  return pages.map((page) => ({
    id: pageId(page.url),
    url: page.url,
    title: page.title,
    type: page.type,
    excerpt: page.content.slice(0, 280),
  }));
}

export function getDocPage(
  pages: CrawlResult[],
  params: { url?: string; id?: string }
): CrawlResult | null {
  if (params.url) {
    return pages.find((p) => p.url === params.url) ?? null;
  }
  if (params.id) {
    return pages.find((p) => pageId(p.url) === params.id) ?? null;
  }
  return null;
}

export function searchDocPages(
  pages: CrawlResult[],
  query: string,
  limit = 10
): DocSearchHit[] {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (terms.length === 0) {
    return [];
  }

  const hits: DocSearchHit[] = [];

  for (const page of pages) {
    const haystack = `${page.title} ${page.content} ${page.url}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) {
        score += term.length;
        if (page.title.toLowerCase().includes(term)) {
          score += 5;
        }
      }
    }
    if (score > 0) {
      const idx = haystack.indexOf(terms[0] ?? "");
      const start = Math.max(0, idx - 80);
      hits.push({
        id: pageId(page.url),
        url: page.url,
        title: page.title,
        snippet: page.content.slice(start, start + 240).trim(),
        score,
      });
    }
  }

  const sorted = hits.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const unique: DocSearchHit[] = [];
  for (const hit of sorted) {
    if (seen.has(hit.url)) {
      continue;
    }
    seen.add(hit.url);
    unique.push(hit);
    if (unique.length >= limit) {
      break;
    }
  }
  return unique;
}

export const buildDocsIndex = listDocPages;

export function searchDocs(
  pages: CrawlResult[],
  query: string,
  limit = 10
): Array<{ page: CrawlResult; score: number; snippet: string }> {
  const hits = searchDocPages(pages, query, limit);
  return hits.map((hit) => {
    const page = getDocPage(pages, { id: hit.id }) ?? {
      url: hit.url,
      title: hit.title,
      content: hit.snippet,
      type: "page" as const,
    };
    return { page, score: hit.score, snippet: hit.snippet };
  });
}

export function buildFullDocsMarkdown(
  pages: CrawlResult[],
  sourceUrl: string,
  summary?: string
): string {
  const header = `# Documentation index\n\nSource: ${sourceUrl}\n\n${summary ?? ""}\n\n`;
  const body = pages
    .map(
      (p) =>
        `## ${p.title}\n\nURL: ${p.url}\nType: ${p.type}\n\n${p.content}\n\n---\n`
    )
    .join("\n");
  return header + body;
}
