import { getDoc2McpBaseUrl } from "@/lib/doc2mcp/app-url";
import { deriveMcpServerSlug } from "@/lib/doc2mcp/naming";
import type {
  CompressedTool,
  McpServerConfig,
  McpToolDefinition,
} from "@/types/platform";
import { DOC_MCP_TOOLS } from "./doc-tools";

/** Max docs-relative custom tools to surface on top of the base nav tools. */
const MAX_CUSTOM_TOOLS = 10;

/**
 * Coerce any AI-extracted parameter shape into a valid JSON-Schema object.
 *
 * The crawler/LLM sometimes emits `required` as a sibling of `inputSchema`
 * (instead of inside it) or omits `properties` entirely — both produce
 * malformed tool definitions that confuse MCP hosts. This normalizes every
 * tool to `{ type: "object", properties: {...}, required?: [...] }`.
 */
function normalizeToolSchema(schema: unknown): Record<string, unknown> {
  if (!schema || typeof schema !== "object") {
    return { type: "object", properties: {} };
  }
  const source = schema as Record<string, unknown>;
  const properties =
    source.properties && typeof source.properties === "object"
      ? (source.properties as Record<string, unknown>)
      : {};
  const out: Record<string, unknown> = { type: "object", properties };
  if (Array.isArray(source.required)) {
    const required = source.required.filter(
      (key): key is string => typeof key === "string"
    );
    if (required.length > 0) {
      out.required = required;
    }
  }
  return out;
}

/**
 * Build the final tool list for a project: the standard documentation
 * navigation tools plus the docs-relative tools doc2mcp inferred from the
 * crawl — deduped by name so the same tool never appears twice.
 */
function buildToolList(compressed: CompressedTool[]): McpToolDefinition[] {
  const seen = new Set<string>();
  const tools: McpToolDefinition[] = [];

  const add = (tool: McpToolDefinition) => {
    const name = (tool.name ?? "").trim();
    if (!name || seen.has(name)) {
      return;
    }
    seen.add(name);
    tools.push({
      name,
      description: tool.description ?? "",
      inputSchema: normalizeToolSchema(tool.inputSchema),
    });
  };

  for (const tool of DOC_MCP_TOOLS) {
    add(tool);
  }

  let added = 0;
  for (const tool of compressed) {
    if (added >= MAX_CUSTOM_TOOLS) {
      break;
    }
    const before = seen.size;
    add({
      name: tool.name,
      description: tool.description,
      inputSchema: normalizeToolSchema(tool.parameters),
    });
    if (seen.size > before) {
      added += 1;
    }
  }

  return tools;
}

export type McpGeneratorOptions = {
  projectId: string;
  sourceUrl: string;
  projectName?: string;
  mcpAccessToken: string;
  compressedTools?: CompressedTool[];
};

function resolveServerSlug(options: McpGeneratorOptions): string {
  const fromUrl = deriveMcpServerSlug(options.sourceUrl);
  if (fromUrl && fromUrl !== "docs") {
    return fromUrl;
  }
  if (options.projectName) {
    return options.projectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  return fromUrl;
}

function buildMcpServerEntry(options: McpGeneratorOptions) {
  const baseUrl = getDoc2McpBaseUrl();
  return {
    url: `${baseUrl}/api/mcp/${options.projectId}/mcp`,
    headers: {
      Authorization: `Bearer ${options.mcpAccessToken}`,
    },
  };
}

export function generateMcpConfig(
  options: McpGeneratorOptions
): McpServerConfig {
  const serverSlug = resolveServerSlug(options) || "docs";
  const serverEntry = buildMcpServerEntry(options);

  const tools = buildToolList(options.compressedTools ?? []);

  return {
    name: serverSlug,
    version: "1.0.0",
    tools,
    projectId: options.projectId,
    sourceUrl: options.sourceUrl,
    cursorConfig: {
      mcpServers: {
        [serverSlug]: serverEntry,
      },
    },
    claudeConfig: {
      mcpServers: {
        [serverSlug]: serverEntry,
      },
    },
  };
}

function extractServerEntry(config: McpServerConfig): {
  url: string;
  token: string;
} {
  const servers = (
    config.cursorConfig as
      | {
          mcpServers?: Record<
            string,
            { url?: string; headers?: Record<string, string> }
          >;
        }
      | undefined
  )?.mcpServers;
  const entry = servers ? Object.values(servers)[0] : undefined;
  const url =
    entry?.url ??
    `${getDoc2McpBaseUrl()}/api/mcp/${config.projectId ?? ""}/mcp`;
  const token =
    entry?.headers?.Authorization ?? "Bearer <your project MCP token>";
  return { url, token };
}

/**
 * Emit a runnable local MCP server built on the official MCP TypeScript SDK
 * (`@modelcontextprotocol/sdk`). It exposes the project's tools over stdio
 * and proxies each `tools/call` to the doc2mcp remote endpoint, so users get
 * a real, standards-compliant server they can run anywhere.
 */
export function generateMcpServerCode(config: McpServerConfig): string {
  const { url, token } = extractServerEntry(config);
  const tools = JSON.stringify(config.tools ?? [], null, 2);
  return `#!/usr/bin/env node
/**
 * ${config.name} — MCP server generated by doc2mcp.
 * Built on the official Model Context Protocol TypeScript SDK.
 *
 * Run:
 *   npm i @modelcontextprotocol/sdk
 *   DOC2MCP_TOKEN="${token}" node server.mjs
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const REMOTE_URL = ${JSON.stringify(url)};
const AUTHORIZATION = process.env.DOC2MCP_TOKEN ?? ${JSON.stringify(token)};
const TOOLS = ${tools};

const server = new Server(
  { name: ${JSON.stringify(config.name)}, version: ${JSON.stringify(config.version)} },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const res = await fetch(REMOTE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: AUTHORIZATION.startsWith("Bearer ")
        ? AUTHORIZATION
        : \`Bearer \${AUTHORIZATION}\`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: request.params.name,
        arguments: request.params.arguments ?? {},
      },
    }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message ?? "Remote tool call failed");
  }
  return data.result;
});

const transport = new StdioServerTransport();
await server.connect(transport);
`;
}

export function generateCursorMcpJson(config: McpServerConfig): string {
  return JSON.stringify(config.cursorConfig ?? {}, null, 2);
}

export function generateClaudeDesktopConfig(config: McpServerConfig): string {
  return JSON.stringify(config.claudeConfig ?? {}, null, 2);
}
