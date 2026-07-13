"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function DocFeedback({ pageHref }: { pageHref: string }) {
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  return (
    <section className="mt-10 rounded-xl border border-border/60 bg-card/30 px-5 py-4">
      <p className="font-medium text-sm">Was this page helpful?</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          aria-pressed={vote === "up"}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-sm transition-colors hover:bg-accent aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
          onClick={() => setVote("up")}
          type="button"
        >
          <ThumbsUp className="size-3.5" />
          Yes
        </button>
        <button
          aria-pressed={vote === "down"}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-sm transition-colors hover:bg-accent aria-pressed:border-primary/40 aria-pressed:bg-primary/10"
          onClick={() => setVote("down")}
          type="button"
        >
          <ThumbsDown className="size-3.5" />
          No
        </button>
        {vote ? (
          <span className="text-muted-foreground text-xs">
            Thanks — we use this to improve the docs.
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-muted-foreground text-xs">
        Spotted an issue?{" "}
        <Link
          className="text-primary underline-offset-2 hover:underline"
          href={`mailto:docs4llm@gmail.com?subject=Docs%20feedback&body=Page%3A%20${encodeURIComponent(pageHref)}`}
        >
          Email us feedback
        </Link>
        .
      </p>
    </section>
  );
}
