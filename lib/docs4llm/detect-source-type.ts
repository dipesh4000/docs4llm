import type { SourceType } from "@/types/platform";

/**
 * Smart source-type detection from URL alone.
 * Crawler will further refine using content-type and content sniffing.
 */
export function detectSourceTypeFromUrl(url: string): SourceType {
  const lower = url.toLowerCase();

  if (lower.endsWith(".md") || lower.endsWith(".mdx")) {
    return "markdown";
  }

  if (
    lower.endsWith(".json") ||
    lower.endsWith(".yaml") ||
    lower.endsWith(".yml")
  ) {
    if (lower.includes("postman") || lower.includes("collection")) {
      return "postman";
    }
    if (
      lower.includes("openapi") ||
      lower.includes("swagger") ||
      lower.includes("/spec") ||
      lower.endsWith(".yaml") ||
      lower.endsWith(".yml")
    ) {
      return "openapi";
    }
    return "openapi";
  }

  if (
    lower.includes("/openapi") ||
    lower.includes("/swagger") ||
    lower.includes("openapi.json") ||
    lower.includes("swagger.json")
  ) {
    return "openapi";
  }

  if (
    lower.includes("github.com") ||
    lower.includes("raw.githubusercontent.com")
  ) {
    if (lower.endsWith(".md") || lower.endsWith(".mdx")) {
      return "markdown";
    }
    return "github";
  }

  // GitBook published spaces and hosted docs.
  if (
    lower.includes(".gitbook.io") ||
    lower.includes("gitbook.com") ||
    lower.includes("/gitbook")
  ) {
    return "gitbook";
  }

  if (lower.endsWith(".html") || lower.endsWith(".htm")) {
    return "html";
  }

  return "url";
}

/**
 * Refine the source type once content is fetched.
 * Useful when the URL gives no extension hint (e.g. github.com/x/y).
 */
export function sniffSourceTypeFromContent(
  body: string,
  contentType: string
): SourceType | null {
  const head = body.slice(0, 2000).trimStart();
  const ct = contentType.toLowerCase();

  if (
    ct.includes("application/json") ||
    head.startsWith("{") ||
    head.startsWith("[")
  ) {
    if (/"swagger"\s*:|"openapi"\s*:/.test(head)) {
      return "openapi";
    }
    if (/"info"\s*:\s*\{[\s\S]*"_postman_id"/.test(head)) {
      return "postman";
    }
  }

  if (
    (ct.includes("yaml") || ct.includes("text/x-yaml")) &&
    /^(swagger|openapi)\s*:\s*['"]?\d/m.test(head)
  ) {
    return "openapi";
  }

  if (
    ct.includes("markdown") ||
    /^#{1,6}\s/.test(head) ||
    head.startsWith("---")
  ) {
    return "markdown";
  }

  if (
    ct.includes("text/html") ||
    head.startsWith("<!DOCTYPE") ||
    head.startsWith("<html")
  ) {
    return "html";
  }

  return null;
}

/**
 * GitHub repo URL → { owner, repo, branch?, path?, ambiguousTail? }
 *
 * branch + path is ambiguous when the branch itself contains a "/", e.g.
 * https://github.com/foo/bar/tree/feat/add-docs/docs — here the branch is
 * "feat/add-docs" and the path is "docs", not branch="feat" path="add-docs/docs".
 * In that case we return all segments after /tree/ as `ambiguousTail` so the
 * crawler can resolve the real branch via the GitHub API.
 */
export function parseGitHubRepoUrl(url: string): {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  ambiguousTail?: string[];
} | null {
  try {
    const parsed = new URL(url);
    if (
      !parsed.hostname.endsWith("github.com") &&
      !parsed.hostname.endsWith("githubusercontent.com")
    ) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const owner = parts[0];
    const repo = parts[1]?.replace(/\.git$/, "");

    if (!owner || !repo) {
      return null;
    }

    // /owner/repo/tree/<branch>/<...path>
    // /owner/repo/blob/<branch>/<...path>
    if ((parts[2] === "tree" || parts[2] === "blob") && parts[3]) {
      const tail = parts.slice(3);
      // If tail is a single segment, it's definitely the branch.
      if (tail.length === 1) {
        return { owner, repo, branch: tail[0] };
      }
      // Ambiguous: branch could be "tail[0]" with path "tail[1..]",
      // or "tail[0]/tail[1]" with path "tail[2..]", etc.
      return {
        owner,
        repo,
        branch: tail[0],
        path: tail.slice(1).join("/") || undefined,
        ambiguousTail: tail,
      };
    }

    return { owner, repo };
  } catch {
    return null;
  }
}
