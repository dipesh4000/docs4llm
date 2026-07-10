---
title: Connect to OpenAI Agents
description: Use a doc2mcp server as a hosted MCP tool with the OpenAI Agents SDK.
category: Guides
order: 5
---

## Overview

The OpenAI Agents SDK can call remote MCP servers as hosted tools. Point it at
your doc2mcp endpoint.

## Step-by-step (Python)

```python
from agents import Agent, HostedMCPTool

docs = HostedMCPTool(
    tool_config={
        "type": "mcp",
        "server_label": "stripe",
        "server_url": "https://doc2mcp.site/api/mcp/<projectId>/mcp",
        "headers": {"Authorization": "Bearer <project-token>"},
        "require_approval": "never",
    }
)

agent = Agent(
    name="docs-helper",
    instructions="Answer using the stripe docs MCP and cite sources.",
    tools=[docs],
)
```

## Example

```python
from agents import Runner

result = Runner.run_sync(agent, "How do I create a PaymentIntent?")
print(result.final_output)
```

## Best practices

- Set clear instructions telling the agent to use the MCP and cite sources.
- Use a separate project/token per documentation source.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| 401 from server | Check the `Authorization` header value |
| Tools not discovered | Confirm `server_url` ends in `/mcp` |
