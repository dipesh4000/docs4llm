import { Activity, Server } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getMcpHitStatsForUserProjects,
  getPlatformProjectsByUserId,
} from "@/lib/db/queries";

export default async function DashboardMcpUsagePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirectUrl=/dashboard/mcp");
  }

  const [projects, hits] = await Promise.all([
    getPlatformProjectsByUserId({ userId: session.user.id }),
    getMcpHitStatsForUserProjects({ userId: session.user.id }),
  ]);

  const byProject = new Map<
    string,
    { name: string; sourceUrl: string | null; total: number; days: number }
  >();

  for (const project of projects) {
    byProject.set(project.id, {
      name: project.name ?? "Untitled",
      sourceUrl: project.sourceUrl,
      total: 0,
      days: 0,
    });
  }
  for (const hit of hits) {
    const row = byProject.get(hit.projectId) ?? {
      name: hit.projectName ?? "Untitled",
      sourceUrl: hit.sourceUrl,
      total: 0,
      days: 0,
    };
    row.total += hit.count;
    row.days += 1;
    byProject.set(hit.projectId, row);
  }

  const rows = [...byProject.entries()]
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
          MCP analytics
        </p>
        <h1 className="mt-1 font-display font-bold text-3xl tracking-tight">
          MCP usage
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
          See which of your hosted MCPs are getting traffic — daily hit
          aggregates from live tool calls.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total hits</CardDescription>
            <CardTitle className="font-display text-3xl">
              {grandTotal}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active MCPs</CardDescription>
            <CardTitle className="font-display text-3xl">
              {rows.filter((r) => r.total > 0).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projects</CardDescription>
            <CardTitle className="font-display text-3xl">
              {projects.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4" />
            Per-MCP traffic
          </CardTitle>
          <CardDescription>
            Relative bar = share of your total MCP hits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No MCP projects yet.{" "}
              <Link className="underline" href="/chat">
                Convert a docs URL
              </Link>{" "}
              to start tracking.
            </p>
          ) : (
            rows.map((row) => (
              <div className="space-y-1.5" key={row.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      className="flex items-center gap-2 truncate font-medium text-sm hover:underline"
                      href={`/dashboard/projects/${row.id}`}
                    >
                      <Server className="size-3.5 shrink-0 text-muted-foreground" />
                      {row.name}
                    </Link>
                    {row.sourceUrl ? (
                      <p className="truncate font-mono text-[10px] text-muted-foreground">
                        {row.sourceUrl}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="outline">{row.total} hits</Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/80"
                    style={{
                      width: `${Math.max(4, Math.round((row.total / maxTotal) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
