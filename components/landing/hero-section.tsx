"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";

const words = [
  "AI Tools",
  "Cursor Context",
  "Claude Servers",
  "Knowledge bases",
];

const EXAMPLES = [
  "https://docs.stripe.com",
  "https://github.com/langchain-ai/langchain",
  "https://mintlify.com/docs",
];

const STATS = [
  { value: "<60s", label: "docs → MCP", tag: "PIPELINE" },
  { value: "1 URL", label: "paste & go", tag: "INPUT" },
  { value: "Hosted", label: "no install", tag: "REMOTE" },
  { value: "5+", label: "MCP clients", tag: "EXPORTS" },
];

export function HeroSection() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      return;
    }

    router.push(`/chat?url=${encodeURIComponent(urlInput.trim())}`);
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pb-24 pt-28 sm:pb-32 sm:pt-32">
      <div className="noise-texture pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="auth-orb-glow pointer-events-none top-1/3 left-1/2 -translate-x-1/2"
      />

      <div className="relative z-10 mx-auto flex w-[90vw] max-w-4xl flex-col items-center justify-center px-4 text-center sm:w-5/6 2xl:w-4/6">
        <motion.div
          animate={mounted ? { opacity: 1, scale: 1 } : false}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-md"
          initial={false}
          transition={{ duration: 0.5 }}
        >
          Any URL to Model Context Protocol
        </motion.div>

        <h1 className="font-display text-[clamp(2.25rem,6.5vw,4.5rem)] font-thin leading-[1.02] tracking-tight">
          <span className="block text-foreground">Turn Any Documentation</span>
          <div className="relative mt-3 flex flex-col items-center justify-center gap-2 sm:flex-row">
            <LayoutTextFlip duration={3000} text="Into " words={words} />
          </div>
        </h1>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground font-light sm:text-lg">
          Paste a docs URL—Mintlify, Docusaurus, GitHub, OpenAPI—and get a
          hosted, Cursor-ready MCP server in seconds. No setup, no local
          scripts.
        </p>

        <motion.form
          animate={mounted ? { y: 0, opacity: 1 } : false}
          className="mt-10 flex w-full max-w-[620px] animate-fade-in items-center rounded-full border border-border/80 bg-card/50 p-1.5 transition-all duration-300 focus-within:border-[#4285f4] focus-within:shadow-[0_0_24px_rgba(66,133,244,0.15)] focus-within:ring-2 focus-within:ring-[#4285f4]/20 hover:border-[#4285f4] hover:bg-card/75 dark:focus-within:border-[#8ab4f8] dark:focus-within:shadow-[0_0_24px_rgba(138,180,248,0.12)] dark:hover:border-[#8ab4f8]"
          data-tour="hero-url"
          initial={false}
          onSubmit={handleSubmit}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <input
            className="flex-1 bg-transparent px-5 py-3 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste documentation URL (e.g. docs.stripe.com)..."
            type="text"
            value={urlInput}
          />
          <button
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#4285f4] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] dark:bg-[#8ab4f8] dark:text-[#131314]"
            type="submit"
          >
            Generate
            <ArrowRight className="size-3.5" />
          </button>
        </motion.form>

        <motion.div
          animate={mounted ? { opacity: 1 } : false}
          className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground"
          initial={false}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          <span>Try an example:</span>
          {EXAMPLES.map((ex) => (
            <button
              className="rounded-full border border-border/50 bg-card/20 px-3 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-card/50 hover:text-foreground"
              key={ex}
              onClick={() => setUrlInput(ex)}
              type="button"
            >
              {ex.replace("https://", "")}
            </button>
          ))}
        </motion.div>

        <motion.div
          animate={mounted ? { opacity: 1, y: 0 } : false}
          className="mt-14 grid w-full max-w-[760px] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
          initial={false}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {STATS.map((stat) => (
            <div
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/30 px-4 py-4 text-left backdrop-blur-md transition-colors hover:border-[#4285f4]/50 dark:hover:border-[#8ab4f8]/50"
              key={stat.tag}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4285f4]/50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:via-[#8ab4f8]/50" />
              <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                {stat.tag}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
