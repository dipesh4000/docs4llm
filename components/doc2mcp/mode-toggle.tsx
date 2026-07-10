"use client";

import { Blocks } from "lucide-react";
import { cn } from "@/lib/utils";

export function Doc2McpModeToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <button
      aria-label={enabled ? "doc2mcp mode on" : "doc2mcp mode off"}
      aria-pressed={enabled}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-all",
        enabled
          ? "border-violet-500/50 bg-violet-500/15 text-violet-300 shadow-[0_0_16px_oklch(0.55_0.2_280/25%)]"
          : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
      )}
      onClick={() => onChange(!enabled)}
      type="button"
    >
      <Blocks className="size-3.5" />
      <span>doc2mcp</span>
    </button>
  );
}
