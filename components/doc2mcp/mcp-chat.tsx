"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUp,
  Check,
  ChevronRight,
  ExternalLink,
  FileSearch,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { MessageResponse } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Source = { title: string; url: string };

const SUGGESTIONS = [
  "Summarize what this documentation covers",
  "How do I authenticate?",
  "Show me a quick start example",
  "What endpoints are available?",
];

type AnyPart = {
  type: string;
  text?: string;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  errorText?: string;
};

function toolStatus(state: string | undefined): "running" | "done" | "error" {
  if (state === "output-available") {
    return "done";
  }
  if (state === "output-error") {
    return "error";
  }
  return "running";
}

function parseOutput(output: unknown): Record<string, unknown> | null {
  if (output && typeof output === "object") {
    return output as Record<string, unknown>;
  }
  if (typeof output === "string") {
    try {
      return JSON.parse(output) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

function toolSummary(name: string, output: unknown): string | undefined {
  const parsed = parseOutput(output);
  if (!parsed) {
    return output ? "done" : undefined;
  }
  if (name === "list_documentation_pages" && typeof parsed.total === "number") {
    return `${parsed.total} pages indexed`;
  }
  if (name === "search_documentation" && Array.isArray(parsed.results)) {
    return `${parsed.results.length} sections matched`;
  }
  if (name === "get_documentation_page" && typeof parsed.title === "string") {
    return `read: ${parsed.title}`;
  }
  if (name === "read_full_documentation") {
    return "full docs read";
  }
  return "done";
}

function rawOutput(output: unknown): string {
  const text =
    typeof output === "string" ? output : JSON.stringify(output, null, 2);
  return text.slice(0, 4000);
}

function collectSources(parts: AnyPart[]): Source[] {
  const seen = new Set<string>();
  const sources: Source[] = [];
  const add = (title: unknown, url: unknown) => {
    if (typeof url !== "string" || !url || seen.has(url)) {
      return;
    }
    seen.add(url);
    sources.push({ title: typeof title === "string" ? title : url, url });
  };
  for (const part of parts) {
    if (!part.type.startsWith("tool-")) {
      continue;
    }
    const parsed = parseOutput(part.output);
    if (!parsed) {
      continue;
    }
    if (Array.isArray(parsed.results)) {
      for (const row of parsed.results as Record<string, unknown>[]) {
        add(row.title, row.url);
      }
    }
    add(parsed.title, parsed.url);
  }
  return sources;
}

export function McpChat({
  projectId,
  pageCount,
  onClose,
  className,
}: {
  projectId: string;
  pageCount?: number;
  onClose?: () => void;
  className?: string;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/mcp/${projectId}/agent`,
      }),
    [projectId]
  );

  const { messages, sendMessage, status, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) {
      return;
    }
    sendMessage({ text: trimmed });
    setInput("");
    scrollToBottom();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-none border-0 bg-card md:rounded-2xl md:border md:border-border md:bg-card/60 md:shadow-sm md:backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 border-border/70 border-b bg-background/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
            <Sparkles className="size-3.5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="font-medium text-sm">MCP assistant</p>
            <p className="truncate font-mono text-[10px] text-muted-foreground">
              agentic · calls your MCP tools
              {typeof pageCount === "number" ? ` · ${pageCount} pages` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 uppercase tracking-wider dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            connected
          </span>
          {onClose ? (
            <Button
              aria-label="Close MCP assistant"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className="flex-1 space-y-5 overflow-y-auto px-4 py-5"
        ref={scrollRef}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 text-violet-500 ring-1 ring-violet-500/20 dark:text-violet-300">
              <Sparkles className="size-6" />
            </span>
            <div className="max-w-sm">
              <p className="font-medium">Chat with your documentation</p>
              <p className="mt-1 text-muted-foreground text-sm">
                The assistant calls your MCP tools in a loop — searching, then
                opening the exact page it needs — and streams a cited answer,
                just like Cursor.
              </p>
            </div>
            <div className="flex w-full max-w-md flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  className="flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left text-sm transition-colors hover:border-violet-500/40 hover:bg-accent"
                  key={s}
                  onClick={() => send(s)}
                  type="button"
                >
                  <FileSearch className="size-4 shrink-0 text-muted-foreground" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatBubble
              key={message.id}
              parts={message.parts as AnyPart[]}
              role={message.role}
            />
          ))
        )}

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-red-600 text-sm dark:text-red-300">
            Something went wrong talking to the MCP. Please try again.
          </div>
        ) : null}
      </div>

      <div className="border-border/70 border-t bg-background/40 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/15">
          <textarea
            aria-label="Ask your documentation"
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask your documentation anything…"
            rows={1}
            value={input}
          />
          <Button
            className="size-8 shrink-0 rounded-lg p-0"
            disabled={busy || !input.trim()}
            onClick={() => send(input)}
            size="sm"
            type="button"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-muted-foreground">
          Enter to send · Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
}

function ToolStepRow({ part }: { part: AnyPart }) {
  const name = part.type.slice(5);
  const status = toolStatus(part.state);
  const argSummary = Object.entries(part.input ?? {})
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(", ");
  const summary =
    status === "error"
      ? (part.errorText ?? "error")
      : toolSummary(name, part.output);

  return (
    <details className="group rounded-lg border border-border bg-background/70">
      <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs">
        <span className="shrink-0">
          {status === "running" ? (
            <Loader2 className="size-3.5 animate-spin text-violet-500" />
          ) : status === "error" ? (
            <X className="size-3.5 text-red-500" />
          ) : (
            <Check className="size-3.5 text-emerald-500" />
          )}
        </span>
        <span className="font-mono text-foreground">{name}</span>
        {argSummary ? (
          <span className="truncate font-mono text-muted-foreground">
            ({argSummary})
          </span>
        ) : null}
        {summary ? (
          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
            {summary}
          </span>
        ) : null}
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
      </summary>
      {part.output ? (
        <pre className="max-h-44 overflow-auto border-border/60 border-t p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
          {rawOutput(part.output)}
        </pre>
      ) : null}
    </details>
  );
}

function ChatBubble({ role, parts }: { role: string; parts: AnyPart[] }) {
  const text = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[82%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground text-sm">
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    );
  }

  const toolParts = parts.filter((p) => p.type.startsWith("tool-"));
  const sources = collectSources(toolParts);

  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        {toolParts.length > 0 ? (
          <div className="space-y-1.5">
            {toolParts.map((part) => (
              <ToolStepRow
                key={part.toolCallId ?? `${part.type}-${part.state}`}
                part={part}
              />
            ))}
          </div>
        ) : null}

        {text ? (
          <div className="rounded-2xl rounded-tl-md border border-border bg-muted/40 px-4 py-3">
            <div className="prose-sm max-w-none text-sm leading-relaxed">
              <MessageResponse>{text}</MessageResponse>
            </div>
            {sources.length > 0 ? (
              <div className="mt-3 border-border/60 border-t pt-2.5">
                <p className="mb-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                  Sources
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((source) => (
                    <a
                      className="inline-flex max-w-[220px] items-center gap-1 truncate rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                      href={source.url}
                      key={source.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span className="truncate">{source.title}</span>
                      <ExternalLink className="size-2.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
