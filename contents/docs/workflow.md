---
title: Architecture & workflow
description: End-to-end system flow, request sequence, and conversion lifecycle.
category: Reference
order: 1
---

## Overview

This page is the system-level reference: how data flows during conversion, how an
agent query is served, and how a project transitions through its lifecycle.

## High-level flow

The conversion (write) path and the agent-query (read) path share one database.

![doc2mcp system architecture](/diagrams/architecture.svg)

- The app calls `POST /api/convert`, which creates a project + token and kicks off
  a background pipeline (crawl → chunk → analyze) writing to Postgres.
- Agents call `GET/POST /api/mcp/{projectId}/mcp` with the Bearer token; the
  endpoint reads only that project's data.

## Request sequence

A single `tools/call` from an agent flows through the MCP endpoint and retrieval
layer and back as a cited result.

![Agent query sequence](/diagrams/sequence.svg)

## Conversion lifecycle

The `status` field drives the convert page UI and is persisted on every
transition, so polling or resuming just reads the row.

![Conversion lifecycle](/diagrams/lifecycle.svg)

## CI / CD

| Job | What runs | Blocks merge? |
|-----|-----------|---------------|
| `lint` | `tsc --noEmit` + Biome/Ultracite | Yes |
| `e2e` | Playwright against the built app | Yes |
| Vercel preview | `next build` + deploy | Yes |
