import type { Metadata } from "next";
import Link from "next/link";
import { Doc2McpLogo } from "@/components/doc2mcp/logo";
import { ThemeToggle } from "@/components/doc2mcp/theme-toggle";
import { ConversionDemo } from "@/components/landing/conversion-demo";

export const metadata: Metadata = {
  title: "doc2mcp — Live demo",
  description:
    "Watch doc2mcp turn a docs URL into a Cursor-ready MCP server in real time.",
};

export default function DemoPage() {
  return (
    <main className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link className="flex items-center gap-2" href="/">
            <Doc2McpLogo size={28} />
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link
              className="text-muted-foreground hover:text-foreground"
              href="/"
            >
              Home
            </Link>
            <Link
              className="text-muted-foreground hover:text-foreground"
              href="/pricing"
            >
              Pricing
            </Link>
            <Link
              className="rounded-full bg-foreground px-4 py-1.5 text-background hover:opacity-90"
              href="/chat"
            >
              Open app
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-3 font-mono text-muted-foreground text-xs">
            <span className="h-px w-8 bg-foreground/30" />
            Live demo
            <span className="h-px w-8 bg-foreground/30" />
          </span>
          <h1 className="mt-4 font-display text-4xl tracking-tight sm:text-5xl">
            Watch a docs URL become an MCP.
          </h1>
          <p className="mt-3 text-muted-foreground">
            No video — this is the actual UI flow looping with real example
            URLs.
          </p>
        </div>

        <ConversionDemo />

        <div className="mt-12 text-center">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-background hover:opacity-90"
            href="/chat"
          >
            Try it with your own docs →
          </Link>
        </div>
      </section>
    </main>
  );
}
