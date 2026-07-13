---
title: CLI
nav_title: CLI
description: Generate, list, and install hosted MCP servers from your terminal with the docs4llm CLI.
category: Getting Started
order: 7
---

![docs4llm CLI](/docs4llm-cli-banner.png)

## Overview

The **docs4llm CLI** brings the full conversion pipeline to your terminal. Point it at a
documentation URL and it crawls, analyzes, and serves the docs as a hosted, token-secured
[MCP](/docs/what-is-mcp) server — then installs it straight into Cursor, VS Code, Claude
Desktop, or Windsurf.

It shares the same backend as the [website](https://docs4llm.site): same pipeline, same plan
limits, same marketplace listing once a project is `ready`. A project you create in the CLI
shows up in your dashboard, and vice‑versa. See the [CLI landing page](/cli) for a visual tour.

## Install

```bash
npm install -g docs4llm
```

> **Install globally with `-g`.** The `docs4llm` command is only added to your `PATH` on a global
> install. If you run `npm i docs4llm` (without `-g`) and get `command not found: docs4llm`, either
> reinstall with `-g` or run it through your package runner: `npx docs4llm <docs-url>`.

If global install succeeds but your shell still cannot find `docs4llm`, add npm's global bin to zsh:

```bash
echo 'export PATH="'$(npm prefix -g)'/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

No PATH setup needed:

```bash
npx docs4llm login
```

Works with any package manager (`pnpm add -g`, `yarn global add`, `bun add -g`) and requires
**Node.js 18+**.

## Quick start

```bash
# 1. Authorize (opens your browser)
docs4llm login

# 2. Convert docs → hosted MCP
docs4llm https://docs.stripe.com

# 3. Pick your editor at the install prompt

# 4. Chat with your docs right in the terminal
docs4llm chat

# Or paste a docs URL directly into chat mode
docs4llm chat https://uagents.fetch.ai/docs
```

## Command reference

### `docs4llm <docs-url>`

The default command. Crawls a docs site and generates a hosted MCP server, streaming live
progress (`crawling → analyzing → generating → ready`) until it's done, then offers to install it.

```bash
docs4llm https://docs.stripe.com
```

- Point at the **docs** URL, not the marketing homepage.
- The URL must start with `http://` or `https://`.
- Counts against your plan's monthly conversion limit (free includes 1/month).

### `docs4llm login`

Browser-based device authorization — no manual token copying.

```bash
docs4llm login
```

A short code is displayed, your browser opens to the approval page, and once you approve the CLI
stores a personal access token at `~/.docs4llm/config.json`.

### `docs4llm logout`

Removes the stored credentials from this machine.

```bash
docs4llm logout
```

### `docs4llm whoami`

Shows the account you're signed in as.

```bash
docs4llm whoami
```

### `docs4llm list`

Lists the MCP projects on your account with their status and project IDs.

```bash
docs4llm list
```

### `docs4llm install <projectId>`

Installs an MCP you already created into your local editors — without re-running the conversion.
Ideal for setting up a project on a new machine.

```bash
docs4llm install prj_123abc
```

You choose which detected clients to write to:

| Editor | Config file |
| --- | --- |
| Cursor | `~/.cursor/mcp.json` |
| VS Code | user `mcp.json` |
| Claude Desktop | `claude_desktop_config.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |

Existing config is merged, never overwritten.

### `docs4llm chat [target]`

Chat with your docs **without leaving the terminal**. docs4llm answers natural‑language
questions from the crawled documentation (with cited sources) using the project's hosted MCP —
the same `ask_documentation` tool your editor calls. The prompt is a Claude Code-style terminal
loop: paste a docs URL, choose an existing project, then ask questions.

```bash
# Interactive: paste a docs URL, project ID, or choose an existing MCP
docs4llm chat

# Paste a docs URL directly: docs4llm converts it, then starts chat
docs4llm chat https://uagents.fetch.ai/docs

# Target a specific project
docs4llm chat prj_123abc

# One-shot question (great for scripts)
docs4llm chat prj_123abc -m "How do I authenticate requests?"
```

- Run `docs4llm chat` with no arguments to paste a docs URL or choose from your `ready` projects.
- Type `/exit` to leave an interactive session.
- Answers include source page titles and URLs so you can verify them.

## Configuration

| Setting | Default | Notes |
| --- | --- | --- |
| Credentials file | `~/.docs4llm/config.json` | API URL, token, and user info |
| `DOCS4LLM_API_URL` | `https://docs4llm.site` | Override the API base (local dev / self-hosting) |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `command not found: docs4llm` | Installed locally or npm's global bin is not on PATH. Use `npx docs4llm <url>`, or add `$(npm prefix -g)/bin` to PATH in `~/.zshrc` |
| `pnpm add -g docs4llm` says `ERR_PNPM_NO_GLOBAL_BIN_DIR` | Run `pnpm setup`, then `source ~/.zshrc`, then retry `pnpm add -g docs4llm` |
| Browser won't open on `login` | Copy the printed URL into your browser and approve manually |
| `login` can't reach the server | Check connectivity; for self-hosting set `DOCS4LLM_API_URL` |
| "Limit reached" | Monthly conversion limit hit (shared across CLI and web) |
| Editor ignores the new MCP | Fully restart the editor so it reloads MCP config |
| `docs4llm chat` says no projects | Convert docs first (`docs4llm <url>`) and wait for `ready` |
