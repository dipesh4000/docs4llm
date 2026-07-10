---
title: Retrieval layer
description: Heading-aware section search that returns the right context with citations.
category: Core Concepts
order: 3
---

## Overview

The retrieval layer answers the question: *given a query, which documentation
sections matter?* It returns ranked, deduplicated sections with breadcrumbs and
source URLs.

![Retrieval layer](/diagrams/retrieval.svg)

## Why it matters

Retrieval quality is what separates a grounded answer from a hallucination. By
returning one result per section — not per page — agents get focused, citable
context.

## How it works

1. The agent calls `search_documentation` with a query.
2. doc2mcp matches against heading-aware chunks and ranks by relevance.
3. Results are deduplicated per section and returned with breadcrumbs + URLs.
4. `ask_documentation` goes one step further: it synthesizes a cited answer from
   the top sections.

## Example

```text
query: "How does authentication work?"

→ 1. Auth › API keys        (docs.example.com/auth#api-keys)
  2. Auth › Bearer tokens   (docs.example.com/auth#bearer)
  3. Auth › OAuth flow      (docs.example.com/auth#oauth)
```

## Tools

| Tool | Returns |
|------|---------|
| `search_documentation` | Ranked sections (snippet + breadcrumb + URL) |
| `get_documentation_page` | Full text of one page |
| `ask_documentation` | Synthesized answer with citations |
| `read_full_documentation` | Everything, for broad context |

## Best practices

- Use `search_documentation` for targeted lookups; `read_full_documentation`
  only when you truly need the whole corpus.
- Pass a `limit` to `search_documentation` (default 10, max 30) to control
  breadth.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Irrelevant results | Make the query more specific / use section keywords |
| Missing a known page | Re-run the conversion to refresh the index |
