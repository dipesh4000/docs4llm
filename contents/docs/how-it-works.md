---
title: How it works
description: The full pipeline from a pasted URL to a live MCP server.
category: Getting Started
order: 4
---

## Overview

When you paste a documentation URL, doc2mcp runs a multi-stage pipeline
server-side. Nothing runs on your machine.

![The doc2mcp pipeline](/diagrams/pipeline.svg)

## Why it matters

Each stage exists to turn unstructured documentation into **retrievable,
callable knowledge** — the difference between an agent that guesses and one that
reads your real docs.

## The stages

1. **Documentation** — you provide any docs URL (site, OpenAPI spec, GitBook,
   GitHub repo, or raw markdown).
2. **Crawling** — doc2mcp discovers pages via `llms.txt`, sitemaps, and links,
   then fetches each one, preserving code blocks and headings.
   See [Documentation crawling](/docs/crawling).
3. **Knowledge processing** — pages are cleaned and split into heading-aware
   chunks, and an index (`llms.txt`) is built.
   See [Knowledge processing](/docs/knowledge-processing).
4. **Retrieval** — a section-aware search layer ranks the most relevant chunks
   for any query. See [Retrieval layer](/docs/retrieval).
5. **MCP generation** — a hosted JSON-RPC endpoint and a scoped token are minted.
   See [MCP generation](/docs/mcp-generation).
6. **AI agents** — Cursor, Claude, and others connect to the endpoint and call
   tools. See [Agent compatibility](/docs/agent-compatibility).

## System architecture

The conversion (write) path and the agent-query (read) path share one database.

![doc2mcp system architecture](/diagrams/architecture.svg)

- **Write path:** `POST /api/convert` creates the project and token, then a
  background pipeline crawls, chunks, and analyzes into Postgres.
- **Read path:** agents call `GET/POST /api/mcp/{projectId}/mcp` with the Bearer
  token; the endpoint reads only that project's data.

## Example

```bash
# Conversion is kicked off for you from the app, but the shape is:
curl -X POST https://doc2mcp.site/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://docs.stripe.com"}'
```

## Best practices

- Larger doc sites take longer to crawl — the status moves through
  `crawling → analyzing → generating → ready`.
- If a crawl returns zero pages, check the URL is the docs site and publicly
  reachable.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Stuck on `crawling` | Large site or slow origin | Wait; status polls automatically |
| `error` immediately | Marketing page or blocked URL | Use the `docs.` subdomain |
| Few pages indexed | No `llms.txt`/sitemap | doc2mcp falls back to link crawl; re-run |
