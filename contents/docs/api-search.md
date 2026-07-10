---
title: Search
description: Query crawled documentation via the search and ask tools.
category: API Reference
order: 4
---

## Overview

Search is exposed through MCP tools rather than a separate REST endpoint. Two
tools cover most needs: `search_documentation` (ranked sections) and
`ask_documentation` (synthesized, cited answer).

## search_documentation

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_documentation",
    "arguments": { "query": "rate limits", "limit": 10 }
  }
}
```

Returns ranked sections, each with a breadcrumb, snippet, and source URL.

| Argument | Type | Notes |
|----------|------|-------|
| `query` | string | Keywords or a short question (required) |
| `limit` | number | Default 10, max 30 |

## ask_documentation

```json
{
  "params": {
    "name": "ask_documentation",
    "arguments": { "question": "How do I paginate list endpoints?" }
  }
}
```

Returns a natural-language answer grounded in the crawled docs, with citations.
No third-party API key is required — doc2mcp uses platform AI.

## Best practices

- Use specific, section-like queries ("auth bearer tokens") for sharper ranking.
- Use `ask_documentation` for "explain"/"how do I" questions; use
  `search_documentation` when you want the raw sections.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Empty results | Broaden the query or re-run the conversion |
| Stale answer | Re-crawl to refresh the index |
