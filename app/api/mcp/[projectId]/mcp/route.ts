import { attributeMcpHit, resolveMcpProject } from "@/lib/doc2mcp/mcp-api";
import { runDocMcpTool } from "@/lib/doc2mcp/mcp-tools-runtime";
import { addSpanAttributes, withSpan } from "@/lib/observability/tracing";
import { getRatelimiter } from "@/lib/redis/upstash";
import { DOC_MCP_TOOLS } from "@/services/mcp/doc-tools";

/**
 * Per-token rate limit for the MCP `tools/call` path.
 *
 * `tools/call` is the only method that hits the LLM + crawled corpus, so
 * it's also the only one that can rack up serious cost from a runaway or
 * malicious client. 60 calls / minute / token is generous for an
 * interactive Cursor or Claude session (a power user tops out around
 * 10/min) but caps a runaway loop at ~3600 LLM calls/hour.
 *
 * `tools/list` and `initialize` are intentionally NOT rate-limited —
 * they don't touch the LLM and Cursor pings them aggressively on
 * connect.
 */
const TOOL_CALL_RATELIMIT = getRatelimiter("mcp:tools:call", 60, "1 m");

// Hard cap on a single MCP request. This route is request/response JSON-RPC
// (no long-lived SSE), so it returns quickly — but the explicit cap bounds the
// worst case so a hung/slow `tools/call` can't keep the Fluid function
// CPU-active and run up Active CPU billing. 30s is ample for the LLM-backed
// path; `initialize`/`tools/list` return in milliseconds.
export const maxDuration = 30;

const PROTOCOL_VERSION = "2025-06-18";

type JsonRpcId = string | number | null;

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: JsonRpcId;
  method?: string;
  params?: Record<string, unknown>;
};

function rpcSuccess(id: JsonRpcId, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result });
}

function rpcError(id: JsonRpcId, code: number, message: string, status = 200) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id,
      error: { code, message },
    },
    { status }
  );
}

function rpcHttpError(status: number, code: number, message: string) {
  return Response.json(
    {
      jsonrpc: "2.0",
      id: null,
      error: { code, message },
    },
    { status }
  );
}

// biome-ignore lint/suspicious/useAwait: Next.js route handlers must be async
export async function GET() {
  return new Response(
    "doc2mcp HTTP MCP — use POST with JSON-RPC 2.0 (initialize, tools/list, tools/call)",
    { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } }
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return rpcHttpError(400, -32_700, "Parse error: invalid JSON");
  }

  const id: JsonRpcId = body.id ?? null;
  const method = body.method;
  const rpcParams = body.params ?? {};

  if (!method) {
    return rpcError(id, -32_600, "Missing method", 400);
  }

  if (method === "initialize") {
    return rpcSuccess(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: { listChanged: false },
      },
      serverInfo: {
        name: "doc2mcp",
        version: "1.0.0",
      },
    });
  }

  if (method === "notifications/initialized" || method === "initialized") {
    return new Response(null, { status: 204 });
  }

  if (method === "ping") {
    return rpcSuccess(id, {});
  }

  if (method === "tools/list") {
    // tools/list does NOT need the multi-megabyte crawlData; skip the heavy
    // JSON fetch and parse on every Cursor/Claude refresh.
    const resolved = await resolveMcpProject(request, projectId, {
      withPages: false,
    });
    if ("error" in resolved) {
      if (resolved.error === "not_found") {
        return rpcHttpError(404, -32_001, "Project not found");
      }
      if (resolved.error === "not_ready") {
        return rpcHttpError(409, -32_002, "Project is not ready yet");
      }
      return rpcHttpError(
        401,
        -32_003,
        "Unauthorized: missing or invalid token"
      );
    }
    const tools = resolved.artifacts?.mcpConfig?.tools ?? DOC_MCP_TOOLS;
    return Response.json(
      { jsonrpc: "2.0", id, result: { tools } },
      {
        headers: {
          // Tools are baked at pipeline-end and only change on re-sync.
          // private (per-token) + 60s edge cache + 5min SWR keeps Cursor's
          // periodic tools/list refresh effectively free.
          "Cache-Control":
            "private, max-age=30, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  }

  if (method === "tools/call") {
    const toolName =
      typeof (rpcParams as { name?: unknown }).name === "string"
        ? (rpcParams as { name: string }).name
        : "";
    const toolArgs =
      (rpcParams as { arguments?: Record<string, unknown> }).arguments ?? {};

    if (!toolName) {
      return rpcError(id, -32_602, "Missing tool name in params");
    }

    const resolved = await resolveMcpProject(request, projectId);
    if ("error" in resolved) {
      if (resolved.error === "not_found") {
        return rpcHttpError(404, -32_001, "Project not found");
      }
      if (resolved.error === "not_ready") {
        return rpcHttpError(409, -32_002, "Project is not ready yet");
      }
      return rpcHttpError(
        401,
        -32_003,
        "Unauthorized: missing or invalid token"
      );
    }

    // Ratelimit by projectId. The MCP token is 1:1 with project, so this
    // limits per-token without exposing the token (or its hash) in keys.
    if (TOOL_CALL_RATELIMIT) {
      const { success, reset, remaining } = await TOOL_CALL_RATELIMIT.limit(
        `proj:${projectId}`
      );
      if (!success) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32_004,
              message: `Rate limit exceeded — try again at ${new Date(reset).toISOString()}`,
            },
          }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "Retry-After": Math.max(
                1,
                Math.ceil((reset - Date.now()) / 1000)
              ).toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": Math.floor(reset / 1000).toString(),
            },
          }
        );
      }
    }

    // Attribute this billable hit to developer vs company traffic so the DB
    // knows whose MCP infrastructure is being exercised. Fire-and-forget.
    attributeMcpHit({
      id: resolved.project.id,
      ownerType: resolved.project.ownerType,
      teamId: resolved.project.teamId,
    });

    try {
      const result = await withSpan(
        "mcp.tools.call",
        {
          attributes: {
            "mcp.tool_name": toolName,
            "doc2mcp.project_id": projectId,
            "doc2mcp.page_count": resolved.pages.length,
            "doc2mcp.owner_type": resolved.project.ownerType,
            "doc2mcp.team_id": resolved.project.teamId ?? "none",
          },
        },
        async () => {
          const out = await runDocMcpTool(toolName, toolArgs, {
            project: {
              id: resolved.project.id,
              name: resolved.project.name,
              sourceUrl: resolved.project.sourceUrl,
            },
            pages: resolved.pages,
            artifacts: resolved.artifacts,
          });
          addSpanAttributes({ "mcp.is_error": Boolean(out.isError) });
          return out;
        }
      );
      return rpcSuccess(id, result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Tool execution failed";
      return rpcSuccess(id, {
        content: [{ type: "text", text: message }],
        isError: true,
      });
    }
  }

  return rpcError(id, -32_601, `Method not found: ${method}`);
}
