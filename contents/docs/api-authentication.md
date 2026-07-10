---
title: Authentication
description: How requests to doc2mcp are authenticated.
category: API Reference
order: 1
---

## Overview

doc2mcp has two authentication surfaces:

- **App API** (creating/reading projects) — authenticated by your signed-in
  session.
- **MCP endpoint** (agent queries) — authenticated by a per-project Bearer token.

## MCP endpoint auth

Every request to `/api/mcp/{projectId}/mcp` must present the project token:

```http
POST /api/mcp/<projectId>/mcp HTTP/1.1
Host: doc2mcp.site
Authorization: Bearer d2mcp_xxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

Fallbacks for clients that can't set headers:

```text
X-Doc2MCP-Token: <token>
?token=<token>
```

## Token properties

- Minted as a random URL-safe string (`d2mcp_…`).
- Only the SHA-256 hash is stored; the raw value is shown once.
- Scoped to a single project; verified with a constant-time comparison.

> **Warning** Anyone with the URL + token can read that project's docs. Store it
> like a read-only API key and rotate by re-running the conversion.

## Errors

| Status | Meaning |
|--------|---------|
| `401` | Missing or invalid token |
| `404` | Unknown project id |
