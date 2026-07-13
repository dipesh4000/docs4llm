import Image from "next/image";
import { cn } from "@/lib/utils";

export function Docs4LlmMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      alt="docs4llm"
      className={cn("shrink-0 select-none", className)}
      draggable={false}
      height={size}
      priority
      src="/brand/docs4llm-mark.png"
      width={size}
    />
  );
}

export function Docs4LlmWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display font-semibold text-xl tracking-tight",
        className
      )}
    >
      <span className="text-foreground">doc</span>
      <span className="text-[#4285f4] dark:text-[#8ab4f8]">2</span>
      <span className="text-foreground">mcp</span>
    </span>
  );
}

export function Docs4LlmLogo({
  size = 36,
  className,
  showWordmark = true,
}: {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Docs4LlmMark className="logo-glow" size={size} />
      {showWordmark ? <Docs4LlmWordmark /> : null}
    </div>
  );
}
