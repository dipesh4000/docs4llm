"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Code2,
  Database,
  FileText,
  Globe,
  Settings,
  Terminal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: "01",
    title: "Paste documentation URL",
    description:
      "Drop any docs URL — Stripe, LangChain, or your private portal. Simple entry, no local setup.",
    code: `https://docs.stripe.com
https://docs.langchain.com

# doc2mcp parsing triggered`,
    files: [
      { name: "stripe_docs.url", active: true, icon: "url" },
      { name: "langchain.url", active: false, icon: "url" },
      { name: "sources.txt", active: false, icon: "file" },
    ],
    fileType: "URLs",
  },
  {
    number: "02",
    title: "Automatic crawling",
    description:
      "Scrapes pages, articles, API endpoints, and github trees while preserving all code block blocks and structures.",
    code: `discovered: 1,284 pages
api_routes: 312
sdk_refs:   148
code_blocks: 2,406`,
    files: [
      { name: "crawler.log", active: true, icon: "terminal" },
      { name: "routes.json", active: false, icon: "json" },
      { name: "pages.db", active: false, icon: "database" },
    ],
    fileType: "Log",
  },
  {
    number: "03",
    title: "Knowledge structuring",
    description:
      "Transforms unstructured docs into clean semantic chunks and metadata indexes optimized for agent retrieval.",
    code: `chunks      → 4,182
schemas     → 312
embeddings  → 4,182 × 1536
retrieval   → AI Engine`,
    files: [
      { name: "chunks.db", active: true, icon: "database" },
      { name: "embeddings.bin", active: false, icon: "file" },
      { name: "schema.json", active: false, icon: "json" },
    ],
    fileType: "Database",
  },
  {
    number: "04",
    title: "MCP generation",
    description:
      "Publishes a secure, hosted Model Context Protocol server exposing customized query tools and schemas.",
    code: `tools:     23
workflows: 6
endpoint:  https://doc2mcp.site/api/mcp/<id>
auth:      bearer token`,
    files: [
      { name: "server.ts", active: true, icon: "ts" },
      { name: "tools.json", active: false, icon: "json" },
      { name: "auth.config", active: false, icon: "settings" },
    ],
    fileType: "TypeScript",
  },
  {
    number: "05",
    title: "Connect anywhere",
    description:
      "Add the generated endpoint credentials into Cursor, Claude Desktop, Windsurf, or VS Code settings.",
    code: `{
  "mcpServers": {
    "stripe": {
      "url": "https://doc2mcp.site/api/mcp/<id>/mcp",
      "headers": {
        "Authorization": "Bearer <token>"
      }
    }
  }
}`,
    files: [
      { name: "cursor.json", active: true, icon: "json" },
      { name: "claude.json", active: false, icon: "json" },
      { name: "vscode.json", active: false, icon: "json" },
    ],
    fileType: "JSON",
  },
];

function getFileIcon(iconType: string, isActive: boolean) {
  const className = cn(
    "size-3.5 shrink-0",
    isActive ? "text-[#4285f4] dark:text-[#8ab4f8]" : "text-muted-foreground/60"
  );
  switch (iconType) {
    case "url":
      return <Globe className={className} />;
    case "terminal":
      return <Terminal className={className} />;
    case "database":
      return <Database className={className} />;
    case "json":
    case "ts":
      return <Code2 className={className} />;
    case "settings":
      return <Settings className={className} />;
    default:
      return <FileText className={className} />;
  }
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      className="relative overflow-hidden bg-background py-20 sm:py-28"
      id="how-it-works"
      ref={sectionRef}
    >
      {/* Background Subtle Gradient */}
      <div
        className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full pointer-events-none opacity-15 dark:opacity-10 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(66, 133, 244, 0.1) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px] px-6">
        {/* Header Grid */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 mb-12 sm:mb-16 transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div>
            <span className="font-mono text-muted-foreground/60 text-xs sm:text-sm tracking-wider uppercase">
              HOW IT WORKS
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Documentation in.
              <br />
              AI context out.
            </h2>
          </div>
          <div className="flex flex-col justify-end lg:pb-2">
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-xl">
              Five steps to go from a public documentation URL to an
              auto-synced, hosted MCP server running in your workspace.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground/80">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#4285f4]" />
                Zero config
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-[#8ab4f8]" />
                Auto-syncing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Secure host
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Walkthrough Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 items-center">
          {/* Step Selector List */}
          <div className="relative space-y-4">
            {/* Timeline Background Track Line */}
            <div className="absolute left-[38px] top-[34px] bottom-[34px] w-[2px] bg-border/20 dark:bg-border/10 hidden sm:block" />

            {/* Timeline Active Progress Line */}
            <div className="absolute left-[38px] top-[34px] bottom-[34px] w-[2px] bg-transparent hidden sm:block">
              <motion.div
                animate={{
                  height: `${(activeStep / (steps.length - 1)) * 100}%`,
                }}
                className="w-full bg-gradient-to-b from-[#4285f4] to-[#8ab4f8] relative"
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
              >
                {/* Glowing tip */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#8ab4f8] shadow-[0_0_8px_#8ab4f8] opacity-80" />
              </motion.div>
            </div>

            {steps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <button
                  className={cn(
                    "w-full rounded-2xl py-4 px-5 text-left transition-all duration-300 flex items-center gap-4 border relative group",
                    isActive
                      ? "border-border/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
                      : "bg-transparent border-transparent hover:bg-card/30 hover:border-border/20"
                  )}
                  key={step.number}
                  onClick={() => setActiveStep(index)}
                  type="button"
                >
                  {/* Glowing active step background pill */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-card -z-10 rounded-2xl border border-border/10"
                      layoutId="activeStepBackground"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Step Number Circle */}
                  <div className="relative z-10 shrink-0">
                    <span
                      className={cn(
                        "font-mono text-xs shrink-0 flex items-center justify-center size-9 rounded-full font-semibold transition-all duration-300 border",
                        isActive
                          ? "bg-[#4285f4] dark:bg-[#8ab4f8] border-[#4285f4] dark:border-[#8ab4f8] text-white dark:text-[#131314] shadow-[0_0_12px_rgba(66,133,244,0.3)] dark:shadow-[0_0_12px_rgba(138,180,248,0.25)]"
                          : "bg-background dark:bg-background border-border/60 text-muted-foreground group-hover:border-border group-hover:text-foreground"
                      )}
                    >
                      {step.number}
                    </span>
                  </div>

                  {/* Step Title */}
                  <div className="relative z-10">
                    <h3
                      className={cn(
                        "font-display font-medium text-base sm:text-lg tracking-tight transition-colors duration-300",
                        isActive
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground/70 group-hover:text-foreground"
                      )}
                    >
                      {step.title}
                    </h3>
                  </div>

                  {/* Right side arrow indicator */}
                  <div
                    className={cn(
                      "ml-auto relative z-10 transition-all duration-300",
                      isActive
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    )}
                  >
                    <ArrowRight
                      className={cn(
                        "size-4",
                        isActive
                          ? "text-[#4285f4] dark:text-[#8ab4f8]"
                          : "text-muted-foreground"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step Preview & Content Box */}
          <div className="flex flex-col lg:sticky lg:top-28 lg:self-center">
            {/* Active Step Description Card */}
            <div className="mb-6 min-h-[90px] sm:min-h-[75px] flex flex-col justify-end">
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5"
                  exit={{ opacity: 0, y: -12 }}
                  initial={{ opacity: 0, y: 12 }}
                  key={activeStep}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <div className="inline-flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#4285f4] dark:text-[#8ab4f8] uppercase tracking-[0.15em] font-semibold">
                      Step {steps[activeStep].number}
                    </span>
                    <span className="size-1 rounded-full bg-border" />
                    <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                      Description
                    </span>
                  </div>
                  <p className="text-foreground/80 dark:text-foreground/90 text-sm sm:text-base leading-relaxed font-normal">
                    {steps[activeStep].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Step Graphic Representation */}
            <div
              className={cn(
                "transition-all duration-500",
                isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="relative overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                  exit={{ opacity: 0, y: -8, scale: 0.99 }}
                  initial={{ opacity: 0, y: 8, scale: 0.99 }}
                  key={activeStep}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {/* Chrome headers */}
                  <div className="flex items-center justify-between border-border/40 border-b px-4 py-2.5 bg-secondary/35">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-[#ef4444] opacity-80" />
                      <span className="size-2 rounded-full bg-[#f59e0b] opacity-80" />
                      <span className="size-2 rounded-full bg-[#10b981] opacity-80" />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      doc2mcp-ide
                    </span>
                    <span className="w-10" />
                  </div>

                  {/* IDE Body */}
                  <div className="flex h-[200px] bg-card overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-[150px] shrink-0 border-r border-border/40 bg-secondary/15 p-3 flex flex-col gap-2">
                      <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider mb-1">
                        workspace
                      </div>
                      <div className="space-y-1">
                        {steps[activeStep].files.map((file) => (
                          <div
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-mono transition-colors",
                              file.active
                                ? "bg-secondary/40 text-foreground font-medium"
                                : "text-muted-foreground/70 hover:text-foreground hover:bg-secondary/20"
                            )}
                            key={file.name}
                          >
                            {getFileIcon(file.icon, file.active)}
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main Code Area */}
                    <div className="flex-1 overflow-auto bg-card/40 p-4 font-mono text-[11px] sm:text-xs leading-relaxed select-all">
                      <pre className="text-foreground/80 whitespace-pre-wrap">
                        {steps[activeStep].code}
                      </pre>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="flex items-center justify-between border-t border-border/40 px-4 py-1.5 bg-secondary/35 text-[10px] font-mono text-muted-foreground/60">
                    <div className="flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-[#10b981] animate-pulse" />
                      <span>Ready</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span>LF</span>
                      <span>UTF-8</span>
                      <span>{steps[activeStep].fileType}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Clients Row */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-muted-foreground mr-1">
                  Integrates with:
                </span>
                {["Cursor", "Claude", "VS Code", "Windsurf", "AI SDK"].map(
                  (t) => (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[9px] text-muted-foreground uppercase tracking-wider"
                      key={t}
                    >
                      <span className="size-1.5 rounded-full bg-[#4285f4]" />
                      {t}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
