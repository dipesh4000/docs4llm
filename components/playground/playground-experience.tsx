"use client";

import { MessageSquare, Play } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { McpChat } from "@/components/docs4llm/mcp-chat";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PlaygroundProject = {
  id: string;
  name: string;
  sourceUrl: string | null;
  status: string;
  hasToken: boolean;
  pageCount?: number;
};

function PlaygroundChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-float)]">
      <div className="flex items-center justify-between border-border border-b bg-[#1a1a1a] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-2 font-mono text-[11px] text-white/50">
            docs4llm · mcp chat
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-white/40 uppercase tracking-wider">
          <MessageSquare className="size-3" />
          Agent
        </span>
      </div>
      {children}
    </div>
  );
}

export function PlaygroundExperience({
  projects,
  initialProjectId,
}: {
  projects: PlaygroundProject[];
  initialProjectId?: string;
}) {
  const readyProjects = useMemo(
    () => projects.filter((p) => p.status === "ready" && p.hasToken),
    [projects]
  );

  const [selectedId, setSelectedId] = useState(
    initialProjectId ?? readyProjects[0]?.id ?? ""
  );

  const selected = readyProjects.find((p) => p.id === selectedId);

  if (readyProjects.length === 0) {
    return (
      <PlaygroundChrome>
        <div className="grid min-h-[480px] lg:grid-cols-[320px_1fr]">
          <aside className="border-border/40 border-b bg-[#111111] p-6 lg:border-r lg:border-b-0">
            <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
              Your MCPs
            </p>
            <p className="mt-4 text-sm text-white/70">
              No ready MCPs yet. Convert a docs URL in chat first.
            </p>
          </aside>
          <div className="grid-dots-bg flex flex-col items-center justify-center bg-[#f4f4f2] p-10 text-center dark:bg-[#e8e8e6]">
            <MessageSquare className="mb-4 size-8 text-foreground/40" />
            <h2 className="font-display font-thin text-2xl tracking-tight text-foreground">
              Add an MCP to start chatting
            </h2>
            <p className="mt-2 max-w-sm text-muted-foreground text-sm">
              Once your documentation MCP is ready, pick it here and talk to it
              like you would in Cursor or Claude.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild type="button">
                <Link href="/chat">
                  <Play className="mr-1.5 size-4" />
                  New conversion
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PlaygroundChrome>
    );
  }

  return (
    <PlaygroundChrome>
      <div className="grid min-h-[620px] lg:grid-cols-[300px_1fr]">
        <aside className="flex flex-col gap-4 border-border/40 border-b bg-[#111111] p-5 lg:border-r lg:border-b-0">
          <div>
            <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest">
              Connected MCP
            </p>
            <Select onValueChange={setSelectedId} value={selectedId}>
              <SelectTrigger className="mt-2 border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Pick an MCP" />
              </SelectTrigger>
              <SelectContent>
                {readyProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name || p.sourceUrl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected?.sourceUrl ? (
            <p className="truncate font-mono text-[10px] text-white/45">
              {selected.sourceUrl}
            </p>
          ) : null}
          <div className="mt-auto space-y-2 font-mono text-[10px] text-white/40">
            <p>✓ MCP connected</p>
            {typeof selected?.pageCount === "number" ? (
              <p>✓ {selected.pageCount} docs pages indexed</p>
            ) : null}
          </div>
        </aside>

        <div className="grid-dots-bg min-h-[500px] bg-[#f4f4f2] p-4 dark:bg-[#e8e8e6] lg:p-5">
          {selected ? (
            <McpChat
              key={selected.id}
              pageCount={selected.pageCount}
              projectId={selected.id}
            />
          ) : null}
        </div>
      </div>
    </PlaygroundChrome>
  );
}
