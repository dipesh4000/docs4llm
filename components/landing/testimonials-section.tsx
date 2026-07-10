"use client";

type Testimonial = {
  id: string;
  quote: string;
  wide?: boolean;
};

const ROW_ONE: Testimonial[] = [
  {
    id: "1",
    quote:
      "We stopped pasting docs into prompts. Our agents finally know what our APIs actually do — across every editor in our stack.",
    wide: true,
  },
  {
    id: "2",
    quote:
      "Finally an MCP server that actually understands our OpenAPI spec. No more hallucinated endpoints.",
  },
  {
    id: "3",
    quote:
      "Hosted MCP + live playground saved us weeks of internal tooling we were about to build.",
    wide: true,
  },
  {
    id: "4",
    quote:
      "Cursor picks up the generated tools instantly. Paste config, start coding — zero config drama.",
  },
  {
    id: "5",
    quote:
      "Best docs-to-MCP flow I've shipped this year. One URL, under a minute, production-ready.",
  },
  {
    id: "6",
    quote:
      "Our team stopped asking how to wire MCP. They just paste a URL and ship.",
    wide: true,
  },
  {
    id: "7",
    quote:
      "Semantic toolkits beat raw crawl dumps for agent accuracy every single time.",
  },
  {
    id: "8",
    quote:
      "RAG on our own docs without building a pipeline from scratch. That's the whole win.",
  },
];

const ROW_TWO: Testimonial[] = [
  {
    id: "9",
    quote:
      "Mintlify, Swagger, GitHub README — it just works. That's the whole pitch.",
    wide: true,
  },
  {
    id: "10",
    quote:
      "The playground let us validate every tool call before handing off to production agents.",
  },
  {
    id: "11",
    quote:
      "Auto re-crawl means our MCP never drifts from what production docs actually say.",
    wide: true,
  },
  {
    id: "12",
    quote:
      "Onboarded three squads to MCP in one afternoon. No custom servers, no DevOps ticket.",
  },
  {
    id: "13",
    quote:
      "This is what agent-native developer experience should feel like. Paste and go.",
  },
  {
    id: "14",
    quote:
      "Compressed tools are tight — agents call the right endpoint on the first try.",
    wide: true,
  },
  {
    id: "15",
    quote: "CLI + hosted MCP is the combo we wanted. Ship and forget.",
  },
  {
    id: "16",
    quote:
      "Registry publish on ready means our MCP is discoverable without extra ops work.",
  },
];

function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <figure
      className={`group relative shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-card/60 px-5 py-4 backdrop-blur-sm transition-all duration-300 hover:border-foreground/25 hover:bg-card/90 sm:px-6 sm:py-5 ${
        item.wide
          ? "w-[min(92vw,420px)] sm:w-[440px]"
          : "w-[min(88vw,300px)] sm:w-[320px]"
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-4 font-serif text-4xl text-foreground/10 leading-none select-none"
      >
        &ldquo;
      </span>
      <blockquote className="relative z-10 pt-4 text-foreground/88 text-[13px] leading-relaxed sm:text-sm">
        <span className="text-foreground/50">&ldquo;</span>
        {item.quote}
        <span className="text-foreground/50">&rdquo;</span>
      </blockquote>
    </figure>
  );
}

function MarqueeRow({
  items,
  direction,
}: {
  items: Testimonial[];
  direction: "left" | "right";
}) {
  const loop = [
    ...items.map((item) => ({ ...item, keyId: `${item.id}-a` })),
    ...items.map((item) => ({ ...item, keyId: `${item.id}-b` })),
  ];

  return (
    <div className="testimonials-marquee-viewport relative w-full overflow-hidden">
      <div
        className={`testimonials-marquee-track ${
          direction === "left"
            ? "testimonial-marquee"
            : "testimonial-marquee-reverse"
        }`}
      >
        {loop.map((item) => (
          <TestimonialCard item={item} key={item.keyId} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section
      className="overflow-hidden border-border border-y bg-surface-page"
      id="testimonials"
    >
      <div className="noise-texture relative py-14 sm:py-20 md:py-24">
        <div className="relative z-10 mx-auto mb-10 w-[90vw] max-w-6xl px-4 sm:mb-12 sm:w-5/6 2xl:w-4/6">
          <p className="mb-3 font-mono text-[11px] text-muted-foreground tracking-[0.2em]">
            &lt;TESTIMONIALS&gt;
          </p>
          <h2 className="font-display font-thin text-3xl tracking-tight sm:text-4xl lg:text-[2.75rem]">
            Developer Love
          </h2>
        </div>

        <div className="relative z-10 flex flex-col gap-5 sm:gap-6">
          <MarqueeRow direction="left" items={ROW_ONE} />
          <MarqueeRow direction="right" items={ROW_TWO} />
        </div>
      </div>
    </section>
  );
}
