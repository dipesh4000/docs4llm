"use client";

import { motion } from "framer-motion";
import type { CompressedTool } from "@/types/platform";

export function ToolCard({
  tool,
  index,
}: {
  tool: CompressedTool;
  index: number;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/40"
      initial={{ opacity: 0, y: 8 }}
      transition={{ delay: index * 0.04 }}
    >
      <p className="font-mono text-foreground font-medium text-sm">
        {tool.name}
        <span className="text-muted-foreground">()</span>
      </p>
      <p className="mt-2 text-muted-foreground text-xs leading-relaxed">
        {tool.description}
      </p>
      {tool.endpoints.length > 0 && (
        <p className="mt-3 font-mono text-[10px] text-muted-foreground/60">
          {tool.endpoints.join(" · ")}
        </p>
      )}
    </motion.div>
  );
}
