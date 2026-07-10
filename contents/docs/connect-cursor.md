---
title: Connect to Cursor
description: Add a doc2mcp server to Cursor and query your docs from chat.
category: Guides
order: 1
---

## Overview

Connect a generated MCP server to Cursor so the agent can read, search, and cite
your documentation.

## Prerequisites

- A **ready** project on [doc2mcp.site](https://doc2mcp.site) (see [Quick start](/docs/quickstart))
- **Cursor** with MCP enabled (Settings → MCP)

## Step-by-step

1. Convert a docs URL (see [Quick start](/docs/quickstart)) and copy the config:

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

2. Open **Cursor → Settings → MCP**.
3. Click **Add new MCP server** and paste the JSON.
4. **Reload** MCP. The server appears with its tools listed.
5. In chat, **mention the server by name** so Cursor selects the right tools.

## Verification

Ask in Cursor chat:

```text
Using the stripe docs MCP, list available documentation tools, then search for PaymentIntent.
```

You should see tool calls and answers that cite real doc URLs — not invented endpoints.

## Example prompts

```text
Using the stripe docs MCP, how do I create a PaymentIntent? Cite the page.
List the documentation pages available.
Find the section on webhook signature verification.
```

## Best practices

- Name the server in your prompt ("using the stripe docs MCP") so Cursor reaches
  for the tool.
- Keep one server per docs source for clean, switchable context.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Server not connecting | Re-check the URL and `Bearer ` prefix, reload MCP |
| "No tools" | Reload MCP in settings |
| 401 | Re-copy the token from the result page |
