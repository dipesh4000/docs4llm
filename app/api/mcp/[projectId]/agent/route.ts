import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { auth } from "@/app/(auth)/auth";
import { getAsi1Model } from "@/lib/asi1/provider";
import {
  getPlatformProjectById,
  getPlatformProjectForMcp,
} from "@/lib/db/queries";
import {
  buildDocAgentSystemPrompt,
  createDocAgentTools,
} from "@/lib/docs4llm/doc-agent-tools";
import { readMcpAuthToken, verifyMcpToken } from "@/lib/docs4llm/mcp-access";
import { mcpError } from "@/lib/docs4llm/mcp-api";
import type { DocMcpContext } from "@/lib/docs4llm/mcp-tools-runtime";
import type { CrawlResult, ProjectArtifacts } from "@/types/platform";

export const maxDuration = 60;

/**
 * Authorize the internal documentation-chat agent.
 *
 * This endpoint backs our own web chat UI (not the public MCP protocol), so it
 * accepts EITHER a valid `X-Docs4LLM-Token` (external callers) OR the logged-in
 * project owner's session. The latter lets the browser chat work without the
 * MCP token ever being sent to (or redacted on) the client.
 */
async function resolveAgentProject(request: Request, projectId: string) {
  const project = await getPlatformProjectForMcp({ id: projectId });
  if (!project) {
    return { error: "not_found" as const };
  }

  const artifacts = project.artifacts as ProjectArtifacts | null;
  const token = readMcpAuthToken(request);
  let authorized = verifyMcpToken(token, artifacts?.mcpTokenHash);

  if (!authorized) {
    const session = await auth();
    if (session?.user?.id) {
      const owned = await getPlatformProjectById({
        id: projectId,
        userId: session.user.id,
      });
      authorized = Boolean(owned);
    }
  }

  if (!authorized) {
    return { error: "unauthorized" as const };
  }

  if (project.status !== "ready") {
    return { error: "not_ready" as const };
  }

  const pages = (project.crawlData as CrawlResult[] | null) ?? [];
  return { project, pages, artifacts };
}

/**
 * Agentic documentation chat — the same multi-step tool loop Cursor runs.
 *
 * Instead of a fixed `list → search → ask` pipeline, the model is given the
 * real doc tools and decides what to call: it can list pages, search, then
 * open the exact page it needs (by title/url) and read its full content
 * before answering. This is why answers match the quality you get when the
 * MCP is added to Cursor.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  let body: { messages?: UIMessage[] };
  try {
    body = (await request.json()) as { messages?: UIMessage[] };
  } catch {
    return mcpError("bad_request", 400);
  }

  const resolved = await resolveAgentProject(request, projectId);
  if ("error" in resolved) {
    if (resolved.error === "not_found") {
      return mcpError("not_found", 404);
    }
    if (resolved.error === "not_ready") {
      return mcpError("project_not_ready", 409);
    }
    return mcpError("unauthorized", 401);
  }

  const ctx: DocMcpContext = {
    project: {
      id: resolved.project.id,
      name: resolved.project.name,
      sourceUrl: resolved.project.sourceUrl,
    },
    pages: resolved.pages,
    artifacts: resolved.artifacts,
  };

  const result = streamText({
    model: getAsi1Model(),
    system: buildDocAgentSystemPrompt(resolved.project.name),
    messages: await convertToModelMessages(body.messages ?? []),
    tools: createDocAgentTools(ctx),
    stopWhen: stepCountIs(8),
  });

  return result.toUIMessageStreamResponse();
}
