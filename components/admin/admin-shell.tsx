"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/mcps", label: "MCPs" },
  { href: "/admin/mcp-usage", label: "MCP usage" },
  { href: "/admin/domains", label: "Domains" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/observability", label: "Observability" },
] as const;

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl tracking-tight">
              Admin dashboard
            </h1>
            <p className="mt-1 font-mono text-muted-foreground text-xs">
              {userEmail}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1">
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  className={cn(
                    "rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                    active
                      ? "bg-violet-500/15 text-violet-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </div>
  );
}
