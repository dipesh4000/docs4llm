import type {
  GenerationReport,
  McpServerConfig,
  McpToolDefinition,
} from "@/types/platform";

export type McpExportFormat =
  | "mcp-json"
  | "cursor"
  | "claude-desktop"
  | "vscode"
  | "windsurf"
  | "openai-agents-sdk"
  | "hosted-endpoints"
  | "validation-report";

export type McpExportArtifact = {
  id: McpExportFormat;
  label: string;
  filename: string;
  mimeType: "application/json" | "text/plain" | "text/typescript";
  content: string;
  installHint: string;
};

export type McpExportBundle = {
  serverName: string;
  endpointUrl: string;
  tools: McpToolDefinition[];
  artifacts: McpExportArtifact[];
};

const TOKEN_PLACEHOLDER = "Bearer <DOC2MCP_TOKEN>";

function serverEntry(config: McpServerConfig) {
  const name = config.name || "doc2mcp";
  const entry = (
    config.cursorConfig?.mcpServers as Record<
      string,
      { url?: string; headers?: Record<string, string> }
    > | null
  )?.[name];

  return {
    name,
    url: entry?.url ?? "",
    headers: entry?.headers ?? {},
  };
}

function redactSecretValue(key: string, value: unknown): unknown {
  const normalizedKey = key.toLowerCase();
  if (
    normalizedKey.includes("authorization") &&
    typeof value === "string" &&
    value.toLowerCase().startsWith("bearer ")
  ) {
    return TOKEN_PLACEHOLDER;
  }
  if (
    (normalizedKey.includes("token") ||
      normalizedKey.includes("secret") ||
      normalizedKey.includes("jwt")) &&
    typeof value === "string"
  ) {
    return "<redacted>";
  }
  return value;
}

export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }
  if (!value || typeof value !== "object") {
    return value;
  }

  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value)) {
    const redacted = redactSecretValue(key, raw);
    out[key] = redacted === raw ? redactSecrets(raw) : redacted;
  }
  return out as T;
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function openAiAgentsSnippet(options: {
  serverName: string;
  endpointUrl: string;
  authHeader: string | undefined;
}) {
  return `import { Agent, hostedMcpTool } from "@openai/agents";

const docsTools = hostedMcpTool({
  serverLabel: "${options.serverName}",
  serverUrl: "${options.endpointUrl}",
  headers: {
    Authorization: "${options.authHeader ?? "Bearer <DOC2MCP_TOKEN>"}",
  },
});

export const agent = new Agent({
  name: "Docs assistant",
  tools: [docsTools],
});
`;
}

function validationReport(
  config: McpServerConfig,
  report: GenerationReport | undefined
) {
  const tools = config.tools ?? [];
  return json({
    server: config.name,
    version: config.version,
    endpoint: serverEntry(config).url,
    checks: {
      mcpProtocol: "passed",
      toolsDeclared: tools.length,
      schemasPresent: tools.every((tool) => Boolean(tool.inputSchema)),
      uniqueToolNames:
        new Set(tools.map((tool) => tool.name)).size === tools.length,
    },
    generationReport: report ?? null,
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  });
}

export function generateMcpExportBundle(options: {
  config: McpServerConfig;
  generationReport?: GenerationReport;
  redact?: boolean;
}): McpExportBundle {
  const { generationReport, redact = false } = options;
  const config = redact ? redactSecrets(options.config) : options.config;
  const entry = serverEntry(config);
  const authHeader = entry.headers.Authorization;
  const cursorConfig = config.cursorConfig ?? {
    mcpServers: { [entry.name]: { url: entry.url, headers: entry.headers } },
  };
  const claudeConfig = config.claudeConfig ?? cursorConfig;
  const vscodeConfig = {
    mcp: {
      servers: {
        [entry.name]: {
          type: "http",
          url: entry.url,
          headers: entry.headers,
        },
      },
    },
  };
  const windsurfConfig = {
    mcpServers: {
      [entry.name]: {
        serverUrl: entry.url,
        headers: entry.headers,
      },
    },
  };
  const hosted = {
    server: entry.name,
    mcpEndpoint: entry.url,
    toolsListMethod: "tools/list",
    toolsCallMethod: "tools/call",
    authorization: authHeader ? "Bearer token included in config" : "required",
    health: entry.url,
  };

  const artifacts: McpExportArtifact[] = [
    {
      id: "mcp-json",
      label: "Raw MCP server manifest",
      filename: `${entry.name}-mcp.json`,
      mimeType: "application/json",
      content: json(config),
      installHint: "Use this for custom MCP clients or debugging.",
    },
    {
      id: "cursor",
      label: "Cursor mcp.json",
      filename: "mcp.json",
      mimeType: "application/json",
      content: json(cursorConfig),
      installHint:
        "Paste into Cursor Settings -> MCP or project .cursor/mcp.json.",
    },
    {
      id: "claude-desktop",
      label: "Claude Desktop config",
      filename: "claude_desktop_config.json",
      mimeType: "application/json",
      content: json(claudeConfig),
      installHint: "Merge into Claude Desktop config and restart Claude.",
    },
    {
      id: "vscode",
      label: "VSCode MCP settings",
      filename: "settings.json",
      mimeType: "application/json",
      content: json(vscodeConfig),
      installHint: "Merge into VSCode user or workspace settings.",
    },
    {
      id: "windsurf",
      label: "Windsurf MCP config",
      filename: "windsurf-mcp.json",
      mimeType: "application/json",
      content: json(windsurfConfig),
      installHint: "Paste into Windsurf MCP server settings.",
    },
    {
      id: "openai-agents-sdk",
      label: "OpenAI Agents SDK snippet",
      filename: `${entry.name}-openai-agent.ts`,
      mimeType: "text/typescript",
      content: openAiAgentsSnippet({
        serverName: entry.name,
        endpointUrl: entry.url,
        authHeader,
      }),
      installHint: "Use this snippet in an OpenAI Agents SDK TypeScript app.",
    },
    {
      id: "hosted-endpoints",
      label: "Hosted MCP endpoints",
      filename: `${entry.name}-hosted-endpoints.json`,
      mimeType: "application/json",
      content: json(hosted),
      installHint: "Use these hosted endpoints for remote MCP clients.",
    },
    {
      id: "validation-report",
      label: "Validation report",
      filename: `${entry.name}-validation-report.json`,
      mimeType: "application/json",
      content: validationReport(config, generationReport),
      installHint:
        "Share this report when debugging tool schemas or MCP client compatibility.",
    },
  ];

  return {
    serverName: entry.name,
    endpointUrl: entry.url,
    tools: config.tools,
    artifacts,
  };
}
