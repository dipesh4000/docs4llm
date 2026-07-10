/**
 * Priority crawl queue.
 *
 * Picks the next URL to crawl based on:
 *   1. Source proximity (URLs under the same path as the requested source
 *      get a boost — these are most relevant).
 *   2. Docs-affinity score (heuristic via `docsRelevanceScore`).
 *   3. Insertion order (FIFO for ties).
 *
 * Maintains a visited set, a depth cap, and a same-origin guard. Designed
 * for in-process use; for distributed crawls swap with Redis-backed Bull
 * later without changing the interface.
 */

import { docsRelevanceScore } from "./sitemap";

export type QueueEntry = {
  url: string;
  depth: number;
  /** Optional caller-provided base score. */
  baseScore?: number;
};

type Internal = QueueEntry & { score: number; seq: number };

export type CrawlQueueOptions = {
  maxDepth?: number;
  sameOrigin?: boolean;
  /** Path prefix on the source URL (used for proximity boost). */
  sourcePathPrefix?: string;
  /** Function to score a URL further (e.g. last-modified weighting). */
  bonus?: (url: string) => number;
};

export class CrawlQueue {
  private readonly visited = new Set<string>();
  private readonly entries: Internal[] = [];
  private seq = 0;
  private readonly options: Required<
    Pick<CrawlQueueOptions, "maxDepth" | "sameOrigin">
  > &
    Pick<CrawlQueueOptions, "sourcePathPrefix" | "bonus">;
  private readonly origin: string;

  constructor(origin: string, options: CrawlQueueOptions = {}) {
    this.origin = origin;
    this.options = {
      maxDepth: options.maxDepth ?? 4,
      sameOrigin: options.sameOrigin ?? true,
      sourcePathPrefix: options.sourcePathPrefix,
      bonus: options.bonus,
    };
  }

  has(url: string): boolean {
    return this.visited.has(url);
  }

  size(): number {
    return this.entries.length;
  }

  visitedCount(): number {
    return this.visited.size;
  }

  enqueue(entry: QueueEntry): boolean {
    if (this.visited.has(entry.url)) {
      return false;
    }
    if (entry.depth > this.options.maxDepth) {
      return false;
    }

    let urlObj: URL;
    try {
      urlObj = new URL(entry.url);
    } catch {
      return false;
    }
    if (this.options.sameOrigin && urlObj.origin !== this.origin) {
      return false;
    }

    const proximity = (() => {
      if (!this.options.sourcePathPrefix) {
        return 0;
      }
      return urlObj.pathname.startsWith(this.options.sourcePathPrefix) ? 20 : 0;
    })();

    const score =
      (entry.baseScore ?? 0) +
      proximity +
      docsRelevanceScore(entry.url) +
      (this.options.bonus?.(entry.url) ?? 0) -
      entry.depth * 2;

    this.entries.push({ ...entry, score, seq: this.seq++ });
    this.visited.add(entry.url);
    return true;
  }

  dequeue(): QueueEntry | null {
    if (this.entries.length === 0) {
      return null;
    }
    let bestIdx = 0;
    for (let i = 1; i < this.entries.length; i++) {
      const a = this.entries[i];
      const b = this.entries[bestIdx];
      if (!(a && b)) {
        continue;
      }
      if (a.score > b.score || (a.score === b.score && a.seq < b.seq)) {
        bestIdx = i;
      }
    }
    const [picked] = this.entries.splice(bestIdx, 1);
    if (!picked) {
      return null;
    }
    return {
      url: picked.url,
      depth: picked.depth,
      baseScore: picked.baseScore,
    };
  }
}
