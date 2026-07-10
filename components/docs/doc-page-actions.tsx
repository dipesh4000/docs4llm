"use client";

import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DocNavItem } from "@/lib/docs/loader";
import { cn } from "@/lib/utils";

function pageUrl(): string {
  if (typeof window === "undefined") {
    return "https://doc2mcp.site/docs";
  }
  return window.location.href;
}

export function DocPageActions({
  markdown,
  title,
  prev,
  next,
}: {
  markdown: string;
  title: string;
  prev: DocNavItem | null;
  next: DocNavItem | null;
}) {
  const [copied, setCopied] = useState(false);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const viewAsMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const askPrompt = `Read ${pageUrl()} (doc2mcp docs: "${title}") and help me with questions about it.`;

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent/60 hover:text-foreground"
            type="button"
          >
            {copied ? (
              <Check className="size-3.5 text-primary" />
            ) : (
              <Copy className="size-3.5" />
            )}
            Copy page
            <ChevronDown className="size-3.5 opacity-70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem className="gap-3 py-2" onSelect={copyMarkdown}>
            <Copy className="size-4 shrink-0" />
            <span className="flex flex-col">
              <span className="font-medium text-sm">Copy page</span>
              <span className="text-muted-foreground text-xs">
                Copy page as Markdown for LLMs
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-3 py-2" onSelect={viewAsMarkdown}>
            <FileText className="size-4 shrink-0" />
            <span className="flex flex-col">
              <span className="flex items-center gap-1 font-medium text-sm">
                View as Markdown
                <ExternalLink className="size-3 opacity-60" />
              </span>
              <span className="text-muted-foreground text-xs">
                Open the raw .md source in a new tab
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="gap-3 py-2">
            <a
              href={`https://chatgpt.com/?q=${encodeURIComponent(askPrompt)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Sparkles className="size-4 shrink-0" />
              <span className="flex flex-col">
                <span className="flex items-center gap-1 font-medium text-sm">
                  Open in ChatGPT
                  <ExternalLink className="size-3 opacity-60" />
                </span>
                <span className="text-muted-foreground text-xs">
                  Ask questions about this page
                </span>
              </span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-3 py-2">
            <a
              href={`https://claude.ai/new?q=${encodeURIComponent(askPrompt)}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Bot className="size-4 shrink-0" />
              <span className="flex flex-col">
                <span className="flex items-center gap-1 font-medium text-sm">
                  Open in Claude
                  <ExternalLink className="size-3 opacity-60" />
                </span>
                <span className="text-muted-foreground text-xs">
                  Ask questions about this page
                </span>
              </span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="gap-3 py-2">
            <a
              href="https://doc2mcp.site/chat"
              rel="noopener noreferrer"
              target="_blank"
            >
              <MessageSquare className="size-4 shrink-0" />
              <span className="flex flex-col">
                <span className="flex items-center gap-1 font-medium text-sm">
                  Open in doc2mcp chat
                  <ExternalLink className="size-3 opacity-60" />
                </span>
                <span className="text-muted-foreground text-xs">
                  Ask the doc2mcp assistant about this page
                </span>
              </span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocArrow item={prev} label="Previous page">
        <ArrowLeft className="size-3.5" />
      </DocArrow>
      <DocArrow item={next} label="Next page">
        <ArrowRight className="size-3.5" />
      </DocArrow>
    </div>
  );
}

function DocArrow({
  item,
  label,
  children,
}: {
  item: DocNavItem | null;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex size-8 items-center justify-center rounded-md border border-border/60 transition-colors";

  if (!item) {
    return (
      <span
        aria-disabled="true"
        className={cn(base, "cursor-not-allowed text-muted-foreground/40")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      aria-label={`${label}: ${item.title}`}
      className={cn(
        base,
        "bg-background text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
      href={item.href}
    >
      {children}
    </Link>
  );
}
