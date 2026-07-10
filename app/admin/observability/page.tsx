import { connection } from "next/server";
import { Suspense } from "react";
import { ObservabilityDashboard } from "@/components/admin/observability-dashboard";
import {
  SkeletonStatCards,
  SkeletonTable,
} from "@/components/ui/page-skeleton";
import {
  getErrorClassDistribution,
  getHourlyBuckets,
  getJobMetricSummary,
  getRecentJobFailures,
} from "@/lib/db/job-metrics";

export default function AdminObservabilityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-xl">Observability</h2>
        <p className="text-muted-foreground text-sm">
          Job metrics, error distribution, and recent failures (last 24h)
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-6">
            <SkeletonStatCards />
            <SkeletonTable columns={4} rows={6} />
          </div>
        }
      >
        <ObservabilityData />
      </Suspense>
    </div>
  );
}

async function ObservabilityData() {
  await connection();
  const [summary, failures, errorClasses, buckets] = await Promise.all([
    getJobMetricSummary(24),
    getRecentJobFailures(25),
    getErrorClassDistribution(24),
    getHourlyBuckets(24),
  ]);

  return (
    <ObservabilityDashboard
      buckets={buckets.map((b) => ({
        hourStart: b.hourStart.toISOString(),
        total: b.total,
        failed: b.failed,
        avgDurationMs: b.avgDurationMs,
      }))}
      errorClasses={errorClasses}
      failures={failures.map((f) => ({
        ...f,
        startedAt: f.startedAt.toISOString(),
      }))}
      summary={summary}
    />
  );
}
