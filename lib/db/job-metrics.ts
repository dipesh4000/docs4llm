/**
 * JobMetric queries — observability layer for pipeline runs.
 *
 * All writes go through recordJobStart / recordJobFinish. All reads serve
 * the /admin/observability dashboard.
 */

import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "./client";
import { jobMetric } from "./schema";

export type JobType = "pipeline" | "crawl" | "extract" | "validate";
export type JobStatus =
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export async function recordJobStart(params: {
  jobType: JobType;
  projectId?: string;
  userId?: string;
  attempt?: number;
  traceId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const [row] = await db
    .insert(jobMetric)
    .values({
      jobType: params.jobType,
      projectId: params.projectId,
      userId: params.userId,
      status: "running",
      attempt: String(params.attempt ?? 1),
      traceId: params.traceId,
      metadata: params.metadata ?? null,
    })
    .returning({ id: jobMetric.id });
  return row?.id ?? "";
}

export async function recordJobFinish(params: {
  id: string;
  status: "success" | "failed" | "cancelled";
  durationMs: number;
  errorClass?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!params.id) {
    return;
  }
  await db
    .update(jobMetric)
    .set({
      status: params.status,
      durationMs: String(Math.round(params.durationMs)),
      errorClass: params.errorClass,
      errorMessage: params.errorMessage?.slice(0, 4000),
      metadata: params.metadata ?? undefined,
      finishedAt: new Date(),
    })
    .where(eq(jobMetric.id, params.id));
}

export type JobMetricSummary = {
  jobType: JobType;
  total: number;
  success: number;
  failed: number;
  running: number;
  successRate: number;
  p50DurationMs: number;
  p95DurationMs: number;
  averageDurationMs: number;
};

/**
 * Aggregate per-jobType stats over the given window. Uses single SQL trip
 * with percentile_cont for percentile latency.
 */
export async function getJobMetricSummary(
  windowHours = 24
): Promise<JobMetricSummary[]> {
  const cutoffIso = new Date(
    Date.now() - windowHours * 60 * 60 * 1000
  ).toISOString();
  const rows = (await db.execute(sql`
    SELECT
      "jobType" AS "jobType",
      COUNT(*)::int AS total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END)::int AS success,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::int AS failed,
      SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END)::int AS running,
      COALESCE(AVG(NULLIF("durationMs", '')::int), 0)::int AS "avgDuration",
      COALESCE(
        percentile_cont(0.5) WITHIN GROUP (
          ORDER BY NULLIF("durationMs", '')::int
        ),
        0
      )::int AS "p50",
      COALESCE(
        percentile_cont(0.95) WITHIN GROUP (
          ORDER BY NULLIF("durationMs", '')::int
        ),
        0
      )::int AS "p95"
    FROM "JobMetric"
    WHERE "startedAt" >= ${cutoffIso}::timestamptz
    GROUP BY "jobType"
    ORDER BY total DESC
  `)) as Array<{
    jobType: JobType;
    total: number;
    success: number;
    failed: number;
    running: number;
    avgDuration: number;
    p50: number;
    p95: number;
  }>;

  return rows.map((r) => ({
    jobType: r.jobType,
    total: Number(r.total) || 0,
    success: Number(r.success) || 0,
    failed: Number(r.failed) || 0,
    running: Number(r.running) || 0,
    successRate:
      r.total > 0 ? Math.round((Number(r.success) / Number(r.total)) * 100) : 0,
    p50DurationMs: Number(r.p50) || 0,
    p95DurationMs: Number(r.p95) || 0,
    averageDurationMs: Number(r.avgDuration) || 0,
  }));
}

export type RecentFailure = {
  id: string;
  jobType: JobType;
  projectId: string | null;
  errorClass: string | null;
  errorMessage: string | null;
  durationMs: number;
  traceId: string | null;
  startedAt: Date;
};

export async function getRecentJobFailures(
  limit = 25
): Promise<RecentFailure[]> {
  const rows = await db
    .select({
      id: jobMetric.id,
      jobType: jobMetric.jobType,
      projectId: jobMetric.projectId,
      errorClass: jobMetric.errorClass,
      errorMessage: jobMetric.errorMessage,
      durationMs: jobMetric.durationMs,
      traceId: jobMetric.traceId,
      startedAt: jobMetric.startedAt,
    })
    .from(jobMetric)
    .where(eq(jobMetric.status, "failed"))
    .orderBy(desc(jobMetric.startedAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    jobType: r.jobType as JobType,
    projectId: r.projectId,
    errorClass: r.errorClass,
    errorMessage: r.errorMessage,
    durationMs: Number(r.durationMs ?? 0),
    traceId: r.traceId,
    startedAt: r.startedAt,
  }));
}

export type ErrorClassBucket = {
  errorClass: string;
  count: number;
};

export async function getErrorClassDistribution(
  windowHours = 24
): Promise<ErrorClassBucket[]> {
  const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);
  const rows = await db
    .select({
      errorClass: jobMetric.errorClass,
      count: sql<number>`count(*)::int`,
    })
    .from(jobMetric)
    .where(
      and(eq(jobMetric.status, "failed"), gte(jobMetric.startedAt, cutoff))
    )
    .groupBy(jobMetric.errorClass)
    .orderBy(desc(sql`count(*)`))
    .limit(10);
  return rows
    .filter((r) => r.errorClass)
    .map((r) => ({
      errorClass: r.errorClass as string,
      count: Number(r.count) || 0,
    }));
}

export type DurationBucket = {
  hourStart: Date;
  total: number;
  failed: number;
  avgDurationMs: number;
};

/**
 * Hourly bucket counts for the past N hours. Used by the dashboard sparkline.
 */
export async function getHourlyBuckets(
  windowHours = 24
): Promise<DurationBucket[]> {
  const cutoffIso = new Date(
    Date.now() - windowHours * 60 * 60 * 1000
  ).toISOString();
  const rows = (await db.execute(sql`
    SELECT
      date_trunc('hour', "startedAt") AS "hourStart",
      COUNT(*)::int AS total,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END)::int AS failed,
      COALESCE(AVG(NULLIF("durationMs", '')::int), 0)::int AS "avgDuration"
    FROM "JobMetric"
    WHERE "startedAt" >= ${cutoffIso}::timestamptz
    GROUP BY date_trunc('hour', "startedAt")
    ORDER BY "hourStart" ASC
  `)) as Array<{
    hourStart: Date;
    total: number;
    failed: number;
    avgDuration: number;
  }>;
  return rows.map((r) => ({
    hourStart: new Date(r.hourStart),
    total: Number(r.total) || 0,
    failed: Number(r.failed) || 0,
    avgDurationMs: Number(r.avgDuration) || 0,
  }));
}
