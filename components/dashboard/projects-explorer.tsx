"use client";

import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  RefreshCw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { RetryConversionButton } from "@/components/docs4llm/retry-conversion-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PlatformProject } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "ready", label: "Ready" },
  { id: "in_progress", label: "In progress" },
  { id: "error", label: "Error" },
] as const;

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

type StatusFilterId = (typeof STATUS_FILTERS)[number]["id"];

function matchesStatus(
  filter: StatusFilterId,
  status: PlatformProject["status"]
) {
  if (filter === "all") {
    return true;
  }
  if (filter === "in_progress") {
    return (
      status === "pending" ||
      status === "crawling" ||
      status === "analyzing" ||
      status === "generating"
    );
  }
  return status === filter;
}

export function ProjectsExplorer({
  projects,
}: {
  projects: PlatformProject[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterId>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (!matchesStatus(statusFilter, project.status)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack =
        `${project.name} ${project.sourceUrl ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [projects, search, statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by project name or source URL"
            value={search}
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/40 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              className={cn(
                "rounded-md px-3 py-1.5 font-medium text-xs transition-colors",
                statusFilter === filter.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
        <Button
          disabled={refreshing}
          onClick={handleRefresh}
          size="icon"
          type="button"
          variant="outline"
        >
          <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="rounded-full bg-muted p-3 text-muted-foreground">
              <FolderGit2 className="size-6" />
            </div>
            <p className="font-semibold text-base">No projects found</p>
            <p className="text-muted-foreground text-sm">
              {projects.length === 0
                ? "Paste a docs URL on the home page to create your first MCP."
                : "Try a different search term or filter."}
            </p>
            <Button asChild className="mt-2" type="button" variant="outline">
              <Link href="/chat">Start a new conversion</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/40">
          <table className="w-full text-left text-sm">
            <thead className="border-border/40 border-b text-muted-foreground text-xs">
              <tr>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Status</th>
                <th className="hidden px-5 py-3 md:table-cell">Source</th>
                <th className="hidden px-5 py-3 lg:table-cell">Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((project) => {
                const status = STATUS_META[project.status];
                const StatusIcon = status.icon;
                return (
                  <tr className="hover:bg-muted/20" key={project.id}>
                    <td className="px-5 py-3">
                      <Link
                        className="block truncate font-medium hover:underline"
                        href={`/dashboard/projects/${project.id}`}
                      >
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        className={cn("gap-1", status.tone)}
                        variant="outline"
                      >
                        <StatusIcon className="size-3" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="hidden max-w-[280px] truncate px-5 py-3 font-mono text-muted-foreground text-xs md:table-cell">
                      {project.sourceUrl}
                    </td>
                    <td className="hidden px-5 py-3 text-muted-foreground text-xs lg:table-cell">
                      {new Date(project.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {project.status === "error" ? (
                          <RetryConversionButton
                            label="Retry"
                            projectId={project.id}
                            size="sm"
                            variant="outline"
                          />
                        ) : null}
                        <Button asChild size="sm" type="button" variant="ghost">
                          <Link href={`/dashboard/projects/${project.id}`}>
                            Open
                            <ExternalLink className="ml-1 size-3" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
