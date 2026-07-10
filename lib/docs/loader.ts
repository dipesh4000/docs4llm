import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

const DOCS_ROOT = path.join(process.cwd(), "contents", "docs");

const UNCATEGORIZED = "More";

/** Sidebar section order. Categories not listed here are appended last. */
const CATEGORY_ORDER = [
  "Getting Started",
  "Core Concepts",
  "Guides",
  "Examples",
  "API Reference",
  "Deployment",
  "Enterprise",
  "Reference",
  UNCATEGORIZED,
  "Legal",
] as const;

export type DocPage = {
  slug: string[];
  title: string;
  description: string;
  category: string;
  content: string;
};

export type DocNavItem = {
  slug: string[];
  title: string;
  href: string;
  category: string;
  order: number;
};

export type DocNavGroup = {
  category: string;
  items: DocNavItem[];
};

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, body: raw };
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      meta[key] = value;
    }
  }

  return { meta, body: match[2].trim() };
}

function slugFromFilename(filename: string): string[] {
  const base = filename.replace(/\.md$/, "");
  if (base === "index") {
    return [];
  }
  return base.split("/");
}

function categoryRank(category: string): number {
  const idx = CATEGORY_ORDER.indexOf(
    category as (typeof CATEGORY_ORDER)[number]
  );
  return idx === -1 ? CATEGORY_ORDER.length : idx;
}

async function readNavItems(): Promise<DocNavItem[]> {
  const entries = await readdir(DOCS_ROOT, { withFileTypes: true });
  const items: DocNavItem[] = [];

  for (const entry of entries) {
    if (!(entry.isFile() && entry.name.endsWith(".md"))) {
      continue;
    }

    const raw = await readFile(path.join(DOCS_ROOT, entry.name), "utf8");
    const { meta } = parseFrontmatter(raw);
    const slug = slugFromFilename(entry.name);
    const href = slug.length === 0 ? "/docs" : `/docs/${slug.join("/")}`;

    items.push({
      slug,
      title: meta.nav_title ?? meta.title ?? slug.at(-1) ?? "Overview",
      href,
      category: meta.category ?? UNCATEGORIZED,
      order: Number.parseInt(meta.order ?? "999", 10),
    });
  }

  return items.sort((a, b) => {
    const byCategory = categoryRank(a.category) - categoryRank(b.category);
    if (byCategory !== 0) {
      return byCategory;
    }
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.title.localeCompare(b.title);
  });
}

/** Flat, fully ordered nav — used for previous/next navigation. */
export async function getDocNav(): Promise<DocNavItem[]> {
  "use cache";
  cacheLife("max");
  return await readNavItems();
}

/** Nav grouped by category in sidebar order — used for the sidebar. */
export async function getDocNavGroups(): Promise<DocNavGroup[]> {
  "use cache";
  cacheLife("max");

  const items = await readNavItems();
  const groups: DocNavGroup[] = [];

  for (const item of items) {
    const existing = groups.find((group) => group.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.push({ category: item.category, items: [item] });
    }
  }

  return groups;
}

export async function getDocPage(slug: string[]): Promise<DocPage | null> {
  "use cache";
  cacheLife("max");

  const filename = slug.length === 0 ? "index.md" : `${slug.join("/")}.md`;
  const filePath = path.join(DOCS_ROOT, filename);

  try {
    const raw = await readFile(filePath, "utf8");
    const { meta, body } = parseFrontmatter(raw);

    return {
      slug,
      title: meta.title ?? "Documentation",
      description: meta.description ?? "",
      category: meta.category ?? UNCATEGORIZED,
      content: body,
    };
  } catch {
    return null;
  }
}
