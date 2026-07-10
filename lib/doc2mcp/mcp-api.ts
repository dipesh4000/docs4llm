import {
  getMarketplaceProjectById,
  getMcpAccessTokenByHash,
  getPlatformProjectForMcp,
  getPlatformProjectMetaForMcp,
  recordMcpHit,
  touchMcpAccessTokenLastUsed,
} from "@/lib/db/queries";
import type { PlatformProject } from "@/lib/db/schema";
import { readMcpAuthToken, verifyMcpToken } from "@/lib/doc2mcp/mcp-access";
import {
  hashMcpUserAccessToken,
  isMcpUserAccessToken,
} from "@/lib/doc2mcp/mcp-user-tokens";
import type { CrawlResult, ProjectArtifacts } from "@/types/platform";

export type ResolveMcpProjectOptions = {
  /**
   * Skip loading the multi-megabyte `crawlData` JSON column. Only the
   * project metadata + artifacts are returned, so `pages` will be `[]`.
   *
   * Use for `tools/list` and any other endpoint that doesn't need the
   * crawled pages — saves a 4-8 MB JSON parse per request.
   */
  withPages?: boolean;
};

async function isMarketplaceEligibleProject(
  projectId: string
): Promise<boolean> {
  const row = await getMarketplaceProjectById(projectId);
  return row !== null;
}

async function resolveUserMcpToken(token: string | null) {
  if (!isMcpUserAccessToken(token)) {
    return null;
  }
  const row = await getMcpAccessTokenByHash({
    tokenHash: hashMcpUserAccessToken(token as string),
  });
  if (!row || row.revokedAt) {
    return null;
  }
  touchMcpAccessTokenLastUsed({ id: row.id }).catch(() => {
    // best-effort
  });
  return row;
}

export async function resolveMcpProject(
  request: Request,
  projectId: string,
  options: ResolveMcpProjectOptions = {}
) {
  const { withPages = true } = options;
  const token = readMcpAuthToken(request);
  const project = withPages
    ? await getPlatformProjectForMcp({ id: projectId })
    : await getPlatformProjectMetaForMcp({ id: projectId });

  if (!project) {
    return { error: "not_found" as const };
  }

  const artifacts = project.artifacts as ProjectArtifacts | null;
  const storedHash = artifacts?.mcpTokenHash;

  const projectTokenOk = verifyMcpToken(token, storedHash);
  let userTokenOk = false;

  if (!projectTokenOk && token) {
    const userToken = await resolveUserMcpToken(token);
    if (userToken) {
      userTokenOk = await isMarketplaceEligibleProject(projectId);
    }
  }

  if (!projectTokenOk && !userTokenOk) {
    return { error: "unauthorized" as const };
  }

  if (project.status !== "ready") {
    return { error: "not_ready" as const };
  }

  const pages = withPages
    ? ((project.crawlData as CrawlResult[] | null) ?? [])
    : [];

  return { project, pages, artifacts };
}

/**
 * Fire-and-forget attribution of an MCP hit to developer vs company traffic.
 * Never awaited by callers so analytics can't slow or break an MCP response.
 */
export function attributeMcpHit(project: {
  id: string;
  ownerType: PlatformProject["ownerType"];
  teamId: string | null;
}): void {
  recordMcpHit({
    projectId: project.id,
    ownerType: project.ownerType,
    teamId: project.teamId,
  }).catch(() => {
    // best-effort tracking; never block an MCP response
  });
}

export function mcpJson(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}

export function mcpError(code: string, status: number): Response {
  return mcpJson({ error: code }, status);
}
