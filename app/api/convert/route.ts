import { after } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { createPlatformProject } from "@/lib/db/queries";
import { detectSourceTypeFromUrl } from "@/lib/doc2mcp/detect-source-type";
import { deriveMcpServerSlug } from "@/lib/doc2mcp/naming";
import { ChatbotError } from "@/lib/errors";
import { enqueuePipelineJob, isQstashConfigured } from "@/lib/queue/qstash";
import { processProjectPipeline } from "@/services/pipeline/process-project";

const bodySchema = z.object({
  sourceUrl: z.string().url(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  if (session.user.type === "guest") {
    return Response.json(
      {
        error: "auth_required",
        message: "Sign in or create an account to generate an MCP server.",
      },
      { status: 401 }
    );
  }

  try {
    const { sourceUrl } = bodySchema.parse(await request.json());
    const sourceType = detectSourceTypeFromUrl(sourceUrl);
    const name = deriveMcpServerSlug(sourceUrl);

    const project = await createPlatformProject({
      userId: session.user.id,
      name,
      sourceUrl,
      sourceType,
    });

    const jobPayload = {
      projectId: project.id,
      userId: session.user.id,
      sourceUrl,
      sourceType,
      projectName: name,
    };

    // Prefer QStash so the pipeline runs in its own fresh 60s lambda
    // (the only way to reliably finish on Vercel's Hobby plan). Fall
    // back to `after()` in environments without QStash configured —
    // good enough for local dev and short crawls.
    if (isQstashConfigured()) {
      try {
        await enqueuePipelineJob(jobPayload);
      } catch (error) {
        console.error("QStash enqueue failed, falling back to after():", error);
        after(() => processProjectPipeline(jobPayload));
      }
    } else {
      after(() => processProjectPipeline(jobPayload));
    }

    return Response.json({ id: project.id });
  } catch (error) {
    console.error("Convert API error:", error);
    return new ChatbotError("bad_request:api").toResponse();
  }
}
