---
title: Connect to Claude Desktop
description: Add a doc2mcp server to Claude Desktop's MCP configuration.
category: Guides
order: 2
---

## Overview

Claude Desktop reads MCP servers from its config file. doc2mcp generates a
ready-to-paste block.

## Step-by-step

1. Copy the Claude config from the result page:

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

2. Open Claude Desktop → **Settings → Developer → Edit Config**
   (`claude_desktop_config.json`).
3. Merge the `mcpServers` entry into the file.
4. **Restart Claude Desktop.**

> **Tip** If `mcpServers` already exists, add your server as another key inside
> it rather than replacing the object.

## Example prompts

```text
Search the stripe docs for "idempotency keys" and summarize with sources.
Open the page on Connect onboarding and list the required fields.
```

## Best practices

- Restart Claude after editing the config — it loads MCP servers on launch.
- Keep tokens out of shared configs; treat them as secrets.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Server missing | Validate JSON; restart Claude |
| 401 | Re-copy token; confirm `Authorization` header |
