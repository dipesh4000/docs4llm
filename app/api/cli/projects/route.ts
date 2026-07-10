import { resolveCliUser } from "@/lib/cli/auth";
import { getPlatformProjectsByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";

export async function GET(request: Request) {
  const cliUser = await resolveCliUser(request);
  if (!cliUser) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const projects = await getPlatformProjectsByUserId({
    userId: cliUser.userId,
  });

  return Response.json({
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      sourceUrl: project.sourceUrl,
      source: project.source,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })),
  });
}
