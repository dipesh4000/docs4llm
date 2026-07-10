import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderGit2,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { DashboardTour } from "@/components/onboarding/dashboard-tour";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformProjectsByUserId } from "@/lib/db/queries";
import type { PlatformProject } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { redactSecrets } from "@/services/mcp/exports";

const STATUS_META: Record<
  PlatformProject["status"],
  { label: string; tone: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    tone: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  crawling: {
    label: "Crawling",
    tone: "bg-sky-500/15 text-sky-300",
    icon: Sparkles,
  },
  analyzing: {
    label: "Analyzing",
    tone: "bg-violet-500/15 text-violet-300",
    icon: Sparkles,
  },
  generating: {
    label: "Generating",
    tone: "bg-amber-500/15 text-amber-300",
    icon: Sparkles,
  },
  ready: {
    label: "Ready",
    tone: "bg-emerald-500/15 text-emerald-300",
    icon: CheckCircle2,
  },
  error: { label: "Error", tone: "bg-red-500/15 text-red-300", icon: XCircle },
};

export default async function DashboardOverviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirectUrl=/dashboard");
  }

  const projects = await getPlatformProjectsByUserId({
    userId: session.user.id,
  });

  const readyCount = projects.filter(
    (project) => project.status === "ready"
  ).length;
  const inFlightCount = projects.filter(
    (project) =>
      project.status === "crawling" ||
      project.status === "analyzing" ||
      project.status === "generating" ||
      project.status === "pending"
  ).length;

  const recentProjects = redactSecrets(projects.slice(0, 6));

  return (
    <div className="space-y-8">
      <DashboardTour />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
            Dashboard
          </p>
          <h1 className="mt-1 font-display font-bold text-3xl tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Ship MCP servers from any documentation site in minutes.
          </p>
        </div>
        <Button asChild data-tour="dash-new" type="button">
          <Link href="/chat">
            <Zap className="mr-1 size-4" />
            New conversion
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard hint="Unlimited" label="Conversions" value="Unlimited" />
        <StatCard hint="All-time" label="Projects" value={projects.length} />
        <StatCard
          hint="Live MCP endpoints"
          label="Ready MCPs"
          value={readyCount}
        />
        <StatCard
          hint="Crawling now"
          label="In progress"
          value={inFlightCount}
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Recent projects</h2>
            <p className="text-muted-foreground text-sm">
              Last 6 MCP conversions for {session.user.email}
            </p>
          </div>
          <Button asChild size="sm" type="button" variant="outline">
            <Link href="/dashboard/projects">
              View all
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </div>

        {recentProjects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="rounded-full bg-violet-500/10 p-3 text-violet-300">
                <FolderGit2 className="size-6" />
              </div>
              <CardTitle>No conversions yet</CardTitle>
              <CardDescription>
                Paste any docs URL on the home page to generate your first MCP
                server.
              </CardDescription>
              <Button asChild className="mt-2" type="button">
                <Link href="/chat">Start your first conversion</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recentProjects.map((project) => (
              <ProjectSummaryCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" data-tour="dash-plan">
          <CardHeader>
            <CardTitle>Your plan</CardTitle>
            <CardDescription>
              Free tier — unlimited conversions for hackathon use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <PlanFact label="Conversions / month" value="Unlimited" />
              <PlanFact label="Pages per site" value="Unlimited" />
              <PlanFact label="Private projects" value="Yes" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild type="button" variant="ghost">
                <Link href="/dashboard/usage">View usage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card data-tour="dash-links">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
            <CardDescription>Common dashboard actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              asChild
              className="w-full justify-between"
              type="button"
              variant="outline"
            >
              <Link href="/dashboard/projects">
                Manage projects
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              className="w-full justify-between"
              type="button"
              variant="outline"
            >
              <Link href="/dashboard/settings">
                Account settings
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button
              asChild
              className="w-full justify-between"
              type="button"
              variant="outline"
            >
              <Link href="/docs">
                Read docs
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-5">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
          {label}
        </p>
        <p className="font-display font-bold text-3xl">{value}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
      <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 font-semibold text-base">{value}</p>
    </div>
  );
}

function ProjectSummaryCard({ project }: { project: PlatformProject }) {
  const status = STATUS_META[project.status];
  const StatusIcon = status.icon;
  return (
    <Card className="transition-colors hover:border-border">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <Link
              className="block truncate font-medium text-base hover:underline"
              href={`/dashboard/projects/${project.id}`}
            >
              {project.name}
            </Link>
            <p className="mt-0.5 truncate font-mono text-muted-foreground text-xs">
              {project.sourceUrl}
            </p>
          </div>
          <Badge className={cn("gap-1", status.tone)} variant="outline">
            <StatusIcon className="size-3" />
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span>
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </span>
          <Link
            className="inline-flex items-center gap-1 hover:text-foreground"
            href={`/dashboard/projects/${project.id}`}
          >
            Open
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
