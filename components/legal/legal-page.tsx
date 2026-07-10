import Link from "next/link";

type Section = {
  heading: string;
  body: React.ReactNode;
};

export function LegalPage({
  title,
  intro,
  lastUpdated,
  sections,
  contactNote,
}: {
  title: string;
  intro: string;
  lastUpdated: string;
  sections: Section[];
  contactNote?: React.ReactNode;
}) {
  return (
    <section className="relative mx-auto max-w-3xl px-6 pt-32 pb-24 lg:px-8">
      <div className="mb-10">
        <Link
          className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em] hover:text-foreground"
          href="/"
        >
          ← back to doc2mcp
        </Link>
        <h1 className="mt-4 font-display font-bold text-4xl tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          Last updated: {lastUpdated}
        </p>
        <p className="mt-6 text-foreground/85 text-base leading-relaxed">
          {intro}
        </p>
      </div>

      <div className="space-y-10">
        {sections.map((section) => (
          <article key={section.heading}>
            <h2 className="font-display font-semibold text-2xl tracking-tight">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-3 text-foreground/85 text-[15px] leading-relaxed">
              {section.body}
            </div>
          </article>
        ))}
      </div>

      {contactNote ? (
        <div className="mt-12 rounded-2xl border border-border/50 bg-card/40 p-6">
          {contactNote}
        </div>
      ) : null}
    </section>
  );
}
