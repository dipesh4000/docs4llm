---
title: What is doc2mcp?
description: Documentation infrastructure that makes any docs site usable by AI agents.
category: Getting Started
order: 2
---

## Overview

doc2mcp is **documentation infrastructure for AI agents**. It takes a
documentation URL and turns it into a hosted [MCP](/docs/faq) server — a live
endpoint that AI tools like Cursor and Claude can query to read your docs, search
them, and answer questions with citations.

It is not just an "MCP generator". Generating a config file is the last step of a
full pipeline: crawling, knowledge processing, retrieval, and serving.

![The doc2mcp pipeline](/diagrams/pipeline.svg)

## Why it matters

AI agents are only as good as the context they can reach. Without structured
access to your documentation, an agent guesses — inventing endpoints, parameters,
and behavior that does not exist. doc2mcp gives the agent the real source,
on demand, so answers are grounded in your actual docs.

> **Tip** If you have ever watched an AI confidently hallucinate an API that
> isn't real, that is the gap doc2mcp closes.

## Example

Paste a docs URL:

```text
https://docs.stripe.com
```

You get back a hosted endpoint and a token:

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": { "Authorization": "Bearer <project-token>" }
    }
  }
}
```

Now any MCP-compatible agent can call tools like `search_documentation` or
`ask_documentation` against the real Stripe docs.

## What your agent can do

The generated server exposes these tools:

| Tool | Purpose |
|------|---------|
| `list_documentation_pages` | Enumerate every crawled page |
| `get_documentation_page` | Fetch the full text of one page |
| `search_documentation` | Heading-aware section search |
| `read_full_documentation` | All pages as one markdown blob |
| `ask_documentation` | Natural-language Q&A with citations |

## Best practices

- Point doc2mcp at the **docs subdomain** (`docs.example.com`), not the marketing
  homepage.
- Re-run a conversion when the source docs change to keep the index fresh.
- Treat the project token like a read-only API key.
