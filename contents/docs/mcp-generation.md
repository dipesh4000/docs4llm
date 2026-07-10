---
title: MCP generation
description: How doc2mcp mints a hosted, secured MCP endpoint for your docs.
category: Core Concepts
order: 4
---

## Overview

MCP generation is the final stage: a hosted JSON-RPC endpoint plus a scoped
token, ready to paste into any MCP client.

## Why it matters

The endpoint is what agents actually talk to. doc2mcp hosts it, so there is no
server for you to deploy, scale, or secure.

## What gets generated

- **Endpoint** — `GET/POST /api/mcp/{projectId}/mcp`, speaking JSON-RPC 2.0.
- **Token** — a random, URL-safe Bearer token (`d2mcp_…`). Only its SHA-256 hash
  is stored; the raw token is shown once.
- **Tool set** — the documentation tools plus any extracted, source-specific
  tools.
- **Client configs** — ready-made JSON for Cursor, Claude, VS Code, Windsurf,
  and OpenAI Agents.

## Example

```json
{
  "name": "stripe",
  "version": "1.0.0",
  "cursorConfig": {
    "mcpServers": {
      "stripe": {
        "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
        "headers": { "Authorization": "Bearer <project-token>" }
      }
    }
  }
}
```

## Security model

- Tokens are scoped to a **single project** — they cannot read any other
  project, even on the same account.
- Requests are verified with a constant-time hash comparison.
- See [Security](/docs/security) and [Access control](/docs/access-control).

## Best practices

- Copy the token immediately — it is shown only once.
- Rotate by re-running the conversion (which mints a fresh token).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 401 unauthorized | Token wrong/expired — re-copy from the result page |
| Endpoint shows localhost | Open the latest result page; configs use the live host |
