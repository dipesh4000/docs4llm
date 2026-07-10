"use client";

import { useMemo } from "react";
import useSWR from "swr";

type Summary = {
  jobType: string;
  total: number;
  success: number;
  failed: number;
  running: number;
  successRate: number;
  p50DurationMs: number;
  p95DurationMs: number;
  averageDurationMs: number;
};

type Failure = {
  id: string;
  jobType: string;
  projectId: string | null;
  errorClass: string | null;
  errorMessage: string | null;
  durationMs: number;
  traceId: string | null;
  startedAt: string;
};

type ErrorClass = {
  errorClass: string;
  count: number;
};

type Bucket = {
  hourStart: string;
  total: number;
  failed: number;
  avgDurationMs: number;
};

type Runtime = {
  caches: Array<{
    name: string;
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
  }>;
  circuits: Array<{
    host: string;
    state: "closed" | "open" | "half_open";
    failures: number;
    successes: number;
  }>;
  process: {
    nodeVersion: string;
    uptimeSec: number;
    memoryMb: number;
    region: string | null;
  };
};

function fetcher(url: string) {
  return fetch(url).then((r) => r.json());
}

function fmtMs(ms: number): string {
  if (!ms || ms < 0) {
    return "—";
  }
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${(ms / 60_000).toFixed(1)}m`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ObservabilityDashboard({
  summary,
  failures,
  errorClasses,
  buckets,
}: {
  summary: Summary[];
  failures: Failure[];
  errorClasses: ErrorClass[];
  buckets: Bucket[];
}) {
  const { data: runtime } = useSWR<Runtime>(
    "/api/admin/observability/runtime",
    fetcher,
    { refreshInterval: 5000 }
  );

  const totals = useMemo(() => {
    let total = 0;
    let success = 0;
    let failed = 0;
    let running = 0;
    for (const s of summary) {
      total += s.total;
      success += s.success;
      failed += s.failed;
      running += s.running;
    }
    const successRate = total === 0 ? 0 : Math.round((success / total) * 100);
    return { total, success, failed, running, successRate };
  }, [summary]);

  const maxBucket = useMemo(
    () => Math.max(1, ...buckets.map((b) => b.total)),
    [buckets]
  );

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-semibold text-xl">Observability</h2>
        <p className="text-muted-foreground text-sm">
          Pipeline health · last 24 hours · auto-refreshing runtime metrics
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Runs (24h)" value={totals.total} />
        <StatCard
          accent={totals.successRate >= 90 ? "good" : "warn"}
          label="Success rate"
          value={`${totals.successRate}%`}
        />
        <StatCard accent="bad" label="Failed" value={totals.failed} />
        <StatCard label="In progress" value={totals.running} />
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/40 p-6">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h3 className="font-semibold text-base">Hourly throughput</h3>
            <p className="text-muted-foreground text-xs">
              Total runs per hour · red = failures
            </p>
          </div>
        </div>
        <div className="flex h-32 items-end gap-1">
          {buckets.length === 0 ? (
            <p className="self-center text-muted-foreground text-sm">
              No data yet
            </p>
          ) : (
            buckets.map((b) => {
              const heightPct = (b.total / maxBucket) * 100;
              const failedPct = b.total > 0 ? (b.failed / b.total) * 100 : 0;
              return (
                <div
                  className="group relative flex flex-1 flex-col items-center justify-end"
                  key={b.hourStart}
                >
                  <div
                    className="w-full overflow-hidden rounded-t bg-violet-500/30"
                    style={{ height: `${heightPct}%` }}
                    title={`${b.total} runs at ${fmtTime(b.hourStart)} · ${b.failed} failed`}
                  >
                    <div
                      className="w-full bg-red-500/60"
                      style={{ height: `${failedPct}%` }}
                    />
                  </div>
                  <div className="-top-8 pointer-events-none absolute hidden whitespace-nowrap rounded bg-popover px-2 py-1 text-xs shadow group-hover:block">
                    {fmtTime(b.hourStart)} · {b.total} runs · {b.failed} failed
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
          <h3 className="font-semibold text-base">Latency by job type</h3>
          <p className="text-muted-foreground text-xs">
            p50 / p95 / avg over the last 24h
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-border/50 border-b text-muted-foreground text-xs">
                <tr>
                  <th className="pb-2 pr-4">Job</th>
                  <th className="pb-2 pr-4">Runs</th>
                  <th className="pb-2 pr-4">p50</th>
                  <th className="pb-2 pr-4">p95</th>
                  <th className="pb-2">Success</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {summary.length === 0 ? (
                  <tr>
                    <td className="py-3 text-muted-foreground" colSpan={5}>
                      No runs yet
                    </td>
                  </tr>
                ) : (
                  summary.map((s) => (
                    <tr key={s.jobType}>
                      <td className="py-2 pr-4 font-medium capitalize">
                        {s.jobType}
                      </td>
                      <td className="py-2 pr-4">{s.total}</td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {fmtMs(s.p50DurationMs)}
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs">
                        {fmtMs(s.p95DurationMs)}
                      </td>
                      <td className="py-2">{s.successRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
          <h3 className="font-semibold text-base">Top error classes</h3>
          <p className="text-muted-foreground text-xs">
            Failures grouped by inferred class · last 24h
          </p>
          <ul className="mt-4 space-y-2">
            {errorClasses.length === 0 ? (
              <li className="text-muted-foreground text-sm">
                No failures recorded — nice.
              </li>
            ) : (
              errorClasses.map((e) => (
                <li
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-background/50 px-3 py-2"
                  key={e.errorClass}
                >
                  <span className="font-mono text-xs">{e.errorClass}</span>
                  <span className="text-muted-foreground text-sm">
                    {e.count}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
          <h3 className="font-semibold text-base">Cache</h3>
          <p className="text-muted-foreground text-xs">
            In-process LRU caches · live
          </p>
          <div className="mt-4 space-y-2">
            {runtime?.caches?.length ? (
              runtime.caches.map((c) => (
                <div
                  className="rounded-lg border border-border/30 bg-background/50 p-3 text-sm"
                  key={c.name}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{c.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {c.size} entries
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-muted-foreground text-xs">
                    <span>hit rate: {c.hitRate}%</span>
                    <span>hits: {c.hits}</span>
                    <span>misses: {c.misses}</span>
                    <span>evictions: {c.evictions}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No cache activity yet on this instance.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/40 p-6">
          <h3 className="font-semibold text-base">Circuit breakers</h3>
          <p className="text-muted-foreground text-xs">
            Per-host outbound health · live
          </p>
          <div className="mt-4 space-y-2">
            {runtime?.circuits?.length ? (
              runtime.circuits.map((c) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-background/50 p-3 text-sm"
                  key={c.host}
                >
                  <span className="truncate font-mono text-xs">{c.host}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span
                      className={
                        c.state === "open"
                          ? "rounded bg-red-500/15 px-2 py-0.5 text-red-300"
                          : c.state === "half_open"
                            ? "rounded bg-amber-500/15 px-2 py-0.5 text-amber-300"
                            : "rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300"
                      }
                    >
                      {c.state}
                    </span>
                    <span className="text-muted-foreground">
                      ok: {c.successes} · fail: {c.failures}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No outbound calls on this instance yet.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/50 bg-card/40 p-6">
        <h3 className="font-semibold text-base">Recent failures</h3>
        <p className="text-muted-foreground text-xs">
          Last 25 failed pipeline runs · trace ids correlate with Vercel OTel
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-border/50 border-b text-muted-foreground text-xs">
              <tr>
                <th className="pb-2 pr-4">Time</th>
                <th className="pb-2 pr-4">Job</th>
                <th className="pb-2 pr-4">Class</th>
                <th className="pb-2 pr-4">Message</th>
                <th className="pb-2 pr-4">Duration</th>
                <th className="pb-2">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {failures.length === 0 ? (
                <tr>
                  <td className="py-3 text-muted-foreground" colSpan={6}>
                    No failures in the last 24h.
                  </td>
                </tr>
              ) : (
                failures.map((f) => (
                  <tr key={f.id}>
                    <td className="py-2 pr-4 text-muted-foreground text-xs">
                      {fmtTime(f.startedAt)}
                    </td>
                    <td className="py-2 pr-4 capitalize">{f.jobType}</td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {f.errorClass ?? "—"}
                    </td>
                    <td className="max-w-[320px] truncate py-2 pr-4 text-muted-foreground">
                      {f.errorMessage ?? "—"}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">
                      {fmtMs(f.durationMs)}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {f.traceId ? f.traceId.slice(0, 8) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {runtime?.process ? (
        <section className="rounded-2xl border border-border/50 bg-card/40 p-6">
          <h3 className="font-semibold text-base">Runtime</h3>
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-4">
            <Fact label="Node" value={runtime.process.nodeVersion} />
            <Fact
              label="Uptime"
              value={`${Math.round(runtime.process.uptimeSec / 60)}m`}
            />
            <Fact label="Memory" value={`${runtime.process.memoryMb} MB`} />
            <Fact label="Region" value={runtime.process.region ?? "—"} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "good" | "warn" | "bad";
}) {
  const accentClass =
    accent === "good"
      ? "text-emerald-300"
      : accent === "warn"
        ? "text-amber-300"
        : accent === "bad"
          ? "text-red-300"
          : "text-foreground";
  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-5">
      <div className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </div>
      <div className={`mt-1 font-semibold text-2xl ${accentClass}`}>
        {value}
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/30 bg-background/50 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}
