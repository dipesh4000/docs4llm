"use client";

import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Cpu,
  FileCode2,
  type LucideIcon,
  Network,
  ScrollText,
  Terminal,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Stage = {
  id: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
};

const STAGES: Stage[] = [
  {
    id: "stripe",
    title: "Stripe Documentation",
    detail: "docs.stripe.com · 1,284 pages",
    icon: ScrollText,
    accent: "border-sky-500/40 bg-sky-500/10",
  },
  {
    id: "crawl",
    title: "Doc2MCP crawls content",
    detail: "Auto-discovers APIs, guides, SDKs",
    icon: Network,
    accent: "border-violet-500/40 bg-violet-500/10",
  },
  {
    id: "process",
    title: "Processes APIs + guides",
    detail: "Structured chunks, schemas, examples",
    icon: Cpu,
    accent: "border-fuchsia-500/40 bg-fuchsia-500/10",
  },
  {
    id: "mcp",
    title: "Generates MCP server",
    detail: "23 tools · 6 workflows · 1 endpoint",
    icon: FileCode2,
    accent: "border-amber-500/40 bg-amber-500/10",
  },
  {
    id: "cursor",
    title: "Connects to Cursor",
    detail: "One-click config · remote MCP",
    icon: Terminal,
    accent: "border-orange-500/40 bg-orange-500/10",
  },
  {
    id: "agent",
    title: "AI understands Stripe instantly",
    detail: "No hallucinations · current APIs",
    icon: Bot,
    accent: "border-emerald-500/40 bg-emerald-500/10",
  },
];

const PROMISES = [
  "No prompt stuffing.",
  "No manual tool creation.",
  "No hallucinated integrations.",
];

export function RealExampleSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 lg:py-36"
      id="real-example"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklab, currentColor 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <div className="-translate-x-1/2 absolute top-1/3 left-1/2 size-[520px] rounded-full bg-violet-500/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1080px] px-4 sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            <span className="h-px w-8 bg-foreground/30" />
            Real example
            <span className="h-px w-8 bg-foreground/30" />
          </span>
          <h2 className="mt-6 font-display text-3xl tracking-tight sm:text-5xl lg:text-6xl">
            See it{" "}
            <span className="text-[#4285f4] dark:text-[#8ab4f8] font-semibold">
              in action
            </span>
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed sm:text-lg">
            Watch how doc2mcp turns the entire Stripe documentation into an
            AI-ready MCP server — without writing a line of integration code.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-[760px]">
          {/* Vertical connector with glowing pulse */}
          <div
            aria-hidden="true"
            className="-translate-x-1/2 absolute top-0 bottom-0 left-1/2 hidden w-px overflow-hidden bg-gradient-to-b from-transparent via-foreground/15 to-transparent sm:block"
          >
            <span className="real-example-pulse absolute left-0 h-16 w-px bg-gradient-to-b from-transparent via-violet-400 to-transparent" />
          </div>

          <ul className="relative space-y-3 sm:space-y-4">
            {STAGES.map((stage, i) => (
              <StageRow
                align={i % 2 === 0 ? "left" : "right"}
                key={stage.id}
                stage={stage}
              />
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {PROMISES.map((p) => (
            <div
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-center backdrop-blur-xl"
              key={p}
            >
              <CheckCircle2
                aria-hidden="true"
                className="size-4 shrink-0 text-emerald-500"
              />
              <p className="font-display font-medium text-emerald-700 text-sm dark:text-emerald-300">
                {p}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .real-example-pulse {
          animation: real-example-pulse-travel 3.4s linear infinite;
        }
        @keyframes real-example-pulse-travel {
          0%   { top: -10%; opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .real-example-pulse { animation: none; }
        }
      `}</style>
    </section>
  );
}

function StageRow({ stage, align }: { stage: Stage; align: "left" | "right" }) {
  const isLeft = align === "left";
  return (
    <li className="relative">
      {/* Mobile — single full-width card with arrow below */}
      <div className="sm:hidden">
        <StageCard align="left" stage={stage} />
        <div className="-mt-1 -mb-1 mt-3 flex justify-center">
          <ArrowRight
            aria-hidden="true"
            className="size-4 rotate-90 text-muted-foreground/50"
          />
        </div>
      </div>

      {/* Desktop — 3-column grid: left card slot, centerline dot, right card slot */}
      <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-5 sm:grid">
        <div className="justify-self-end">
          {isLeft ? <StageCard align="left" stage={stage} /> : null}
        </div>
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rounded-full border border-violet-500/40 bg-background ring-4 ring-violet-500/10"
        />
        <div className="justify-self-start">
          {isLeft ? null : <StageCard align="right" stage={stage} />}
        </div>
      </div>
    </li>
  );
}

function StageCard({
  stage,
  align,
}: {
  stage: Stage;
  align: "left" | "right";
}) {
  const Icon = stage.icon;
  const isLeft = align === "left";
  return (
    <div
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-xl transition-all hover:scale-[1.01] hover:border-border sm:w-[320px] sm:p-5"
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 opacity-30 blur-2xl",
          stage.accent
        )}
      />
      <div
        className={cn(
          "flex items-start gap-3",
          isLeft && "sm:flex-row-reverse sm:text-right"
        )}
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            stage.accent
          )}
        >
          <Icon className="size-4 text-foreground/85" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground text-sm sm:text-base">
            {stage.title}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground sm:text-xs">
            {stage.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
