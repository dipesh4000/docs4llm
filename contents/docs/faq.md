---
title: FAQ
description: Common questions about MCP, doc2mcp, agents, and retrieval.
category: Reference
order: 9
---

## What is MCP?

The **Model Context Protocol** is an open standard (JSON-RPC 2.0) that lets AI clients
call external **tools** and read **resources** through one interface. doc2mcp hosts an
MCP server backed by your crawled documentation. See [What is MCP?](/docs/what-is-mcp).

## Why not build an MCP server manually?

You can — but you own every part of the pipeline:

- Crawling heterogeneous doc sites and OpenAPI specs
- Chunking for retrieval quality (not just “split by tokens”)
- Hosting, auth, rate limits, and observability
- Re-syncing when docs change

doc2mcp is **managed documentation infrastructure**: one URL in, hosted tools out. Most
teams spend days on a one-off script and still ship stale indexes. See
[Why doc2mcp?](/docs/why-doc2mcp).

> **Tip** Hand-written tool wrappers drift the moment your docs team renames a section.
> doc2mcp re-crawls when you re-run a conversion.

## How often is documentation updated?

The index is a **snapshot at crawl time**. Re-run conversion (or sync) when the source
changes. There is no silent background drift on the hosted product unless you trigger
a new crawl.

## Which AI tools are supported?

Any **MCP-compatible** client:

- Cursor
- Claude Desktop / Claude Code
- VS Code (MCP extension)
- Windsurf
- OpenAI Agents SDK

The same endpoint and Bearer token work everywhere. See
[Agent compatibility](/docs/agent-compatibility).

## How does retrieval work?

Pages are split into **heading-aware sections**. Queries rank sections (not whole pages)
and return breadcrumbs, snippets, and source URLs. `ask_documentation` synthesizes a
cited answer from the top hits. See [Retrieval layer](/docs/retrieval).

## Do I need API keys for the source docs?

No for **public** documentation. doc2mcp reads the site like a browser. You only manage
the per-project **Bearer token** doc2mcp issues. See
[Authentication](/docs/api-authentication).

## Is my token secret?

Yes — treat it like a read-only API key. Anyone with the URL + token can query that
project's index. Rotate by re-running conversion and updating client configs.

## Can I convert private/internal docs?

Yes, when the URL is reachable from the crawler (VPN, allowlists, or authenticated
fetch). See [Convert private documentation](/docs/private-docs).

## Hosted vs self-hosted?

- **Hosted** — fastest path; doc2mcp runs crawl, index, and MCP endpoint.
- **Self-hosted** — run the stack in your VPC; see [Self hosted](/docs/self-hosted).
