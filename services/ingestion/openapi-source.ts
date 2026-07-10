import type { CrawlResult } from "@/types/platform";

type OpenApiOperation = {
  summary?: string;
  description?: string;
  operationId?: string;
  tags?: string[];
  parameters?: Array<{
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: { type?: string };
  }>;
  requestBody?: {
    description?: string;
    content?: Record<string, { schema?: unknown; example?: unknown }>;
  };
  responses?: Record<
    string,
    {
      description?: string;
      content?: Record<string, { schema?: unknown; example?: unknown }>;
    }
  >;
  security?: unknown[];
};

type OpenApiDocument = {
  openapi?: string;
  swagger?: string;
  info?: { title?: string; description?: string; version?: string };
  servers?: Array<{ url: string; description?: string }>;
  paths?: Record<string, Record<string, OpenApiOperation>>;
  components?: {
    securitySchemes?: Record<string, { type?: string; scheme?: string }>;
  };
};

const METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
] as const;

/** Try JSON first, then YAML (light-touch — handles common spec shapes). */
export function parseOpenApiText(text: string): OpenApiDocument | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed) as OpenApiDocument;
    } catch {
      return null;
    }
  }

  return parseSimpleYaml(trimmed);
}

/**
 * Minimal YAML parser sufficient for typical OpenAPI specs.
 * Handles nested maps, lists, scalars. Does NOT support anchors, !!tags, or
 * multi-line folded blocks — for those, the JSON form should be preferred.
 */
function parseSimpleYaml(text: string): OpenApiDocument | null {
  try {
    const lines = text
      .split("\n")
      .filter((l) => !/^\s*#/.test(l) && l.trim().length > 0);
    const root: Record<string, unknown> = {};
    const stack: Array<{
      indent: number;
      node: Record<string, unknown> | unknown[];
    }> = [{ indent: -1, node: root }];

    for (const rawLine of lines) {
      const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
      const line = rawLine.trim();

      while (stack.length > 1 && (stack.at(-1)?.indent ?? 0) >= indent) {
        stack.pop();
      }

      const parent = stack.at(-1)?.node;
      if (!parent) {
        continue;
      }

      if (line.startsWith("- ")) {
        const value = line.slice(2).trim();
        if (Array.isArray(parent)) {
          parent.push(parseScalar(value));
        }
        continue;
      }

      const colon = line.indexOf(":");
      if (colon === -1) {
        continue;
      }
      const key = line
        .slice(0, colon)
        .trim()
        .replace(/^["']|["']$/g, "");
      const value = line.slice(colon + 1).trim();

      if (Array.isArray(parent)) {
        continue;
      }

      if (!value) {
        const child: Record<string, unknown> = {};
        parent[key] = child;
        stack.push({ indent, node: child });
      } else if (value === "[]") {
        parent[key] = [];
      } else if (value === "{}") {
        parent[key] = {};
      } else {
        parent[key] = parseScalar(value);
      }
    }

    return root as OpenApiDocument;
  } catch {
    return null;
  }
}

function parseScalar(value: string): unknown {
  if (value === "true" || value === "false") {
    return value === "true";
  }
  if (value === "null" || value === "~") {
    return null;
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  if (/^-?\d+\.\d+$/.test(value)) {
    return Number(value);
  }
  return value.replace(/^["']|["']$/g, "");
}

/**
 * Expand an OpenAPI document into one CrawlResult per endpoint plus an overview.
 * This is what makes search_documentation actually useful for API specs.
 */
export function expandOpenApiSpec(
  spec: OpenApiDocument,
  sourceUrl: string
): CrawlResult[] {
  const results: CrawlResult[] = [];
  const baseUrl = spec.servers?.[0]?.url ?? "";
  const title = spec.info?.title ?? "API";

  const overview = [
    `# ${title}`,
    spec.info?.description ?? "",
    spec.info?.version ? `\n**Version:** ${spec.info.version}` : "",
    baseUrl ? `\n**Base URL:** ${baseUrl}` : "",
    spec.components?.securitySchemes
      ? `\n## Authentication\n\n${Object.entries(
          spec.components.securitySchemes
        )
          .map(
            ([name, scheme]) =>
              `- **${name}**: ${(scheme.type ?? "").toString()} ${
                scheme.scheme ?? ""
              }`
          )
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  results.push({
    url: sourceUrl,
    title: `${title} — Overview`,
    content: overview,
    type: "api",
  });

  for (const [path, methods] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      const op = methods[method];
      if (!op) {
        continue;
      }

      const sections: string[] = [];
      sections.push(`# ${method.toUpperCase()} ${path}`);
      if (op.summary) {
        sections.push(op.summary);
      }
      if (op.description) {
        sections.push(op.description);
      }

      if (op.parameters?.length) {
        sections.push("## Parameters");
        for (const p of op.parameters) {
          const required = p.required ? " (required)" : "";
          const type = p.schema?.type ?? "string";
          sections.push(
            `- **${p.name}** (\`${p.in}\`, ${type})${required}${
              p.description ? ` — ${p.description}` : ""
            }`
          );
        }
      }

      if (op.requestBody?.content) {
        sections.push("## Request body");
        for (const [mediaType, body] of Object.entries(
          op.requestBody.content
        )) {
          sections.push(`### ${mediaType}`);
          if (body.example !== undefined) {
            sections.push(
              `\`\`\`json\n${JSON.stringify(body.example, null, 2)}\n\`\`\``
            );
          } else if (body.schema) {
            sections.push(
              `\`\`\`json\n${JSON.stringify(body.schema, null, 2)}\n\`\`\``
            );
          }
        }
      }

      if (op.responses) {
        sections.push("## Responses");
        for (const [status, resp] of Object.entries(op.responses)) {
          sections.push(
            `### ${status}${resp.description ? ` — ${resp.description}` : ""}`
          );
          const example = Object.values(resp.content ?? {})[0]?.example;
          if (example !== undefined) {
            sections.push(
              `\`\`\`json\n${JSON.stringify(example, null, 2)}\n\`\`\``
            );
          }
        }
      }

      if (op.tags?.length) {
        sections.push(`\n_Tags: ${op.tags.join(", ")}_`);
      }

      const _operationName =
        op.operationId ?? op.summary ?? `${method.toUpperCase()} ${path}`;

      results.push({
        url: `${sourceUrl}#${method}-${path}`,
        title: `${method.toUpperCase()} ${path}${
          op.summary ? ` — ${op.summary}` : ""
        }`,
        content: sections.join("\n\n"),
        type: "api",
      });

      // Avoid unbounded explosions.
      if (results.length > 500) {
        break;
      }
    }
  }

  return results;
}
