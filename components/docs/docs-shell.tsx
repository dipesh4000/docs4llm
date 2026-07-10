import { Github, Menu } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Doc2McpLogo } from "@/components/doc2mcp/logo";
import { ThemeToggle } from "@/components/doc2mcp/theme-toggle";
import { DocsMobileNavLoader } from "@/components/docs/docs-mobile-nav-loader";
import { DocsSearchLoader } from "@/components/docs/docs-search-loader";
import { DocsSidebarLoader } from "@/components/docs/docs-sidebar-loader";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/docs", label: "Docs" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
] as const;

function SidebarFallback() {
  return (
    <div className="w-full">
      <div className="mb-3 h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            className="h-8 animate-pulse rounded-md bg-muted/60"
            key={`doc-nav-skel-${String(i)}`}
          />
        ))}
      </div>
    </div>
  );
}

function MobileNavFallback() {
  return (
    <Button
      aria-label="Open documentation menu"
      className="lg:hidden"
      disabled
      size="icon-sm"
      variant="ghost"
    >
      <Menu className="size-4" />
    </Button>
  );
}

export function DocPageFallback() {
  return (
    <div className="space-y-4">
      <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
      <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted/60" />
      <div className="mt-8 h-64 animate-pulse rounded-xl bg-muted/60" />
    </div>
  );
}

export function DocsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-border/60 border-b bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-(--breakpoint-2xl) items-center gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Suspense fallback={<MobileNavFallback />}>
              <DocsMobileNavLoader />
            </Suspense>
            <Link className="flex shrink-0 items-center gap-2" href="/">
              <Doc2McpLogo size={26} />
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                className="rounded-md px-3 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-accent/60 hover:text-foreground"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="hidden w-56 sm:block">
              <Suspense fallback={null}>
                <DocsSearchLoader />
              </Suspense>
            </div>
            <Link
              aria-label="GitHub repository"
              className="hidden size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground sm:inline-flex"
              href="https://github.com/doc2mcp/doc2mcp-registry"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Github className="size-4" />
            </Link>
            <ThemeToggle />
            <Link
              className="inline-flex h-9 items-center rounded-md bg-primary px-3.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              href="/chat"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-(--breakpoint-2xl) flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 border-border/60 [scrollbar-width:none] lg:sticky lg:top-14 lg:block lg:h-[calc(100dvh-3.5rem)] lg:w-64 lg:overflow-y-auto lg:border-r lg:px-4 lg:py-8 [&::-webkit-scrollbar]:hidden">
          <Suspense fallback={<SidebarFallback />}>
            <DocsSidebarLoader />
          </Suspense>
        </aside>
        <div className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
