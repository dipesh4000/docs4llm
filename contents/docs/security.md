---
title: Security
description: Authentication, token handling, and data isolation in doc2mcp.
category: Enterprise
order: 2
---

## Overview

doc2mcp isolates every project behind a scoped token and minimizes what leaves
your environment. This page describes the identity, token, and data-flow model.

![doc2mcp system architecture](/diagrams/architecture.svg)

## Identity and access

| Role | Read public docs | Use chat | Generate MCP | Hit MCP endpoint |
|------|------------------|----------|--------------|------------------|
| Anonymous | yes | no (login required) | no (login required) | no (token required) |
| Authenticated | yes | yes | yes | yes |

There is no guest mode: chat, MCP generation, and the dashboard all require a
signed-in account. Sessions are cookie-only, signed with `AUTH_SECRET`.

## MCP token isolation

- Tokens are minted as `randomBytes(24).toString("base64url")` (`d2mcp_…`).
- Only the **SHA-256 hash** is stored in `PlatformProject.artifacts.mcpTokenHash`;
  the raw token is shown once on the result page.
- Requests are verified with a **constant-time comparison**.
- A token is scoped to a **single project** — it cannot read any other project,
  even on the same account.
- Rotate tokens by re-running the conversion.

> **Warning** Anyone with the URL + token can read that project's crawled docs.
> Treat the token like a read-only API key.

## What leaves your environment

| Outbound destination | When | Data sent |
|----------------------|------|-----------|
| Source docs origin | On convert + re-crawl | Plain GET requests |
| Jina Reader | When HTML is thin | The page URL only |
| Web search (Tavily/Brave/Exa) | When `llms.txt` absent | Search query + site filter |
| AI provider | During analyze + ask | Doc excerpts + question |
| Postgres | Always | Project metadata, chunks |

Web search and Jina are **optional**. With no keys set, only the source docs,
the AI provider, and Postgres are contacted.

## Headers and proxy

- The proxy gates everything except public-by-design routes (`/`, `/login`,
  `/register`, `/pricing`, `/docs`, `/api/auth`, `/chat`, `/api/mcp`).
- `/api/mcp/{projectId}/mcp` reads the token from `Authorization`, then
  `X-Doc2MCP-Token`, then `?token=`.

## Reporting

Found a security issue? Email doc2mcp@gmail.com — please don't open a public
GitHub issue.
