import { resolveCliUser } from "@/lib/cli/auth";
import { buildCliInstallBundle } from "@/lib/cli/install-bundle";
import { getPlatformProjectById } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import type { ProcessingLog } from "@/types/platform";

function readLogs(value: unknown): ProcessingLog[] {
  if (Array.isArray(value)) {
    return value as ProcessingLog[];
  }
  return [];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cliUser = await resolveCliUser(_request);
  if (!cliUser) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const { id } = await params;
  const project = await getPlatformProjectById({
    id,
    userId: cliUser.userId,
  });

  if (!project) {
    return new ChatbotError("not_found:document").toResponse();
  }

  const install =
    project.status === "ready"
      ? buildCliInstallBundle(project.artifacts)
      : null;

  return Response.json({
    project: {
      id: project.id,
      name: project.name,
      sourceUrl: project.sourceUrl,
      source: project.source,
      status: project.status,
      logs: readLogs(project.logs),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    },
    mcp:
      project.status === "ready" && install
        ? {
            url: install.endpointUrl,
            token: install.mcpToken,
            serverName: install.serverName,
          }
        : null,
    install,
  });
}
