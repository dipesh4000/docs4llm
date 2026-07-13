---
title: MCP access tokens
description: Create a profile token to use any marketplace MCP — creators keep their own project token.
category: Guides
order: 4
nav_title: Access tokens
---

# MCP access tokens

docs4llm uses **two kinds of tokens**. They look similar but do different jobs.

| Token | Prefix | Who gets it | Used for |
|-------|--------|-------------|----------|
| **Project token** | `d2mcp_…` | MCP creator | Your own MCP only — shown once after conversion |
| **MCP access token** | `d2mcp_usr_…` | Any signed-in user | Any **marketplace** MCP you want to install |
| **CLI PAT** | `d2mcp_pat_…` | CLI users | `docs4llm` terminal commands only |

## If you created the MCP

1. Convert a docs URL (web or CLI).
2. When status is **ready**, copy the **project token** from the result page.
3. Paste it into Cursor / Claude / VS Code `mcp.json`:

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://docs4llm.site/api/mcp/<projectId>/mcp",
      "headers": { "Authorization": "Bearer d2mcp_<your-project-token>" }
    }
  }
}
```

The marketplace **never** shows this token.

## If you use someone else's MCP (marketplace)

1. Sign in at [docs4llm.site](https://docs4llm.site).
2. Open **Dashboard → Profile → MCP access tokens**.
3. Click **Create token** and copy `d2mcp_usr_…` (shown once).
4. Open the marketplace listing, copy the MCP endpoint URL.
5. Use **your** access token in the Authorization header:

```json
{
  "mcpServers": {
    "langchain": {
      "url": "https://docs4llm.site/api/mcp/<their-project-id>/mcp",
      "headers": { "Authorization": "Bearer d2mcp_usr_<your-token>" }
    }
  }
}
```

One access token works across every marketplace MCP you install.

## CLI

```bash
docs4llm login
docs4llm token create          # saves mcpAccessToken to ~/.docs4llm/config.json
docs4llm token list
docs4llm marketplace <id>      # install a marketplace MCP with your token
```

Your own conversions still print the **project token** at the end of `docs4llm <url>`.

## Revoke a token

Profile → MCP access tokens → trash icon on an active token. Marketplace MCPs using that token will return `401` until you create a new one.

## Security notes

- Never commit tokens to git.
- Project tokens authorize one MCP. Access tokens authorize marketplace MCPs for your account.
- Rotate tokens if they leak.
