import {
  BadgeCheck,
  CalendarDays,
  Crown,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Deterministic gradient seed from email so the avatar is consistent.
 */
const PALETTES = [
  "from-violet-500 to-fuchsia-500",
  "from-sky-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-purple-500",
] as const;

function gradientFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length] ?? PALETTES[0];
}

function initialsFor(email: string, name?: string | null): string {
  const fallback = email.charAt(0).toUpperCase() || "?";
  if (name) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
    const combined = `${first}${second}`.toUpperCase();
    return combined || fallback;
  }
  return fallback;
}

export function ProfileHero({
  email,
  name,
  memberSince,
  conversionsUsed,
  toolsGenerated,
}: {
  email: string;
  name?: string | null;
  memberSince: Date;
  conversionsUsed: number;
  toolsGenerated: number;
}) {
  const gradient = gradientFor(email);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-8">
      <div
        aria-hidden="true"
        className={cn(
          "-top-32 -right-32 pointer-events-none absolute size-72 rounded-full bg-gradient-to-br opacity-[0.06] blur-3xl dark:opacity-10",
          gradient
        )}
      />

      <div className="relative grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display font-semibold text-2xl text-white shadow-lg",
              gradient
            )}
          >
            {initialsFor(email, name)}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
              Profile
            </p>
            <h1 className="mt-0.5 truncate font-display font-bold text-2xl tracking-tight sm:text-3xl">
              {name ?? email.split("@")[0]}
            </h1>
            <p className="mt-1 flex items-center gap-2 truncate text-muted-foreground text-sm">
              <span className="truncate font-mono">{email}</span>
              <BadgeCheck
                aria-label="Verified email"
                className="size-3.5 shrink-0 text-violet-700 dark:text-violet-300"
              />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          <Stat
            icon={Crown}
            label="Plan"
            value={
              <Badge
                className="w-fit px-2 py-0.5 text-xs bg-muted text-muted-foreground"
                variant="outline"
              >
                Free
              </Badge>
            }
          />
          <Stat
            icon={ShieldCheck}
            label="Status"
            value={
              <Badge
                className="px-2 py-0.5 text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                variant="outline"
              >
                Active
              </Badge>
            }
          />
          <Stat
            icon={CalendarDays}
            label="Member since"
            value={
              <span className="font-medium text-sm">
                {memberSince.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            }
          />
        </div>
      </div>

      <div className="relative mt-6 grid gap-4 border-border/40 border-t pt-6 sm:grid-cols-3">
        <UsageMeter used={conversionsUsed} />
        <MetricChip
          label="Pages / site"
          sub="Crawl cap per project"
          value="Unlimited"
        />
        <MetricChip
          label="Tools generated"
          sub="All-time MCP tools"
          value={String(toolsGenerated)}
        />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: typeof Crown;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Icon className="size-3.5" />
        <span className="font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5">{value}</div>
    </div>
  );
}

function UsageMeter({ used }: { used: number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3 sm:col-span-1">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
          Conversions
        </p>
        <p className="font-semibold text-sm">{used}</p>
      </div>
      <p className="mt-2 text-muted-foreground text-xs">
        No monthly cap on this plan.
      </p>
    </div>
  );
}

function MetricChip({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/40 p-3">
      <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-1 font-display font-semibold text-xl">{value}</p>
      <p className="mt-0.5 text-muted-foreground text-xs">{sub}</p>
    </div>
  );
}
