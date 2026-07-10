/** Derive MCP server slug from docs URL (e.g. docs.agentverse.ai → agentverse). */
export function deriveMcpServerSlug(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "github.com" || host.endsWith(".github.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        return slugify(parts[1]);
      }
      return "github";
    }

    const segments = host.split(".");
    if (segments[0] === "docs" && segments[1]) {
      return slugify(segments[1]);
    }
    if (segments[0] === "api" && segments[1]) {
      return slugify(segments[1]);
    }

    return slugify(segments[0] ?? "docs");
  } catch {
    return "docs";
  }
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Cursor env key for target API (e.g. agentverse → AGENTVERSE_API_KEY). */
export function envKeyForSlug(slug: string): string {
  const base = slug.replace(/-/g, "_").toUpperCase();
  return `${base}_API_KEY`;
}

export function mcpPackageName(slug: string): string {
  return `@doc2mcp/mcp-${slug}`;
}

export function displayNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
