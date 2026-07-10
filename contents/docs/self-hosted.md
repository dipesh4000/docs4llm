---
title: Self hosted
description: Run doc2mcp on your own infrastructure for full data control.
category: Deployment
order: 2
---

## Overview

doc2mcp is a Next.js application backed by Postgres (Supabase). For strict
data-residency or air-gapped requirements, you can run it yourself.

> **Tip** Most teams should use the [hosted version](/docs/deployment-hosted).
> Self-hosting means you operate the crawler, database, and endpoints.

## Prerequisites

- Node.js + pnpm
- A Postgres database (Supabase or any Postgres)
- An AI provider key for analysis and `ask_documentation`

## Step-by-step

1. Clone and install:

```bash
git clone https://github.com/doc2mcp/doc2mcp.git
cd doc2mcp
pnpm install
```

2. Configure environment variables:

```bash
NEXT_PUBLIC_APP_URL="https://docs.your-domain.com"
POSTGRES_URL="postgres://user:pass@host:5432/db"
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
AUTH_SECRET="<random-secret>"
GEMINI_API_KEY="<google-gemini-api-key>"
```

3. Run migrations and start:

```bash
pnpm db:migrate
pnpm build && pnpm start
```

> **Warning** Set `NEXT_PUBLIC_APP_URL` to your real public URL. Generated MCP
> configs use it for the endpoint — a localhost value would ship to clients.

## Cloud deployment

Deploy like any Next.js app (e.g. Vercel) with the same environment variables.
Point `NEXT_PUBLIC_APP_URL` at your production domain.

## Best practices

- Keep `AUTH_SECRET` and service-role keys in a secrets manager.
- Restrict database network access to the app.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| MCP URL shows localhost | Set `NEXT_PUBLIC_APP_URL` and rebuild |
| Auth failures | Regenerate `AUTH_SECRET`; clear stale sessions |
| Empty crawls | Ensure the host can reach target docs sites |
