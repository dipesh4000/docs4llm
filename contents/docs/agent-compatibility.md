---
title: Agent compatibility
description: One endpoint that works across every MCP-compatible AI tool.
category: Core Concepts
order: 5
---

## Overview

doc2mcp servers speak the Model Context Protocol over JSON-RPC 2.0, so the same
endpoint works across every MCP-compatible client.

![One endpoint, every MCP client](/diagrams/integrations.svg)

## Why it matters

You convert documentation once and connect it everywhere — no per-tool rebuilds.
The same URL + token drives Cursor, Claude, VS Code, Windsurf, and OpenAI Agents.

## Supported clients

| Client | Transport | Guide |
|--------|-----------|-------|
| Cursor | Remote URL + Bearer | [Connect to Cursor](/docs/connect-cursor) |
| Claude Desktop | Remote URL + Bearer | [Connect to Claude](/docs/connect-claude) |
| VS Code (Copilot) | Remote URL + Bearer | [Connect to VS Code](/docs/connect-vscode) |
| Windsurf | Remote URL + Bearer | [Connect to Windsurf](/docs/connect-windsurf) |
| OpenAI Agents | Hosted MCP tool | [Connect to OpenAI](/docs/connect-openai) |

## Auth header fallbacks

Clients that cannot set custom headers can pass the token other ways:

```text
Authorization: Bearer <token>     # preferred
X-Doc2MCP-Token: <token>          # fallback header
?token=<token>                     # query param fallback
```

## Best practices

- Reference the server by name in prompts so the agent reaches for the tool.
- Keep one project per documentation source for portable, readable configs.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Client lacks header support | Use the `X-Doc2MCP-Token` or `?token=` fallback |
| Tools not listed | Reload/restart MCP in the client |
