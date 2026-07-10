import { auth } from "@/app/(auth)/auth";
import { getPlatformProjectById } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { redactSecrets } from "@/services/mcp/exports";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  const { id } = await params;
  const project = await getPlatformProjectById({
    id,
    userId: session.user.id,
  });

  if (!project) {
    return new ChatbotError("not_found:document").toResponse();
  }

  return Response.json({ project: redactSecrets(project) });
}
