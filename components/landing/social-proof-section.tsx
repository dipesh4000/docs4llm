"use client";

import {
  Code2,
  GitBranch,
  Layers,
  type LucideIcon,
  Quote,
  Sparkles,
  Users,
} from "lucide-react";

type Pill = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const PILLS: Pill[] = [
  { id: "ai", label: "Built for AI-native developers", icon: Sparkles },
  { id: "agents", label: "Designed for agent workflows", icon: Code2 },
  { id: "teams", label: "Helping teams make docs AI-accessible", icon: Users },
];

type Trust = {
  id: string;
  metric: string;
  label: string;
  icon: LucideIcon;
};

const TRUST: Trust[] = [
  {
    id: "stack",
    metric: "5+",
    label: "MCP clients supported",
    icon: Layers,
  },
  {
    id: "registry",
    metric: "v0.1",
    label: "Live in the MCP Registry",
    icon: GitBranch,
  },
  {
    id: "speed",
    metric: "< 60s",
    label: "Docs to a live MCP",
    icon: Sparkles,
  },
];

export function SocialProofSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
      id="social-proof"
    >
      {/* Background Subtle Gradient */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full pointer-events-none opacity-15 dark:opacity-10 blur-[100px] -z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(66, 133, 244, 0.1) 0%, transparent 100%)",
        }}
      />
      {/* dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        {/* Restructured 2-Column Split Layout for Header & Customer Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 items-start mb-12 sm:mb-16">
          <div className="space-y-6">
            <div>
              <span className="mb-4 inline-flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                Trust
              </span>
              <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl leading-tight text-foreground">
                Built for the people building the agentic web.
              </h2>
            </div>

            {/* Flat Pill Badges */}
            <ul className="flex flex-wrap gap-2.5 pt-2">
              {PILLS.map((p) => {
                const Icon = p.icon;
                return (
                  <li
                    className="group inline-flex items-center gap-2 rounded-full border border-border/40 bg-card/25 px-3.5 py-1.5 backdrop-blur-md transition-colors hover:border-border/60 hover:bg-card/40"
                    key={p.id}
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-3.5 text-[#4285f4] dark:text-[#8ab4f8]"
                    />
                    <span className="font-display font-medium text-foreground/80 text-xs sm:text-sm">
                      {p.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Customer Quote Box on the right */}
          <figure className="rounded-2xl border border-border/40 bg-card/25 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden h-full">
            <Quote
              aria-hidden="true"
              className="size-5 text-[#4285f4] dark:text-[#8ab4f8] mb-3"
            />
            <blockquote className="font-display text-foreground text-base sm:text-lg leading-relaxed font-medium italic">
              “We stopped pasting docs into prompts. Our agents finally know
              what our APIs actually do — across every editor in our stack.”
            </blockquote>
            <figcaption className="mt-4 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
              — Early Customer · AI infra team
            </figcaption>
          </figure>
        </div>

        {/* Recreated Trust Grid Metrics */}
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TRUST.map((t) => {
            const Icon = t.icon;
            return (
              <li
                className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-card/20 px-5 py-4.5 backdrop-blur-md transition-all duration-300 hover:bg-card/45 hover:border-border/80"
                key={t.id}
              >
                <span className="flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background/50 text-[#4285f4] dark:text-[#8ab4f8] group-hover:scale-[1.02] transition-transform duration-300">
                  <Icon aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-foreground text-base sm:text-lg tracking-tight">
                    {t.metric}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.14em]">
                    {t.label}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
