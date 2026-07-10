"use client";

import { Check, GitBranch, RefreshCcw, Sparkles, Webhook } from "lucide-react";
import { useEffect, useState } from "react";

const TIMELINE = [
  {
    time: "08:14",
    label: "Vendor publishes v2.1 docs",
    delta: "+3 endpoints",
    icon: GitBranch,
  },
  {
    time: "08:14",
    label: "doc2mcp detects the change",
    delta: "Content hash diff",
    icon: Webhook,
  },
  {
    time: "08:15",
    label: "Re-crawl + regenerate MCP",
    delta: "Toolkit refreshed",
    icon: RefreshCcw,
  },
  {
    time: "08:15",
    label: "Cursor + Claude get the new tools",
    delta: "Zero-downtime",
    icon: Sparkles,
  },
];

export function AutoSyncSection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep((s) => (s + 1) % TIMELINE.length);
    }, 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative overflow-hidden border-border/40 border-y bg-gradient-to-b from-background via-background to-muted/20 py-24 sm:py-32">
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 sm:gap-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] text-amber-700 uppercase tracking-[0.16em] dark:text-amber-300">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
              Coming soon
            </span>
            <h2 className="mt-5 font-display font-semibold text-3xl text-foreground tracking-tight sm:text-5xl">
              Docs change.
              <br />
              <span className="text-muted-foreground">Your MCP follows.</span>
            </h2>
            <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed">
              Coming soon: turn on auto-sync once per project and doc2mcp will
              watch the source URL, detect content changes, and silently
              regenerate the MCP server — no redeploy, no token rotation, no
              copy-paste. Join the waitlist below to be early.
            </p>
            <ul className="mt-7 space-y-3 text-sm">
              {[
                "Content-hash diffing — only re-crawls when something actually changed",
                "Toolkit-level diffs — added, removed, and renamed tools surfaced in your dashboard",
                "Webhook + cron — nightly poll, plus instant push from supported docs platforms",
                "Roll back to any prior MCP snapshot in one click",
              ].map((item) => (
                <li className="flex items-start gap-2.5" key={item}>
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                  <span className="text-foreground/85">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 font-medium text-amber-700 text-xs transition-colors hover:bg-amber-500/15 dark:text-amber-200"
                href="https://calendly.com/doc2mcp/30min"
                rel="noopener noreferrer"
                target="_blank"
              >
                Join the waitlist →
              </a>
              <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                Ships with Pro · Manual refresh on Free
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="-inset-6 pointer-events-none absolute -z-10 rounded-3xl bg-gradient-to-br from-amber-500/8 via-transparent to-violet-500/8 blur-3xl" />
            <span className="-top-3 -translate-x-1/2 absolute left-1/2 z-10 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 font-mono text-[10px] text-amber-700 uppercase tracking-[0.16em] backdrop-blur dark:text-amber-200">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
              Preview · coming soon
            </span>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between border-border/40 border-b px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-rose-400/70" />
                  <span className="size-2.5 rounded-full bg-amber-400/70" />
                  <span className="size-2.5 rounded-full bg-emerald-400/70" />
                </div>
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                  Sync timeline · today
                </p>
              </div>
              <ol className="divide-y divide-border/40">
                {TIMELINE.map((step, i) => {
                  const Icon = step.icon;
                  const isActive = i === activeStep;
                  const isPast = i < activeStep;
                  return (
                    <li
                      className={`flex items-center gap-4 px-5 py-4 transition-colors duration-500 ${
                        isActive
                          ? "bg-emerald-500/5"
                          : isPast
                            ? "opacity-70"
                            : "opacity-60"
                      }`}
                      key={step.label}
                    >
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {step.time}
                      </span>
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-500 ${
                          isActive
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "border-border/60 bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm transition-colors duration-500 ${
                            isActive
                              ? "font-medium text-foreground"
                              : "text-foreground/80"
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {step.delta}
                        </p>
                      </div>
                      {isActive ? (
                        <span className="flex size-2 shrink-0 rounded-full bg-emerald-500">
                          <span className="absolute size-2 animate-ping rounded-full bg-emerald-500/60" />
                        </span>
                      ) : isPast ? (
                        <Check
                          className="size-3.5 shrink-0 text-emerald-500/70"
                          strokeWidth={3}
                        />
                      ) : (
                        <span className="size-2 shrink-0 rounded-full bg-muted" />
                      )}
                    </li>
                  );
                })}
              </ol>
              <div className="flex items-center justify-between border-border/40 border-t bg-muted/20 px-5 py-3">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
                  Average sync · 38s
                </p>
                <p className="font-medium text-emerald-600 text-xs dark:text-emerald-400">
                  All clients up to date
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
