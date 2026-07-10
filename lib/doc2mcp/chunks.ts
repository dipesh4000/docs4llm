import type { CrawlResult } from "@/types/platform";

export type DocChunk = {
  id: string;
  pageUrl: string;
  pageTitle: string;
  heading: string;
  /** Full heading path, e.g. "Authentication > Bearer tokens > Refresh flow" */
  breadcrumbs: string;
  /** 0-indexed position of this chunk within its page. */
  position: number;
  content: string;
  /** Page type (api/auth/workflow/page) bubbled from the source. */
  type: CrawlResult["type"];
};

const CHUNK_TARGET_CHARS = 1500;
const CHUNK_MIN_CHARS = 300;
const CHUNK_OVERLAP_CHARS = 150;

/** Stable, content-derived id (Base64URL-safe, short). */
function chunkId(pageUrl: string, position: number, heading: string): string {
  const seed = `${pageUrl}#${position}#${heading}`;
  return Buffer.from(seed).toString("base64url").slice(0, 24);
}

type HeadingNode = {
  level: number;
  title: string;
  body: string;
  /** Stack of ancestor headings (excluding self) when this section started. */
  ancestors: Array<{ level: number; title: string }>;
};

/**
 * Split a markdown document at ATX (`#`) headings, recording the full ancestor
 * path. Falls back to a single root section when the doc has no headings.
 */
function splitByHeadings(content: string, pageTitle: string): HeadingNode[] {
  const lines = content.split("\n");
  const sections: HeadingNode[] = [];
  let current: HeadingNode = {
    level: 1,
    title: pageTitle,
    body: "",
    ancestors: [],
  };
  const stack: Array<{ level: number; title: string }> = [];
  let inFence = false;

  const flush = () => {
    if (current.body.trim().length > 0 || current.title) {
      sections.push({ ...current, body: current.body.trim() });
    }
  };

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      current.body += `${line}\n`;
      continue;
    }

    if (!inFence) {
      const match = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
      if (match) {
        flush();
        const level = match[1].length;
        const title = match[2].trim();

        while (stack.length > 0 && (stack.at(-1)?.level ?? 0) >= level) {
          stack.pop();
        }

        current = {
          level,
          title,
          body: "",
          ancestors: [...stack],
        };

        stack.push({ level, title });
        continue;
      }
    }

    current.body += `${line}\n`;
  }
  flush();

  return sections.filter((s) => s.body.trim().length > 0 || s.title);
}

/**
 * If a section's body is too large, split it on paragraph boundaries with a
 * small character overlap so semantic search can still find the right slice.
 */
function packSection(body: string): string[] {
  if (body.length <= CHUNK_TARGET_CHARS) {
    return [body];
  }

  const paragraphs = body.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";
  let inFence = false;

  for (const para of paragraphs) {
    const next = current ? `${current}\n\n${para}` : para;
    const fences = (para.match(/```/g) ?? []).length;
    if (fences % 2 === 1) {
      inFence = !inFence;
    }

    if (
      next.length > CHUNK_TARGET_CHARS &&
      current.length >= CHUNK_MIN_CHARS &&
      !inFence
    ) {
      chunks.push(current);
      const tail = current.slice(-CHUNK_OVERLAP_CHARS);
      current = `${tail}\n\n${para}`;
    } else {
      current = next;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function breadcrumbsOf(node: HeadingNode): string {
  return [...node.ancestors.map((a) => a.title), node.title].join(" > ");
}

export function chunkPage(page: CrawlResult): DocChunk[] {
  const sections = splitByHeadings(page.content, page.title);
  const chunks: DocChunk[] = [];
  let position = 0;

  for (const section of sections) {
    const blocks = packSection(section.body);
    for (const block of blocks) {
      const content = `# ${section.title}\n\n${block.trim()}`;
      chunks.push({
        id: chunkId(page.url, position, section.title),
        pageUrl: page.url,
        pageTitle: page.title,
        heading: section.title,
        breadcrumbs: breadcrumbsOf(section),
        position,
        content,
        type: page.type,
      });
      position += 1;
    }
  }

  if (chunks.length === 0 && page.content.trim().length > 0) {
    chunks.push({
      id: chunkId(page.url, 0, page.title),
      pageUrl: page.url,
      pageTitle: page.title,
      heading: page.title,
      breadcrumbs: page.title,
      position: 0,
      content: page.content,
      type: page.type,
    });
  }

  return chunks;
}

export function chunkPages(pages: CrawlResult[]): DocChunk[] {
  const out: DocChunk[] = [];
  for (const page of pages) {
    for (const chunk of chunkPage(page)) {
      out.push(chunk);
    }
  }
  return out;
}

/** Lightweight BM25-ish scoring: title match + heading match + body matches. */
export function searchChunks(
  chunks: DocChunk[],
  query: string,
  limit = 10
): Array<{ chunk: DocChunk; score: number; snippet: string }> {
  const terms = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (terms.length === 0) {
    return [];
  }

  const hits: Array<{ chunk: DocChunk; score: number; snippet: string }> = [];

  for (const chunk of chunks) {
    const title = chunk.pageTitle.toLowerCase();
    const heading = chunk.heading.toLowerCase();
    const breadcrumbs = chunk.breadcrumbs.toLowerCase();
    const body = chunk.content.toLowerCase();

    let score = 0;
    let firstMatchIdx = -1;

    for (const term of terms) {
      let matched = false;
      if (title.includes(term)) {
        score += 4 + term.length;
        matched = true;
      }
      if (heading.includes(term)) {
        score += 6 + term.length;
        matched = true;
      }
      if (breadcrumbs.includes(term)) {
        score += 2;
        matched = true;
      }
      const bodyIdx = body.indexOf(term);
      if (bodyIdx >= 0) {
        score += 1 + Math.min(term.length, 6);
        matched = true;
        if (firstMatchIdx < 0 || bodyIdx < firstMatchIdx) {
          firstMatchIdx = bodyIdx;
        }
      }
      if (!matched) {
        score -= 1;
      }
    }

    if (chunk.type === "api") {
      score += 2;
    }

    if (score <= 0) {
      continue;
    }

    const start = firstMatchIdx >= 0 ? Math.max(0, firstMatchIdx - 80) : 0;
    const snippet = chunk.content.slice(start, start + 320).trim();
    hits.push({ chunk, score, snippet });
  }

  hits.sort((a, b) => b.score - a.score);

  // Deduplicate by (pageUrl, heading) so we don't surface the same section twice.
  const seen = new Set<string>();
  const unique: Array<{ chunk: DocChunk; score: number; snippet: string }> = [];
  for (const hit of hits) {
    const key = `${hit.chunk.pageUrl}#${hit.chunk.heading}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(hit);
    if (unique.length >= limit) {
      break;
    }
  }
  return unique;
}

export function listChunksByPage(
  chunks: DocChunk[],
  pageUrl: string
): DocChunk[] {
  return chunks
    .filter((c) => c.pageUrl === pageUrl)
    .sort((a, b) => a.position - b.position);
}
