"use client";

import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  FolderGit2,
  LayoutDashboard,
  LogOut,
  Plus,
  Server,
  Settings,
  UserCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Docs4LlmLogo } from "@/components/docs4llm/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  matchExact?: boolean;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    matchExact: true,
  },
  { href: "/dashboard/projects", label: "Projects", icon: FolderGit2 },
  { href: "/dashboard/mcp", label: "MCP usage", icon: Server },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  userEmail,
  planLabel,
  children,
}: {
  userEmail: string;
  planLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(
        () => undefined
      );
    } finally {
      router.replace("/login");
      router.refresh();
      setSigningOut(false);
    }
  };

  useEffect(() => {
    router.prefetch("/dashboard/projects");
  }, [router]);

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-border/50 border-r bg-card/30 backdrop-blur-xl md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-border/50 border-b px-5">
          <Link className="flex items-center gap-2" href="/">
            <Docs4LlmLogo size={28} />
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <Link
            className="mb-3 flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card/65 px-3 py-2 font-medium text-sm text-foreground transition-all hover:bg-secondary/60"
            href="/chat"
          >
            <Plus className="size-4" />
            New conversion
          </Link>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.matchExact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-sm transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-border/50 border-t p-4">
          <Link
            className="mb-3 flex items-center justify-between gap-2 rounded-lg p-1.5 transition-colors hover:bg-muted/60"
            href="/dashboard/profile"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{userEmail}</p>
              <p className="text-muted-foreground text-xs">View profile</p>
            </div>
            <Badge variant="secondary">{planLabel}</Badge>
          </Link>
          <div className="flex gap-2">
            <Button
              asChild
              className="flex-1"
              size="sm"
              type="button"
              variant="outline"
            >
              <Link href="/pricing">
                <CreditCard className="mr-1 size-3.5" />
                Billing
              </Link>
            </Button>
            <Button
              disabled={signingOut}
              onClick={handleSignOut}
              size="sm"
              type="button"
              variant="ghost"
            >
              <LogOut className="size-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-border/50 border-b bg-background/80 px-6 backdrop-blur-xl md:hidden">
          <Link className="flex items-center gap-2" href="/dashboard">
            <Docs4LlmLogo size={26} />
          </Link>
          <Button asChild size="sm" type="button" variant="outline">
            <Link href="/chat">
              <Plus className="mr-1 size-3.5" />
              New
            </Link>
          </Button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-border/50 border-b bg-background/60 px-4 py-2 md:hidden">
          {NAV.map((item) => {
            const active = item.matchExact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-xs transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 p-6 lg:p-10">{children}</main>

        <footer className="border-border/50 border-t bg-card/20 px-6 py-4 text-muted-foreground text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>MCP conversion platform</span>
            <Link
              className="flex items-center gap-1 hover:text-foreground"
              href="/docs"
            >
              Docs
              <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
