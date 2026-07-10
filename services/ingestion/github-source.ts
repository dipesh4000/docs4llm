import type { CrawlResult } from "@/types/platform";

const GITHUB_API = "https://api.github.com";
const RAW_HOST = "https://raw.githubusercontent.com";
const FETCH_TIMEOUT_MS = 15_000;
const MAX_FILES = 60;

const DOC_FILE_PATTERNS = [/\.(md|mdx)$/i];
const DOC_DIRS = new Set([
  "docs",
  "doc",
  "documentation",
  "examples",
  "example",
  "guides",
  "guide",
  "tutorials",
  "tutorial",
  "reference",
  "api",
]);

type GhEntry = {
  path: string;
  type: "blob" | "tree" | string;
  size?: number;
};

type GhTreeResponse = {
  tree?: GhEntry[];
  truncated?: boolean;
};

function authHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...authHeaders(),
        ...(init?.headers ?? {}),
      },
    });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function defaultBranch(owner: string, repo: string): Promise<string> {
  const res = await fetchWithTimeout(`${GITHUB_API}/repos/${owner}/${repo}`);
  if (!res?.ok) {
    return "main";
  }
  const data = (await res.json()) as { default_branch?: string };
  return data.default_branch ?? "main";
}

async function branchExists(
  owner: string,
  repo: string,
  branch: string
): Promise<boolean> {
  const res = await fetchWithTimeout(
    `${GITHUB_API}/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`
  );
  return Boolean(res?.ok);
}

/**
 * Resolve ambiguous branch/path splits for URLs like
 * `github.com/owner/repo/tree/feat/add-docs/docs` where the branch contains a
 * "/". Try the longest possible branch first.
 */
async function resolveBranchAndPath(
  owner: string,
  repo: string,
  tail: string[]
): Promise<{ branch: string; path?: string }> {
  for (let i = tail.length; i >= 1; i--) {
    const candidate = tail.slice(0, i).join("/");
    if (await branchExists(owner, repo, candidate)) {
      return {
        branch: candidate,
        path: tail.slice(i).join("/") || undefined,
      };
    }
  }
  return {
    branch: tail[0] ?? "main",
    path: tail.slice(1).join("/") || undefined,
  };
}

async function listRepoTree(
  owner: string,
  repo: string,
  branch: string
): Promise<GhEntry[]> {
  const res = await fetchWithTimeout(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );
  if (!res?.ok) {
    return [];
  }
  const data = (await res.json()) as GhTreeResponse;
  return data.tree ?? [];
}

function pickDocFiles(entries: GhEntry[], subPath?: string): string[] {
  const root = subPath ? subPath.replace(/^\/+|\/+$/g, "") : "";

  const docs = entries
    .filter((e) => e.type === "blob")
    .map((e) => e.path)
    .filter((path) =>
      root ? path.startsWith(`${root}/`) || path === root : true
    )
    .filter((path) => {
      if (DOC_FILE_PATTERNS.some((re) => re.test(path))) {
        return true;
      }
      const segments = path.split("/");
      return segments.some((seg) => DOC_DIRS.has(seg.toLowerCase()));
    })
    .filter((path) => DOC_FILE_PATTERNS.some((re) => re.test(path)));

  // README first, then alphabetical for stable ordering
  docs.sort((a, b) => {
    const aReadme = /readme/i.test(a) ? 0 : 1;
    const bReadme = /readme/i.test(b) ? 0 : 1;
    if (aReadme !== bReadme) {
      return aReadme - bReadme;
    }
    return a.localeCompare(b);
  });

  return docs.slice(0, MAX_FILES);
}

async function fetchRaw(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<string | null> {
  const url = `${RAW_HOST}/${owner}/${repo}/${branch}/${path}`;
  const res = await fetchWithTimeout(url, {
    headers: { Accept: "text/markdown,text/plain" },
  });
  if (!res?.ok) {
    return null;
  }
  return res.text();
}

function titleFromPath(path: string): string {
  const base = path.split("/").pop() ?? path;
  return base
    .replace(/\.(md|mdx)$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function crawlGitHubRepo(params: {
  owner: string;
  repo: string;
  branch?: string;
  path?: string;
  ambiguousTail?: string[];
}): Promise<CrawlResult[]> {
  let branch = params.branch;
  let subPath = params.path;

  if (params.ambiguousTail && params.ambiguousTail.length > 0) {
    const resolved = await resolveBranchAndPath(
      params.owner,
      params.repo,
      params.ambiguousTail
    );
    branch = resolved.branch;
    subPath = resolved.path;
  }

  if (!branch) {
    branch = await defaultBranch(params.owner, params.repo);
  }

  let tree = await listRepoTree(params.owner, params.repo, branch);
  // Fallback: branch in URL might not exist — retry against the default branch.
  if (tree.length === 0) {
    const fallback = await defaultBranch(params.owner, params.repo);
    if (fallback !== branch) {
      branch = fallback;
      tree = await listRepoTree(params.owner, params.repo, branch);
    }
  }
  if (tree.length === 0) {
    return [];
  }

  const files = pickDocFiles(tree, subPath);
  const results: CrawlResult[] = [];

  for (const path of files) {
    const content = await fetchRaw(params.owner, params.repo, branch, path);
    if (!content || content.trim().length < 80) {
      continue;
    }
    const headingMatch = content.match(/^#\s+(.+)$/m);
    const title = headingMatch?.[1]?.trim() ?? titleFromPath(path);
    results.push({
      url: `https://github.com/${params.owner}/${params.repo}/blob/${branch}/${path}`,
      title,
      content,
      type: "page",
    });
  }

  return results;
}
