---
title: Why docs4llm?
description: Why a documentation infrastructure layer beats building MCP servers by hand.
category: Getting Started
order: 3
---

## Overview

You *could* build an MCP server for every documentation source yourself. docs4llm
exists because doing that well — crawling, chunking, ranking, hosting, securing,
and keeping it fresh — is a real engineering project, repeated for every doc site.

## Why it matters

Hand-built doc MCP servers tend to share the same problems:

- **Crawling is fragile.** Modern docs are SPAs, OpenAPI specs, GitBook, GitHub
  markdown — each needs a different strategy.
- **Raw dumps don't retrieve well.** Pasting a whole site into context is slow,
  expensive, and low-signal.
- **Hosting and auth are yours to operate.** You now run a service.
- **Docs change.** A static export is stale the day after you build it.

docs4llm handles all of this as managed infrastructure.

## Comparison

| | Build it yourself | docs4llm |
|--|------------------|---------|
| Crawl strategy | Per-site, manual | Auto-detected |
| Retrieval | DIY chunking/ranking | Heading-aware, built in |
| Hosting | You operate it | Hosted endpoint |
| Auth | You implement it | Per-project Bearer token |
| Freshness | Manual re-export | Re-run / sync |
| Time to first MCP | Hours–days | Under 5 minutes |

## Example

Without docs4llm, giving Cursor access to three doc sites means three crawlers,
three indexes, and three servers to host. With docs4llm it is three pasted URLs.

## Best practices

- Use docs4llm for **third-party docs** your agents need (APIs, SDKs, frameworks).
- Use it for **internal docs** too — point it at a private docs site behind a
  reachable URL.
- Standardize on one MCP endpoint per source so configs stay portable across
  Cursor, Claude, and the rest.
