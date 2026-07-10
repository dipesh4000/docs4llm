import { notFound } from "next/navigation";
import { DocBreadcrumbs } from "@/components/docs/doc-breadcrumbs";
import { DocContent } from "@/components/docs/doc-content";
import { DocCta } from "@/components/docs/doc-cta";
import { DocFeedback } from "@/components/docs/doc-feedback";
import { DocPageActions } from "@/components/docs/doc-page-actions";
import { DocPager } from "@/components/docs/doc-pager";
import { DocToc } from "@/components/docs/doc-toc";
import { DocsHome } from "@/components/docs/docs-home";
import { getDocNav, getDocPage } from "@/lib/docs/loader";

export async function DocPageLoader({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return <DocsHome />;
  }

  const page = await getDocPage(slug);

  if (!page) {
    notFound();
  }

  const nav = await getDocNav();
  const href = `/docs/${slug.join("/")}`;
  const index = nav.findIndex((item) => item.href === href);
  const prev = index > 0 ? nav[index - 1] : null;
  const next = index >= 0 && index < nav.length - 1 ? nav[index + 1] : null;

  return (
    <div className="mx-auto lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DocBreadcrumbs category={page.category} title={page.title} />
          <DocPageActions
            markdown={page.content}
            next={next}
            prev={prev}
            title={page.title}
          />
        </div>
        <h1 className="mt-4 font-display font-semibold text-3xl tracking-tight">
          {page.title}
        </h1>
        {page.description ? (
          <p className="mt-2 text-lg text-muted-foreground">
            {page.description}
          </p>
        ) : null}
        <div className="mt-8">
          <DocContent content={page.content} />
        </div>
        <DocCta />
        <DocFeedback pageHref={href} />
        <DocPager next={next} prev={prev} />
      </div>
      <aside className="hidden lg:block">
        <div className="sticky top-[72px] space-y-6 py-2">
          <DocToc />
          <div className="rounded-xl border border-border/60 bg-card/40 p-4">
            <p className="font-medium text-sm">Ship docs to AI agents</p>
            <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed">
              Turn any documentation site into a hosted MCP server in minutes.
            </p>
            <a
              className="mt-3 inline-flex h-8 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground text-xs transition-colors hover:bg-primary/90"
              href="https://doc2mcp.site"
            >
              Open app
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
