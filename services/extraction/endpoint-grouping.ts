/**
 * Resource-prefix grouping for semantic tool compression.
 *
 * Instead of asking the AI to compress N raw endpoints into M tools, we
 * pre-group endpoints by resource + auth boundary. This gives the AI strong
 * structural hints, producing far more coherent "grouped tools" like
 * `customers_create`, `customers_list`, `customers_update` instead of one
 * monolithic tool per endpoint or, worse, hallucinated tools.
 */

import type { ApiEndpoint } from "@/types/platform";

export type EndpointGroup = {
  resource: string;
  auth: string;
  endpoints: ApiEndpoint[];
};

function resourceKey(path: string): string {
  const segments = path
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .filter((s) => !/^[{:]/.test(s));
  if (segments.length === 0) {
    return "root";
  }
  const first = segments[0]?.toLowerCase() ?? "root";
  if (/^v\d+$/.test(first) && segments[1]) {
    return segments[1].toLowerCase();
  }
  if (first === "api" && segments[1]) {
    if (/^v\d+$/.test(segments[1]) && segments[2]) {
      return segments[2].toLowerCase();
    }
    return segments[1].toLowerCase();
  }
  return first;
}

export function groupEndpoints(endpoints: ApiEndpoint[]): EndpointGroup[] {
  const map = new Map<string, EndpointGroup>();
  for (const e of endpoints) {
    const resource = resourceKey(e.path);
    const auth = e.auth ?? "none";
    const key = `${resource}::${auth}`;
    const existing = map.get(key);
    if (existing) {
      existing.endpoints.push(e);
    } else {
      map.set(key, { resource, auth, endpoints: [e] });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.endpoints.length - a.endpoints.length
  );
}

/**
 * Render groups as a compact prompt-friendly outline. Used by the tool
 * compression prompt to anchor tool boundaries.
 */
export function renderGroupsForPrompt(groups: EndpointGroup[]): string {
  return groups
    .map((g) => {
      const head = `### ${g.resource} (auth: ${g.auth}, ${g.endpoints.length} endpoints)`;
      const lines = g.endpoints
        .slice(0, 12)
        .map(
          (e) =>
            `- ${e.method} ${e.path}${
              e.summary ? ` — ${e.summary.slice(0, 80)}` : ""
            }`
        )
        .join("\n");
      const more =
        g.endpoints.length > 12
          ? `\n  …and ${g.endpoints.length - 12} more`
          : "";
      return `${head}\n${lines}${more}`;
    })
    .join("\n\n");
}
