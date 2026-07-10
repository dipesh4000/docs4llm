import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthAwareLandingNavigation } from "@/components/landing/auth-aware-navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { BLOG_POSTS, getPost } from "@/lib/blog/posts";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return { title: "Post not found — doc2mcp" };
  }
  return {
    title: `${post.title} — doc2mcp blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      images: [{ url: post.heroImage }],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    notFound();
  }

  const related = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <main className="landing-page relative min-h-screen overflow-x-hidden">
      <AuthAwareLandingNavigation />

      <article className="relative mx-auto max-w-3xl px-6 pt-32 pb-16 lg:px-8">
        <Link
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em] hover:text-foreground"
          href="/blog"
        >
          <ArrowLeft className="size-3" />
          All posts
        </Link>

        <header className="mt-8">
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
            {post.tags.map((tag) => (
              <span
                className="rounded-full bg-muted/60 px-2.5 py-0.5 font-medium"
                key={tag}
              >
                {tag}
              </span>
            ))}
            <span>·</span>
            <time>{post.publishedOn}</time>
            <span>·</span>
            <span>{post.readingMinutes} min read</span>
          </div>
          <h1 className="mt-5 font-display font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-muted-foreground text-xl leading-relaxed">
            {post.excerpt}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 font-semibold text-sm text-white">
              {post.author.name.charAt(0)}
            </span>
            <div>
              <p className="font-medium text-foreground text-sm">
                {post.author.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {post.author.role}
              </p>
            </div>
          </div>
        </header>

        <div className="relative mt-12 aspect-[16/10] overflow-hidden rounded-2xl bg-muted/40">
          <Image
            alt={post.heroAlt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            src={post.heroImage}
          />
        </div>

        <div className="mt-12 space-y-1">{post.body}</div>

        <div className="mt-16 rounded-2xl border border-border/50 bg-card/40 p-6 sm:p-8">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Try it
          </p>
          <p className="mt-3 font-display font-semibold text-foreground text-xl sm:text-2xl">
            Paste a docs URL. Get an MCP server in 90 seconds.
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            Free tier included. Works with Cursor, Claude, Windsurf, VS Code,
            Codex, and Zed.
          </p>
          <Link
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2.5 font-medium text-background text-sm transition-colors hover:bg-foreground/90"
            href="/chat"
          >
            Generate your MCP
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </article>

      {related.length > 0 ? (
        <section className="relative mx-auto max-w-[1280px] px-6 pb-32 lg:px-12">
          <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
            Keep reading
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {related.map((post) => (
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
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-muted-foreground text-xs">
                    {post.publishedOn} · {post.readingMinutes} min
                  </p>
                  <h3 className="font-display font-semibold text-foreground text-lg tracking-tight">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {post.excerpt}
                  </p>
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
