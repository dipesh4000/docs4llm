"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileText,
  Plus,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { InstallButtons } from "@/components/doc2mcp/install-buttons";
import { RegistryStatusCard } from "@/components/doc2mcp/registry-status-card";
import { Button } from "@/components/ui/button";
import type { PlatformProject } from "@/lib/db/schema";
import { buildInstallTargets } from "@/lib/marketplace/install";
import { cn } from "@/lib/utils";
import { DOC_MCP_TOOLS } from "@/services/mcp/doc-tools";
import { generateMcpExportBundle } from "@/services/mcp/exports";
import type {
  CompressedTool,
  McpServerConfig,
  ProcessingLog,
  ProjectArtifacts,
  ProjectStatus,
  SuggestedWorkflow,
} from "@/types/platform";

const AGENT_BADGES = ["Cursor", "Claude", "OpenAI", "VS Code", "Windsurf"];

function useLiveOrigin(): string | null {
  const [origin, setOrigin] = useState<string | null>(null);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  return origin;
}

function fixMcpUrlsInText(text: string, origin: string | null): string {
  if (!origin) {
    return text;
  }
  return text.replace(/https?:\/\/[^/"\\\s]+(\/api\/mcp\/)/g, `${origin}$1`);
}

function fixMcpUrlsInConfig(
  config: McpServerConfig | null,
  origin: string | null
): McpServerConfig | null {
  if (!(config && origin)) {
    return config;
  }
  try {
    return JSON.parse(fixMcpUrlsInText(JSON.stringify(config), origin));
  } catch {
    return config;
  }
}

function getServerUrl(config: McpServerConfig | null): string | null {
  const servers = (
    config?.cursorConfig as
      | { mcpServers?: Record<string, { url?: string }> }
      | undefined
  )?.mcpServers;
  if (!servers) {
    return null;
  }
  return Object.values(servers).at(0)?.url ?? null;
}

type DisplayTool = { name: string; description: string; endpoints: string[] };

function buildDisplayTools(project: CompressedTool[]): DisplayTool[] {
  const map = new Map<string, DisplayTool>();
  for (const tool of DOC_MCP_TOOLS) {
    map.set(tool.name, {
      name: tool.name,
      description: tool.description,
      endpoints: [],
    });
  }
  for (const tool of project) {
    const existing = map.get(tool.name);
    if (existing) {
      if (tool.description) {
        existing.description = tool.description;
      }
      if (tool.endpoints?.length) {
        existing.endpoints = tool.endpoints;
      }
    } else {
      map.set(tool.name, {
        name: tool.name,
        description: tool.description ?? "",
        endpoints: tool.endpoints ?? [],
      });
    }
  }
  return [...map.values()];
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function copyText(text: string, label: string) {
  await navigator.clipboard.writeText(text);
  toast.success(`${label} copied`);
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function StatusBadge({ status }: { status: ProjectStatus | string }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-600 uppercase tracking-wider dark:text-emerald-300">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
        </span>
        Live
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 font-mono text-[10px] text-red-600 uppercase tracking-wider dark:text-red-300">
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-mono text-[10px] text-sky-600 uppercase tracking-wider dark:text-sky-300">
      <span className="size-1.5 animate-pulse rounded-full bg-sky-400" />
      {status}
    </span>
  );
}

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

/** Editorial corner crosshairs that frame a bordered block. */
function CornerPlus() {
  const base = "pointer-events-none absolute size-3 text-muted-foreground/40";
  return (
    <>
      <Plus className={cn(base, "-left-1.5 -top-1.5")} />
      <Plus className={cn(base, "-right-1.5 -top-1.5")} />
      <Plus className={cn(base, "-bottom-1.5 -left-1.5")} />
      <Plus className={cn(base, "-right-1.5 -bottom-1.5")} />
    </>
  );
}

/** Hairline-bordered container; cells inside add border-b / border-r. */
function Framed({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative border-border/60 border-t border-l bg-background/30",
        className
      )}
    >
      <CornerPlus />
      {children}
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  highlight,
  description,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p className="font-serif text-muted-foreground text-sm italic underline decoration-border underline-offset-4">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-display font-semibold text-3xl tracking-tight sm:text-4xl">
        {title}
        {highlight ? (
          <>
            {" "}
            <span className="underline decoration-2 decoration-foreground/30 underline-offset-[6px]">
              {highlight}
            </span>
          </>
        ) : null}
      </h2>
      {description ? (
        <p className="mt-3 text-balance text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

const CELL = "border-border/60 border-r border-b p-6";

function MetricCell({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  const display = useCountUp(value);
  return (
    <div className={cn(CELL, "flex flex-col gap-2")}>
      <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="font-display font-semibold text-4xl tabular-nums tracking-tight">
        {display}
        {suffix}
      </span>
    </div>
  );
}

function ToolsGrid({ tools }: { tools: DisplayTool[] }) {
  return (
    <Framed className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <div className={cn(CELL, "flex flex-col gap-2")} key={tool.name}>
          <p className="font-medium font-mono text-foreground text-sm">
            {tool.name}
            <span className="text-muted-foreground">()</span>
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {tool.description}
          </p>
          {tool.endpoints.length > 0 ? (
            <p className="mt-auto truncate pt-2 font-mono text-[10px] text-muted-foreground/60">
              {tool.endpoints.join(" · ")}
            </p>
          ) : null}
        </div>
      ))}
    </Framed>
  );
}

const LOG_TONE: Record<string, string> = {
  success: "bg-emerald-400",
  error: "bg-red-400",
  warn: "bg-amber-400",
  info: "bg-sky-400",
};

function InsightsSection({
  workflows,
  logs,
}: {
  workflows: SuggestedWorkflow[];
  logs: ProcessingLog[];
}) {
  if (workflows.length === 0 && logs.length === 0) {
    return null;
  }
  return (
    <section className="scroll-mt-8" id="insights">
      <SectionIntro
        description="What doc2mcp inferred while building your server."
        eyebrow="Under the hood"
        highlight="Insights"
        title="Behind the"
      />
      <div className="grid gap-px overflow-hidden lg:grid-cols-2">
        {workflows.length > 0 ? (
          <Framed className="p-6">
            <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              Suggested workflows
            </p>
            <div className="mt-4 space-y-3">
              {workflows.slice(0, 5).map((workflow) => (
                <div
                  className="flex items-start justify-between gap-3"
                  key={workflow.id}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{workflow.name}</p>
                    <p className="truncate text-muted-foreground text-xs">
                      {workflow.description}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-emerald-600 text-xs dark:text-emerald-300">
                    {workflow.confidence}%
                  </span>
                </div>
              ))}
            </div>
          </Framed>
        ) : null}

        {logs.length > 0 ? (
          <Framed className="p-6">
            <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              <Activity className="size-3.5" />
              Build activity
            </p>
            <ol className="relative mt-4 ml-1 space-y-3 border-border border-l pl-5">
              {logs.slice(-8).map((log) => (
                <li className="relative" key={log.id}>
                  <span
                    className={cn(
                      "-left-[1.55rem] absolute top-1 size-2 rounded-full",
                      LOG_TONE[log.level] ?? LOG_TONE.info
                    )}
                  />
                  <p className="text-foreground/90 text-sm">{log.message}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {formatDateTime(log.timestamp)}
                  </p>
                </li>
              ))}
            </ol>
          </Framed>
        ) : null}
      </div>
    </section>
  );
}

export function ResultDashboard({
  project,
  artifacts,
}: {
  project: PlatformProject;
  artifacts: ProjectArtifacts;
}) {
  const origin = useLiveOrigin();
  const logs = (project.logs as ProcessingLog[]) ?? [];

  const displayTools = useMemo(
    () => buildDisplayTools(artifacts.compressedTools ?? []),
    [artifacts.compressedTools]
  );

  const fixedConfig = useMemo(
    () => fixMcpUrlsInConfig(artifacts.mcpConfig, origin),
    [artifacts.mcpConfig, origin]
  );
  const endpoint = useMemo(() => getServerUrl(fixedConfig), [fixedConfig]);
  const json = useMemo(
    () => JSON.stringify(fixedConfig, null, 2),
    [fixedConfig]
  );
  const serverName = fixedConfig?.name ?? "mcp";

  const pageCount = artifacts.docsPageCount ?? 0;
  const endpointCount = artifacts.endpoints?.length ?? 0;
  const mcpScore = artifacts.qualityScore?.mcpScore ?? 0;
  const token = artifacts.mcpAccessToken ?? null;

  const exportBundle = useMemo(() => {
    if (!fixedConfig) {
      return null;
    }
    return generateMcpExportBundle({
      config: fixedConfig,
      generationReport: artifacts.generationReport,
    });
  }, [fixedConfig, artifacts.generationReport]);

  const installTargets = useMemo(
    () => buildInstallTargets({ mcpConfig: fixedConfig }),
    [fixedConfig]
  );

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="space-y-20 pb-10"
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Hero */}
      <section className="scroll-mt-8 text-center" id="overview">
        <div className="flex justify-center">
          <StatusBadge status="ready" />
        </div>
        <h1 className="mt-5 font-display font-semibold text-5xl tracking-tight sm:text-6xl">
          {project.name}
        </h1>
        <p className="mt-3 text-balance text-lg text-muted-foreground">
          Documentation infrastructure for AI agents
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
          <a
            className="inline-flex max-w-full items-center gap-1.5 truncate font-mono text-muted-foreground text-xs hover:text-foreground"
            href={project.sourceUrl ?? "#"}
            rel="noopener noreferrer"
            target="_blank"
          >
            {project.sourceUrl}
            <ArrowUpRight className="size-3 shrink-0" />
          </a>
          <span className="font-mono text-muted-foreground text-xs">
            Last sync {formatDateTime(project.updatedAt)}
          </span>
        </div>
      </section>

      {/* Metrics */}
      <section>
        <Framed className="grid grid-cols-2 lg:grid-cols-4">
          <MetricCell label="Pages indexed" value={pageCount} />
          <MetricCell label="MCP tools" value={displayTools.length} />
          <MetricCell label="API endpoints" value={endpointCount} />
          <MetricCell label="MCP score" suffix="%" value={mcpScore} />
        </Framed>
      </section>

      {/* Connect */}
      <section className="scroll-mt-8" id="connect">
        <SectionIntro
          description="One endpoint, one token. Drop it into any AI editor — no local install, no API keys."
          eyebrow="Get connected"
          highlight="in seconds"
          title="Plug into your editor"
        />

        {installTargets ? (
          <div className="mb-px">
            <InstallButtons targets={installTargets} />
          </div>
        ) : null}

        <RegistryStatusCard className="mb-px" registry={artifacts.registry} />

        <Framed className="grid grid-cols-1 lg:grid-cols-2">
          {endpoint ? (
            <div className={cn(CELL, "space-y-3")}>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Remote endpoint
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-1.5 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-foreground/90 text-xs">
                  {endpoint}
                </code>
                <Button
                  onClick={() => copyText(endpoint, "Endpoint")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Copy className="mr-1 size-3.5" />
                  Copy
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AGENT_BADGES.map((badge) => (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground"
                    key={badge}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {token ? (
            <div className={cn(CELL, "space-y-3")}>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Access token
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-[11px]">
                  {token}
                </code>
                <Button
                  onClick={() => copyText(token, "Project token")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Copy className="mr-1 size-3.5" />
                  Copy
                </Button>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Paste the config into Cursor → Settings → MCP. doc2mcp serves
                {` ${pageCount} `}
                pages over the remote URL with this Bearer token.
              </p>
            </div>
          ) : null}
        </Framed>

        <details className="group relative mt-px border-border/60 border-t border-l bg-background/30">
          <CornerPlus />
          <summary className="flex cursor-pointer items-center justify-between border-border/60 border-r border-b p-4 font-medium text-sm">
            <span className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              MCP configuration (JSON)
            </span>
            <span className="flex gap-1">
              <Button
                onClick={(event) => {
                  event.preventDefault();
                  copyText(json, "MCP config");
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Copy className="size-3.5" />
              </Button>
              <Button
                onClick={(event) => {
                  event.preventDefault();
                  downloadFile(`${serverName}-server.json`, json);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <Download className="size-3.5" />
              </Button>
            </span>
          </summary>
          <pre className="max-h-80 overflow-auto border-border/60 border-r border-b p-4 font-mono text-[11px] leading-relaxed">
            {json}
          </pre>
        </details>
      </section>

      {/* Tools */}
      <section className="scroll-mt-8" id="tools">
        <SectionIntro
          description={`${displayTools.length} tools your AI agent can call against this documentation.`}
          eyebrow="Capabilities"
          highlight="can call"
          title="Tools your agent"
        />
        <ToolsGrid tools={displayTools} />
      </section>

      {/* Advanced configs */}
      {exportBundle ? (
        <section>
          <SectionIntro
            description="Configs for Claude Desktop, Windsurf, OpenAI Agents SDK, and custom MCP clients."
            eyebrow="Everywhere"
            highlight="configs"
            title="Advanced"
          />
          <Framed className="grid grid-cols-1 lg:grid-cols-2">
            {exportBundle.artifacts.map((artifact) => {
              const content = fixMcpUrlsInText(artifact.content, origin);
              return (
                <div className={CELL} key={artifact.id}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{artifact.label}</h3>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => copyText(content, artifact.label)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        onClick={() => downloadFile(artifact.filename, content)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Download className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-muted/40 p-3 font-mono text-[10px]">
                    {content}
                  </pre>
                </div>
              );
            })}
          </Framed>
        </section>
      ) : null}

      <InsightsSection logs={logs} workflows={artifacts.workflows ?? []} />

      <div className="flex items-center justify-center gap-2 border-emerald-500/30 border-y bg-emerald-500/5 py-6">
        <Check className="size-5 text-emerald-500" />
        <p className="font-medium text-emerald-600 dark:text-emerald-300">
          MCP ready — paste the config into Cursor and reload
        </p>
      </div>
    </motion.div>
  );
}
