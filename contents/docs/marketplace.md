---
title: Marketplace
description: Browse public MCPs and install them with your own access token.
category: Guides
order: 5
---

# Marketplace

Every **ready** MCP on doc2mcp is listed at [/marketplace](https://doc2mcp.site/marketplace).

## Browse

- Filter by source type (Mintlify, OpenAPI, GitHub, etc.)
- See tool count, pages indexed, and MCP score
- No creator tokens are exposed on listing pages

## Install a marketplace MCP

1. Sign in.
2. Create an [MCP access token](/docs/mcp-access-tokens) on your profile (`d2mcp_usr_…`).
3. Open a marketplace detail page.
4. Copy the endpoint URL and config template.
5. Replace `YOUR_MCP_ACCESS_TOKEN` with your token.
6. Paste into Cursor, VS Code, Claude Desktop, or Windsurf.

### CLI

```bash
doc2mcp token create
doc2mcp marketplace <project-id>
```

## Publish your MCP

Convert any docs URL — when status is **ready**, your MCP appears on the marketplace automatically. You keep the **project token** for your own installs; visitors use their own access tokens.

## Founder / official MCPs

Official doc2mcp infrastructure MCPs are pinned to the top of the marketplace.
