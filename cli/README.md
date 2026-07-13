<div align="center">

<img src="https://docs4llm.site/docs4llm-cli-banner.png" alt="docs4llm — turn any docs site into a hosted MCP server from your terminal" width="100%" />

# docs4llm

**Turn any documentation site into a hosted [MCP](https://modelcontextprotocol.io) server — straight from your terminal.**

Point it at a docs URL, and docs4llm crawls, analyzes, and serves it as a token-secured MCP endpoint that Cursor, Claude, VS Code, Windsurf, and OpenAI agents can search, read, and cite.

[![npm version](https://img.shields.io/npm/v/docs4llm?color=8b5cf6&label=npm&logo=npm)](https://www.npmjs.com/package/docs4llm)
[![npm downloads](https://img.shields.io/npm/dm/docs4llm?color=8b5cf6&logo=npm)](https://www.npmjs.com/package/docs4llm)
[![node](https://img.shields.io/node/v/docs4llm?color=8b5cf6&logo=node.js)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/docs4llm?color=8b5cf6)](https://github.com/garvitsingh006/docs4llm/blob/main/LICENSE)

[Website](https://docs4llm.site) · [CLI](https://docs4llm.site/cli) · [Docs](https://docs4llm.site/docs) · [CLI guide](https://docs4llm.site/docs/cli)

</div>

---

## Install

```bash
npm install -g docs4llm
```

> [!IMPORTANT]
> Install with **`-g`** (global). The `docs4llm` command only lands on your `PATH` when installed globally.
> If you ran `npm i docs4llm` (without `-g`) and see `command not found: docs4llm`, either reinstall with `-g`
> or run it through your package runner: `npx docs4llm <docs-url>`.
>
> If `npm install -g docs4llm` succeeds but `docs4llm` is still `command not found`, your npm global bin folder is
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
> npx docs4llm login
> ```

Other package managers:

```bash
pnpm add -g docs4llm     # pnpm
yarn global add docs4llm # yarn
bun add -g docs4llm      # bun
```

Requires **Node.js 18+**.

## Quick start

```bash
# 1. Authorize the CLI (opens your browser, creates a token-backed session)
docs4llm login

# 2. Convert any docs site into a hosted MCP server
docs4llm https://docs.stripe.com

# 3. When it's ready, pick your editor — the MCP is installed for you
#    ✔ Cursor   ✔ VS Code   ✔ Claude Desktop   ✔ Windsurf

# 4. Chat with your docs without leaving the terminal
docs4llm chat

# Or paste a docs URL directly into chat mode
docs4llm chat https://uagents.fetch.ai/docs
```

That's it. The same hosted pipeline powers the [website](https://docs4llm.site), so a project you
create in the CLI shows up in your dashboard and marketplace too.

## Commands

| Command | What it does |
| --- | --- |
| [`docs4llm <docs-url>`](#docs4llm-docs-url) | Crawl a docs site and generate a hosted MCP server |
| [`docs4llm login`](#docs4llm-login) | Authorize the CLI in your browser |
| [`docs4llm logout`](#docs4llm-logout) | Remove stored credentials from this machine |
| [`docs4llm whoami`](#docs4llm-whoami) | Show the account you're signed in as |
| [`docs4llm list`](#docs4llm-list) | List the MCP projects on your account |
| [`docs4llm install <projectId>`](#docs4llm-install-projectid) | Install an existing MCP into your editors |
| [`docs4llm chat [target]`](#docs4llm-chat-target) | Chat with your docs in the terminal; target can be a project ID or docs URL |
| `docs4llm --version` | Print the installed CLI version |
| `docs4llm --help` | Show usage and all commands |

---

### `docs4llm <docs-url>`

Crawl a documentation site and generate a hosted, token-secured MCP server. This is the default
command — the core of the tool.

```bash
docs4llm https://docs.stripe.com
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

### `docs4llm login`

Authorize the CLI using a browser-based device flow — no copy-pasting tokens by hand.

```bash
docs4llm login
```

1. A short code is shown and your browser opens to the authorization page.
2. Approve access while signed in to [docs4llm.site](https://docs4llm.site).
3. The CLI receives a personal access token and stores it at `~/.docs4llm/config.json`.

---

### `docs4llm logout`

Remove the stored credentials from this machine.

```bash
docs4llm logout
```

---

### `docs4llm whoami`

Print the account the CLI is currently signed in as.

```bash
docs4llm whoami
# → Signed in as you@example.com
```

---

### `docs4llm list`

List the MCP projects on your account, with their status and project IDs (use an ID with `install`).

```bash
docs4llm list
```

---

### `docs4llm install <projectId>`

Install an MCP you already created into your local editors — without re-running the conversion.
Great for putting an existing project on a new machine.

```bash
docs4llm install prj_123abc
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

### `docs4llm chat [target]`

Chat with your docs **right from the terminal**. docs4llm answers natural-language questions from
the crawled documentation — with cited sources — using the project's hosted MCP (the same
`ask_documentation` tool your editor calls). This is the Playground experience, in a Claude Code-style shell loop.

```bash
# Interactive: paste a docs URL, project ID, or choose an existing MCP
docs4llm chat

# Paste a docs URL directly: docs4llm converts it, then starts chat
docs4llm chat https://uagents.fetch.ai/docs

# Skip the picker by passing a project ID
docs4llm chat prj_123abc

# One-shot answer (handy in scripts / CI)
docs4llm chat prj_123abc -m "How do I authenticate requests?"
```

- With no arguments, you pick from your `ready` projects.
- Type `/exit` to leave an interactive session.
- Each answer lists the source pages it used so you can verify it.

## Configuration

| Setting | Default | Notes |
| --- | --- | --- |
| Credentials file | `~/.docs4llm/config.json` | Stores your API URL, token, and user info |
| `DOCS4LLM_API_URL` | `https://docs4llm.site` | Override the API base URL (use for local dev / self-hosting) |

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `command not found: docs4llm` | You installed locally or npm's global bin is not on PATH. Use `npx docs4llm <url>`, or add `$(npm prefix -g)/bin` to PATH in `~/.zshrc`. |
| `pnpm add -g docs4llm` says `ERR_PNPM_NO_GLOBAL_BIN_DIR` | Run `pnpm setup`, then `source ~/.zshrc`, then retry `pnpm add -g docs4llm`. |
| Browser doesn't open on `login` | Copy the printed URL into your browser manually, then approve. |
| `login` can't reach the server | Confirm you're online; for self-hosting set `DOCS4LLM_API_URL` to your instance. |
| "Limit reached" | You've hit your plan's monthly conversion limit (shared across CLI and web). |
| Editor doesn't pick up the MCP | Fully restart the editor after install so it reloads MCP config. |

## How it works

docs4llm runs the same hosted pipeline as the web app:

```text
docs URL ─▶ crawl ─▶ analyze ─▶ generate ─▶ hosted MCP endpoint (token-secured)
```

Your editor connects over MCP and can search, read, and **cite** the real documentation — no
hallucinated APIs. Read more in the [docs](https://docs4llm.site/docs).

## Local development

```bash
cd cli
pnpm install
pnpm build
node dist/index.js --help

# Point the CLI at a local Next.js app
DOCS4LLM_API_URL=http://localhost:3000 node dist/index.js login
```

Publishing is automated: bump the `version` in `cli/package.json` and push to `main` — the
`Publish CLI` GitHub Actions workflow publishes the new version to npm (it no-ops if the version
already exists).

## Links

- 📦 npm: https://www.npmjs.com/package/docs4llm
- 🌐 Website: https://docs4llm.site
- 🖥️ CLI page: https://docs4llm.site/cli
- 📚 Docs: https://docs4llm.site/docs
- 🧭 CLI guide: https://docs4llm.site/docs/cli

## License

[MIT](https://github.com/garvitsingh006/docs4llm/blob/main/LICENSE)
