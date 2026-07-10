---
title: Documentation crawling
description: How doc2mcp discovers and fetches documentation across many formats.
category: Core Concepts
order: 1
---

## Overview

Crawling is the first pipeline stage: discover every relevant page and fetch it
while preserving structure (headings, code blocks, links).

## Why it matters

Documentation lives in many shapes — static sites, SPAs, OpenAPI specs, GitBook,
GitHub markdown. A single naive scraper misses most of it. doc2mcp picks the
right strategy per source.

## How discovery works

1. **`llms.txt` / `llms-full.txt`** — Mintlify, OpenAI, Anthropic, Stripe, and
   LangChain expose these manifests; every listed URL is queued.
2. **Sitemap & links** — when no manifest exists, doc2mcp falls back to the
   sitemap and on-page links.
3. **Web search assist** — optionally enriches thin sites.

## Fetch strategy

For each page, doc2mcp tries the cleanest source first:

```text
${url}.md  →  ${url}.mdx  →  HTML (code-preserving)  →  Jina Reader (SPA shells)
```

## Supported source formats

| Format | Examples | Strategy |
|--------|----------|----------|
| Mintlify docs site | `docs.anthropic.com`, `docs.stripe.com` | `llms.txt` + per-page `.md` |
| Docusaurus / GitBook / Nextra | `docs.nestjs.com`, `nextjs.org/docs` | HTML crawl, code-preserving |
| GitBook | `*.gitbook.io` | GitBook-aware crawl |
| OpenAPI (JSON/YAML) | `…/openapi.json`, `…/spec.yml` | Parse → one page per endpoint |
| Postman collection | `…/collection.json` | Treated as API spec |
| GitHub repo | `github.com/org/repo` | README + `/docs`, `/examples` markdown |
| Raw markdown | `…/README.md` | Single file, frontmatter parsed |

## Auto-detection

doc2mcp chooses a handler from URL extension, hostname, path hints
(`/openapi`, `/swagger`), and content sniffing (`"openapi":` keys). If you paste
a marketing homepage, it redirects to the docs subdomain automatically.

## Best practices

- Prefer the canonical docs URL with an `llms.txt` when available — it produces
  the cleanest, most complete crawl.
- For private/internal docs, ensure the URL is reachable from the internet.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Zero pages | URL blocked or JS-only shell | Use docs subdomain; Jina fallback kicks in |
| Missing pages | No manifest/sitemap | Re-run; link crawl is best-effort |
| Garbled code | Aggressive HTML | doc2mcp preserves `<pre><code>` — report the URL |
