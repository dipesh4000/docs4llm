"use client";

import { Boxes } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders the real brand icon of an MCP's source documentation site by
 * resolving its favicon (e.g. a Composio docs MCP shows the Composio icon).
 * Falls back to a neutral glyph when the host is unknown or the favicon
 * fails to load.
 */
export function SourceIcon({
  host,
  size = 40,
  className,
}: {
  host: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showFavicon = host !== null && host.length > 0 && !failed;
  const glyph = Math.round(size * 0.55);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-background",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showFavicon ? (
        // biome-ignore lint/performance/noImgElement: remote favicon with a client-side onError fallback; next/image adds no value for a 64px brand icon
        // biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is an asset-load fallback, not a user interaction
        <img
          alt=""
          className="rounded"
          height={glyph}
          loading="lazy"
          onError={() => setFailed(true)}
          src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`}
          width={glyph}
        />
      ) : (
        <Boxes className="text-violet-500" size={glyph} />
      )}
    </span>
  );
}
