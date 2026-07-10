"use client";

import {
  Bot,
  Cpu,
  FileCode2,
  type LucideIcon,
  Network,
  ScrollText,
  Sparkles,
} from "lucide-react";

type Stage = {
  id: string;
  label: string;
  body: string;
  icon: LucideIcon;
};

const STAGES: Stage[] = [
  {
    id: "docs",
    label: "Documentation",
    body: "docs.stripe.com",
    icon: ScrollText,
  },
  {
    id: "crawler",
    label: "Smart Crawling",
    body: "1,284 pages indexed",
    icon: Network,
  },
  {
    id: "processing",
    label: "Knowledge Processing",
    body: "AI \u00b7 semantic chunks",
    icon: Cpu,
  },
  {
    id: "mcp",
    label: "MCP Generation",
    body: "23 tools \u00b7 6 workflows",
    icon: FileCode2,
  },
  {
    id: "agent",
    label: "AI Agent",
    body: "Cursor \u00b7 Claude \u00b7 Windsurf",
    icon: Bot,
  },
];

export function HeroWorkflowVisual() {
  return (
    <div
      aria-hidden="true"
      className="hero-workflow pointer-events-none relative h-full w-full select-none"
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, currentColor 4%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 4%, transparent) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      <div className="absolute top-1/2 left-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon-lime/20 blur-[100px]" />

      {/* Stage cards — horizontal row */}
      <div className="relative flex h-full flex-row flex-wrap items-center justify-center gap-3 py-4">
        {STAGES.map((stage, i) => (
          <div key={stage.id} style={{ animationDelay: `${i * 120}ms` }}>
            <StageCard stage={stage} />
          </div>
        ))}
      </div>

      <style>{`
        .hero-workflow .stage-card {
          animation: hero-stage-rise 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes hero-stage-rise {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-workflow .stage-card {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function StageCard({ stage }: { stage: Stage }) {
  const Icon = stage.icon;
  return (
    <div className="stage-card">
      <div className="flex items-center gap-2.5 border border-border/50 bg-card/60 px-3 py-2 shadow-sm backdrop-blur-xl">
        <span className="flex size-8 shrink-0 items-center justify-center border border-border/50 bg-background/60 text-foreground/85">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="font-display font-semibold text-foreground text-[11px] leading-tight sm:text-xs">
            {stage.label}
          </p>
          <p className="truncate font-mono text-[9px] text-muted-foreground sm:text-[10px]">
            {stage.body}
          </p>
        </div>
        <Sparkles
          aria-hidden="true"
          className="size-2.5 shrink-0 text-neon-lime opacity-60"
        />
      </div>
    </div>
  );
}
