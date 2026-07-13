"use client";

import {
  BadgeCheck,
  Check,
  ExternalLink,
  Github,
  Layers,
  Minus,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SocialProofSection } from "@/components/landing/social-proof-section";
import { cn } from "@/lib/utils";

type Cell = "yes" | "no" | "partial";

type Capability = {
  key: string;
  label: string;
  desc: string;
};

type Competitor = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  cells: Record<string, Cell>;
  highlight?: boolean;
};

const CAPABILITIES: Capability[] = [
  {
    key: "smart_tools",
    label: "Smart Tools",
    desc: "Endpoints compressed into semantic, AI-friendly toolkits (not raw POST /users).",
  },
  {
    key: "workflow_ai",
    label: "Workflow AI",
    desc: "Infers auth, payment, upload, webhook, and CRUD flows — and surfaces them as agents.",
  },
  {
    key: "visual_graph",
    label: "Visual Graph",
    desc: "React-Flow graph of endpoint relationships, auth flow, and tool dependencies.",
  },
  {
    key: "playground",
    label: "Live Playground",
    desc: "Test generated tools, simulate workflows, inspect outputs in-browser before shipping.",
  },
  {
    key: "ai_understanding",
    label: "AI Understanding Score",
    desc: "Docs quality score · workflow confidence · auth confidence · MCP quality score.",
  },
  {
    key: "live_processing",
    label: "Live Processing UI",
    desc: "Streaming terminal: crawl → analyze → detect auth → compress → workflows → MCP.",
  },
  {
    key: "multi_docs",
    label: "Multi-Docs Engine",
    desc: "Auto-detects Mintlify, Docusaurus, Swagger/OpenAPI, Markdown, GitBook, Postman.",
  },
  {
    key: "ai_native",
    label: "AI-native",
    desc: "Built on a modern LLM end-to-end. No vendor lock-in for the index layer.",
  },
];

const COMPETITORS: Competitor[] = [
  {
    id: "docs4llm",
    name: "docs4llm",
    tagline: "AI-native docs-to-MCP, the right way.",
    url: "https://docs4llm.com",
    highlight: true,
    cells: {
      smart_tools: "yes",
      workflow_ai: "yes",
      visual_graph: "yes",
      playground: "yes",
      ai_understanding: "yes",
      live_processing: "yes",
      multi_docs: "yes",
      ai_native: "yes",
    },
  },
  {
    id: "arcmcp",
    name: "ArcMCP",
    tagline: "Hosted search + get_page over Arc docs.",
    url: "https://docs.arc.io/mcp",
    cells: {
      smart_tools: "partial",
      workflow_ai: "no",
      visual_graph: "no",
      playground: "no",
      ai_understanding: "partial",
      live_processing: "no",
      multi_docs: "no",
      ai_native: "no",
    },
  },
  {
    id: "mcpforge",
    name: "mcp-forge",
    tagline: "Managed pre-built MCP servers + OpenAPI CLI.",
    url: "https://www.mcpforge.org",
    cells: {
      smart_tools: "partial",
      workflow_ai: "partial",
      visual_graph: "no",
      playground: "no",
      ai_understanding: "no",
      live_processing: "no",
      multi_docs: "partial",
      ai_native: "no",
    },
  },
  {
    id: "mintlify",
    name: "Mintlify MCP",
    tagline: "Search/edit Mintlify-hosted pages only.",
    url: "https://www.mintlify.com/docs/ai/mintlify-mcp",
    cells: {
      smart_tools: "no",
      workflow_ai: "no",
      visual_graph: "no",
      playground: "no",
      ai_understanding: "no",
      live_processing: "no",
      multi_docs: "partial",
      ai_native: "no",
    },
  },
  {
    id: "stainless",
    name: "Stainless",
    tagline: "Raw MCP servers from your OpenAPI spec.",
    url: "https://www.stainless.com/mcp",
    cells: {
      smart_tools: "no",
      workflow_ai: "no",
      visual_graph: "no",
      playground: "no",
      ai_understanding: "no",
      live_processing: "no",
      multi_docs: "partial",
      ai_native: "no",
    },
  },
];

type CompetitorProfile = {
  id: string;
  name: string;
  tagline: string;
  url: string;
  github?: string;
  pricing: string;
  scope: string;
  strengths: string[];
  gaps: string[];
};

const COMPETITOR_PROFILES: CompetitorProfile[] = [
  {
    id: "arcmcp",
    name: "ArcMCP",
    tagline:
      "Hosted MCP for the Arc Network documentation — search and get_page only.",
    url: "https://docs.arc.io/mcp",
    pricing: "Free, scoped to Arc docs only",
    scope: "Single-vendor docs MCP",
    strengths: [
      "Zero setup — just add the HTTP URL to Cursor / Claude",
      "No auth required for Arc docs",
      "Works out of the box for Arc-specific questions",
    ],
    gaps: [
      "Only Arc Network docs, not your docs or any external API",
      "Exposes only two generic tools (search, get_page), no semantic toolkits",
      "No workflow inference, no playground, no API graph",
    ],
  },
  {
    id: "mcpforge",
    name: "mcp-forge",
    tagline:
      "Managed catalog of pre-built MCP servers (WordPress, Supabase, etc.) plus a coming-soon OpenAPI generator.",
    url: "https://www.mcpforge.org",
    github: "https://github.com/lorenzosaraiva/mcpforge",
    pricing: "From $9/mo per server · $25/mo all-access",
    scope: "Managed servers + OpenAPI/docs CLI",
    strengths: [
      "Subscription-managed MCPs for common SaaS — copy config & go",
      "Auto-updating via npm registry, built on Stainless under the hood",
      "Open-source CLI variant supports OpenAPI + docs URL → MCP with AI curation",
    ],
    gaps: [
      "Hosted catalog only covers ~7 popular SaaS, not arbitrary docs URLs",
      "OpenAPI flow is CLI-driven, no live processing UI or visual graph",
      "No understanding score, no playground, no remote MCP for your own docs",
    ],
  },
  {
    id: "mintlify",
    name: "Mintlify MCP",
    tagline:
      "Two MCPs scoped to docs already hosted on Mintlify — one read, one write.",
    url: "https://www.mintlify.com/docs/ai/mintlify-mcp",
    pricing: "Included in Mintlify plans",
    scope: "Mintlify-hosted docs only",
    strengths: [
      "Tight integration with Mintlify pages, branches, and pull requests",
      "Lets AI agents edit pages, restructure navigation, open PRs",
      "Read MCP is auto-generated alongside published docs",
    ],
    gaps: [
      "Only works if your docs are already on Mintlify",
      "Tools mirror docs primitives (search, read, edit) — not API workflows",
      "No semantic toolkit for arbitrary REST/OpenAPI, no playground, no graph",
    ],
  },
  {
    id: "stainless",
    name: "Stainless",
    tagline:
      "Generates SDKs and MCP servers from your OpenAPI spec — endpoint-shaped.",
    url: "https://www.stainless.com/mcp",
    pricing: "Custom — built around SDK plans",
    scope: "OpenAPI → MCP for API owners",
    strengths: [
      "Strong schema validation and clean codegen for large OpenAPI specs",
      "Used by Modern Treasury, Scorecard and others for production remote MCPs",
      "Excellent fit if you already maintain a clean OpenAPI spec",
    ],
    gaps: [
      "Requires an OpenAPI spec — can't ingest docs URLs, Mintlify, or GitBook",
      "Tools mirror endpoints 1:1 — no semantic compression or workflow inference",
      "No public playground, no understanding score, no live processing UI",
    ],
  },
];

const EVALUATED_AT = "May 2026";

type TrustListing = {
  id: string;
  label: string;
  detail: string;
  url: string;
};

const TRUST_LISTINGS: TrustListing[] = [
  {
    id: "mcp-registry",
    label: "Official MCP Registry",
    detail: "io.github.docs4llm",
    url: "https://registry.modelcontextprotocol.io/?search=docs4llm",
  },
  {
    id: "claude-marketplaces",
    label: "Claude Code Marketplaces",
    detail: "claudemarketplaces.com",
    url: "https://claudemarketplaces.com/mcp/docs4llm/docs4llm",
  },
  {
    id: "pulsemcp",
    label: "PulseMCP",
    detail: "pulsemcp.com",
    url: "https://www.pulsemcp.com/servers/docs4llm/serverjson",
  },
];

function TrustStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl",
        compact ? "mt-6" : "mt-8"
      )}
    >
      <div className="flex items-center justify-center gap-2 border-border/40 border-b bg-muted/20 px-4 py-2">
        <ShieldCheck className="size-3.5 text-violet-600 dark:text-violet-300" />
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Listed &amp; verified on
        </span>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {TRUST_LISTINGS.map((listing) => (
          <a
            className="group flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-violet-500/5"
            href={listing.url}
            key={listing.id}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-300">
              <BadgeCheck className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground text-sm">
                {listing.label}
              </span>
              <span className="block truncate font-mono text-[10px] text-muted-foreground">
                {listing.detail}
              </span>
            </span>
            <ExternalLink className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}

const CELL_STYLE: Record<
  Cell,
  { icon: typeof Check; cls: string; label: string }
> = {
  yes: {
    icon: Check,
    cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    label: "Yes",
  },
  partial: {
    icon: Minus,
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    label: "Partial",
  },
  no: {
    icon: X,
    cls: "border-rose-500/30 bg-rose-500/10 text-rose-700/80 dark:text-rose-300/80",
    label: "No",
  },
};

export function ComparisonSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section
        className="relative py-16 sm:py-24 lg:py-32"
        id="comparison"
        ref={sectionRef}
      >
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
          <div className="mb-12 text-center sm:mb-16">
            <span className="inline-flex items-center gap-3 font-mono text-muted-foreground text-sm">
              <span className="h-px w-8 bg-foreground/30" />
              Comparison
              <span className="h-px w-8 bg-foreground/30" />
            </span>
            <h2
              className={cn(
                "mt-6 font-display text-3xl tracking-tight transition-all duration-700 sm:text-5xl lg:text-6xl",
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              )}
            >
              Manual MCP development{" "}
              <span className="text-muted-foreground">vs</span>{" "}
              <span className="text-[#4285f4] dark:text-[#8ab4f8] font-semibold">
                Docs4LLM
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Build it by hand and you ship a one-off, brittle integration. Use
              Docs4LLM and you ship{" "}
              <span className="text-foreground">infrastructure</span> —
              structured, current, and ready for every agent in your stack.
            </p>
          </div>

          <ManualVsDocs4LlmTable />

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-2 font-medium text-sm text-violet-700 transition-colors hover:bg-violet-500/20 dark:text-violet-200"
              href="/comparison"
            >
              <Network className="size-4" />
              See the full market comparison
            </Link>
          </div>
        </div>
      </section>
      <SocialProofSection />
    </>
  );
}

export function MarketMatrixSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <section
      className="relative py-16 sm:py-24"
      id="market-matrix"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            <span className="h-px w-8 bg-foreground/30" />
            Market matrix
            <span className="h-px w-8 bg-foreground/30" />
          </span>
          <h2 className="mt-4 font-display text-2xl tracking-tight sm:text-4xl">
            And how we compare to other MCP tooling
          </h2>
          <TrustStrip />
        </div>

        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl transition-all duration-700",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-border/50 border-b">
                  <th className="sticky left-0 z-10 bg-card/80 px-5 py-4 text-left font-mono text-[11px] text-muted-foreground uppercase tracking-wider backdrop-blur-xl">
                    Capability
                  </th>
                  {COMPETITORS.map((c) => (
                    <th
                      className={cn(
                        "px-3 py-4 text-left",
                        c.highlight
                          ? "bg-violet-500/10 dark:bg-violet-500/10"
                          : ""
                      )}
                      key={c.id}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 font-display font-semibold text-base">
                          {c.name}
                          {c.highlight ? (
                            <Sparkles className="size-3.5 text-violet-600 dark:text-violet-300" />
                          ) : null}
                        </span>
                        <span className="text-muted-foreground text-xs leading-snug">
                          {c.tagline}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((cap, rowIdx) => (
                  <tr
                    className={cn(
                      "border-border/40 border-b transition-colors hover:bg-foreground/[0.02]",
                      rowIdx === CAPABILITIES.length - 1 ? "border-b-0" : ""
                    )}
                    key={cap.key}
                  >
                    <td className="sticky left-0 z-10 max-w-[260px] bg-card/80 px-5 py-4 align-top backdrop-blur-xl">
                      <p className="font-medium text-foreground">{cap.label}</p>
                      <p className="mt-0.5 text-muted-foreground text-xs leading-snug">
                        {cap.desc}
                      </p>
                    </td>
                    {COMPETITORS.map((comp) => {
                      const cell = comp.cells[cap.key] ?? "no";
                      const style = CELL_STYLE[cell];
                      const Icon = style.icon;
                      return (
                        <td
                          className={cn(
                            "px-3 py-4 align-top",
                            comp.highlight
                              ? "bg-violet-500/10 dark:bg-violet-500/10"
                              : ""
                          )}
                          key={comp.id}
                        >
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wider",
                              style.cls
                            )}
                          >
                            <Icon className="size-3" />
                            {style.label}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <FeatureCallout
            badge="Semantic"
            body="Endpoints group into User Management, Billing, Webhooks. Tools are LLM-shaped, not REST-shaped."
            icon={Layers}
            title="Tools, not endpoints"
          />
          <FeatureCallout
            badge="Inferred"
            body="Customer Support Agent · Billing Agent · GitHub Automation · CRM Workflow — generated from your docs."
            icon={Workflow}
            title="Workflow AI engine"
          />
          <FeatureCallout
            badge="Live"
            body="Watch crawl, parse, detect auth, compress endpoints, build MCP — all streaming in real time."
            icon={Zap}
            title="Real-time processing"
          />
        </div>

        <div className="mt-16">
          <div className="mb-6 flex flex-col gap-2 text-center sm:mb-10">
            <span className="font-mono text-muted-foreground text-xs uppercase tracking-[0.2em]">
              Deep dive
            </span>
            <h3 className="font-display text-2xl tracking-tight sm:text-3xl">
              What each tool actually does
            </h3>
            <p className="mx-auto max-w-2xl text-muted-foreground text-sm">
              Researched from each vendor's own site, GitHub, and docs in{" "}
              {EVALUATED_AT}. No marketing fluff — just scope, strengths, and
              honest gaps.
            </p>
            <TrustStrip compact />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {COMPETITOR_PROFILES.map((profile) => (
              <CompetitorCard key={profile.id} profile={profile} />
            ))}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card/40 to-fuchsia-500/10 p-6 backdrop-blur-xl sm:grid-cols-3 sm:p-8">
          <StatTile
            label="Tools per project"
            sublabel="vs raw endpoint count"
            value="8–25"
          />
          <StatTile
            label="Time to live MCP"
            sublabel="from URL paste to Cursor"
            value="< 60s"
          />
          <StatTile
            label="Inference scopes"
            sublabel="auth · payment · upload · webhook · crud"
            value="6+"
          />
        </div>

        <p className="mt-8 text-center font-mono text-[11px] text-muted-foreground/70 uppercase tracking-wider">
          Sources: ArcMCP docs · mcp-forge.org &amp; lorenzosaraiva/mcpforge ·
          Mintlify MCP docs · Stainless MCP portal · evaluated {EVALUATED_AT}.
        </p>
      </div>
    </section>
  );
}

function FeatureCallout({
  badge,
  title,
  body,
  icon: Icon,
}: {
  badge: string;
  title: string;
  body: string;
  icon: typeof Layers;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300">
          <Icon className="size-3.5" />
        </span>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 font-mono text-[10px] text-violet-700 uppercase tracking-wider dark:text-violet-300">
          {badge}
        </span>
      </div>
      <h3 className="mt-3 font-display font-semibold text-lg">{title}</h3>
      <p className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
        {body}
      </p>
    </div>
  );
}

function CompetitorCard({ profile }: { profile: CompetitorProfile }) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-xl transition-colors hover:border-border">
      <header className="flex flex-col gap-2 border-border/40 border-b pb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-display font-semibold text-xl">{profile.name}</h4>
          <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            {profile.scope}
          </span>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {profile.tagline}
        </p>
        <p className="font-mono text-foreground/70 text-xs">
          <span className="text-muted-foreground">pricing · </span>
          {profile.pricing}
        </p>
      </header>

      <div>
        <p className="mb-2 font-mono text-[10px] text-emerald-600 uppercase tracking-wider dark:text-emerald-300">
          Where it wins
        </p>
        <ul className="space-y-1.5">
          {profile.strengths.map((s) => (
            <li className="flex gap-2 text-sm" key={s}>
              <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-foreground/80">{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] text-rose-600 uppercase tracking-wider dark:text-rose-300">
          Where it falls short
        </p>
        <ul className="space-y-1.5">
          {profile.gaps.map((g) => (
            <li className="flex gap-2 text-sm" key={g}>
              <X className="mt-0.5 size-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="text-foreground/80">{g}</span>
            </li>
          ))}
        </ul>
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-3 border-border/40 border-t pt-4 font-mono text-xs">
        <a
          className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          href={profile.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLink className="size-3" />
          Website
        </a>
        {profile.github ? (
          <a
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            href={profile.github}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Github className="size-3" />
            GitHub
          </a>
        ) : null}
        <Link
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-700 transition-colors hover:bg-violet-500/20 dark:text-violet-200"
          href={`/comparison#${profile.id}`}
        >
          <Network className="size-3" />
          Migrate to docs4llm
        </Link>
      </footer>
    </article>
  );
}

function StatTile({
  label,
  sublabel,
  value,
}: {
  label: string;
  sublabel: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border/40 bg-background/60 p-5 backdrop-blur-xl">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="font-display font-bold text-3xl tracking-tight sm:text-4xl">
        {value}
      </p>
      <p className="text-muted-foreground text-xs">{sublabel}</p>
    </div>
  );
}

const MANUAL_VS_ROWS: { label: string; manual: string; docs4llm: string }[] = [
  {
    label: "Setup time",
    manual: "Days to weeks of engineering",
    docs4llm: "Minutes from a docs URL",
  },
  {
    label: "Maintenance",
    manual: "Manual diffs on every API change",
    docs4llm: "Continuous, automated sync",
  },
  {
    label: "Documentation understanding",
    manual: "You read it, model guesses",
    docs4llm: "Structured, schema-aware context",
  },
  {
    label: "Updates",
    manual: "Redeploy, regenerate tools",
    docs4llm: "Live — same endpoint, fresh content",
  },
  {
    label: "Retrieval layer",
    manual: "DIY embeddings + glue code",
    docs4llm: "Semantic + workflow-aware out of the box",
  },
  {
    label: "AI readiness",
    manual: "Endpoint-shaped tools",
    docs4llm: "LLM-shaped tools and workflows",
  },
  {
    label: "Deployment",
    manual: "Self-host a server per integration",
    docs4llm: "One hosted remote MCP, multi-tenant",
  },
  {
    label: "Support",
    manual: "Internal, ad hoc",
    docs4llm: "Dedicated team, audit logs, SLAs",
  },
];

function ManualVsDocs4LlmTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/40 backdrop-blur-xl">
      <div className="grid grid-cols-1 border-border/40 border-b sm:grid-cols-[1.1fr_1fr_1fr]">
        <div className="hidden bg-muted/20 px-5 py-4 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.16em] sm:block">
          Capability
        </div>
        <div className="bg-muted/10 px-5 py-4">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.16em]">
            Manual MCP development
          </p>
          <p className="mt-1 font-display font-semibold text-foreground/85 text-base">
            DIY · slow · brittle
          </p>
        </div>
        <div className="bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-sky-500/15 px-5 py-4">
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-violet-700 uppercase tracking-[0.16em] dark:text-violet-200">
            <Sparkles className="size-3" />
            Docs4LLM
          </p>
          <p className="mt-1 font-display font-semibold text-base">
            Infrastructure · automated · current
          </p>
        </div>
      </div>

      {MANUAL_VS_ROWS.map((row, i) => (
        <div
          className={cn(
            "grid grid-cols-1 items-stretch border-border/40 sm:grid-cols-[1.1fr_1fr_1fr]",
            i !== MANUAL_VS_ROWS.length - 1 && "border-b"
          )}
          key={row.label}
        >
          <div className="bg-muted/10 px-5 py-4 sm:bg-transparent">
            <p className="font-display font-medium text-foreground text-sm">
              {row.label}
            </p>
          </div>
          <div className="flex items-center gap-2 px-5 py-4 text-muted-foreground text-sm">
            <X
              aria-hidden="true"
              className="size-3.5 shrink-0 text-rose-500/70"
            />
            <span>{row.manual}</span>
          </div>
          <div className="flex items-center gap-2 bg-violet-500/5 px-5 py-4 text-foreground/90 text-sm">
            <Check
              aria-hidden="true"
              className="size-3.5 shrink-0 text-emerald-500"
            />
            <span>{row.docs4llm}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
