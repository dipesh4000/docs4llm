# Contributing to doc2mcp

Thanks for your interest in contributing! doc2mcp turns documentation into
MCP infrastructure for AI agents. This guide covers local setup, the preview
deployment workflow, and our PR conventions.

## Getting started

```bash
git clone https://github.com/doc2mcp/doc2mcp.git
cd doc2mcp
pnpm install
cp .env.example .env.local   # then fill in values (see below)
pnpm dev
```

Requirements: Node 20, pnpm 10, and a Supabase project + Postgres database.

## Project checks

Run these before opening a PR — CI runs the same commands:

```bash
pnpm check                              # Biome + Ultracite (format + lint)
pnpm fix                                # auto-fix formatting/lint issues
pnpm exec tsc --noEmit --skipLibCheck   # type-check
pnpm exec next build                    # production build
```

## Working with Vercel preview deployments

Every PR gets a unique Vercel **preview URL** (for example
`doc2mcp-git-<branch>-<team>.vercel.app`). Two things must be configured so
**login works on preview deployments**, not just production:

### 1. Scope environment variables to Preview

In the Vercel dashboard, the Supabase variables must be enabled for the
**Preview** (and Development) environments, not only Production:

- `POSTGRES_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

If `POSTGRES_URL` is missing on preview, database-backed routes such as
`/api/history`, `/api/chat`, `/dashboard`, and conversion project reads fail.
If Supabase public vars are missing, the app throws `Missing environment
variable` and auth breaks.

Leave `NEXT_PUBLIC_APP_URL` **unset** for the Preview environment. The app
then resolves the live request host (or `VERCEL_URL`) at runtime, so auth
emails point back to the preview deployment instead of production. See
`lib/auth/redirect-url.ts`.

### 2. Allow-list preview URLs in Supabase Auth

Supabase only redirects confirmation / magic links to URLs on its allow-list.
In **Supabase → Authentication → URL Configuration → Redirect URLs**, add a
wildcard that matches your preview deployments:

```
https://doc2mcp-*-<your-team>.vercel.app/**
https://*.vercel.app/**          # broader, optional
http://localhost:3000/**
```

Keep the production domain as the **Site URL**. With the wildcard in place,
signing up or logging in on any preview URL completes on that same preview
deployment.

## Branching

Cut feature branches from **`staging`** (the integration branch), not `main`:

```bash
git switch staging
git pull
git switch -c feature/my-change
```

Open your PR into `staging`. Each push gets its own preview URL; QA runs on
the stable `staging` URL after merge. Production ships from `main` only when a
`vX.Y.Z` tag is pushed. The full model and one-time setup live in
[RELEASING.md](./RELEASING.md).

### Protected branches

**`main` and `staging` do not accept direct pushes** (including from admins).
Changes must land via a merged pull request after CI passes:

- TypeScript
- Biome + Ultracite
- Next build (no migrate)

Workflow:

```bash
git switch staging
git pull
git switch -c feature/my-change
# ... commit on feature branch ...
git push -u origin feature/my-change
# open PR → staging (not direct push to staging/main)
```

Bypassing branch protection requires changing GitHub settings — do not do
this for routine work.

## License and source use

The repository is **public for transparency**, but the code is **proprietary**
(see [LICENSE](./LICENSE)). Do not copy, fork for redistribution, or reuse
substantial portions without written permission. Hosted functionality depends on
server-side secrets (Vercel env) that are not in the repo.

## Automated AI code review

Every non-draft PR targeting `staging` or `main` triggers
[`.github/workflows/pr-ai-review.yml`](./.github/workflows/pr-ai-review.yml):

1. CI runs semantic title + `pnpm check` (existing [PR workflow](./.github/workflows/pr.yml))
2. **Gemini 2.5 Flash** reviews the PR with:
   - Local secret-pattern pre-scan on the diff
   - Priority-ordered diff (`app/api`, `lib/`, `services/` first)
   - Structured verdict (`approve` / `request_changes` / `comment`)
   - Findings table with file:line, merge recommendation, and PR review event

**One-time setup** (repo maintainer): add GitHub Actions secret `GEMINI_API_KEY`
(same key as production Gemini). Without it, the workflow skips quietly.

For a deeper local review in Cursor, use the project skill
`.cursor/skills/doc2mcp-pr-review` (Bugbot + Security subagents).

## Pull request conventions

- **Title** must follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`, `build:`, `ci:`,
  `chore:`, `style:`, `revert:`. The PR title becomes the squash-merge commit.
- Fill out the PR template checklist.
- Keep PRs focused and reasonably small.
- Never commit secrets or `.env*` files with real values.
- Wait for **CI** and the **AI review comment** before merging when possible.

## Code style

We use [Biome](https://biomejs.dev/) via Ultracite. Run `pnpm fix` before
committing. The CI `Biome + Ultracite` job is the source of truth.

## Reporting bugs / requesting features

Use the issue templates. For security issues, see [SECURITY.md](./SECURITY.md)
— please do **not** open a public issue.
