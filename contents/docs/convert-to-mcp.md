---
title: Convert docs to MCP
nav_title: Convert docs to MCP
description: End-to-end path from a documentation URL to a live, hosted MCP server.
category: Guides
order: 0
---

## Overview

This guide walks the full **docs → agent** pipeline: you provide a URL, doc2mcp crawls and
indexes it, then hosts a remote MCP endpoint your tools can query.

## Why it matters

Manual MCP builds break when docs move, versions multiply, or new pages ship. doc2mcp
automates discovery, chunking, tool generation, and hosting so you stay on product work.

![The doc2mcp pipeline](/diagrams/pipeline.svg)

## Step-by-step

### 1. Input — documentation URL

Paste the **docs root**, not the marketing homepage:

```text
https://docs.stripe.com
https://supabase.com/docs
https://github.com/org/repo/tree/main/docs
```

### 2. Crawling — smart discovery

doc2mcp follows sitemaps, nav links, and common doc frameworks (Mintlify, Docusaurus,
GitBook, ReadMe, plain HTML). OpenAPI specs and README trees are supported.

### 3. Knowledge processing — chunks that retrieve well

Pages are split into **heading-aware sections** with breadcrumbs. Code blocks and tables
stay attached to the section they belong to.

### 4. MCP generation — tools agents actually use

Typical tools on every server:

| Tool | Purpose |
|------|---------|
| `list_documentation_pages` | See what was crawled |
| `search_documentation` | Keyword / question search with citations |
| `get_documentation_page` | Full page text by URL or id |
| `ask_documentation` | Natural-language Q&A over the index |

### 5. Deployment — hosted endpoint

You receive a URL and Bearer token. No cluster to run for the hosted product.

```json
{
  "mcpServers": {
    "myapi": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": { "Authorization": "Bearer <project-token>" }
    }
  }
}
```

### 6. Verify — ask an agent

Connect [Cursor](/docs/connect-cursor) or [Claude](/docs/connect-claude), then:

```text
Using the myapi docs MCP, how do I authenticate API requests? Cite the page.
```

## Best practices

- Use a **dedicated project per product version** when docs diverge (v1 vs v2).
- Re-convert after major doc restructures.
- For private docs, see [Convert private documentation](/docs/private-docs).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Few pages indexed | Paste the `docs.` subdomain; check robots.txt |
| Duplicate tools in config | One server id per hostname |
| Slow crawl | Large sites may take 1–3 minutes — watch the convert page |
