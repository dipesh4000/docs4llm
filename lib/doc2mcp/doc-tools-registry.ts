import { DOC_MCP_TOOLS } from "@/services/mcp/doc-tools";

/** Names of the built-in doc MCP tools — used by the validator + correctness layer. */
export const DOC_MCP_TOOL_NAMES: ReadonlySet<string> = new Set(
  DOC_MCP_TOOLS.map((t) => t.name)
);

export function isBuiltinDocTool(name: string): boolean {
  return DOC_MCP_TOOL_NAMES.has(name);
}
