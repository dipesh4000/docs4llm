import { cn } from "@/lib/utils";

/**
 * Generic skeleton primitives used by route-level `loading.tsx` files to
 * render instant chrome while server work is in flight. Renders pure HTML
 * so it ships in the prerendered shell with zero JS.
 */

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-lg bg-muted/40",
        "min-h-[1.25rem]",
        className
      )}
    />
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => i).map((i) => (
        <div
          aria-hidden="true"
          className="space-y-3 rounded-xl border border-border/40 bg-card/40 p-5"
          key={i}
        >
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="h-8 w-20" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-card/40">
      <div className="border-border/40 border-b bg-muted/20 p-3">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, i) => i).map((i) => (
            <SkeletonBlock className="h-3" key={i} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }, (_, i) => i).map((row) => (
          <div className="p-3" key={row}>
            <div
              className="grid gap-3"
              style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: columns }, (_, i) => i).map((col) => (
                <SkeletonBlock className="h-4" key={col} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonHeader({ subtitle = true }: { subtitle?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-8 w-56" />
        {subtitle ? <SkeletonBlock className="h-3 w-72" /> : null}
      </div>
      <SkeletonBlock className="h-9 w-32" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <SkeletonStatCards />
      <SkeletonTable columns={4} rows={6} />
    </div>
  );
}
