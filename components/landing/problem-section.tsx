"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardX,
  Clock,
  Ghost,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PAIN_POINTS = [
  {
    icon: Ghost,
    title: "Hallucinated APIs",
    body: "Without real context, AI assistants invent endpoints, mis-spell params, and ship code that compiles but breaks in production.",
  },
  {
    icon: ClipboardX,
    title: "Missing context",
    body: "Docs were written for humans. Agents miss the schemas, examples, and policies they actually need to act correctly.",
  },
  {
    icon: AlertTriangle,
    title: "Outdated examples",
    body: "v1 says one thing, v2 the opposite. Your assistant picks the wrong one — silently — and integrations drift.",
  },
  {
    icon: Clock,
    title: "Manual MCP work",
    body: "Hand-coding MCP tools per product is slow, brittle, and falls behind every changelog. Engineering hours, not infra.",
  },
];

const TICKER_LINES = [
  "stripe.checkout.sessions.create is not a function",
  "error: Param 'enable_mcp_routing' does not exist in v2.4",
  "stackoverflow answer is 4 years old, half the params changed",
  "spent 47 minutes finding one endpoint in 6 different doc sites",
  "changelog says v3 is breaking — no migration example",
  "prod incident: AI hallucinated a webhook signature header",
];

function ChaosVisual() {
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) {
      return;
    }
    const id = setInterval(() => setTick((t) => t + 1), 2800);
    return () => clearInterval(id);
  }, [reduce]);

  const activeLine = TICKER_LINES[tick % TICKER_LINES.length];

  return (
    <div className="relative h-full min-h-[340px] w-full overflow-hidden rounded-2xl border border-border bg-card p-4 font-mono text-xs select-none shadow-[0_8px_30px_rgba(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      {/* Tab bar header */}
      <div className="flex items-center justify-between border-border/60 border-b pb-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-[#ef4444] opacity-80" />
          <span className="size-2 rounded-full bg-[#f59e0b] opacity-80" />
          <span className="size-2 rounded-full bg-border" />
        </div>
        <span className="text-[9px] sm:text-[10px] text-rose-500 dark:text-rose-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-rose-500 animate-ping" />
          context-check: failed
        </span>
      </div>

      {/* Editor UI */}
      <div className="space-y-3.5 text-[11px] sm:text-xs">
        {/* User prompt */}
        <div className="flex items-start gap-2.5 bg-secondary/40 p-2.5 rounded-lg border border-border/40">
          <span className="size-5 rounded-full bg-secondary flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">
            U
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] text-muted-foreground font-semibold">
              USER
            </div>
            <p className="text-foreground/90 mt-0.5 truncate">
              Generate code to create a customer checkout session.
            </p>
          </div>
        </div>

        {/* AI response with visual errors */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="size-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[9px] font-bold text-rose-500 dark:text-rose-400 shrink-0">
              AI
            </span>
            <div className="text-[9px] text-rose-500 dark:text-rose-400 font-semibold uppercase">
              Hallucinating Assistant
            </div>
          </div>

          <div className="bg-background border border-border/40 rounded-lg p-3 relative overflow-hidden">
            {/* Deprecated warning overlay */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 px-1.5 py-0.5 text-[8px] sm:text-[9px] text-rose-500 dark:text-rose-400 font-medium">
              <AlertTriangle className="size-3" /> Deprecated
            </div>

            <pre className="text-foreground/70 dark:text-foreground/80 leading-relaxed overflow-x-auto text-[10px] sm:text-[11px]">
              <code>
                {`import stripe from 'stripe';
 
await stripe.`}
                <span className="text-rose-500 dark:text-rose-400 border-b border-dashed border-rose-500 font-bold">
                  checkout.sessions.create
                </span>
                {`({
  customer: 'usr_123',
  payment_method_types: ['card'],
  // ⚠️ Hallucinated parameter
  `}
                <span className="text-amber-500 dark:text-amber-400 border-b border-dashed border-amber-500 font-bold">
                  enable_mcp_routing
                </span>
                {`: true
});`}
              </code>
            </pre>
          </div>
        </div>

        {/* Terminal Traceback Output */}
        <div className="border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10 rounded-lg p-3 text-[10px] text-rose-500 dark:text-rose-400 leading-relaxed font-mono">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle className="size-3.5" />
            <span>Terminal Error Log</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 font-mono text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-300/80 truncate"
              exit={{ opacity: 0, y: -2 }}
              initial={{ opacity: 0, y: 2 }}
              key={activeLine}
              transition={{ duration: 0.25 }}
            >
              {`> ${activeLine}`}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating warning tags */}
      <span className="absolute top-[28%] left-[70%] -translate-x-1/2 rotate-3 rounded-full border border-rose-500/20 bg-background dark:bg-zinc-900 px-2.5 py-1 text-[8px] sm:text-[9px] text-rose-500 dark:text-rose-400 font-mono font-medium shadow-md uppercase tracking-wider backdrop-blur-sm">
        ❌ api hallucinated
      </span>
      <span className="absolute bottom-[40%] right-6 -rotate-2 rounded-full border border-amber-500/20 bg-background dark:bg-zinc-900 px-2.5 py-1 text-[8px] sm:text-[9px] text-amber-400 font-mono font-medium shadow-md uppercase tracking-wider backdrop-blur-sm">
        ⚠️ params outdated
      </span>
    </div>
  );
}

export function ProblemSection() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

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

  return (
    <section
      className="relative overflow-hidden bg-background py-20 sm:py-28"
      id="problem"
      ref={ref}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 dark:opacity-10 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, rgba(239, 68, 68, 0.04) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 mb-12 sm:mb-16">
          <div>
            <span className="font-mono text-muted-foreground/60 text-xs sm:text-sm tracking-wider uppercase block">
              THE PROBLEM
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              AI agents are only as good as{" "}
              <span className="text-rose-500 dark:text-rose-400">
                their context
              </span>
              .
            </h2>
          </div>
          <div className="flex flex-col justify-end lg:pb-2">
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
              Most documentation was written for humans. So agents guess,
              hallucinate, or stall — and developers spend hours fixing AI-
              generated mistakes.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-rose-500/80 dark:text-rose-400/80">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                AI Hallucinations
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                Missing Schemas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                Stale Examples
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <motion.div
            animate={isVisible ? { opacity: 1, scale: 1, y: 0 } : {}}
            className="w-full flex flex-col justify-center"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <ChaosVisual />
          </motion.div>

          <motion.ul
            animate={isVisible ? "visible" : "hidden"}
            className="space-y-4 flex flex-col justify-center"
            initial="hidden"
            transition={{ staggerChildren: 0.12, delayChildren: 0.15 }}
          >
            {PAIN_POINTS.map((pt) => {
              const Icon = pt.icon;
              return (
                <motion.li
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl transition-all duration-300 hover:border-rose-500/30 hover:bg-card/60 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)]"
                  key={pt.title}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <div
                    aria-hidden="true"
                    className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[40px] bg-gradient-to-br from-rose-500/10 to-transparent"
                  />

                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/40 border border-border/60 text-rose-500 dark:text-rose-400 transition-all duration-300 group-hover:bg-rose-500/10 group-hover:border-rose-500/20">
                    <Icon className="size-4" />
                  </span>
                  <div className="relative z-10 min-w-0">
                    <p className="font-display font-medium text-foreground text-base tracking-tight">
                      {pt.title}
                    </p>
                    <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
                      {pt.body}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>

        <motion.div
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          className="mx-auto mt-24 max-w-3xl text-center space-y-6"
          initial={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="flex justify-center">
            <div className="h-10 w-[1px] bg-gradient-to-b from-transparent to-border/80" />
          </div>

          <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-foreground leading-tight max-w-2xl mx-auto italic">
            &ldquo;What if your AI assistant actually knew every endpoint,
            version, and example?&rdquo;
          </h3>

          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            No more guessing, outdated stacks, or manual MCP setups. Just
            instant, perfect context served directly to your agent.
          </p>

          <div className="pt-4 flex justify-center">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              className="flex flex-col items-center gap-1.5 cursor-pointer"
              onClick={() => {
                const target = document.getElementById("how-it-works");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <span className="font-mono text-[9px] text-muted-foreground/60 tracking-[0.18em] uppercase">
                Discover the solution
              </span>
              <ArrowRight className="size-4 text-muted-foreground/80 rotate-90" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
