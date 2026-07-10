import { connection } from "next/server";
import { getAdminStats, getAllProjects } from "@/lib/db/queries";
import { AdminCharts, type DailyPoint, type StatusSlice } from "./admin-charts";

const SERIES_DAYS = 14;

function buildDailySeries(
  projects: Array<{ createdAt: Date | string; status: string }>
): DailyPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const points: DailyPoint[] = [];
  const indexByKey = new Map<string, number>();

  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    indexByKey.set(key, points.length);
    points.push({
      date: day.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      conversions: 0,
      failed: 0,
    });
  }

  for (const p of projects) {
    const key = new Date(p.createdAt).toISOString().slice(0, 10);
    const idx = indexByKey.get(key);
    if (idx === undefined) {
      continue;
    }
    points[idx].conversions += 1;
    if (p.status === "error") {
      points[idx].failed += 1;
    }
  }

  return points;
}

function buildStatusSlices(projects: Array<{ status: string }>): StatusSlice[] {
  let ready = 0;
  let failed = 0;
  let processing = 0;
  for (const p of projects) {
    if (p.status === "ready") {
      ready += 1;
    } else if (p.status === "error") {
      failed += 1;
    } else {
      processing += 1;
    }
  }
  return [
    { name: "Ready", value: ready, fill: "#22c55e" },
    { name: "Processing", value: processing, fill: "#f59e0b" },
    { name: "Failed", value: failed, fill: "#ef4444" },
  ];
}

export async function AdminOverview() {
  await connection();
  const [statsResult, projectsResult] = await Promise.allSettled([
    getAdminStats(),
    getAllProjects(200),
  ]);
  const stats =
    statsResult.status === "fulfilled"
      ? statsResult.value
      : { totalUsers: 0, totalProjects: 0, totalMCPs: 0 };
  const projects =
    projectsResult.status === "fulfilled" ? projectsResult.value : [];

  let failedJobs = 0;
  let successfulJobs = 0;
  let totalTokens = 0;

  for (const p of projects) {
    if (p.status === "error") {
      failedJobs++;
    } else if (p.status === "ready") {
      successfulJobs++;
    }
    const usage = p.tokenUsage as { total_tokens?: number } | null;
    if (usage?.total_tokens) {
      totalTokens += usage.total_tokens;
    }
  }

  const successRate =
    projects.length > 0
      ? Math.round((successfulJobs / projects.length) * 100)
      : 100;

  const daily = buildDailySeries(projects);
  const statuses = buildStatusSlices(projects);
  const recentProjects = projects.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          hint="all-time"
          label="Total users"
          value={stats.totalUsers}
        />
        <StatCard
          hint="all-time"
          label="Total projects"
          value={stats.totalProjects}
        />
        <StatCard
          hint="generated"
          label="MCP servers"
          value={stats.totalMCPs}
        />
        <StatCard
          accent={successRate >= 90 ? "good" : "warn"}
          hint={`${failedJobs} failed`}
          label="Success rate"
          value={`${successRate}%`}
        />
      </div>

      <AdminCharts daily={daily} statuses={statuses} />

      <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
        <h2 className="font-semibold text-lg">Recent conversions</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          Latest MCP pipeline runs · {failedJobs} failed ·{" "}
          {totalTokens.toLocaleString()} tokens (recent sample)
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-border/50 border-b text-muted-foreground text-xs">
              <tr>
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Source</th>
                <th className="pb-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {recentProjects.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-4 font-medium">{p.name}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="max-w-[240px] truncate py-3 pr-4 text-muted-foreground">
                    {p.sourceUrl}
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "ready"
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
      : status === "error"
        ? "bg-red-500/15 text-red-600 dark:text-red-300"
        : "bg-amber-500/15 text-amber-600 dark:text-amber-300";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 font-medium text-xs capitalize ${cls}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "good" | "warn";
}) {
  const accentClass =
    accent === "good"
      ? "text-emerald-600 dark:text-emerald-300"
      : accent === "warn"
        ? "text-amber-600 dark:text-amber-300"
        : "text-foreground";
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-5">
      <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </p>
      <p className={`mt-2 font-display font-bold text-3xl ${accentClass}`}>
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
