import { BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlatformProjectsByUserId } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

function buildDailyBuckets(
  projects: Array<{ createdAt: Date }>,
  days = 14
): { label: string; iso: string; count: number }[] {
  const now = new Date();
  const buckets: { label: string; iso: string; count: number }[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - offset);
    buckets.push({
      label: day.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      iso: day.toISOString().slice(0, 10),
      count: 0,
    });
  }
  for (const project of projects) {
    const iso = new Date(project.createdAt).toISOString().slice(0, 10);
    const bucket = buckets.find((b) => b.iso === iso);
    if (bucket) {
      bucket.count += 1;
    }
  }
  return buckets;
}

export default async function DashboardUsagePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?redirectUrl=/dashboard/usage");
  }

  const projects = await getPlatformProjectsByUserId({
    userId: session.user.id,
  });

  const buckets = buildDailyBuckets(projects, 14);
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
          Usage
        </p>
        <h1 className="mt-1 font-display font-bold text-3xl tracking-tight">
          Usage & quotas
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Conversions used and a 14-day activity breakdown.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>This month</CardTitle>
            <CardDescription>
              Unlimited conversions on your current plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: "12%" }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Soft fair-use cap applies
              </span>
            </div>
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <PlanFact label="Plan" value="Free" />
              <PlanFact label="Pages per site" value="Unlimited" />
              <PlanFact label="Re-crawl" value="Manual" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>
              Your recent conversion history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {projects.length} total conversions
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-muted-foreground" />
              Conversions · last 14 days
            </CardTitle>
            <CardDescription>
              Daily MCP conversions for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2">
              {buckets.map((bucket) => (
                <div
                  className="flex flex-1 flex-col items-center gap-1"
                  key={bucket.iso}
                  title={`${bucket.label} · ${bucket.count} conversion${bucket.count === 1 ? "" : "s"}`}
                >
                  <div className="flex h-full w-full items-end">
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        bucket.count > 0 ? "bg-violet-500/70" : "bg-muted"
                      )}
                      style={{
                        height: `${Math.max(6, (bucket.count / maxCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
      <p className="font-mono text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 font-semibold capitalize">{value}</p>
    </div>
  );
}
