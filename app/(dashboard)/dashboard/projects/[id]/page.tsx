import { notFound, redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ProjectDetail } from "@/components/dashboard/project-detail";
import { getMcpHitStats, getPlatformProjectById } from "@/lib/db/queries";
import { generateMcpExportBundle, redactSecrets } from "@/services/mcp/exports";
import type { ProjectArtifacts } from "@/types/platform";

export default async function DashboardProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?redirectUrl=/dashboard/projects/${id}`);
  }

  const project = await getPlatformProjectById({
    id,
    userId: session.user.id,
  });

  if (!project) {
    notFound();
  }

  const artifacts = project.artifacts as ProjectArtifacts | null;
  const exportBundle = artifacts?.mcpConfig
    ? generateMcpExportBundle({
        config: artifacts.mcpConfig,
        generationReport: artifacts.generationReport,
        redact: true,
      })
    : null;

  const hitStats = await getMcpHitStats({ projectId: id });

  return (
    <ProjectDetail
      canPublishCompany
      exportBundle={exportBundle}
      hitStats={hitStats}
      initialProject={redactSecrets(project)}
    />
  );
}
