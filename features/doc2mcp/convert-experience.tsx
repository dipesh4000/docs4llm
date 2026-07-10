"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  LayoutDashboard,
  LayoutGrid,
  Loader2,
  Server,
  Share2,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PipelineProgress } from "@/components/doc2mcp/pipeline-progress";
import {
  ResultDashboard,
  StatusBadge,
} from "@/components/doc2mcp/result-dashboard";
import { RetryConversionButton } from "@/components/doc2mcp/retry-conversion-button";
import { TerminalLog } from "@/components/doc2mcp/terminal-log";
import { Button } from "@/components/ui/button";
import type { PlatformProject } from "@/lib/db/schema";
import type { ProcessingLog, ProjectArtifacts } from "@/types/platform";

const PIPELINE_STEPS = [
  "crawl",
  "auth",
  "extract",
  "workflows",
  "compress",
  "mcp",
  "config",
] as const;

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "connect", label: "Connect", icon: Server },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "insights", label: "Insights", icon: Activity },
] as const;

function stepFromStatus(status: string): number {
  switch (status) {
    case "pending":
      return 0;
    case "crawling":
      return 1;
    case "analyzing":
      return 3;
    case "generating":
      return 5;
    case "ready":
      return 7;
    case "error":
      return -1;
    default:
      return 0;
  }
}

export function ConvertExperience({
  initialProject,
}: {
  initialProject: PlatformProject;
}) {
  const [project, setProject] = useState(initialProject);
  const artifacts = project.artifacts as ProjectArtifacts | null;
  const logs = (project.logs as ProcessingLog[]) ?? [];
  const isProcessing = !["ready", "error"].includes(project.status);
  const isReady = project.status === "ready" && Boolean(artifacts);
  const currentStep = stepFromStatus(project.status);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let delay = 2000;
    let attempts = 0;
    const MAX_ATTEMPTS = 150;

    let authErrorShown = false;

    const poll = async () => {
      if (cancelled) {
        return;
      }
      attempts += 1;

      try {
        const res = await fetch(`/api/projects/${project.id}`);
        if (res.ok) {
          const data = await res.json();
          if (cancelled) {
            return;
          }
          setProject(data.project);
          if (["ready", "error"].includes(data.project.status)) {
            return;
          }
        } else if (
          (res.status === 401 || res.status === 404) &&
          !authErrorShown
        ) {
          authErrorShown = true;
          toast.error(
            res.status === 401
              ? "Session expired — sign in again to track this conversion."
              : "Could not load project updates. Try refreshing or sign in again."
          );
        }
      } catch {
        // Transient network error — keep polling with backoff.
      }

      if (cancelled || attempts >= MAX_ATTEMPTS) {
        return;
      }
      delay = Math.min(Math.round(delay * 1.25), 10_000);
      timer = setTimeout(poll, delay);
    };

    timer = setTimeout(poll, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isProcessing, project.id]);

  const share = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Project link copied");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-border/60 border-r bg-muted/20 px-4 py-5 md:flex">
          <Link className="flex items-center gap-2 px-2" href="/">
            <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold text-[11px] text-white">
              d2
            </span>
            <span className="font-display font-semibold text-sm">doc2mcp</span>
          </Link>

          <div className="mt-6 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="truncate font-medium text-sm">{project.name}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
              {project.sourceUrl}
            </p>
            <div className="mt-2">
              <StatusBadge status={project.status} />
            </div>
          </div>

          {isReady ? (
            <nav className="mt-6 flex flex-col gap-0.5">
              <p className="px-2 pb-1 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                Sections
              </p>
              {SECTIONS.map((section) => (
                <a
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
                  href={`#${section.id}`}
                  key={section.id}
                >
                  <section.icon className="size-4" />
                  {section.label}
                </a>
              ))}
            </nav>
          ) : (
            <div className="mt-6 flex items-center gap-2 px-2 text-muted-foreground text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Building your MCP…
            </div>
          )}

          <div className="mt-auto flex flex-col gap-1 border-border/60 border-t pt-3">
            <Button
              className="justify-start"
              onClick={share}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Share2 className="mr-2 size-3.5" />
              Share
            </Button>
            <Button asChild className="justify-start" size="sm" variant="ghost">
              <Link href="/chat">
                <ArrowLeft className="mr-2 size-3.5" />
                New chat
              </Link>
            </Button>
            <Button asChild className="justify-start" size="sm" variant="ghost">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 size-3.5" />
                Dashboard
              </Link>
            </Button>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-5xl">
            {/* Mobile header */}
            <div className="mb-6 flex items-center justify-between gap-3 md:hidden">
              <Link className="flex items-center gap-2" href="/">
                <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 font-bold text-[11px] text-white">
                  d2
                </span>
                <span className="font-display font-semibold text-sm">
                  doc2mcp
                </span>
              </Link>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={share}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Share2 className="mr-1 size-3.5" />
                  Share
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link href="/chat">
                    <ArrowLeft className="mr-1 size-3.5" />
                    New
                  </Link>
                </Button>
              </div>
            </div>

            {isProcessing ? (
              <div className="space-y-10">
                <section>
                  <p className="font-mono text-muted-foreground text-xs">
                    source
                  </p>
                  <p className="mt-1 truncate font-mono text-sm">
                    {project.sourceUrl}
                  </p>
                  <div className="mt-6">
                    <PipelineProgress
                      currentStep={currentStep}
                      status={project.status}
                      steps={PIPELINE_STEPS}
                    />
                  </div>
                </section>

                <section className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                  <p className="mb-3 font-mono text-muted-foreground text-xs">
                    terminal
                  </p>
                  {logs.length > 0 ? (
                    <TerminalLog
                      lines={logs.map((l) => `[${l.level}] ${l.message}`)}
                      streaming={isProcessing}
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="size-4 animate-spin" />
                      Starting pipeline...
                    </div>
                  )}
                </section>
              </div>
            ) : null}

            <AnimatePresence>
              {isReady && artifacts ? (
                <ResultDashboard artifacts={artifacts} project={project} />
              ) : null}

              {project.status === "error" ? (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center"
                  initial={{ opacity: 0 }}
                >
                  <p className="font-medium text-red-500 dark:text-red-300">
                    Conversion failed
                  </p>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Retry the same URL from here or your dashboard. Retries do
                    not count toward your monthly limit.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                    <RetryConversionButton
                      onSuccess={async () => {
                        const res = await fetch(`/api/projects/${project.id}`);
                        if (res.ok) {
                          const data = (await res.json()) as {
                            project: PlatformProject;
                          };
                          setProject(data.project);
                        }
                      }}
                      projectId={project.id}
                      redirectToConvert={false}
                    />
                    <Button asChild type="button" variant="outline">
                      <Link href="/dashboard/projects">Open dashboard</Link>
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
