<div align="center">

# docs4llm

### Documentation infrastructure for AI agents

**Paste any docs URL → get a hosted, Cursor-ready MCP server in under 60 seconds.**

No install. No local clone. No API keys to hand over.

![docs4llm — documentation infrastructure for AI agents](./mcp-registry/assets/banner.png)

[**Live**](https://docs4llm.site) · [Docs](https://docs4llm.site/docs) · [Pricing](https://docs4llm.site/pricing) · [Comparison](https://docs4llm.site/comparison)

[![GitHub stars](https://img.shields.io/github/stars/garvitsingh006/docs4llm?style=social)](https://github.com/garvitsingh006/docs4llm/stargazers)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org)
[![OpenRouter](https://img.shields.io/badge/AI-OpenRouter-6467F2)](https://openrouter.ai)
[![MCP](https://img.shields.io/badge/Model_Context_Protocol-SDK-7c3aed)](https://modelcontextprotocol.io)
[![Registry](https://img.shields.io/badge/MCP_Registry-io.github.docs4llm-2563eb)](https://registry.modelcontextprotocol.io/?search=docs4llm)
[![npm](https://img.shields.io/npm/v/docs4llm?color=8b5cf6&label=docs4llm&logo=npm)](https://www.npmjs.com/package/docs4llm)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e)](https://github.com/garvitsingh006/docs4llm/pulls)
[![License](https://img.shields.io/badge/License-Apache_2.0-green)](#license)
[![GitHub Auth](https://img.shields.io/badge/Auth-GitHub_OAuth-24292f?logo=github)](https://docs.github.com/en/apps/oauth-apps)

**If docs4llm is useful to you, please [⭐ star the repo](https://github.com/garvitsingh006/docs4llm) — it helps other developers find it.**

</div>

---

> **Private codebase.** This repository contains proprietary product code.
> It is not open source. For public docs, badges, and MCP Registry publishing,
> see **[docs4llm/docs4llm-registry](https://github.com/docs4llm/docs4llm-registry)**.

## Product

- **Site:** [docs4llm.site](https://docs4llm.site)
- **CLI:** `npm install -g docs4llm`
- **Registry:** every converted MCP auto-publishes to `io.github.docs4llm/<slug>` on the [official MCP Registry](https://registry.modelcontextprotocol.io/?search=docs4llm) when `MCP_REGISTRY_GITHUB_TOKEN` is configured in production.

## How it works

1. Paste a docs URL — LangChain, Stripe, your own — in the chat with the
   **docs4llm** toggle on.
2. The pipeline crawls the site (Mintlify, Docusaurus, OpenAPI JSON/YAML,
   GitHub repos, GitBook, plain HTML), preserving code blocks and chunking by
   heading.
3. You get a remote MCP URL + Bearer token. Paste it into Cursor's `mcp.json`
   and reload.
4. Every generated MCP is **auto-published to the official MCP Registry** under
   `io.github.docs4llm/<slug>` and listed in the marketplace.

> **Auth:** Sign in with GitHub OAuth — no passwords, no Google account required.

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://docs4llm.site/api/mcp/<projectId>/mcp",
      "headers": {
        "Authorization": "Bearer <project-token>"
      }
    }
  }
}
```

## CLI

[![npm version](https://img.shields.io/npm/v/docs4llm?color=8b5cf6&label=docs4llm&logo=npm)](https://www.npmjs.com/package/docs4llm)
[![npm downloads](https://img.shields.io/npm/dm/docs4llm?color=8b5cf6&logo=npm)](https://www.npmjs.com/package/docs4llm)

Install the terminal client and run the same conversion pipeline from your shell:

```bash
npm install -g docs4llm   # global install puts `docs4llm` on your PATH
docs4llm login            # browser-based device auth
docs4llm https://docs.example.com
```

> Use `-g`. A local `npm i docs4llm` won't expose the `docs4llm` command — use `npx docs4llm <url>` instead.

The CLI uses browser-based device auth, shares your web account limits, auto-lists
ready MCPs in the marketplace, and can write configs to Cursor, VS Code, Claude
Desktop, and Windsurf.

- 📦 npm: https://www.npmjs.com/package/docs4llm
- 📖 Full command reference: [`cli/README.md`](./cli/README.md) · [docs/cli](https://docs4llm.site/docs/cli)

## MCP tools

| Tool | What it does |
|------|--------------|
| `list_documentation_pages` | Every crawled page |
| `get_documentation_page` | Full markdown of one page |
| `search_documentation` | Heading-aware search |
| `get_documentation_overview` | Summary + index |
| `read_full_documentation` | All pages combined |
| `ask_documentation` | Q&A with citations |

## Stack

Next.js 16 · OpenRouter · Supabase · Upstash Redis + QStash · Streamable HTTP MCP

## Internal development

For team members with repo access:

```bash
git clone https://github.com/garvitsingh006/docs4llm.git
cd docs4llm
pnpm install
cp .env.example .env.local
# fill OPENROUTER_API_KEY, AUTH_SECRET, POSTGRES_URL, Supabase keys, GitHub OAuth
pnpm db:migrate
pnpm dev
```

Open <http://localhost:3000>.

### Environment variables

```env
# Core
AUTH_SECRET=...                 # openssl rand -base64 32
OPENROUTER_API_KEY=...          # https://openrouter.ai/keys
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
POSTGRES_URL=...                # Supabase pooler URI

# GitHub OAuth (login/signup)
# Create at https://github.com/settings/developers → OAuth Apps
# Callback URL: https://<your-project>.supabase.co/auth/v1/callback
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Admin access (comma-separated emails)
ADMIN_EMAILS=you@example.com

# MCP Registry auto-publish (optional — no-op if unset)
MCP_REGISTRY_GITHUB_TOKEN=...   # token for a member of the docs4llm GitHub org

# Optional — improves crawl quality for SPA / sparse docs
TAVILY_API_KEY=
BRAVE_SEARCH_API_KEY=
EXA_API_KEY=
JINA_API_KEY=
FIRECRAWL_API_KEY=
```

> **Never commit secrets.** All keys above belong in `.env.local` (gitignored)
> or your host's environment settings.

## Deploy to Vercel

1. Fork / clone this repo, push to your GitHub.
2. Import the repo at <https://vercel.com/new>.
3. Add the env vars above in **Settings → Environment Variables**.
4. Deploy. docs4llm runs on Vercel Functions out of the box.

Set `NEXT_PUBLIC_APP_URL` to your deployed domain so generated MCP configs
point at the right host. Leave it **unset on Preview** so per-branch preview
URLs resolve correctly for auth.

## Stack

| | |
|---|---|
| Framework | Next.js 16, React 19, Turbopack |
| AI | OpenRouter (`nvidia/nemotron-3-ultra-550b-a55b:free` by default) |
| Database | Supabase Postgres |
| Auth | Supabase Auth (GitHub OAuth) |
| UI | Tailwind v4, shadcn/ui, Framer Motion, Streamdown |
| Lint | Ultracite (Biome) |
| MCP | `@modelcontextprotocol/sdk` + official MCP Registry |

## CI / CD

A single GitHub Actions workflow ([.github/workflows/ci.yml](.github/workflows/ci.yml))
runs on every push and PR:

- TypeScript type-check (`tsc --noEmit --skipLibCheck`)
- Ultracite / Biome lint (`pnpm check`)
- Next.js production build (`pnpm exec next build`)

Branching: feature branches cut from `staging` → PR → `staging` preview for QA
→ `main` → tagged release to production. Preview deploys are created per branch
and support full login.

## Contributing

Contributions are welcome! Whether it's a bug fix, a new source-format adapter,
or docs improvements:

1. Fork the repo and create a branch off `staging`.
2. Run `pnpm check` and `pnpm exec tsc --noEmit` before opening a PR.
3. Open a PR against `staging` with a clear description.

Found a bug or have an idea? [Open an issue](https://github.com/garvitsingh006/docs4llm/issues).

## Security

Never commit secrets — all API keys belong in `.env.local` (gitignored) or your
host's environment settings. If you discover a security issue, please open a
[private security advisory](https://github.com/garvitsingh006/docs4llm/security/advisories/new)
instead of a public issue.

## License

[Apache 2.0](./LICENSE)

---

<div align="center">

**Built for developers shipping AI agents.** If this saved you time, [⭐ star the repo](https://github.com/garvitsingh006/docs4llm).

</div>
