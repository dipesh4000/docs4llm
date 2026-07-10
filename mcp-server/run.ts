#!/usr/bin/env node
/**
 * doc2mcp stdio MCP bridge.
 *
 * This is a thin proxy: it forwards `tools/list` and `tools/call` to the
 * hosted doc2mcp MCP endpoint over JSON-RPC. The tool set is therefore
 * **always the tools doc2mcp generated for that specific project** (derived
 * from the crawled docs) — never a hard-coded generic list. Re-sync the docs
 * and the tools update here with no code change.
 *
 * No third-party API keys: answers use the platform key behind the endpoint.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const BASE_URL = (
  process.env.DOC2MCP_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
const PROJECT_ID = process.env.DOC2MCP_PROJECT_ID ?? "";
const PROJECT_TOKEN = process.env.DOC2MCP_PROJECT_TOKEN ?? "";
const SERVER_NAME = process.env.DOC2MCP_SERVER_NAME ?? "doc2mcp";

type JsonRpcResponse = {
  result?: unknown;
  error?: { code?: number; message?: string };
};

type ToolDefinition = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

/** Forward a single JSON-RPC method to the hosted doc2mcp MCP endpoint. */
async function rpc(
  method: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  if (!(PROJECT_ID && PROJECT_TOKEN)) {
    throw new Error(
      "Set DOC2MCP_PROJECT_ID and DOC2MCP_PROJECT_TOKEN from the doc2mcp Connect tab"
    );
  }

  const res = await fetch(`${BASE_URL}/api/mcp/${PROJECT_ID}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PROJECT_TOKEN}`,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });

  if (!res.ok) {
    const detail = (await res.json().catch(() => ({}))) as JsonRpcResponse;
    throw new Error(detail.error?.message ?? `doc2mcp MCP ${res.status}`);
  }

  const payload = (await res.json()) as JsonRpcResponse;
  if (payload.error) {
    throw new Error(payload.error.message ?? "doc2mcp MCP error");
  }
  return payload.result;
}

const server = new Server(
  { name: SERVER_NAME, version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const result = (await rpc("tools/list")) as { tools?: ToolDefinition[] };
  return { tools: result.tools ?? [] };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = (await rpc("tools/call", {
    name: request.params.name,
    arguments: request.params.arguments ?? {},
  })) as { content?: Array<{ type: "text"; text: string }>; isError?: boolean };

  return {
    content: result.content ?? [
      { type: "text" as const, text: "No content returned." },
    ],
    isError: result.isError ?? false,
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
