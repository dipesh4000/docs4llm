"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const DEMO_URLS = [
  "https://docs.stripe.com",
  "https://docs.langchain.com",
  "https://docs.anthropic.com",
  "https://platform.openai.com/docs",
  "https://github.com/fetchai/uAgents",
];

type Phase =
  | "typing"
  | "submitting"
  | "crawling"
  | "analyzing"
  | "building"
  | "ready";

const PHASE_LABEL: Record<Phase, string> = {
  typing: "Paste docs URL",
  submitting: "Sending to doc2mcp",
  crawling: "Crawling pages",
  analyzing: "Indexing chunks with AI",
  building: "Building MCP endpoint",
  ready: "MCP ready — paste into Cursor",
};

const STEP_ORDER: Phase[] = [
  "typing",
  "submitting",
  "crawling",
  "analyzing",
  "building",
  "ready",
];

const TYPING_INTERVAL = 60;
const PHASE_DURATIONS: Record<Phase, number> = {
  typing: 0, // dynamic
  submitting: 600,
  crawling: 1400,
  analyzing: 1300,
  building: 1100,
  ready: 1800,
};

export function ConversionDemo() {
  const [urlIndex, setUrlIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const target = DEMO_URLS[urlIndex] ?? DEMO_URLS[0];

    if (phase === "typing") {
      if (typed.length < target.length) {
        const t = setTimeout(
          () => setTyped(target.slice(0, typed.length + 1)),
          TYPING_INTERVAL
        );
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("submitting"), 700);
      return () => clearTimeout(t);
    }

    if (phase === "ready") {
      const t = setTimeout(() => {
        setUrlIndex((i) => (i + 1) % DEMO_URLS.length);
        setTyped("");
        setPhase("typing");
      }, PHASE_DURATIONS.ready);
      return () => clearTimeout(t);
    }

    const nextIdx = STEP_ORDER.indexOf(phase) + 1;
    const next = STEP_ORDER[nextIdx];
    if (!next) {
      return;
    }
    const t = setTimeout(() => setPhase(next), PHASE_DURATIONS[phase]);
    return () => clearTimeout(t);
  }, [phase, typed, urlIndex, isVisible]);

  const slug =
    (() => {
      try {
        const host = new URL(typed).hostname.replace(/^www\./, "");
        return host.split(".")[0] ?? "docs";
      } catch {
        return "docs";
      }
    })() || "docs";

  const progress = (STEP_ORDER.indexOf(phase) / (STEP_ORDER.length - 1)) * 100;

  return (
    <div
      className={`relative transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      ref={ref}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 mx-auto max-w-[1100px]">
        <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl sm:p-6 lg:grid-cols-2 lg:gap-8 lg:p-8">
        {/* Browser-style URL input */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border/50 bg-background/80 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-1.5 border-border/40 border-b px-3 py-2">
              <span className="size-2.5 rounded-full bg-rose-400/70" />
              <span className="size-2.5 rounded-full bg-amber-400/70" />
              <span className="size-2.5 rounded-full bg-emerald-400/70" />
              <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">
                doc2mcp.dev/chat
              </span>
            </div>
            <div className="px-4 py-6">
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                doc2mcp toggle: ON
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/5 px-3 py-2">
                <span className="font-mono text-violet-700 text-xs dark:text-violet-300">
                  →
                </span>
                <span className="font-mono text-foreground text-xs sm:text-sm">
                  {typed}
                  <span className="ml-px inline-block h-3 w-px animate-pulse bg-foreground/80 align-middle" />
                </span>
              </div>
              <p className="mt-3 font-mono text-[10px] text-muted-foreground">
                Press <kbd className="rounded bg-muted px-1 py-0.5">↵</kbd> to
                build an MCP from these docs
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background/80 p-4">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              pipeline
            </p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2 font-mono text-[11px]">
              {STEP_ORDER.slice(1).map((step) => {
                const stepIdx = STEP_ORDER.indexOf(step);
                const currentIdx = STEP_ORDER.indexOf(phase);
                const status =
                  stepIdx < currentIdx
                    ? "done"
                    : stepIdx === currentIdx
                      ? "active"
                      : "pending";
                return (
                  <li
                    className={`flex items-center gap-2 ${
                      status === "done"
                        ? "text-foreground"
                        : status === "active"
                          ? "text-violet-700 dark:text-violet-300"
                          : "text-muted-foreground/60"
                    }`}
                    key={step}
                  >
                    <span
                      className={`flex size-4 items-center justify-center rounded-full border ${
                        status === "done"
                          ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-700 dark:text-emerald-300"
                          : status === "active"
                            ? "border-violet-400/60 bg-violet-500/20 text-violet-700 dark:text-violet-300"
                            : "border-border/40 text-muted-foreground"
                      }`}
                    >
                      {status === "done" ? "✓" : status === "active" ? "•" : ""}
                    </span>
                    <span>{PHASE_LABEL[step]}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Cursor mcp.json terminal */}
        <div className="rounded-xl border border-border/50 bg-background/95 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-border/40 border-b px-4 py-2">
            <span className="font-mono text-[11px] text-muted-foreground">
              ~/.cursor/mcp.json
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[10px] transition-colors ${
                phase === "ready"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {phase === "ready" ? "ready" : "building"}
            </span>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/90 sm:text-xs">
            <code>{renderConfig(slug, phase)}</code>
          </pre>
          <div className="border-border/40 border-t px-4 py-3">
            <p className="font-mono text-[10px] text-muted-foreground">
              {phase === "ready" ? (
                <>
                  <span className="text-emerald-700 dark:text-emerald-300">
                    ●
                  </span>{" "}
                  Paste into Cursor → Settings → MCP and reload.
                </>
              ) : (
                <>Generating remote endpoint + Bearer token…</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderConfig(slug: string, phase: Phase): string {
  if (phase === "typing" || phase === "submitting" || phase === "crawling") {
    return `{
  "mcpServers": {
    "${slug}": {
      // crawling docs…
    }
  }
}`;
  }
  if (phase === "analyzing") {
    return `{
  "mcpServers": {
    "${slug}": {
      "url": "https://doc2mcp.site/api/mcp/…/mcp",
      "headers": {
        "Authorization": "Bearer …"
      }
    }
  }
}`;
  }
  return `{
  "mcpServers": {
    "${slug}": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": {
        "Authorization": "Bearer d2mcp_…"
      }
    }
  }
}`;
}

export function HeroVisual() {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-10 mx-auto h-[400px] max-w-[1200px] rounded-[60px] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/10 to-cyan-500/20 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-2xl border border-border/60 bg-card/30 shadow-[0_30px_120px_-30px_oklch(0.55_0.2_280/40%)]">
        <Image
          alt="doc2mcp: paste a docs URL, get a Cursor-ready MCP server"
          className="w-full h-auto"
          height={1024}
          priority
          src="/hero-flow-v2.png"
          unoptimized
          width={1536}
        />
      </div>
    </div>
  );
}

export function FlowShowcase() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-32" id="flow">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="mb-12 max-w-2xl sm:mb-16">
          <span className="inline-flex items-center gap-3 font-mono text-muted-foreground text-sm">
            <span className="h-px w-8 bg-foreground/30" />
            Flow
          </span>
          <h2 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl">
            From URL to MCP, in three frames.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Paste any docs URL. doc2mcp crawls, indexes, and hands you a
            Cursor-ready MCP config in seconds — no clone, no API keys.
          </p>
        </div>

        <HeroVisual />

        <div className="mt-20 sm:mt-24">
          <div className="mb-10 max-w-2xl">
            <span className="inline-flex items-center gap-3 font-mono text-muted-foreground text-sm">
              <span className="h-px w-8 bg-foreground/30" />
              Live preview
            </span>
            <h3 className="mt-4 font-display text-2xl tracking-tight sm:text-3xl">
              Watch it build itself.
            </h3>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Real UI — no video — looping with example docs every few seconds.
            </p>
          </div>
          <ConversionDemo />
        </div>
      </div>
    </section>
  );
}
