import { auth } from "@/app/(auth)/auth";
import { getPlatformProjectsByUserId } from "@/lib/db/queries";
import type { ProjectArtifacts } from "@/types/platform";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const projects = await getPlatformProjectsByUserId({
    userId: session.user.id,
  });

  const ready = projects
    .filter((p) => {
      const artifacts = p.artifacts as ProjectArtifacts | null;
      return p.status === "ready" && Boolean(artifacts?.mcpAccessToken);
    })
    .map((p) => {
      const artifacts = p.artifacts as ProjectArtifacts | null;
      return {
        id: p.id,
        name: p.name ?? p.sourceUrl ?? "Untitled MCP",
        sourceUrl: p.sourceUrl,
        pageCount: artifacts?.docsPageCount,
      };
    });

  return Response.json({ projects: ready });
}
