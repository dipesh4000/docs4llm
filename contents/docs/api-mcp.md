---
title: MCP servers
description: The JSON-RPC interface that AI clients use to read your docs.
category: API Reference
order: 3
---

## Overview

Each project exposes a hosted MCP server at `/api/mcp/{projectId}/mcp` speaking
**JSON-RPC 2.0**. This is what MCP clients call.

![Agent query sequence](/diagrams/sequence.svg)

## Methods

| Method | Purpose |
|--------|---------|
| `initialize` | Handshake / capabilities |
| `tools/list` | Enumerate available tools |
| `tools/call` | Invoke a tool by name |

## List tools

```http
POST /api/mcp/<projectId>/mcp
Authorization: Bearer <token>
Content-Type: application/json

{ "jsonrpc": "2.0", "id": 1, "method": "tools/list" }
```

## Call a tool

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "search_documentation",
    "arguments": { "query": "webhook signature", "limit": 5 }
  }
}
```

## Available tools

| Tool | Arguments |
|------|-----------|
| `list_documentation_pages` | — |
| `get_documentation_page` | `url` or `id` |
| `search_documentation` | `query`, optional `limit` |
| `read_full_documentation` | optional `maxPages` |
| `ask_documentation` | `question` |

## Best practices

- Clients usually handle JSON-RPC for you — paste the config and let the tool
  drive.
- Prefer `search_documentation` over `read_full_documentation` for cost/latency.
