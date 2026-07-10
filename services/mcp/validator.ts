/**
 * MCP correctness layer.
 *
 * Validates every generated tool against MCP protocol requirements:
 *   - name: ^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$  (MCP spec)
 *   - description: non-empty
 *   - inputSchema: object with type === "object", properties is a record
 *
 * Also computes a per-tool confidence score (0..100) based on schema
 * completeness, parameter coverage, and endpoint mapping. Tools below the
 * minimum confidence threshold are filtered out before saving artifacts —
 * this is the single biggest source of hallucinated/broken MCP servers.
 */

import type { CompressedTool, McpToolDefinition } from "@/types/platform";

const MCP_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/;

export type ToolValidationIssue = {
  toolName: string;
  severity: "error" | "warning";
  code:
    | "invalid_name"
    | "duplicate_name"
    | "missing_description"
    | "thin_description"
    | "invalid_input_schema"
    | "no_properties"
    | "no_endpoints";
  message: string;
};

export type ToolValidationResult = {
  tool: McpToolDefinition;
  confidence: number;
  issues: ToolValidationIssue[];
  dropped: boolean;
};

export type ValidationReport = {
  total: number;
  kept: number;
  dropped: number;
  averageConfidence: number;
  issues: ToolValidationIssue[];
};

export type ValidationOptions = {
  /** Tools below this score are dropped. 0..100. */
  minConfidence?: number;
  /** Built-in doc tools that should bypass schema strictness. */
  builtinNames?: ReadonlySet<string>;
};

const DEFAULT_MIN_CONFIDENCE = 35;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateInputSchema(schema: unknown): {
  ok: boolean;
  hasProperties: boolean;
  requiredCount: number;
  propertyCount: number;
} {
  if (!isPlainObject(schema)) {
    return {
      ok: false,
      hasProperties: false,
      requiredCount: 0,
      propertyCount: 0,
    };
  }
  if (schema.type !== "object") {
    return {
      ok: false,
      hasProperties: false,
      requiredCount: 0,
      propertyCount: 0,
    };
  }
  const props = isPlainObject(schema.properties) ? schema.properties : null;
  const required = Array.isArray(schema.required) ? schema.required : [];
  return {
    ok: true,
    hasProperties: Boolean(props && Object.keys(props).length > 0),
    requiredCount: required.length,
    propertyCount: props ? Object.keys(props).length : 0,
  };
}

function scoreTool(
  tool: McpToolDefinition,
  endpoints: string[] | undefined,
  schemaCheck: ReturnType<typeof validateInputSchema>
): number {
  let score = 0;

  if (MCP_NAME_REGEX.test(tool.name)) {
    score += 20;
  }
  if (tool.description) {
    score += Math.min(20, Math.floor(tool.description.length / 6));
  }
  if (schemaCheck.ok) {
    score += 15;
  }
  if (schemaCheck.hasProperties) {
    score += 15;
  }
  if (schemaCheck.requiredCount > 0) {
    score += 10;
  }
  if (endpoints && endpoints.length > 0) {
    score += 10;
  }
  if (schemaCheck.propertyCount >= 2) {
    score += 10;
  }

  return Math.min(100, score);
}

export function validateMcpTools(
  tools: McpToolDefinition[],
  options: { compressed?: CompressedTool[] } & ValidationOptions = {}
): {
  results: ToolValidationResult[];
  kept: McpToolDefinition[];
  report: ValidationReport;
} {
  const minConfidence = options.minConfidence ?? DEFAULT_MIN_CONFIDENCE;
  const builtins = options.builtinNames ?? new Set<string>();
  const compressedByName = new Map(
    (options.compressed ?? []).map((t) => [t.name, t])
  );
  const nameCounts = new Map<string, number>();
  for (const t of tools) {
    nameCounts.set(t.name, (nameCounts.get(t.name) ?? 0) + 1);
  }

  const results: ToolValidationResult[] = [];
  const allIssues: ToolValidationIssue[] = [];

  for (const tool of tools) {
    const issues: ToolValidationIssue[] = [];
    const schemaCheck = validateInputSchema(tool.inputSchema);
    const compressed = compressedByName.get(tool.name);
    const isBuiltin = builtins.has(tool.name);

    if (!MCP_NAME_REGEX.test(tool.name)) {
      issues.push({
        toolName: tool.name,
        severity: "error",
        code: "invalid_name",
        message: `Tool name "${tool.name}" violates MCP naming rules (must match ${MCP_NAME_REGEX}).`,
      });
    }
    if ((nameCounts.get(tool.name) ?? 0) > 1) {
      issues.push({
        toolName: tool.name,
        severity: "error",
        code: "duplicate_name",
        message: `Tool name "${tool.name}" is duplicated.`,
      });
    }
    if (!tool.description) {
      issues.push({
        toolName: tool.name,
        severity: "error",
        code: "missing_description",
        message: "Tool description is required.",
      });
    } else if (tool.description.length < 16) {
      issues.push({
        toolName: tool.name,
        severity: "warning",
        code: "thin_description",
        message: "Tool description is very short.",
      });
    }
    if (!schemaCheck.ok) {
      issues.push({
        toolName: tool.name,
        severity: "error",
        code: "invalid_input_schema",
        message:
          "inputSchema must be a JSON Schema object with type === 'object'.",
      });
    } else if (!(schemaCheck.hasProperties || isBuiltin)) {
      issues.push({
        toolName: tool.name,
        severity: "warning",
        code: "no_properties",
        message: "Tool has no input properties; clients cannot pass arguments.",
      });
    }
    if (
      !isBuiltin &&
      compressed &&
      (!compressed.endpoints || compressed.endpoints.length === 0)
    ) {
      issues.push({
        toolName: tool.name,
        severity: "warning",
        code: "no_endpoints",
        message: "Tool is not mapped to any source API endpoint.",
      });
    }

    const confidence = isBuiltin
      ? 100
      : scoreTool(tool, compressed?.endpoints, schemaCheck);
    const hasErrors = issues.some((i) => i.severity === "error");
    const dropped = !isBuiltin && (hasErrors || confidence < minConfidence);

    allIssues.push(...issues);
    results.push({ tool, confidence, issues, dropped });
  }

  const kept = results.filter((r) => !r.dropped).map((r) => r.tool);
  const keptScores = results.filter((r) => !r.dropped).map((r) => r.confidence);
  const averageConfidence =
    keptScores.length > 0
      ? Math.round(keptScores.reduce((a, b) => a + b, 0) / keptScores.length)
      : 0;

  return {
    results,
    kept,
    report: {
      total: tools.length,
      kept: kept.length,
      dropped: tools.length - kept.length,
      averageConfidence,
      issues: allIssues,
    },
  };
}
