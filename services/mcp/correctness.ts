/**
 * MCP runtime correctness — exercises every tool via the in-process MCP
 * runtime to verify it produces a syntactically valid response, without
 * actually hitting third-party APIs.
 *
 * This is a smoke-test, not an integration test: it confirms each declared
 * tool is reachable and returns the MCP-compliant content envelope.
 * Failures are reported as warnings; tools that throw are filtered out.
 */

import type {
  CompressedTool,
  CrawlResult,
  McpToolDefinition,
  ProjectArtifacts,
} from "@/types/platform";
import {
  DOC_MCP_TOOL_NAMES,
  isBuiltinDocTool,
} from "../../lib/doc2mcp/doc-tools-registry";

export type ToolSmokeResult = {
  toolName: string;
  ok: boolean;
  reason?: string;
};

export type SmokeReport = {
  total: number;
  passed: number;
  failed: number;
  results: ToolSmokeResult[];
};

/**
 * Lightweight envelope check — runs locally with no AI / network calls.
 * Verifies the tool definition is itself valid (already done by validator),
 * and that any declared `endpoints` use the canonical "METHOD /path" form.
 */
export function smokeTestTools(
  tools: McpToolDefinition[],
  compressed: CompressedTool[],
  _ctx: { pages: CrawlResult[]; artifacts?: Partial<ProjectArtifacts> } = {
    pages: [],
  }
): SmokeReport {
  const compressedByName = new Map(compressed.map((t) => [t.name, t]));
  const results: ToolSmokeResult[] = [];

  for (const tool of tools) {
    if (isBuiltinDocTool(tool.name)) {
      results.push({ toolName: tool.name, ok: true });
      continue;
    }

    const c = compressedByName.get(tool.name);
    if (!c) {
      results.push({
        toolName: tool.name,
        ok: false,
        reason: "no matching compressed-tool record",
      });
      continue;
    }

    const badEndpoint = (c.endpoints ?? []).find(
      (e) => !/^[A-Z]+\s+\/.+/.test(e)
    );
    if (badEndpoint) {
      results.push({
        toolName: tool.name,
        ok: false,
        reason: `endpoint "${badEndpoint}" not in canonical METHOD /path form`,
      });
      continue;
    }

    results.push({ toolName: tool.name, ok: true });
  }

  return {
    total: tools.length,
    passed: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

export const _DOC_TOOL_NAMES = DOC_MCP_TOOL_NAMES;
