---
title: Connect to VS Code
description: Use a doc2mcp server from VS Code's MCP support (GitHub Copilot).
category: Guides
order: 4
---

## Overview

VS Code supports MCP servers for agent mode. Add the doc2mcp endpoint via a
workspace `.vscode/mcp.json` or user settings.

## Step-by-step

1. Create `.vscode/mcp.json` in your workspace:

```json
{
  "servers": {
    "stripe": {
      "type": "http",
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": { "Authorization": "Bearer <project-token>" }
    }
  }
}
```

2. Open the Command Palette → **MCP: List Servers** and start `stripe`.
3. Switch Copilot Chat to **Agent** mode and ask a docs question.

> **Warning** Don't commit `mcp.json` with a real token to a shared repo. Use a
> per-developer config or an input variable for the token.

## Example prompts

```text
@workspace using the stripe MCP, how do I verify a webhook signature?
```

## Best practices

- Prefer workspace config for project-specific docs, user config for global ones.
- Keep tokens in untracked files.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Server won't start | Validate JSON; check `type: "http"` |
| 401 | Re-copy token |
