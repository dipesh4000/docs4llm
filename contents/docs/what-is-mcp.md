---
title: What is MCP?
nav_title: What is MCP?
description: Model Context Protocol basics — tools, resources, and why agents need a standard.
category: Getting Started
order: 1
---

## Overview

The **Model Context Protocol (MCP)** is an open standard for connecting AI clients to
external data and tools over **JSON-RPC 2.0**. Instead of pasting documentation into
every chat, you register an MCP server once; the agent calls tools like
`search_documentation` or `get_customer` when it needs facts.

Think of MCP as **USB-C for AI**: one protocol, many clients (Cursor, Claude, VS Code,
Windsurf, OpenAI Agents) and many servers (your APIs, databases, or doc2mcp-hosted docs).

## Why it matters

Without MCP, each integration is bespoke: custom prompts, brittle scrapers, and configs
that break when docs change. MCP gives agents a **stable contract**:

- **Tools** — functions the model can invoke (search, read page, call API).
- **Resources** — readable blobs (files, indexes, manifests).
- **Prompts / workflows** — optional packaged instructions some servers expose.

doc2mcp's job is the **write path**: crawl your docs → index → host an MCP server. Your
job on the **read path** is to paste the endpoint into your client.

![One endpoint, every MCP client](/diagrams/integrations.svg)

## Example

A minimal Cursor config for a doc2mcp server:

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

In chat, the agent might call:

```text
search_documentation({ "query": "create PaymentIntent" })
```

and receive ranked sections with source URLs — not a hallucinated endpoint list.

## Step-by-step (mental model)

1. **Client** (Cursor) sends JSON-RPC to your MCP URL.
2. **Server** (doc2mcp) authenticates the Bearer token.
3. **Tools** run against the crawled index (search, read, ask).
4. **Result** returns structured text the model cites in its answer.

## Best practices

- Prefer **one MCP server per product/docs site** so context stays focused.
- Treat the project token like a **read-only API key**.
- Name the server in prompts ("using the stripe docs MCP") so the client picks the right tools.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Client shows "no tools" | Reload MCP; confirm URL ends with `/mcp` |
| 401 Unauthorized | Re-copy `Authorization: Bearer …` from the convert page |
| Stale answers | Re-run conversion when source docs change |
