"use client";

import {
  Bot,
  Brain,
  CheckCircle2,
  Clock,
  GitBranch,
  type LucideIcon,
  Network,
  RefreshCw,
  Rocket,
} from "lucide-react";

type Outcome = {
  id: string;
  title: string;
  detail: string;
  icon: LucideIcon;
  accent: string;
};

const OUTCOMES: Outcome[] = [
  {
    id: "halluc",
    title: "Reduce hallucinated code",
    detail:
      "Agents respond from your real docs — not stale training data — so generated code actually compiles and ships.",
    icon: Brain,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
  {
    id: "accuracy",
    title: "Improve AI coding accuracy",
    detail:
      "Schema-aware retrieval narrows answers to the right endpoint, the right version, the right example.",
    icon: CheckCircle2,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
  {
    id: "manual",
    title: "Avoid manual MCP development",
    detail:
      "Stop hand-writing tool wrappers per product. Doc2MCP generates them from documentation, automatically.",
    icon: GitBranch,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
  {
    id: "updates",
    title: "Keep documentation updated",
    detail:
      "Live sync keeps the MCP server tracking your source — without redeploys, manual diffs, or token rotation.",
    icon: RefreshCw,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
  {
    id: "context",
    title: "Give AI agents structured context",
    detail:
      "Replace prompt stuffing with structured, retrievable, AI-optimized context — usable across every MCP client.",
    icon: Bot,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
  {
    id: "ship",
    title: "Ship integrations faster",
    detail:
      "From “read docs” to “write integration” in minutes — across Cursor, Claude, Windsurf, OpenAI Agents.",
    icon: Rocket,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
  {
    id: "scale",
    title: "Scale internal knowledge systems",
    detail:
      "Convert internal runbooks, ADRs, RFCs, and product docs into a queryable knowledge layer for your agents.",
    icon: Network,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
  {
    id: "time",
    title: "Reclaim engineering hours",
    detail:
      "Stop pasting docs into prompts and debugging hallucinations — your team’s time goes back to product.",
    icon: Clock,
    accent: "from-[#4285f4]/15 to-[#8ab4f8]/0",
  },
];

export function WhyTeamsSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
      id="why-teams"
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
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 mb-12 sm:mb-16 text-left">
          <div>
            <span className="mb-4 inline-flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              Outcomes
            </span>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl leading-tight">
              Why teams use{" "}
              <span className="text-[#4285f4] dark:text-[#8ab4f8] font-semibold">
                Doc2MCP
              </span>
            </h2>
          </div>
          <div className="flex flex-col justify-end lg:pb-1">
            <p className="text-base text-muted-foreground leading-relaxed">
              The compound effect of giving every agent — internal or customer-
              facing — structured, current, AI-ready documentation.
            </p>
          </div>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {OUTCOMES.map((o) => {
            const Icon = o.icon;
            return (
              <li
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/25 p-5 backdrop-blur-md transition-all duration-300 hover:bg-card/40 hover:border-border/80"
                key={o.id}
              >
                <span className="flex size-9 items-center justify-center rounded-xl border border-border/40 bg-background/50 text-[#4285f4] dark:text-[#8ab4f8] group-hover:scale-[1.02] transition-transform duration-300">
                  <Icon className="size-4.5" />
                </span>
                <h3 className="mt-4 font-display font-semibold text-foreground text-base tracking-tight">
                  {o.title}
                </h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {o.detail}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
