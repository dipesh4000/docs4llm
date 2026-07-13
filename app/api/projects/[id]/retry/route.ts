import { auth } from "@/app/(auth)/auth";
import { getPlatformProjectById } from "@/lib/db/queries";
import { restartProjectPipeline } from "@/lib/docs4llm/restart-pipeline";
import { ChatbotError } from "@/lib/errors";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  if (session.user.type === "guest") {
    return Response.json(
      {
        error: "auth_required",
        message: "Sign in to retry this conversion.",
      },
      { status: 401 }
    );
  }

  const { id } = await params;
  const project = await getPlatformProjectById({
    id,
    userId: session.user.id,
  });

  if (!project) {
    return new ChatbotError("not_found:document").toResponse();
  }

  if (project.status !== "error") {
    return Response.json(
      {
        error: "invalid_state",
        message: "Only failed conversions can be retried.",
      },
      { status: 400 }
    );
  }

  try {
    await restartProjectPipeline(project);
    return Response.json({ id: project.id, status: "pending" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not restart pipeline.";
    return Response.json({ error: "retry_failed", message }, { status: 500 });
  }
}
