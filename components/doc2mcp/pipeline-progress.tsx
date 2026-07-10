"use client";

import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  crawl: "Crawling docs",
  auth: "Detecting auth",
  extract: "Extracting APIs",
  workflows: "Understanding workflows",
  compress: "Compressing endpoints",
  mcp: "Generating MCP",
  config: "Exporting Cursor config",
};

export function PipelineProgress({
  steps,
  currentStep,
  status,
}: {
  steps: readonly string[];
  currentStep: number;
  status: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {steps.map((step, i) => {
        const done = currentStep > i || status === "ready";
        const active =
          currentStep === i && status !== "ready" && status !== "error";
        const failed = status === "error" && currentStep === i;

        return (
          <motion.div
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] transition-colors",
              done &&
                "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              active &&
                "border-primary/20 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary",
              !done &&
                !active &&
                !failed &&
                "border-border bg-muted/20 text-muted-foreground",
              failed &&
                "border-destructive/20 bg-destructive/5 text-destructive"
            )}
            key={step}
            layout
          >
            {done ? (
              <Check className="size-3" />
            ) : active ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <span className="size-3 rounded-full border border-current opacity-40" />
            )}
            {LABELS[step] ?? step}
          </motion.div>
        );
      })}
    </div>
  );
}
