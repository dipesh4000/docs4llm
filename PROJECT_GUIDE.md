# doc2mcp — Complete Project Guide

## What Is This?

**doc2mcp** converts any documentation URL into a hosted [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server. You paste a docs link, it crawls the pages, uses AI to understand the API/tools, and generates a working MCP server that Cursor, Claude, Windsurf, or any MCP client can connect to.

**Core pipeline:**
```
URL → Detect source type → Crawl docs → AI analysis (Gemini) → Generate MCP tools → Host at /api/mcp/{id}/mcp
```

**Supported sources:** Mintlify, Docusaurus, GitBook, Nextra, OpenAPI JSON/YAML, Postman collections, GitHub repos, raw .md/.mdx URLs, plain HTML (with Jina Reader fallback).

**MCP tools generated per project:**
- `list_documentation_pages` — enumerate all crawled pages
- `get_documentation_page` — get full markdown of one page
- `search_documentation` — heading-aware BM25 section search
- `get_documentation_overview` — summary + llms.txt index
- `read_full_documentation` — all pages combined
- `ask_documentation` — natural-language Q&A with Gemini + citations
- Plus up to 10 AI-extracted custom tools per API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.6+ (strict mode) |
| Runtime | Node.js 20 |
| Package Manager | pnpm 10.32.1 |
| Framework | Next.js 16 (App Router, Turbopack, React Compiler) |
| Frontend | React 19, Tailwind CSS v4, shadcn/ui, Framer Motion |
| AI / LLM | Google Gemini (`gemini-2.5-flash` default), Anthropic SDK, Vercel AI SDK |
| MCP | `@modelcontextprotocol/sdk`, Streamable HTTP (JSON-RPC 2.0) |
| Database | Supabase Postgres via Drizzle ORM |
| Auth | Supabase Auth (GitHub OAuth), guest sessions |
| Payments | — (billing removed) |
| Caching / Queue | Upstash Redis + QStash (optional — falls back to inline) |
| File Storage | Vercel Blob |
| Observability | OpenTelemetry via `@vercel/otel`, Vercel Analytics |
| Linting | Biome + Ultracite |
| Testing | Playwright (E2E) |
| Deployment | Vercel (serverless, Mumbai region `bom1`) |

---

## Project Structure

```
doc2mcp/
├── app/                    # Next.js 16 App Router
│   ├── (auth)/             # Login / Register pages
│   ├── (chat)/             # AI chat interface
│   ├── (dashboard)/        # User dashboard
│   ├── (marketing)/        # Landing page, pricing, marketplace, blog
│   ├── admin/              # Admin panel (email-restricted)
│   ├── api/                # API routes (convert, MCP endpoints, pipeline worker)
│   ├── convert/            # URL-to-MCP conversion flow
│   ├── docs/               # Documentation pages
│   └── projects/[id]/      # Project detail and analysis views
├── cli/                    # Standalone npm CLI tool (separate package)
├── components/             # React UI components (shadcn/ui based)
├── contents/               # Documentation markdown files
├── features/               # Feature modules (convert UX)
├── hooks/                  # React hooks
├── lib/                    # Core business logic (29 subdirs)
│   ├── db/                 # Drizzle ORM schema, migrations, queries
│   ├── supabase/           # Supabase Auth helpers
│   ├── billing/            # Plans & Razorpay integration
│   ├── doc2mcp/            # Source detection, URL normalization, tools runtime
│   ├── search/             # Web search providers (Tavily, Brave, Exa, Serper)
│   ├── queue/              # QStash background jobs
│   ├── redis/              # Upstash Redis client
│   ├── mcp-registry/       # Auto-publish to MCP Registry
│   └── observability/      # Tracing, logging, caching
├── services/               # Domain services (the pipeline)
│   ├── pipeline/           # Pipeline orchestrator
│   ├── ingestion/          # Crawling, sitemap, robots.txt
│   ├── ai/                 # AI analysis, tool compression
│   ├── extraction/         # OpenAPI endpoint extraction
│   ├── mcp/                # MCP server generation, validation
│   └── generators/         # llms.txt, SDK stubs
├── mcp-registry/           # MCP Registry manifest
├── mcp-server/             # Self-hosted MCP server export
├── tests/                  # Playwright E2E tests
├── types/                  # TypeScript type definitions
└── .github/                # CI/CD workflows
```

---

## What You Need vs Don't Need

### You NEED
| Item | Why |
|---|---|
| Node.js 20 | Pinned in CI, required for Next.js 16 |
| pnpm 10.32.1 | Exact version in `packageManager` field |
| Supabase project | Auth + Postgres database |
| Google Gemini API key | AI analysis is the core of the pipeline |
| `.env.local` with all required vars | App won't start without them |

### You DON'T NEED (can delete/ignore)
| Item | Why |
|---|---|
| `plan.md` | Design artifact ("Neo-Noir Canvas" theme plan), not code |
| `design.md` | Design artifact, not code |
| `gemini-design.json` | Design spec, not referenced by code |
| `cli/` | Separate npm package — only needed if you want the CLI tool |
| `mcp-registry/` | Only needed if publishing to the official MCP Registry |
| `mcp-server/` | Only needed for self-hosted MCP server export |
| `contents/` | Documentation content for the docs site |
| `tests/` | E2E tests — only needed if you're developing/testing |

### Optional (features degrade gracefully)
| Item | What it enables |
|---|---|
| `cli/` directory | Terminal-based `doc2mcp` CLI tool |
| Upstash Redis env vars | Caching + rate limiting (falls back to in-memory) |
| QStash env vars | Async pipeline processing (falls back to inline) |
| Search API keys (Tavily, Brave, etc.) | Enriching sparse documentation pages |
| Razorpay env vars | Payment/billing features |
| `MCP_REGISTRY_GITHUB_TOKEN` | Auto-publishing to MCP Registry |

---

## Environment Variables

### Required (app won't work without these)

```env
AUTH_SECRET="generate-with: openssl rand -base64 32"
POSTGRES_URL="postgres://user:pass@host:5432/db"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
GEMINI_API_KEY="your-gemini-api-key"              # https://aistudio.google.com/apikey
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# GitHub OAuth — create at https://github.com/settings/developers -> OAuth Apps
# Callback URL: https://<your-project>.supabase.co/auth/v1/callback
# Then enable GitHub provider in Supabase Dashboard -> Authentication -> Providers
GITHUB_CLIENT_ID="your-github-oauth-app-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-app-client-secret"
```

### Optional — AI Model Overrides

```env
GEMINI_MODEL="gemini-2.5-flash"                    # default: gemini-2.5-flash-lite
GEMINI_IMAGE_MODEL="gemini-3-pro-image-preview"    # default: gemini-3-pro-image-preview
```

### Optional — Admin Access

```env
ADMIN_EMAILS="you@example.com,other@example.com"   # comma-separated, defaults to doc2mcp@gmail.com if unset!
```

### Optional — Upstash (Caching / Queue)

```env
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
QSTASH_TOKEN=""
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""
```

### Optional — Search Providers (enrich sparse docs)

```env
TAVILY_API_KEY=""
BRAVE_SEARCH_API_KEY=""
EXA_API_KEY=""
SERPER_API_KEY=""
```

### Optional — Crawling

```env
JINA_API_KEY=""                    # Jina Reader fallback for SPA sites (free tier works without key)
GITHUB_TOKEN=""                    # GitHub repo crawling (also reads GH_TOKEN)
FIRECRAWL_API_KEY=""               # Firecrawl integration
```

### Optional — Payments

Billing has been removed from this fork. No payment env vars are needed.

### Optional — MCP Registry Publishing

```env
MCP_REGISTRY_GITHUB_TOKEN=""       # GitHub token for auto-publishing
MCP_REGISTRY_AUTOPUBLISH="true"    # set "false" to disable
MCP_REGISTRY_NAMESPACE=""          # e.g. "io.github.doc2mcp"
MCP_REGISTRY_BASE_URL=""           # default: https://registry.modelcontextprotocol.io
MCP_REGISTRY_SOURCE_REPO=""        # source repo URL for registry manifest
```

### Optional — Misc

```env
RESEND_API_KEY=""                  # Contact form email delivery
LOG_LEVEL="info"                   # Logger verbosity (debug/info/warn/error)
IS_DEMO="0"                       # Demo mode toggle (activates /demo base path)
SKIP_MIGRATE="0"                   # Set "1" to skip DB migrations on build
SUPABASE_POOLER_HOST=""            # Override hardcoded Mumbai pooler host
```

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/garvitsingh006/doc2mcp.git
cd doc2mcp
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — fill in at minimum:
#   AUTH_SECRET, POSTGRES_URL, NEXT_PUBLIC_SUPABASE_URL,
#   NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY

# 3. Run database migrations
pnpm db:migrate

# 4. Start dev server
pnpm dev
```

### CLI Setup (separate)

```bash
cd cli
pnpm install
pnpm build
npm link          # makes 'doc2mcp' available globally
doc2mcp login     # browser-based device auth
doc2mcp https://docs.example.com
```

---

## Available Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Run DB migrations + production build |
| `pnpm start` | Start production server |
| `pnpm db:migrate` | Run pending database migrations |
| `pnpm db:generate` | Generate new migration SQL files |
| `pnpm db:studio` | Open Drizzle Studio (DB GUI) |
| `pnpm db:push` | Push schema changes directly to DB |
| `pnpm db:pull` | Pull existing DB schema into code |
| `pnpm check` | Lint with Biome + Ultracite |
| `pnpm fix` | Auto-fix lint/format issues |
| `pnpm test` | Run Playwright E2E tests (bash only) |

---

## What Will Go Wrong (Gotchas & Troubleshooting)

### 1. `SKIP_MIGRATE="1"` ships in `.env.example`

The example file ships with `SKIP_MIGRATE="1"`. If you copy it verbatim and run `pnpm build`, **migrations will NOT run** and you'll have a blank database. Either change it to `"0"` or run `pnpm db:migrate` manually first.

### 2. Hardcoded Supabase Mumbai Pooler Region

`lib/db/postgres-url.ts` defaults the pooler host to `aws-1-ap-south-1.pooler.supabase.com` (Mumbai). If your Supabase project is in a different region, set `SUPABASE_POOLER_HOST` explicitly or your connection will fail.

### 3. Default Admin Email

If `ADMIN_EMAILS` is not set, `proxy.ts` defaults to `doc2mcp@gmail.com` — that email gets admin access out of the box. Set `ADMIN_EMAILS` to your own email.

### 4. GitHub OAuth Setup

Login uses GitHub OAuth via Supabase. After creating a GitHub OAuth App:
1. Set the callback URL to `https://<your-project>.supabase.co/auth/v1/callback`
2. Enable GitHub provider in Supabase Dashboard → Authentication → Providers
3. Paste `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` into `.env.local`

### 4. Node Version Mismatch

- CI builds with Node 20
- Production deploy workflow uses Node 22
- No `.nvmrc` or `.node-version` file exists

Use Node 20 locally to match CI. Production may behave slightly differently.

### 5. Test Script Fails on Windows

The test script uses `export PLAYWRIGHT=True && pnpm exec playwright test` — `export` is bash syntax. On Windows CMD/PowerShell, use Git Bash, WSL, or run:
```bash
set PLAYWRIGHT=True && pnpm exec playwright test
```

### 6. No Docker Support

There are no Dockerfiles or docker-compose files. The project is designed for Vercel. Self-hosting requires you to containerize it yourself.

### 7. QStash Required for Async Pipeline (Production)

Without QStash env vars, the conversion pipeline runs inline in the API request. Large docs can hit Vercel's 60-second lambda timeout. In dev, it falls back to Next.js `after()`.

### 8. Migration Skips on Vercel

`lib/db/migrate.ts` exits with code 0 when `VERCEL === "1"` because Vercel builds can't reach Supabase direct connections. You must run migrations locally via `pnpm db:migrate` before deploying.

### 9. pnpm Overrides May Cause Breakage

`package.json` has 6 pnpm overrides forcing specific versions of transitive dependencies (`kysely`, `lodash-es`, `hono`, `form-data`, `undici`, `linkify-it`). If you add packages that depend on different versions of these, things may break.

### 10. Pyodide CDN Pinned to Old Version

`artifacts/code/client.tsx` loads Pyodide from a CDN pinned to v0.23.4 (current is 0.25+). This is a minor issue but could cause compatibility problems with newer Python packages.

### 11. Biome Ignores Large Parts of the Codebase

`cli/`, `components/ui/`, `components/ai-elements/`, `components/elements/`, and `lib/utils.ts` are excluded from linting entirely. Many lint rules are also globally disabled (`noExplicitAny`, `noConsole`, `noMagicNumbers`, etc.).

### 12. 9+ Env Vars Used in Code but Not in `.env.example`

The search providers (`TAVILY_API_KEY`, `BRAVE_SEARCH_API_KEY`, `EXA_API_KEY`, `SERPER_API_KEY`), crawling (`JINA_API_KEY`, `GITHUB_TOKEN`, `FIRECRAWL_API_KEY`), payments (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`), registry publishing (`MCP_REGISTRY_GITHUB_TOKEN`, etc.), and misc (`LOG_LEVEL`, `IS_DEMO`, `SUPABASE_POOLER_HOST`) are all used in code but not documented in `.env.example`. See the full list above.

---

## Database

**Type:** PostgreSQL via Supabase Postgres (session pooler, port 6543)

**ORM:** Drizzle ORM — schema at `lib/db/schema.ts`, migrations at `lib/db/migrations/`

**13 migrations** covering 20+ tables including:
- `User`, `Chat`, `Message`, `Vote` — chat system
- `PlatformProject` — core entity with status pipeline: `pending` → `crawling` → `analyzing` → `generating` → `ready`/`error`
- `Page` — crawled documentation content
- `McpServer`, `McpServerRelease` — marketplace listings
- `Subscription`, `CreditWallet`, `CreditLedger` — billing (removed in migration `0013_remove_billing`)
- `PipelineJob`, `ProjectEvent` — background processing + audit log
- `Team`, `TeamMember`, `TeamInvite` — team collaboration
- `CliAuthRequest`, `CliToken` — CLI device auth
- `McpAccessToken`, `McpHit` — access control + usage analytics

---

## API Routes

| Route | Purpose |
|---|---|
| `POST /api/convert` | Main conversion endpoint — accepts docs URL, kicks off pipeline |
| `POST /api/mcp/[projectId]/mcp` | MCP JSON-RPC endpoint (initialize, tools/list, tools/call) |
| `GET /api/mcp/[projectId]/search` | REST search endpoint |
| `POST /api/mcp/[projectId]/ask` | Q&A with streaming SSE |
| `GET /api/mcp/[projectId]/pages` | List crawled pages |
| `GET /api/mcp/[projectId]/full` | Full documentation markdown |
| `GET /api/mcp/[projectId]/overview` | Overview + llms.txt |
| `POST /api/internal/pipeline-worker` | QStash webhook for background pipeline |
| `POST /api/chat/` | AI chatbot streaming endpoint |
| `POST /api/cli/` | CLI device auth flow |

---

## Branching & Deployment

- **Branching:** `feature/*` → `staging` (QA) → `main` (tag-gated production)
- **Production deploys** only happen on `v*` tags — pushing to `main` does NOT auto-deploy
- **Preview deployments** need Supabase env vars scoped to Preview in Vercel dashboard
- **Region:** Mumbai (`bom1`) — change in `vercel.json` for other geographies

---

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push/PR | Typecheck, Biome lint, Trivy vuln scan, Gitleaks secret scan, build |
| `deploy-staging.yml` | Push to staging | Deploy to staging |
| `deploy-production.yml` | `v*` tag push | Deploy to production |
| `publish-cli.yml` | Manual | Publish CLI to npm |
| `pr.yml` | PR events | PR automation |
