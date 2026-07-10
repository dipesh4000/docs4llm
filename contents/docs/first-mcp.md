---
title: First MCP in 5 minutes
description: A guided walkthrough from a pasted URL to a working server in Cursor.
category: Getting Started
order: 6
---

## Overview

A complete, end-to-end walkthrough. By the end you will have asked Cursor a
question and watched it answer from real documentation.

## Step-by-step

### 1. Convert the docs (≈1 min)

In the doc2mcp chat, enable the toggle and paste:

```text
https://docs.stripe.com
```

Wait until the status reads **ready**.

### 2. Copy the Cursor config (≈30s)

From the result page, copy the JSON block:

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

### 3. Add it to Cursor (≈1 min)

Open **Cursor → Settings → MCP → Add new MCP server**, paste the JSON, and reload
MCP. The `stripe` server should show as connected with its tools listed.

### 4. Ask a question (≈30s)

In Cursor chat:

```text
Using the stripe docs MCP, how do I create a PaymentIntent? Cite the page.
```

Cursor calls `search_documentation` and `get_documentation_page`, then answers
from the real docs with a source URL.

### 5. Verify retrieval (≈1 min)

Try a few prompts to confirm grounding:

- "List the documentation pages available."
- "Find the section on webhooks signing."
- "What auth does the API use?"

## Example result

A grounded answer includes the source, e.g.
`Source: https://docs.stripe.com/api/payment_intents/create` — not an invented
endpoint.

## Best practices

- Reference the server by name in prompts ("using the stripe docs MCP") to nudge
  the agent to use the tool.
- For broad questions, `ask_documentation` returns a synthesized, cited answer.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Server shows "no tools" | Reload MCP in Cursor settings |
| 401 errors | Re-copy the token; check the `Bearer ` prefix |
| Agent ignores the MCP | Name the server explicitly in your prompt |
