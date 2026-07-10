---
title: Access control
description: How access is scoped across accounts, projects, and tokens.
category: Enterprise
order: 1
---

## Overview

Access in doc2mcp is organized around accounts, projects, and per-project tokens.

## Why it matters

The unit of sharing is the **project token**. Understanding its scope is the key
to controlling who can read which documentation.

## Model

| Boundary | Scope |
|----------|-------|
| Account | Owns projects; sign-in required to create them |
| Project | One documentation source; isolated data |
| Token | Read access to exactly one project |

- A token grants read access to **one** project's crawled docs only.
- Tokens never grant write access or cross-project access.
- The app surfaces (creating projects, viewing dashboards) require a signed-in
  session.

## Sharing safely

- Distribute tokens through a secrets manager, not chat or commits.
- Use one project (and token) per documentation source so you can revoke
  granularly.
- Revoke/rotate by deleting and re-running a conversion.

## Best practices

- Keep separate projects for internal vs. public docs.
- Audit who has each token; rotate on team changes.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Leaked token | Re-run the conversion to mint a new one |
| Need broader sharing | Issue the same project config to the team |
