"use client";

import { Loader2, Sparkles, X } from "lucide-react";

type UrlDetectBannerProps = {
  url: string;
  /** Whether the doc2mcp toggle is currently on. */
  modeEnabled: boolean;
  loading: boolean;
  onGenerate: () => void;
  onDismiss: () => void;
};

function prettyUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.host}${path}`.replace(/\/$/, "");
  } catch {
    return raw;
  }
}

/**
 * Shown automatically when a documentation URL is detected in the chat input.
 * Lets the user convert it into an MCP server in one click, and explains that
 * the MCP is only built when doc2mcp mode is on — otherwise the message is a
 * normal question about the page.
 */
export function UrlDetectBanner({
  url,
  modeEnabled,
  loading,
  onGenerate,
  onDismiss,
}: UrlDetectBannerProps) {
  return (
    <div className="mb-2 w-full overflow-hidden rounded-2xl border border-[#4285f4]/30 bg-[#4285f4]/[0.06] backdrop-blur-sm dark:border-[#8ab4f8]/30 dark:bg-[#8ab4f8]/[0.06]">
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#4285f4]/15 text-[#4285f4] dark:bg-[#8ab4f8]/15 dark:text-[#8ab4f8]">
          <Sparkles className="size-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-xs">
            Documentation detected
            <span className="ml-1.5 font-mono text-[#4285f4] text-[11px] dark:text-[#8ab4f8]">
              {prettyUrl(url)}
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            {modeEnabled
              ? "doc2mcp is on — generate a hosted MCP server from this page, or press Enter to ask about it."
              : "Turn on doc2mcp to convert this into an MCP server. Otherwise, press Enter to just ask about this page."}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-full bg-[#4285f4] px-3 py-1.5 font-medium text-[11px] text-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-[#8ab4f8] dark:text-[#131314]"
              disabled={loading}
              onClick={onGenerate}
              type="button"
            >
              {loading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Sparkles className="size-3" />
              )}
              {modeEnabled ? "Generate MCP" : "Convert to MCP"}
            </button>
            {modeEnabled ? null : (
              <span className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                enables doc2mcp
              </span>
            )}
          </div>
        </div>

        <button
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 text-muted-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
          onClick={onDismiss}
          type="button"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
