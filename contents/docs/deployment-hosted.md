---
title: Hosted version
description: The fully managed doc2mcp service — the recommended way to use it.
category: Deployment
order: 1
---

## Overview

The hosted version at [doc2mcp.site](https://doc2mcp.site) is the recommended
way to use doc2mcp. Conversions, hosting, retrieval, and the MCP endpoints are
all managed for you.

## Why it matters

There is nothing to operate: no crawler infrastructure, no database, no servers
to scale. You paste a URL and get a live endpoint.

## What's managed

| Concern | Hosted |
|---------|--------|
| Crawling pipeline | Managed |
| Knowledge index | Managed (Postgres) |
| MCP endpoint hosting | Managed |
| Token issuance + auth | Managed |
| Uptime / scaling | Managed |

## Step-by-step

1. Sign in at [doc2mcp.site](https://doc2mcp.site).
2. Convert a docs URL ([Quick start](/docs/quickstart)).
3. Connect your client ([Agent compatibility](/docs/agent-compatibility)).

## Best practices

- Use the hosted version unless you have a strict data-residency or air-gapped
  requirement — then see [Self hosted](/docs/self-hosted).
