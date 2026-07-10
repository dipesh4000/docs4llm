---
title: Quick start
description: Generate your first MCP server from any docs URL in under five minutes.
category: Getting Started
order: 5
---

## Overview

This is the fastest path from a documentation URL to a working MCP server.
No install, no clone, no third-party API keys.

## Why it matters

You will have a live, queryable version of any docs site that your AI tools can
read — in the time it takes to copy a link.

## Step-by-step

1. **Sign in** at [doc2mcp.site](https://doc2mcp.site).
2. **Open the chat** and enable the **doc2mcp** toggle in the input.
3. **Paste a docs URL** and press enter:

```text
https://docs.stripe.com
https://docs.anthropic.com
https://platform.openai.com/docs
https://github.com/openai/openai-python
```

4. **Wait for `ready`.** The convert page shows live progress
   (`crawling → analyzing → generating → ready`).
5. **Copy the project token and config** from the result page (shown once).
6. **Connect a client.** See [Connect to Cursor](/docs/connect-cursor).

Using a MCP from the [marketplace](/docs/marketplace)? Create an [MCP access token](/docs/mcp-access-tokens) on your profile instead.

> **Tip** The server id (e.g. `stripe`) is derived from the docs hostname, so
> configs read naturally.

## Best practices

- Paste the **docs** URL, not the homepage. doc2mcp redirects `stripe.com` to
  `docs.stripe.com` automatically, but being explicit is faster.
- Keep the token private — anyone with the URL + token can read that project's
  crawled docs.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Conversion failed" | Re-run with the `docs.` subdomain |
| Token not shown | The token appears once on the result page — copy it then |
| Client can't connect | Confirm the `Authorization: Bearer` header is set |
