"use client";

import { motion } from "framer-motion";
import { ArrowRight, Blocks, FileText } from "lucide-react";

export function DocsToMcpAnimation() {
  return (
    <div className="glass-card mx-auto max-w-3xl rounded-2xl p-8">
      <div className="flex items-center justify-center gap-4 md:gap-8">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-5"
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <FileText className="size-8 text-cyan-400" />
          <span className="font-mono text-xs">docs</span>
        </motion.div>

        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          <ArrowRight className="size-6 text-violet-400" />
        </motion.div>

        <motion.div
          animate={{
            boxShadow: [
              "0 0 0px oklch(0.55 0.2 280 / 0%)",
              "0 0 32px oklch(0.55 0.2 280 / 40%)",
              "0 0 0px oklch(0.55 0.2 280 / 0%)",
            ],
          }}
          className="flex flex-col items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/15 px-6 py-5"
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <Blocks className="size-8 text-violet-400" />
          <span className="font-mono text-xs">mcp</span>
        </motion.div>
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        className="mt-6 text-center font-mono text-muted-foreground text-xs"
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        crawling → understanding → compressing tools → generating server
      </motion.p>
    </div>
  );
}
