import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { BLOG_POSTS } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog — doc2mcp",
  description:
    "Notes on MCP, AI tooling, agent workflows and the operations behind shipping AI-native developer products.",
};

export default function BlogIndexPage() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <AuthAwareLandingNavigation />

      <section className="relative mx-auto max-w-[1280px] px-6 pt-32 pb-12 lg:px-12">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Blog
          </p>
          <h1 className="mt-3 font-display font-bold text-4xl text-foreground tracking-tight sm:text-6xl">
            Notes from the bridge between docs and agents.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Short, opinionated essays on MCP, AI tooling, and the operational
            reality of shipping AI-native developer products.
          </p>
        </div>

        {featured ? (
          <Link
            className="group relative grid gap-8 overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-6 transition-all duration-300 hover:border-border lg:grid-cols-[1.1fr_1fr] lg:p-8"
            href={`/blog/${featured.slug}`}
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted/40 lg:aspect-auto">
              <Image
                alt={featured.heroAlt}
                className="object-cover"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 640px"
                src={featured.heroImage}
              />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span className="rounded-full bg-muted/60 px-2.5 py-0.5 font-medium">
                  Featured
                </span>
                <span>·</span>
                <time>{featured.publishedOn}</time>
                <span>·</span>
                <span>{featured.readingMinutes} min read</span>
              </div>
              <h2 className="mt-4 font-display font-semibold text-2xl text-foreground tracking-tight sm:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                {featured.excerpt}
              </p>
              <div className="mt-6 inline-flex items-center gap-1.5 font-medium text-foreground text-sm">
                Read the full essay
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        ) : null}
      </section>

      {rest.length > 0 ? (
        <section className="relative mx-auto max-w-[1280px] px-6 pt-4 pb-32 lg:px-12">
          <div className="grid gap-8 sm:grid-cols-2">
            {rest.map((post) => (
              <Link
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/40 transition-all duration-300 hover:border-border"
                href={`/blog/${post.slug}`}
                key={post.slug}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted/40">
                  <Image
                    alt={post.heroAlt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    src={post.heroImage}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <time>{post.publishedOn}</time>
                    <span>·</span>
                    <span>{post.readingMinutes} min read</span>
                  </div>
                  <h2 className="font-display font-semibold text-foreground text-xl tracking-tight">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto inline-flex items-center gap-1.5 pt-2 font-medium text-foreground text-sm">
                    Read post
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <FooterSection />
    </main>
  );
}
