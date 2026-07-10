import Image from "next/image";
import { cn } from "@/lib/utils";

export function Doc2McpMark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      alt="doc2mcp"
      className={cn("shrink-0 select-none", className)}
      draggable={false}
      height={size}
      priority
      src="/brand/doc2mcp-mark.png"
      width={size}
    />
  );
}

export function Doc2McpWordmark({ className }: { className?: string }) {
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

export function Doc2McpLogo({
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
      <Doc2McpMark className="logo-glow" size={size} />
      {showWordmark ? <Doc2McpWordmark /> : null}
    </div>
  );
}
