import { after } from "next/server";
import { z } from "zod";
import { resolveCliUser } from "@/lib/cli/auth";
import { createPlatformProject } from "@/lib/db/queries";
import { detectSourceTypeFromUrl } from "@/lib/docs4llm/detect-source-type";
import { deriveMcpServerSlug } from "@/lib/docs4llm/naming";
import { ChatbotError } from "@/lib/errors";
import { enqueuePipelineJob, isQstashConfigured } from "@/lib/queue/qstash";
import { processProjectPipeline } from "@/services/pipeline/process-project";

const bodySchema = z.object({
  sourceUrl: z.string().url(),
});

export async function POST(request: Request) {
  const cliUser = await resolveCliUser(request);
  if (!cliUser) {
    return new ChatbotError("unauthorized:api").toResponse();
  }

  try {
    const { sourceUrl } = bodySchema.parse(await request.json());
    const sourceType = detectSourceTypeFromUrl(sourceUrl);
    const name = deriveMcpServerSlug(sourceUrl);

    const project = await createPlatformProject({
      userId: cliUser.userId,
      name,
      sourceUrl,
      sourceType,
      source: "cli",
    });

    const jobPayload = {
      projectId: project.id,
      userId: cliUser.userId,
      sourceUrl,
      sourceType,
      projectName: name,
    };

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
    console.error("CLI convert API error:", error);
    return new ChatbotError("bad_request:api").toResponse();
  }
}
