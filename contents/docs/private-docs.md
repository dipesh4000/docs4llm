---
title: Convert private documentation
description: Turn internal or private docs into an MCP your team's agents can use.
category: Guides
order: 6
---

## Overview

doc2mcp works with internal documentation as well as public sites — as long as
the docs URL is reachable when the crawl runs.

## Why it matters

Your most valuable context is often internal: platform docs, runbooks, internal
API references. Making it agent-accessible is where doc2mcp pays off most.

## Step-by-step

1. Confirm the docs URL is reachable from the internet (a hosted internal docs
   site, a published GitBook space, or a GitHub repo doc2mcp can read).
2. Convert it exactly like a public site.
3. Distribute the project token to your team through a secrets manager — not
   chat or commits.

> **Warning** Anyone with the project URL + token can read that project's
> crawled docs. Treat it as a read-only credential.

## Options for truly private sources

| Source | Approach |
|--------|----------|
| Internal docs site | Expose a read-only hosted URL doc2mcp can fetch |
| Private GitHub repo | Use a repo doc2mcp is authorized to read |
| Behind SSO/VPN | Not directly crawlable — publish a reachable mirror |

## Best practices

- Scope tokens per source and rotate by re-running conversions.
- Re-crawl after major internal doc changes to keep answers current.
- For stricter isolation, see [Access control](/docs/access-control) and
  [Self hosted](/docs/self-hosted).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Crawl returns nothing | URL not reachable publicly — publish a mirror |
| Auth-walled pages skipped | Provide an unauthenticated docs URL |
