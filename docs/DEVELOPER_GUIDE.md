# Developer & Contributor Guide

This guide covers everything needed to set up, develop, test, and contribute to **Docs4LLM**.

---

## 1. Prerequisites

- **Node.js**: `v20.x` (LTS)
- **Package Manager**: `pnpm` (v10.32.1 pinned in `package.json`)
- **Accounts & API Keys**:
  - [TinyFish](https://tinyfish.ai) (for autonomous web scraping)
  - [OpenRouter](https://openrouter.ai) (for AI analysis and Q&A)
  - [Supabase](https://supabase.com) (PostgreSQL database & Auth)

---

## 2. Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/docs4llm.git
cd docs4llm

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env.local
```

---

## 3. Environment Variables Configuration

Edit `.env.local` with your credentials:

```env
# Application URLs
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="generate-with: openssl rand -base64 32"

# Database & Supabase (Postgres)
POSTGRES_URL="postgres://postgres:password@localhost:5432/docs4llm"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Crawler & AI APIs (Crucial)
TINYFISH_API_KEY="sk-tinyfish-your-key-here"
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-key-here"

# Optional: Background Queues & Caching
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
QSTASH_TOKEN=""
```

---

## 4. Database Setup (Drizzle ORM)

Docs4LLM uses Drizzle ORM on top of Supabase Postgres.

```bash
# Push schema updates directly to development database
pnpm db:push

# Generate migration SQL files
pnpm db:generate
```

---

## 5. Development Commands

| Command | Action |
|---|---|
| `pnpm dev` | Starts Next.js development server on `http://localhost:3000` |
| `pnpm build` | Builds the Next.js production bundle with Turbopack |
| `pnpm start` | Runs the production build locally |
| `pnpm lint` | Runs Biome code checks and Ultracite linter |
| `pnpm format` | Formats all code according to project style guidelines |
| `pnpm test:e2e` | Runs Playwright end-to-end tests |

---

## 6. Developing the Standalone CLI

The `docs4llm` CLI lives in the `cli/` directory as an independent package:

```bash
cd cli
pnpm install
pnpm build

# Test the CLI locally
node dist/index.js add https://docs.stripe.com
```

---

## 7. Project Codebase Architecture

```
docs4llm/
├── app/                  # Next.js App Router (UI routes & API endpoints)
│   ├── api/mcp/          # Dynamic MCP server endpoints (/api/mcp/[id]/mcp)
│   ├── convert/          # URL-to-MCP converter web UI
│   └── projects/         # Project dashboard and inspection pages
├── cli/                  # Standalone npm CLI tool
├── docs/                 # Documentation directory (Architecture, Specs, Guides)
├── lib/                  # Business logic
│   ├── db/               # Drizzle schemas, migrations, and queries
│   └── docs4llm/         # In-memory BM25 indexer, chunking, MCP tools runtime
├── services/             # Core pipeline services
│   ├── ingestion/        # TinyFish Agent scraper, robots.txt, sitemap parsing
│   ├── ai/               # OpenRouter analysis, tool compression, workflows
│   ├── extraction/       # OpenAPI endpoint discovery
│   └── pipeline/         # 5-stage pipeline orchestrator
└── types/                # TypeScript type definitions
```
