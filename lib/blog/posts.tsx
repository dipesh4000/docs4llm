import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  heroImage: string;
  heroAlt: string;
  author: {
    name: string;
    role: string;
  };
  publishedOn: string;
  readingMinutes: number;
  tags: string[];
  body: ReactNode;
};

function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-foreground/85 text-[17px] leading-[1.8]">{children}</p>
  );
}

function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2
      className="mt-12 mb-4 font-display font-semibold text-2xl text-foreground tracking-tight sm:text-3xl"
      id={id}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 font-display font-semibold text-foreground text-xl tracking-tight">
      {children}
    </h3>
  );
}

function UL({ children }: { children: ReactNode }) {
  return (
    <ul className="space-y-2 pl-5 text-foreground/85 text-[17px] leading-[1.75] [&>li]:list-disc [&>li]:marker:text-muted-foreground/60">
      {children}
    </ul>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="my-8 border-foreground/20 border-l-2 pl-5 font-display text-foreground/90 text-xl italic leading-relaxed sm:text-2xl">
      {children}
    </blockquote>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[0.92em] text-foreground">
      {children}
    </code>
  );
}

function Pre({ children, lang }: { children: ReactNode; lang?: string }) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border/50 bg-muted/40">
      {lang ? (
        <p className="border-border/40 border-b px-4 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em]">
          {lang}
        </p>
      ) : null}
      <pre className="overflow-x-auto px-4 py-4 font-mono text-[13px] text-foreground/90 leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "better-docs-wont-fix-ai-hallucinations",
    title: "Why better documentation won't fix AI hallucinations",
    excerpt:
      "Documentation was written for humans. AI agents need infrastructure. Here is the structural problem nobody is solving — and what it looks like when you fix it.",
    heroImage: "/blog/better-docs-wont-fix-hallucinations.png",
    heroAlt:
      "Editorial cover: bold serif headline 'Why better docs won't fix AI hallucinations' on a deep matte-black background, with a small Cursor terminal panel on the right highlighting one invented line labelled INVENTED.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "Jun 2, 2026",
    readingMinutes: 8,
    tags: ["MCP", "AI Agents", "Field Essay"],
    body: (
      <>
        <P>
          A friend of mine spent six hours debugging a Stripe Connect
          integration last week.
        </P>
        <P>
          He was using Cursor. He was using Claude 3.5 Sonnet. He was using one
          of the better-documented APIs in the world.
        </P>
        <P>
          For six hours, the model kept inserting a webhook header called{" "}
          <Code>X-Stripe-Connect-Signature</Code> into his verification logic.
          He copied it. He tested it. He read the docs. He read them again. He
          asked the model to &ldquo;double-check the official
          documentation.&rdquo;
        </P>
        <P>The model kept doing it.</P>
        <P>The header does not exist.</P>
        <P>
          Stripe verifies Connect webhooks with <Code>Stripe-Signature</Code> —
          the same header it uses for everything else. The &ldquo;Connect&rdquo;
          version was something the model had quietly invented at some point
          during fine-tuning, and now every agent in his stack was confidently
          reproducing it on demand.
        </P>
        <P>
          He is not a junior engineer. He has shipped six startups. He just made
          the same mistake that almost every team using AI coding assistants is
          making right now: he assumed the documentation was the problem.
        </P>
        <P>It wasn&apos;t. It almost never is.</P>

        <H2 id="diagnosis">The diagnosis everyone gets wrong</H2>
        <P>
          Walk into any AI engineering Slack right now and you will hear the
          same conversation on repeat:
        </P>
        <Quote>
          &ldquo;Our agents keep hallucinating our API. We need to improve the
          docs.&rdquo;
        </Quote>
        <P>
          So teams improve the docs. They rewrite endpoints. They add code
          samples. They commission better Markdown. They migrate to fancier docs
          frameworks. They publish a Notion. They publish an OpenAPI. They
          publish an LLMs.txt.
        </P>
        <P>And the hallucinations keep happening.</P>
        <P>Because the diagnosis is wrong.</P>
        <P>
          Hallucinated APIs are not a writing problem. They are not a tone
          problem. They are not even a &ldquo;the docs are incomplete&rdquo;
          problem.
        </P>
        <P>
          They are a <strong>structure</strong> problem. The way documentation
          is shaped on the web is fundamentally hostile to the way models
          actually read.
        </P>

        <H2 id="in-production">
          What hallucination actually looks like in production
        </H2>
        <P>
          Open the network tab the next time you use any AI coding assistant
          against a real product&apos;s docs.
        </P>
        <P>You will see one of three things:</P>
        <UL>
          <li>
            The agent crawled the docs root, grabbed the first 12 KB of rendered
            HTML, and called it a day.
          </li>
          <li>
            The agent retrieved three or four chunks from a vector index —
            usually the wrong chunks, because the embedding model has no idea
            your &ldquo;Authentication&rdquo; page is the canonical source for
            header behavior.
          </li>
          <li>
            The agent retrieved nothing at all, because the docs are a
            JavaScript single-page app and the crawler couldn&apos;t see past
            the loading spinner.
          </li>
        </UL>
        <P>
          In every case, the model is being asked to answer a precise,
          schema-level question —{" "}
          <em>&ldquo;what header do I use to verify this webhook?&rdquo;</em> —
          using prose written for humans who are expected to read the page top
          to bottom and understand context from layout, sidebar, and tone.
        </P>
        <P>
          The model doesn&apos;t get layout. It doesn&apos;t get sidebar. It
          doesn&apos;t get tone. It gets a flattened bag of paragraphs with most
          of the structural signal stripped out.
        </P>
        <P>
          So it fills in the blanks. It does what language models always do: it
          produces something that <em>sounds</em> like a Stripe header, because
          everything in its training data says headers exist and are named in a
          certain way.
        </P>
        <P>
          That is hallucination. It is not a creativity failure. It is a
          structure failure.
        </P>

        <H2 id="better-docs-doesnt-help">
          Why &ldquo;better docs&rdquo; doesn&apos;t move the needle
        </H2>
        <P>
          Imagine you wanted to teach a brand new junior engineer how to call
          your API.
        </P>
        <UL>
          <li>You&apos;d give them the OpenAPI spec.</li>
          <li>You&apos;d give them a Postman collection.</li>
          <li>You&apos;d point them at the SDK source.</li>
          <li>You&apos;d hand them a runnable example.</li>
        </UL>
        <P>
          What you wouldn&apos;t do is tell them: &ldquo;Read these 400 pages of
          Markdown and reason about which one is canonical.&rdquo;
        </P>
        <P>
          That second option is exactly what we are doing with AI agents today.
        </P>
        <P>
          When we say &ldquo;improve the docs,&rdquo; we usually mean: write
          better prose. Add a clearer intro paragraph. Move the warnings up. Add
          another code sample.
        </P>
        <P>
          None of that helps the model. The model already had your prose. It
          generated a header that didn&apos;t exist <em>while</em> it had your
          prose.
        </P>
        <P>
          What the model is missing is{" "}
          <strong>
            structure the agent can index, version, and call with precision
          </strong>
          :
        </P>
        <UL>
          <li>A canonical list of endpoints, not an HTML page of endpoints.</li>
          <li>
            A canonical list of parameter names and their types — not paragraphs
            about them.
          </li>
          <li>
            A canonical list of headers, codes, and constraints — not &ldquo;see
            the section above.&rdquo;
          </li>
          <li>
            A way for the agent to ask{" "}
            <em>
              &ldquo;what&apos;s the latest version of this endpoint?&rdquo;
            </em>{" "}
            instead of being trapped in whatever HTML it crawled six minutes
            ago.
          </li>
        </UL>
        <P>This is not a writing exercise. It is an infrastructure exercise.</P>

        <H2 id="markdown-vs-interface">
          Markdown was built for humans. Agents need something else.
        </H2>
        <P>
          The honest version of the problem is this: we built the entire
          documentation web for a reader who is a human with patience, a Ctrl-F
          box, and good judgment.
        </P>
        <P>Agents are none of those things.</P>
        <P>
          An agent is closer to a programmable API consumer than a human reader.
          It needs:
        </P>
        <UL>
          <li>
            <strong>A typed surface.</strong> &ldquo;What endpoints exist? What
            does this one return?&rdquo;
          </li>
          <li>
            <strong>Versioning.</strong> &ldquo;I am working against v2 of your
            API. Don&apos;t show me v1 examples.&rdquo;
          </li>
          <li>
            <strong>Tool-shaped retrieval.</strong> &ldquo;When the user asks
            about Connect webhooks, hand me only the canonical
            signature-verification section, not the marketing page.&rdquo;
          </li>
          <li>
            <strong>Live freshness.</strong> &ldquo;These docs changed three
            hours ago. Re-index.&rdquo;
          </li>
          <li>
            <strong>Workflow context.</strong> &ldquo;This call requires that
            call. Don&apos;t suggest one without the other.&rdquo;
          </li>
        </UL>
        <P>
          None of these are properties of a Markdown file. They are properties
          of an <em>interface</em>.
        </P>
        <P>
          Until we stop pretending docs are a flat blob of prose and start
          treating them as an interface that agents call, we will keep getting
          confidently invented headers, deprecated endpoints, and integrations
          that look right in chat and break in production.
        </P>

        <H2 id="mcp-layer">What an AI-native documentation layer looks like</H2>
        <P>The shape of the fix is already showing up in production stacks.</P>
        <P>
          It is called the <strong>Model Context Protocol</strong> — MCP for
          short. It is a small, simple protocol that lets an AI agent talk to a
          documentation source the way it would talk to any other tool.
        </P>
        <P>The MCP-shaped version of &ldquo;docs&rdquo; looks like this:</P>
        <UL>
          <li>
            <strong>Tools, not pages.</strong> Instead of crawling a 600-URL
            site, the agent calls <Code>search_docs</Code>,{" "}
            <Code>get_endpoint</Code>, <Code>list_versions</Code>,{" "}
            <Code>get_example</Code>.
          </li>
          <li>
            <strong>Schemas, not screenshots.</strong> Each tool has a typed
            contract. The agent knows what comes back before it asks.
          </li>
          <li>
            <strong>Versioning is first-class.</strong> v1, v2, beta — explicit,
            queryable, never mixed.
          </li>
          <li>
            <strong>Retrieval is workflow-aware.</strong> Asking{" "}
            <em>&ldquo;how do I verify a Connect webhook&rdquo;</em> returns the
            exact verification section, not a vector-search soup.
          </li>
          <li>
            <strong>Freshness is a property of the protocol.</strong> Docs
            update, MCP server updates, agent sees the change.
          </li>
        </UL>
        <P>
          This is what you actually want sitting between your documentation and
          any AI assistant your team uses.
        </P>
        <P>
          You do not want every agent re-crawling your docs and re-inventing
          your headers. You want a single canonical context layer the agents
          read from.
        </P>
        <P>
          That layer is what we are building at doc2mcp. You point us at a docs
          URL. We generate a production-ready MCP server your agents — Cursor,
          Claude, OpenAI Agents, Windsurf, anything MCP-compatible — can call
          instead of guessing.
        </P>
        <P>
          But the bigger point is not the product. The bigger point is the
          category.
        </P>
        <P>
          <strong>Documentation is becoming infrastructure.</strong> The next
          time you find yourself thinking{" "}
          <em>&ldquo;our docs need to be better for AI,&rdquo;</em> what you
          actually need is not better prose. You need an interface.
        </P>

        <H2 id="new-stack">The new stack</H2>
        <P>
          Here is the rough shape of where the AI engineering stack is heading:
        </P>
        <Pre lang="text">
          {`Layer        |  Used to be              |  Becoming
-------------+--------------------------+----------------------------
Models       |  The product             |  A commodity
Retrieval    |  A vector DB, bolted on  |  A first-class context protocol
Tools        |  Hand-rolled per stack   |  Standardized via MCP
Docs         |  Marketing surface       |  Programmable infrastructure
Agents       |  One-off Copilot demos   |  Long-running workflows that
             |                          |  need precise context`}
        </Pre>
        <P>
          In every layer, the same thing is happening: ad-hoc artifacts are
          being replaced by structured interfaces. Models that win in 2027 will
          not be the ones with the most parameters. They will be the ones whose
          teams gave them the cleanest, most structured surface to act against.
        </P>
        <P>
          If your documentation is still a flat web of HTML pages, your AI
          strategy has a hole in it. You can&apos;t out-prompt a structural
          problem.
        </P>

        <H2 id="this-week">
          What I would do this week if I led a developer-tools team
        </H2>
        <UL>
          <li>
            Open the network tab. Watch your agent try to read your docs in real
            time. Notice how thin the signal is.
          </li>
          <li>
            Pick the top three questions a developer asks an AI assistant about
            your product. Try them against your live docs in Cursor or Claude.
            Count the hallucinations.
          </li>
          <li>
            Decide that those three questions should be answered by a tool, not
            by retrieval. Stand up an MCP layer in front of them.
          </li>
          <li>
            Treat your docs as the <em>source of truth</em>, but stop expecting
            agents to read them like humans do. Generate a structured layer on
            top.
          </li>
          <li>
            Measure agent accuracy as a product metric, the same way you measure
            pageviews. It is now a leading indicator for whether developers will
            pick your product over your competitor&apos;s.
          </li>
        </UL>
        <P>
          You can do all five steps without rewriting a single line of
          documentation prose.
        </P>
        <P>
          That is the punchline of this entire essay.{" "}
          <em>
            The thing your team is being asked to fix — the writing — is not
            where the problem lives.
          </em>{" "}
          The problem lives in the layer between your docs and the model. Until
          you build that layer, no amount of careful Markdown will close the
          gap.
        </P>

        <H2 id="closing">A closing thought</H2>
        <P>The most underrated trend in AI right now is this:</P>
        <Quote>
          The next moat is not the model. It is the structured context the model
          is allowed to see.
        </Quote>
        <P>
          Companies that figure this out first will look, from the outside, like
          they have <em>smarter agents</em>. They won&apos;t. They will just be
          the ones who turned their documentation, their APIs, and their
          internal knowledge into infrastructure that agents can actually use.
        </P>
        <P>
          If you are running any kind of agent stack today — Cursor, Claude,
          OpenAI Agents, internal copilots, customer-facing AI — and you have
          ever shipped a fix to &ldquo;improve the docs for the LLM,&rdquo; I
          would love to hear what worked and what didn&apos;t.
        </P>
        <P>
          Drop a comment with one example of an AI agent confidently inventing
          something against your product. I want to read every one of them.
        </P>
        <P>The agents will read it. They just need it to be the right shape.</P>
      </>
    ),
  },
  {
    slug: "stop-pasting-docs-into-cursor",
    title:
      "Stop pasting docs into Cursor. Let your agent borrow what others built.",
    excerpt:
      "The fastest engineers in 2026 don’t copy-paste API docs into their prompts. They expose a clean MCP server and let every editor pull from the same source of truth.",
    heroImage: "/blog/skills-library.png",
    heroAlt:
      "Floating glass cards labelled API Reference, OpenAPI Spec, Crawled Pages, Live Examples and MCP Server orbiting a glowing assistant orb on a dark navy background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 30, 2026",
    readingMinutes: 6,
    tags: ["MCP", "Workflow", "Editor"],
    body: (
      <>
        <P>
          Every dev I’ve shipped with in the last six months has the same tab
          open at 2&nbsp;AM: a vendor’s docs site, scrolled three pages deep,
          half-copied into a prompt that already lost context. The agent
          hallucinates an endpoint, you fix it, you paste again. It’s a tax we
          stopped questioning.
        </P>
        <P>
          doc2mcp exists because that tax is unnecessary. You don’t need smarter
          prompts — you need a smaller surface area between the docs and the
          model. An MCP server is exactly that surface.
        </P>

        <H2 id="the-problem">The problem isn’t the model. It’s the bridge.</H2>
        <P>
          When an AI agent guesses a route, it’s rarely because the model is
          weak. It’s because the bridge between “what the docs say” and “what
          the model can see at inference time” is held together with copy-paste.
          Three patterns we hear constantly:
        </P>
        <UL>
          <li>
            <strong>Stale context.</strong> The model only knows what was in its
            training set, or what you remembered to paste this morning.
          </li>
          <li>
            <strong>Lossy summarisation.</strong> 40 pages get crushed into a
            512-token system prompt. Half the auth flow goes missing.
          </li>
          <li>
            <strong>Per-tool drift.</strong> Cursor sees one prompt, Claude sees
            another, your CI bot sees a third. Three forks of “the truth”.
          </li>
        </UL>

        <H2 id="what-changes">What changes when you generate an MCP</H2>
        <P>
          An MCP server isn’t a wrapper around your docs — it’s a small,
          structured catalogue of <em>capabilities</em>. Tools, not pages.
          Workflows, not endpoints. The model asks <Code>list_tools()</Code>,
          gets back a typed menu, and picks what it needs.
        </P>
        <Quote>
          You stop teaching the model what your API does. You give it the
          ability to look.
        </Quote>
        <P>That single move kills the three problems above:</P>
        <UL>
          <li>
            The model reads <em>live</em>. No staleness, no re-paste, no “update
            the system prompt” PR.
          </li>
          <li>
            Tools are semantic, not raw. <Code>create_invoice()</Code> instead
            of 7 POST routes with overlapping fields.
          </li>
          <li>
            Every editor — Cursor, Claude Desktop, VS Code, Windsurf — points at
            the same server. One source, many surfaces.
          </li>
        </UL>

        <H2 id="how-doc2mcp-works">How doc2mcp does it in 90 seconds</H2>
        <P>
          Paste a docs URL. We crawl it, detect the format (Mintlify,
          Docusaurus, OpenAPI, plain Markdown, GitBook, even a GitHub branch
          with weird slashes), infer auth and workflows, then compress endpoints
          into semantic toolkits. You get back:
        </P>
        <UL>
          <li>A generated MCP server with typed tools.</li>
          <li>Ready-to-paste configs for every major editor.</li>
          <li>
            A Docs Understanding Score so you know what the model is — and isn’t
            — going to be able to do reliably.
          </li>
        </UL>
        <Pre lang="bash">
          {`# Cursor: ~/.cursor/mcp.json
{
  "mcpServers": {
    "my-api": {
      "url": "https://mcp.doc2mcp.site/v1/<your-id>",
      "headers": { "Authorization": "Bearer ***" }
    }
  }
}`}
        </Pre>

        <H2 id="when-it-isnt-the-answer">When MCP isn’t the answer</H2>
        <P>
          Be honest about scope. If your “docs” are three half-written README
          paragraphs, generating an MCP won’t conjure structure that isn’t
          there. The score will tell you. Fix the docs first, then convert.
        </P>

        <H2 id="ship-it">Ship it</H2>
        <P>
          The fastest way to stop pasting docs is to stop pasting docs. Pick one
          vendor your team integrates with this week, generate the MCP, drop the
          config into Cursor, and watch a 40-minute integration collapse into 4.
        </P>
      </>
    ),
  },
  {
    slug: "one-mcp-six-editors",
    title: "One MCP server, six editors. Why the registry shape matters.",
    excerpt:
      "Cursor, Claude Desktop, VS Code, Windsurf, Codex and Zed all speak MCP — but they consume it differently. Here’s how doc2mcp produces a single artifact that fits all of them.",
    heroImage: "/blog/mcp-tools.png",
    heroAlt:
      "Glassmorphism cards for Cursor IDE, Claude Desktop, VS Code, Claude Code and Windsurf orbiting a glowing blue neural brain on a dark background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 28, 2026",
    readingMinutes: 5,
    tags: ["MCP", "Tooling", "Cursor", "Claude"],
    body: (
      <>
        <P>
          MCP is the closest thing the AI tooling world has to a real standard.
          That’s good news. The slightly less-good news: every editor has its
          own little dialect of <em>how</em> you wire one in.
        </P>
        <P>
          doc2mcp’s job isn’t just to generate an MCP. It’s to generate{" "}
          <em>one</em> MCP that lands cleanly in all of them, without you
          forking the artifact for each tool.
        </P>

        <H2 id="the-shape-question">The shape question</H2>
        <P>
          Think of the registry as a contract. The server exposes tools; the
          editor decides how to present them. That contract works across the
          board, but two details vary:
        </P>
        <UL>
          <li>
            <strong>Transport.</strong> Some editors prefer <Code>stdio</Code>{" "}
            (Claude Desktop, Codex), others want <Code>http</Code> with an auth
            header (Cursor, Windsurf), VS Code is happy with both.
          </li>
          <li>
            <strong>Config location.</strong> One global file, a per-workspace
            file, an in-app setting — depends on the editor.
          </li>
        </UL>

        <H2 id="what-we-ship">What we ship in the export drawer</H2>
        <P>
          Every conversion in doc2mcp ends with a one-click export panel that
          gives you copy-ready snippets for:
        </P>
        <UL>
          <li>
            <strong>Cursor</strong> — <Code>~/.cursor/mcp.json</Code>{" "}
            (workspace-scoped option below it)
          </li>
          <li>
            <strong>Claude Desktop</strong> —{" "}
            <Code>
              ~/Library/Application Support/Claude/claude_desktop_config.json
            </Code>
          </li>
          <li>
            <strong>Claude Code</strong> — project-level <Code>.mcp.json</Code>
          </li>
          <li>
            <strong>VS Code Insiders</strong> — built-in MCP picker, JSON or UI
          </li>
          <li>
            <strong>Windsurf</strong> — its <Code>mcp_config.json</Code>
          </li>
          <li>
            <strong>Codex / Zed</strong> — extension config block
          </li>
        </UL>

        <H3>Auth, properly</H3>
        <P>
          We mint a per-server bearer token at export time. It’s scoped to that
          MCP and rotatable from your dashboard. The token never appears in a
          URL, never lands in browser history, and never gets logged in
          plaintext on our side. (If your tooling logs request headers, that’s a
          conversation for your editor vendor, not your docs vendor.)
        </P>

        <H2 id="workflows">Tools you can compose, not endpoints you copy</H2>
        <P>
          The reason a single artifact works everywhere is that we don’t
          re-expose your raw routes. We group them into <em>toolkits</em>:
        </P>
        <UL>
          <li>
            <strong>User management</strong> → <Code>create_user</Code>,{" "}
            <Code>update_user</Code>, <Code>invite_member</Code>
          </li>
          <li>
            <strong>Billing</strong> → <Code>start_subscription</Code>,{" "}
            <Code>refund_payment</Code>
          </li>
          <li>
            <strong>Webhooks</strong> → <Code>register_webhook</Code> with
            inferred signing secret docs
          </li>
        </UL>
        <Quote>
          Editors don’t want 47 atomic endpoints. They want 6 verbs they can
          compose into a workflow.
        </Quote>

        <H2 id="the-test">The test we run before shipping a conversion</H2>
        <P>
          Inside doc2mcp we run a synthetic “first-use” trace against the
          generated server from each editor’s perspective. If a tool would break
          the editor’s schema (e.g. a parameter type it doesn’t accept), the
          export panel surfaces it before you paste anything.
        </P>

        <H2 id="footer">Pick one, then pick the rest</H2>
        <P>
          Most teams start with Cursor because that’s where the work happens.
          Add Claude Desktop two days later because the same MCP just works.
          That’s the whole pitch — write the docs once, generate once, ship
          everywhere.
        </P>
      </>
    ),
  },
  {
    slug: "tokens-headers-and-the-quiet-leaks",
    title: "Tokens, headers, and the quiet leaks AI apps keep shipping",
    excerpt:
      "Bearer tokens in URLs, chat IDs in console logs, Authorization headers visible to every extension on the page. A pragmatic checklist for AI app security.",
    heroImage: "/blog/security.png",
    heroAlt:
      "Glass cards labelled Bearer Token, RLS Policies, Signed Webhooks, Audit Logs and Zero Trust orbiting a glowing shield with a padlock on a dark navy background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 26, 2026",
    readingMinutes: 7,
    tags: ["Security", "MCP", "Operations"],
    body: (
      <>
        <P>
          The fastest way to leak an MCP token in 2026 is not a fancy attack.
          It’s a screenshot. A streamer Cmd-Shift-4s their editor’s settings
          panel, your bearer token sits there in plain text, and 90 seconds
          later someone is running your API on a free tier. This isn’t
          theoretical — we’ve watched it happen.
        </P>
        <P>
          When you’re shipping AI tooling, the threat model is wider than a
          normal web app. The model sees secrets. The IDE renders them. The
          browser extension on top of your app reads the DOM. Logs land in three
          different places. Here’s the checklist we apply to every doc2mcp
          release.
        </P>

        <H2 id="never-in-the-url">1. Never put secrets in the URL</H2>
        <P>
          Query strings get logged everywhere — browser history, server access
          logs, error reporters, screen recorders. A token in a path becomes a
          token in 14 places you didn’t plan for. Use{" "}
          <Code>Authorization: Bearer …</Code> headers, always.
        </P>

        <H2 id="strip-the-console">2. Strip the console</H2>
        <P>
          In dev, <Code>console.log(session)</Code> is convenient. In prod, it’s
          a beacon. We run a build-time check that fails the deploy if{" "}
          <Code>console.log</Code> ships in client bundles. The exceptions are
          structured logs that have been explicitly scrubbed.
        </P>
        <UL>
          <li>Never log tokens, refresh tokens, or signed cookies.</li>
          <li>
            Never log full request bodies on payment / auth routes — only the
            fields you need.
          </li>
          <li>
            Chat IDs are PII-adjacent. Log a hashed prefix if you must, never
            the full ID alongside an email.
          </li>
        </UL>

        <H2 id="security-headers">3. Security headers, properly set</H2>
        <P>
          We set the boring ones because they keep working when fancier defences
          fail:
        </P>
        <Pre lang="http">
          {`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()`}
        </Pre>
        <P>
          <Code>X-Frame-Options: DENY</Code> alone kills an entire class of
          clickjacking attacks on auth modals. Costs you nothing if you don’t
          embed your app in iframes.
        </P>

        <H2 id="rls">4. RLS or it didn’t happen</H2>
        <P>
          Supabase / Postgres Row-Level Security is the cheapest insurance
          policy in the industry. If your table is reachable from the public
          schema and RLS is off, you’re one missing <Code>WHERE</Code> from a
          full table dump. Turn it on, write the policy, write the negative
          test.
        </P>
        <Quote>
          Every public table without RLS is a Tuesday-morning incident waiting
          for a slow Monday.
        </Quote>

        <H2 id="signed-webhooks">5. Sign your webhooks both ways</H2>
        <P>
          Razorpay, Stripe, and friends sign their outgoing webhooks. Verify
          them with constant-time comparison (<Code>timingSafeEqual</Code>), not
          string equality, or you’re vulnerable to timing oracles. When{" "}
          <em>you</em> send a webhook out, sign it the same way and document the
          algorithm clearly.
        </P>

        <H2 id="rotate-fast">6. Rotation is a UX feature</H2>
        <P>
          If rotating an MCP token takes three pages, users will reuse the same
          token forever. We made it a one-click action with a “revoke previous
          in 60 seconds” warning. Now rotation actually happens.
        </P>

        <H2 id="closing">Boring is the goal</H2>
        <P>
          Nothing in this list is novel. That’s the point. AI security incidents
          are rarely zero-days — they’re forgotten basics, applied a little too
          late. Build the checklist into your release template and revisit it
          quarterly.
        </P>
      </>
    ),
  },
];

BLOG_POSTS.push(
  {
    slug: "your-mcp-should-auto-sync",
    title: "Your MCP should auto-sync. Here's how doc2mcp does it.",
    excerpt:
      "Vendor docs change quietly. Your AI agent doesn't notice until it ships a broken API call. Content hashing + cron + diff-aware regeneration is the fix.",
    heroImage: "/blog/auto-sync.png",
    heroAlt:
      "Glass cards labelled Diff, Auto-sync, Push, Cron and Up to date orbiting a glowing sync-icon orb on a dark navy background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 25, 2026",
    readingMinutes: 5,
    tags: ["MCP", "Sync", "Reliability"],
    body: (
      <>
        <P>
          Most "AI breaks in production" stories share a common root cause: the
          docs the model was generated against don't exist anymore. A field got
          renamed. A route got deprecated. An auth scheme moved from{" "}
          <Code>X-API-Key</Code> to a Bearer token. The model still happily
          calls the old one. The agent times out. The user blames the AI.
        </P>
        <P>
          Auto-sync is the cheapest reliability investment you can make in an AI
          stack. Here's the loop we run on every doc2mcp project.
        </P>

        <H2 id="hash">1. Hash the source, not the screenshot</H2>
        <P>
          Crawl the source URL on a fixed cadence. Normalise the response (strip
          volatile bits like timestamps, asset hashes, CSRF tokens), then
          SHA-256 it. Compare against the last stored hash. If they match, do
          nothing — you've saved a regeneration and a write.
        </P>

        <H2 id="diff">2. Diff at the tool level, not the page level</H2>
        <P>
          When the hash changes, don't just re-publish the MCP. Run the new docs
          through the same pipeline as the first conversion, then diff the{" "}
          <em>resulting toolkits</em>:
        </P>
        <UL>
          <li>
            New tool? Add it to the manifest, mark it as "new since last sync".
          </li>
          <li>
            Removed tool? Keep the slot, mark it as <Code>deprecated</Code> with
            a tombstone. Editors handle this gracefully if you don't yank the
            slot.
          </li>
          <li>
            Renamed parameter? Surface the migration in the dashboard before you
            publish.
          </li>
        </UL>
        <Quote>
          The agent doesn't care that page 14 of the docs got a new paragraph.
          It cares whether <Code>create_invoice()</Code> still accepts{" "}
          <Code>currency</Code>.
        </Quote>

        <H2 id="cron">3. Cron + webhooks, not just cron</H2>
        <P>
          Cron (we use a 24-hour default) catches the long-tail. Webhooks catch
          the same-day changes. We accept push webhooks from supported docs
          platforms (Mintlify, GitBook, GitHub on a docs branch) and treat them
          as "regenerate immediately, skip the next cron tick".
        </P>

        <H2 id="rollback">4. Snapshot every successful sync</H2>
        <P>
          Every sync that produces a valid MCP gets a snapshot. Roll back is a
          one-click revert to any previous snapshot. This single feature has
          saved more incidents in production than every retry policy we've ever
          written, combined.
        </P>

        <H2 id="ship">5. Auto-sync the metadata, not the experience</H2>
        <P>
          Users shouldn't have to refresh anything. The MCP URL stays identical,
          the bearer token stays identical, the editor never reconnects. The
          toolkit just gets quietly better while everyone sleeps.
        </P>
        <P>
          Flip it on in your project settings. It's free for the first
          regeneration each week and included unlimited on Pro.
        </P>
      </>
    ),
  },
  {
    slug: "the-openapi-myth",
    title: "OpenAPI is not docs. Stop shipping it to your AI agent.",
    excerpt:
      "Swagger specs are necessary, not sufficient. Routes don't tell a model when to call which endpoint. Workflows do.",
    heroImage: "/blog/openapi.png",
    heroAlt:
      "Glass cards labelled JSON Schema, REST Routes, OpenAPI 3.1, Webhooks and v2.1.0 orbiting a glowing schema-tree sphere on a dark navy background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 22, 2026",
    readingMinutes: 6,
    tags: ["MCP", "OpenAPI", "Workflow"],
    body: (
      <>
        <P>
          Every team I talk to that's building "an MCP from our API" thinks
          they're done once they have an OpenAPI spec. They are not done.
          They've just finished step one of four.
        </P>
        <P>
          An OpenAPI spec is a great machine-readable inventory. It tells you{" "}
          <em>what exists</em>. It doesn't tell the model{" "}
          <em>when to use what</em>. That gap is where AI agents fall apart.
        </P>

        <H2 id="inventory">Inventory ≠ instructions</H2>
        <P>
          Look at any decent SaaS API. You'll find dozens of routes that
          overlap:
        </P>
        <Pre lang="http">
          {`POST   /users                   create a user
POST   /users/invite            invite a user
POST   /workspaces/:id/members  add to workspace
PUT    /memberships/:id         move between workspaces`}
        </Pre>
        <P>
          A naive MCP exposes all four. The model picks one based on tokenised
          name similarity to your prompt. Half the time it picks wrong, and the
          failure mode is silent — it returns a 200 with the <em>wrong</em> user
          in the wrong workspace.
        </P>

        <H2 id="workflows">Workflows are the unit of usefulness</H2>
        <P>
          The doc2mcp pipeline groups routes into <em>workflows</em>: chains of
          calls that map to one human-intent. The four routes above become one
          tool:
        </P>
        <Pre lang="ts">
          {`onboard_user({ email, role, workspaceId }) {
  // POST /users
  // POST /workspaces/:id/members
  // returns { userId, membershipId }
}`}
        </Pre>
        <P>
          The model now has <em>one</em> obvious choice for "add a teammate to
          our workspace". Failure rate collapses, because there's nothing
          adjacent to pick wrong.
        </P>

        <H2 id="auth">Auth is part of the workflow, not a footnote</H2>
        <P>
          Most OpenAPI specs declare auth at the schema level and forget about
          it. We treat auth as the first step of every workflow. The tool's
          first call is to verify the token's scopes match the operation; if
          they don't, we return a structured error the model knows how to act on
          (refresh, escalate, or stop).
        </P>

        <H2 id="versions">Versions are workflows too</H2>
        <P>
          When v2 of an API ships, the old workflow shouldn't vanish. It should
          be marked <Code>deprecated_in: 2.1.0</Code>, with a machine-readable
          migration block pointing at the new workflow. The MCP serves both for
          a grace period. Your agent fleet migrates gradually instead of
          all-at-once.
        </P>

        <H2 id="checklist">A small checklist before you ship</H2>
        <UL>
          <li>
            Group overlapping routes into a single semantic tool, even if it's
            three HTTP calls underneath.
          </li>
          <li>
            Include the success criteria in the tool description, not just the
            parameters.
          </li>
          <li>Bake auth verification into the first step of every workflow.</li>
          <li>
            Mark deprecated routes with their replacement. Don't yank them.
          </li>
        </UL>
        <Quote>
          OpenAPI tells the model what exists. doc2mcp tells the model what to
          do.
        </Quote>
      </>
    ),
  },
  {
    slug: "observability-for-agents",
    title: "Observability for AI agents: what to log when the model is the bug",
    excerpt:
      "Latency, cold starts, token burn, error rates, traces. The five panels every team running an agent in production should be staring at by week two.",
    heroImage: "/blog/observability.png",
    heroAlt:
      "Glass cards labelled Latency p95, Cold Starts, Token Burn, Error Rate and Traces orbiting a glowing EKG-pulse sphere on a dark navy background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 19, 2026",
    readingMinutes: 7,
    tags: ["Observability", "Production", "Cost"],
    body: (
      <>
        <P>
          The first agent your team ships will work great in demos and fall over
          silently in production. Not because the model is bad — because you
          can't see what it's doing. Observability for AI agents is different
          from observability for regular services in three uncomfortable ways:
        </P>
        <UL>
          <li>
            The unit of work is variable — one prompt can fan out to 14 tool
            calls.
          </li>
          <li>
            The dominant cost is tokens, not CPU. You can be 100% available and
            bankrupt.
          </li>
          <li>
            Failures are often "wrong answer", not "exception". Status codes
            don't catch them.
          </li>
        </UL>

        <H2 id="panel-1">Panel 1 — Latency p95, per tool</H2>
        <P>
          Don't average. Watch p95, broken out per tool, with a small sparkline.
          The 5% of calls hitting a 4-second cold start are the ones your users
          actually feel. We alert on a p95 jump larger than <Code>1.5x</Code>{" "}
          the rolling 24-hour baseline.
        </P>

        <H2 id="panel-2">Panel 2 — Cold start rate</H2>
        <P>
          If you're running serverless tools, the first call to a cold lambda
          can be ten times your usual latency. Track cold starts as a
          first-class metric, not a footnote in latency. Pin the hot path
          (high-traffic tools) to provisioned concurrency.
        </P>

        <H2 id="panel-3">Panel 3 — Token burn</H2>
        <P>
          Two numbers: tokens-in and tokens-out, per route, per minute. Multiply
          by your model's per-million-token rate to get a live cost dial. The
          first time you watch a spike correlate with a single looping prompt,
          you'll never not track this.
        </P>
        <Pre lang="text">
          {`alert: token_burn_per_minute > 4x rolling_15min_baseline
window: 5m
notify: oncall
`}
        </Pre>

        <H2 id="panel-4">Panel 4 — Error rate, by class</H2>
        <P>Bucket your errors:</P>
        <UL>
          <li>
            <strong>Hard errors</strong> — 5xx, timeouts, tool-not-found. Page
            someone.
          </li>
          <li>
            <strong>Soft errors</strong> — 4xx the model could recover from
            (auth, rate limit, validation). Track the recovery rate.
          </li>
          <li>
            <strong>Wrong-answer signals</strong> — user thumbs-down, follow-up
            edits within 30s, "let me try again" patterns. The hardest to
            measure, the most important.
          </li>
        </UL>

        <H2 id="panel-5">Panel 5 — Traces with tool spans</H2>
        <P>
          Every conversation = one trace. Every tool call = one span. Even a
          cheap version of this (just a flat list with timing) makes the
          difference between "the agent is slow" and "the third call to{" "}
          <Code>search_docs</Code> took 2.3s because we paginated wrong".
        </P>

        <H2 id="alerts">Three alerts worth waking up for</H2>
        <UL>
          <li>p95 latency on the primary user-facing tool &gt; 3s for 5 min</li>
          <li>token burn &gt; 4× baseline for 5 min</li>
          <li>thumbs-down rate &gt; 5% in any 100-message window</li>
        </UL>
        <Quote>
          You don't ship a model. You ship a system. The system needs the same
          observability hygiene your CRUD apps already have.
        </Quote>
      </>
    ),
  },
  {
    slug: "agents-are-just-tools-and-loops",
    title: "Agents are just tools and loops. Stop overthinking it.",
    excerpt:
      "Strip the marketing. An AI agent is a model with a set of typed tools, a planner, and a stopping rule. Treat it that way and shipping gets boring (good).",
    heroImage: "/blog/agents.png",
    heroAlt:
      "Glass cards labelled Deploy Agent, Plan Task, Browse Web, Run Tools and Talk Back orbiting a glowing terminal-cursor orb on a dark navy background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 16, 2026",
    readingMinutes: 5,
    tags: ["Agents", "Architecture"],
    body: (
      <>
        <P>
          There's a version of "AI agent" that involves orchestration diagrams,
          swarm topologies, and a 6-month migration plan. Then there's the
          version that actually ships and makes money. It's smaller than you
          think.
        </P>

        <H2 id="three-pieces">Three pieces. That's it.</H2>
        <UL>
          <li>
            <strong>Tools.</strong> Typed inputs, typed outputs, a clear
            description. This is your MCP server.
          </li>
          <li>
            <strong>A loop.</strong> Read the user message, decide which tools
            to call, call them, observe results, decide again.
          </li>
          <li>
            <strong>A stopping rule.</strong> Either "I have an answer" or "I
            tried N times and need to escalate".
          </li>
        </UL>

        <H2 id="not-three-pieces">What you don't need (yet)</H2>
        <UL>
          <li>
            A vector DB. Most agents do better with a tool that calls a real
            search service.
          </li>
          <li>
            A framework. The loop is twenty lines of code. Writing it yourself
            is faster than learning someone else's abstractions.
          </li>
          <li>
            A custom model. The frontier ones are good enough. Spend the time on
            better tools.
          </li>
        </UL>

        <H2 id="loop">The loop, in 20 lines</H2>
        <Pre lang="ts">
          {`async function run(userMessage: string) {
  const messages = [systemPrompt, { role: "user", content: userMessage }];
  for (let step = 0; step < MAX_STEPS; step++) {
    const reply = await llm.complete({ messages, tools });
    messages.push(reply);
    if (!reply.toolCalls?.length) {
      return reply.content; // done
    }
    for (const call of reply.toolCalls) {
      const result = await tools[call.name](call.args);
      messages.push({ role: "tool", id: call.id, content: result });
    }
  }
  return "I tried and got stuck. Escalating.";
}`}
        </Pre>

        <H2 id="stopping">Stopping rules matter more than planning</H2>
        <P>
          A bad agent loops forever or quits too early. <Code>MAX_STEPS</Code>{" "}
          is a blunt fix. Better: track per-tool success rate inside the loop,
          and stop when you've made three consecutive "useless" calls (returned
          no new information).
        </P>

        <H2 id="boring">Shipping should be boring</H2>
        <Quote>
          The agents that make money in 2026 are the ones with five
          well-described tools and a 25-line loop, not the ones with 50 tools
          and a hand-tuned planner.
        </Quote>
        <P>
          doc2mcp focuses on the first part — making tool definitions that the
          model can actually use without copy-paste. The loop is yours. Keep it
          small.
        </P>
      </>
    ),
  },
  {
    slug: "prompting-still-matters",
    title: "Prompting still matters. Here's the cheap stuff that works.",
    excerpt:
      "You don't need a 4,000-token system prompt to ship a good AI feature. You need clear roles, three examples, and a stopping condition. Here's a working template.",
    heroImage: "/blog/prompting.png",
    heroAlt:
      "Glass cards labelled System Prompt, Temperature, Chain of Thought, Tool Calls and Evals orbiting a glowing prompt-input sphere on a dark navy background.",
    author: { name: "Gautam Manak", role: "Founder, doc2mcp" },
    publishedOn: "May 12, 2026",
    readingMinutes: 6,
    tags: ["Prompting", "Practical"],
    body: (
      <>
        <P>
          Prompt engineering went from "the future of jobs" to "kind of
          embarrassing to talk about" in 18 months. Both takes are wrong. A good
          prompt is still the cheapest reliability lever you have, it just
          doesn't have to be precious.
        </P>

        <H2 id="four-blocks">Four blocks. Always the same four.</H2>
        <P>
          Every system prompt we ship in production has exactly four sections:
        </P>
        <Pre lang="text">
          {`1. Role        — who the model is, in one sentence
2. Capabilities — what tools/data it has
3. Style       — how to format, what to avoid
4. Stop rule   — when to ask vs guess vs escalate`}
        </Pre>
        <P>
          That's it. The 4,000-token monstrosities you see online are 90%
          ritual. The model isn't reading them as carefully as you think.
        </P>

        <H2 id="examples">Three examples beat ten rules</H2>
        <P>
          Models learn faster from examples than from constraints. Pick the edge
          cases that broke you in dev. Show them as input → expected output. Two
          or three is usually enough. The "few-shot" framing isn't magic, it's
          just clearer than prose.
        </P>

        <H2 id="temperature">Temperature is a setting, not a religion</H2>
        <P>
          For tool calls and structured outputs, <Code>temperature: 0</Code> (or
          close). For brainstorming and copy, 0.7–1.0. There is no principled
          reason to use 0.5 — that's the "I have no idea" temperature.
        </P>

        <H2 id="cot">Chain-of-thought, with restraint</H2>
        <P>
          Asking the model to "think step by step" still works on hard reasoning
          tasks. It also adds latency and tokens. We only enable it on the
          routes where evals show it actually moves the needle. Default off, opt
          in.
        </P>

        <H2 id="evals">Cheap evals, today</H2>
        <P>
          Set up the smallest possible eval before you ship: 20 hand-picked
          inputs with expected outputs (or "must include" substrings). Run them
          in CI on every prompt change. You'll catch 80% of regressions and feel
          a lot more comfortable touching the prompt at 3 AM.
        </P>
        <Pre lang="ts">
          {`for (const { input, expect } of cases) {
  const out = await runAgent(input);
  assert.ok(out.includes(expect), \`failed: \${input}\`);
}`}
        </Pre>

        <H2 id="template">A template you can paste</H2>
        <Pre lang="markdown">
          {`# Role
You are doc2mcp's onboarding assistant. You help developers paste a docs URL and ship a working MCP server.

# Capabilities
You can call:
- search_docs(query)
- generate_mcp(url)
- explain_config(editor)

# Style
- Be direct. No filler intros.
- If the user pastes a URL, generate immediately. Don't ask for confirmation.
- Use short, scannable answers with code blocks.

# Stop rule
- If a tool fails twice in a row, surface the error verbatim and stop.
- If the user asks for advice outside MCP/docs/AI tooling, politely redirect.`}
        </Pre>
        <Quote>
          You don't need a prompt longer than your function. You need a prompt
          that tells the model exactly when to stop guessing.
        </Quote>
      </>
    ),
  }
);

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
