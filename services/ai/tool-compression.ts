import { asi1GenerateText } from "@/lib/asi1/client";
import type { ApiEndpoint, CompressedTool } from "@/types/platform";
import {
  groupEndpoints,
  renderGroupsForPrompt,
} from "../extraction/endpoint-grouping";

export async function compressApiToTools(
  endpoints: ApiEndpoint[],
  projectName: string
): Promise<CompressedTool[]> {
  if (endpoints.length === 0) {
    return [
      {
        name: "search_documentation",
        description: `Search the ${projectName} documentation by keywords.`,
        parameters: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"],
        },
        endpoints: [],
      },
      {
        name: "read_documentation_page",
        description: `Read a specific ${projectName} documentation page (by url or id).`,
        parameters: {
          type: "object",
          properties: {
            url: { type: "string" },
            id: { type: "string" },
          },
        },
        endpoints: [],
      },
      {
        name: "ask_documentation",
        description: `Ask a natural-language question about ${projectName} docs.`,
        parameters: {
          type: "object",
          properties: { question: { type: "string" } },
          required: ["question"],
        },
        endpoints: [],
      },
    ];
  }

  const groups = groupEndpoints(endpoints);
  const groupsPrompt = renderGroupsForPrompt(groups);

  const { text } = await asi1GenerateText([
    {
      role: "system",
      content: `You compress REST APIs into human-friendly AI tools.

Rules:
- One tool per resource action (e.g. create_customer, list_customers, update_customer).
- Tool names: snake_case, 2-4 segments, ASCII letters/digits/underscores only, max 48 chars.
- Each tool MUST map to ≥ 1 real endpoint listed below — never invent endpoints.
- Each tool MUST have a JSON Schema inputSchema with type: "object" and concrete properties (id, query, body, …) inferred from the endpoint paths and methods.
- If you cannot infer a useful tool for a group, skip it. Quality over quantity.

Return ONLY a valid JSON array of:
{"name": "create_customer", "description": "Create a new customer record.", "parameters": {"type":"object","properties":{"name":{"type":"string"},"email":{"type":"string"}},"required":["name"]}, "endpoints": ["POST /customers"]}`,
    },
    {
      role: "user",
      content: `Compress these ${projectName} API endpoints into 5-20 semantic AI tools, grouped by resource:\n\n${groupsPrompt}\n\nReturn ONLY the JSON array.`,
    },
  ]);

  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(jsonMatch?.[0] ?? "[]") as CompressedTool[];
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // fall through to heuristic compression
  }

  return heuristicCompress(endpoints);
}

function heuristicCompress(endpoints: ApiEndpoint[]): CompressedTool[] {
  const tools: CompressedTool[] = [];
  const seen = new Set<string>();

  for (const endpoint of endpoints) {
    const segments = endpoint.path.split("/").filter(Boolean);
    const resource = segments.at(-1) ?? "resource";
    const action = methodToAction(endpoint.method);
    const name = `${action}_${resource.replace(/[^a-zA-Z0-9]/g, "_")}`;

    if (seen.has(name)) {
      continue;
    }
    seen.add(name);

    tools.push({
      name,
      description: endpoint.summary ?? `${endpoint.method} ${endpoint.path}`,
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Resource identifier" },
          data: { type: "object", description: "Request payload" },
        },
      },
      endpoints: [`${endpoint.method} ${endpoint.path}`],
    });
  }

  return tools.slice(0, 15);
}

function methodToAction(method: string): string {
  const map: Record<string, string> = {
    GET: "get",
    POST: "create",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };
  return map[method.toUpperCase()] ?? "call";
}
