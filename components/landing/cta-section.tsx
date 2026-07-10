"use client";

import { ArrowRight, Calendar, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const FOOTNOTES = [
  { icon: CheckCircle2, label: "Free forever tier" },
  { icon: Clock, label: "< 60s to first MCP" },
  { icon: CheckCircle2, label: "AI under the hood" },
];

export function CtaSection() {
  return (
    <section className="relative border-border/40 border-t py-20 sm:py-28">
      {/* Background Glow */}
      <div
        aria-hidden="true"
        className="-top-32 -translate-x-1/2 pointer-events-none absolute left-1/2 size-[640px] rounded-full bg-[#4285f4]/5 dark:bg-[#8ab4f8]/5 blur-[140px]"
      />

      <div className="relative mx-auto flex max-w-[820px] flex-col items-center px-4 text-center sm:px-6 lg:px-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/40 px-3.5 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider backdrop-blur-sm">
          Ship in minutes
        </span>
        <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Make your documentation{" "}
          <span className="text-[#4285f4] dark:text-[#8ab4f8]">AI-native.</span>
        </h2>
        <p className="mt-5 max-w-xl text-muted-foreground leading-relaxed text-sm sm:text-base">
          Stop building MCP servers manually. Generate AI-ready infrastructure
          directly from documentation — and let every agent your team uses speak
          the same language.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button
            asChild
            className="group h-12 w-full gap-2 rounded-full bg-[#4285f4] dark:bg-[#8ab4f8] text-white dark:text-[#131314] hover:opacity-90 border-0 sm:w-auto font-medium"
            size="lg"
          >
            <Link href="/chat">
              Generate MCP
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            className="h-12 w-full rounded-full sm:w-auto border-border/60 hover:bg-secondary/40"
            size="lg"
            variant="outline"
          >
            <a
              href="https://calendly.com/doc2mcp/30min"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Calendar aria-hidden="true" className="mr-2 size-4" />
              Book demo
            </a>
          </Button>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase text-muted-foreground/60 tracking-wider">
          {FOOTNOTES.map((note) => {
            const Icon = note.icon;
            return (
              <span className="flex items-center gap-1.5" key={note.label}>
                <Icon className="size-3.5 text-[#4285f4] dark:text-[#8ab4f8]" />
                {note.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
