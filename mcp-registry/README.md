![docs4llm — Documentation to MCP Registry, automatically](./assets/banner.png)

# docs4llm — MCP Registry publishing

docs4llm publishes MCP servers to the official
[MCP Registry](https://registry.modelcontextprotocol.io) under the
platform-owned namespace **`io.github.docs4llm/*`**. There are two layers:

| Layer                         | What it publishes                                                                 | How                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Gateway entry**             | `io.github.docs4llm/docs4llm` — the canonical "docs4llm platform" record              | This folder's `server.json` + `publish-mcp.yml`, on a `v*` git tag     |
| **Per-project auto-publish**  | `io.github.docs4llm/<slug>` — one entry per user-generated MCP (e.g. `…/langchain`) | Server-side from the app pipeline via the registry HTTP API           |

## Automatic per-project publishing

When a project finishes processing (`status: ready`), the pipeline calls
`lib/mcp-registry/publish.ts`, which:

1. Exchanges a GitHub access token for a short-lived registry JWT
   (`POST /v0.1/auth/github-at`).
2. Publishes a generated `server.json` for that project
   (`POST /v0.1/publish`) as `io.github.docs4llm/<slug>`.

The remote endpoint in each manifest points at
`https://docs4llm.site/api/mcp/{project_id}/mcp` with a per-project Bearer
token (kept out of the public registry — clients supply their own).

**Versions auto-increment per docs:** the version's patch component is
derived from the project's last-sync timestamp, so every re-crawl publishes
a fresh registry version with no manual bumps.

The marketplace surfaces a **"Listed on the MCP Registry"** link on every
published project so users can verify and share the listing.

### Required configuration

Set these on the deployed app (Vercel → Environment Variables):

| Variable                     | Required | Description                                                                                  |
| ---------------------------- | :------: | -------------------------------------------------------------------------------------------- |
| `MCP_REGISTRY_GITHUB_TOKEN`  |   yes    | GitHub access token for a **member of the `docs4llm` org** — proves ownership of `io.github.docs4llm/*`. Without it, publishing is a graceful no-op. |
| `MCP_REGISTRY_AUTOPUBLISH`   |    no    | Set to `false` to disable auto-publishing.                                                    |
| `MCP_REGISTRY_BASE_URL`      |    no    | Override the registry base URL (defaults to the official registry).                           |
| `MCP_REGISTRY_NAMESPACE`     |    no    | Override the namespace (defaults to `io.github.docs4llm`).                                      |
| `MCP_REGISTRY_SOURCE_REPO`   |    no    | Repo URL recorded in each manifest (defaults to `https://github.com/docs4llm/docs4llm-registry`). |

> The namespace `io.github.docs4llm/*` requires the GitHub token to belong to
> a member of the `docs4llm` GitHub organization. A token from any other
> account will be rejected by the registry's permission check.

### Setting `MCP_REGISTRY_GITHUB_TOKEN` (read this first)

The token is a **secret**. It lives only in the deploy environment — never in
this repo, `server.json`, `.env` files committed to git, or any README.

1. Create a fine-grained / classic GitHub PAT on an account that is a member
   of the [`docs4llm`](https://github.com/docs4llm) org. Minimum scope:
   `read:org` (classic) so the registry can verify org membership.
2. Add it to the app deployment — **Vercel → Project → Settings →
   Environment Variables** — for the `Production` (and optionally `Preview`)
   environments:

   ```bash
   # via the Vercel CLI, if you prefer
   vercel env add MCP_REGISTRY_GITHUB_TOKEN production
   # then paste the token value when prompted
   ```

3. Redeploy. New conversions will auto-publish; existing ones publish on
   their next re-sync.

> **If a token ever leaks** (pasted in chat, a log, a screenshot, a commit),
> treat it as compromised: revoke it immediately at
> <https://github.com/settings/tokens>, then generate a fresh one and update
> the environment variable. GitHub also auto-revokes tokens it detects in
> public commits.

## Gateway entry (this folder)

The files here mirror the public
[`docs4llm/docs4llm-registry`](https://github.com/docs4llm/docs4llm-registry) repo,
which owns the namespace via GitHub OIDC and publishes the canonical
`io.github.docs4llm/docs4llm` gateway record. To cut a new gateway version,
push a `v*` tag in that repo — the workflow syncs `server.json`'s version
from the tag and runs `mcp-publisher publish`.

## Verified listings

docs4llm is discoverable across the MCP ecosystem:

- [Official MCP Registry](https://registry.modelcontextprotocol.io/?search=docs4llm)
- [Claude Code Marketplaces](https://claudemarketplaces.com/mcp/docs4llm/docs4llm)
- [PulseMCP](https://www.pulsemcp.com/servers/docs4llm/serverjson)

## What clients connect to

Point any MCP host (Cursor, Claude Desktop, VS Code, Windsurf, OpenAI
Agents SDK) at the remote URL:

```json
{
  "type": "streamable-http",
  "url": "https://docs4llm.site/api/mcp/{project_id}/mcp",
  "headers": { "Authorization": "Bearer <your project MCP token>" }
}
```

Get your `project_id` and token from the project's **Connect** tab.
