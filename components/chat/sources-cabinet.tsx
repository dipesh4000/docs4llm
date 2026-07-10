"use client";

import { Code2, Globe, ImageIcon, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type CabinetTab, useChatCabinets } from "./chat-cabinets-context";

const TABS: { id: CabinetTab; label: string; icon: typeof Globe }[] = [
  { id: "web", label: "Web", icon: Globe },
  { id: "code", label: "Code", icon: Code2 },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "memory", label: "Memory", icon: Sparkles },
];

export function SourcesCabinet({
  chatId,
  className,
}: {
  chatId: string;
  className?: string;
}) {
  const { open, tab, setTab, setOpen, webSources } = useChatCabinets();
  const [memory, setMemory] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`doc2mcp:memory:${chatId}`);
      setMemory(raw ?? "");
    } catch {
      setMemory("");
    }
  }, [chatId]);

  const saveMemory = (value: string) => {
    setMemory(value);
    try {
      localStorage.setItem(`doc2mcp:memory:${chatId}`, value);
    } catch {
      // ignore quota / private mode
    }
  };

  if (!open) {
    return null;
  }

  return (
    <aside
      className={cn(
        // Mobile: full-screen drawer over chat. Desktop: right rail.
        "fixed inset-0 z-40 flex min-h-0 w-full flex-col bg-card shadow-float",
        "md:static md:inset-auto md:z-auto md:h-full md:w-[34%] md:min-w-[280px] md:max-w-[420px] md:border-border/40 md:border-l md:bg-card/80 md:shadow-none md:backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 border-border/40 border-b px-4 py-3">
        <p className="font-medium text-sm tracking-wide">Sources</p>
        <Button
          aria-label="Close sources"
          onClick={() => setOpen(false)}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex gap-1 overflow-x-auto border-border/40 border-b px-2 py-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1 rounded-md px-2.5 py-1.5 font-medium text-xs transition-colors",
              tab === id
                ? "bg-primary/15 text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "web" ? (
          webSources.length === 0 ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Web search results appear here when the assistant uses search.
            </p>
          ) : (
            <ul className="space-y-3">
              {webSources.map((source) => (
                <li key={source.url}>
                  <a
                    className="block rounded-lg border border-border/40 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                    href={source.url}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <p className="font-medium text-sm">{source.title}</p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-primary">
                      {source.url}
                    </p>
                    {source.snippet ? (
                      <p className="mt-1 line-clamp-3 text-muted-foreground text-xs">
                        {source.snippet}
                      </p>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === "code" ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Generated code opens in the side artifact panel. Use the document
            preview when the assistant writes code.
          </p>
        ) : null}

        {tab === "images" ? (
          <p className="text-muted-foreground text-sm leading-relaxed">
            Image search results appear here when image tools return media.
          </p>
        ) : null}

        {tab === "memory" ? (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">
              Session notes for this chat (stored locally in your browser).
            </p>
            <textarea
              aria-label="Session memory"
              className="min-h-[200px] w-full resize-none rounded-lg border border-border/40 bg-muted/30 p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              onChange={(e) => saveMemory(e.target.value)}
              placeholder="Things to remember in this session…"
              value={memory}
            />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
