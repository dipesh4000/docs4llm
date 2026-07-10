"use client";

import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { Streamdown } from "streamdown";

const docPlugins = { cjk, code, math };

/**
 * Render markdown images with a plain, reliable image element.
 *
 * Streamdown's default image component hides images behind a `naturalWidth`/
 * `onError` heuristic that misfires for inline SVG diagrams (it renders an
 * "Image not available" fallback even when the asset loads fine). The docs
 * only reference trusted local diagram assets under `/diagrams`, so we render
 * them directly and skip that heuristic entirely.
 */
const docComponents = {
  img: ({ src, alt }: { src?: unknown; alt?: string }) => {
    if (typeof src !== "string" || src.length === 0) {
      return null;
    }
    return (
      <span className="my-6 block overflow-x-auto rounded-xl border border-border/60 bg-card/40 p-3">
        {/* biome-ignore lint/performance/noImgElement: docs diagrams are static local SVGs of varying intrinsic size; next/image needs fixed dimensions */}
        <img
          alt={alt ?? ""}
          className="mx-auto block h-auto w-full max-w-[1024px] rounded-lg"
          loading="lazy"
          src={src}
        />
      </span>
    );
  },
};

export function DocContent({ content }: { content: string }) {
  return (
    <article
      className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/85 prose-li:text-foreground/85 prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:rounded-md prose-code:border prose-code:border-border/60 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-medium prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-border/60 prose-pre:bg-muted prose-pre:text-foreground dark:prose-pre:bg-black/40 prose-blockquote:border-l-primary/60 prose-blockquote:text-foreground/80 prose-hr:border-border/60 prose-th:text-foreground prose-td:text-foreground/85"
      id="doc-article"
    >
      <Streamdown components={docComponents} plugins={docPlugins}>
        {content}
      </Streamdown>
    </article>
  );
}
