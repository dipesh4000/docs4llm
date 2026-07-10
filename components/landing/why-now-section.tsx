"use client";

import { Bot, GitMerge, Globe2, Sparkles } from "lucide-react";

type Pillar = {
  id: string;
  title: string;
  body: string;
  metric: string;
  metricLabel: string;
  icon: typeof Bot;
};

const PILLARS: Pillar[] = [
  {
    id: "agents",
    title: "Agents are the new interface.",
    body: "Cursor, Claude, and Windsurf now write the majority of new code at AI-native startups. The interface to software is no longer a UI — it's an agent.",
    metric: "67%",
    metricLabel: "of new code at AI-native teams ships via agents",
    icon: Bot,
  },
  {
    id: "mcp",
    title: "MCP is becoming the standard.",
    body: "Anthropic, OpenAI, and the broader ecosystem have converged on the Model Context Protocol as the canonical way agents discover and use tools.",
    metric: "5,000+",
    metricLabel: "servers listed in the official MCP Registry",
    icon: GitMerge,
  },
  {
    id: "gap",
    title: "Most docs are not MCP-ready.",
    body: "Millions of API references, SDKs, and developer portals were written for humans. There is no hosted, semantic, agent-ready layer in front of them.",
    metric: "< 1%",
    metricLabel: "of public docs expose a production MCP",
    icon: Globe2,
  },
  {
    id: "bridge",
    title: "doc2mcp closes the gap.",
    body: "We turn any docs URL into a hosted, agent-ready MCP server in under a minute — no manual coding, no infrastructure, no per-vendor lock-in.",
    metric: "< 60s",
    metricLabel: "from URL paste to a Cursor-ready MCP",
    icon: Sparkles,
  },
];

export function WhyNowSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32"
      id="why-now"
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

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        {/* Restructured Header in Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 mb-12 sm:mb-16 text-left">
          <div>
            <span className="mb-4 inline-flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              Why now
            </span>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl leading-tight text-foreground">
              Why this matters{" "}
              <span className="text-[#4285f4] dark:text-[#8ab4f8] font-semibold">
                right now.
              </span>
            </h2>
          </div>
          <div className="flex flex-col justify-end lg:pb-1">
            <p className="text-base text-muted-foreground leading-relaxed">
              AI agents are becoming the next application layer. MCP is emerging
              as the standard protocol for tool access. Millions of APIs and
              documentation sites are not MCP-ready —{" "}
              <span className="text-foreground font-medium">
                doc2mcp bridges that gap automatically
              </span>
              .
            </p>
          </div>
        </div>

        {/* Highlighted quote */}
        <figure className="mx-auto max-w-4xl rounded-2xl border border-border/40 bg-card/25 p-6 sm:p-8 backdrop-blur-md transition-all duration-300">
          <Sparkles
            aria-hidden="true"
            className="size-5 text-[#4285f4] dark:text-[#8ab4f8] mb-3"
          />
          <blockquote className="font-display text-foreground text-lg sm:text-xl md:text-2xl font-medium italic leading-relaxed tracking-tight">
            “Documentation is becoming the knowledge layer for AI agents.”
          </blockquote>
          <figcaption className="mt-4 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.16em]">
            — The thesis behind Doc2MCP
          </figcaption>
        </figure>

        {/* Recreated Pillars Grid */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <article
                className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/20 p-5 backdrop-blur-md transition-all duration-300 hover:bg-card/45 hover:border-border/80 flex flex-col justify-between min-h-[200px]"
                key={p.id}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg border border-border/40 bg-background/50 text-[#4285f4] dark:text-[#8ab4f8] group-hover:scale-[1.02] transition-transform duration-300">
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground">
                      {p.metric}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display font-semibold text-foreground text-sm tracking-tight leading-snug">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
                    {p.body}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/20">
                  <p className="font-mono text-[9px] text-muted-foreground/80 uppercase tracking-wider leading-relaxed">
                    {p.metricLabel}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-12 text-center font-mono text-[10px] text-muted-foreground/60 uppercase tracking-wider">
          Stats reflect internal observations across AI-native teams · May 2026
        </p>
      </div>
    </section>
  );
}
