"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  FileText,
  Search,
  Sparkles,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SourceIcon } from "@/components/marketplace/source-icon";
import { Input } from "@/components/ui/input";
import {
  type MarketplaceMcp,
  SOURCE_TYPE_LABELS,
} from "@/lib/marketplace/types";
import { cn } from "@/lib/utils";
import type { SourceType } from "@/types/platform";

const FILTERS: Array<{ id: SourceType | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "url", label: "Docs sites" },
  { id: "gitbook", label: "GitBook" },
  { id: "github", label: "GitHub" },
  { id: "openapi", label: "OpenAPI" },
  { id: "markdown", label: "Markdown" },
  { id: "postman", label: "Postman" },
];

function hostOf(url: string | null): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) {
    return null;
  }
  const tone =
    score >= 80
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : score >= 60
        ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium text-[11px]",
        tone
      )}
    >
      <Sparkles className="size-3" />
      {score}
    </span>
  );
}

function McpCard({ mcp }: { mcp: MarketplaceMcp }) {
  const host = hostOf(mcp.sourceUrl);
  return (
    <Link
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:bg-card/70 hover:shadow-lg hover:shadow-violet-500/5"
      href={`/marketplace/${mcp.id}`}
    >
      <div
        aria-hidden="true"
        className="-translate-y-1/2 pointer-events-none absolute top-0 right-0 size-32 translate-x-1/2 rounded-full bg-violet-500/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <SourceIcon className="shadow-sm" host={host} size={44} />
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground text-sm">
              {mcp.name}
            </h3>
            {host ? (
              <p className="truncate text-[12px] text-muted-foreground">
                {host}
              </p>
            ) : null}
          </div>
        </div>
        <ScorePill score={mcp.mcpScore} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-muted/40 px-2 py-0.5">
          {SOURCE_TYPE_LABELS[mcp.sourceType]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Wrench className="size-3" />
          {mcp.toolCount} tool{mcp.toolCount === 1 ? "" : "s"}
        </span>
        {mcp.pageCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <FileText className="size-3" />
            {mcp.pageCount} page{mcp.pageCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {mcp.registryUrl ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-violet-700 dark:text-violet-300">
            <BadgeCheck className="size-3" />
            Registry
          </span>
        ) : null}
      </div>

      <div className="mt-auto flex items-center justify-between border-border/40 border-t pt-3">
        <span className="truncate text-[12px] text-muted-foreground">
          by {mcp.ownerName}
        </span>
        <span className="inline-flex items-center gap-1 font-medium text-[12px] text-foreground">
          View
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function MarketplaceExplorer({ mcps }: { mcps: MarketplaceMcp[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SourceType | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mcps.filter((mcp) => {
      if (filter !== "all" && mcp.sourceType !== filter) {
        return false;
      }
      if (!q) {
        return true;
      }
      return (
        mcp.name.toLowerCase().includes(q) ||
        (mcp.sourceUrl ?? "").toLowerCase().includes(q) ||
        mcp.ownerName.toLowerCase().includes(q)
      );
    });
  }, [mcps, query, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            className="h-10 rounded-full border-border/50 bg-muted/40 pl-9 text-sm"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search MCP servers, docs, authors..."
            type="search"
            value={query}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((item) => (
            <button
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px] transition-colors",
                filter === item.id
                  ? "border-foreground/20 bg-foreground text-background"
                  : "border-border/50 bg-muted/30 text-muted-foreground hover:text-foreground"
              )}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((mcp) => (
            <McpCard key={mcp.id} mcp={mcp} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/50 border-dashed bg-card/30 py-20 text-center">
          <Boxes className="size-8 text-muted-foreground/50" />
          <p className="font-medium text-foreground text-sm">
            No MCP servers match your search
          </p>
          <p className="text-muted-foreground text-sm">
            Try a different keyword or filter.
          </p>
        </div>
      )}
    </div>
  );
}
