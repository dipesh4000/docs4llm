"use client";

import { Loader2, Play, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CompressedTool } from "@/types/platform";

type ToolDef = {
  key: string;
  label: string;
  description: string;
  defaultArgs: Record<string, unknown>;
};

const DEFAULT_DOCS_TOOLS: ToolDef[] = [
  {
    key: "list_documentation_pages",
    label: "list_documentation_pages",
    description: "Index of every page crawled.",
    defaultArgs: {},
  },
  {
    key: "search_documentation",
    label: "search_documentation",
    description: "Keyword search across all pages.",
    defaultArgs: { query: "authentication" },
  },
  {
    key: "get_documentation_page",
    label: "get_documentation_page",
    description: "Full text of one page by url or id.",
    defaultArgs: { url: "" },
  },
  {
    key: "get_documentation_overview",
    label: "get_documentation_overview",
    description: "Summary + llms.txt index for agents.",
    defaultArgs: {},
  },
  {
    key: "read_full_documentation",
    label: "read_full_documentation",
    description: "All pages combined as markdown.",
    defaultArgs: { maxPages: 5 },
  },
  {
    key: "ask_documentation",
    label: "ask_documentation",
    description: "Natural-language Q&A powered by doc2mcp AI.",
    defaultArgs: { question: "How do I authenticate?" },
  },
];

async function callMcp(
  projectId: string,
  tool: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const response = await fetch(`/api/projects/${projectId}/playground`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tool,
      arguments: args,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(json.error.message);
  }
  return json.result;
}

export type McpPlaygroundProps = {
  projectId: string;
  tools?: CompressedTool[];
};

export function McpPlayground({ projectId, tools }: McpPlaygroundProps) {
  const TOOLS = useMemo(() => {
    if (!tools || tools.length === 0) {
      return DEFAULT_DOCS_TOOLS;
    }
    return tools.map((t) => {
      const defaultArgs: Record<string, unknown> = {};
      const properties = (t.parameters as any)?.properties ?? {};
      for (const [k, v] of Object.entries(properties)) {
        const val = v as { type?: string; description?: string; default?: any };
        if (val.default !== undefined) {
          defaultArgs[k] = val.default;
        } else if (val.type === "string") {
          defaultArgs[k] = val.description ? `<${val.description}>` : "";
        } else if (val.type === "number" || val.type === "integer") {
          defaultArgs[k] = 1;
        } else if (val.type === "boolean") {
          defaultArgs[k] = false;
        } else if (val.type === "array") {
          defaultArgs[k] = [];
        } else {
          defaultArgs[k] = {};
        }
      }
      return {
        key: t.name,
        label: t.name,
        description: t.description ?? "",
        defaultArgs,
      };
    });
  }, [tools]);

  const [selected, setSelected] = useState<string>("");
  const [args, setArgs] = useState<string>("{}");
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (TOOLS.length > 0) {
      const first = TOOLS[0];
      setSelected(first.key);
      setArgs(JSON.stringify(first.defaultArgs, null, 2));
      setOutput(null);
    }
  }, [TOOLS]);

  const tool = useMemo(
    () =>
      TOOLS.find((t) => t.key === selected) ??
      TOOLS[0] ?? { key: "", label: "", description: "", defaultArgs: {} },
    [selected, TOOLS]
  );

  const setExample = (key: string) => {
    setSelected(key);
    const def = TOOLS.find((t) => t.key === key);
    setArgs(JSON.stringify(def?.defaultArgs ?? {}, null, 2));
    setOutput(null);
  };

  const runTool = async () => {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = args.trim() ? (JSON.parse(args) as Record<string, unknown>) : {};
    } catch {
      setOutput(JSON.stringify({ error: "Invalid JSON arguments" }, null, 2));
      return;
    }

    setIsRunning(true);
    setOutput(null);
    try {
      const data = await callMcp(projectId, selected, parsed);
      setOutput(JSON.stringify(data, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      setOutput(JSON.stringify({ error: message }, null, 2));
      toast.error("Tool call failed");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-xl border border-border/60 bg-white/90 p-4 backdrop-blur-sm lg:grid-cols-[240px_1fr] dark:bg-white/95">
      <div className="flex flex-col gap-1 max-h-[500px] overflow-y-auto pr-2 no-scrollbar border-r border-border/60">
        <p className="mb-2 font-mono text-muted-foreground text-xs uppercase tracking-wider">
          semantic tools
        </p>
        {TOOLS.map((t) => (
          <button
            className={`rounded-lg border px-3 py-2 text-left font-mono text-xs transition-all ${
              selected === t.key
                ? "border-violet-500/30 bg-violet-500/10 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                : "border-border/60 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            }`}
            key={t.key}
            onClick={() => setExample(t.key)}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <p className="font-semibold text-sm text-foreground font-mono">
            {tool.label}()
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {tool.description}
          </p>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-muted-foreground text-xs">
            arguments (json schema)
          </p>
          <Textarea
            className="min-h-[110px] border-border/60 bg-foreground/5 font-mono text-xs text-violet-700 focus-visible:ring-violet-500 dark:text-violet-200"
            onChange={(e) => setArgs(e.target.value)}
            value={args}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.25)] transition-all"
            disabled={isRunning || !selected}
            onClick={runTool}
            size="sm"
            type="button"
          >
            {isRunning ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Play className="mr-1.5 size-3.5 fill-current" />
            )}
            Run simulated sandbox call
          </Button>
          <Button
            className="border-border/60 hover:bg-foreground/5 text-muted-foreground text-xs"
            onClick={() => setExample(selected)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Wand2 className="mr-1.5 size-3.5" />
            Reset parameters
          </Button>
        </div>

        <div>
          <p className="mb-1.5 font-mono text-muted-foreground text-xs">
            live payload output
          </p>
          <pre className="min-h-[220px] max-h-[300px] overflow-auto rounded-xl border border-border/60 bg-muted/50 p-4 font-mono text-[11px] leading-relaxed text-cyan-700 dark:text-cyan-300">
            {output ??
              "// Pick a semantic tool and run sandbox to inspect JSON-RPC output."}
          </pre>
        </div>
      </div>
    </div>
  );
}
