"use client";

import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProjectOwnership } from "@/app/(dashboard)/dashboard/projects/[id]/ownership-actions";
import { RegistryStatusCard } from "@/components/docs4llm/registry-status-card";
import { RetryConversionButton } from "@/components/docs4llm/retry-conversion-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PlatformProject } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import type { McpExportArtifact } from "@/services/mcp/exports";
import type {
  CompressedTool,
  GenerationReport,
  ProcessingLog,
  ProjectArtifacts,
} from "@/types/platform";
import { useRealtimeProject } from "./use-realtime-project";

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

type ExportBundle = {
  serverName: string;
  endpointUrl: string;
  artifacts: McpExportArtifact[];
};

type HitStats = { developer: number; company: number; total: number };

export function ProjectDetail({
  initialProject,
  exportBundle,
  canPublishCompany = false,
  hitStats = { developer: 0, company: 0, total: 0 },
}: {
  initialProject: PlatformProject;
  exportBundle: ExportBundle | null;
  canPublishCompany?: boolean;
  hitStats?: HitStats;
}) {
  const { project, isProcessing } = useRealtimeProject(initialProject);
  const artifacts = project.artifacts as ProjectArtifacts | null;
  const tools = artifacts?.compressedTools ?? [];
  const logs = (project.logs as ProcessingLog[] | null) ?? [];
  const status = STATUS_META[project.status];
  const StatusIcon = status.icon;
  const report = artifacts?.generationReport;

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const download = (
    filename: string,
    content: string,
    mime = "application/json"
  ) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
            Project
          </p>
          <h1 className="mt-1 truncate font-display font-bold text-3xl tracking-tight">
            {project.name}
          </h1>
          <p className="mt-1 truncate font-mono text-muted-foreground text-xs">
            {project.sourceUrl}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("gap-1", status.tone)} variant="outline">
            <StatusIcon className="size-3" />
            {status.label}
          </Badge>
          {isProcessing ? (
            <Badge className="gap-1" variant="secondary">
              <Loader2 className="size-3 animate-spin" />
              Live
            </Badge>
          ) : null}
          {project.status === "error" ? (
            <>
              <RetryConversionButton
                projectId={project.id}
                size="sm"
                variant="default"
              />
              <Button asChild size="sm" type="button" variant="outline">
                <Link href={`/convert/${project.id}`}>
                  <ExternalLink className="mr-1 size-3.5" />
                  Pipeline view
                </Link>
              </Button>
            </>
          ) : null}
          {artifacts?.mcpAccessToken ? (
            <Button asChild size="sm" type="button" variant="default">
              <Link href="/chat">Ask in chat</Link>
            </Button>
          ) : null}
          {artifacts?.mcpConfig ? (
            <Button asChild size="sm" type="button" variant="outline">
              <Link href={`/convert/${project.id}`}>
                <ExternalLink className="mr-1 size-3.5" />
                Convert view
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      <ProjectStats
        artifacts={artifacts}
        logs={logs}
        report={report}
        tools={tools}
      />

      {project.status === "error" ? (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-base">Conversion failed</CardTitle>
            <CardDescription>
              Retry with the same documentation URL. Failed attempts are not
              counted in your monthly conversion limit.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <RetryConversionButton projectId={project.id} redirectToConvert />
            <Button asChild type="button" variant="outline">
              <Link href={`/convert/${project.id}`}>View pipeline</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {artifacts?.mcpAccessToken ? (
        <RegistryStatusCard registry={artifacts.registry} />
      ) : null}

      <Tabs defaultValue="tools">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="domain">Domain</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4 space-y-4" value="tools">
          {tools.length === 0 ? (
            <EmptyTabState
              description={
                isProcessing
                  ? "Tools will appear here once the pipeline finishes generating MCP tools."
                  : "No compressed tools were generated for this project."
              }
              title="No tools yet"
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {tools.map((tool) => (
                <ToolCard
                  key={tool.name}
                  onCopySchema={() =>
                    copy(
                      JSON.stringify(tool.parameters, null, 2),
                      "Tool schema"
                    )
                  }
                  tool={tool}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="mt-4 space-y-4" value="exports">
          {exportBundle ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {exportBundle.artifacts.map((artifact) => (
                <Card key={artifact.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="truncate">
                          {artifact.label}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {artifact.installHint}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => copy(artifact.content, artifact.label)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          onClick={() =>
                            download(
                              artifact.filename,
                              artifact.content,
                              artifact.mimeType
                            )
                          }
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[10px] leading-relaxed">
                      {artifact.content}
                    </pre>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyTabState
              description="MCP config exports will be available once the pipeline finishes."
              title="No exports yet"
            />
          )}
        </TabsContent>

        <TabsContent className="mt-4 space-y-4" value="domain">
          <DomainTab
            canPublishCompany={canPublishCompany}
            hitStats={hitStats}
            project={project}
          />
        </TabsContent>

        <TabsContent className="mt-4" value="logs">
          <LogsPanel isProcessing={isProcessing} logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectStats({
  artifacts,
  logs,
  report,
  tools,
}: {
  artifacts: ProjectArtifacts | null;
  logs: ProcessingLog[];
  report: GenerationReport | undefined;
  tools: CompressedTool[];
}) {
  const docsPages = artifacts?.docsPageCount ?? 0;
  const confidence = report?.tools.averageConfidence ?? null;
  const totalEndpoints = artifacts?.endpoints?.length ?? 0;
  const lastLog = logs.at(-1);
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile hint="Pages crawled" label="Docs pages" value={docsPages} />
      <StatTile
        hint="Endpoints extracted"
        label="API endpoints"
        value={totalEndpoints}
      />
      <StatTile
        hint="After validation"
        label="MCP tools"
        value={tools.length}
      />
      <StatTile
        hint={confidence === null ? "Pending" : "Avg tool confidence"}
        label="Confidence"
        value={confidence === null ? "—" : `${confidence}%`}
      />
      {lastLog ? (
        <Card className="lg:col-span-4">
          <CardContent className="flex items-center gap-3 p-4 text-sm">
            <Activity className="size-4 text-muted-foreground" />
            <span className="font-mono text-muted-foreground text-xs">
              {new Date(lastLog.timestamp).toLocaleTimeString()}
            </span>
            <span className="truncate">{lastLog.message}</span>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function StatTile({
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
        <p className="font-display font-bold text-2xl">{value}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function ToolCard({
  tool,
  onCopySchema,
}: {
  tool: CompressedTool;
  onCopySchema: () => void;
}) {
  const endpoints = tool.endpoints ?? [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="font-mono text-sm">{tool.name}</CardTitle>
            <CardDescription className="text-xs">
              {tool.description}
            </CardDescription>
          </div>
          {typeof tool.confidence === "number" ? (
            <Badge variant="outline">{tool.confidence}%</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {endpoints.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {endpoints.slice(0, 6).map((endpoint) => (
              <Badge
                className="font-mono text-[10px]"
                key={endpoint}
                variant="secondary"
              >
                {endpoint}
              </Badge>
            ))}
            {endpoints.length > 6 ? (
              <Badge className="text-[10px]" variant="ghost">
                +{endpoints.length - 6}
              </Badge>
            ) : null}
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button
            onClick={onCopySchema}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Copy className="mr-1 size-3" />
            Copy schema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LogsPanel({
  logs,
  isProcessing,
}: {
  logs: ProcessingLog[];
  isProcessing: boolean;
}) {
  const display = useMemo(() => logs.slice(-200).reverse(), [logs]);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Live pipeline logs</CardTitle>
          <CardDescription>
            {isProcessing
              ? "Streaming via Supabase Realtime + polling fallback."
              : "Final run logs."}
          </CardDescription>
        </div>
        {isProcessing ? (
          <Badge className="gap-1" variant="secondary">
            <Loader2 className="size-3 animate-spin" />
            live
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {display.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No logs yet. The pipeline will start streaming output here.
          </p>
        ) : (
          <ul className="max-h-[480px] space-y-1 overflow-auto rounded-lg bg-black/40 p-3 font-mono text-[11px]">
            {display.map((log) => (
              <li className="flex gap-3" key={log.id}>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={cn("shrink-0 uppercase", levelTone(log.level))}
                >
                  [{log.level}]
                </span>
                <span className="break-all">{log.message}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function levelTone(level: ProcessingLog["level"]) {
  if (level === "error") {
    return "text-red-400";
  }
  if (level === "warn") {
    return "text-amber-400";
  }
  if (level === "success") {
    return "text-emerald-400";
  }
  return "text-muted-foreground";
}

function EmptyTabState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="py-10 text-center">
        <p className="font-semibold text-base">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function DomainTab({
  project,
  canPublishCompany,
  hitStats,
}: {
  project: PlatformProject;
  canPublishCompany: boolean;
  hitStats: HitStats;
}) {
  const [domain, setDomain] = useState(project.customDomain ?? "");
  const [isCompany, setIsCompany] = useState(project.ownerType === "company");
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await updateProjectOwnership({
        projectId: project.id,
        ownerType: isCompany ? "company" : "developer",
        customDomain: domain.trim() ? domain.trim() : null,
      });
      if (result.ok) {
        toast.success(
          isCompany
            ? "Saved as company MCP. Custom domain pending verification."
            : "Saved."
        );
      } else {
        toast.error(result.error ?? "Could not save changes");
      }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4" />
                MCP ownership
              </CardTitle>
              <CardDescription>
                Publish this as official company infrastructure so its traffic
                is attributed to your organization, not an individual developer.
              </CardDescription>
            </div>
            <Badge
              className="shrink-0"
              variant={isCompany ? "default" : "secondary"}
            >
              {isCompany ? "Company" : "Developer"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              checked={isCompany}
              className="mt-0.5 size-4 accent-[#4285f4]"
              disabled={!canPublishCompany}
              onChange={(e) => setIsCompany(e.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="font-medium text-foreground">
                Mark as company MCP
              </span>
              <span className="block text-muted-foreground text-xs">
                {canPublishCompany
                  ? "Hits are tagged as company traffic for billing and analytics."
                  : "Available on Pro and Team plans."}
              </span>
            </span>
          </label>

          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 font-medium text-sm">
              <Globe className="size-3.5" />
              Custom domain
            </p>
            <input
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 font-mono text-sm outline-none focus:border-[#4285f4]"
              disabled={!canPublishCompany}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="mcp.acme.com"
              value={domain}
            />
            <p className="text-muted-foreground text-xs">
              Point a CNAME from this host to{" "}
              <code className="font-mono">cname.docs4llm.site</code>. Domains
              activate once verified.
            </p>
            {project.customDomain ? (
              <p className="text-xs">
                Status:{" "}
                {project.customDomainVerified ? (
                  <span className="text-emerald-500">Verified · live</span>
                ) : (
                  <span className="text-amber-500">Pending verification</span>
                )}
              </p>
            ) : null}
          </div>

          <Button disabled={pending || !canPublishCompany} onClick={save}>
            {pending ? <Loader2 className="mr-1 size-4 animate-spin" /> : null}
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage attribution</CardTitle>
          <CardDescription>
            MCP tool calls split by who owns the traffic.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-3">
          <AttributionStat label="Total hits" value={hitStats.total} />
          <AttributionStat label="Company" value={hitStats.company} />
          <AttributionStat label="Developer" value={hitStats.developer} />
        </CardContent>
      </Card>
    </div>
  );
}

function AttributionStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 font-display font-bold text-2xl">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
