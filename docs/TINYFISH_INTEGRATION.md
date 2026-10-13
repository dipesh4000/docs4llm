# TinyFish Autonomous Agent Crawler Integration

This document specifies the integration of **TinyFish** (`@tiny-fish/sdk`) as the primary autonomous crawling engine in Docs4LLM (Step 2 of the pipeline).

---

## 1. Why TinyFish?

### The Problem with Traditional Crawlers
Most modern documentation platforms (Mintlify, GitBook, Nextra, Docusaurus, ReadMe) are built as **Single Page Applications (SPAs)** using React or Vue:
1. **Empty Shells:** Traditional HTTP fetchers (`fetch()`, `axios`, `cheerio`) only receive empty `<div id="root"></div>` tags before JavaScript executes.
2. **Anti-Bot Defenses:** Documentation sites for major tech companies (Stripe, Cloudflare, OpenAI) deploy Cloudflare Turnstile, CAPTCHAs, or IP-based rate limiters that block serverless workers.
3. **Layout Pollution:** Static HTML dumps include megamenus, cookie banners, feedback widgets, and footer navigation that clutter AI agent prompts.

### The TinyFish Solution
TinyFish is an AI-native browser automation and scraping cloud service. It:
- Executes JavaScript in headless cloud browsers and waits for client-side DOM hydration.
- Bypasses Cloudflare and bot-detection challenges automatically.
- Traverses navigation sidebars autonomously using a high-level goal prompt.
- Extracts clean, unpolluted GitHub-Flavored Markdown directly.

---

## 2. Integration Architecture

Docs4LLM interacts with TinyFish via its official TypeScript SDK:

```bash
pnpm add @tiny-fish/sdk
```

### Environment Configuration
```env
TINYFISH_API_KEY="sk-tinyfish-your-api-key"
```

---

## 3. Implementation Blueprint

### Agent Orchestration Code
Located at [`services/ingestion/tinyfish-agent.ts`](https://github.com/dipesh4000/docs4llm/blob/main/services/ingestion/tinyfish-agent.ts):

```typescript
import { TinyFish, RunStatus } from "@tiny-fish/sdk";
import type { CrawlResult } from "@/types/platform";

// Automatically reads TINYFISH_API_KEY from environment
const client = new TinyFish({
  apiKey: process.env.TINYFISH_API_KEY,
});

export async function crawlDocsWithTinyFish(
  rootUrl: string,
  maxPages = 40
): Promise<CrawlResult[]> {
  // Operational goal instructed to TinyFish autonomous browser agent
  const goalPrompt = `
    You are an expert technical documentation scraper.
    Explore this documentation website starting at: ${rootUrl}.
    Traverse the navigation sidebar, API references, tutorials, and guides.
    Extract the clean markdown for each documentation page as JSON:
    [
      { "url": string, "title": string, "markdown": string }
    ]
    Preserve code blocks with language tags, tables, and section headings.
    Omit headers, footers, cookie banners, and navigation menus.
    Limit your exploration to at most ${maxPages} key documentation pages.
  `.trim();

  // Run autonomous browser agent session
  const run = await client.agent.run({
    url: rootUrl,
    goal: goalPrompt,
  });

  if (run.status !== RunStatus.COMPLETED) {
    throw new Error(`TinyFish agent run failed with status: ${run.status}`);
  }

  // Parse extracted pages from agent result
  const pages: Array<{ url: string; title: string; markdown: string }> =
    typeof run.result === "string" ? JSON.parse(run.result) : run.result;

  return pages.map((page) => ({
    url: page.url,
    title: page.title || "Documentation Page",
    content: page.markdown,
    type: categorizePage(page.url, page.title, page.markdown),
  }));
}

function categorizePage(
  url: string,
  title: string,
  content: string
): CrawlResult["type"] {
  const lower = `${url} ${title} ${content.slice(0, 500)}`.toLowerCase();
  if (lower.includes("api") || lower.includes("endpoint") || lower.includes("reference")) {
    return "api";
  }
  if (lower.includes("auth") || lower.includes("oauth") || lower.includes("api key") || lower.includes("token")) {
    return "auth";
  }
  if (lower.includes("workflow") || lower.includes("tutorial") || lower.includes("quickstart")) {
    return "workflow";
  }
  return "page";
}
```

---

## 4. Fallback & Resilience Strategy

If an edge-case site times out during multi-page autonomous traversal, Docs4LLM implements a 2-tier graceful degradation:

```mermaid
graph TD
    A[Start Ingestion] --> B[TinyFish Agent API - Autonomous Multipage]
    B -->|Success| E[Return CrawlResult[]]
    B -->|Timeout / Exception| C[TinyFish Direct Fetch API api.fetch.tinyfish.ai]
    C -->|Success| E
    C -->|Failure| D[Local Jina Reader Fallback r.jina.ai]
    D --> E
```

1. **Primary:** TinyFish Agent API (`client.agent`) explores the site and discovers up to 40 pages.
2. **Tier 1 Fallback:** TinyFish Direct Fetch API (`api.fetch.tinyfish.ai`) renders the primary root page and known sitemap links directly.
3. **Tier 2 Fallback:** Jina Reader (`r.jina.ai/<url>`) acts as a last-resort markdown proxy.

---

## 5. Performance & SLA Guarantees

- **Target Execution Time:** 25–40 seconds for full multi-page traversal.
- **Deduplication:** TinyFish results are passed through SHA-256 content hashes to eliminate duplicate pages (e.g. pagination or aliased links).
- **Concurrency:** Up to 6 simultaneous page extraction workers within the TinyFish cloud cluster.
