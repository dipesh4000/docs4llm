---
title: Projects
description: Create a conversion project and read its status.
category: API Reference
order: 2
---

## Overview

A project represents one converted documentation source. Projects are created
from the app and progress through a status lifecycle.

![Conversion lifecycle](/diagrams/lifecycle.svg)

## Create a conversion

```http
POST /api/convert
Content-Type: application/json

{ "url": "https://docs.stripe.com" }
```

Returns the new project id. A background pipeline then crawls and analyzes the
source.

## Read project status

```http
GET /api/projects/<projectId>
```

```json
{
  "project": {
    "id": "<projectId>",
    "name": "stripe",
    "sourceUrl": "https://docs.stripe.com",
    "status": "ready",
    "updatedAt": "..."
  }
}
```

## Status values

| Status | Meaning |
|--------|---------|
| `pending` | Queued |
| `crawling` | Fetching pages |
| `analyzing` | Processing + chunking |
| `generating` | Minting endpoint + token |
| `ready` | Live and queryable |
| `error` | Crawl/analysis failed |

## Best practices

- Poll status while not `ready`/`error` (the convert page does this for you).
- Treat `ready` as the signal to read the MCP config and token.
