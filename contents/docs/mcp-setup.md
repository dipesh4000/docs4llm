---
title: MCP setup in Cursor
nav_title: Cursor setup (detailed)
description: Three-step setup. Paste, reload, ask.
category: Reference
order: 3
---

# MCP setup in Cursor

## 1. Convert docs

Open the doc2mcp chat → enable **doc2mcp** toggle → paste a documentation URL → wait until status is **Ready**.

## 2. Copy from the result page

You'll see:

- **Cursor MCP** — JSON block (url + Authorization header)
- **Project token** — the green box; copy it (shown only on this page)

## 3. Paste into Cursor

Open **Cursor → Settings → MCP → Edit `mcp.json`** and merge into `mcpServers`:

```json
{
  "mcpServers": {
    "langchain": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": {
        "Authorization": "Bearer <project-token>"
      }
    }
  }
}
```

Click **Reload MCP**. The MCP server name will appear in Cursor's MCP list with the available tools.

## 4. Ask Cursor

In Cursor chat:

- "List all langchain documentation pages"
- "Read the page about ChatPromptTemplate"
- "Search the langchain docs for streaming examples"
- "How do I use tools with LangGraph? Give me code"

Cursor calls doc2mcp's MCP tools and receives the **full crawled markdown** with code blocks preserved.

## Tools exposed by every doc2mcp server

| Tool | What it does |
|------|---------------|
| `list_documentation_pages` | Every crawled page (title, url, id) |
| `get_documentation_page` | Full markdown of one page |
| `search_documentation` | Keyword search across all pages |
| `get_documentation_overview` | Summary + `llms.txt` |
| `read_full_documentation` | All pages combined as one big markdown |
| `ask_documentation` | Natural-language Q&A with sources |

## Claude Desktop

Same JSON, paste into `~/Library/Application Support/Claude/claude_desktop_config.json` under `mcpServers`. Restart Claude.

## Windsurf, VS Code Copilot, Antigravity

Any client that supports remote HTTP MCP works. Just point it at the URL with the Bearer header.
