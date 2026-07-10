---
title: Knowledge processing
description: How crawled pages become clean, chunked, retrievable knowledge.
category: Core Concepts
order: 2
---

## Overview

Once pages are fetched, doc2mcp cleans, structures, and indexes them so they can
be retrieved precisely — not dumped wholesale into a model's context.

## Why it matters

Raw documentation is noisy: navigation, footers, duplicated boilerplate. Feeding
it directly to an agent is slow, costly, and low-signal. Processing turns pages
into **heading-aware sections** that map cleanly to questions.

## What happens

1. **Normalize** — strip chrome, keep headings, code, tables, and links as
   markdown.
2. **Heading-aware chunking** — split each page along its heading hierarchy so a
   chunk is a coherent section with a breadcrumb (e.g. `Auth › API keys`).
3. **Analyze** — extract API endpoints, auth patterns, and workflows; build a
   compressed `llms.txt` index for agents.
4. **Score** — a quality score estimates docs completeness and MCP reliability.

## Example

A page like `Authentication` becomes sections:

```text
Authentication › API keys
Authentication › Bearer tokens
Authentication › OAuth flow
```

Each is independently retrievable, so "how do bearer tokens work?" returns the
exact section instead of the whole page.

## Best practices

- Well-structured source docs (clear `##`/`###` headings) chunk best.
- Pages with meaningful code blocks retrieve better — doc2mcp keeps them intact.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Low quality score | Source docs are thin; add more detail upstream |
| Chunks too broad | Source lacks headings; results still rank, just coarser |
