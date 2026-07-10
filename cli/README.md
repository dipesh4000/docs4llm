<div align="center">

<img src="https://doc2mcp.site/doc2mcp-cli-banner.png" alt="doc2mcp — turn any docs site into a hosted MCP server from your terminal" width="100%" />

# doc2mcp

**Turn any documentation site into a hosted [MCP](https://modelcontextprotocol.io) server — straight from your terminal.**

Point it at a docs URL, and doc2mcp crawls, analyzes, and serves it as a token-secured MCP endpoint that Cursor, Claude, VS Code, Windsurf, and OpenAI agents can search, read, and cite.

[![npm version](https://img.shields.io/npm/v/doc2mcp?color=8b5cf6&label=npm&logo=npm)](https://www.npmjs.com/package/doc2mcp)
[![npm downloads](https://img.shields.io/npm/dm/doc2mcp?color=8b5cf6&logo=npm)](https://www.npmjs.com/package/doc2mcp)
[![node](https://img.shields.io/node/v/doc2mcp?color=8b5cf6&logo=node.js)](https://nodejs.org)
<<<<<<< HEAD
[![license](https://img.shields.io/npm/l/doc2mcp?color=8b5cf6)](https://github.com/garvitsingh006/doc2mcp/blob/main/LICENSE)
=======
[![license](https://img.shields.io/npm/l/doc2mcp?color=8b5cf6)](https://github.com/doc2mcp/doc2mcp/blob/main/LICENSE)
>>>>>>> upstream/main

[Website](https://doc2mcp.site) · [CLI](https://doc2mcp.site/cli) · [Docs](https://doc2mcp.site/docs) · [CLI guide](https://doc2mcp.site/docs/cli)

</div>

---

## Install

```bash
npm install -g doc2mcp
```

> [!IMPORTANT]
> Install with **`-g`** (global). The `doc2mcp` command only lands on your `PATH` when installed globally.
> If you ran `npm i doc2mcp` (without `-g`) and see `command not found: doc2mcp`, either reinstall with `-g`
> or run it through your package runner: `npx doc2mcp <docs-url>`.
>
> If `npm install -g doc2mcp` succeeds but `doc2mcp` is still `command not found`, your npm global bin folder is
> not on PATH. Run:
>
> ```bash
> echo 'export PATH="'$(npm prefix -g)'/bin:$PATH"' >> ~/.zshrc
> source ~/.zshrc
> ```
>
> Quick no-setup option:
>
> ```bash
> npx doc2mcp login
> ```

Other package managers:

```bash
pnpm add -g doc2mcp     # pnpm
yarn global add doc2mcp # yarn
bun add -g doc2mcp      # bun
```

Requires **Node.js 18+**.

## Quick start

```bash
# 1. Authorize the CLI (opens your browser, creates a token-backed session)
doc2mcp login

# 2. Convert any docs site into a hosted MCP server
doc2mcp https://docs.stripe.com

# 3. When it's ready, pick your editor — the MCP is installed for you
#    ✔ Cursor   ✔ VS Code   ✔ Claude Desktop   ✔ Windsurf

# 4. Chat with your docs without leaving the terminal
doc2mcp chat

# Or paste a docs URL directly into chat mode
doc2mcp chat https://uagents.fetch.ai/docs
```

That's it. The same hosted pipeline powers the [website](https://doc2mcp.site), so a project you
create in the CLI shows up in your dashboard and marketplace too.

## Commands

| Command | What it does |
| --- | --- |
| [`doc2mcp <docs-url>`](#doc2mcp-docs-url) | Crawl a docs site and generate a hosted MCP server |
| [`doc2mcp login`](#doc2mcp-login) | Authorize the CLI in your browser |
| [`doc2mcp logout`](#doc2mcp-logout) | Remove stored credentials from this machine |
| [`doc2mcp whoami`](#doc2mcp-whoami) | Show the account you're signed in as |
| [`doc2mcp list`](#doc2mcp-list) | List the MCP projects on your account |
| [`doc2mcp install <projectId>`](#doc2mcp-install-projectid) | Install an existing MCP into your editors |
| [`doc2mcp chat [target]`](#doc2mcp-chat-target) | Chat with your docs in the terminal; target can be a project ID or docs URL |
| `doc2mcp --version` | Print the installed CLI version |
| `doc2mcp --help` | Show usage and all commands |

---

### `doc2mcp <docs-url>`

Crawl a documentation site and generate a hosted, token-secured MCP server. This is the default
command — the core of the tool.

```bash
doc2mcp https://docs.stripe.com
```

What happens:

1. The job runs the hosted pipeline: **crawl → analyze → generate**.
2. Live progress streams in your terminal until the project is `ready`.
3. You're prompted to install the MCP into any detected editors.

Tips:

- Point at the **docs** URL (`https://docs.stripe.com`), not the marketing homepage.
- The URL must start with `http://` or `https://`.
- Conversions count against your plan's monthly limit (free includes 1/month), shared with the
  website and chat.

---

### `doc2mcp login`

Authorize the CLI using a browser-based device flow — no copy-pasting tokens by hand.

```bash
doc2mcp login
```

1. A short code is shown and your browser opens to the authorization page.
2. Approve access while signed in to [doc2mcp.site](https://doc2mcp.site).
3. The CLI receives a personal access token and stores it at `~/.doc2mcp/config.json`.

---

### `doc2mcp logout`

Remove the stored credentials from this machine.

```bash
doc2mcp logout
```

---

### `doc2mcp whoami`

Print the account the CLI is currently signed in as.

```bash
doc2mcp whoami
# → Signed in as you@example.com
```

---

### `doc2mcp list`

List the MCP projects on your account, with their status and project IDs (use an ID with `install`).

```bash
doc2mcp list
```

---

### `doc2mcp install <projectId>`

Install an MCP you already created into your local editors — without re-running the conversion.
Great for putting an existing project on a new machine.

```bash
doc2mcp install prj_123abc
```

You'll be prompted to choose which detected clients to write to:

| Editor | Config written |
| --- | --- |
| **Cursor** | `~/.cursor/mcp.json` (`mcpServers`) |
| **VS Code** | user `mcp.json` (`servers`) |
| **Claude Desktop** | `claude_desktop_config.json` (`mcpServers`) |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` (`mcpServers`) |

Existing config is merged, not overwritten.

---

### `doc2mcp chat [target]`

Chat with your docs **right from the terminal**. doc2mcp answers natural-language questions from
the crawled documentation — with cited sources — using the project's hosted MCP (the same
`ask_documentation` tool your editor calls). This is the Playground experience, in a Claude Code-style shell loop.

```bash
# Interactive: paste a docs URL, project ID, or choose an existing MCP
doc2mcp chat

# Paste a docs URL directly: doc2mcp converts it, then starts chat
doc2mcp chat https://uagents.fetch.ai/docs

# Skip the picker by passing a project ID
doc2mcp chat prj_123abc

# One-shot answer (handy in scripts / CI)
doc2mcp chat prj_123abc -m "How do I authenticate requests?"
```

- With no arguments, you pick from your `ready` projects.
- Type `/exit` to leave an interactive session.
- Each answer lists the source pages it used so you can verify it.

## Configuration

| Setting | Default | Notes |
| --- | --- | --- |
| Credentials file | `~/.doc2mcp/config.json` | Stores your API URL, token, and user info |
| `DOC2MCP_API_URL` | `https://doc2mcp.site` | Override the API base URL (use for local dev / self-hosting) |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `command not found: doc2mcp` | You installed locally or npm's global bin is not on PATH. Use `npx doc2mcp <url>`, or add `$(npm prefix -g)/bin` to PATH in `~/.zshrc`. |
| `pnpm add -g doc2mcp` says `ERR_PNPM_NO_GLOBAL_BIN_DIR` | Run `pnpm setup`, then `source ~/.zshrc`, then retry `pnpm add -g doc2mcp`. |
| Browser doesn't open on `login` | Copy the printed URL into your browser manually, then approve. |
| `login` can't reach the server | Confirm you're online; for self-hosting set `DOC2MCP_API_URL` to your instance. |
| "Limit reached" | You've hit your plan's monthly conversion limit (shared across CLI and web). |
| Editor doesn't pick up the MCP | Fully restart the editor after install so it reloads MCP config. |

## How it works

doc2mcp runs the same hosted pipeline as the web app:

```text
docs URL ─▶ crawl ─▶ analyze ─▶ generate ─▶ hosted MCP endpoint (token-secured)
```

Your editor connects over MCP and can search, read, and **cite** the real documentation — no
hallucinated APIs. Read more in the [docs](https://doc2mcp.site/docs).

## Local development

```bash
cd cli
pnpm install
pnpm build
node dist/index.js --help

# Point the CLI at a local Next.js app
DOC2MCP_API_URL=http://localhost:3000 node dist/index.js login
```

Publishing is automated: bump the `version` in `cli/package.json` and push to `main` — the
`Publish CLI` GitHub Actions workflow publishes the new version to npm (it no-ops if the version
already exists).

## Links

- 📦 npm: https://www.npmjs.com/package/doc2mcp
- 🌐 Website: https://doc2mcp.site
- 🖥️ CLI page: https://doc2mcp.site/cli
- 📚 Docs: https://doc2mcp.site/docs
- 🧭 CLI guide: https://doc2mcp.site/docs/cli

## License

<<<<<<< HEAD
[MIT](https://github.com/garvitsingh006/doc2mcp/blob/main/LICENSE)
=======
[MIT](https://github.com/doc2mcp/doc2mcp/blob/main/LICENSE)
>>>>>>> upstream/main
