import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { DocNavItem } from "@/lib/docs/loader";

export function DocPager({
  prev,
  next,
}: {
  prev: DocNavItem | null;
  next: DocNavItem | null;
}) {
  if (!(prev || next)) {
    return null;
  }

  return (
    <nav className="mt-12 grid gap-3 border-border/60 border-t pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          className="group flex flex-col rounded-xl border border-border/60 px-4 py-3 transition-colors hover:border-border hover:bg-accent/40"
          href={prev.href}
        >
          <span className="flex items-center gap-1 text-muted-foreground text-xs">
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            Previous
          </span>
          <span className="mt-1 font-medium text-sm">{prev.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          className="group flex flex-col rounded-xl border border-border/60 px-4 py-3 text-right transition-colors hover:border-border hover:bg-accent/40"
          href={next.href}
        >
          <span className="flex items-center justify-end gap-1 text-muted-foreground text-xs">
            Next
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1 font-medium text-sm">{next.title}</span>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
