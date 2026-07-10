"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Globe, Loader2, Terminal, X } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatDocPreview } from "./chat-doc-preview-context";

function parseUrl(raw: string) {
  try {
    const u = new URL(raw);
    return {
      host: u.host,
      path: u.pathname === "/" ? "" : u.pathname,
      protocol: u.protocol,
      favicon: `https://www.google.com/s2/favicons?domain=${u.host}&sz=32`,
    };
  } catch {
    return null;
  }
}

const CRAWL_STEPS = [
  "Resolving DNS…",
  "Fetching robots.txt…",
  "Crawling sitemap…",
  "Extracting API endpoints…",
  "Building semantic toolkit…",
];

export function DocPreviewPanel({ className }: { className?: string }) {
  const { url, doc2mcpMode, isLoading, dismiss } = useChatDocPreview();
  const parsed = useMemo(() => (url ? parseUrl(url) : null), [url]);

  if (!url || !parsed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.aside
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex min-h-0 flex-col border-border/40 border-l bg-card/30 backdrop-blur-xl",
          className
        )}
        exit={{ opacity: 0, x: 24 }}
        initial={{ opacity: 0, x: 24 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <header className="flex items-center justify-between gap-2 border-border/40 border-b px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="size-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Source preview
              </p>
              <p className="truncate font-medium text-foreground text-xs">
                {parsed.host}
                {parsed.path}
              </p>
            </div>
          </div>
          <Button
            aria-label="Close preview"
            className="size-7 shrink-0"
            onClick={dismiss}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-3.5" />
          </Button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden">
          <div className="relative min-h-[180px] flex-1 bg-muted/30 sm:min-h-[240px]">
            <iframe
              className="size-full border-0 bg-background"
              sandbox="allow-scripts allow-same-origin"
              src={url}
              title={`Preview of ${parsed.host}`}
            />
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="font-mono text-muted-foreground text-xs">
                    Starting doc2mcp pipeline…
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-border/40 border-t bg-background/60 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Terminal className="size-3.5 text-primary" />
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                {doc2mcpMode ? "doc2mcp pipeline" : "inspect mode"}
              </span>
            </div>
            <pre className="max-h-[140px] overflow-auto rounded-xl border border-border/50 bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground/90">
              {CRAWL_STEPS.map((step, i) => (
                <span className="block" key={step}>
                  <span className="text-muted-foreground/60">{">"}</span>{" "}
                  {isLoading && i === CRAWL_STEPS.length - 1 ? (
                    <>
                      {step}
                      <span className="ide-cursor ml-0.5 inline-block w-1.5 bg-primary">
                        {" "}
                      </span>
                    </>
                  ) : (
                    step
                  )}
                </span>
              ))}
            </pre>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
