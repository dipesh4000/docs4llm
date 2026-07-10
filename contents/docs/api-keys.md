---
title: API keys & tokens
description: Project tokens, marketplace access tokens, and CLI PATs explained.
category: Reference
order: 2
---

# API keys & tokens

doc2mcp is hosted. You do not paste Stripe, OpenAI, or other vendor API keys into Cursor — docs are served from doc2mcp's MCP endpoint.

## Token types

| Token | Prefix | When you need it |
|-------|--------|------------------|
| **Project token** | `d2mcp_…` | You created the MCP — copy from the result page once |
| **MCP access token** | `d2mcp_usr_…` | You install someone else's MCP from the [marketplace](/docs/marketplace) |
| **CLI PAT** | `d2mcp_pat_…` | Terminal only (`doc2mcp login`) — not for Cursor |

Full guide: [MCP access tokens](/docs/mcp-access-tokens).

## Your own MCP (project token)

```json
{
  "mcpServers": {
    "langchain": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": {
        "Authorization": "Bearer d2mcp_<project-token>"
      }
    }
  }
}
```

| Field | Where to get it |
|-------|-----------------|
| `url` | Convert result page |
| Bearer token | Shown **once** when status is `ready` |

## Marketplace MCP (access token)

1. Profile → **MCP access tokens** → Create.
2. Use `d2mcp_usr_…` in the config (marketplace pages show a placeholder, not the creator's token).

## What you do not need

- No vendor API keys in `mcp.json`
- No local Node install for Cursor
- No database or `.env` on the client machine
