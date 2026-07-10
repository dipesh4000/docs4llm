"use client";

import {
  Building2,
  Cpu,
  GitFork,
  Layers,
  Lock,
  Network,
  Workflow,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type UseCase = {
  id: string;
  badge: string;
  title: string;
  body: string;
  bullets: string[];
  icon: typeof Cpu;
};

const USE_CASES: UseCase[] = [
  {
    id: "api",
    badge: "For API Companies",
    title: "Turn API docs into AI-native integrations.",
    body: "Every API endpoint becomes a semantic tool your customers' agents can call directly — no SDK, no glue code, no support tickets.",
    bullets: [
      "OpenAPI, Swagger, and Postman collections",
      "Auto-generated auth + workflow primitives",
      "One MCP URL, distributed to every customer's IDE",
    ],
    icon: Network,
  },
  {
    id: "saas",
    badge: "For SaaS Platforms",
    title: "Let AI agents understand your product.",
    body: "Ship your docs as an MCP server alongside your dashboard. Cursor, Claude, and Windsurf can now answer questions about your product with first-party context.",
    bullets: [
      "Public docs + private knowledge bases",
      "Versioned per release, auto-resynced",
      "Reduce support load by ~30% with agentic Q&A",
    ],
    icon: Layers,
  },
  {
    id: "internal",
    badge: "For Internal Teams",
    title: "Convert internal docs into MCP infrastructure.",
    body: "Notion, Confluence, Markdown wikis — pipe them into a private MCP your engineers' agents can query without exposing data to third parties.",
    bullets: [
      "Self-hosted or single-tenant deployments",
      "SSO + role-based access control",
      "Audit logs for every agent query",
    ],
    icon: Building2,
  },
  {
    id: "oss",
    badge: "For Open Source",
    title: "Give coding agents accurate project context.",
    body: "Drop your GitHub docs URL. Every contributor's Cursor or Claude instantly understands your project's architecture, API surface, and conventions.",
    bullets: [
      "GitHub-native — works with raw markdown + READMEs",
      "Free tier for public projects",
      "Public MCP listing in the official Registry",
    ],
    icon: GitFork,
  },
];

const TRUST_ROW = [
  { icon: Lock, label: "SOC 2 ready architecture" },
  { icon: Cpu, label: "AI-native indexing" },
  { icon: Workflow, label: "Agent-shaped toolkits" },
  { icon: Zap, label: "< 60s URL → MCP" },
];

export function UseCasesSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28 lg:py-32"
      id="use-cases"
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
        {/* Restructured Header in Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 mb-12 sm:mb-16 text-left">
          <div>
            <span className="mb-4 inline-flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              Use cases
            </span>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl leading-tight text-foreground">
              Infrastructure for every{" "}
              <span className="text-[#4285f4] dark:text-[#8ab4f8] font-semibold">
                AI-native
              </span>{" "}
              team.
            </h2>
          </div>
          <div className="flex flex-col justify-end lg:pb-1">
            <p className="text-base text-muted-foreground leading-relaxed">
              From public APIs to private wikis — doc2mcp converts any
              documentation surface into a hosted MCP server your agents can
              actually use.
            </p>
          </div>
        </div>

        {/* Interactive Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 items-stretch">
          {/* Selectors List */}
          <div className="flex flex-col gap-3">
            {USE_CASES.map((uc, i) => {
              const Icon = uc.icon;
              const active = i === activeTab;
              return (
                <button
                  className={cn(
                    "flex flex-col text-left p-5 rounded-2xl border transition-all duration-300 backdrop-blur-md",
                    active
                      ? "border-[#4285f4] bg-[#4285f4]/5 dark:border-[#8ab4f8] dark:bg-[#8ab4f8]/5 shadow-sm"
                      : "border-border/40 bg-card/20 hover:bg-card/45 hover:border-border/80"
                  )}
                  key={uc.id}
                  onClick={() => setActiveTab(i)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg border transition-colors",
                        active
                          ? "border-[#4285f4]/40 bg-[#4285f4]/10 text-[#4285f4] dark:border-[#8ab4f8]/40 dark:bg-[#8ab4f8]/10 dark:text-[#8ab4f8]"
                          : "border-border/40 bg-background/50 text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                      {uc.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display font-semibold text-base text-foreground tracking-tight">
                    {uc.title}
                  </h3>
                  <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed max-w-lg">
                    {uc.body}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Large Mockup Inspector Pane */}
          <div className="flex flex-col justify-between p-6 sm:p-8 rounded-2xl border border-border/40 bg-card/25 backdrop-blur-md relative overflow-hidden min-h-[300px]">
            {/* Visual Header */}
            <div className="flex items-center justify-between border-b border-border/20 pb-4 mb-4">
              <span className="font-mono text-[10.5px] text-muted-foreground uppercase tracking-wider">
                Live Deployment Target
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9.5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>

            {/* Custom Mockup Pane Render */}
            <div className="flex-1 flex flex-col justify-center my-auto py-4">
              {activeTab === 0 && (
                <div className="flex flex-col gap-3 bg-zinc-950 p-4 rounded-xl border border-border/40 font-mono text-[10.5px] w-full max-w-md mx-auto shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-1">
                    <span className="text-zinc-500 font-bold uppercase">
                      stripe-mcp-server
                    </span>
                    <span className="text-emerald-500 font-bold">
                      ● Public Registry
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-zinc-400">Available Tools (23):</p>
                    <p className="pl-4 text-sky-300">· create_charge</p>
                    <p className="pl-4 text-sky-300">· retrieve_customer</p>
                    <p className="pl-4 text-sky-300">· list_payment_intents</p>
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="flex flex-col gap-3 bg-zinc-950 p-4 rounded-xl border border-border/40 font-mono text-[10.5px] w-full max-w-md mx-auto shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-1">
                    <span className="text-zinc-500 font-bold uppercase">
                      claude_desktop_config.json
                    </span>
                    <span className="text-[#4285f4] dark:text-[#8ab4f8] font-bold">
                      ● Connected
                    </span>
                  </div>
                  <div className="space-y-1 text-zinc-300">
                    <p className="text-zinc-500">
                      {"// Integrated context for support agents"}
                    </p>
                    <p>"stripe": {"{"}</p>
                    <p className="pl-4">
                      "url": "https://api.doc2mcp.com/stripe"
                    </p>
                    <p>{"}"}</p>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="flex flex-col gap-3 bg-zinc-950 p-4 rounded-xl border border-border/40 font-mono text-[10.5px] w-full max-w-md mx-auto shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-1">
                    <span className="text-zinc-500 font-bold uppercase">
                      VPC Deployment
                    </span>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <Lock className="size-3" /> Secure Gateway
                    </span>
                  </div>
                  <div className="space-y-2 text-zinc-400 py-1">
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span>Audit Log:</span>
                      <span className="text-zinc-200">Enabled</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span>Auth SSO:</span>
                      <span className="text-zinc-200">SAML 2.0</span>
                    </div>
                    <div className="flex justify-between pb-0">
                      <span>Data boundary:</span>
                      <span className="text-zinc-200">US-East-1 Only</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div className="flex flex-col gap-3 bg-zinc-950 p-4 rounded-xl border border-border/40 font-mono text-[10.5px] w-full max-w-md mx-auto shadow-inner">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-1">
                    <span className="text-zinc-500 font-bold uppercase">
                      GitHub Readme
                    </span>
                    <span className="text-blue-400 font-bold">● Free tier</span>
                  </div>
                  <div className="p-3 rounded border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <span className="font-mono text-zinc-400 select-all">
                      [![MCP
                      Server](https://mcp.run/doc2mcp.svg)](https://registry.doc2mcp.com)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bullets List of selected Use Case */}
            <div className="mt-4 pt-4 border-t border-border/20">
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider block mb-2.5">
                Key Features
              </span>
              <ul className="space-y-2 text-xs">
                {USE_CASES[activeTab].bullets.map((b) => (
                  <li
                    className="flex items-start gap-2.5 text-foreground/90"
                    key={b}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#4285f4] dark:bg-[#8ab4f8]"
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Trust Row */}
        <div className="mt-12 grid grid-cols-2 gap-2 rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-xl sm:grid-cols-4 sm:gap-4 sm:p-6">
          {TRUST_ROW.map((t) => {
            const Icon = t.icon;
            return (
              <div
                className="flex items-center gap-2.5 text-foreground/80"
                key={t.label}
              >
                <Icon className="size-4 shrink-0 text-foreground/60" />
                <span className="font-mono text-[10px] uppercase tracking-wider sm:text-xs">
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
