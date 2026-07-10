"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const LayoutTextFlip = ({
  text = "Build Amazing",
  words = ["Landing Pages", "Component Blocks", "Page Sections", "3D Shaders"],
  duration = 3000,
}: {
  text: string;
  words: string[];
  duration?: number;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, duration);

    return () => clearInterval(interval);
  }, [duration, words]);

  if (!mounted) {
    return (
      <div className="inline-flex flex-row items-center justify-center flex-wrap gap-2 text-inherit font-semibold tracking-tight">
        <span className="text-inherit font-semibold font-display text-foreground">
          {text}
        </span>
        <span className="relative w-fit overflow-hidden px-1 font-display text-[0.92em] font-semibold text-[#4285f4] dark:text-[#8ab4f8]">
          {words[0]}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-row items-center justify-center flex-wrap gap-2 text-inherit font-semibold tracking-tight">
      <motion.span
        layoutId="subtext"
        className="text-inherit font-semibold font-display text-foreground"
      >
        {text}
      </motion.span>

      <motion.span
        layout
        className="relative w-fit overflow-hidden px-1 font-display text-[0.92em] font-semibold"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={currentIndex}
            initial={{ y: -24, filter: "blur(4px)", opacity: 0 }}
            animate={{
              y: 0,
              filter: "blur(0px)",
              opacity: 1,
            }}
            exit={{ y: 24, filter: "blur(4px)", opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={cn("inline-block whitespace-nowrap text-[#4285f4] dark:text-[#8ab4f8]")}
          >
            {words[currentIndex]}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </div>
  );
};
