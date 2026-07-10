---
title: Supabase docs → MCP
description: Convert the Supabase documentation into a queryable MCP server.
category: Examples
order: 2
---

## Overview

Convert `supabase.com/docs` so your agent can answer questions about Auth,
Postgres, Edge Functions, and the client libraries.

## Step-by-step

1. Paste:

```text
https://supabase.com/docs
```

2. Wait for **ready**, then copy the config (server id `supabase`).

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": { "Authorization": "Bearer <project-token>" }
    }
  }
}
```

## Example queries

```text
How do I set up Row Level Security for a user-owned table?
Show the JS client call to sign in with a magic link.
What's the difference between the anon key and the service role key?
```

## Best practices

- Supabase docs are large; use `search_documentation` for targeted answers
  rather than `read_full_documentation`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Slow first answer | Index is large; subsequent queries are fast |
| Wrong client lib | Specify the language in your prompt |
