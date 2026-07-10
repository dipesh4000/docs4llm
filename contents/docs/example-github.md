---
title: GitHub repo → MCP
description: Convert a GitHub repository's markdown docs into an MCP server.
category: Examples
order: 3
---

## Overview

Point doc2mcp at a GitHub repository to index its `README` and markdown docs —
ideal for open-source libraries.

## Step-by-step

1. Paste a repo URL:

```text
https://github.com/openai/openai-python
```

2. doc2mcp lists the repo tree and fetches `README.md` plus `.md`/`.mdx` files in
   `/docs`, `/examples`, and `/guides`.
3. Wait for **ready** and copy the config (server id derives from the repo name).

```json
{
  "mcpServers": {
    "openai-python": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": { "Authorization": "Bearer <project-token>" }
    }
  }
}
```

## Example queries

```text
How do I stream chat completions with this library?
Show an example of setting a custom base URL.
What environment variable holds the API key?
```

## Best practices

- Repos with a real `/docs` folder index best.
- For pure API surfaces, prefer an OpenAPI spec URL over the repo.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Few files indexed | Repo keeps docs elsewhere; point at the docs site instead |
| Private repo | Must be readable by doc2mcp |
