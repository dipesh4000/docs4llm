/**
 * Automatic MCP Registry status.
 *
 * doc2mcp now publishes every ready project to the official MCP Registry
 * under the platform-owned `io.github.doc2mcp/*` namespace, so users no
 * longer need their own GitHub org or to run the publisher CLI by hand.
 * This card just reflects what the pipeline did.
 */

"use client";

import { BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectArtifacts } from "@/types/platform";

export function RegistryStatusCard({
  registry,
  className,
}: {
  registry: ProjectArtifacts["registry"];
  className?: string;
}) {
  if (registry?.status === "published") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/8 via-card/40 to-fuchsia-500/8 p-5 backdrop-blur-xl",
          className
        )}
      >
        <div className="pointer-events-none absolute top-0 right-0 size-40 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <BadgeCheck className="mt-0.5 size-5 text-violet-500 dark:text-violet-300" />
          <div className="min-w-0 space-y-1.5">
            <p className="font-medium text-sm">
              Live on the official MCP Registry
            </p>
            <p className="text-muted-foreground text-sm">
              Auto-published as{" "}
              <code className="font-mono text-foreground">{registry.name}</code>{" "}
              (v{registry.version}). Anyone on Cursor, Claude, or Windsurf can
              discover it — no setup on your side.
            </p>
            <a
              className="inline-flex items-center gap-1.5 font-mono text-violet-700 text-xs hover:underline dark:text-violet-300"
              href={registry.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              <ExternalLink className="size-3" />
              View registry listing
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Not configured / in progress — keep it quiet but informative.
  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/40 p-4 text-muted-foreground text-sm",
        className
      )}
    >
      <p className="flex items-center gap-2">
        <Loader2 className="size-3.5" />
        {registry?.status === "error"
          ? "Registry publish will retry on the next sync."
          : "This MCP will be auto-published to the official registry once registry publishing is configured."}
      </p>
    </div>
  );
}
