import "server-only";

import { after } from "next/server";
import { updatePlatformProject } from "@/lib/db/queries";
import type { PlatformProject } from "@/lib/db/schema";
import { enqueuePipelineJob, isQstashConfigured } from "@/lib/queue/qstash";
import { generateUUID } from "@/lib/utils";
import { processProjectPipeline } from "@/services/pipeline/process-project";
import type { SourceType } from "@/types/platform";

export async function restartProjectPipeline(project: PlatformProject) {
  if (!project.sourceUrl) {
    throw new Error("Project is missing a source URL.");
  }

  const sourceUrl = project.sourceUrl;
  const sourceType = project.sourceType as SourceType;
  const projectName = project.name;

  await updatePlatformProject({
    id: project.id,
    userId: project.userId,
    data: {
      status: "pending",
      logs: [
        {
          id: generateUUID(),
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Retrying doc2mcp pipeline…",
          phase: "retry",
        },
      ],
    },
  });

  const jobPayload = {
    projectId: project.id,
    userId: project.userId,
    sourceUrl,
    sourceType,
    projectName,
  };

  if (isQstashConfigured()) {
    try {
      await enqueuePipelineJob(jobPayload);
      return;
    } catch (error) {
      console.error(
        "QStash enqueue failed on retry, falling back to after():",
        error
      );
    }
  }

  after(() => processProjectPipeline(jobPayload));
}
