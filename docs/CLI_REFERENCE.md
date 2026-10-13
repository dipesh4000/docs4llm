# `docs4llm` CLI Reference

The **`docs4llm`** CLI is a terminal client that lets developers convert any documentation website into a hosted MCP server and automatically install it into Cursor, Claude Desktop, VS Code, or Windsurf.

---

## 1. Installation

```bash
# Global install (recommended)
npm install -g docs4llm

# Or run instantly via npx without installation
npx docs4llm login
```

*Requirements: Node.js 18+ (tested on Node 20).*

---

## 2. Quick Start Workflow

```bash
# Step 1: Authenticate with your Docs4LLM account
docs4llm login

# Step 2: Convert a documentation site
docs4llm https://docs.stripe.com

# Step 3: When finished, choose your editor:
#   ✔ Cursor   ✔ Claude Desktop   ✔ VS Code   ✔ Windsurf
# The CLI automatically writes the configuration into your editor's config file!
```

---

## 3. Command Reference

### `docs4llm login`
Initiates a browser-based device authorization flow. Opens the verification URL, waits for your approval in the browser, and stores your session token locally in `~/.docs4llm/config.json`.

---

### `docs4llm add <url> [options]` (or `docs4llm <url>`)
Converts the provided documentation URL into a hosted MCP server.

```bash
docs4llm add https://docs.stripe.com
# or
docs4llm https://docs.stripe.com
```

* **Arguments:**
  * `<url>`: The target documentation URL (e.g., `https://docs.langchain.com`).
* **Options:**
  * `--name <name>`: Custom name for the project (defaults to site title).
  * `--editor <editor>`: Automatically inject config for `cursor`, `claude`, `vscode`, or `windsurf`.
  * `--json`: Outputs the result as raw JSON containing `mcpUrl` and `bearerToken`.

---

### `docs4llm chat [url]`
Starts an interactive terminal chat session with any converted documentation site, powered by the MCP server's `ask_documentation` and `search_documentation` tools.

---

### `docs4llm list`
Lists all active MCP servers under your account with their status and MCP URLs.

---

### `docs4llm whoami`
Displays current authenticated user details and tier limits.

---

### `docs4llm logout`
Revokes the local device session and deletes stored authentication tokens.

---

## 4. Automatic Editor Configuration

When you convert a site, `docs4llm` automatically locates and updates the configuration files for your editors:

| Editor | Target Configuration File | Injection Format |
|---|---|---|
| **Cursor** | `.cursor/mcp.json` or global Cursor config | Adds server under `mcpServers` with Bearer auth |
| **Claude Desktop** | `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\...` (Windows) | Adds `mcp-remote` command wrapper |
| **VS Code** | `.vscode/settings.json` | Adds standard MCP endpoint definition |
| **Windsurf** | `~/.codeium/windsurf/mcp_config.json` | Adds server definition under `mcpServers` |
