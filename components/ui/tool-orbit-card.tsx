"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { MCP_TOOL_ICONS } from "@/lib/config/mcp-tool-icons";
import { cn } from "@/lib/utils";

const ORBIT_TOOLS = [
  {
    ...MCP_TOOL_ICONS[0],
    containerClass: "h-8 w-8",
    iconClass: "h-4 w-4",
    bounceDelay: 0,
  },
  {
    ...MCP_TOOL_ICONS[1],
    containerClass: "h-12 w-12",
    iconClass: "h-6 w-6",
    bounceDelay: 0.8,
  },
  {
    ...MCP_TOOL_ICONS[2],
    containerClass: "h-16 w-16",
    iconClass: "h-8 w-8",
    bounceDelay: 1.6,
  },
  {
    ...MCP_TOOL_ICONS[3],
    containerClass: "h-12 w-12",
    iconClass: "h-6 w-6",
    bounceDelay: 2.4,
  },
  {
    ...MCP_TOOL_ICONS[4],
    containerClass: "h-8 w-8",
    iconClass: "h-4 w-4",
    bounceDelay: 3.2,
  },
] as const;

function subscribeToMounted() {
  return () => {};
}

function getMountedSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

function ToolIcon({
  className,
  src,
}: {
  className?: string;
  src: string;
}) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={cn("object-contain dark:brightness-110", className)}
      height={32}
      src={src}
      width={32}
    />
  );
}

function OrbitContainer({
  bounceDelay,
  children,
  className,
  reduceMotion,
}: {
  bounceDelay: number;
  children: React.ReactNode;
  className?: string;
  reduceMotion: boolean | null;
}) {
  return (
    <motion.div
      animate={
        reduceMotion
          ? undefined
          : {
              scale: [1, 1.08, 1],
              y: [0, -4, 0],
            }
      }
      className={cn(
        "flex items-center justify-center rounded-full border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className
      )}
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 0.8,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1,
              delay: bounceDelay,
              ease: "easeInOut",
            }
      }
    >
      {children}
    </motion.div>
  );
}

function ToolOrbitSkeleton() {
  const reduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribeToMounted,
    getMountedSnapshot,
    getMountedServerSnapshot
  );

  if (!mounted) {
    return (
      <div className="relative flex h-full items-center justify-center overflow-hidden p-8">
        <div className="flex shrink-0 flex-row items-center justify-center gap-2 opacity-70">
          {ORBIT_TOOLS.map((tool) => (
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-neutral-800/60",
                tool.containerClass
              )}
              key={tool.name}
            >
              <ToolIcon className={tool.iconClass} src={tool.src} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden p-8">
      <div className="flex shrink-0 flex-row items-center justify-center gap-2">
        {ORBIT_TOOLS.map((tool) => (
          <OrbitContainer
            bounceDelay={tool.bounceDelay}
            className={tool.containerClass}
            key={tool.name}
            reduceMotion={reduceMotion}
          >
            <ToolIcon className={tool.iconClass} src={tool.src} />
          </OrbitContainer>
        ))}
      </div>
    </div>
  );
}

export function ToolOrbitShowcase({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative h-[15rem] overflow-hidden rounded-xl bg-neutral-900/40 [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)] md:h-[20rem]",
        className
      )}
    >
      <ToolOrbitSkeleton />
    </div>
  );
}
