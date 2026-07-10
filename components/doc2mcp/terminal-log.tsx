"use client";

import { motion } from "framer-motion";

export function TerminalLog({
  lines,
  streaming = false,
}: {
  lines: string[];
  streaming?: boolean;
}) {
  return (
    <div className="font-mono text-[11px] text-emerald-400/90">
      {lines.map((line, i) => (
        <motion.div
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          key={`${line}-${String(i)}`}
          transition={{ delay: i * 0.05 }}
        >
          {line}
          {streaming && i === lines.length - 1 && (
            <span className="terminal-cursor ml-0.5 inline-block h-3 w-1.5 bg-emerald-400/80 align-middle" />
          )}
        </motion.div>
      ))}
    </div>
  );
}
