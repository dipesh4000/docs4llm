"use client";

import { ArrowUpRight, Check, Copy, Package, Terminal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const NPM_PACKAGE_URL = "https://www.npmjs.com/package/doc2mcp";
const INSTALL_COMMAND = "npm i -g doc2mcp";

function NpmInstallCard() {
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(() => {
    navigator.clipboard
      .writeText(INSTALL_COMMAND)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      })
      .catch(() => {
        // clipboard unavailable — no-op
      });
  }, []);

  return (
    <div className="mt-7 flex flex-col gap-3">
      <a
        className="group inline-flex w-fit items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 font-mono text-[10px] text-rose-600 uppercase tracking-[0.16em] transition-colors hover:bg-rose-500/15 dark:text-rose-300"
        href={NPM_PACKAGE_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <Package className="size-3" />
        Available on npm
        <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </a>

      <button
        aria-label="Copy install command"
        className="group flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-border/60 bg-zinc-950/90 px-4 py-3 text-left transition-colors hover:border-violet-500/40"
        onClick={onCopy}
        type="button"
      >
        <span className="flex items-center gap-2.5 font-mono text-sm text-zinc-100">
          <span className="text-violet-400">$</span>
          {INSTALL_COMMAND}
        </span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/5 text-zinc-400 transition-colors group-hover:text-zinc-100">
          {copied ? (
            <Check className="size-3.5 text-emerald-400" strokeWidth={3} />
          ) : (
            <Copy className="size-3.5" />
          )}
        </span>
      </button>

      <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
        doc2mcp login · doc2mcp &lt;docs-url&gt;
      </p>
    </div>
  );
}

type Line = {
  text: string;
  /** "input" lines are typed out char-by-char with a `$` prompt. */
  kind: "input" | "output" | "success";
};

type Frame = {
  lines: string[];
  typing: string;
  done: boolean;
  delay: number;
};

const SCRIPT: Line[] = [
  { text: "npm install -g doc2mcp", kind: "input" },
  { text: "doc2mcp login", kind: "input" },
  { text: "✓ Authenticated as you@dev", kind: "success" },
  { text: "doc2mcp https://stripe.com/docs", kind: "input" },
  { text: "→ crawling 142 pages", kind: "output" },
  { text: "→ generating MCP · 11 tools", kind: "output" },
  { text: "✓ MCP ready in 47s", kind: "success" },
  { text: "→ Install into Cursor? Yes", kind: "output" },
  { text: "✓ Added to ~/.cursor/mcp.json", kind: "success" },
];

const TYPE_MS = 38;
const LINE_PAUSE_MS = 420;
const LOOP_PAUSE_MS = 2600;

/** Pre-compute every render frame so playback is a simple timed cursor. */
function buildFrames(): Frame[] {
  const frames: Frame[] = [];
  const committed: string[] = [];

  for (const line of SCRIPT) {
    if (line.kind === "input") {
      for (let i = 1; i <= line.text.length; i++) {
        frames.push({
          lines: [...committed],
          typing: line.text.slice(0, i),
          done: false,
          delay: TYPE_MS,
        });
      }
      committed.push(`$ ${line.text}`);
    } else {
      committed.push(line.text);
    }
    frames.push({
      lines: [...committed],
      typing: "",
      done: false,
      delay: LINE_PAUSE_MS,
    });
  }

  frames.push({
    lines: [...committed],
    typing: "",
    done: true,
    delay: LOOP_PAUSE_MS,
  });

  return frames;
}

export function CliSection() {
  const frames = useMemo(buildFrames, []);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const current = frames[frameIndex] ?? frames[0];
    const timer = setTimeout(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, current.delay);
    return () => clearTimeout(timer);
  }, [frameIndex, frames]);

  const frame = frames[frameIndex] ?? frames[0];
  const visibleLines = frame.lines;
  const typing = frame.typing;
  const done = frame.done;

  return (
    <section className="relative overflow-hidden border-border/40 border-y bg-gradient-to-b from-background via-background to-muted/20 py-24 sm:py-32">
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 sm:gap-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 font-mono text-[10px] text-violet-700 uppercase tracking-[0.16em] dark:text-violet-300">
              <span className="size-1.5 animate-pulse rounded-full bg-violet-500" />
              CLI · available now
            </span>
            <h2 className="mt-5 font-display font-semibold text-3xl text-foreground tracking-tight sm:text-5xl">
              The whole pipeline,
              <br />
              <span className="text-muted-foreground">from your terminal.</span>
            </h2>
            <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed">
              Install the doc2mcp CLI to convert docs, generate MCPs, and wire
              them into Cursor, VS Code, Claude, and Windsurf — all from your
              terminal with the same limits as the web app.
            </p>
            <ul className="mt-7 space-y-3 text-sm">
              {[
                "One command from docs URL to live MCP",
                "Connect editors without leaving the terminal",
                "Run conversions and syncs straight from CI",
              ].map((item) => (
                <li className="flex items-start gap-2.5" key={item}>
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  <span className="text-foreground/85">{item}</span>
                </li>
              ))}
            </ul>
            <NpmInstallCard />
          </div>

          <div className="relative">
            <div className="-inset-6 pointer-events-none absolute -z-10 rounded-3xl bg-gradient-to-br from-violet-500/8 via-transparent to-sky-500/8 blur-3xl" />
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-zinc-950/90 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between border-white/10 border-b px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-rose-400/80" />
                  <span className="size-2.5 rounded-full bg-amber-400/80" />
                  <span className="size-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <p className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 uppercase tracking-[0.18em]">
                  <Terminal className="size-3" />
                  doc2mcp — zsh
                </p>
              </div>
              <div className="flex h-72 flex-col justify-end space-y-1 overflow-hidden p-4 font-mono text-[12.5px] leading-relaxed sm:h-80">
                {visibleLines.map((line, i) => {
                  const isPrompt = line.startsWith("$ ");
                  const isSuccess = line.startsWith("✓");
                  return (
                    <div
                      className={
                        isSuccess
                          ? "text-emerald-400"
                          : isPrompt
                            ? "text-zinc-100"
                            : "text-sky-300/90"
                      }
                      key={`${line}-${String(i)}`}
                    >
                      {isPrompt ? (
                        <>
                          <span className="text-violet-400">$</span>{" "}
                          {line.slice(2)}
                        </>
                      ) : (
                        line
                      )}
                    </div>
                  );
                })}
                {typing ? (
                  <div className="text-zinc-100">
                    <span className="text-violet-400">$</span> {typing}
                    <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-zinc-100 align-middle" />
                  </div>
                ) : null}
                {done ? (
                  <div className="text-zinc-100">
                    <span className="text-violet-400">$</span>
                    <span className="ml-1.5 inline-block h-3.5 w-1.5 animate-pulse bg-zinc-100 align-middle" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
