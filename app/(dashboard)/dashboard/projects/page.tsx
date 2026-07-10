import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { ProjectsExplorer } from "@/components/dashboard/projects-explorer";
import { Button } from "@/components/ui/button";
import { getPlatformProjectsByUserId } from "@/lib/db/queries";
import { redactSecrets } from "@/services/mcp/exports";

export default async function DashboardProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirectUrl=/dashboard/projects");
  }

  const projects = await getPlatformProjectsByUserId({
    userId: session.user.id,
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
            Projects
          </p>
          <h1 className="mt-1 font-display font-bold text-3xl tracking-tight">
            All MCP projects
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            {projects.length} project{projects.length === 1 ? "" : "s"} ·
            Search, filter, and inspect your MCP servers.
          </p>
        </div>
        <Button asChild type="button">
          <Link href="/chat">
            <Plus className="mr-1 size-4" />
            New conversion
          </Link>
        </Button>
      </header>

      <ProjectsExplorer projects={redactSecrets(projects)} />
    </div>
  );
}
