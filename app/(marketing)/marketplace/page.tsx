import { Boxes, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { MarketplaceExplorer } from "@/components/marketplace/marketplace-explorer";
import { Button } from "@/components/ui/button";
import { getMarketplaceProjects } from "@/lib/db/queries";
import { toMarketplaceMcp } from "@/lib/marketplace/transform";

export const metadata: Metadata = {
  title: "MCP Marketplace — doc2mcp",
  description:
    "Browse every MCP server generated on doc2mcp. Discover documentation turned into AI-ready infrastructure for Cursor, Claude, VS Code, Windsurf and OpenAI Agents.",
};

export default function MarketplacePage() {
  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <Suspense fallback={<MarketplaceFallback />}>
        <AuthAwareLandingNavigation />
        <MarketplaceContent />
        <FooterSection />
      </Suspense>
    </main>
  );
}

function MarketplaceFallback() {
  return (
    <>
      <section className="relative mx-auto max-w-[1280px] px-6 pt-32 pb-12 lg:px-12">
        <div className="max-w-2xl space-y-4">
          <div className="h-3 w-32 rounded-full bg-muted" />
          <div className="h-14 w-full max-w-xl rounded-full bg-muted" />
          <div className="h-20 w-full max-w-2xl rounded-2xl bg-muted" />
        </div>
      </section>
      <section className="relative mx-auto max-w-[1280px] px-6 pb-32 lg:px-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {["one", "two", "three"].map((item) => (
            <div
              className="h-56 rounded-2xl border border-border/50 bg-card/40"
              key={item}
            />
          ))}
        </div>
      </section>
    </>
  );
}

async function MarketplaceContent() {
  await connection();
  const rows = await getMarketplaceProjects({ limit: 200 });
  const mcps = rows.map(toMarketplaceMcp);

  const totalTools = mcps.reduce((acc, mcp) => acc + mcp.toolCount, 0);

  return (
    <>
      <section className="relative mx-auto max-w-[1280px] px-6 pt-32 pb-12 lg:px-12">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            <Boxes className="size-3.5" />
            Marketplace
          </p>
          <h1 className="mt-3 font-display font-bold text-4xl text-foreground tracking-tight sm:text-6xl">
            The MCP marketplace
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Every MCP server generated on doc2mcp is published here
            automatically. Browse documentation that&apos;s already been turned
            into AI-ready infrastructure — then build your own in minutes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Boxes className="size-4 text-violet-500" />
              <strong className="text-foreground">{mcps.length}</strong> MCP
              server{mcps.length === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-violet-500" />
              <strong className="text-foreground">{totalTools}</strong> tools
              published
            </span>
          </div>

          <div className="mt-7">
            <Button asChild className="group h-10 gap-1.5 rounded-full px-5">
              <Link href="/chat">
                <Sparkles className="size-4" />
                Publish your MCP
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1280px] px-6 pb-32 lg:px-12">
        {mcps.length > 0 ? (
          <MarketplaceExplorer mcps={mcps} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/50 border-dashed bg-card/30 py-24 text-center">
            <Boxes className="size-10 text-muted-foreground/50" />
            <h2 className="font-display font-semibold text-foreground text-xl">
              No MCP servers published yet
            </h2>
            <p className="max-w-md text-muted-foreground text-sm">
              Be the first. Paste a documentation URL and your MCP server will
              appear here automatically once it&apos;s ready.
            </p>
            <Button asChild className="mt-2 rounded-full">
              <Link href="/chat">Generate the first MCP</Link>
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
