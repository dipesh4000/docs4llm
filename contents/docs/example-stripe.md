---
title: Stripe docs → MCP
description: Convert the Stripe documentation into a queryable MCP server.
category: Examples
order: 1
---

## Overview

A complete walkthrough converting `docs.stripe.com` and querying it from an agent.

## Step-by-step

1. Paste the docs URL:

```text
https://docs.stripe.com
```

2. Stripe exposes `llms.txt`, so the crawl is fast and complete. Wait for
   **ready**.
3. Copy the config (server id auto-derives to `stripe`):

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
      "headers": { "Authorization": "Bearer <project-token>" }
    }
  }
}
```

## Example queries

```text
How do I create a PaymentIntent and confirm it server-side?
Find the webhook events for disputes.
What are idempotency keys and how do I use them?
```

A grounded answer cites a real page, e.g.
`https://docs.stripe.com/api/payment_intents/create`.

## Best practices

- For the API surface specifically, you can also point doc2mcp at Stripe's
  OpenAPI spec to get one page per endpoint.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Answers feel generic | Name the `stripe` MCP in the prompt |
| Endpoint missing | Re-run to refresh; large APIs take longer |
