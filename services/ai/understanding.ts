import { asi1GenerateText } from "@/lib/asi1/client";
import type {
  ApiEndpoint,
  CompressedTool,
  CrawlResult,
  ProcessingLog,
  QualityScore,
  WorkflowDetection,
} from "@/types/platform";
import { dedupeEndpoints } from "../extraction/endpoint-dedupe";
import { extractEndpointsFromOpenApi } from "../extraction/openapi-endpoint-extractor";
import { generateLlmsTxt } from "../generators/llms-txt";
import { parseOpenApiText } from "../ingestion/openapi-source";
import { compressApiToTools } from "./tool-compression";
import { inferWorkflowDetection } from "./workflow-engine";

// Per-page truncation in the LLM context. Lower values keep the Gemini
// round-trip well under the 60s Hobby lambda cap and reduce token spend.
// Increase if you observe systematic endpoint omissions for verbose docs.
const PROMPT_CHARS_PER_PAGE = 1500;

function buildAnalysisPrompt(crawlResults: CrawlResult[]): string {
  const docsSummary = crawlResults
    .map(
      (r) =>
        `## ${r.title} (${r.type})\nURL: ${r.url}\n${r.content.slice(0, PROMPT_CHARS_PER_PAGE)}`
    )
    .join("\n\n");

  return `You are an expert API documentation analyst. Analyze the following documentation and extract structured API information and quality scores.

Return ONLY valid JSON with this structure:
{
  "summary": "Brief platform summary",
  "endpoints": [{"method": "GET", "path": "/resource", "summary": "...", "description": "...", "auth": "bearer|api_key|oauth|none", "tags": ["tag"]}],
  "authPatterns": [{"type": "bearer", "description": "..."}],
  "workflows": [{
    "name": "Customer Support Agent",
    "description": "What the agent accomplishes",
    "useCase": "When an AI agent should use this workflow",
    "category": "auth|payment|upload|webhook|crud|subscription|support|automation|custom",
    "complexity": "simple|moderate|complex",
    "confidence": 85,
    "steps": [
      {
        "name": "Resolve customer",
        "description": "Find the customer record",
        "type": "auth|api|payment|upload|webhook|condition|ai|human|data",
        "inputs": ["email"],
        "outputs": ["customer_id"]
      }
    ]
  }],
  "useCases": ["use case 1", "use case 2"],
  "qualityScore": {
    "docsScore": 85,
    "authConfidence": 90,
    "workflowConfidence": 75,
    "mcpScore": 80,
    "explanation": "Docs are very well structured with detailed paths. Auth pattern is standard OAuth2. Workflows were successfully inferred based on tutorials."
  }
}

Documentation:
${docsSummary}`;
}

export type AnalysisResult = {
  summary: string;
  endpoints: ApiEndpoint[];
  authPatterns: Array<{ type: string; description: string }>;
  workflows: WorkflowDetection["workflows"];
  workflowDetection: WorkflowDetection;
  useCases: string[];
  compressedTools: CompressedTool[];
  llmsTxt: string;
  qualityScore: QualityScore;
  extractionMode: "openapi" | "ai-html";
  dedupeReport: {
    inputCount: number;
    uniqueCount: number;
    collapsed: number;
  };
  tokenUsage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Reconstruct an OpenAPI spec text from the first CrawlResult if it carries
 * one (the discovery layer stores the raw spec text in the overview content).
 * Returns null if no spec text is detected.
 */
function tryExtractOpenApiFromCrawl(
  crawlResults: CrawlResult[]
): ApiEndpoint[] | null {
  for (const result of crawlResults) {
    const head = result.content.trimStart().slice(0, 200);
    if (
      !(head.startsWith("{") && /"(openapi|swagger)"\s*:/.test(head)) &&
      !/^(openapi|swagger)\s*:\s*['"]?[0-9]/m.test(head)
    ) {
      continue;
    }
    const spec = parseOpenApiText(result.content);
    if (!spec?.paths || Object.keys(spec.paths).length === 0) {
      continue;
    }
    return extractEndpointsFromOpenApi(spec);
  }
  return null;
}

export async function analyzeDocumentation(
  crawlResults: CrawlResult[],
  projectName: string,
  sourceUrl: string,
  onLog?: (log: ProcessingLog) => void
): Promise<AnalysisResult> {
  const log = (message: string, level: ProcessingLog["level"] = "info") => {
    onLog?.({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      message,
      phase: "ai-understanding",
    });
  };

  const openApiEndpoints = tryExtractOpenApiFromCrawl(crawlResults);
  const extractionMode: "openapi" | "ai-html" = openApiEndpoints
    ? "openapi"
    : "ai-html";

  let parsed: {
    summary?: string;
    endpoints?: ApiEndpoint[];
    authPatterns?: Array<{ type: string; description: string }>;
    workflows?: Array<{ name: string; steps: string[] }>;
    useCases?: string[];
    qualityScore?: QualityScore;
  } = {};

  let usage: AnalysisResult["tokenUsage"];

  if (openApiEndpoints) {
    log(
      `Found verified OpenAPI spec — extracted ${openApiEndpoints.length} endpoints deterministically (skipping AI extraction).`,
      "success"
    );
    parsed = {
      summary: `${projectName} API reference`,
      endpoints: openApiEndpoints,
      authPatterns: [],
      workflows: [],
      useCases: [],
    };
  } else {
    log("Sending documentation to Gemini for analysis...");
    const aiResult = await asi1GenerateText([
      {
        role: "system",
        content:
          "You are a world-class API architect. Extract precise API structures from documentation. Always return valid JSON only.",
      },
      { role: "user", content: buildAnalysisPrompt(crawlResults) },
    ]);
    usage = aiResult.usage;
    log("Parsing AI analysis results...", "success");
    try {
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
    } catch {
      parsed = {
        summary: "API documentation analyzed",
        endpoints: [],
        authPatterns: [],
        workflows: [],
        useCases: [],
      };
    }
  }

  const rawEndpoints: ApiEndpoint[] = (parsed.endpoints ?? []).map((e, i) => ({
    id: `endpoint-${i}`,
    method: e.method ?? "GET",
    path: e.path ?? "/",
    summary: e.summary,
    description: e.description,
    auth: e.auth as ApiEndpoint["auth"],
    tags: e.tags,
  }));

  const { endpoints, report: dedupeReport } = dedupeEndpoints(rawEndpoints);
  if (dedupeReport.collapsed > 0) {
    log(
      `Deduplicated ${dedupeReport.collapsed} endpoint(s) → ${dedupeReport.uniqueCount} unique`,
      "info"
    );
  }

  log(`Detected ${endpoints.length} API endpoints`, "success");
  log("Compressing API into AI-native tools...");

  const compressedTools = await compressApiToTools(endpoints, projectName);

  log(`Generated ${compressedTools.length} compressed tools`, "success");
  log("Inferring AI workflow engine patterns...");

  const workflowDetection = inferWorkflowDetection({
    parsedWorkflows: parsed.workflows ?? [],
    endpoints,
    tools: compressedTools,
    authPatterns: parsed.authPatterns ?? [],
    useCases: parsed.useCases ?? [],
    projectName,
  });

  log(
    `Inferred ${workflowDetection.workflows.length} AI workflow(s) with ${workflowDetection.confidence}% confidence`,
    "success"
  );
  log("Generating llms.txt for agent consumption...");

  const llmsTxt = generateLlmsTxt({
    name: projectName,
    summary: parsed.summary ?? "",
    sourceUrl,
    pages: crawlResults,
    endpoints,
    tools: compressedTools,
    useCases: parsed.useCases ?? [],
  });

  const defaultQualityScore: QualityScore = {
    docsScore: Math.min(60 + crawlResults.length * 5, 95),
    authConfidence: endpoints.some((e) => e.auth && e.auth !== "none")
      ? 90
      : 80,
    workflowConfidence: workflowDetection.confidence,
    mcpScore: compressedTools.length > 0 ? 88 : 75,
    explanation:
      "Automatically evaluated quality based on docs depth, auth clarity, inferred workflows, and generated MCP tool structure.",
  };

  const qualityScore: QualityScore = {
    ...defaultQualityScore,
    ...parsed.qualityScore,
    workflowConfidence:
      parsed.qualityScore?.workflowConfidence ?? workflowDetection.confidence,
  };

  return {
    summary: parsed.summary ?? "",
    endpoints,
    authPatterns: parsed.authPatterns ?? [],
    workflows: workflowDetection.workflows,
    workflowDetection,
    useCases: parsed.useCases ?? [],
    compressedTools,
    llmsTxt,
    qualityScore,
    extractionMode,
    dedupeReport,
    tokenUsage: usage,
  };
}
