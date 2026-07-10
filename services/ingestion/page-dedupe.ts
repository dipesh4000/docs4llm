/**
 * Near-duplicate page detection.
 *
 * Many docs sites render the same chrome (nav, footer) on every page; the
 * leftover content can look identical between pages that share heavy
 * boilerplate. We hash a normalized version of the content and drop pages
 * whose fingerprint we've already seen.
 *
 * Lightweight: SHA-256 of normalized text (no shingles/simhash) — fast and
 * fine for exact / near-exact duplicates after sanitization. Soft duplicates
 * are handled upstream by main-content extraction in html-sanitizer.
 */

import { createHash } from "node:crypto";

function normalize(content: string): string {
  return content
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

export function contentFingerprint(content: string): string {
  const normalized = normalize(content);
  return createHash("sha256").update(normalized).digest("hex");
}

export function contentHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export class DuplicateFilter {
  private readonly seen = new Map<string, string>();

  /**
   * Returns true if the content is a duplicate; otherwise records it and
   * returns false. The original URL of the first occurrence is preserved.
   */
  isDuplicate(url: string, content: string): boolean {
    if (content.length < 200) {
      return false;
    }
    const fp = contentFingerprint(content.slice(0, 4000));
    const existing = this.seen.get(fp);
    if (existing && existing !== url) {
      return true;
    }
    if (!existing) {
      this.seen.set(fp, url);
    }
    return false;
  }
}
