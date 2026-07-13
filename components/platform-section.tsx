"use client";

/**
 * PlatformSection — the "One platform. Every layer…" features grid.
 *
 * Six feature cards, each running a looping "live demo" animation that
 * visualizes what the feature does (Composio / Linear style). Entrances use
 * Framer Motion spring physics gated by `useInView`; the internal loops are
 * CSS `@keyframes` + small state machines using transform/opacity only.
 * Everything is disabled under `prefers-reduced-motion`.
 */

import {
  type MotionValue,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import {
  Bot,
  Download,
  type LucideIcon,
  Network,
  RefreshCw,
  Target,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { ToolOrbitShowcase } from "@/components/ui/tool-orbit-card";
import { cn } from "@/lib/utils";

const HEADING_WORDS = ["One", "platform.", "Every", "layer."];

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 18, mass: 0.6 },
  },
} as const;

/* ----------------------------- 1. Crawling ------------------------------ */

function CrawlingCard() {
  const fileTree = [
    { name: "stripe-docs", size: "" },
    { name: "  ├── api-reference", size: "" },
    { name: "  │   ├── charges.mdx", size: "12kb" },
    { name: "  │   ├── customers.mdx", size: "18kb" },
    { name: "  │   └── refunds.mdx", size: "9kb" },
    { name: "  ├── checkout", size: "" },
    { name: "  └── billing", size: "" },
  ];

  const stats = [
    { label: "Host URL", value: "docs.stripe.com" },
    { label: "Total Pages", value: "1,284 pages" },
    { label: "Data Scanned", value: "12.4 MB" },
    { label: "Crawl Speed", value: "52 pages/sec" },
  ];

  return (
    <div className="flex flex-col gap-4 w-full h-full flex-1">
      {/* File Tree Explorer */}
      <div className="flex flex-col gap-1.5 p-3.5 rounded-xl border border-border/40 bg-zinc-950/40 font-mono text-[10.5px] text-zinc-300 select-none flex-1">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/20 pb-1.5 mb-1.5 flex items-center justify-between">
          <span>Target Tree</span>
          <span className="text-emerald-500 font-bold">● Scan complete</span>
        </span>
        {fileTree.map((node) => (
          <div
            className="flex items-center justify-between py-0.5 truncate hover:text-foreground"
            key={node.name}
          >
            <span>{node.name}</span>
            {node.size && (
              <span className="text-muted-foreground/60 text-[9px]">
                {node.size}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Crawl Metrics */}
      <div className="flex flex-col justify-between gap-3 p-3.5 rounded-xl border border-border/40 bg-card/30">
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/20 pb-1.5 flex items-center justify-between">
          <span>Metadata &amp; Stats</span>
          <span className="text-[#4285f4] dark:text-[#8ab4f8] font-bold">
            docs4llm-crawler/1.0
          </span>
        </span>
        <div className="grid grid-cols-2 gap-2.5 my-auto">
          {stats.map((stat) => (
            <div className="flex flex-col gap-0.5" key={stat.label}>
              <span className="text-[9px] text-muted-foreground font-mono">
                {stat.label}
              </span>
              <span className="text-[11px] text-foreground font-semibold font-mono truncate">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-border/20 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
          <span>Security checks:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            100% Passed
          </span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- 2. MCP generation -------------------------- */

function MCPGenCard() {
  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-border/40 bg-zinc-950 p-4 font-mono text-[10.5px] text-zinc-300 leading-relaxed shadow-inner">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
        <span className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase">
          Generated Tool Schema
        </span>
        <span className="size-1.5 rounded-full bg-emerald-500/80" />
      </div>
      <div className="space-y-1">
        <p className="text-zinc-500">{"// stripe/create_payment_intent"}</p>
        <p>
          <span className="text-violet-400">type</span>{" "}
          <span className="text-blue-400">Input</span> = {"{"}
        </p>
        <p className="pl-4">
          <span className="text-sky-300">amount</span>:{" "}
          <span className="text-amber-400">number</span>
          {";"}
        </p>
        <p className="pl-4">
          <span className="text-sky-300">currency</span>:{" "}
          <span className="text-amber-400">string</span>
          {";"}
        </p>
        <p className="pl-4">
          <span className="text-sky-300">metadata</span>?:{" "}
          <span className="text-violet-400">Record</span>&lt;
          <span className="text-amber-400">string</span>,{" "}
          <span className="text-amber-400">string</span>&gt;
          {";"}
        </p>
        <p>{"};"}</p>
      </div>
    </div>
  );
}

/* ---------------------------- 3. Retrieval ------------------------------ */

function RetrievalCard() {
  const results = [
    {
      title: "Retrieve Payment Intent",
      file: "payment_intents.mdx",
      match: "94% match",
    },
    {
      title: "Create Checkout Session",
      file: "checkout_sessions.mdx",
      match: "89% match",
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="rounded-lg border border-border/40 bg-card/25 px-3 py-2 flex items-center gap-2 font-mono text-[10.5px]">
        <span className="text-[#4285f4] dark:text-[#8ab4f8] font-bold">
          Query:
        </span>
        <span className="text-foreground font-medium truncate">
          stripe session return URL parameters
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {results.map((res) => (
          <div
            className="p-3 rounded-lg border border-border/40 bg-card/30 flex items-center justify-between"
            key={res.title}
          >
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-[10.5px] text-foreground font-semibold truncate">
                {res.title}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono truncate">
                {res.file}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full font-mono text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              {res.match}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ 4. Sync -------------------------------- */

function SyncCard() {
  const syncLogs = [
    {
      source: "docs.stripe.com",
      change: "12 pages updated",
      time: "2 mins ago",
    },
    {
      source: "stripe-openapi.json",
      change: "1 tool generated",
      time: "1 hr ago",
    },
  ];

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {syncLogs.map((log) => (
        <div
          className="p-3 rounded-xl border border-border/40 bg-card/30 flex flex-col gap-1 hover:bg-card/55 transition-colors"
          key={log.source}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10.5px] text-foreground font-semibold truncate">
              {log.source}
            </span>
            <span className="text-[9px] text-muted-foreground font-mono shrink-0">
              {log.time}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9.5px] font-mono text-muted-foreground">
            <span className="size-1 rounded-full bg-emerald-500" />
            <span>{log.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------- 5. Multi-agent ----------------------------- */

const multiAgentShowcase = () => <ToolOrbitShowcase />;

/* ----------------------------- 6. Export ------------------------------- */

function ExportCard() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border/40 bg-zinc-950 p-4 font-mono text-[10.5px] text-zinc-300 leading-relaxed shadow-inner">
      <div className="text-zinc-400 select-all">
        <p>
          <span className="text-violet-400">"stripe-mcp"</span>: {"{"}
        </p>
        <p className="pl-4">
          <span className="text-sky-300">"command"</span>:{" "}
          <span className="text-emerald-400">"npx"</span>,
        </p>
        <p className="pl-4">
          <span className="text-sky-300">"args"</span>: [
        </p>
        <p className="pl-8">
          <span className="text-emerald-400">"-y"</span>,
        </p>
        <p className="pl-8">
          <span className="text-emerald-400">"docs4llm-server@latest"</span>,
        </p>
        <p className="pl-8">
          <span className="text-emerald-400">"--key=st_3a1"</span>
        </p>
        <p className="pl-4">]</p>
        <p>{"}"}</p>
      </div>
    </div>
  );
}

/* ------------------------------ Card shell ----------------------------- */

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  span: string;
  accent: string;
  highlight?: boolean;
  render: (active: boolean) => React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    id: "crawler",
    title: "Smart Documentation Crawling",
    description:
      "Automatically understands documentation hierarchy and structure — Mintlify, Docusaurus, Swagger, GitBook, raw markdown.",
    icon: Network,
    span: "lg:col-span-3 lg:row-span-2",
    accent: "from-[#4285f4]/15 via-[#8ab4f8]/5 to-transparent",
    render: () => <CrawlingCard />,
  },
  {
    id: "mcp",
    title: "Production Ready MCP Generation",
    description:
      "Generate MCP servers without writing MCP code. Tools, workflows, auth, hosting — done.",
    icon: Workflow,
    span: "lg:col-span-3",
    accent: "from-[#4285f4]/15 via-[#8ab4f8]/5 to-transparent",
    render: () => <MCPGenCard />,
  },
  {
    id: "retrieval",
    title: "Agent Optimized Retrieval",
    description:
      "Improve AI coding accuracy and reduce hallucinations with semantic, schema-aware retrieval.",
    icon: Target,
    span: "lg:col-span-3",
    accent: "from-[#4285f4]/20 via-[#8ab4f8]/10 to-transparent",
    highlight: true,
    render: () => <RetrievalCard />,
  },
  {
    id: "sync",
    title: "Live Documentation Sync",
    description:
      "Keep documentation synchronized automatically — your MCP server tracks the source.",
    icon: RefreshCw,
    span: "lg:col-span-2",
    accent: "from-[#4285f4]/15 via-[#8ab4f8]/5 to-transparent",
    render: () => <SyncCard />,
  },
  {
    id: "agents",
    title: "Multi-Agent Compatibility",
    description:
      "Works across the modern MCP ecosystem — Cursor, Claude, VS Code, Windsurf, OpenAI Agents.",
    icon: Bot,
    span: "lg:col-span-2",
    accent: "from-[#4285f4]/15 via-[#8ab4f8]/5 to-transparent",
    render: multiAgentShowcase,
  },
  {
    id: "export",
    title: "One Click Export",
    description:
      "Instant MCP configuration generation. Copy a JSON snippet, paste into your editor, done.",
    icon: Download,
    span: "lg:col-span-2",
    accent: "from-[#4285f4]/15 via-[#8ab4f8]/5 to-transparent",
    render: () => <ExportCard />,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const Icon = feature.icon;

  return (
    <motion.div
      className={cn(
        "group relative col-span-1 rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[#4285f4]/8 hover:shadow-xl sm:p-7",
        feature.id === "agents" ? "overflow-visible" : "overflow-hidden",
        feature.span,
        feature.highlight
          ? "border-[#4285f4]/45 bg-gradient-to-br from-[#4285f4]/12 via-card/50 to-[#8ab4f8]/12"
          : "border-border/60 bg-card/40 hover:border-[#4285f4]/50 dark:hover:border-[#8ab4f8]/50"
      )}
      ref={ref}
      variants={cardVariants}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
          feature.accent
        )}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4285f4]/45 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="flex h-full flex-col gap-5">
        <div>
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-foreground/85">
              <Icon className="size-4" />
            </span>
          </div>
          <h3 className="font-display font-semibold text-foreground text-lg tracking-tight sm:text-xl">
            {feature.title}
          </h3>
          <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
            {feature.description}
          </p>
        </div>

        <div className="text-foreground/70 flex-1 flex flex-col justify-end">
          {feature.render(inView)}
        </div>
      </div>
    </motion.div>
  );
}

/* ----------------------------- Background ------------------------------ */

function useMouseParallax(enabled: boolean): {
  ref: React.RefCallback<HTMLElement>;
  x: MotionValue<number>;
  y: MotionValue<number>;
} {
  const ref = useRef<HTMLElement | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 60, damping: 20 });
  const y = useSpring(rawY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const el = ref.current;
    if (!(enabled && el)) {
      return;
    }
    const handle = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      rawX.set(((e.clientX - rect.left) / rect.width - 0.5) * 24);
      rawY.set(((e.clientY - rect.top) / rect.height - 0.5) * 24);
    };
    el.addEventListener("mousemove", handle);
    return () => el.removeEventListener("mousemove", handle);
  }, [enabled, rawX, rawY]);

  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);

  return { ref: setRef, x, y };
}

/* ------------------------------ Section -------------------------------- */

export function PlatformSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  const { ref: sectionRef, x, y } = useMouseParallax(!reduce);

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-24 lg:py-32"
      id="features"
      ref={sectionRef}
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
      {/* parallax dot grid */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          x,
          y,
          backgroundImage:
            "radial-gradient(circle at center, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-12">
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 mb-12 sm:mb-16 text-left"
          ref={headerRef}
        >
          <div>
            <span className="mb-4 inline-flex items-center gap-3 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
              Platform
            </span>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl lg:text-5xl leading-tight">
              {HEADING_WORDS.map((word, i) => {
                const isAccent = word === "Every" || word === "layer.";
                return (
                  <motion.span
                    animate={headerInView ? { opacity: 1, y: 0 } : {}}
                    className={cn(
                      "mr-[0.25em] inline-block",
                      isAccent
                        ? "text-[#4285f4] dark:text-[#8ab4f8] font-semibold"
                        : "text-foreground"
                    )}
                    initial={{ opacity: 0, y: 14 }}
                    key={word}
                    transition={{ delay: reduce ? 0 : i * 0.07, duration: 0.5 }}
                  >
                    {word}
                  </motion.span>
                );
              })}
            </h2>
          </div>
          <div className="flex flex-col justify-end lg:pb-1">
            <p className="text-base text-muted-foreground leading-relaxed">
              From crawl to retrieval to deployment — the full stack between
              your docs and an AI agent.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-[#4285f4] dark:text-[#8ab4f8]">
              <span className="flex items-center gap-1.5 border border-[#4285f4]/30 bg-[#4285f4]/5 px-2.5 py-1 rounded-full">
                <span className="size-1.5 rounded-full bg-[#4285f4] animate-pulse" />
                6 Capabilities
              </span>
              <span className="flex items-center gap-1.5 border border-[#8ab4f8]/30 bg-[#8ab4f8]/5 px-2.5 py-1 rounded-full">
                <span className="size-1.5 rounded-full bg-[#8ab4f8] animate-pulse" />
                1 Secure Endpoint
              </span>
            </div>
          </div>
        </div>

        <motion.div
          animate="show"
          className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-6 lg:auto-rows-[minmax(220px,auto)]"
          initial="hidden"
          variants={containerVariants}
          viewport={{ once: true, amount: 0.1 }}
          whileInView="show"
        >
          {FEATURES.map((feature) => (
            <FeatureCard feature={feature} key={feature.id} />
          ))}
        </motion.div>
      </div>

      <style>{`
        @keyframes pf-scan {
          from { transform: translateX(-100%); }
          to   { transform: translateX(100%); }
        }
        @keyframes pf-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pf-bar {
          0%   { width: 0; }
          55%  { width: var(--pf-target); }
          100% { width: var(--pf-target); }
        }
        @keyframes pf-dash-travel {
          0%   { left: 0%; transform: translateX(-100%); }
          100% { left: 100%; transform: translateX(0%); }
        }
        @keyframes pf-glow {
          0%, 100% { box-shadow: 0 0 18px -6px rgba(66, 133, 244, 0.35); }
          50%      { box-shadow: 0 0 26px -4px rgba(138, 180, 248, 0.55); }
        }
        @keyframes pf-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pf-ripple {
          0%   { transform: scale(0.5); opacity: 0.7; }
          100% { transform: scale(1.25); opacity: 0; }
        }
        @keyframes pf-mesh {
          0%, 100% { background-position: 0% 0%; }
          50%      { background-position: 100% 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="pf-"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
