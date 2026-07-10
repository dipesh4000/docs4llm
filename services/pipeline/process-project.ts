import { recordJobFinish, recordJobStart } from "@/lib/db/job-metrics";
import {
  createMcpServerRecord,
  getPlatformProjectById,
  updatePlatformProject,
} from "@/lib/db/queries";
import { DOC_MCP_TOOL_NAMES } from "@/lib/doc2mcp/doc-tools-registry";
import { createMcpProjectToken, hashMcpToken } from "@/lib/doc2mcp/mcp-access";
import { publishProjectToRegistry } from "@/lib/mcp-registry/publish";
import { createLogger } from "@/lib/observability/logger";
import {
  addSpanAttributes,
  currentTraceId,
  withSpan,
} from "@/lib/observability/tracing";
import { enqueuePipelineJob, isQstashConfigured } from "@/lib/queue/qstash";
import type {
  CrawlResult,
  GenerationReport,
  ProcessingLog,
  ProjectArtifacts,
  ProjectStatus,
  SourceType,
} from "@/types/platform";
import type { AnalysisResult } from "../ai/understanding";
import { analyzeDocumentation } from "../ai/understanding";
import { buildApiGraph } from "../graph/builder";
import { crawlDocsSource } from "../ingestion/crawler";
import { smokeTestTools } from "../mcp/correctness";
import {
  generateClaudeDesktopConfig,
  generateCursorMcpJson,
  generateMcpConfig,
  generateMcpServerCode,
} from "../mcp/generator";
import { validateMcpTools } from "../mcp/validator";

const log = createLogger("pipeline");

function classifyError(err: unknown): string {
  if (!err) {
    return "unknown";
  }
  if (err instanceof Error) {
    if (err.name && err.name !== "Error") {
      return err.name;
    }
    const msg = err.message ?? "";
    if (/timeout/i.test(msg)) {
      return "TimeoutError";
    }
    if (/ECONN|ENOTFOUND|EHOSTUNREACH|fetch failed/i.test(msg)) {
      return "NetworkError";
    }
    if (/rate.?limit|429/i.test(msg)) {
      return "RateLimitError";
    }
    if (/401|unauthor/i.test(msg)) {
      return "AuthError";
    }
    if (/parse|invalid (json|yaml|spec)/i.test(msg)) {
      return "ParseError";
    }
    return "PipelineError";
  }
  return "UnknownError";
}

export async function processProjectPipeline(args: {
  projectId: string;
  userId: string;
  sourceUrl: string;
  sourceType: SourceType;
  projectName: string;
  phase?: "generate";
}) {
  return await withSpan(
    "pipeline.run",
    {
      attributes: {
        "doc2mcp.project_id": args.projectId,
        "doc2mcp.source_type": args.sourceType,
        "doc2mcp.source_url": args.sourceUrl,
        "doc2mcp.pipeline_phase": args.phase ?? "full",
      },
    },
    () => runPipeline(args)
  );
}

type PipelineDraftArtifacts = {
  pipelineDraft?: AnalysisResult;
};

async function persistLogs(
  projectId: string,
  userId: string,
  logs: ProcessingLog[],
  extra?: Partial<{
    status: ProjectStatus;
    artifacts: unknown;
    crawlData: unknown;
    tokenUsage: unknown;
  }>
) {
  await updatePlatformProject({
    id: projectId,
    userId,
    data: { logs, ...extra },
  });
}

type JobLogger = ReturnType<typeof log.child>;

async function runGeneratePhase({
  projectId,
  userId,
  sourceUrl,
  projectName,
  crawlResults,
  analysis,
  logs,
  addLog,
  jobLog,
  metricId,
  startMs,
}: {
  projectId: string;
  userId: string;
  sourceUrl: string;
  projectName: string;
  crawlResults: CrawlResult[];
  analysis: AnalysisResult;
  logs: ProcessingLog[];
  addLog: (
    message: string,
    level?: ProcessingLog["level"],
    phase?: string
  ) => ProcessingLog;
  jobLog: JobLogger;
  metricId: string;
  startMs: number;
}) {
  await updatePlatformProject({
    id: projectId,
    userId,
    data: { status: "generating", logs },
  });

  addLog("Building documentation MCP server...", "info", "mcp");
  const mcpAccessToken = createMcpProjectToken();
  const mcpTokenHash = hashMcpToken(mcpAccessToken);

  const draftMcpConfig = generateMcpConfig({
    projectId,
    sourceUrl,
    projectName,
    mcpAccessToken,
    compressedTools: analysis.compressedTools,
  });

  addLog(
    "Validating MCP tool schemas + confidence scoring...",
    "info",
    "validate"
  );
  await persistLogs(projectId, userId, logs);

  const validation = validateMcpTools(draftMcpConfig.tools, {
    compressed: analysis.compressedTools,
    builtinNames: DOC_MCP_TOOL_NAMES,
  });
  const keptCompressed = analysis.compressedTools
    .filter((t) =>
      validation.results.find((r) => r.tool.name === t.name && !r.dropped)
    )
    .map((t) => ({
      ...t,
      confidence:
        validation.results.find((r) => r.tool.name === t.name)?.confidence ?? 0,
    }));

  if (validation.report.dropped > 0) {
    addLog(
      `Dropped ${validation.report.dropped} low-confidence / invalid tool(s)`,
      "warn",
      "validate"
    );
  }
  addLog(
    `Kept ${validation.report.kept} tools (avg confidence ${validation.report.averageConfidence}%)`,
    "success",
    "validate"
  );

  const mcpConfig = generateMcpConfig({
    projectId,
    sourceUrl,
    projectName,
    mcpAccessToken,
    compressedTools: keptCompressed,
  });

  addLog("Running MCP runtime smoke tests...", "info", "smoke");
  await persistLogs(projectId, userId, logs);

  const smoke = smokeTestTools(mcpConfig.tools, keptCompressed, {
    pages: crawlResults,
  });
  if (smoke.failed > 0) {
    addLog(
      `${smoke.failed} tool(s) failed smoke tests — see report`,
      "warn",
      "smoke"
    );
  } else {
    addLog(`All ${smoke.passed} tools passed smoke tests`, "success", "smoke");
  }

  addLog("Building API graph visualization...", "info", "graph");
  const { nodes, edges } = buildApiGraph(
    analysis.endpoints,
    analysis.authPatterns,
    analysis.workflows
  );

  const mcpServerCode = generateMcpServerCode(mcpConfig);

  const generationReport: GenerationReport = {
    source: {
      extractionMode: analysis.extractionMode,
      discoveredSpecUrl:
        analysis.extractionMode === "openapi"
          ? crawlResults[0]?.url
          : undefined,
    },
    endpoints: analysis.dedupeReport,
    tools: {
      total: validation.report.total,
      kept: validation.report.kept,
      dropped: validation.report.dropped,
      averageConfidence: validation.report.averageConfidence,
    },
    smoke: {
      passed: smoke.passed,
      failed: smoke.failed,
    },
    issues: validation.report.issues,
  };

  const artifacts: ProjectArtifacts = {
    endpoints: analysis.endpoints,
    compressedTools: keptCompressed,
    workflows: analysis.workflows,
    workflowDetection: analysis.workflowDetection,
    mcpConfig,
    llmsTxt: analysis.llmsTxt,
    sdkTypescript: "",
    sdkPython: "",
    graphNodes: nodes,
    graphEdges: edges,
    mcpAccessToken,
    mcpTokenHash,
    docsPageCount: crawlResults.length,
    qualityScore: analysis.qualityScore,
    generationReport,
    cursorConfig: {
      mcp: JSON.parse(generateCursorMcpJson(mcpConfig)),
      claude: JSON.parse(generateClaudeDesktopConfig(mcpConfig)),
      serverCode: mcpServerCode,
    },
  };

  await createMcpServerRecord({
    projectId,
    userId,
    name: mcpConfig.name,
    config: mcpConfig,
    tools: mcpConfig.tools,
  });

  addLog("Publishing to the MCP Registry...", "info", "registry");
  await persistLogs(projectId, userId, logs);

  const registry = await withSpan(
    "pipeline.registry_publish",
    { attributes: { "doc2mcp.project_id": projectId } },
    () =>
      publishProjectToRegistry({
        projectId,
        projectName,
        sourceUrl,
        versionSeed: Date.now(),
      })
  );
  artifacts.registry = registry;
  if (registry.status === "published") {
    addLog(
      `Listed on the MCP Registry as ${registry.name}`,
      "success",
      "registry"
    );
  } else if (registry.status === "skipped") {
    addLog(`Registry publish skipped: ${registry.message}`, "info", "registry");
  } else {
    addLog(`Registry publish failed: ${registry.message}`, "warn", "registry");
  }

  addLog(
    `Ready — ${crawlResults.length} pages, ${keptCompressed.length} validated tools (${analysis.extractionMode} extraction).`,
    "success",
    "done"
  );

  await updatePlatformProject({
    id: projectId,
    userId,
    data: {
      status: "ready",
      artifacts,
      logs,
      tokenUsage: analysis.tokenUsage,
    },
  });

  const durationMs = performance.now() - startMs;
  await recordJobFinish({
    id: metricId,
    status: "success",
    durationMs,
    metadata: {
      pages: crawlResults.length,
      tools: keptCompressed.length,
      workflows: analysis.workflows.length,
      workflowConfidence: analysis.workflowDetection.confidence,
      avgConfidence: validation.report.averageConfidence,
      smokeFailed: smoke.failed,
      extractionMode: analysis.extractionMode,
      tokens: analysis.tokenUsage,
    },
  });
  jobLog.info("pipeline.success", {
    durationMs: Math.round(durationMs),
    pages: crawlResults.length,
    tools: keptCompressed.length,
    workflows: analysis.workflows.length,
  });

  return { success: true as const, artifacts };
}

async function runPipeline({
  projectId,
  userId,
  sourceUrl,
  sourceType,
  projectName,
  phase,
}: {
  projectId: string;
  userId: string;
  sourceUrl: string;
  sourceType: SourceType;
  projectName: string;
  phase?: "generate";
}) {
  const logs: ProcessingLog[] = [];
  const startMs = performance.now();
  const traceId = currentTraceId();
  const jobLog = log.child(`run.${projectId.slice(0, 8)}`);
  const metricId = await recordJobStart({
    jobType: "pipeline",
    projectId,
    userId,
    traceId,
    metadata: { sourceType, sourceUrl, projectName },
  });

  const addLog = (
    message: string,
    level: ProcessingLog["level"] = "info",
    phase?: string
  ) => {
    const entry: ProcessingLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      message,
      phase,
    };
    logs.push(entry);
    if (level === "error") {
      jobLog.error(`phase.${phase ?? "unknown"}`, undefined, { message });
    } else if (level === "warn") {
      jobLog.warn(`phase.${phase ?? "unknown"}`, { message });
    } else {
      jobLog.info(`phase.${phase ?? "unknown"}`, { message });
    }
    return entry;
  };

  try {
    jobLog.info("pipeline.start", {
      sourceType,
      sourceUrl,
      projectName,
      phase,
    });

    if (phase === "generate") {
      const existing = await getPlatformProjectById({ id: projectId, userId });
      if (!existing) {
        throw new Error("Project not found for generate phase");
      }
      const draft = (existing.artifacts as PipelineDraftArtifacts | null)
        ?.pipelineDraft;
      const crawlResults = (existing.crawlData as CrawlResult[] | null) ?? [];
      if (!draft) {
        throw new Error(
          "Missing pipeline draft — re-run conversion from the start"
        );
      }
      const storedLogs = (existing.logs as ProcessingLog[]) ?? [];
      logs.push(...storedLogs);

      return await runGeneratePhase({
        projectId,
        userId,
        sourceUrl,
        projectName,
        crawlResults,
        analysis: draft,
        logs,
        addLog,
        jobLog,
        metricId,
        startMs,
      });
    }

    await updatePlatformProject({
      id: projectId,
      userId,
      data: { status: "crawling", logs },
    });

    addLog("Starting documentation crawl...", "info", "crawl");
    const crawlResults = await withSpan(
      "pipeline.crawl",
      { attributes: { "doc2mcp.source_type": sourceType } },
      () => crawlDocsSource(sourceUrl, sourceType)
    );
    addSpanAttributes({ "doc2mcp.pages_crawled": crawlResults.length });
    addLog(`Crawled ${crawlResults.length} pages`, "success", "crawl");

    await updatePlatformProject({
      id: projectId,
      userId,
      data: { status: "analyzing", crawlData: crawlResults, logs },
    });

    addLog("Analyzing documentation with Gemini...", "info", "ai");
    const analysis = await withSpan(
      "pipeline.analyze",
      { attributes: { "doc2mcp.page_count": crawlResults.length } },
      () =>
        analyzeDocumentation(crawlResults, projectName, sourceUrl, (l) =>
          logs.push(l)
        )
    );
    addSpanAttributes({
      "doc2mcp.endpoints_detected": analysis.endpoints.length,
      "doc2mcp.tools_compressed": analysis.compressedTools.length,
      "doc2mcp.workflows_inferred": analysis.workflows.length,
      "doc2mcp.workflow_confidence": analysis.workflowDetection.confidence,
      "doc2mcp.extraction_mode": analysis.extractionMode,
      "doc2mcp.tokens.prompt": analysis.tokenUsage?.prompt_tokens ?? 0,
      "doc2mcp.tokens.completion": analysis.tokenUsage?.completion_tokens ?? 0,
      "doc2mcp.tokens.total": analysis.tokenUsage?.total_tokens ?? 0,
    });

    await updatePlatformProject({
      id: projectId,
      userId,
      data: {
        status: "generating",
        logs,
        artifacts: { pipelineDraft: analysis },
      },
    });

    const generatePayload = {
      projectId,
      userId,
      sourceUrl,
      sourceType,
      projectName,
      phase: "generate" as const,
    };

    if (isQstashConfigured()) {
      addLog(
        "Analysis complete — scheduling MCP generation in a fresh worker...",
        "info",
        "mcp"
      );
      await persistLogs(projectId, userId, logs);
      await enqueuePipelineJob(generatePayload);
      await recordJobFinish({
        id: metricId,
        status: "success",
        durationMs: performance.now() - startMs,
        metadata: {
          phase: "analyze",
          pages: crawlResults.length,
          tools: analysis.compressedTools.length,
        },
      });
      jobLog.info("pipeline.analyze_complete", {
        projectId,
        pages: crawlResults.length,
      });
      return { success: true, phase: "analyze" as const };
    }

    return await runGeneratePhase({
      projectId,
      userId,
      sourceUrl,
      projectName,
      crawlResults,
      analysis,
      logs,
      addLog,
      jobLog,
      metricId,
      startMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const errorClass = classifyError(error);
    addLog(`Pipeline failed: ${message}`, "error", "error");
    jobLog.error("pipeline.failed", error, { errorClass });
    await updatePlatformProject({
      id: projectId,
      userId,
      data: { status: "error", logs },
    });
    await recordJobFinish({
      id: metricId,
      status: "failed",
      durationMs: performance.now() - startMs,
      errorClass,
      errorMessage: message,
    });
    throw error;
  }
}
