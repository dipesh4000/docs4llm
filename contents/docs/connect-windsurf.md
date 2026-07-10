---
title: Connect to Windsurf
description: Add a doc2mcp server to Windsurf's MCP settings.
category: Guides
order: 3
---

## Overview

Windsurf supports remote MCP servers. Paste the doc2mcp config to give Cascade
access to your docs.

## Step-by-step

1. Copy the config from the result page.
2. Open **Windsurf → Settings → Cascade → MCP servers** (or edit
   `mcp_config.json`).
3. Add the server entry:

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

4. Refresh MCP servers in Windsurf.

## Example prompts

```text
Using the stripe MCP, find the refund API and show a request example.
```

## Best practices

- Use the docs subdomain source for the most complete index.
- One server per source keeps Cascade's tool list readable.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Not listed | Re-open settings and refresh MCP |
| Header unsupported | Use the `?token=` URL fallback |
