import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function DocCta() {
  return (
    <section className="mt-10 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-mono text-[11px] text-primary uppercase tracking-wider">
            <Sparkles className="size-3" />
            Try it now
          </p>
          <h2 className="mt-2 font-display font-semibold text-xl tracking-tight">
            Turn your docs into a live MCP
          </h2>
          <p className="mt-1 max-w-lg text-muted-foreground text-sm">
            Paste a documentation URL in the app — most conversions finish in
            under a minute.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            className="group inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
            href="https://doc2mcp.site"
          >
            Open app
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            className="inline-flex h-10 items-center rounded-full border border-border px-5 font-medium text-sm transition-colors hover:bg-accent"
            href="/docs/quickstart"
          >
            Quick start
          </Link>
        </div>
      </div>
    </section>
  );
}
